<script lang='ts'>
	import { g, k, Point, ZIndex, onMount, Cluster_Map } from '../../ts/common/GlobalImports';
	import { s_cluster_arc_radius } from '../../ts/state/ReactiveState';
	import { ArcPart } from '../../ts/common/Enumerations';
	export let cluster_map: Cluster_Map;
	export let center = Point.zero;
	export let color = 'red';
	const offset = k.necklace_widget_padding;
	let radius = $s_cluster_arc_radius + offset;
	const arc_parts_svgPaths = cluster_map.arc_parts_svgPaths;
	const breadth = radius * 2;

	// draws the talking scroll bar
	// uses cluster map for svg, which also has total and shown
	//
	// drawn by scrolling ring, which is drawn by clusters graph
	// CHANGE: drawn by clusters (which is drawn by clusters graph)?

</script>

<svg class='cluster-scroll-arc' 
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
	{#each arc_parts_svgPaths[ArcPart.outer]  as outerPath}
		<path stroke={color} fill=transparent d={outerPath}/>
	{/each}
	{#each arc_parts_svgPaths[ArcPart.fork]   as forkPath}
		<path stroke={color} fill=transparent d={forkPath}/>
	{/each}
</svg>
