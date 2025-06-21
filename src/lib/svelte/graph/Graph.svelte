<script lang='ts'>
	import { c, k, Rect, debug, layout, T_Layer, signals, T_Graph } from '../../ts/common/Global_Imports';
	import { w_graph_rect, w_show_graph_ofType, w_ancestry_focus, w_user_graph_offset } from '../../ts/common/Stores';
	import { w_device_isMobile } from '../../ts/common/Stores';
	import Radial_Graph from '../graph/Radial_Graph.svelte';
	import Tree_Graph from '../graph/Tree_Graph.svelte';
	import { onMount } from 'svelte';
	let draggableRect = $w_graph_rect;
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
			layoutAnd_reattach();
		});
		return () => { handle_rebuild.disconnect(); };
	});

	$:	$w_show_graph_ofType,
		$w_device_isMobile,
		$w_ancestry_focus,
		layoutAnd_reattach();

	$:	$w_graph_rect, update_style();

	function layoutAnd_reattach() {
		layout.grand_layout();
		graph_reattachments += 1;
	}
		
	function update_style() {
		draggableRect = $w_graph_rect;
		style=`
			overflow: hidden;
			touch-action: none;
			position: absolute;
			pointer-events: auto;
			z-index: ${T_Layer.common};
			top:${draggableRect.origin.y}px;
			width: ${draggableRect.size.width}px;
			height: ${draggableRect.size.height}px;
		`.removeWhiteSpace();
		graph_reattachments += 1;
	}

</script>

{#key graph_reattachments}
	<div
		style={style}
		class='draggable'
		bind:this={draggable}>
		{#if $w_show_graph_ofType == T_Graph.radial}
			<Radial_Graph/>
		{:else}
			<Tree_Graph/>
		{/if}
	</div>
{/key}