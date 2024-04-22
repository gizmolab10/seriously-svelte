<script lang='ts'>
	import { s_graphRect, s_path_focus, s_user_graphOffset, s_thing_fontFamily } from '../../ts/state/State';
	import { g, k, u, Rect, Size, Point, ZIndex, transparentize } from '../../ts/common/GlobalImports';
	import TitleEditor from '../widget/TitleEditor.svelte';
	import EditingTools from './EditingTools.svelte';
	import Circle from '../kit/Circle.svelte';
	import Necklace from './Necklace.svelte'
	export let path;
	// needs:
	//  hover
	//  necklace
	//  edit state
	//  handle keys
	//  lines with arrows
	const toolsOffset = new Point(40, -3);
	let titleCenter = Point.zero;
	let center = Point.zero;
	let size = Size.zero;
	let titleWidth = 0;
	let rebuilds = 0;
	let offsetX = 0;

	$: {
		rebuilds += 1;
		size = $s_graphRect.size;
		const thing = path?.thing;
		center = size.dividedInHalf.asPoint;
		titleWidth = u.getWidthOf(thing?.title ?? k.empty);
		offsetX = -k.thing_fontSize - 3 - (titleWidth / 2);
		titleCenter = center.offsetBy(new Point(offsetX, k.cluster_offsetY));
	}

	// <Circle
	// 	center={center}
	// 	color_background='transparent'
	// 	radius={k.cluster_inside_radius}
	// 	color={transparentize(path.thing.color, 0.75)}/>

</script>

{#if path}
	<div class='clusters' style='transform: translate({$s_user_graphOffset.x}px, {$s_user_graphOffset.y}px);'>
		{#key `${path.hashedPath ?? 0} ${rebuilds}`}
			<div style='
				position: absolute;
				top:{titleCenter.y}px;
				left: {titleCenter.x}px;'>
				<TitleEditor path={path} fontSize={k.thing_fontSize}px fontFamily={$s_thing_fontFamily}/>
			</div>
			<Necklace path={path} center={center}/>
			<EditingTools offset={toolsOffset}/>
		{/key}
	</div>
{/if}
