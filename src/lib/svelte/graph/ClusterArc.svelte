<script lang='ts'>
	import { k, Point, ZIndex, ClusterLayout } from '../../ts/common/GlobalImports';
	export let layout: ClusterLayout;
	export let center = Point.zero;
	export let color = 'red';
	const offset = k.necklace_gap;
	const radius = k.necklace_radius + offset;
	const breadth = (radius) * 2;
	let arcCenter = Point.square(radius);
	let arcPath = k.empty;
	let rebuilds = 0;

</script>

{#key rebuilds}
	<svg class='cluster-arc' 
		viewBox='{-offset} {-offset} {breadth} {breadth}'
		style='
			position: absolute;
			width: {breadth}px;
			height: {breadth}px;
			zindex: {ZIndex.frontmost};
			top: {center.y - radius}px;
			left: {center.x - radius}px;'>
		{#each layout.arcPaths as path}
			<path stroke={color} fill=transparent d={path}/>
		{/each}
	</svg>
{/key}
