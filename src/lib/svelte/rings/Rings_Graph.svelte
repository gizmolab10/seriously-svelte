<script lang='ts'>
	import { signals, Ring_Zone, ElementType, Rebuild_Type, Clusters_Geometry } from '../../ts/common/Global_Imports';
	import { g, k, u, ux, Rect, Point, debug, IDTool, ZIndex, onMount } from '../../ts/common/Global_Imports';
	import { s_graphRect, s_show_details, s_focus_ancestry } from '../../ts/state/Reactive_State';
	import { s_user_graphOffset, s_thing_fontFamily } from '../../ts/state/Reactive_State';
	import { s_clusters_geometry } from '../../ts/state/Reactive_State';
	import Rings_Focus from './Rings_Focus.svelte';
	import Circle from '../kit/Circle.svelte';
	import Necklace from './Necklace.svelte';
	import Rings from './Rings.svelte';
	let toolsOffset = new Point(31, -173.5).offsetBy($s_user_graphOffset.negated);

	// draw center title, arcs, rings and widget necklace
	//	also selection & hover for arcs & rings

	// needs:
	//	arrowheads
	//	handle keys
	//	edit titles (keydown terminates edit) BROKEN
	//	displays editing tools when asked by user
	
	$s_clusters_geometry = new Clusters_Geometry();
	debug.log_tools(` CLUSTERS (svelte)`);

	onMount(() => {
		const handler = signals.handle_relayoutWidgets(0, ($s_focus_ancestry) => {
			g.require_rebuild_forType(Rebuild_Type.clusters);
		});
		return () => { handler.disconnect() };
	});

	
	$: {
		const _ = $s_show_details;
		$s_clusters_geometry = new Clusters_Geometry();
		setTimeout(() => {
			g.require_rebuild_forType(Rebuild_Type.clusters);
		}, 100);
	}

</script>

{#key g.readOnce_rebuild_needed_forType(Rebuild_Type.clusters), $s_focus_ancestry.hashedAncestry}
	<div class='rings-graph'
		style='
			z-index:{ZIndex.backmost};
			width:{$s_graphRect.size.width}px;
			height:{$s_graphRect.size.height}px;
			transform:translate({$s_user_graphOffset.x}px, {$s_user_graphOffset.y}px);'>
		<Rings/>
		<Rings_Focus/>
		<Necklace/>
	</div>
{/key}
