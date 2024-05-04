<script lang='ts'>
	import { k, u, Rect, Size, Point, Angle, onMount, ZIndex, svgPaths } from '../../ts/common/GlobalImports';
	import { IDLine, Quadrant, Wrapper, IDWrapper, ClusterLayout } from '../../ts/common/GlobalImports';
	import ArrowHead from '../kit/ArrowHead.svelte';
	import { h } from '../../ts/db/DBDispatch';
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
			lineWrapper = new Wrapper(line, h.rootPath, IDWrapper.line);
		}
		angle = layout?.line_angle;
		const line_rotated = layout?.line_rotated;
		const title_width = u.getWidthOf(layout?.title) / -3;
		const line_length = k.cluster_line_length - k.dot_size * (showArrowHeads ? 8 : 0);
		const inside_radius = k.cluster_inside_radius + (showArrowHeads ? 8 : 0);
		const inside_rotated = Point.polarVector(inside_radius, angle);
		const titleDelta = new Point(title_width, k.dot_size / -2);
		size = line_rotated.abs.asSize;
		const rect = new Rect(Point.zero, size);
		const titleCenter = rect.center;
		const titleOrigin = titleCenter.offsetBy(titleDelta);
		svgPath = svgPaths.line(line_rotated);
		[left, top] = updateLine(line_rotated, inside_rotated);
		[arrow_start, arrow_end] = rect.cornersForAngle(angle);
		label_left = titleOrigin.x;
		label_top = titleOrigin.y;
	}

	function updateLine(line_rotated: Point, inside_rotated: Point): [number, number] {
		let outside_rotated = inside_rotated;
		if (layout?.predicate.isBidirectional || !layout?.pointsTo) {
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

{#key rebuilds}
	<div class='cluster-line'
		id={idDiv}
		style='z-index: {ZIndex.lines};
			position: absolute;
			top: {top + center.y}px;
			left: {left + center.x}px;'>
		<svg class='svg-cluster-line'
			bind:this={line}
			width={size.width}px
			height={size.height}px>
			style='z-index: ${ZIndex.lines}; position: absolute'
			<path d={svgPath} stroke={color} fill='none'/>
		</svg>
		<div class='label-cluster-line' style='
			background-color: {k.color_background};
			left: {label_left}px;
			white-space: nowrap;
			position: absolute;
			font-family: Arial;
			top: {label_top}px;
			font-size: 0.5em;
			color: {color};'>
			{layout?.title}
		</div>
		{#if showArrowHeads}
			{#if layout?.predicate.isBidirectional}
				<ArrowHead idDiv='child'  angle={angle} color={color} color_background={color} radius={thickness} center={arrow_end}/>
				<ArrowHead idDiv='parent' angle={angle + Angle.half} color={color} color_background={color} radius={thickness} center={arrow_start}/>
			{:else if layout?.pointsTo}
				<ArrowHead idDiv='child'  angle={angle} color={color} color_background={color} radius={thickness} center={arrow_end}/>
			{:else}
				<ArrowHead idDiv='parent' angle={angle + Angle.half} color={color} color_background={color} radius={thickness} center={arrow_start}/>
			{/if}
		{/if}
	</div>
{/key}
