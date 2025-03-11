<script lang='ts'>
	import { T_Tool, T_Layer, T_RingZone, T_Element, T_Rebuild, G_RadialGraph } from '../../ts/common/Global_Imports';
	import { w_graph_rect, w_show_details, w_ancestry_focus } from '../../ts/common/Stores';
	import { k, u, ux, Rect, Point, debug, signals } from '../../ts/common/Global_Imports';
	import { w_user_graph_offset, w_thing_fontFamily } from '../../ts/common/Stores';
	import Radial_Necklace from './Radial_Necklace.svelte';
	import Circle from '../kit/Circle.svelte';
	import Radial_Focus from './Radial_Focus.svelte';
	import Radial_UX from './Radial_UX.svelte';
	import { onMount } from 'svelte';
	let toolsOffset = new Point(31, -173.5).offsetBy($w_user_graph_offset.negated);

	// draw center title, arcs, radial and widget necklace
	//	also selection & hover for arcs & radial

	// needs:
	//	handle keys
	//	edit titles (keydown terminates edit) BROKEN
	//	displays editing tools when asked by user
	
	ux.relayout_all();
	debug.log_tools(` CLUSTERS (svelte)`);

	onMount(() => {
		const handler = signals.handle_recreate_widgets(0, (ancestry) => {
			ux.require_rebuild_forType(T_Rebuild.radial);
		});
		return () => { handler.disconnect() };
	});

	
	$: {
		const _ = $w_show_details;
		setTimeout(() => {
			ux.require_rebuild_forType(T_Rebuild.radial);
		}, 100);
	}

</script>

{#key ux.readOnce_rebuild_needed_forType(T_Rebuild.radial), $w_ancestry_focus.hashedAncestry}
	<div class = 'radial-graph'
		style = '
			z-index : {T_Layer.backmost};
			width : {$w_graph_rect.size.width}px;
			height : {$w_graph_rect.size.height}px;
			transform : translate({$w_user_graph_offset.x}px, {$w_user_graph_offset.y}px);'>
		<Radial_UX/>
		<Radial_Focus/>
		<Radial_Necklace/>
	</div>
{/key}
