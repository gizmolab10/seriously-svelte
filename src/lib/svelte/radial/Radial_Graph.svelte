<script lang='ts'>
	import { signals, T_Ring, T_Element, T_Rebuild, Radial_Geometry } from '../../ts/common/Global_Imports';
	import { g, k, u, ux, Rect, Point, debug, T_Tool, ZIndex } from '../../ts/common/Global_Imports';
	import { s_graphRect, s_details_show, s_ancestry_focus } from '../../ts/state/S_Stores';
	import { s_user_graph_offset, s_thing_fontFamily } from '../../ts/state/S_Stores';
	import { s_radial_geometry } from '../../ts/state/S_Stores';
	import Radial_Focus from './Radial_Focus.svelte';
	import Circle from '../kit/Circle.svelte';
	import Necklace from './Necklace.svelte';
	import Radial from './Radial.svelte';
	import { onMount } from 'svelte';
	let toolsOffset = new Point(31, -173.5).offsetBy($s_user_graph_offset.negated);

	// draw center title, arcs, radial and widget necklace
	//	also selection & hover for arcs & radial

	// needs:
	//	arrowheads
	//	handle keys
	//	edit titles (keydown terminates edit) BROKEN
	//	displays editing tools when asked by user
	
	$s_radial_geometry = new Radial_Geometry();
	debug.log_tools(` CLUSTERS (svelte)`);

	onMount(() => {
		const handler = signals.handle_relayoutWidgets(0, ($s_ancestry_focus) => {
			g.require_rebuild_forType(T_Rebuild.radial);
		});
		return () => { handler.disconnect() };
	});

	
	$: {
		const _ = $s_details_show;
		$s_radial_geometry = new Radial_Geometry();
		setTimeout(() => {
			g.require_rebuild_forType(T_Rebuild.radial);
		}, 100);
	}

</script>

{#key g.readOnce_rebuild_needed_forType(T_Rebuild.radial), $s_ancestry_focus.hashedAncestry}
	<div class='radial-graph'
		style='
			z-index:{ZIndex.backmost};
			width:{$s_graphRect.size.width}px;
			height:{$s_graphRect.size.height}px;
			transform:translate({$s_user_graph_offset.x}px, {$s_user_graph_offset.y}px);'>
		<Radial/>
		<Radial_Focus/>
		<Necklace/>
	</div>
{/key}
