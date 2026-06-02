<script setup lang="ts">
const ACTIVITY_BARS = [0, 1, 2, 3, 4];

withDefaults(defineProps<{
  color: string;
  active?: boolean;
}>(), {
  active: false
});
</script>

<template>
  <div class="flex items-end justify-center gap-1.5">
    <span
      v-for="bar in ACTIVITY_BARS"
      :key="bar"
      class="voice-meter-bar"
      :class="{ 'is-active': active }"
      :style="{
        backgroundColor: color,
        animationDelay: `${bar * 120}ms`,
      }"
    />
  </div>
</template>
