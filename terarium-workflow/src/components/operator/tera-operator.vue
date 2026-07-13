<template>
	<main
		ref="operator"
		@mouseenter="interactionStatus = addHover(interactionStatus)"
		@mouseleave="interactionStatus = removeHover(interactionStatus)"
		@mousedown="interactionStatus = addDrag(interactionStatus)"
		@mouseup="interactionStatus = removeDrag(interactionStatus)"
		@focus="() => {}"
		@focusout="() => {}"
	>
		<tera-operator-header
			:name="node.displayName"
			:status="node.status"
			:interaction-status="interactionStatus"
			@remove-operator="emit('remove-operator', props.node.id)"
			@duplicate-branch="emit('duplicate-branch')"
		/>
		<tera-operator-inputs
      v-if="node.inputs.filter(d => d.status === 'connected').length"
			:inputs="node.inputs"
			@port-selected="(input: WorkflowPort, direction: WorkflowDirection) => emit('port-selected', input, direction)"
			@remove-edges="(portId: string) => emit('remove-edges', portId)"
		/>
		<section class="content">
			<slot name="body" />
		</section>
		<tera-operator-outputs
      v-if="node.outputs.filter(d => d.status === 'connected').length"
			:outputs="node.outputs"
			:menu-options="menuOptions"
			@menu-selection="(operatorType: string, outputPort: WorkflowPort) => onSelection(operatorType, outputPort)"
			@port-selected="(input: WorkflowPort, direction: WorkflowDirection) => emit('port-selected', input, direction)"
			@remove-edges="(portId: string) => emit('remove-edges', portId)"
		/>
	</main>
</template>

<script setup lang="ts">
import type { WorkflowNode, WorkflowPort } from '@/types/workflow';
import { WorkflowDirection } from '@/types/workflow';
import { addDrag, addHover, removeDrag, removeHover } from '@/services/operator-bitmask';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import TeraOperatorHeader from '@/components/operator/tera-operator-header.vue';
import TeraOperatorInputs from '@/components/operator/tera-operator-inputs.vue';
import TeraOperatorOutputs from '@/components/operator/tera-operator-outputs.vue';
import type { OperatorMenuItem } from '@/services/workflow';

const props = defineProps<{
	node: WorkflowNode<any>;
	nodeMenu: Map<string, OperatorMenuItem[]>;
}>();

const emit = defineEmits([
	'port-selected',
	'menu-selection',
	'remove-operator',
	'remove-edges',
	'resize',
	'duplicate-branch',
	'update-state'
]);

const operator = ref<HTMLElement>();
const interactionStatus = ref(0); // States will be added to it thorugh bitmasking
const menuOptions = ref<OperatorMenuItem[] | []>([]);

let resizeObserver: ResizeObserver | null = null;

function onSelection(operatorType: string, outputPort: WorkflowPort) {
	emit('menu-selection', operatorType, outputPort);
}

function resizeHandler() {
	emit('resize', props.node);
}

onMounted(() => {
	menuOptions.value = props.nodeMenu.get(props.node.operationType) ?? [];
	if (operator.value) {
		resizeObserver = new ResizeObserver(resizeHandler);
		resizeObserver.observe(operator.value);
	}
});

onBeforeUnmount(() => {
	if (operator.value && resizeObserver) {
		resizeObserver.disconnect();
		resizeObserver = null;
	}
});

defineExpose({ id: props.node.id });
</script>

<style scoped>
main {
	background-color: var(--surface-section);
	outline: 1px solid var(--surface-border);
	border-radius: var(--border-radius-medium);
	box-shadow: var(--overlay-menu-shadow);
	min-width: 15rem;
	transition: box-shadow 80ms ease;

	&:hover {
		box-shadow: var(--overlay-menu-shadow-hover);
		z-index: 2;
	}

	& > .content {
		padding: 0.5rem;
	}

	&>ul,
	&>.content,
	&>.content:deep(> *)

	/* Assumes that the child put in the slot will be wrapped in its own parent tag */ {
		display: flex;
		flex-direction: column;
		justify-content: space-evenly;
		gap: 0.5rem;
		&:empty {
			display: none;
		}
	}

	/* Shared styles between tera-operator-inputs and tera-operator-outputs */
	& > ul {
		padding: 0.5rem 0;
		list-style: none;
		font-size: var(--font-caption);
		color: var(--text-color-subdued);

		/* Can't nest css within the deep selector */
		&:deep(> li) {
			display: flex;
			flex-direction: column;
			gap: 0.25rem;
      pointer-events: none;
		}

		&:deep(> li > section) {
			display: flex;
			align-items: center;
			height: calc(var(--port-base-size) * 2);
			gap: 0.25rem;
		}

		&:deep(.p-button.p-button-sm) {
			font-size: var(--font-caption);
			min-width: fit-content;
			padding: 0 0.25rem;
		}

		&:deep(.unlink) {
			display: none;
		}

		&:deep(.port-connected) {
			color: var(--text-color-primary);
		}

		&:deep(.port-container) {
			width: calc(var(--port-base-size) * 1.25);
		}

		&:deep(.port) {
			display: inline-block;
			background-color: var(--surface-100);
			position: relative;
			width: var(--port-base-size);
			height: calc(var(--port-base-size) * 2);
			top: 2px;
		}

		&:deep(.port-connected .port) {
			position: relative;
			width: calc(var(--port-base-size) * 2);
			border: 2px solid var(--surface-border);
			border-radius: var(--port-base-size);
			background-color: var(--surface-100);
			transition: background-color 0.125s ease-in-out;
		}

		&:deep(.port-connected .port)::after {
			content: '';
			position: absolute;
			/* This is crucial for positioning inside the parent */
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 10px;
			height: 10px;
			border-radius: 50%;
			background-color: var(--text-color-subdued);
		}

	}
}
</style>
