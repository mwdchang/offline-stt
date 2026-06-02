<script setup lang="ts">
import { THEME } from '../constants';

defineProps<{
  className?: string;
  style?: any;
}>();

const GRID_BACKGROUND_STYLE = {
  backgroundColor: THEME.beigeLight,
  backgroundImage: `
    linear-gradient(${THEME.beigeDark} 1px, transparent 1px),
    linear-gradient(90deg, ${THEME.beigeDark} 1px, transparent 1px)
  `,
  backgroundSize: "40px 40px",
};
</script>

<template>
  <div :class="className" :style="{ ...GRID_BACKGROUND_STYLE, ...style }">
    <slot />
  </div>
</template>
