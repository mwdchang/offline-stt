<template>
	<ul>
		<li
			v-for="input in inputs"
			:id="input.id"
			:key="input.id"
			:class="{ 'port-connected': input.status === WorkflowPortStatus.CONNECTED }"
			@click.stop="emit('port-selected', input, WorkflowDirection.FROM_INPUT)"
			@focus="() => {}"
			@focusout="() => {}"
			@mousedown.stop="emit('port-selected', input, WorkflowDirection.FROM_INPUT)"
			@mouseup.stop="emit('port-selected', input, WorkflowDirection.FROM_INPUT)"
		>
			<section>
				<div class="port-container">
					<div class="port" />
				</div>
				<div class="relative w-full">
					<div class="truncate text-left">
					</div>
				</div>
			</section>
		</li>
	</ul>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import type { WorkflowPort }from '@/types/workflow';
import { WorkflowPortStatus, WorkflowDirection } from '@/types/workflow';

const emit = defineEmits(['port-selected']);

defineProps({
	inputs: {
		type: Array as PropType<WorkflowPort[]>,
		default: () => []
	}
});
</script>

<style scoped>
li {
	padding-right: 0.75rem;
	border-radius: 0 var(--border-radius) var(--border-radius) 0;
}

.port {
	border-radius: 0 var(--port-base-size) var(--port-base-size) 0;
	border: 2px solid var(--surface-border);
	border-left: none;
}

.port-connected .port {
	left: calc(-1 * var(--port-base-size));
}

label:not(:last-child)::after {
	content: ', ';
}

.truncate {
	max-width: 180px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

</style>
