<script lang='ts'>
	import { signals, T_RingZone, T_Element, T_Rebuild, G_Radial } from '../../ts/common/Global_Imports';
	import { g, k, u, ux, Rect, Point, debug, T_Tool, T_Layer } from '../../ts/common/Global_Imports';
	import { w_g_radial, w_user_graph_offset, w_thing_fontFamily } from '../../ts/common/Stores';
	import { w_graph_rect, w_show_details, w_ancestry_focus } from '../../ts/common/Stores';
	import Radial_Focus from './Radial_Focus.svelte';
	import Circle from '../kit/Circle.svelte';
	import Necklace from './Necklace.svelte';
	import Radial from './Radial.svelte';
	import { onMount } from 'svelte';
	let toolsOffset = new Point(31, -173.5).offsetBy($w_user_graph_offset.negated);

	// draw center title, arcs, radial and widget necklace
	//	also selection & hover for arcs & radial

	// needs:
	//	handle keys
	//	edit titles (keydown terminates edit) BROKEN
	//	displays editing tools when asked by user
	
	$w_g_radial = new G_Radial();
	debug.log_tools(` CLUSTERS (svelte)`);

	onMount(() => {
		const handler = signals.handle_recreate_widgets(0, (ancestry) => {
			g.require_rebuild_forType(T_Rebuild.radial);
		});
		return () => { handler.disconnect() };
	});

	
	$: {
		const _ = $w_show_details;
		setTimeout(() => {
			g.require_rebuild_forType(T_Rebuild.radial);
		}, 100);
	}

</script>

{#key g.readOnce_rebuild_needed_forType(T_Rebuild.radial), $w_ancestry_focus.hashedAncestry}
	<div class = 'radial-graph'
		style = '
			z-index : {T_Layer.backmost};
			width : {$w_graph_rect.size.width}px;
			height : {$w_graph_rect.size.height}px;
			transform : translate({$w_user_graph_offset.x}px, {$w_user_graph_offset.y}px);'>
		<Radial/>
		<Radial_Focus/>
		<Necklace/>
	</div>
{/key}
