<script lang='ts'>
	import { s_user_graphOffset, s_thing_fontFamily, s_ancestry_showingTools } from '../../ts/state/Reactive_State';
	import { onMount, signals, ElementType, Clusters_Geometry } from '../../ts/common/Global_Imports';
	import { g, k, u, ux, Rect, Point, debug, ZIndex, IDTool } from '../../ts/common/Global_Imports';
	import { s_graphRect, s_show_details, s_ancestry_focus } from '../../ts/state/Reactive_State';
	import { s_clusters_geometry, s_ring_rotation_state } from '../../ts/state/Reactive_State';
	import Cluster_Focus from './Cluster_Focus.svelte';
	import Editing_Tools from '../widget/Editing_Tools.svelte';
	import Circle from '../kit/Circle.svelte';
	import Necklace from './Necklace.svelte';
	import Rings from './Rings.svelte';
	let toolsOffset = new Point(31, -173.5).offsetBy($s_user_graphOffset.negated);
	let clusters_graph;
	let rebuilds = 0;

	// draw center title, rings and widget necklace
	//	arcs & rings: selection & hover

	// needs:
	//	arrowheads
	//	handle keys
	//	edit titles (keydown terminates edit) BROKEN
	//	displays editing tools when asked by user
	
	$s_clusters_geometry = new Clusters_Geometry();
	debug.log_tools(` CLUSTERS (svelte)`);
	cursor_closure();

	onMount(() => {
		const handler = signals.handle_relayoutWidgets(0, ($s_ancestry_focus) => { rebuilds += 1; });
		return () => { handler.disconnect() };
	});

	
	$: {
		const _ = $s_show_details;
		$s_clusters_geometry = new Clusters_Geometry();
		setTimeout(() => {
			toolsOffset = new Point(31, -173.5).offsetBy($s_user_graphOffset.negated);
			rebuilds += 1;
		}, 100);
	}

	function cursor_closure() {
		if (!!clusters_graph) {
			clusters_graph.style.cursor = `${$s_ring_rotation_state.cursor} !important`;
		}
	}

</script>

{#key rebuilds, $s_ancestry_focus.hashedAncestry}
	<div class='clusters-graph'
		bind:this={clusters_graph}
		style='
			z-index:{ZIndex.panel};
			width:{$s_graphRect.size.width}px;
			height:{$s_graphRect.size.height}px;
			transform:translate({$s_user_graphOffset.x}px, {$s_user_graphOffset.y}px);'>
		<Rings cursor_closure={cursor_closure}/>
		<Cluster_Focus/>
		<Necklace/>
		{#if $s_ancestry_showingTools?.isVisible}
			<Editing_Tools offset={toolsOffset}/>
		{/if}
	</div>
{/key}
