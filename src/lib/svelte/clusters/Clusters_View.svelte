<script lang='ts'>
	import { s_graphRect, s_ancestry_focus, s_user_graphOffset, s_thing_fontFamily, s_rotation_ring_radius } from '../../ts/state/Reactive_State';
	import { k, u, ux, Rect, Size, Point, ZIndex, onMount, signals } from '../../ts/common/Global_Imports';
	import Editing_Tools from '../widget/Editing_Tools.svelte';
	import Title_Editor from '../widget/Title_Editor.svelte';
	import Circle from '../kit/Circle.svelte';
	import Necklace from './Necklace.svelte';
	import Rings from './Rings.svelte';
	const geometry = ux.new_clusters_geometry;
	const toolsOffset = new Point(32, -3);
    const ancestry = $s_ancestry_focus;
	const thing = ancestry?.thing;
	let titleCenter = Point.zero;
	let center = Point.zero;
	let size = Size.zero;
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
	
	$: { cursor_closure(); }
	
	onMount(() => {
		const handler = signals.handle_relayoutWidgets(0, (ancestry) => { rebuilds += 1; });
		return () => { handler.disconnect() };
	});

	$: {
		size = $s_graphRect.size;
		center = size.dividedInHalf.asPoint;
		titleWidth = thing?.titleWidth ?? 0;
		offsetX = -9 - k.thing_fontSize - (titleWidth / 2);
		titleCenter = center.offsetByXY(offsetX, k.cluster_offsetY);
		rebuilds += 1;
	}

	function cursor_closure() {
		if (!!clusters) {
			clusters.style.cursor = `${ux.rotation_ring_state.cursor} !important`;
		}
	}

</script>

{#if $s_ancestry_focus}
	{#key rebuilds}
		<div class='clusters'
			bind:this={clusters}
			style='transform:translate({$s_user_graphOffset.x}px, {$s_user_graphOffset.y}px); z-index:{ZIndex.panel};'>
			{#key $s_ancestry_focus.hashedAncestry}
				<Rings
					name={'rings'}
					center={center}
					zindex={ZIndex.panel}
					ring_width={k.ring_thickness}
					cursor_closure={cursor_closure}
					radius={$s_rotation_ring_radius}
					color={thing?.color ?? k.color_default}/>
				<Necklace/>
				<Editing_Tools offset={toolsOffset}/>
				<div class='cluster-focus'
					style='
						position: absolute;
						top:{titleCenter.y}px;
						left: {titleCenter.x}px;'>
					<Title_Editor ancestry={$s_ancestry_focus} fontSize={k.thing_fontSize}px fontFamily={$s_thing_fontFamily}/>
				</div>
			{/key}
		</div>
	{/key}
{/if}
