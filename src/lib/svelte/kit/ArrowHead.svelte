<script>
	import { k, u, Point, debug, ZIndex, svgPaths } from '../../ts/common/GlobalImports'
	export let color_background = debug.lines ? 'transparent' : k.color_background;
	export let zindex = ZIndex.dots;
	export let center = Point.zero;
	export let name = k.empty;
	export let thickness = 1;
	export let radius = 5;
	export let angle = 0;
	export let color;
	let diameter = 0;
	let svgPath = k.empty;

	$: {
		diameter = radius * 2;
		const skip = [1, 4];
		svgPath = svgPaths.polygon(radius, angle, 5, skip);
	}

</script>

<div
	class= 'arrowhead' id={name} style='
		position: absolute;
		top: {center.y - radius}px;
		left: {center.x - radius}px;
		z-index: {zindex};'>
	<svg class='triangle'
		width={diameter * 2}px
		height={diameter * 2}px>
		style='z-index: {ZIndex.lines}; position: absolute'
		<path d={svgPath} stroke={color} fill={color_background}/>
</div>
