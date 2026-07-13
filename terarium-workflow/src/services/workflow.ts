import type { Component } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';
import {
	type Operation,
	type Workflow,
	type WorkflowNode,
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

  get() {
    return this.wf;
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
		return this.wf.nodes;
	}

	getEdges() {
		return this.wf.edges;
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
			g.setEdge(edge.source!, edge.target!);
		});

		dagre.layout(g);

		this.getNodes().forEach((node) => {
			const n = g.node(node.id);
			if (!n) return;
			node.x = n.x;
			node.y = n.y;
		});
	}

	addNode(op: Operation, pos: Position, options: { size?: OperatorNodeSize; state?: any }) {
		const nodeSize = { width: 200, height: 150 };

		const node: WorkflowNode<any> = {
			id: uuidv4(),
			workflowId: this.wf.id,
			operationType: op.name,
			displayName: op.displayName,
			documentationUrl: op.documentationUrl,
			x: pos.x,
			y: pos.y,

			active: null,
			state: options.state ?? {},

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

		const edge: WorkflowEdge = {
			id: uuidv4(),
			workflowId: this.wf.id,
			source: sourceId,
			sourcePortId,
			target: targetId,
			targetPortId,
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

export interface OperatorMenuItem {
	type: string;
	displayName: string;
}
