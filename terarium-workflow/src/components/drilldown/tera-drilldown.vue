<template>
	<aside class="overlay-container">
		<section v-bind="$attrs" :class="spawnAnimationRef">
			<tera-drilldown-header
				:documentation-url="node.documentationUrl"
				@close="emit('on-close-clicked')"
			>
				{{ title ?? node.displayName }}
				<template #top-header-actions>
				</template>
				<template #actions>
					<slot name="header-actions" />
				</template>
			</tera-drilldown-header>
			<main class="flex overflow-hidden h-full">
				<slot name="sidebar" />
				<tera-columnar-panel class="flex-1">
					<template v-for="(tab, index) in tabs" :key="index">
						<component :is="tab" v-if="selectedViewIndex === index" />
					</template>
					<section v-if="slots.preview">
						<slot name="preview" />
					</section>
				</tera-columnar-panel>
				<slot name="sidebar-right" />
			</main>
			<footer v-if="slots.footer">
				<slot name="footer" />
			</footer>
		</section>
	</aside>
</template>

<script setup lang="ts">
import { isEmpty } from 'lodash';
import { ref, computed, onMounted, onUnmounted, useSlots, type ComponentPublicInstance } from 'vue';
import Button from 'primevue/button';
import Menu from 'primevue/menu';
import type { MenuItem, MenuItemCommandEvent } from 'primevue/menuitem';
import { type WorkflowNode } from '@/types/workflow';
import TeraDrilldownHeader from '@/components/drilldown/tera-drilldown-header.vue';
import TeraColumnarPanel from '@/components/widgets/tera-columnar-panel.vue';


const props = defineProps<{
	node: WorkflowNode<any>;
	title?: string;
	tooltip?: string;
	isDraft?: boolean;
	// Applied in dynamic compoenent in tera-workflow.vue
	upstreamOperatorsNav?: MenuItem[];
	downstreamOperatorsNav?: MenuItem[];
	spawnAnimation?: 'left' | 'right' | 'scale';
	hideDropdown?: boolean;
}>();

const emit = defineEmits(['on-close-clicked', 'update-state', 'update:selection']);

const slots = useSlots();

/**
 * This will retrieve and filter all top level components in the default slot if they have the tabName prop.
 */
const tabs = computed(() => {
	if (slots.default?.()) {
		if (slots.default().length === 1) {
			// if there is only 1 component we don't need to know the tab name and we can render it.
			return slots.default();
		}
		return slots.default().filter((vnode) => vnode.props?.tabName);
	}
	return [];
});

const selectedViewIndex = ref<number>(0);



// Drilldown navigation and animations
const leftChevronButton = ref<ComponentPublicInstance<typeof Button> | null>(null);
const rightChevronButton = ref<ComponentPublicInstance<typeof Button> | null>(null);
const upstreamMenu = ref<Menu | null>(null);
const downstreamMenu = ref<Menu | null>(null);

const toggleNavigationMenu = (
	event: MouseEvent | KeyboardEvent,
	menu: Menu | null,
	operatorsNav?: MenuItem[],
	button?: ComponentPublicInstance<typeof Button> | null
) => {
	const navItems = operatorsNav?.[0]?.items;
	if (!navItems || isEmpty(navItems)) return; // Prevents keyboard shortcut from toggling hidden button and empty menu

	// If there is only one item in the menu, just navigate to that one
	if (navItems.length === 1 && navItems[0]?.command) {
		const dummyEvent: MenuItemCommandEvent = { originalEvent: event, item: navItems[0] };
		navItems[0].command(dummyEvent);
	}
	// Keyboard event will mimic clicking the navigation button to open the menu where expected
	else if (event instanceof KeyboardEvent && button) {
		button.$el.dispatchEvent(new MouseEvent('click'));
	}
	// Regular @click event
	else menu?.toggle(event);
};

function handleKeyNavigation(event: KeyboardEvent) {
	const target = event.target as HTMLElement;
	if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
		return; // Prevent navigation if the user is editing text
	}
	if (event.shiftKey && event.key === 'ArrowLeft') {
		toggleNavigationMenu(event, upstreamMenu.value, props.upstreamOperatorsNav, leftChevronButton.value);
	} else if (event.shiftKey && event.key === 'ArrowRight') {
		toggleNavigationMenu(event, downstreamMenu.value, props.downstreamOperatorsNav, rightChevronButton.value);
	}
}

// Animation class must be applied on mounted to avoid flickering
const spawnAnimationRef = ref('');
onMounted(() => {
	spawnAnimationRef.value = props.spawnAnimation ?? 'scale';
	window.addEventListener('keydown', handleKeyNavigation);
});

onUnmounted(() => window.removeEventListener('keydown', handleKeyNavigation));
</script>

<style scoped>
.overlay-container {
	isolation: isolate;
	z-index: var(--z-index, var(--z-index-modal));
	position: fixed;
	width: 100%;
	height: 100%;
	background-color: rgba(0, 0, 0, 0.32);
	padding: var(--gap-4) var(--gap-1);
	padding-bottom: 0;
	display: flex;
	gap: var(--gap-1);
	backdrop-filter: blur(2px);

	& > section {
		flex: 1;
    margin: 1rem;
		background: var(--surface-0);
		border-radius: var(--modal-border-radius) var(--modal-border-radius) 0 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		&.left {
			animation: fadeLeft 0.15s ease-out;
		}
		&.right {
			animation: fadeRight 0.15s ease-out;
		}
		&.scale {
			animation: scaleForward 0.15s ease-out;
		}
	}

	& > div {
		align-self: center;
		&.no-connections {
			visibility: hidden;
		}

		& > button {
			height: 4rem;
			width: 20px;
			border-radius: var(--border-radius-big);
		}
	}
}

.operator-nav-info {
	display: flex;
	flex-direction: column;
	flex-wrap: nowrap;
	padding: var(--gap-1-5) var(--gap-2);
	gap: var(--gap-3);
	white-space: nowrap;

	& > span {
		display: flex;
		align-items: center;
		& > i {
			margin-right: var(--gap-2);
		}
	}

	& > label {
		color: var(--text-color-subdued);
	}
}

footer {
	padding: 0 1.5rem 1rem 1.5rem;
	display: flex;
	justify-content: flex-end;
	gap: 0.5rem;
}

.draft {
	border-color: var(--warning-color);
	background-color: var(--surface-warning);
}

@keyframes scaleForward {
	from {
		opacity: 0.5;
		scale: 0.5;
	}
	to {
		opacity: 1;
		scale: 1;
	}
}

@keyframes fadeLeft {
	from {
		opacity: 0.5;
		transform: translateX(10rem);
	}
	to {
		opacity: 1;
		transform: translateX(0);
	}
}

@keyframes fadeRight {
	from {
		opacity: 0.5;
		transform: translateX(-10rem);
	}
	to {
		opacity: 1;
		transform: translateX(0);
	}
}
</style>
