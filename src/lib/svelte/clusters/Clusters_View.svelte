<script lang='ts'>
	import { g, k, u, ux, Rect, Size, Point, ZIndex, onMount, signals, debug, debugReact, Clusters_Geometry } from '../../ts/common/Global_Imports';
	import { s_graphRect, s_ancestry_focus, s_user_graphOffset, s_thing_fontFamily, s_ancestry_showingTools } from '../../ts/state/Reactive_State';
	import { s_clusters_geometry, s_rotation_ring_state, s_rotation_ring_radius } from '../../ts/state/Reactive_State';
	import Editing_Tools from '../widget/Editing_Tools.svelte';
	import Title_Editor from '../widget/Title_Editor.svelte';
	import Circle from '../kit/Circle.svelte';
	import Necklace from './Necklace.svelte';
	import Rings from './Rings.svelte';
	let toolsOffset = new Point(32, -3);
	let titleCenter = Point.zero;
	let size = Size.zero;
	let forward = true;
	let titleWidth = 0;
	let rebuilds = 0;
	let offsetX = 0;
	let clusters;

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
		titleWidth = $s_ancestry_focus?.thing?.titleWidth ?? 0;
		offsetX = -9 - k.thing_fontSize - (titleWidth / 2);
		titleCenter = g.graph_center.offsetByXY(offsetX, k.cluster_offsetY);
		toolsOffset = new Point(31, -23.5).offsetBy($s_user_graphOffset.negated);
		rebuilds += 1;
	}

	function cursor_closure() {
		if (!!clusters) {
			clusters.style.cursor = `${$s_rotation_ring_state.cursor} !important`;
		}
	}

</script>

{#key rebuilds, $s_ancestry_focus.hashedAncestry}
	<div class='clusters'
		bind:this={clusters}
		style='
			z-index:{ZIndex.panel};
			transform:translate({$s_user_graphOffset.x}px, {$s_user_graphOffset.y}px);'>
		<Rings
			name={'rings'}
			zindex={ZIndex.panel}
			ring_width={k.ring_thickness}
			cursor_closure={cursor_closure}
			radius={$s_rotation_ring_radius}
			color={$s_ancestry_focus?.thing?.color ?? k.color_default}/>
		<Necklace/>
		{#if $s_ancestry_showingTools?.isVisible}
			<Editing_Tools offset={toolsOffset}/>
		{/if}
		<div class='cluster-focus'
			style='
				position: absolute;
				top:{titleCenter.y}px;
				left: {titleCenter.x}px;'>
			<Title_Editor
				ancestry={$s_ancestry_focus}
				fontSize={k.thing_fontSize}px
				fontFamily={$s_thing_fontFamily}/>
		</div>
	</div>
{/key}
