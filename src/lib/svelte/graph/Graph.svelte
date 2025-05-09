<script lang='ts'>
	import { c, k, w, Rect, Point, debug, layout, E_Layer, signals, E_Graph } from '../../ts/common/Global_Imports';
	import { w_graph_rect, w_e_graph, w_ancestry_focus } from '../../ts/common/Stores';
	import { w_device_isMobile, w_user_graph_offset } from '../../ts/common/Stores';
	import Radial_Graph from '../graph/Radial_Graph.svelte';
	import Tree_Graph from '../graph/Tree_Graph.svelte';
	import { onMount } from 'svelte';
	let draggableRect: Rect | null = null;
	let graph_reattachments = 0;
	let style = k.empty;
	let draggable;

	//////////////////////////////////////////////
	//											//
	//	reattaches components on/changes to:	//
	//											//
	//		signal_rebuildGraph					//
	//		w_ancestry_focus					//
	//											//
	//	SHOULD only reposition for:				//
	//											//
	//		w_user_graph_offset					//
	//		w_graph_rect						//
	//											//
	/////////////////////////////////////////////
	
	onMount(() => {
		update_style();
		const handle_rebuild = signals.handle_rebuildGraph(1, (ancestry) => {
			layout.grand_layout();
			graph_reattachments += 1;
		});
		return () => { handle_rebuild.disconnect(); };
	});

	$: {
		const _ = $w_ancestry_focus;
		graph_reattachments += 1;
	}

	$: {
		draggableRect = $w_graph_rect;
		update_style();
		graph_reattachments += 1;
	}

	$: {
		const _ = $w_device_isMobile;
		setTimeout(() => {
			update_style();
		}, 1);
	}
	
	$: {
		const _ = $w_graph_rect + $w_ancestry_focus + $w_device_isMobile + $w_e_graph;
		layout.grand_layout();
	}
	
	function update_style() {
		style=`
			overflow: hidden;
			position: absolute;
			touch-action: none;
			pointer-events: auto;
			z-index: ${E_Layer.common};
			top:${draggableRect.origin.y}px;
			width: ${draggableRect.size.width}px;
			height: ${draggableRect.size.height}px;
		`.removeWhiteSpace();
	}

</script>

{#key graph_reattachments}
	<div
		style={style}
		class='draggable'
		bind:this={draggable}>
		{#if $w_e_graph == E_Graph.radial}
			<Radial_Graph/>
		{:else}
			<Tree_Graph/>
		{/if}
	</div>
{/key}