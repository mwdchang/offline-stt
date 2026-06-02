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
import { cloneDeep } from 'lodash';
import type { WorkflowNode } from '@/types/workflow';
import type { DummyOperationState } from '@/components/workflow/ops/dummy/dummy-operation';

import TeraDrilldown from '@/components/drilldown/tera-drilldown.vue';
import TeraDrilldownSection from '@/components/drilldown/tera-drilldown-section.vue';


const props = defineProps<{
	node: WorkflowNode<DummyOperationState>;
}>();

const emit = defineEmits(['close', 'update-state', 'append-output']);

</script>
