<script>
	import { k, u, Point, debug, ZIndex, onMount } from '../../ts/common/GlobalImports'
	export let color_background = debug.lines ? 'transparent' : k.color_background;
	export let zindex = ZIndex.dots;
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
		top: {center.y - radius}px;
		left: {center.x - radius}px;
		border: {thickness}px solid {color};
		background-color: {color_background};'>
</div>
