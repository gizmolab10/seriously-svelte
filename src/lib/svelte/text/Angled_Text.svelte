<script>
	import { k, s, u, Point, debug, T_Layer } from '../../ts/common/Global_Imports';
	const { w_thing_fontFamily } = s;
	export let background_color = colors.background;
	export let font_family = $w_thing_fontFamily;
	export let zindex = T_Layer.paging;
	export let center = Point.zero;
	export let font_size = '0.7em';
	export let text = k.space;
	export let color = 'red';
	export let angle = 0;

	// Calculate degrees from radians for CSS rotation
	$: angleDeg = angle * 180 / Math.PI;
</script>

<div class='angled-text'
	style='
		z-index: {zindex};
		top: {center.y}px;
		left: {center.x}px;
		position: absolute;
		transform: translate(-50%, -50%) rotate({angleDeg}deg);'>
	<span class='text'
		style='
			background-color: {background_color};
			font-family: {font_family};
			font-size: {font_size};
			color: {color};'>
		{text}
	</span>
</div>
