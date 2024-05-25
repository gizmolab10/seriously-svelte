<script lang='ts'>
	import { g, k, Point, ZIndex, ClusterLayout } from '../../ts/common/GlobalImports';
	import { s_cluster_arc_radius } from '../../ts/state/Stores';
	import { ArcKind } from '../../ts/common/Enumerations';
	export let clusterLayout: ClusterLayout;
	export let center = Point.zero;
	export let color = 'red';
	const arc_keyed_svgPaths = clusterLayout.arc_keyed_svgPaths;
	const offset = k.necklace_gap;
	let radius = $s_cluster_arc_radius + offset;
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
