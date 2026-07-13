<template>
	<ul>
		<li
			v-for="output in selectedOutputs"
			:id="output.id"
			:key="output.id"
			:class="{ 'port-connected': output.status === WorkflowPortStatus.CONNECTED }"
			@click.stop="emit('port-selected', output, WorkflowDirection.FROM_OUTPUT)"
			@focus="() => {}"
			@focusout="() => {}"
			@mousedown.stop="emit('port-selected', output, WorkflowDirection.FROM_OUTPUT)"
			@mouseup.stop="emit('port-selected', output, WorkflowDirection.FROM_OUTPUT)"
		>
			<section>
				<div class="port-container">
					<div class="port" />
				</div>
				<div class="relative w-full">
					<div class="truncate text-right"></div>
				</div>
			</section>
		</li>
	</ul>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import { computed } from 'vue';
import type { WorkflowOutput } from '@/types/workflow';
import { WorkflowPortStatus, WorkflowDirection } from '@/types/workflow';
import type { OperatorMenuItem } from '@/services/workflow';

const emit = defineEmits([
	'port-selected',
	'menu-selection'
]);

const props = defineProps({
	outputs: {
		type: Array as PropType<WorkflowOutput<any>[]>,
		default: () => []
	},
	menuOptions: {
		type: Array as PropType<OperatorMenuItem[]>,
		default: () => []
	}
});

const selectedOutputs = computed(() =>
	props.outputs.filter((output) => {
		if (!('isSelected' in output)) return true;
		return output.isSelected;
	})
);
</script>

<style scoped>
ul {
	align-items: end;
}

li {
	width: 100%;
	padding-left: 0.75rem;
	border-radius: var(--border-radius) 0 0 var(--border-radius);
}

li > section {
	flex-direction: row-reverse;
}

li > *:not(:first-child) {
	margin-right: calc(var(--port-base-size) * 2);
}

li:hover:before {
	content: '';
	position: absolute;
	width: 6.5rem;
	height: 4rem;
	bottom: -0.75rem;
	right: -8rem;
}

.port-container {
	text-align: right;
}

.port {
	border-radius: var(--port-base-size) 0 0 var(--port-base-size);
	border: 2px solid var(--surface-border);
	border-right: none;
}

.port-connected .port {
	left: calc(var(--port-base-size) * 0.25);
}

.truncate {
	max-width: 180px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

/** These v-* classes are used for animations for the <Transition /> element */
.v-enter-active,
.v-leave-active {
	transition: opacity 0.15s;
}

.v-enter-from,
.v-leave-to {
	opacity: 0;
}
</style>
