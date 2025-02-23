<script lang='ts'>
	import { g, k, w, Rect, Point, debug, T_Layer, signals, T_Graph } from '../../ts/common/Global_Imports';
	import { w_graph_rect, w_t_graph, w_ancestry_focus } from '../../ts/state/S_Stores';
	import { w_device_isMobile, w_user_graph_offset } from '../../ts/state/S_Stores';
	import Radial_Graph from '../radial/Radial_Graph.svelte';
	import Tree_Graph from '../tree/Tree_Graph.svelte';
	import { onMount } from 'svelte';
	let draggableRect: Rect | null = null;
	let style = k.empty;
	let rebuilds = 0;
	let draggable;
	
	onMount(() => {
		update_style();
		const handler = signals.handle_rebuildGraph(1, (ancestry) => {
			debug.log_mount(` rebuild GRAPH`);
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
		{#if $w_t_graph == T_Graph.radial}
			<Radial_Graph/>
		{:else}
			<Tree_Graph/>
		{/if}
	</div>
{/key}