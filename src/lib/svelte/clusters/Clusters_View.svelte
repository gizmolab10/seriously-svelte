<script lang='ts'>
	import { s_graphRect, s_ancestry_focus, s_user_graphOffset, s_thing_fontFamily, s_cluster_arc_radius } from '../../ts/state/Reactive_State';
	import { k, s, u, Rect, Size, Point, ZIndex, onMount, signals, Clusters_Geometry } from '../../ts/common/Global_Imports';
	import Editing_Tools from '../widget/Editing_Tools.svelte';
	import Title_Editor from '../widget/Title_Editor.svelte';
	import Scrolling_Ring from './Scrolling_Ring.svelte';
	import Necklace_Ring from './Necklace_Ring.svelte';
	import Circle from '../kit/Circle.svelte';
	import Clusters_Graph from './Clusters_Graph.svelte';
	const toolsOffset = new Point(32, -3);
    const ancestry = $s_ancestry_focus;
	const thing = ancestry?.thing;
	const geometry = new Clusters_Geometry();
	const color = thing?.color ?? k.color_default;
	let titleCenter = Point.zero;
	let center = Point.zero;
	let size = Size.zero;
	let titleWidth = 0;
	let rebuilds = 0;
	let offsetX = 0;
	let clusters;

	// draw center title, rings and clusters

	// needs:
	//	arrowheads
	//	handle keys
	//	lines: selection & hover
	//	edit titles (keydown terminates edit)
	
	$: { cursor_closure(); }
	
	onMount(() => {
		const handler = signals.handle_relayoutWidgets(0, (ancestry) => { rebuilds += 1; });
		return () => { handler.disconnect() };
	});

	$: {
		size = $s_graphRect.size;
		center = size.dividedInHalf.asPoint;
		titleWidth = thing?.titleWidth ?? 0;
		offsetX = -k.thing_fontSize - (titleWidth / 2);
		titleCenter = center.offsetByXY(offsetX, k.cluster_offsetY);
		rebuilds += 1;
	}

	function cursor_closure() {
		if (!!clusters) {
			clusters.style.cursor = `${s.necklace_ringState.cursor} !important`;
		}
	}

</script>

{#if $s_ancestry_focus}
	{#key rebuilds}
		<div class='clusters'
			bind:this={clusters}
			style='transform:translate({$s_user_graphOffset.x}px, {$s_user_graphOffset.y}px);'>
			{#key $s_ancestry_focus.hashedAncestry}
				<div class='cluster-focus'
					style='
						position: absolute;
						top:{titleCenter.y}px;
						left: {titleCenter.x}px;'>
					<Title_Editor ancestry={$s_ancestry_focus} fontSize={k.thing_fontSize}px fontFamily={$s_thing_fontFamily}/>
				</div>
				<Clusters_Graph geometry={geometry}/>
				<Scrolling_Ring
					color={color}
					thing={thing}
					center={center}
					ring_width={30}
					geometry={geometry}
					name={'scroll-ring'}
					zindex={ZIndex.text}
					radius={$s_cluster_arc_radius - k.ring_thickness}/>
				<Necklace_Ring
					color={color}
					thing={thing}
					center={center}
					zindex={ZIndex.lines}
					name={'necklace-ring'}
					ring_width={k.ring_thickness}
					radius={$s_cluster_arc_radius}
					cursor_closure={cursor_closure}/>
				<Editing_Tools offset={toolsOffset}/>
			{/key}
		</div>
	{/key}
{/if}
