<script lang='ts'>
	import { s_graphRect, s_path_here, s_user_graphOffset, s_thing_fontFamily } from '../../ts/common/State';
	import { g, k, u, Rect, Size, Point, ZIndex } from '../../ts/common/GlobalImports';
	import TitleEditor from '../widget/TitleEditor.svelte';
	import Circle from '../kit/Circle.svelte';
	import Necklace from './Necklace.svelte'
	// needs:
	//  hover
	//  necklace
	//  edit state
	//  handle keys
	//  lines with arrows
	let titleCenter: Point;
	let titleWidth = 0;
	let center: Point;
	let offsetX = 0;
	let size: Size;

	$: {
		size = $s_graphRect.size;
		const thing = $s_path_here.thing;
		center = size.dividedInHalf.asPoint;
		titleWidth = u.getWidthOf(thing.title);
		offsetX = -k.thing_fontSize - 2 - titleWidth / 2;
		titleCenter = center.offsetBy(new Point(offsetX, k.circle_offsetY));
	}

</script>

<div class='circles' style='transform: translate({$s_user_graphOffset.x}px, {$s_user_graphOffset.y}px);'>
	{#key $s_path_here}
		<Circle
			center={center}
			color_background='transparent'
			radius={k.circle_focus_radius}
			color={$s_path_here.thing.color}/>
		<div style='top:{titleCenter.y}px; left: {titleCenter.x}px; position: absolute;'>
			<TitleEditor path={$s_path_here} fontSize={k.thing_fontSize}px fontFamily={$s_thing_fontFamily}/>
		</div>
		<Necklace path={$s_path_here} center={center}/>
	{/key}
</div>