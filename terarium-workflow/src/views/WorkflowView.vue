<script setup lang="ts">
import { ref, onMounted } from 'vue';
import TeraWorkflow from '@/components/workflow/tera-workflow.vue';

import * as workflowService from '@/services/workflow';
import * as TaskOp from '@/components/workflow/ops/task/mod';
import type { Workflow } from '@/types/workflow';
const workflow = ref<Workflow>(workflowService.emptyWorkflow());

onMounted(() => {
  // Testing
  const wf = new workflowService.WorkflowWrapper();
  const testWF: Workflow = workflowService.emptyWorkflow();
  wf.load(testWF);

  const n1 = wf.addNode(TaskOp.operation, { x: 300, y: 200 }, { state: { description: 'drone delivery' }})
  const n2 = wf.addNode(TaskOp.operation, { x: 300, y: 600 }, { state: { description: 'route model' }})
  const n3 = wf.addNode(TaskOp.operation, { x: 600, y: 400 }, { state: { description: 'drone model' }})

  wf.addEdge(n1.id, n1.outputs[0]!.id, n3.id, n3.inputs[0]!.id, [
    { x: 0, y: 0 },
    { x: 1, y: 1 }
  ]);

  wf.addEdge(n2.id, n2.outputs[0]!.id, n3.id, n3.inputs[0]!.id, [
    { x: 0, y: 0 },
    { x: 1, y: 1 }
  ]);
  wf.runDagreLayout();
  workflow.value = wf.get();
});
</script>

<template>
  <main style="height: 100%">
    <tera-workflow :workflow="workflow" />
  </main>
</template>
