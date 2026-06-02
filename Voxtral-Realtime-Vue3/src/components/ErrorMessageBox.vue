<script setup lang="ts">
import { THEME } from '../constants';

defineProps<{
  message: string;
  className?: string;
}>();
</script>

<template>
  <div
    :class="className"
    :style="{
      backgroundColor: `${THEME.errorRed}0D`,
      borderColor: `${THEME.errorRed}33`,
    }"
  >
    <p
      class="font-mono text-xs break-words"
      :style="{ color: THEME.errorRed }"
    >
      {{ `> Error: ${message}` }}
    </p>
  </div>
</template>
