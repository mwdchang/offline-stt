<script setup lang="ts">
import { computed } from 'vue';
import { useVoxtral } from './composables/useVoxtral';
import LandingPage from './components/LandingPage.vue';
import LoadingPage from './components/LoadingPage.vue';
import RunningPage from './components/RunningPage.vue';

const { status } = useVoxtral();

const PAGE_BY_STATUS = {
  idle: LandingPage,
  loading: LoadingPage,
  error: LoadingPage,
  ready: RunningPage,
  recording: RunningPage,
} as const;

const CurrentPage = computed(() => PAGE_BY_STATUS[status.value]);
</script>

<template>
  <component :is="CurrentPage" />
</template>

<style>
/* Global styles if needed, but we use main.css */
</style>
