<template>
	<header>
		<div class="title-row">
			<strong class="title"><slot /> </strong>
			<i class="pi pi-times" aria-label="Close" @click="emit('close')" />
		</div>
	</header>
</template>

<script setup lang="ts">

const props = defineProps<{
	documentationUrl?: string;
}>();
const emit = defineEmits(['close']);

</script>

<style scoped>
header {
	display: flex;
	flex-direction: column;
	gap: var(--gap-2);
	background-color: var(--surface-highlight);
	padding-top: 1rem;
	padding-bottom: 1rem;
	padding-left: 1.5rem;
	padding-right: 1.5rem;
	border-bottom: 1px solid var(--surface-border-light);
}

header > * {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.title-row {
	display: flex;
	align-items: center;
	gap: var(--gap-3);
}

header .title {
	white-space: nowrap;
	min-width: fit-content;
}
</style>
