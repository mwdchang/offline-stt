import type { Component } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';
import {
	type Operation,
	type OperationData,
	type Workflow,
	type WorkflowNode,
	type WorkflowPort,
	type WorkflowOutput,
    WorkflowPortStatus,
    OperatorStatus,
    type WorkflowEdge,
} from '@/types/workflow';
import dagre from 'dagre';
import type { Position } from '@/types/common';

/**
 * A wrapper class around the workflow data struture to make it easier
 * to deal with CURD operations
 * */
export class WorkflowWrapper {
	private wf: Workflow;

	constructor(wf?: Workflow) {
		if (wf) {
			this.wf = _.cloneDeep(wf);
		} else {
			this.wf = emptyWorkflow();
		}
	}

	// This will replace the entire workflow, should only use for initial load
	// as there it will not propapate reactivity
	load(wf: Workflow) {
		this.wf = _.cloneDeep(wf);
	}

	dump() {
		return this.wf;
	}

	getId() {
		return this.wf.id;
	}

	getName() {
		return this.wf.name;
	}

	getTransform() {
		return this.wf.transform;
	}

	getNodes() {
		return this.wf.nodes.filter((d) => d.isDeleted !== true);
	}

	getEdges() {
		return this.wf.edges.filter((d) => d.isDeleted !== true);
	}

	getAnnotations() {
		if (this.wf.annotations) {
			return Object.values(this.wf.annotations);
		}
		return [];
	}

	updateNodeState(nodeId: string, state: any) {
		const node = this.getNodes().find((d) => d.id === nodeId);
		if (!node) return;
		node.state = state;
	}

	// Get neighbor nodes for drilldown navigation
	getNeighborNodes = (id: string) => {
		const cache = new Map(this.getNodes().map((node) => [node.id, node]));
		const inputEdges = this.getEdges().filter((e) => e.target === id);
		const outputEdges = this.getEdges().filter((e) => e.source === id);
		return {
			upstreamNodes: inputEdges.map((e) => e.source && cache.get(e.source)).filter(Boolean) as WorkflowNode<any>[],
			downstreamNodes: outputEdges.map((e) => e.target && cache.get(e.target)).filter(Boolean) as WorkflowNode<any>[]
		};
	};

	runDagreLayout() {
		const g = new dagre.graphlib.Graph({ compound: true });
		g.setGraph({});
		g.setDefaultEdgeLabel(() => ({}));
		g.graph().rankdir = 'LR';
		g.graph().nodesep = 120;
		g.graph().ranksep = 120;
		this.getNodes().forEach((node) => {
			g.setNode(node.id, {
				label: node.displayName,
				width: node.width,
				height: node.height
			});
		});

		this.getEdges().forEach((edge) => {
			g.setEdge(edge.source, edge.target);
		});

		dagre.layout(g);

		this.getNodes().forEach((node) => {
			const n = g.node(node.id);
			if (!n) return;
			node.x = n.x;
			node.y = n.y;
		});
	}

	setWorkflowName(name: string) {
		this.wf.name = name;
	}

	setWorkflowScenario(scenario: any) {
		this.wf.scenario = scenario;
	}

	addNode(op: Operation, pos: Position, options: { size?: OperatorNodeSize; state?: any }) {
		const nodeSize = { width: 200, height: 150 };

		const node: WorkflowNode<any> = {
			id: uuidv4(),
			workflowId: this.wf.id,
			operationType: op.name,
			displayName: op.displayName,
			documentationUrl: op.documentationUrl,
			imageUrl: op.imageUrl,
			x: pos.x,
			y: pos.y,

			createdBy: 'dummy',
			createdAt: Date.now(),

			active: null,
			state: options.state ?? {},
			uniqueInputs: op.uniqueInputs ?? false,

			inputs: op.inputs.map((port) => ({
				id: uuidv4(),
				type: port.type,
				label: port.label,
				status: WorkflowPortStatus.NOT_CONNECTED,
				value: null,
				isOptional: port.isOptional ?? false
			})),

			outputs: op.outputs.map((port) => ({
				id: uuidv4(),
				type: port.type,
				label: port.label,
				status: WorkflowPortStatus.NOT_CONNECTED,
				value: null,
				isOptional: false,
				state: {}
			})),
			status: OperatorStatus.DEFAULT,
			width: nodeSize.width,
			height: nodeSize.height
		};
		if (op.initState && _.isEmpty(node.state)) {
			node.state = op.initState();
		}
		this.wf.nodes.push(node);
		return node;
	}


	addEdge(sourceId: string, sourcePortId: string, targetId: string, targetPortId: string, points: Position[]) {
		const sourceNode = this.wf.nodes.find((d) => d.id === sourceId);
		const targetNode = this.wf.nodes.find((d) => d.id === targetId);
		if (!sourceNode || !targetNode) return;

		const sourceOutputPort = sourceNode.outputs.find((d) => d.id === sourcePortId);
		const targetInputPort = targetNode.inputs.find((d) => d.id === targetPortId);
		if (!sourceOutputPort || !targetInputPort) return;

		// Check if edge already exist
		const existingEdge = this.getEdges().find(
			(d) =>
				d.source === sourceId &&
				d.sourcePortId === sourcePortId &&
				d.target === targetId &&
				d.targetPortId === targetPortId
		);
		if (existingEdge) return;

		// Check if type is compatible
		const outputTypes = sourceOutputPort.type.split('|').map((d) => d.trim());
		const allowedInputTypes = targetInputPort.type.split('|').map((d) => d.trim());
		const intersectionTypes = _.intersection(outputTypes, allowedInputTypes);

		// Not supported if there are more than one match
		if (intersectionTypes.length > 1) {
			console.error(`Ambiguous matching types [${outputTypes}] to [${allowedInputTypes}]`);
			return;
		}

		// Not supported if there is a mismatch
		if (intersectionTypes.length === 0 || targetInputPort.status === WorkflowPortStatus.CONNECTED) {
			return;
		}

		// check if the port value is unique, if so, we should not connect the incoming edge
		if (
			targetNode.inputs.some(
				(input) => targetNode.uniqueInputs && input.value?.[0] && input.value?.[0] === sourceOutputPort.value?.[0]
			)
		) {
			return;
		}

		// Transfer data value/reference
		targetInputPort.label = sourceOutputPort.label;
		if (outputTypes.length > 1) {
			const concreteType = intersectionTypes[0];
			if (sourceOutputPort.value) {
				targetInputPort.value = [sourceOutputPort.value[0][concreteType!]];
			}
		} else {
			targetInputPort.value = sourceOutputPort.value;
		}

		// Transfer concrete type to the input type to match the output type
		// Saves the original type in case we want to revert when we unlink the edge
		if (allowedInputTypes.length > 1) {
			targetInputPort.originalType = targetInputPort.type;
			targetInputPort.type = sourceOutputPort.type;
		}

		const edge: WorkflowEdge = {
			id: uuidv4(),
			workflowId: this.wf.id,
			source: sourceId,
			sourcePortId,
			target: targetId,
			targetPortId,
			createdBy: 'dummy',
			createdAt: Date.now(),
			points: _.cloneDeep(points)
		};
		this.wf.edges.push(edge);
		sourceOutputPort.status = WorkflowPortStatus.CONNECTED;
		targetInputPort.status = WorkflowPortStatus.CONNECTED;
	}
}

/**
 * Captures common actions performed on workflow nodes/edges. The functions here are
 * not optimized, on the account that we don't expect most workflow graphs to
 * exceed say ... 10-12 nodes with 30-40 edges.
 *
 */
export const emptyWorkflow = (name: string = 'test', description: string = '') => {
	const workflow: Workflow = {
		id: uuidv4(),
		name,
		description,

		transform: { x: 0, y: 0, k: 1 },
		nodes: [],
		edges: []
	};
	return workflow;
};

export enum OperatorNodeSize {
	small,
	medium,
	large,
	xlarge
}

// Get port label for frontend
const defaultPortLabels: Record<string, string> = {
	modelId: 'Model',
	modelConfigId: 'Model configuration',
	datasetId: 'Dataset',
	simulationId: 'Simulation',
	codeAssetId: 'Code asset'
};

export function getPortLabel({ label, type, isOptional }: WorkflowPort) {
	let portLabel = type; // Initialize to port type (fallback)

	// Assign to name of port value
	if (label) portLabel = label;
	// Assign to default label using port type
	else if (defaultPortLabels[type]) {
		portLabel = defaultPortLabels[type];
	}
	// Create name if there are multiple types
	else if (type.includes('|')) {
		const types = type.split('|').map((d) => d.trim());
		portLabel = types.map((t) => defaultPortLabels[t] ?? t).join(' or ');
	}

	if (isOptional) portLabel = portLabel.concat(' (optional)');

	return portLabel;
}

export function getOutputLabel(outputs: WorkflowOutput<any>[], id: string) {
	const selectedOutput = outputs.find((output) => output.id === id);
	if (!selectedOutput) return '';

	// multiple output types, choose first name to use as label arbitrarily
	if (selectedOutput.type.includes('|')) {
		return selectedOutput.label;
	}

	// default use single output type
	return selectedOutput.label;
}


/// /////////////////////////////////////////////////////////////////////////////
// Workflow component registry, this is used to
// dynamically determine which component should be rendered
/// /////////////////////////////////////////////////////////////////////////////
export interface OperatorImport {
	name: string;
	operation: Operation;
	node: Component;
	drilldown: Component;
}
export class WorkflowRegistry {
	operationMap: Map<string, Operation>;

	nodeMap: Map<string, Component>;

	drilldownMap: Map<string, Component>;

	constructor() {
		this.operationMap = new Map();
		this.nodeMap = new Map();
		this.drilldownMap = new Map();
	}

	set(name: string, operation: Operation, node: Component, drilldown: Component) {
		this.operationMap.set(name, operation);
		this.nodeMap.set(name, node);
		this.drilldownMap.set(name, drilldown);
	}

	// shortcut
	registerOp(op: OperatorImport) {
		this.set(op.name, op.operation, op.node, op.drilldown);
	}

	getOperation(name: string) {
		return this.operationMap.get(name);
	}

	getNode(name: string) {
		return this.nodeMap.get(name);
	}

	getDrilldown(name: string) {
		return this.drilldownMap.get(name);
	}

	remove(name: string) {
		this.nodeMap.delete(name);
		this.drilldownMap.delete(name);
	}

}


///
// Operator
///

/**
 * Update the output of a node referenced by the output id
 * @param node
 * @param updatedOutput
 */
export function updateOutput(node: WorkflowNode<any>, updatedOutput: WorkflowOutput<any>) {
	const foundOutput = node.outputs.find((output) => output.id === updatedOutput.id);
	if (foundOutput) {
		Object.assign(foundOutput, updatedOutput);
	}
}

export interface OperatorMenuItem {
	type: string;
	displayName: string;
}

function assetToOperation(operationMap: Map<string, Operation>) {
	const result = new Map<string, OperatorMenuItem[]>();
	operationMap.forEach((operation, key) => {
		const inputList: Array<OperationData> = operation.inputs ?? [];
		inputList.forEach((input) => {
			input.type.split('|').forEach((subType) => {
				if (!result.has(subType)) {
					result.set(subType, []);
				}
				result.get(subType)?.push({
					type: key,
					displayName: operation.displayName
				});
			});
		});
	});
	return result;
}

function operationToAsset(operationMap: Map<string, Operation>) {
	const result = new Map<string, string[]>();

	operationMap.forEach((operation, key) => {
		result.set(key, []);

		const outputList: OperationData[] = operation.outputs ?? [];
		outputList.forEach((output) => {
			output.type.split('|').forEach((subType) => {
				result.get(key)?.push(subType);
			});
		});
	});
	return result;
}

/* We want to get mapping of { operation => [operation] } */
export function getNodeMenu(operationMap: Map<string, Operation>) {
	const menuOptions = new Map<string, OperatorMenuItem[]>();

	const inputMap = assetToOperation(operationMap);
	const outputMap = operationToAsset(operationMap);

	// Going from
	//   outputMap(Operator => assetId[]) => inputMap(assetId => Operator[]) ;
	//
	// For example
	//   Calibrate => [datasetId, modelConfig] => [Validate, Simulate, DataTransform...]
	outputMap.forEach((assetTypes, operationKey) => {
		const check = new Set<String>();
		const menuItems: OperatorMenuItem[] = [];

		assetTypes.forEach((assetType) => {
			const availableInputOperations = inputMap.get(assetType) ?? [];

			availableInputOperations.forEach((item) => {
				if (!check.has(item.type)) {
					check.add(item.type);
					menuItems.push(item);
				}
			});
		});
		menuOptions.set(operationKey, menuItems);
	});

	return menuOptions;
}

