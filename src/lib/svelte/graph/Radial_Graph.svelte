<script lang='ts'>
	import { k, u, ux, Rect, Point, debug, layout, signals } from '../../ts/common/Global_Imports';
	import { w_g_paging, w_user_graph_offset, w_thing_fontFamily } from '../../ts/common/Stores';
	import { T_Layer, T_Signal, T_RingZone } from '../../ts/common/Global_Imports';
	import { w_graph_rect, w_ancestry_focus } from '../../ts/common/Stores';
	import Radial_Rings from './Radial_Rings.svelte';
	import Radial_Focus from './Radial_Focus.svelte';
	import Widget from '../widget/Widget.svelte';
	import { onMount } from 'svelte';
	let toolsOffset = new Point(31, -173.5).offsetBy($w_user_graph_offset.negated);
	let necklace_reattachments = 0;

	//////////////////////////////////////////////
	//											//
	//	reattaches components on/changes to:	//
	//											//
	//		rebuild_needed_forType radial		//
	//		handle_reattach_widgets				//
	//		w_ancestry_focus					//
	//											//
	//	SHOULD only reposition for:				//
	//											//
	//		w_user_graph_offset					//
	//		w_graph_rect						//
	//											//
	//////////////////////////////////////////////

	// draw center title, arcs, radial and widget necklace
	//	also selection & hover for arcs & radial

	// needs:
	//	handle keys
	//	edit titles (keydown terminates edit) BROKEN
	//	displays editing tools when asked by user
	
	layout.grand_layout();
	debug.log_tools(` CLUSTERS`);

	onMount(() => {
		const handle_recreate = signals.handle_reattach_widgets(0, (t_signal, ancestry) => {
			necklace_reattachments += 1;		// triggers {#key} below
		});
		const handle_reposition = signals.handle_reposition_widgets(2, (received_ancestry) => {
			necklace_reattachments += 1;
		});
		return () => { handle_reposition.disconnect(); handle_recreate.disconnect() };
	});

	$: {
		const g_paging = $w_g_paging;
		if (!!g_paging && !!$w_ancestry_focus.thing && $w_ancestry_focus.thing.id == g_paging.thing_id) {
			necklace_reattachments += 1;
		}
	}

</script>

<div class = 'radial-graph'
	style = '
		z-index : {T_Layer.common};
		width : {$w_graph_rect.size.width}px;
		height : {$w_graph_rect.size.height}px;
		transform : translate({$w_user_graph_offset.x}px, {$w_user_graph_offset.y}px);'>
	<Radial_Rings/>
	<Radial_Focus/>
	{#key necklace_reattachments}
		<div
			class = 'necklace-widgets'
			style = 'z-index : {T_Layer.necklace};'>
			{#each layout.g_radialGraph.g_necklace_widgets as g_necklace_widget}
				<Widget ancestry = {g_necklace_widget.ancestry}/>
			{/each}
		</div>
	{/key}
</div>
