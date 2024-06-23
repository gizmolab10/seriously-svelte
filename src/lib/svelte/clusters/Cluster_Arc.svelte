<script lang='ts'>
	import { g, k, Point, ZIndex, onMount, Cluster_Maps } from '../../ts/common/GlobalImports';
	import { s_cluster_arc_radius } from '../../ts/state/ReactiveState';
	import { ArcPart } from '../../ts/common/Enumerations';
	export let cluster_maps: Cluster_Maps;
	export let center = Point.zero;
	export let color = 'red';
	const offset = k.necklace_gap;
	let radius = $s_cluster_arc_radius + offset;
	const arc_parts_svgPaths = cluster_maps.arc_parts_svgPaths;
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
	{#each arc_parts_svgPaths[ArcPart.main]   as mainPath}
		<path stroke={color} fill=transparent d={mainPath}/>
	{/each}
	<path stroke={k.color_background} fill={k.color_background} d={arc_parts_svgPaths[ArcPart.gap][0]}/>
	{#each arc_parts_svgPaths[ArcPart.fork]   as forkPath}
		<path stroke={color} fill=transparent d={forkPath}/>
	{/each}
</svg>
