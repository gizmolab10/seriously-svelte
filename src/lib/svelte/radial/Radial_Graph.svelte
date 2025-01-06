<script lang='ts'>
	import { signals, Ring_Zone, ElementType, Rebuild_Type, Radial_Geometry } from '../../ts/common/Global_Imports';
	import { g, k, u, ux, Rect, Point, debug, IDTool, ZIndex } from '../../ts/common/Global_Imports';
	import { s_graphRect, s_show_details, s_focus_ancestry } from '../../ts/state/Svelte_Stores';
	import { s_user_graph_offset, s_thing_fontFamily } from '../../ts/state/Svelte_Stores';
	import { s_clusters_geometry } from '../../ts/state/Svelte_Stores';
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
	
	$s_clusters_geometry = new Radial_Geometry();
	debug.log_tools(` CLUSTERS (svelte)`);

	onMount(() => {
		const handler = signals.handle_relayoutWidgets(0, ($s_focus_ancestry) => {
			g.require_rebuild_forType(Rebuild_Type.clusters);
		});
		return () => { handler.disconnect() };
	});

	
	$: {
		const _ = $s_show_details;
		$s_clusters_geometry = new Radial_Geometry();
		setTimeout(() => {
			g.require_rebuild_forType(Rebuild_Type.clusters);
		}, 100);
	}

</script>

{#key g.readOnce_rebuild_needed_forType(Rebuild_Type.clusters), $s_focus_ancestry.hashedAncestry}
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
