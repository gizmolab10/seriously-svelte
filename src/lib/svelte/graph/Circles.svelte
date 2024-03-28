<script lang='ts'>
	import { s_graphRect, s_path_here, s_user_graphOffset, s_thing_fontFamily } from '../../ts/common/State';
	import { g, k, u, Rect, Size, Point, ZIndex } from '../../ts/common/GlobalImports';
	import TitleEditor from '../widget/TitleEditor.svelte';
	import Circle from '../kit/Circle.svelte';
	// needs:
	//  hover
	//  edit state
	//  handle keys
	const offsetY = 5 - k.dot_size;
	let titleCenter: Point;
	let titleWidth = 0;
	let center: Point
	let offsetX = 0;
	let size: Size;

	$: {
		size = $s_graphRect.size;
		const thing = $s_path_here.thing;
		center = size.dividedInHalf.asPoint;
		titleWidth = u.getWidthOf(thing.title);
		offsetX = -k.thing_fontSize - 2 - titleWidth / 2;
		titleCenter = center.offsetBy(new Point(offsetX, offsetY));
	}

</script>

<div class='circles' style='transform: translate({$s_user_graphOffset.x}px, {$s_user_graphOffset.y}px);'>
	{#key $s_path_here}
		<Circle radius={k.circle_focus_radius} center={center} color={$s_path_here.thing.color} thickness=1 color_background='transparent'/>
		<div style='top:{titleCenter.y}px; left: {titleCenter.x}px; position: absolute;'>
			<TitleEditor thing={$s_path_here.thing} path={$s_path_here} fontSize={k.thing_fontSize}px fontFamily={$s_thing_fontFamily}/>
		</div>
	{/key}
</div>