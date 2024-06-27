<script lang='ts'>
	import { Quadrant, Cluster_Map, SvelteWrapper, SvelteComponentType } from '../../ts/common/GlobalImports';
	import { k, u, Rect, Size, Point, Angle, ZIndex, IDLine, svgPaths } from '../../ts/common/GlobalImports';
	import Identifiable from '../../ts/data/Identifiable';
	import ArrowHead from '../kit/ArrowHead.svelte';
	import { h } from '../../ts/db/DBDispatch';
	export let center = Point.zero;
	export let color = k.color_default;
    export let cluster_map: Cluster_Map;
	const show_arrowheads = k.show_arrowheads;
	const predicate = cluster_map?.predicate;
	const name = `${cluster_map?.points_out ? 'child' : 'parent'} ${predicate?.kind}`;
	let style = `position: absolute; z-index: ${ZIndex.lines};`;
	let lineWrapper: SvelteWrapper;
	let title_origin = Point.zero;
	let line_origin = Point.zero;
	let arrow_start = Point.zero;
	let arrow_end = Point.zero;
	let linePath = k.empty;
	let viewBox = k.empty;
	let size = Size.zero;
	let thickness = 5;
	let angle = 0;
	let left = 0;
	let top = 0;
	let line;

	// given angle & rect (computed in )
	// draw a line & its label

	$: {
		if (line && !lineWrapper) {
			lineWrapper = new SvelteWrapper(line, handle_mouseData, Identifiable.newID(), SvelteComponentType.line);
		}
		angle = cluster_map?.angle_ofLine;
		const inside_radius = k.cluster_inside_radius + (show_arrowheads ? 8 : 0);
		const inside_tip = Point.fromPolar(inside_radius, -angle);
		const line_tip = cluster_map?.line_tip;
		size = line_tip.abs.asSize;
		const titleRect = new Rect(center.offsetBy(inside_tip.multipliedBy(1.6)), size.multipliedBy(1/2));
		viewBox = `0, 0, ${size.width}, ${size.height}`;
		title_origin = title_origin_for(angle, titleRect);
	}

	function title_origin_for(angle: number, rect: Rect): Point {
		const quadrant = u.quadrant_ofAngle(angle);
		const title = cluster_map?.line_title;
		let multiplier = -1.5;
		if (u.isAlmost_horizontal(angle)) {
			switch (quadrant) {
				case Quadrant.lowerLeft: multiplier = -0.5; break;
				case Quadrant.upperLeft: multiplier = 0.5; break;
				case Quadrant.upperRight: multiplier = 0.5; break;
			}
		}
		const title_y = k.dot_size * multiplier;
		const title_x = u.getWidthOf(title) / -2;
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
 
	function isHit(): boolean {
		return false
	}

	function handle_mouseData(mouseData: Mouse_State): boolean {
		return false;
	}

</script>

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
	{cluster_map?.line_title}
</div>