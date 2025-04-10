<script lang='ts'>
	import { run } from 'svelte/legacy';

	import { k, u, Point, debug, ZIndex, svgPaths } from '../../ts/common/Global_Imports'
	interface Props {
		color_background?: any;
		zindex?: any;
		center?: any;
		name?: any;
		radius?: number;
		angle?: number;
		color: any;
	}

	let {
		color_background = debug.lines ? 'transparent' : k.color_background,
		zindex = ZIndex.dots,
		center = Point.zero,
		name = k.empty,
		radius = 5,
		angle = 0,
		color
	}: Props = $props();
	let diameter = $state(0);
	let arrowheadPath = $state(k.empty);

	run(() => {
		diameter = radius * 2;
		const skip = [1, 4];
		arrowheadPath = svgPaths.polygon(radius, angle, 5, skip);
	});

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
		<path d={arrowheadPath} stroke={color} fill={color_background}/>
</div>
