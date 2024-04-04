<script lang='ts'>
	import { g, k, u, Rect, Size, Point, Angles, onMount, ZIndex, svgPaths } from '../../ts/common/GlobalImports';
	import { IDLine, Quadrant, Wrapper, IDWrapper, NecklaceCluster } from '../../ts/common/GlobalImports';
	import ArrowHead from '../kit/ArrowHead.svelte';
	import Box from '../kit/Box.svelte';
    export let cluster: NecklaceCluster;
	export let color = k.color_default;
	export let center = Point.zero;
	const name = `${cluster.pointsTo ? 'to' : 'from'} ${cluster.predicate.kind}`;
	let line_start = Point.zero;
	let line_end = Point.zero;
	let lineWrapper: Wrapper;
	let svgPath = k.empty;
	let size = Size.zero;
	let thickness = 5;
	let angle = 0;
	let left = 0;
	let top = 0;
	let line;

	$: {
		if (line && !lineWrapper) {
			lineWrapper = new Wrapper(line, g.rootPath, IDWrapper.line);
		}
		angle = cluster.angle + Math.PI/6.9;
		const focus_radius = k.cluster_focus_radius;
		const arrow_radius = focus_radius + 6;
		const length = k.necklace_radius - focus_radius - k.dot_size;
		const focus_rotated = new Point(focus_radius, 0).rotateBy(angle);
		const length_rotated = new Point(length, 0).rotateBy(angle);
		const rect = new Rect(Point.zero, length_rotated.asSize);
		[left, top] = updateLine(length_rotated, focus_rotated);
		[line_start, line_end] = rect.cornersForAngle(angle);
		svgPath = svgPaths.line(length_rotated);
		size = length_rotated.asSize;
	}

	function updateLine(length_rotated: Point, focus_rotated: Point): [number, number] {
		let focus_outer = focus_rotated;
		if (cluster.predicate.directions == 2 || !cluster.pointsTo) {
			focus_outer = focus_rotated.offsetBy(length_rotated);
		}
		switch (u.point_quadrant(length_rotated)) {
			case Quadrant.upperRight: return [focus_rotated.x, focus_rotated.y];
			case Quadrant.lowerRight: return [focus_rotated.x, focus_outer.y];
			case Quadrant.upperLeft:  return [focus_outer.x, focus_rotated.y];
			default:				  return [focus_outer.x, focus_outer.y];		
		}
	}

</script>

<div class='arrow'
	id={name}
	style='z-index: {ZIndex.lines};
	position: absolute;
	left: {left + center.x}px;
	top: {top + center.y}px;'>
	<svg class='line'
		bind:this={line}
		width={size.width}px
		height={size.height}px>
		style='z-index: {ZIndex.lines}; position: absolute'
		<path d={svgPath} stroke={color} fill='none'/>
	</svg>
	{#if cluster.predicate.directions == 2}
		<ArrowHead name='to'   angle={angle} color={color} color_background={color} radius={thickness} center={line_end}/>
		<ArrowHead name='from' angle={angle + Angles.half} color={color} color_background={color} radius={thickness} center={line_start}/>
	{:else if cluster.pointsTo}
		<ArrowHead name='to'   angle={angle} color={color} color_background={color} radius={thickness} center={line_end}/>
	{:else}
		<ArrowHead name='from' angle={angle + Angles.half} color={color} color_background={color} radius={thickness} center={line_start}/>
	{/if}
</div>