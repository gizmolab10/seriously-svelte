<script lang='ts'>
	import { T_Tool, T_Layer, T_Signal, T_RingZone, T_Element, T_Rebuild } from '../../ts/common/Global_Imports';
	import { w_graph_rect, w_show_details, w_ancestry_focus } from '../../ts/common/Stores';
	import { k, u, ux, Rect, Point, debug, signals } from '../../ts/common/Global_Imports';
	import { w_user_graph_offset, w_thing_fontFamily } from '../../ts/common/Stores';
	import Radial_Necklace from './Radial_Necklace.svelte';
	import Radial_Rings from './Radial_Rings.svelte';
	import Radial_Focus from './Radial_Focus.svelte';
	import { onMount } from 'svelte';
	let toolsOffset = new Point(31, -173.5).offsetBy($w_user_graph_offset.negated);

	//////////////////////////////////////////
	//										//
	//	REBUILDS components on/changes to:	//
	//										//
	//		rebuild_needed_forType radial	//
	//		handle_recreate_widgets			//
	//		w_ancestry_focus				//
	//										//
	//	SHOULD only reposition for:			//
	//										//
	//		w_user_graph_offset				//
	//		w_show_details					//
	//		w_graph_rect					//
	//										//
	//////////////////////////////////////////

	// draw center title, arcs, radial and widget necklace
	//	also selection & hover for arcs & radial

	// needs:
	//	handle keys
	//	edit titles (keydown terminates edit) BROKEN
	//	displays editing tools when asked by user
	
	ux.relayout_all();
	debug.log_tools(` CLUSTERS`);

	onMount(() => {
		const handle_recreate = signals.handle_recreate_widgets(0, (t_signal, ancestry) => {
			ux.require_rebuild_forType(T_Rebuild.radial);		// triggers {#key} below
		});
		return () => { handle_recreate.disconnect() };
	});

</script>

{#key ux.readOnce_rebuild_needed_forType(T_Rebuild.radial), $w_ancestry_focus.hashedAncestry}
	<div class = 'radial-graph'
		style = '
			z-index : {T_Layer.backmost};
			width : {$w_graph_rect.size.width}px;
			height : {$w_graph_rect.size.height}px;
			transform : translate({$w_user_graph_offset.x}px, {$w_user_graph_offset.y}px);'>
		<Radial_Rings/>
		<Radial_Focus/>
		<Radial_Necklace/>
	</div>
{/key}
