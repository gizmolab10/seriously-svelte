<script lang='ts'>
	import { s_graphRect, s_ancestry_focus, s_mouse_up_count, s_user_graphOffset, s_thing_fontFamily, s_cluster_arc_radius } from '../../ts/state/Stores';
	import { k, s, u, Rect, Size, Point, ZIndex, transparentize } from '../../ts/common/GlobalImports';
	import EditingTools from '../widget/EditingTools.svelte';
	import TitleEditor from '../widget/TitleEditor.svelte';
	import RingButton from '../mouse buttons/RingButton.svelte';
	import Circle from '../kit/Circle.svelte';
	import Necklace from './Necklace.svelte';
	// needs:
	//	arrowheads
	//	handle keys
	//	lines: selection & hover
	//	edit titles (keydown terminates edit)
	const ancestry = $s_ancestry_focus;
	const thing = ancestry?.thing;
	const necklace_name = 'necklace-ring';
	const toolsOffset = new Point(40, -3);
	const color = thing?.color ?? k.color_default;
	const ringState = s.ringState_forName(necklace_name);
	let mouse_up_count = $s_mouse_up_count;
	let titleCenter = Point.zero;
	let center = Point.zero;
	let size = Size.zero;
	let titleWidth = 0;
	let rebuilds = 0;
	let offsetX = 0;
	let clusters;

	$: {
		size = $s_graphRect.size;
		center = size.dividedInHalf.asPoint;
		titleWidth = u.getWidthOf(thing?.title ?? k.empty);
		offsetX = -k.thing_fontSize - 3 - (titleWidth / 2);
		titleCenter = center.offsetByXY(offsetX, k.cluster_offsetY);
		rebuilds += 1;
	}

	$: {
		if (mouse_up_count != $s_mouse_up_count) {
			mouse_up_count = $s_mouse_up_count;
			ringState.reset();
			rebuilds += 1;
		}
	}

	$: {
		if (!!clusters) {
			clusters.style.cursor = ringState.cursor;
		}
	}

</script>

{#if ancestry}
	{#key rebuilds}
		<div class='clusters'
			bind:this={clusters}
			style='cursor:ringState.cursor; transform:translate({$s_user_graphOffset.x}px, {$s_user_graphOffset.y}px);'>
			{#key ancestry.hashedAncestry}
				<div class='necklace-focus'
					style='
						position: absolute;
						top:{titleCenter.y}px;
						left: {titleCenter.x}px;'>
					<TitleEditor ancestry={ancestry} fontSize={k.thing_fontSize}px fontFamily={$s_thing_fontFamily}/>
				</div>
				<Necklace center={center}/>
				<RingButton
					radius={$s_cluster_arc_radius}
					thing={ancestry.thing}
					zindex={ZIndex.lines}
					name={necklace_name}
					center={center}
					thickness={30}
					color={color}/>
				<EditingTools offset={toolsOffset}/>
			{/key}
		</div>
	{/key}
{/if}
