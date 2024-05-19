<script lang='ts'>
	import { IDLine, Quadrant, Wrapper, IDWrapper, ClusterLayout } from '../../ts/common/GlobalImports';
	import { k, u, Rect, Size, Point, Angle, ZIndex, svgPaths } from '../../ts/common/GlobalImports';
	import ArrowHead from '../kit/ArrowHead.svelte';
	import { h } from '../../ts/db/DBDispatch';
	import Box from '../kit/Box.svelte';
	export let center = Point.zero;
	export let color = k.color_default;
    export let clusterLayout: ClusterLayout;
	const show_arrowheads = k.show_arrowheads;
	const predicate = clusterLayout?.predicate;
	const idDiv = `${clusterLayout?.points_out ? 'child' : 'parent'} ${predicate?.kind}`;
	let style = `position: absolute; z-index: ${ZIndex.lines};`;
	let title_origin = Point.zero;
	let line_origin = Point.zero;
	let arrow_start = Point.zero;
	let arrow_end = Point.zero;
	let scalablePath = k.empty;
	let lineWrapper: Wrapper;
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
		angle = clusterLayout?.angle_ofLine;
		const inside_radius = k.cluster_inside_radius + (show_arrowheads ? 8 : 0);
		const inside_tip = Point.fromPolar(inside_radius, angle);
		const line_tip = clusterLayout?.line_tip;
		size = line_tip.abs.asSize;
		scalablePath = svgPaths.line(line_tip);
		viewBox = `0, 0, ${size.width}, ${size.height}`;
		line_origin = line_origin_using(inside_tip, line_tip);
		const title_x = u.getWidthOf(clusterLayout?.line_title) / -3;
		const title_y = k.dot_size / (u.isAlmost_horizontal(angle) ? 2 : -3);
		const title_offset = new Point(title_x, title_y);
		const rect = new Rect(Point.zero, size);
		title_origin = rect.center.offsetBy(title_offset);
		[arrow_start, arrow_end] = rect.cornersForAngle(angle);
	}

	function line_origin_using(inside_tip: Point, line_tip: Point): Point {
		let offset = inside_tip;
		const quadrant = u.quadrant_ofPoint(line_tip);
		const isTiltedDown = [Quadrant.lowerRight, Quadrant.upperLeft].includes(quadrant);
		switch (quadrant) {
			case Quadrant.upperRight: offset = inside_tip.offsetByY(line_tip.y); break;
			case Quadrant.lowerLeft:  offset = inside_tip.offsetByX(line_tip.x); break;
			case Quadrant.upperLeft:  offset = line_tip.offsetBy(inside_tip); break;
		}
		return center.offsetBy(offset);
	}

</script>

<div class='cluster-line' id={idDiv}
	style='z-index: {ZIndex.lines};
		left: {line_origin.x}px;
		top: {line_origin.y}px;
		position: absolute;'>
	<svg class='svg-cluster-line'
		height={size.height}px
		width={size.width}px
		viewBox={viewBox}
		bind:this={line}>
		<path d={scalablePath} stroke={color} fill='none'/>
	</svg>
	<div class='cluster-line-label'
		style='
			background-color: {k.color_background};
			left: {title_origin.x}px;
			top: {title_origin.y}px;
			white-space: nowrap;
			position: absolute;
			font-family: Arial;
			font-size: 0.5em;
			color: {color};'>
		{clusterLayout?.line_title}
	</div>
	{#if show_arrowheads}
		{#if predicate?.isBidirectional}
			<ArrowHead idDiv='child'  angle={angle} color={color} color_background={color} radius={thickness} center={arrow_end}/>
			<ArrowHead idDiv='parent' angle={angle + Angle.half} color={color} color_background={color} radius={thickness} center={arrow_start}/>
		{:else if clusterLayout?.points_out}
			<ArrowHead idDiv='child'  angle={angle} color={color} color_background={color} radius={thickness} center={arrow_end}/>
		{:else}
			<ArrowHead idDiv='parent' angle={angle + Angle.half} color={color} color_background={color} radius={thickness} center={arrow_start}/>
		{/if}
	{/if}
</div>
