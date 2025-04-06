<script lang='ts'>
	import { c, k, w, Rect, Point, debug, layouts, T_Layer, signals, T_Graph } from '../../ts/common/Global_Imports';
	import { w_graph_rect, w_t_graph, w_ancestry_focus } from '../../ts/common/Stores';
	import { w_device_isMobile, w_user_graph_offset } from '../../ts/common/Stores';
	import Radial_Graph from '../radial/Radial_Graph.svelte';
	import Tree_Graph from '../tree/Tree_Graph.svelte';
	import { onMount } from 'svelte';
	let draggableRect: Rect | null = null;
	let graph_rebuilds = 0;
	let style = k.empty;
	let draggable;

	//////////////////////////////////////////
	//										//
	//	REBUILDS components on/changes to:	//
	//										//
	//		signal_rebuildGraph				//
	//		w_ancestry_focus				//
	//										//
	//	SHOULD only reposition for:			//
	//										//
	//		w_user_graph_offset				//
	//		w_graph_rect					//
	//										//
	//////////////////////////////////////////
	
	onMount(() => {
		update_style();
		const handle_rebuild = signals.handle_rebuildGraph(1, (ancestry) => {
			layouts.grand_layout();
			graph_rebuilds += 1;
		});
		return () => { handle_rebuild.disconnect(); };
	});

	$: {
		const _ = $w_ancestry_focus;
		graph_rebuilds += 1;
	}

	$: {
		draggableRect = $w_graph_rect.offsetByY(-9);
		update_style();
		graph_rebuilds += 1;
	}

	$: {
		const _ = $w_device_isMobile;
		setTimeout(() => {
			update_style();
		}, 1);
	}
	
	$: {
		const _ = $w_graph_rect + $w_ancestry_focus + $w_device_isMobile + $w_t_graph;
		layouts.grand_layout();
	}
	
	function update_style() {
		style=`
			overflow: hidden;
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

{#key graph_rebuilds}
	<div
		style={style}
		class='draggable'
		bind:this={draggable}>
		{#if $w_t_graph == T_Graph.radial}
			<Radial_Graph/>
		{:else}
			<Tree_Graph/>
		{/if}
	</div>
{/key}