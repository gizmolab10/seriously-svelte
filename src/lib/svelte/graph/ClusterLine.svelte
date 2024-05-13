<script lang='ts'>
	import { k, u, Rect, Size, Point, Angle, onMount, ZIndex, svgPaths } from '../../ts/common/GlobalImports';
	import { IDLine, Quadrant, Wrapper, IDWrapper, ClusterLayout } from '../../ts/common/GlobalImports';
	import ArrowHead from '../kit/ArrowHead.svelte';
	import { h } from '../../ts/db/DBDispatch';
	import Box from '../kit/Box.svelte';
	export let center = Point.zero;
	export let color = k.color_default;
    export let cluster_layout: ClusterLayout;
	const show_arrowheads = k.show_arrowheads;
	const idDiv = `${cluster_layout?.points_out ? 'child' : 'parent'} ${cluster_layout?.predicate?.kind}`;
	let style = `position: absolute; z-index: ${ZIndex.lines};`;
	let title_origin = Point.zero;
	let line_origin = Point.zero;
	let arrow_start = Point.zero;
	let arrow_end = Point.zero;
	let lineWrapper: Wrapper;
	let svgPath = k.empty;
	let viewBox = k.empty;
	let size = Size.zero;
	let thickness = 5;
	let angle = 0;
	let left = 0;
	let top = 0;
	let line;

	$: {
		if (line && !lineWrapper) {
			lineWrapper = new Wrapper(line, h.rootAncestry, IDWrapper.line);
		}
		angle = cluster_layout?.angle_ofLine;
		const line_tip = cluster_layout?.line_tip;
		const inside_radius = k.cluster_inside_radius + (show_arrowheads ? 8 : 0);
		const inside_rotated = Point.fromPolar(inside_radius, angle);
		const line_offset = updateLine(line_tip, inside_rotated);
		const title_x = u.getWidthOf(cluster_layout?.line_title) / -3;
		const title_offset = new Point(title_x, k.dot_size / -3);
		size = line_tip.abs.asSize;
		const rect = new Rect(Point.zero, size);
		line_origin = center.offsetBy(line_offset);
		svgPath = svgPaths.line(line_tip);
		viewBox = `0, 0, ${size.width}, ${size.height}`;
		title_origin = rect.center.offsetBy(title_offset);
		[arrow_start, arrow_end] = rect.cornersForAngle(angle);
	}

	function updateLine(line_tip: Point, inside_rotated: Point): [number, number] {
		let outside_rotated = inside_rotated;
		if (cluster_layout?.predicate?.isBidirectional || !cluster_layout?.points_out) {
			outside_rotated = inside_rotated.offsetBy(line_tip);
		}
		switch (u.point_quadrant(line_tip)) {
			case Quadrant.upperRight: return new Point( inside_rotated.x,  inside_rotated.y);
			case Quadrant.lowerRight: return new Point( inside_rotated.x, outside_rotated.y);
			case Quadrant.upperLeft:  return new Point(outside_rotated.x,  inside_rotated.y);
			default:				  return new Point(outside_rotated.x, outside_rotated.y);		
		}
	}

</script>

{#key rebuilds}
	<div class='cluster-line' id={idDiv}
		style='position: absolute;
			top: {line_origin.y}px;
			left: {line_origin.x}px;
			z-index: {ZIndex.lines};'>
		<svg class='svg-cluster-line'
			bind:this={line}
			viewBox={viewBox}
			width={size.width}px
			height={size.height}px>
			<path d={svgPath} stroke={color} fill='none'/>
		</svg>
		<div class='cluster-line-label' style='
			background-color: {k.color_background};
			left: {title_origin.x}px;
			top: {title_origin.y}px;
			white-space: nowrap;
			position: absolute;
			font-family: Arial;
			font-size: 0.5em;
			color: {color};'>
			{cluster_layout?.line_title}
		</div>
		{#if show_arrowheads}
			{#if cluster_layout?.predicate?.isBidirectional}
				<ArrowHead idDiv='child'  angle={angle} color={color} color_background={color} radius={thickness} center={arrow_end}/>
				<ArrowHead idDiv='parent' angle={angle + Angle.half} color={color} color_background={color} radius={thickness} center={arrow_start}/>
			{:else if cluster_layout?.points_out}
				<ArrowHead idDiv='child'  angle={angle} color={color} color_background={color} radius={thickness} center={arrow_end}/>
			{:else}
				<ArrowHead idDiv='parent' angle={angle + Angle.half} color={color} color_background={color} radius={thickness} center={arrow_start}/>
			{/if}
		{/if}
	</div>
{/key}
