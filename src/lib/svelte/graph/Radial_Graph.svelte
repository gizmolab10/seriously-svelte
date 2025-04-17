<script lang='ts'>
	import { k, u, ux, Rect, Point, debug, layout, signals } from '../../ts/common/Global_Imports';
	import { w_s_paging, w_user_graph_offset, w_thing_fontFamily } from '../../ts/common/Stores';
	import { w_graph_rect, w_show_details, w_ancestry_focus } from '../../ts/common/Stores';
	import { T_Tool, T_Layer, T_Signal, T_RingZone } from '../../ts/common/Global_Imports';
	import Radial_Rings from './Radial_Rings.svelte';
	import Radial_Focus from './Radial_Focus.svelte';
	import Widget from '../widget/Widget.svelte';
	import { onMount } from 'svelte';
	let toolsOffset = new Point(31, -173.5).offsetBy($w_user_graph_offset.negated);
	let graph_reattachments = 0;

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
	//		w_show_details						//
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
			graph_reattachments += 1;		// triggers {#key} below
		});
		return () => { handle_recreate.disconnect() };
	});

	$: {
		const s_paging = $w_s_paging;
		if (!!s_paging && !!$w_ancestry_focus.thing && $w_ancestry_focus.thing.id == s_paging.thing_id) {
			graph_reattachments += 1;
		}
	}

</script>

{#key graph_reattachments}
	<div class = 'radial-graph'
		style = '
			z-index : {T_Layer.common};
			width : {$w_graph_rect.size.width}px;
			height : {$w_graph_rect.size.height}px;
			transform : translate({$w_user_graph_offset.x}px, {$w_user_graph_offset.y}px);'>
		<Radial_Rings/>
		<Radial_Focus/>
		<div
			class = 'necklace-widgets'
			style = 'z-index : {T_Layer.necklace};'>
			{#each layout.g_radialGraph.g_necklace_widgets as g_necklace_widget}
				<Widget ancestry = {g_necklace_widget.ancestry}/>
			{/each}
		</div>
	</div>
{/key}
