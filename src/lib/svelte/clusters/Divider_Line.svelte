<script lang='ts'>
	import { k, u, Rect, Size, Point, ZIndex, svgPaths, Quadrant } from '../../ts/common/GlobalImports';
	import { SvelteWrapper, Divider_MapRect, SvelteComponentType } from '../../ts/common/GlobalImports';
	import Identifiable from '../../ts/data/Identifiable';
	import { h } from '../../ts/db/DBDispatch';
	export let center = Point.zero;
	export let color = k.color_default;
    export let divider_map: Divider_MapRect;
	const name = `divider-at-${divider_map?.angle}`;
	let style = `position: absolute; z-index: ${ZIndex.lines};`;
	let lineWrapper: SvelteWrapper;
	let line_origin = Point.zero;
	let linePath = k.empty;
	let viewBox = k.empty;
	let size = Size.zero;
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
		angle = divider_map?.angle;
		const inside_radius = k.cluster_inside_radius;
		const inside_tip = Point.fromPolar(inside_radius, angle);
		const line_tip = divider_map?.line_tip;
		size = line_tip.abs.asSize;
		const rect = new Rect(Point.zero, size);
		linePath = svgPaths.line(line_tip);
		viewBox = `0, 0, ${size.width}, ${size.height}`;
		line_origin = line_origin_using(inside_tip, line_tip);
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

<div class='cluster-line' id={name}
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
</div>
