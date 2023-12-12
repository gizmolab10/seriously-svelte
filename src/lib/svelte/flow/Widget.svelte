<script lang="ts">
	import { SvelteFlow, type Node, type Edge, type NodeProps } from '@xyflow/svelte';
	import TitleEditor from './TitleEditor.svelte';
	import { writable } from 'svelte/store';
	import DragDot from './DragDot.svelte';
	import '@xyflow/svelte/dist/style.css';
  export let id = '';
  export let data = 0;
  export let type = '';
  export let width = 0;
  export let height = 0;
  export let zIndex = 0;
  export let dragging = 0;
  export let selected = 0;
  export let dragHandle = 0;
  export let isConnectable = 0;
  export let sourcePosition = 0;
  export let targetPosition = 0;
  export let positionAbsolute = 0;
  type $$Props = NodeProps;

  const nodeTypes = {
    'dragDot': DragDot,
    'titleEditor': TitleEditor
  };

  const nodes = writable([
    {
      id: '3',
      type: 'dragDot',
      data: { label: 'drag dot' },
      position: { x: 200, y: 200 },
      dragHandle: '.widget-drag-dot',
      style: 'padding: 20px 20px; background: white;',
    },
    {
      id: '4',
      type: 'titleEditor',
      data: { label: 'title' },
      position: { x: 240, y: 200 },
      style: 'padding: 20px 20px; background: white;',
    },
  ]);

  const edges = writable<Edge[]>([]);
</script>

<div style="height:100vh">
  <SvelteFlow {nodes} {edges} {nodeTypes}>
  </SvelteFlow>
</div>
