<script lang='ts'>
	import { k, Point, ZIndex, ClusterLayout } from '../../ts/common/GlobalImports';
	import { ArcKind } from '../../ts/common/Enumerations';
	export let cluster_layout: ClusterLayout;
	export let center = Point.zero;
	export let color = 'red';
	const offset = k.necklace_gap;
	const radius = k.necklace_radius + offset;
	const breadth = radius * 2;
	let arc_keyed_svgPaths = cluster_layout.arc_keyed_svgPaths;
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
		{#each arc_keyed_svgPaths[ArcKind.main] as path}
			<path stroke={color} fill=transparent d={path}/>
		{/each}
		<path stroke={color} fill={k.color_background} d={arc_keyed_svgPaths[ArcKind.gap][0]}/>
		{#each arc_keyed_svgPaths[ArcKind.fork] as path}
			<path stroke={color} fill=transparent d={path}/>
		{/each}
	</svg>
{/key}
