<script lang='ts'>
	import { c, k, w, Rect, Point, debug, T_Layer, signals, T_GraphMode } from '../../ts/common/Global_Imports';
	import { w_graph_rect, w_t_graphMode, w_ancestry_focus } from '../../ts/common/Stores';
	import { w_device_isMobile, w_user_graph_offset } from '../../ts/common/Stores';
	import Radial_Graph from '../radial/Radial_Graph.svelte';
	import Tree_Graoh from '../tree/Tree_Graoh.svelte';
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
			rebuild();
		});
		return () => { handle_rebuild.disconnect() };
	});

	$: {
		const _ = $w_ancestry_focus;
		rebuild();
	}

	$: {
		draggableRect = $w_graph_rect.offsetByY(-9);
		update_style();
		rebuild();
	}

	$: {
		const _ = $w_device_isMobile;
		setTimeout(() => {
			update_style();
		}, 1);
	}

	function rebuild() { graph_rebuilds += 1; }
	
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
		{#if $w_t_graphMode == T_GraphMode.radial}
			<Radial_Graph/>
		{:else}
			<Tree_Graoh/>
		{/if}
	</div>
{/key}