<script setup lang="ts">
import TeraWorkflow from '@/components/workflow/tera-workflow.vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const assetId = (route.params.id as string) || 'test';
</script>

<template>
  <main style="height: 100%">
    <tera-workflow :assetId="assetId" />
  </main>
</template>
