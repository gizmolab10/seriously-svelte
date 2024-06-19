<script lang='ts'>
	import { s_graphRect, s_ancestry_focus, s_user_graphOffset, s_thing_fontFamily, s_cluster_arc_radius } from '../../ts/state/ReactiveState';
	import { k, s, u, Rect, Size, Point, ZIndex, onMount, signals, transparentize } from '../../ts/common/GlobalImports';
	import { necklace_ringState } from '../../ts/state/NecklaceRingState';
	import EditingTools from '../widget/EditingTools.svelte';
	import TitleEditor from '../widget/TitleEditor.svelte';
	import NecklaceRing from './NecklaceRing.svelte';
	import ScrollRing from './ScrollRing.svelte';
	import Circle from '../kit/Circle.svelte';
	import Clusters from './Clusters.svelte';
	// needs:
	//	arrowheads
	//	handle keys
	//	lines: selection & hover
	//	edit titles (keydown terminates edit)
	const toolsOffset = new Point(32, -3);
    const ancestry = $s_ancestry_focus;
	const thing = ancestry?.thing;
	const color = thing?.color ?? k.color_default;
	let titleCenter = Point.zero;
	let center = Point.zero;
	let size = Size.zero;
	let titleWidth = 0;
	let rebuilds = 0;
	let offsetX = 0;
	let clusters;

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
			clusters.style.cursor = `${necklace_ringState.cursor} !important`;
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
					<TitleEditor ancestry={$s_ancestry_focus} fontSize={k.thing_fontSize}px fontFamily={$s_thing_fontFamily}/>
				</div>
				<Clusters/>
				<NecklaceRing
					color={color}
					thing={thing}
					center={center}
					zindex={ZIndex.lines}
					name={'necklace-ring'}
					ring_width={k.ring_thickness}
					radius={$s_cluster_arc_radius}
					cursor_closure={cursor_closure}/>
				<ScrollRing
					color={color}
					thing={thing}
					center={center}
					ring_width={30}
					zindex={ZIndex.lines}
					name={'scroll-ring'}
					radius={$s_cluster_arc_radius - k.ring_thickness}/>
				<EditingTools offset={toolsOffset}/>
			{/key}
		</div>
	{/key}
{/if}
