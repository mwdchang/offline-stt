<template>
	<header :class="`${status} ${interactionClasses}`">
		<span class="header-label">{{ name }}</span>
	</header>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import { computed } from 'vue';
import { isHover } from '@/services/operator-bitmask';
import { OperatorStatus } from '@/types/workflow';

const emit = defineEmits(['remove-operator', 'open-in-new-window', 'duplicate-branch', 'show-annotation-editor']);

const props = defineProps({
	name: {
		type: String,
		default: ''
	},
	status: {
		type: String as PropType<OperatorStatus>,
		default: OperatorStatus.DEFAULT
	},
	interactionStatus: {
		type: Number,
		default: 0
	}
});

const interactionClasses = computed(() => {
	const classes: string[] = [];
	if (isHover(props.interactionStatus)) classes.push('focus');
	return classes.join(' ');
});

</script>

<style scoped>
header {
	display: flex;
	height: 2rem;
	padding: 0.5rem;
	justify-content: space-between;
	align-items: center;
	background-color: var(--surface-highlight);
	white-space: nowrap;
	border-top-right-radius: var(--border-radius-medium);
	border-top-left-radius: var(--border-radius-medium);
	transition: all 80ms ease;
}

.header-label {
	font-size: var(--font-caption);
}
.warning,
.invalid {
	background-color: var(--surface-warning);
}

.error,
.failed {
	background-color: var(--surface-error);
}

.disabled {
	background-color: var(--surface-disabled);
	color: var(--text-color-disabled);
}

/* FIXME: Should consider making the color darker programmatically instead of doing it by a case by case basis*/
.default.focus {
	background-color: var(--surface-highlight-hover);
}

.p-button.p-button-icon-only {
	color: var(--text-color-primary);
}

h6 {
	overflow: hidden;
	text-overflow: ellipsis;
	font-weight: normal;
}
</style>
