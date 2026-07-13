<template>
	<tera-drilldown
		:node="node"
		@on-close-clicked="emit('close')"
		@update-state="(state: any) => emit('update-state', state)"
	>
		<tera-drilldown-section>
      <main>
        <p> This is the drilldown of a Task </p>
      </main>
		</tera-drilldown-section>
	</tera-drilldown>
</template>

<script setup lang="ts">
import type { WorkflowNode } from '@/types/workflow';
import type { TaskOperationState } from '@/components/workflow/ops/task/task-operation';

import TeraDrilldown from '@/components/drilldown/tera-drilldown.vue';
import TeraDrilldownSection from '@/components/drilldown/tera-drilldown-section.vue';


const props = defineProps<{
	node: WorkflowNode<TaskOperationState>;
}>();

const emit = defineEmits(['close', 'update-state', 'append-output']);

</script>

<style scoped>
main {
  margin: 1rem;
}
</style>
