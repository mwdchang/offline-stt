<script setup lang="ts">
import { computed } from 'vue';

interface ElkPoint {
  x: number;
  y: number;
}

interface ElkLabel {
  text?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

interface ElkEdgeSection {
  id: string;
  startPoint: ElkPoint;
  endPoint: ElkPoint;
  bendPoints?: ElkPoint[];
}

interface ElkExtendedEdge {
  id: string;
  sources: string[];
  targets: string[];
  sections?: ElkEdgeSection[];
  container?: string;
}

interface ElkNode {
  id: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  labels?: ElkLabel[];
  children?: ElkNode[];
  edges?: ElkExtendedEdge[];
  layoutOptions?: Record<string, string>;
}

const props = defineProps<{
  node: ElkNode;
  activeNodeIds: Set<string>;
  hoveredNodeId: string | null;
  selectedNodeId: string | null;
}>();

const emit = defineEmits<{
  (e: 'hover-node', id: string | null): void;
  (e: 'select-node', node: ElkNode): void;
}>();

const hasChildren = computed(() => {
  return props.node.children && props.node.children.length > 0;
});

// Create a rounded header background for compound nodes
const headerPath = computed(() => {
  const w = props.node.width || 0;
  const r = 12; // corner radius
  const h = 35; // header height
  return `M 0,${r} 
          A ${r},${r} 0 0,1 ${r},0 
          L ${w - r},0 
          A ${r},${r} 0 0,1 ${w},${r} 
          L ${w},${h} 
          L 0,${h} 
          Z`;
});

// Helper to generate edge section path
function getSectionPath(section: ElkEdgeSection): string {
  let path = `M ${section.startPoint.x} ${section.startPoint.y}`;
  if (section.bendPoints) {
    for (const bp of section.bendPoints) {
      path += ` L ${bp.x} ${bp.y}`;
    }
  }
  path += ` L ${section.endPoint.x} ${section.endPoint.y}`;
  return path;
}

// Check if this edge connects to a node that is currently highlighted
function isEdgeActive(edge: ElkExtendedEdge): boolean {
  if (props.activeNodeIds.size === 0) return false;
  return edge.sources.some(s => props.activeNodeIds.has(s)) ||
         edge.targets.some(t => props.activeNodeIds.has(t));
}

// Check if this edge is directly hovered
function isEdgeHovered(edge: ElkExtendedEdge): boolean {
  return props.hoveredNodeId !== null && 
         (edge.sources.includes(props.hoveredNodeId) || edge.targets.includes(props.hoveredNodeId));
}

// Generate nice color schemes based on the depth/type of the node
const nodeStyles = computed(() => {
  const isSelected = props.selectedNodeId === props.node.id;
  const isHovered = props.hoveredNodeId === props.node.id;

  if (hasChildren.value) {
    return {
      stroke: isSelected ? 'var(--color-primary-light)' : (isHovered ? 'var(--color-primary)' : 'var(--color-border-compound)'),
      fill: 'var(--color-bg-compound)',
      strokeWidth: isSelected ? '2.5px' : '1.5px',
      filter: isSelected || isHovered ? 'drop-shadow(0 0 8px var(--color-primary-glow))' : 'none'
    };
  } else {
    return {
      stroke: isSelected ? 'var(--color-accent-light)' : (isHovered ? 'var(--color-accent)' : 'var(--color-border-leaf)'),
      fill: 'var(--color-bg-leaf)',
      strokeWidth: isSelected ? '2.5px' : '1.5px',
      filter: isSelected || isHovered ? 'drop-shadow(0 0 8px var(--color-accent-glow))' : 'none'
    };
  }
});
</script>

<template>
  <g
    :transform="`translate(${node.x || 0}, ${node.y || 0})`"
    class="graph-node"
    :class="{
      'is-compound': hasChildren,
      'is-leaf': !hasChildren,
      'is-hovered': hoveredNodeId === node.id,
      'is-selected': selectedNodeId === node.id
    }"
    @mouseenter.stop="emit('hover-node', node.id)"
    @mouseleave.stop="emit('hover-node', null)"
    @click.stop="emit('select-node', node)"
  >
    <!-- Background bounding box -->
    <rect
      :width="node.width"
      :height="node.height"
      :rx="hasChildren ? 12 : 8"
      :ry="hasChildren ? 12 : 8"
      class="node-rect"
      :style="nodeStyles"
    />

    <!-- Header bar for compound nodes -->
    <g v-if="hasChildren" class="compound-header">
      <path :d="headerPath" class="compound-header-bg" />
      <text x="15" y="22" class="node-title compound-title">
        {{ node.labels?.[0]?.text || node.id }}
      </text>
      <!-- Subtitle or count indicator -->
      <text :x="(node.width || 0) - 15" y="22" class="node-badge" text-anchor="end">
        {{ node.children?.length }} elements
      </text>
    </g>

    <!-- Node Content for Leaf Nodes -->
    <g v-else class="leaf-content">
      <!-- Leaf label & type icon -->
      <g transform="translate(12, 16)">
        <rect x="0" y="4" width="16" height="16" rx="4" class="leaf-type-icon-bg" />

        <!--
        <circle cx="8" cy="12" r="4" class="leaf-type-icon-dot" />
        -->
        <text x="8" y="16" class="node-title leaf-title">
          {{ node.labels?.[0]?.text || node.id }}
        </text>
      </g>
      
      <text x="16" y="46" class="node-subtitle">
      </text>
    </g>

    <!-- Recursive children (render compound groups first) -->
    <g v-if="hasChildren" class="children-container">
      <GraphNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :active-node-ids="activeNodeIds"
        :hovered-node-id="hoveredNodeId"
        :selected-node-id="selectedNodeId"
        @hover-node="emit('hover-node', $event)"
        @select-node="emit('select-node', $event)"
      />
    </g>

    <!-- Render edges defined in this compound node (local coordinate system) -->
    <g v-if="node.edges && node.edges.length > 0" class="edges-container">
      <g
        v-for="edge in node.edges"
        :key="edge.id"
        class="edge-group"
        :class="{
          'is-active': isEdgeActive(edge),
          'is-hovered': isEdgeHovered(edge)
        }"
      >
        <!-- Background thick path for easier hovering and glowing shadow -->
        <path
          v-for="section in edge.sections"
          :key="'bg-' + section.id"
          :d="getSectionPath(section)"
          class="edge-path-bg"
        />
        <!-- Active glow path -->
        <path
          v-for="section in edge.sections"
          :key="'glow-' + section.id"
          :d="getSectionPath(section)"
          class="edge-path-glow"
        />
        <!-- Core path -->
        <path
          v-for="section in edge.sections"
          :key="'core-' + section.id"
          :d="getSectionPath(section)"
          class="edge-path-core"
          marker-end="url(#arrow-head)"
        />
      </g>
    </g>
  </g>
</template>

<style scoped>
.graph-node {
  cursor: pointer;
  transition: filter 0.25s ease;
}

.node-rect {
  transition: stroke 0.25s ease, stroke-width 0.25s ease, fill 0.25s ease;
}

/* Compound Node Styling */
.compound-header-bg {
  fill: var(--color-bg-header);
  opacity: 0.85;
}

.compound-title {
  fill: var(--color-text-bright);
  font-weight: 600;
  font-size: 13px;
  letter-spacing: 0.03em;
}

.node-badge {
  fill: var(--color-text-dimmed);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.05em;
  opacity: 0.7;
}

/* Leaf Node Styling */
.leaf-top-glow {
  stroke: var(--color-accent);
  stroke-width: 2px;
  opacity: 0.4;
}

.leaf-type-icon-bg {
  fill: var(--color-accent-dim);
  opacity: 0.3;
}

.leaf-type-icon-dot {
  fill: var(--color-accent);
}

.leaf-title {
  fill: var(--color-text-bright);
  font-weight: 500;
  font-size: 13px;
}

.node-subtitle {
  fill: var(--color-text-dimmed);
  font-size: 9px;
  font-family: monospace;
  opacity: 0.65;
}

/* Edge styling */
.edge-group {
  pointer-events: none;
}

.edge-path-bg {
  fill: none;
  stroke: transparent;
  stroke-width: 8px;
  pointer-events: stroke;
  cursor: pointer;
}

.edge-path-core {
  fill: none;
  stroke: var(--color-edge);
  stroke-width: 1.5px;
  transition: stroke 0.25s ease, stroke-width 0.25s ease;
}

.edge-path-glow {
  fill: none;
  stroke: transparent;
  stroke-width: 4px;
  opacity: 0;
  transition: opacity 0.25s ease, stroke 0.25s ease;
}

/* Hover and Active states */
.edge-group.is-active .edge-path-core {
  stroke: var(--color-accent-light);
  stroke-width: 2px;
}

.edge-group.is-active .edge-path-glow {
  stroke: var(--color-accent-glow);
  opacity: 0.35;
}

.edge-group.is-hovered .edge-path-core {
  stroke: var(--color-primary-light);
  stroke-width: 2px;
}

.edge-group.is-hovered .edge-path-glow {
  stroke: var(--color-primary-glow);
  opacity: 0.5;
}
</style>
