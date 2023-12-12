<script lang="ts">
  import { type NodeProps } from '@xyflow/svelte';
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
</script>

<style>
  .dragDot {
    width: 25px;
    height: 25px;
    margin-top: 3px;
    border-radius: 50%;
    display: inline-block;
    background-color: teal;
  }
</style>

<div class='drag'>
  <span class='dragDot widget-drag-dot' />
</div>
