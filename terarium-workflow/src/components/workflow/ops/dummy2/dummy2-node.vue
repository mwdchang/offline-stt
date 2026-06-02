<template>
	<main>
    <p>Drone model</p>
    <Button @click="emit('open-drilldown')">Drilldown</Button>
  </main>
</template>

<script setup lang="ts">
import type { WorkflowNode } from '@/types/workflow';
import type { Dummy2OperationState } from './dummy2-operation';
import Button from 'primevue/button';

const props = defineProps<{
	node: WorkflowNode<Dummy2OperationState>;
}>();
const emit = defineEmits(['open-drilldown']);


</script>

<style scoped>
main {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.p-selectbutton {
	width: 100%;
}

.p-selectbutton:deep(.p-button) {
	flex-grow: 1;
}

.container {
	border: 1px solid var(--surface-border-light);
	border-radius: var(--border-radius);
	overflow: hidden;
}
</style>
