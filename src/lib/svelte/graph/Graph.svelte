<script lang='ts'>
	import { c, k, Rect, debug, layout, T_Layer, signals, T_Graph } from '../../ts/common/Global_Imports';
	import { w_graph_rect, w_show_graph_ofType, w_ancestry_focus } from '../../ts/common/Stores';
	import { w_device_isMobile } from '../../ts/common/Stores';
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

	$: $w_ancestry_focus, graph_reattachments += 1;
	$: $w_graph_rect, $w_ancestry_focus, $w_device_isMobile, $w_show_graph_ofType, layout.grand_layout();

	$: {
		draggableRect = $w_graph_rect;
		update_style();
		graph_reattachments += 1;
	}

	$: $w_device_isMobile,
		setTimeout(() => {
			update_style();
		}, 1);
		
	function update_style() {
		style=`
			overflow: auto;
			position: absolute;
			touch-action: none;
			pointer-events: auto;
			z-index: ${T_Layer.common};
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
		{#if $w_show_graph_ofType == T_Graph.radial}
			<Radial_Graph/>
		{:else}
			<Tree_Graph/>
		{/if}
	</div>
{/key}