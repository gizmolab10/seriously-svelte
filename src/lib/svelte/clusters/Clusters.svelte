<script lang='ts'>
	import { s_graphRect, s_ancestry_focus, s_user_graphOffset, s_thing_fontFamily } from '../../ts/state/State';
	import { k, u, Rect, Size, Point, ZIndex, transparentize } from '../../ts/common/GlobalImports';
	import EditingTools from '../widget/EditingTools.svelte';
	import TitleEditor from '../widget/TitleEditor.svelte';
	import Circle from '../kit/Circle.svelte';
	import Necklace from './Necklace.svelte';
	// needs:
	//	rotation
	//	arrowheads
	//	handle keys
	//	lines: selection & hover
	//	edit titles (keydown terminates edit)
	const toolsOffset = new Point(40, -3);
	const ancestry = $s_ancestry_focus;
	let titleCenter = Point.zero;
	let center = Point.zero;
	let size = Size.zero;
	let titleWidth = 0;
	let rebuilds = 0;
	let offsetX = 0;

	$: {
		rebuilds += 1;
		size = $s_graphRect.size;
		const thing = ancestry?.thing;
		center = size.dividedInHalf.asPoint;
		titleWidth = u.getWidthOf(thing?.title ?? k.empty);
		offsetX = -k.thing_fontSize - 3 - (titleWidth / 2);
		titleCenter = center.offsetBy(new Point(offsetX, k.cluster_offsetY));
	}

</script>

{#if ancestry}
	<div class='clusters' style='transform: translate({$s_user_graphOffset.x}px, {$s_user_graphOffset.y}px);'>
		{#key `${ancestry.hashedAncestry ?? 0} ${rebuilds}`}
			<div class='necklace-focus'
				style='
					position: absolute;
					top:{titleCenter.y}px;
					left: {titleCenter.x}px;'>
				<TitleEditor ancestry={ancestry} fontSize={k.thing_fontSize}px fontFamily={$s_thing_fontFamily}/>
			</div>
			<Necklace center={center}/>
			<EditingTools offset={toolsOffset}/>
		{/key}
	</div>
{/if}
