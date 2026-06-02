<template>
	<!-- add 'debug-mode' to debug this -->
	<tera-infinite-canvas
		ref="canvasRef"
		@click="onCanvasClick()"
		@contextmenu="toggleContextMenu"
		@save-transform="saveTransform"
		@focus="() => {}"
		@blur="() => {}"
		@dragover.prevent
		@dragenter.prevent
		:lastTransform="canvasTransform"
	>
		<!-- toolbar -->
		<template #foreground>
		</template>

		<!-- data -->
		<template #data>
			<tera-canvas-item
				v-for="node in wf.getNodes()"
				:key="node.id"
				:style="{
					width: `${node.width}px`,
					top: `${node.y}px`,
					left: `${node.x}px`
				}"
				@dragging="(event) => updatePosition(node, event)"
				@dragend="isDragging = false"
			>
				<tera-operator
					ref="teraOperatorRefs"
					:node="node"
					:nodeMenu="outputPortMenu"
					@resize="resizeHandler"
					@port-mouseover="onPortMouseover"
					@port-mouseleave="onPortMouseleave"
				>
					<template #body>
						<component
							:is="registry.getNode(node.operationType)"
							:node="node"
              @append-output="(_port: any, _newState: any) => {}"
              @append-input-port="(_event: any) => {}"
              @update-state="(_event: any) => {}"
							@open-drilldown="addOperatorToRoute(node.id)"
						/>
					</template>
				</tera-operator>
			</tera-canvas-item>
		</template>
		<!-- background -->
		<template #backgroundDefs>
			<marker id="circle" markerWidth="8" markerHeight="8" refX="5" refY="5">
				<circle cx="5" cy="5" r="3" style="fill: var(--text-color-secondary)" />
			</marker>
			<marker
				id="arrow"
				viewBox="0 0 16 16"
				refX="8"
				refY="8"
				orient="auto"
				markerWidth="16"
				markerHeight="16"
				markerUnits="userSpaceOnUse"
				xoverflow="visible"
			>
				<path d="M 0 0 L 8 8 L 0 16 z" style="fill: var(--text-color-secondary); fill-opacity: 1"></path>
			</marker>
			<marker
				id="smallArrow"
				viewBox="0 0 16 16"
				refX="8"
				refY="8"
				orient="auto"
				markerWidth="12"
				markerHeight="12"
				markerUnits="userSpaceOnUse"
				xoverflow="visible"
			>
				<path d="M 0 0 L 8 8 L 0 16 z" style="fill: var(--text-color-secondary)"></path>
			</marker>
		</template>
		<template #background>
			<path
				v-if="newEdge?.points"
				:d="drawPath(interpolatePointsForCurve(newEdge.points[0]!, newEdge.points[1]!))"
				stroke="#667085"
				stroke-width="2"
				marker-start="url(#circle)"
				marker-end="url(#arrow)"
				fill="none"
			/>
			<path
				v-for="edge of wf.getEdges()"
				:key="edge.id"
				:d="drawPath(interpolatePointsForCurve(edge.points[0]!, edge.points[1]!))"
				stroke="#667085"
				stroke-width="2"
				marker-start="url(#circle)"
				fill="none"
			/>
		</template>
	</tera-infinite-canvas>

	<Teleport to="body">
		<component
			v-if="dialogIsOpened && currentActiveNode"
			:downstream-operators-nav="downstreamOperatorsNav"
			:is="registry.getDrilldown(currentActiveNode.operationType)"
			:node="currentActiveNode"
			:spawn-animation="drilldownSpawnAnimation"
			:upstream-operators-nav="upstreamOperatorsNav"
			@close="addOperatorToRoute(null)"
		/>
	</Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import TeraInfiniteCanvas from '@/components/widgets/tera-infinite-canvas.vue';
import TeraCanvasItem from '@/components/widgets/tera-canvas-item.vue';
import type { Position } from '@/types/common';
import type { Workflow, WorkflowEdge, WorkflowNode, } from '@/types/workflow';
import { WorkflowDirection, OperatorStatus, } from '@/types/workflow';

// Operation imports
import TeraOperator from '@/components/operator/tera-operator.vue';
import * as workflowService from '@/services/workflow';
import * as d3 from 'd3';

// import ContextMenu from 'primevue/contextmenu';
// import type { OperatorImport } from '@/services/workflow';
// import { OperatorNodeSize } from '@/services/workflow';

import type { MenuItem } from 'primevue/menuitem';
import { useRouter, useRoute } from 'vue-router';

import * as DummyOp from './ops/dummy/mod';
import * as Dummy2Op from './ops/dummy2/mod';

const registry = new workflowService.WorkflowRegistry();
registry.registerOp(DummyOp);
registry.registerOp(Dummy2Op);

// Will probably be used later to save the workflow in the project
const props = defineProps<{
	assetId: string;
}>();

const outputPortMenu = ref(workflowService.getNodeMenu(registry.operationMap));
const upstreamOperatorsNav = ref<MenuItem[]>([]);
const downstreamOperatorsNav = ref<MenuItem[]>([]);
const drilldownSpawnAnimation = ref<'left' | 'right' | 'scale'>('scale');

const route = useRoute();
const router = useRouter();

const newNodePosition = { x: 0, y: 0 };
let canvasTransform = { x: 0, y: 0, k: 1 };
let currentPortPosition: Position = { x: 0, y: 0 };
let isMouseOverPort: boolean = false;
let isDragging = false;

const currentActiveNode = ref<WorkflowNode<any> | null>(null);
const newEdge = ref<WorkflowEdge | undefined>();
const dialogIsOpened = ref(false);

const wf = ref<workflowService.WorkflowWrapper>(new workflowService.WorkflowWrapper());
const contextMenu = ref();

const currentProjectId = ref<string | null>(null);

const teraOperatorRefs = ref();
const canvasRef = ref();

const nodePositionSet: Set<string> = new Set();
const edgePositionSet: Set<string> = new Set();


// Route is mutated then watcher is triggered to open or close the drilldown
function addOperatorToRoute(
	nodeId: string | null,
	animation: 'left' | 'right' | 'scale' = 'scale' // drilldownSpawnAnimation is set here, left/right animations are for drilldown navigation
) {
	drilldownSpawnAnimation.value = animation;
	if (nodeId !== null) {
		router.push({ query: { operator: nodeId } });
	} else {
		router.push({ query: {} });
	}
}


function toggleContextMenu(event: MouseEvent) {
	contextMenu.value.show(event);
	updateNewNodePosition(event);
}

function updateNewNodePosition(event: MouseEvent) {
	newNodePosition.x = (event.offsetX - canvasTransform.x) / canvasTransform.k;
	newNodePosition.y = (event.offsetY - canvasTransform.y) / canvasTransform.k;
}

function saveTransform(newTransform: { k: number; x: number; y: number }) {
	canvasTransform = newTransform;

	const t = wf.value.getTransform();
	t.x = newTransform.x;
	t.y = newTransform.y;
	t.k = newTransform.k;
}

const isCreatingNewEdge = computed(() => newEdge.value && newEdge.value.points && newEdge.value.points.length === 2);

function onCanvasClick() {
	if (isCreatingNewEdge.value) {
		cancelNewEdge();
	}
}

function cancelNewEdge() {
	newEdge.value = undefined;
}

function onPortMouseover(position: Position) {
	currentPortPosition = position;
	isMouseOverPort = true;
}

function onPortMouseleave() {
	isMouseOverPort = false;
}

function resizeHandler(node: WorkflowNode<any>) {
	relinkEdges(node);
}

/*
 * Relink edges that have become detached
 *
 * [output-port](edge source => edge target)[input-port]
 */
function relinkEdges(node: WorkflowNode<any> | null) {
	const allEdges = wf.value.getEdges();
	const candidateEdges = node ? allEdges.filter((e) => e.source === node.id || e.target === node.id) : allEdges;

	// Note id can start with numerals, so we need [id=...]
	const getPortElement = (id: string) => d3.select(`[id='${id}']`).select('.port').node() as HTMLElement;

	// Cache
	const nodeMap = new Map<string, WorkflowNode<any>>(wf.value.getNodes().map((n) => [n.id, n]));

	for (let i = 0; i < candidateEdges.length; i++) {
		const edge = candidateEdges[i];
    if (!edge) continue;
		const sourceNode = nodeMap.get(edge.source as string);
		const sourcePortElem = getPortElement(edge.sourcePortId as string);
		const targetNode = nodeMap.get(edge.target as string);
		const targetPortElem = getPortElement(edge.targetPortId as string);

		if (!sourcePortElem || !targetPortElem) continue;

		edge.points[0]!.x = sourceNode!.x + sourceNode!.width + sourcePortElem.offsetWidth * 0.5;
		edge.points[0]!.y = sourceNode!.y + sourcePortElem.offsetTop + sourcePortElem.offsetHeight * 0.5;
		edge.points[1]!.x = targetNode!.x + targetPortElem.offsetWidth * 0.5;
		edge.points[1]!.y = targetNode!.y + targetPortElem.offsetTop + targetPortElem.offsetHeight * 0.5;
		edgePositionSet.add(edge.id);
	}
}

let prevX = 0;
let prevY = 0;

function mouseUpdate(event: MouseEvent) {
	if (isCreatingNewEdge.value) {
		const pointIndex = newEdge.value?.direction === WorkflowDirection.FROM_OUTPUT ? 1 : 0;
		if (isMouseOverPort) {
			newEdge.value!.points[pointIndex]!.x = currentPortPosition.x;
			newEdge.value!.points[pointIndex]!.y = currentPortPosition.y;
		} else {
			const dx = event.x - prevX;
			const dy = event.y - prevY;
			newEdge.value!.points[pointIndex]!.x += dx / canvasTransform.k;
			newEdge.value!.points[pointIndex]!.y += dy / canvasTransform.k;
		}
	}
	prevX = event.x;
	prevY = event.y;
}

function updateEdgePositions(node: WorkflowNode<any>, { x, y }: Position) {
	wf.value.getEdges().forEach((edge: any) => {
		if (edge.source === node.id) {
			edge.points[0].x += x / canvasTransform.k;
			edge.points[0].y += y / canvasTransform.k;
			edgePositionSet.add(edge.id);
		}
		if (edge.target === node.id) {
			edge.points[edge.points.length - 1].x += x / canvasTransform.k;
			edge.points[edge.points.length - 1].y += y / canvasTransform.k;
			edgePositionSet.add(edge.id);
		}
	});
}

const updatePosition = (node: WorkflowNode<any>, { x, y }: Position) => {
	const teraNode = teraOperatorRefs.value.find((operatorNode: any) => operatorNode.id === node.id);
	if (teraNode.isEditing ?? false) {
		return;
	}
	isDragging = true;
	node.x += x / canvasTransform.k;
	node.y += y / canvasTransform.k;
	nodePositionSet.add(node.id);
	updateEdgePositions(node, { x, y });
};

function interpolatePointsForCurve(a: Position, b: Position): Position[] {
	const controlXOffset = 50;
	return [a, { x: a.x + controlXOffset, y: a.y }, { x: b.x - controlXOffset, y: b.y }, b];
}

const pathFn = d3
	.line<{ x: number; y: number }>()
	.x((d) => d.x)
	.y((d) => d.y)
	.curve(d3.curveBasis);

// Get around typescript complaints
const drawPath = (v: any) => pathFn(v) as string;
const hasInvalidNodes = computed(() => wf.value.getNodes().some((node) => node.status === OperatorStatus.INVALID));


const openDrilldown = (node: WorkflowNode<any>) => {
  console.log('node', node.operationType);
	currentActiveNode.value = node;
	dialogIsOpened.value = true;
};

const closeDrilldown = async () => {
	dialogIsOpened.value = false;
};

const handleDrilldown = () => {
	const operatorId = route.query?.operator?.toString();
	if (operatorId) {
		const operator = wf.value.getNodes().find((n) => n.id === operatorId);
    if (!operator) return;
		openDrilldown(operator);
	} else {
		closeDrilldown();
	}
};
watch(
	() => props.assetId,
	async () => {},
	{ immediate: true }
);

watch(
	() => [route?.query],
	() => {
		handleDrilldown();
  },
	{ deep: true }
);

onMounted(() => {
	document.addEventListener('mousemove', mouseUpdate);

  // Testing
  const testWF: Workflow = workflowService.emptyWorkflow();
  wf.value.load(testWF);

  const n1 = wf.value.addNode(DummyOp.operation, { x: 300, y: 200 }, { state: { str: 'weather model' }})
  const n2 = wf.value.addNode(DummyOp.operation, { x: 300, y: 600 }, { state: { str: 'route model' }})
  const n3 = wf.value.addNode(Dummy2Op.operation, { x: 600, y: 400 }, { state: { str: 'drone model' }})

  wf.value.addEdge(n1.id, n1.outputs[0]!.id, n3.id, n3.inputs[0]!.id, [
    { x: 0, y: 0 },
    { x: 1, y: 1 }
  ]);

  wf.value.addEdge(n2.id, n2.outputs[0]!.id, n3.id, n3.inputs[1]!.id, [
    { x: 0, y: 0 },
    { x: 1, y: 1 }
  ]);

  wf.value.runDagreLayout();

	currentProjectId.value = 'Testing';
});

onUnmounted(() => {
	if (canvasTransform) { }
	document.removeEventListener('mousemove', mouseUpdate);
});
</script>

<style scoped>
.toolbar {
	align-items: center;
	background-color: var(--surface-transparent);
	border-bottom: 1px solid var(--surface-border-light);
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	padding: var(--gap-1) var(--gap-4);
	z-index: 900;
}

.button-group {
	align-items: center;
	display: flex;
	flex-direction: row;
	gap: var(--gap-3);
}

.rename-workflow {
	align-items: center;
	display: flex;
	flex-wrap: nowrap;
}

.warning-banner {
	height: 0;
}
</style>
