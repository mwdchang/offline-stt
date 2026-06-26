<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import ELK from 'elkjs/lib/elk.bundled.js';
import { presets, type ElkNode, type ElkExtendedEdge, type ElkEdgeSection } from './presets';
import GraphNode from './components/GraphNode.vue';
import { yaml2json } from './utils';
import { v4 as uuidv4 } from 'uuid';

// App States
const selectedPresetId = ref('weather_land_battery');
const colorTheme = ref('neon-purple');
const layoutDirection = ref<'RIGHT' | 'DOWN' | 'LEFT' | 'UP'>('RIGHT');
const edgeRouting = ref<'ORTHOGONAL' | 'SPLINES' | 'POLYLINE'>('ORTHOGONAL');
const spacingNodeNode = ref(35);
const spacingEdgeNode = ref(20);
const layoutPadding = ref(25);
const isLoading = ref(false);
const showGrid = ref(true);
const enableFlowAnimation = ref(true);

const rawGraphData = ref('');
const renderedGraph = ref<ElkNode | null>(null);

// Selection and Hover states
const hoveredNodeId = ref<string | null>(null);
const selectedNode = ref<ElkNode | null>(null);
const hoveredEdge = ref<ElkExtendedEdge | null>(null);

// Zoom & Pan states
const zoom = ref(1);
const panX = ref(50);
const panY = ref(50);
const isDragging = ref(false);
const dragStart = { x: 0, y: 0 };


// Compute highlighted nodes and their children
const activeNodeIds = computed<Set<string>>(() => {
  const ids = new Set<string>();
  if (hoveredNodeId.value) {
    if (renderedGraph.value) {
      const collectDescendants = (node: ElkNode): boolean => {
        if (node.id === hoveredNodeId.value) {
          const addAll = (n: ElkNode) => {
            ids.add(n.id);
            if (n.children) {
              n.children.forEach(addAll);
            }
          };
          addAll(node);
          return true;
        }
        if (node.children) {
          for (const child of node.children) {
            if (collectDescendants(child)) return true;
          }
        }
        return false;
      };
      collectDescendants(renderedGraph.value);
    }
  }
  return ids;
});

// Recursive function to apply the dashboard options down into all children nodes
function applyLayoutOptions(node: ElkNode, isRoot: boolean) {
  if (!node.layoutOptions) {
    node.layoutOptions = {};
  }

  if (isRoot) {
    node.layoutOptions['elk.algorithm'] = 'layered';
    node.layoutOptions['elk.hierarchyHandling'] = 'INCLUDE_CHILDREN';
    node.layoutOptions['elk.edgeRouting'] = edgeRouting.value;
    node.layoutOptions['elk.direction'] = layoutDirection.value;
    node.layoutOptions['elk.spacing.nodeNode'] = spacingNodeNode.value.toString();
    node.layoutOptions['elk.spacing.edgeNode'] = spacingEdgeNode.value.toString();
    node.layoutOptions['elk.padding'] = `[top=${layoutPadding.value},left=${layoutPadding.value},bottom=${layoutPadding.value},right=${layoutPadding.value}]`;
  } else if (node.children && node.children.length > 0) {
    // For inner compound nodes
    node.layoutOptions['elk.algorithm'] = 'layered';
    node.layoutOptions['elk.hierarchyHandling'] = 'INCLUDE_CHILDREN';
    node.layoutOptions['elk.edgeRouting'] = edgeRouting.value;
    node.layoutOptions['elk.direction'] = layoutDirection.value;
    
    // Inject a top padding specifically for compound header spacing if not set
    if (!node.layoutOptions['elk.padding']) {
      node.layoutOptions['elk.padding'] = '[top=45,left=20,bottom=20,right=20]';
    }
  }

  if (node.children) {
    for (const child of node.children) {
      applyLayoutOptions(child, false);
    }
  }
}

// Find a node by ID in the rendered graph and update its local reference
function refreshSelectedNode() {
  if (!selectedNode.value || !renderedGraph.value) return;
  
  const findNode = (node: ElkNode, targetId: string): ElkNode | null => {
    if (node.id === targetId) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findNode(child, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const refreshed = findNode(renderedGraph.value, selectedNode.value.id);
  if (refreshed) {
    selectedNode.value = refreshed;
  } else {
    selectedNode.value = null;
  }
}

const jsonError = ref<string | null>(null);

// Perform the ELK layout computation
function calculateLayoutSilently() {
  jsonError.value = null;
  
  try {
    const graph = JSON.parse(rawGraphData.value);
    applyLayoutOptions(graph, true);

    const elkInstance = new ELK();
    return elkInstance.layout(graph)
      .then((res: any) => {
        renderedGraph.value = res;
        refreshSelectedNode();
      })
      .catch((err: any) => {
        jsonError.value = `ELK Layout Error: ${err.message || err}`;
      });
  } catch (err: any) {
    jsonError.value = `JSON Parse Error: ${err.message}`;
  }
}

function calculateLayout() {
  isLoading.value = true;
  calculateLayoutSilently()?.finally(() => {
    isLoading.value = false;
    nextTick(() => {
      fitToScreen();
    });
  });
}


// Presets Loading
function loadPreset(id: string) {
  const preset = presets.find(p => p.id === id);
  if (preset) {
    selectedPresetId.value = id;
    selectedNode.value = null;
    hoveredNodeId.value = null;
    hoveredEdge.value = null;
    
    // Deep clone to keep presets clean from direct edits
    // const cleanGraph = JSON.parse(JSON.stringify(preset.graph));
    // rawGraphData.value = JSON.stringify(cleanGraph, null, 2);
    

    const bethuneObj = yaml2json(preset.graph);

    const rootNode: ElkNode = {
      id: bethuneObj.composition_id,
      children: [],
      edges: []
    };

    // Parse bethune's composite model scheme
    const parseBethune = (bethuneNode: any, currentNode: ElkNode, path: string) => {
      // Default place holder external variables
      currentNode.children!.push({
        id: `${path}.inputs`,
        labels: [{ text: 'Inputs' }],
        width: 80,
        height: 250,
      });

      // Normal models
      bethuneNode.nodes.forEach((n: any) => {
        if (n.composition) return;

        // Node
        currentNode.children!.push({
          id: `${path}.${n.id}`,
          labels: [{ text: n.model }],
          width: 120,
          height: 80,
        });

        // Edge
        const inputs = Object.keys(n.inputs);
        inputs.forEach((inputKey: any) => {
          const v = n.inputs[inputKey];
          if (typeof v !== 'string') {
            return;
          }
          const src = v.split('.')[0]!.replace('$', '');

          currentNode.edges!.push({
            id: uuidv4(),
            sources: [`${path}.${src}`],
            targets: [`${path}.${n.id}`]
          });
        });
      });

      // Composite models
      bethuneNode.nodes.forEach((n: any) => {
        if (n.model) return;
        
        const composite: ElkNode = {
          id: `${path}.${n.id}`,
          labels: [{ text: n.composition }],
          children: [],
          edges: []
        }
        currentNode.children!.push(composite);

        // Edge
        const inputs = Object.keys(n.inputs);
        inputs.forEach((inputKey: any) => {
          const v = n.inputs[inputKey]; 
          if (typeof v !== 'string') {
            return;
          }
          const src = v.split('.')[0]!.replace('$', '');

          currentNode.edges!.push({
            id: uuidv4(),
            sources: [`${path}.${src}`],
            targets: [`${path}.${n.id}`]
          });
        });

        // Recurse into composite models
        const nextBethuneObj = yaml2json(
          presets.find(d => d.id === n.composition)!.graph 
        );
        
        parseBethune(nextBethuneObj, composite, `${path}.${n.id}`);
      });
    };

    parseBethune(bethuneObj, rootNode, bethuneObj.composition_id);
    rawGraphData.value = JSON.stringify(rootNode, null, 2);
    calculateLayout();
  }
}

function onPresetChange(e: Event) {
  const selectEl = e.target as HTMLSelectElement;
  loadPreset(selectEl.value);
}

// Fit graph dimensions to SVG viewport bounds
function fitToScreen() {
  if (!renderedGraph.value || !renderedGraph.value.width || !renderedGraph.value.height) return;
  const svgEl = document.querySelector('.viewport-svg');
  if (!svgEl) return;

  const containerRect = svgEl.getBoundingClientRect();
  const cw = containerRect.width;
  const ch = containerRect.height;

  const gw = renderedGraph.value.width;
  const gh = renderedGraph.value.height;

  // Fit with 50px buffer spacing
  const margin = 50;
  const scaleX = (cw - margin * 2) / gw;
  const scaleY = (ch - margin * 2) / gh;
  const newZoom = Math.max(0.2, Math.min(Math.min(scaleX, scaleY), 2.0));

  zoom.value = newZoom;
  panX.value = (cw - gw * newZoom) / 2;
  panY.value = (ch - gh * newZoom) / 2;
}

function resetViewport() {
  zoom.value = 1;
  panX.value = 50;
  panY.value = 50;
  fitToScreen();
}

function zoomIn() {
  zoom.value = Math.min(zoom.value * 1.15, 5);
}

function zoomOut() {
  zoom.value = Math.max(zoom.value / 1.15, 0.15);
}

// Pointer Events for Dragging / Panning
function handlePointerDown(e: PointerEvent) {
  // Drag on left click (button 0)
  if (e.button !== 0) return;
  isDragging.value = true;
  dragStart.x = e.clientX - panX.value;
  dragStart.y = e.clientY - panY.value;
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
}

function handlePointerMove(e: PointerEvent) {
  if (!isDragging.value) return;
  panX.value = e.clientX - dragStart.x;
  panY.value = e.clientY - dragStart.y;
}

function handlePointerUp(e: PointerEvent) {
  if (!isDragging.value) return;
  isDragging.value = false;
  (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
}

// Wheel zoom anchored to mouse pointer
function handleWheel(e: WheelEvent) {
  e.preventDefault();
  const zoomFactor = 1.007;
  const oldZoom = zoom.value;
  let newZoom = oldZoom;

  if (e.deltaY < 0) {
    newZoom = Math.min(oldZoom * zoomFactor, 5);
  } else {
    newZoom = Math.max(oldZoom / zoomFactor, 0.15);
  }

  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const dx = mouseX - panX.value;
  const dy = mouseY - panY.value;

  panX.value = mouseX - dx * (newZoom / oldZoom);
  panY.value = mouseY - dy * (newZoom / oldZoom);
  zoom.value = newZoom;
}

// Helper to draw edge path sections
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

// Edge active states (for glows and dashes)
function isEdgeActive(edge: ElkExtendedEdge): boolean {
  if (activeNodeIds.value.size === 0) return false;
  return edge.sources.some(s => activeNodeIds.value.has(s)) ||
         edge.targets.some(t => activeNodeIds.value.has(t));
}

function isEdgeHovered(edge: ElkExtendedEdge): boolean {
  return hoveredNodeId.value !== null && 
         (edge.sources.includes(hoveredNodeId.value) || edge.targets.includes(hoveredNodeId.value));
}

// Helper node getters and setters
function getNodeLabel(node: ElkNode): string {
  return node.labels?.[0]?.text || node.id;
}

function updateNodeLabelFromInput(e: Event) {
  const inputEl = e.target as HTMLInputElement;
  const newLabel = inputEl.value;
  if (!selectedNode.value) return;

  try {
    const graph = JSON.parse(rawGraphData.value);
    const updateLabel = (n: any): boolean => {
      if (n.id === selectedNode.value?.id) {
        if (!n.labels) n.labels = [{}];
        n.labels[0].text = newLabel;
        return true;
      }
      if (n.children) {
        for (const child of n.children) {
          if (updateLabel(child)) return true;
        }
      }
      return false;
    };

    if (updateLabel(graph)) {
      rawGraphData.value = JSON.stringify(graph, null, 2);
      calculateLayoutSilently();
    }
  } catch (err) {
    // Ignore parse errors as user is typing
  }
}

// Hover event callbacks
function onHoverNode(id: string | null) {
  hoveredNodeId.value = id;
}

function handleSelectNode(node: ElkNode) {
  selectedNode.value = node;
}

function onHoverEdge(edge: ElkExtendedEdge | null) {
  hoveredEdge.value = edge;
}

// Helper to apply edited JSON manually
function applyJSON() {
  calculateLayout();
}

// Helper to insert spaces when pressing Tab in JSON editor
function insertTab(e: Event) {
  const textarea = e.target as HTMLTextAreaElement;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  
  textarea.value = value.substring(0, start) + '  ' + value.substring(end);
  textarea.selectionStart = textarea.selectionEnd = start + 2;
  rawGraphData.value = textarea.value;
}

onMounted(() => {
  loadPreset(selectedPresetId.value);
});
</script>

<template>
  <div class="app-container" :class="`theme-${colorTheme}`">
    <!-- Header -->
    <header class="app-header">
      <div class="header-logo">
        <div class="logo-text">
          <h1>ELK.js Canvas</h1>
          <span>Compounded Graph Layout Explorer</span>
        </div>
      </div>
      
      <div class="header-actions">
        <!-- Preset Dropdown -->
        <div class="control-group">
          <label>Preset Structure:</label>
          <select :value="selectedPresetId" @change="onPresetChange($event)">
            <option v-for="p in presets" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>

        <!-- Theme Selector -->
        <div class="control-group">
          <label>Theme Preset:</label>
          <select v-model="colorTheme">
            <option value="neon-purple">Cyber Purple</option>
            <option value="matrix-green">Matrix Green</option>
            <option value="cyber-orange">Neon Orange</option>
          </select>
        </div>

        <button class="btn btn-primary" @click="calculateLayout" :disabled="isLoading">
          <span v-if="isLoading" class="spinner"></span>
          <span>Re-Layout Graph</span>
        </button>
      </div>
    </header>

    <div class="app-body">
      <!-- Sidebar Panel -->
      <aside class="app-sidebar">
        <!-- Section 2: Layout Controls -->
        <div class="sidebar-section">
          <h3>Layout Configuration</h3>
          <div class="setting-row">
            <label>Flow Direction</label>
            <select v-model="layoutDirection" @change="calculateLayout">
              <option value="RIGHT">Left to Right →</option>
              <option value="DOWN">Top to Bottom ↓</option>
              <option value="LEFT">Right to Left ←</option>
              <option value="UP">Bottom to Top ↑</option>
            </select>
          </div>
          
          <div class="setting-row">
            <label>Edge Routing Mode</label>
            <select v-model="edgeRouting" @change="calculateLayout">
              <option value="ORTHOGONAL">Orthogonal Lines</option>
              <option value="SPLINES">Splines (Smooth)</option>
              <option value="POLYLINE">Polylines (Direct)</option>
            </select>
          </div>

          <!--
          <div class="setting-row">
            <label>Node-to-Node Spacing ({{ spacingNodeNode }}px)</label>
            <input type="range" min="15" max="80" v-model.number="spacingNodeNode" @change="calculateLayout" />
          </div>

          <div class="setting-row">
            <label>Edge-to-Node Spacing ({{ spacingEdgeNode }}px)</label>
            <input type="range" min="10" max="60" v-model.number="spacingEdgeNode" @change="calculateLayout" />
          </div>

          <div class="setting-row">
            <label>Compound Inner Padding ({{ layoutPadding }}px)</label>
            <input type="range" min="10" max="60" v-model.number="layoutPadding" @change="calculateLayout" />
          </div>
          -->
        </div>

        <!-- Section 4: Raw JSON Definition -->
        <div class="sidebar-section json-section">
          <div class="json-header">
            <h3>Raw Graph structure (JSON)</h3>
            <button class="btn btn-sm btn-secondary" @click="applyJSON">Apply Code</button>
          </div>
          <textarea v-model="rawGraphData" class="json-textarea" @keydown.tab.prevent="insertTab($event)"></textarea>
          <div v-if="jsonError" class="json-error-banner">
            {{ jsonError }}
          </div>
        </div>
      </aside>

      <!-- Canvas Render Area -->
      <main class="app-canvas-container">
        <!-- Viewport Controls -->
        <div class="canvas-controls">
          <button @click="zoomIn" title="Zoom In">＋</button>
          <button @click="zoomOut" title="Zoom Out">－</button>
          <button @click="fitToScreen" title="Fit View to Screen">⛶</button>
          <button @click="resetViewport" title="Reset Viewport Position">⟲</button>
          <div class="zoom-indicator">{{ Math.round(zoom * 100) }}%</div>
        </div>

        <!-- Float settings controls -->
        <div class="canvas-settings">
          <label>
            <input type="checkbox" v-model="showGrid" /> Draw Grid
          </label>
          <label>
            <input type="checkbox" v-model="enableFlowAnimation" /> Edge Flow Animations
          </label>
        </div>

        <!-- Canvas Frame -->
        <div
          class="canvas-viewport"
          :class="{ 'is-dragging': isDragging, 'has-grid': showGrid }"
          @pointerdown="handlePointerDown"
          @pointermove="handlePointerMove"
          @pointerup="handlePointerUp"
          @wheel="handleWheel"
        >
          <!-- SVG Rendering Layer -->
          <svg
            v-if="renderedGraph"
            class="viewport-svg"
            width="100%"
            height="100%"
          >
            <!-- Defs for arrow markers, gradients, and grids -->
            <defs>
              <!-- Arrow head marker for default lines -->
              <marker
                id="arrow-head"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" class="marker-path-default" />
              </marker>

              <!-- Arrow head marker for active/highlighted lines -->
              <marker
                id="arrow-head-active"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" class="marker-path-active" />
              </marker>

              <!-- Arrow head marker for hovered lines -->
              <marker
                id="arrow-head-hovered"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" class="marker-path-hovered" />
              </marker>

              <!-- Background Grid Pattern -->
              <pattern id="grid-pattern" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" class="grid-line" />
              </pattern>
            </defs>

            <!-- Render the interactive mesh grid background -->
            <rect v-if="showGrid" width="100%" height="100%" fill="url(#grid-pattern)" style="pointer-events: none;" />

            <!-- Main Transformed Contents Group -->
            <g :transform="`translate(${panX}, ${panY}) scale(${zoom})`" class="viewport-content-group">
              <!-- Render child nodes recursively -->
              <GraphNode
                v-for="child in renderedGraph.children"
                :key="child.id"
                :node="child"
                :active-node-ids="activeNodeIds"
                :hovered-node-id="hoveredNodeId"
                :selected-node-id="selectedNode ? selectedNode.id : null"
                @hover-node="onHoverNode"
                @select-node="handleSelectNode"
              />

              <!-- Render root-level edges -->
              <g v-if="renderedGraph.edges && renderedGraph.edges.length > 0" class="root-edges">
                <g
                  v-for="edge in renderedGraph.edges"
                  :key="edge.id"
                  class="edge-group"
                  :class="{
                    'is-active': isEdgeActive(edge),
                    'is-hovered': isEdgeHovered(edge),
                    'enable-animation': enableFlowAnimation
                  }"
                  @mouseenter="onHoverEdge(edge)"
                  @mouseleave="onHoverEdge(null)"
                >
                  <!-- Thick hover receiver -->
                  <path
                    v-for="section in edge.sections"
                    :key="'bg-' + section.id"
                    :d="getSectionPath(section)"
                    class="edge-path-bg"
                  />
                  <!-- Underlay glowing laser line -->
                  <path
                    v-for="section in edge.sections"
                    :key="'glow-' + section.id"
                    :d="getSectionPath(section)"
                    class="edge-path-glow"
                  />
                  <!-- Inner core layout line -->
                  <path
                    v-for="section in edge.sections"
                    :key="'core-' + section.id"
                    :d="getSectionPath(section)"
                    class="edge-path-core"
                    :marker-end="isEdgeHovered(edge) ? 'url(#arrow-head-hovered)' : (isEdgeActive(edge) ? 'url(#arrow-head-active)' : 'url(#arrow-head)')"
                  />
                </g>
              </g>
            </g>
          </svg>
        </div>
      </main>
    </div>
  </div>
</template>

<style>
/* Global Resets & Theme Definitions */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  margin: 0;
  background-color: #07090e;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}

:root {
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-title: 'Outfit', var(--font-sans);
  --font-mono: 'Fira Code', monospace;
  
  --color-bg-dark: #06090e;
  --color-panel-border: rgba(255, 255, 255, 0.08);
  --color-panel-bg: rgba(13, 17, 28, 0.7);
  --color-panel-bg-solid: #0d111c;
}

/* Neon Cyber-Purple Theme variables */
.theme-neon-purple {
  --color-primary: #a855f7;
  --color-primary-light: #c084fc;
  --color-primary-glow: rgba(168, 85, 247, 0.4);
  
  --color-accent: #06b6d4;
  --color-accent-light: #22d3ee;
  --color-accent-glow: rgba(6, 182, 212, 0.4);
  --color-accent-dim: rgba(6, 182, 212, 0.1);
  
  --color-edge: #475569;
  --color-border-compound: rgba(168, 85, 247, 0.35);
  --color-border-leaf: rgba(71, 85, 105, 0.6);
  
  --color-bg-compound: rgba(22, 17, 36, 0.7);
  --color-bg-header: rgba(36, 26, 56, 0.95);
  --color-bg-leaf: rgba(15, 23, 42, 0.9);
  
  --color-text-bright: #f8fafc;
  --color-text-dimmed: #cccccc;
}

/* Matrix Code-Green Theme variables */
.theme-matrix-green {
  --color-primary: #10b981;
  --color-primary-light: #34d399;
  --color-primary-glow: rgba(16, 185, 129, 0.4);
  
  --color-accent: #eab308;
  --color-accent-light: #fde047;
  --color-accent-glow: rgba(234, 179, 8, 0.4);
  --color-accent-dim: rgba(234, 179, 8, 0.1);
  
  --color-edge: #334155;
  --color-border-compound: rgba(16, 185, 129, 0.35);
  --color-border-leaf: rgba(71, 85, 105, 0.6);
  
  --color-bg-compound: rgba(11, 26, 19, 0.7);
  --color-bg-header: rgba(16, 38, 28, 0.95);
  --color-bg-leaf: rgba(13, 21, 18, 0.9);
  
  --color-text-bright: #f1f5f9;
  --color-text-dimmed: #cccccc;
}

/* Cyber Neon-Orange Theme variables */
.theme-cyber-orange {
  --color-primary: #f97316;
  --color-primary-light: #fb923c;
  --color-primary-glow: rgba(249, 115, 22, 0.4);
  
  --color-accent: #ec4899;
  --color-accent-light: #f472b6;
  --color-accent-glow: rgba(236, 72, 153, 0.4);
  --color-accent-dim: rgba(236, 72, 153, 0.15);
  
  --color-edge: #475569;
  --color-border-compound: rgba(249, 115, 22, 0.35);
  --color-border-leaf: rgba(71, 85, 105, 0.6);
  
  --color-bg-compound: rgba(35, 19, 14, 0.7);
  --color-bg-header: rgba(54, 27, 19, 0.95);
  --color-bg-leaf: rgba(24, 16, 16, 0.9);
  
  --color-text-bright: #ffffff;
  --color-text-dimmed: #cccccc;
}

/* Main Layout */
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background-color: var(--color-bg-dark);
  font-family: var(--font-sans);
  color: var(--color-text-bright);
  overflow: hidden;
  transition: background-color 0.3s ease;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  background-color: var(--color-panel-bg-solid);
  border-bottom: 1px solid var(--color-panel-border);
  z-index: 100;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.header-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 28px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 6px var(--color-primary-glow));
}

.logo-text h1 {
  font-family: var(--font-title);
  font-size: 19px;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.02em;
  background: linear-gradient(180deg, #fff, #b4c2d3);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.logo-text span {
  font-size: 10px;
  color: var(--color-text-dimmed);
  opacity: 0.7;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-group label {
  font-size: 11px;
  color: var(--color-text-dimmed);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.control-group select {
  background-color: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--color-panel-border);
  color: var(--color-text-bright);
  padding: 7px 12px;
  border-radius: 6px;
  font-size: 12px;
  outline: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.control-group select:hover {
  background-color: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.control-group select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-glow);
}

/* Buttons */
.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.btn-primary {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  color: #07090e;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.btn-primary:hover {
  filter: brightness(1.15);
  transform: translateY(-1px);
  box-shadow: 0 0 15px var(--color-primary-glow);
}

.btn-secondary {
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--color-text-bright);
  border: 1px solid var(--color-panel-border);
}

.btn-secondary:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.15);
}

.btn-sm {
  padding: 4px 8px;
  font-size: 10px;
  border-radius: 4px;
}

/* Sidebar structure */
.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.app-sidebar {
  width: 330px;
  background-color: var(--color-panel-bg-solid);
  border-right: 1px solid var(--color-panel-border);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 20px;
  gap: 20px;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--color-panel-border);
}

.sidebar-section h3 {
  font-family: var(--font-title);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-dimmed);
  margin: 0;
  opacity: 0.8;
}

.preset-description {
  font-size: 12px;
  color: var(--color-text-dimmed);
  line-height: 1.5;
  margin: 0;
  opacity: 0.8;
}

.setting-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.setting-row label {
  font-size: 10px;
  color: var(--color-text-dimmed);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.setting-row select {
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--color-panel-border);
  color: var(--color-text-bright);
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  outline: none;
  cursor: pointer;
  transition: all 0.2s;
}

.setting-row select:focus {
  border-color: var(--color-primary);
}

.setting-row input[type="range"] {
  accent-color: var(--color-primary);
  width: 100%;
  cursor: pointer;
}

/* Inspector Details styling */
.inspector-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: rgba(255, 255, 255, 0.015);
  border: 1px solid var(--color-panel-border);
  padding: 14px;
  border-radius: 8px;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.2);
}

.inspector-badge {
  align-self: flex-start;
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  background-color: var(--color-accent-glow);
  color: var(--color-accent-light);
  padding: 3px 8px;
  border-radius: 4px;
  letter-spacing: 0.05em;
}

.inspector-badge.compound-badge {
  background-color: var(--color-primary-glow);
  color: var(--color-primary-light);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.detail-label {
  color: var(--color-text-dimmed);
  opacity: 0.75;
}

.detail-val {
  font-weight: 500;
}

.monospace {
  font-family: var(--font-mono);
  font-size: 11px;
  background-color: rgba(255, 255, 255, 0.04);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.03);
}

.inspector-input {
  background-color: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--color-panel-border);
  color: var(--color-text-bright);
  padding: 5px 8px;
  border-radius: 4px;
  font-size: 12px;
  width: 140px;
  outline: none;
  transition: all 0.2s;
}

.inspector-input:focus {
  border-color: var(--color-primary);
  background-color: rgba(255, 255, 255, 0.08);
}

.inspector-placeholder {
  font-size: 11px;
  color: var(--color-text-dimmed);
  text-align: center;
  padding: 24px 10px;
  opacity: 0.55;
  line-height: 1.4;
}

/* Code area */
.json-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-bottom: none;
  min-height: 220px;
}

.json-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.json-textarea {
  flex: 1;
  background-color: #030509;
  border: 1px solid var(--color-panel-border);
  border-radius: 8px;
  color: #e2e8f0;
  font-family: var(--font-mono);
  font-size: 10px;
  line-height: 1.5;
  padding: 10px;
  resize: none;
  outline: none;
  transition: border-color 0.2s ease;
}

.json-textarea:focus {
  border-color: var(--color-primary);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.4);
}

.json-error-banner {
  background-color: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #fca5a5;
  font-size: 10px;
  font-family: var(--font-mono);
  padding: 8px 12px;
  border-radius: 6px;
  line-height: 1.4;
  word-break: break-all;
  margin-top: 4px;
}

/* Canvas viewport */
.app-canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background-color: #070a0e;
}

.canvas-viewport {
  flex: 1;
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  cursor: grab;
}

.canvas-viewport.is-dragging {
  cursor: grabbing;
}

.viewport-svg {
  display: block;
}

/* Grid drawing */
.grid-line {
  stroke: rgba(255, 255, 255, 0.015);
  stroke-width: 1.2px;
}

/* Controls */
.canvas-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  z-index: 10;
  background-color: rgba(9, 13, 22, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid var(--color-panel-border);
  padding: 6px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.canvas-controls button {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--color-panel-border);
  color: var(--color-text-bright);
  font-size: 15px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.2s ease;
}

.canvas-controls button:hover {
  background-color: var(--color-primary);
  color: #000;
  border-color: var(--color-primary);
  box-shadow: 0 0 10px var(--color-primary-glow);
}

.zoom-indicator {
  font-size: 9px;
  text-align: center;
  color: var(--color-text-dimmed);
  font-weight: 700;
  margin-top: 4px;
  font-family: var(--font-mono);
}

.canvas-settings {
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  gap: 15px;
  z-index: 10;
  background-color: rgba(9, 13, 22, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid var(--color-panel-border);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 11px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.canvas-settings label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: var(--color-text-dimmed);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.canvas-settings input[type="checkbox"] {
  accent-color: var(--color-primary);
  cursor: pointer;
}

.compound-indicator {
  background-color: var(--color-bg-compound);
  border: 1.5px solid var(--color-border-compound);
  box-shadow: 0 0 4px var(--color-primary-glow);
}

.leaf-indicator {
  background-color: var(--color-bg-leaf);
  border: 1.5px solid var(--color-border-leaf);
  box-shadow: 0 0 4px var(--color-accent-glow);
}

.edge-indicator {
  background-color: var(--color-edge);
  height: 2px;
  width: 16px;
  border-radius: 0;
}

.flow-indicator {
  background-color: var(--color-accent-light);
  height: 2px;
  width: 16px;
  border-radius: 0;
  box-shadow: 0 0 6px var(--color-accent-glow);
}

/* Edge elements */
.root-edges {
  pointer-events: none;
}

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
  transition: stroke 0.25s, stroke-width 0.25s;
}

.edge-path-glow {
  fill: none;
  stroke: transparent;
  stroke-width: 4px;
  opacity: 0;
  transition: opacity 0.25s, stroke 0.25s;
}

/* Hover/Active states */
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

/* Edge flow animation keyframes and classes */
@keyframes edgeFlowAnim {
  to {
    stroke-dashoffset: -20;
  }
}

.edge-group.enable-animation.is-active .edge-path-core,
.edge-group.enable-animation.is-hovered .edge-path-core {
  stroke-dasharray: 6, 4;
  animation: edgeFlowAnim 1s linear infinite;
}
</style>
