<script lang='ts'>
	import { s_graphRect, s_ancestry_focus, s_user_graphOffset, s_thing_fontFamily, s_rotation_ring_radius } from '../../ts/state/Reactive_State';
	import { k, s, u, Rect, Size, Point, ZIndex, onMount, signals } from '../../ts/common/Global_Imports';
	import Editing_Tools from '../widget/Editing_Tools.svelte';
	import Title_Editor from '../widget/Title_Editor.svelte';
	import Clusters_Graph from './Clusters_Graph.svelte';
	import Paging_Ring from './Paging_Ring.svelte';
	import Rotation_Ring from './Rotation_Ring.svelte';
	import Circle from '../kit/Circle.svelte';
	const geometry = s.new_clusters_geometry;
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
			clusters.style.cursor = `${s.rotation_ringState.cursor} !important`;
		}
	}

</script>

{#if $s_ancestry_focus}
	{#key rebuilds}
		<div class='clusters'
			bind:this={clusters}
			style='transform:translate({$s_user_graphOffset.x}px, {$s_user_graphOffset.y}px); z-index:{ZIndex.panel};'>
			{#key $s_ancestry_focus.hashedAncestry}
				<Rotation_Ring
					color={color}
					center={center}
					zindex={ZIndex.panel}
					name={'rotation-ring'}
					ring_width={k.ring_thickness}
					radius={$s_rotation_ring_radius}
					cursor_closure={cursor_closure}/>
				<Paging_Ring
					color={color}
					center={center}
					ring_width={30}
					name={'paging-ring'}
					radius={$s_rotation_ring_radius - k.ring_thickness}/>
				<Clusters_Graph/>
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
