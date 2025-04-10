<script lang='ts'>
	import { k, Size, Point, ZIndex, svgPaths, Direction } from '../../ts/common/Global_Imports';
	import SVGD3 from './SVGD3.svelte';
	interface Props {
		extraColor?: any;
		extraPath?: any;
		strokeColor: any;
		fillColor: any;
		position: any;
		size: any;
	}

	let {
		extraColor = k.color_background,
		extraPath = null,
		strokeColor,
		fillColor,
		position,
		size
	}: Props = $props();
	const trianglePath = svgPaths.fat_polygon(size, Direction.left);

</script>

<SVGD3 name='fatTriangle'
	width={size}
	height={size}
	fill={fillColor}
	position={position}
	stroke={strokeColor}
	svgPath={trianglePath}
/>
{#if extraPath}
	<SVGD3 name='fatTriangleInside'
		width={size}
		height={size}
		fill={extraColor}
		stroke={extraColor}
		svgPath={extraPath}
		x={size / 4}
	/>
{/if}