<script lang='ts'>
	import { k, Point, debug, colors, T_Layer } from '../../ts/common/Global_Imports'
	import { w_background_color } from '../../ts/managers/Stores';
	export let color_background = debug.lines ? 'transparent' : $w_background_color;
	export let zindex = T_Layer.dots;
	export let opacity = 0;
	export let thickness;
	export let radius;
	export let center;
	export let color;
	let transparentColor = 'transparent';
	let diameter = 0;

	$: {
		diameter = radius * 2;
		transparentColor = colors.opacitize(color_background, opacity);
	}

</script>

<style>
	.circle {
		position: absolute;
		border-radius: 50%;
	}
</style>

<div class='circle'
	style='
		width: {diameter}px;
		height: {diameter}px;
		z-index: {zindex};
		top: {center.y - radius}px;
		left: {center.x - radius}px;
		border: {thickness}px solid {color};
		background-color: {transparentColor};'>
</div>
