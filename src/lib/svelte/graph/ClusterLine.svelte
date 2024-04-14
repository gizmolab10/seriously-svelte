<script lang='ts'>
	import { g, k, u, Rect, Size, Point, Angle, onMount, ZIndex, svgPaths } from '../../ts/common/GlobalImports';
	import { IDLine, Quadrant, Wrapper, IDWrapper, ClusterLayout } from '../../ts/common/GlobalImports';
	import ArrowHead from '../kit/ArrowHead.svelte';
	import Box from '../kit/Box.svelte';
	export let color = k.color_default;
    export let layout: ClusterLayout;
	export let center = Point.zero;
	const idDiv = `${layout?.pointsTo ? 'child' : 'parent'} ${layout?.predicate.kind}`;
	const showArrowHeads = false;
	let arrow_start = Point.zero;
	let arrow_end = Point.zero;
	let lineWrapper: Wrapper;
	let svgPath = k.empty;
	let size = Size.zero;
	let label_left = 0;
	let label_top = 0;
	let thickness = 5;
	let angle = 0;
	let left = 0;
	let top = 0;
	let line;

	$: {
		if (line && !lineWrapper) {
			lineWrapper = new Wrapper(line, g.rootPath, IDWrapper.line);
		}
		angle = layout?.angle;
		const inside_radius = k.cluster_inside_radius + (showArrowHeads ? 8 : 0);
		const line_length = k.necklace_gap - k.dot_size * (showArrowHeads ? 8 : 0.4);
		const line_rotated = new Point(line_length, 0).rotate_by(angle);
		const inside_rotated = new Point(inside_radius, 0).rotate_by(angle);
		const titleWidth = u.getWidthOf(layout?.title);
		size = line_rotated.abs.asSize;
		const rect = new Rect(Point.zero, size);
		const center = rect.center;
		svgPath = svgPaths.line(line_rotated);
		[left, top] = updateLine(line_rotated, inside_rotated);
		[arrow_start, arrow_end] = rect.cornersForAngle(angle);
		label_left = center.x - titleWidth / 2;
		label_top = center.y;
	}

	function updateLine(line_rotated: Point, inside_rotated: Point): [number, number] {
		let outside_rotated = inside_rotated;
		if (layout?.predicate.directions == 2 || !layout?.pointsTo) {
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
	id={idDiv}
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
		left: {label_left}px;
		white-space: nowrap;
		position: absolute;
		font-family: Arial;
		top: {label_top}px;
		font-size: 0.5em;
		color: {color};
		background-color: {k.color_background};
		left: 20px;'>
		{layout?.title}
	</div>
	{#if showArrowHeads}
		{#if layout?.predicate.directions == 2}
			<ArrowHead idDiv='child'  angle={angle} color={color} color_background={color} radius={thickness} center={arrow_end}/>
			<ArrowHead idDiv='parent' angle={angle + Angle.half} color={color} color_background={color} radius={thickness} center={arrow_start}/>
		{:else if layout?.pointsTo}
			<ArrowHead idDiv='child'  angle={angle} color={color} color_background={color} radius={thickness} center={arrow_end}/>
		{:else}
			<ArrowHead idDiv='parent' angle={angle + Angle.half} color={color} color_background={color} radius={thickness} center={arrow_start}/>
		{/if}
	{/if}
</div>