<script lang='ts'>
	import { g, k, s, Point, ZIndex, onMount, Cluster_Map } from '../../ts/common/GlobalImports';
	import { s_cluster_arc_radius } from '../../ts/state/ReactiveState';
	import { scrolling_ringState } from '../../ts/state/Rotate_State';
	import { ArcPart } from '../../ts/common/Enumerations';
	import Button from '../mouse buttons/Button.svelte';
	export let cluster_map: Cluster_Map;
	export let center = Point.zero;
	export let color = 'red';
	const name = cluster_map.cluster_title;
	const elementState = cluster_map.thumbState;
	const thumb_size = cluster_map.thumb_radius * 2;
	const offset = k.necklace_widget_padding;
	let radius = $s_cluster_arc_radius + offset;
	const breadth = radius * 2;

	onMount(() => {
		elementState.color_background = color;
	})

	// draws the "talking" scroll bar
	// uses cluster map for svg, which also has total and shown
	//
	// drawn by scrolling ring, which is drawn by clusters graph
	// CHANGE: drawn by clusters (which is drawn by clusters graph)?

	function closure(mouseState) {
	}

</script>

<div name={name} style='
	position: absolute;
	width: {breadth}px;
	height: {breadth}px;
	zindex: {ZIndex.frontmost};
	top: {center.y - radius}px;
	left: {center.x - radius}px;'>
	<svg class='svg-scroll-arc' 
		viewBox='{-offset} {-offset} {breadth} {breadth}'>
		{#if cluster_map.shown < 2}
			<path stroke={color} fill=transparent d={cluster_map.single_svgPath}/>
		{:else}
			{#each cluster_map.main_svgPaths as mainPath}
				<path stroke={color} fill=transparent d={mainPath}/>
			{/each}
			<path stroke={k.color_background} fill={k.color_background} d={cluster_map.gap_svgPath}/>
			{#each cluster_map.outer_svgPaths as outerPath}
				<path stroke={color} fill=transparent d={outerPath}/>
			{/each}
			{#each cluster_map.fork_svgPaths as forkPath}
				<path stroke={color} fill=transparent d={forkPath}/>
			{/each}
		{/if}
	</svg>
	{#if (cluster_map.shown < cluster_map.total) && scrolling_ringState.isHovering}
		<Button name='thumb-responder'
			center={cluster_map.thumb_center}
			elementState={elementState}
			height={thumb_size}
			width={thumb_size}
			closure={closure}>
			<svg class='svg-thumb' style='position:absolute; top=0px; left=0px;'
				viewBox='0 0 {thumb_size} {thumb_size}'>
				<path stroke={color} fill={k.color_background} d={cluster_map.thumb_svgPath}/>
			</svg>
		</Button>
	{/if}
</div>
