<template>
	<tera-drilldown
		:node="node"
		@on-close-clicked="emit('close')"
		@update-state="(state: any) => emit('update-state', state)"
	>
		<tera-drilldown-section>
		</tera-drilldown-section>
	</tera-drilldown>
</template>

<script setup lang="ts">
import type { WorkflowNode } from '@/types/workflow';
import type { Dummy2OperationState } from '@/components/workflow/ops/dummy2/dummy2-operation';

import TeraDrilldown from '@/components/drilldown/tera-drilldown.vue';
import TeraDrilldownSection from '@/components/drilldown/tera-drilldown-section.vue';


const props = defineProps<{
	node: WorkflowNode<Dummy2OperationState>;
}>();

const emit = defineEmits(['close', 'update-state', 'append-output']);

</script>
