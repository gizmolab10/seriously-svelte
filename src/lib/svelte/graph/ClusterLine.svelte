<script lang='ts'>
	import { g, k, u, Rect, Size, Point, Radians, onMount, ZIndex, svgPaths } from '../../ts/common/GlobalImports';
	import { IDLine, Quadrant, Wrapper, IDWrapper, ClusterLayout } from '../../ts/common/GlobalImports';
	import ArrowHead from '../kit/ArrowHead.svelte';
	import Box from '../kit/Box.svelte';
    export let clusterLayout: ClusterLayout;
	export let color = k.color_default;
	export let center = Point.zero;
	const showArrowHeads = false;
	const name = `${clusterLayout?.pointsTo ? 'child' : 'parent'} ${clusterLayout?.predicate.kind}`;
	let head_start = Point.zero;
	let head_end = Point.zero;
	let lineWrapper: Wrapper;
	let clockwise_radians = 0;
	let svgPath = k.empty;
	let size = Size.zero;
	let label_top = 0;
	let thickness = 5;
	let left = 0;
	let top = 0;
	let line;

	$: {
		if (line && !lineWrapper) {
			lineWrapper = new Wrapper(line, g.rootPath, IDWrapper.line);
		}
		clockwise_radians = clusterLayout?.clockwise_radians;
		const inside_radius = k.cluster_inside_radius + (showArrowHeads ? 8 : 0);
		const line_length = k.necklace_gap - k.dot_size * (showArrowHeads ? 8 : 0.4);
		const line_rotated = new Point(line_length, 0).rotate_clockwiseBy(clockwise_radians);
		const inside_rotated = new Point(inside_radius, 0).rotate_clockwiseBy(clockwise_radians);
		svgPath = svgPaths.line(line_rotated);
		size = line_rotated.abs.asSize;
		[left, top] = updateLine(line_rotated, inside_rotated);
		[head_start, head_end] = new Rect(Point.zero, size).cornersForRadian(clockwise_radians);
		switch (u.quadrant_of(clockwise_radians)) {
			case Quadrant.upperRight: label_top = 20; break;
			case Quadrant.lowerRight: label_top = 25; break;
			case Quadrant.upperLeft:  label_top = 15; break;
			default:				  break;
		}
	}

	function updateLine(line_rotated: Point, inside_rotated: Point): [number, number] {
		let outside_rotated = inside_rotated;
		if (clusterLayout?.predicate.directions == 2 || !clusterLayout?.pointsTo) {
			outside_rotated = inside_rotated.offsetBy(line_rotated);
		}
		switch (u.point_quadrant(line_rotated)) {
			case Quadrant.upperRight: return [ inside_rotated.x,  inside_rotated.y];
			case Quadrant.lowerRight: return [ inside_rotated.x, outside_rotated.y];
			case Quadrant.upperLeft:  return [outside_rotated.x,  inside_rotated.y];
			default:				  return [outside_rotated.x, outside_rotated.y];		
		}
	}

</script>

<div class='arrow'
	id={name}
	style='z-index: {ZIndex.lines};
		position: absolute;
		top: {top + center.y}px;
		left: {left + center.x}px;'>
	<svg class='line'
		bind:this={line}
		width={size.width}px
		height={size.height}px>
		style='z-index: ${ZIndex.lines}; position: absolute'
		<path d={svgPath} stroke={color} fill='none'/>
	</svg>
	<div class='label' style='
		white-space: nowrap;
		position: absolute;
		font-family: Arial;
		top: {label_top}px;
		font-size: 0.5em;
		color: {color};
		background-color: {k.color_background};
		left: 20px;'>
		{clusterLayout?.title}
	</div>
	{#if showArrowHeads}
		{#if clusterLayout?.predicate.directions == 2}
			<ArrowHead name='child'  clockwise_radians={clockwise_radians} color={color} color_background={color} radius={thickness} center={head_end}/>
			<ArrowHead name='parent' clockwise_radians={clockwise_radians + Radians.half} color={color} color_background={color} radius={thickness} center={head_start}/>
		{:else if clusterLayout?.pointsTo}
			<ArrowHead name='child'  clockwise_radians={clockwise_radians} color={color} color_background={color} radius={thickness} center={head_end}/>
		{:else}
			<ArrowHead name='parent' clockwise_radians={clockwise_radians + Radians.half} color={color} color_background={color} radius={thickness} center={head_start}/>
		{/if}
	{/if}
</div>