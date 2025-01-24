<script lang='ts'>
	import { k, u, Point, debug, T_Layer } from '../../ts/common/Global_Imports'
	import { onMount } from 'svelte';
	export let color_background = debug.lines ? 'transparent' : k.color_background;
	export let zindex = T_Layer.dots;
	export let center = Point.zero;
	export let name = k.empty;
	export let thickness = 1;
	export let radius = 2;
	export let color;
	let diameter = 0;

	$: { diameter = radius * 2; }

</script>

<div
	class= 'circle' id={name} style='
		z-index: {zindex};
		position: absolute;
		border-radius: 50%;
		width: {diameter}px;
		height: {diameter}px;
		border: {thickness}px solid {color};
		background-color: {color_background};
		top: {center.y - radius - thickness}px;
		left: {center.x - radius - thickness}px;'>
</div>
