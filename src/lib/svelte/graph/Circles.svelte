<script lang='ts'>
	import { s_graphRect, s_path_here, s_user_graphOffset, s_thing_fontFamily } from '../../ts/common/State';
	import { g, k, Rect, Size, Point, ZIndex } from '../../ts/common/GlobalImports';
	import TitleEditor from '../widget/TitleEditor.svelte';
	import Circle from '../kit/Circle.svelte';
	// needs:
	//  handle keys
	//  hover
	const size = $s_graphRect.size;
	const center = size.dividedInHalf.asPoint;
</script>

<div class='circles' style='
	top:{center.y}px; left: {center.x}px; position: absolute;
	transform: translate({$s_user_graphOffset.x}px, {$s_user_graphOffset.y}px);'>
	<Circle radius={k.circle_focus_radius} center={new Point()} color={g.here.color} thickness=1 color_background='transparent'/>
	<div style='left: -40px;'>
		<TitleEditor thing={g.here} path={$s_path_here} fontSize={k.thing_fontSize}px fontFamily={$s_thing_fontFamily}/>
	</div>
</div>