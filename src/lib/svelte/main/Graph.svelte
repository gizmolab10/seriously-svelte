<script lang='ts'>
	import { c, k, w, Rect, Point, debug, T_Layer, signals, T_GraphMode } from '../../ts/common/Global_Imports';
	import { w_graph_rect, w_t_graphMode, w_ancestry_focus } from '../../ts/common/Stores';
	import { w_device_isMobile, w_user_graph_offset } from '../../ts/common/Stores';
	import Radial_Graph from '../radial/Radial_Graph.svelte';
	import Tree_Graoh from '../tree/Tree_Graoh.svelte';
	import { onMount } from 'svelte';
	let draggableRect: Rect | null = null;
	let style = k.empty;
	let rebuilds = 0;
	let draggable;
	
	onMount(() => {
		update_style();
		const handler = signals.handle_rebuildGraph(1, (ancestry) => {
			debug.log_mount(`GRAPH ${ancestry.title}`);
			rebuilds += 1;
		});
		return () => { handler.disconnect() };
	});

	$: {
		const _ = $w_user_graph_offset;
		rebuilds += 1;
	}

	$: {
		draggableRect = $w_graph_rect.offsetByY(-9);
		debug.log_action(` draggable ${draggableRect.description}`);
		update_style();
		rebuilds += 1;
	}

	$: {
		const _ = $w_device_isMobile;
		setTimeout(() => {
			update_style();
		}, 1);
	}
	
	function update_style() {
		style=`
			overflow: hidden;
			position: absolute;
			touch-action: none;
			pointer-events: auto;
			z-index: ${T_Layer.backmost};
			top:${draggableRect.origin.y}px;
			width: ${draggableRect.size.width}px;
			height: ${draggableRect.size.height}px;
		`.removeWhiteSpace();
	}

</script>

{#key $w_ancestry_focus, rebuilds}
	<div class='draggable'
		bind:this={draggable}
		style={style}>
		{#if $w_t_graphMode == T_GraphMode.radial}
			<Radial_Graph/>
		{:else}
			<Tree_Graoh/>
		{/if}
	</div>
{/key}