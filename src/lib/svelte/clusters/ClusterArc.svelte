<script lang='ts'>
	import { k, Point, ZIndex, ClusterLayout } from '../../ts/common/GlobalImports';
	import { ArcKind } from '../../ts/common/Enumerations';
	export let clusterLayout: ClusterLayout;
	export let center = Point.zero;
	export let color = 'red';
	const offset = k.necklace_gap;
	const arc_keyed_svgPaths = clusterLayout.arc_keyed_svgPaths;
	const radius = k.cluster_arc_radius + offset;
	const breadth = radius * 2;

</script>

<svg class='cluster-arc' 
	viewBox='{-offset} {-offset} {breadth} {breadth}'
	style='
		position: absolute;
		width: {breadth}px;
		height: {breadth}px;
		zindex: {ZIndex.frontmost};
		top: {center.y - radius}px;
		left: {center.x - radius}px;'>
	{#each arc_keyed_svgPaths[ArcKind.main]   as mainPath}
		<path stroke={color} fill=transparent d={mainPath}/>
	{/each}
	<path stroke={k.color_background} fill={k.color_background} d={arc_keyed_svgPaths[ArcKind.gap][0]}/>
	{#each arc_keyed_svgPaths[ArcKind.fork]   as forkPath}
		<path stroke={color} fill=transparent d={forkPath}/>
	{/each}
</svg>
