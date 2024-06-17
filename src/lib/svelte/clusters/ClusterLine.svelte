<script lang='ts'>
	import { IDLine, Quadrant, SvelteWrapper, SvelteComponentType, ClusterMap } from '../../ts/common/GlobalImports';
	import { k, u, Rect, Size, Point, Angle, ZIndex, svgPaths } from '../../ts/common/GlobalImports';
	import ArrowHead from '../kit/ArrowHead.svelte';
	import { h } from '../../ts/db/DBDispatch';
	import Box from '../kit/Box.svelte';
	export let center = Point.zero;
	export let color = k.color_default;
    export let layout: ClusterMap;
	const show_arrowheads = k.show_arrowheads;
	const predicate = layout?.predicate;
	const idDiv = `${layout?.points_out ? 'child' : 'parent'} ${predicate?.kind}`;
	let style = `position: absolute; z-index: ${ZIndex.lines};`;
	let title_origin = Point.zero;
	let line_origin = Point.zero;
	let arrow_start = Point.zero;
	let arrow_end = Point.zero;
	let lineWrapper: SvelteWrapper;
	let linePath = k.empty;
	let viewBox = k.empty;
	let size = Size.zero;
	let thickness = 5;
	let angle = 0;
	let left = 0;
	let top = 0;
	let line;

	$: {
		if (line && !lineWrapper) {
			lineWrapper = new SvelteWrapper(line, h.rootAncestry, SvelteComponentType.line);
		}
		angle = layout?.angle_ofLine;
		const inside_radius = k.cluster_inside_radius + (show_arrowheads ? 8 : 0);
		const inside_tip = Point.fromPolar(inside_radius, angle);
		const line_tip = layout?.line_tip;
		size = line_tip.abs.asSize;
		const rect = new Rect(Point.zero, size);
		linePath = svgPaths.line(line_tip);
		viewBox = `0, 0, ${size.width}, ${size.height}`;
		line_origin = line_origin_using(inside_tip, line_tip);
		title_origin = title_origin_for(angle, rect);
		[arrow_start, arrow_end] = rect.cornersForAngle(angle);
	}

	function title_origin_for(angle: number, rect: Rect): Point {
		const quadrant = u.quadrant_ofNotNormalized_angle(angle);
		let multiplier = -1.5;
		if (u.isAlmost_horizontal(angle)) {
			switch (quadrant) {
				case Quadrant.lowerRight: multiplier = -1.5; break;
				case Quadrant.upperRight: multiplier = 0.5; break;
				case Quadrant.lowerLeft: multiplier = -1.5; break;
				case Quadrant.upperLeft: multiplier = 0.5; break;
			}
		}
		const title_y = k.dot_size * multiplier;
		const title_x = u.getWidthOf(layout?.line_title) / -3;
		const title_offset = new Point(title_x, title_y);
		return rect.center.offsetBy(title_offset);
	}

	function line_origin_using(start: Point, end: Point): Point {
		const quadrant = u.quadrant_ofPoint(end);
		let fromCenter = start;
		switch (quadrant) {
			case Quadrant.upperRight: fromCenter = start.offsetByY(end.y); break;
			case Quadrant.lowerLeft:  fromCenter = start.offsetByX(end.x); break;
			case Quadrant.upperLeft:  fromCenter = end.offsetBy(start); break;
		}
		return center.offsetBy(fromCenter);
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
		<path d={linePath} stroke={color} fill='none'/>
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
		{layout?.line_title}
	</div>
	{#if show_arrowheads}
		{#if predicate?.isBidirectional}
			<ArrowHead idDiv='child'  angle={angle} color={color} color_background={color} radius={thickness} center={arrow_end}/>
			<ArrowHead idDiv='parent' angle={angle + Angle.half} color={color} color_background={color} radius={thickness} center={arrow_start}/>
		{:else if layout?.points_out}
			<ArrowHead idDiv='child'  angle={angle} color={color} color_background={color} radius={thickness} center={arrow_end}/>
		{:else}
			<ArrowHead idDiv='parent' angle={angle + Angle.half} color={color} color_background={color} radius={thickness} center={arrow_start}/>
		{/if}
	{/if}
</div>
