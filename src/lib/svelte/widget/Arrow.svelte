<script lang='ts'>
	import { g, k, u, Rect, Size, Point, Angles, onMount, ZIndex, svgPaths } from '../../ts/common/GlobalImports';
	import { IDLine, Quadrant, Wrapper, IDWrapper, ClusterLayout } from '../../ts/common/GlobalImports';
	import ArrowHead from '../kit/ArrowHead.svelte';
	import Box from '../kit/Box.svelte';
    export let cluster: ClusterLayout;
	export let color = k.color_default;
	export let center = Point.zero;
	const showArrows = false;
	const name = `${cluster.pointsTo ? 'to' : 'from'} ${cluster.predicate.kind}`;
	let head_start = Point.zero;
	let head_end = Point.zero;
	let lineWrapper: Wrapper;
	let svgPath = k.empty;
	let size = Size.zero;
	let label_top = 10;
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
		const focus_radius = k.cluster_focus_radius + (showArrows ? 8 : 0);
		const length = k.necklace_gap - k.dot_size * (showArrows ? 8 : 0.4);
		const length_rotated = new Point(length, 0).rotateBy(angle);
		const focus_rotated = new Point(focus_radius, 0).rotateBy(angle);
		svgPath = svgPaths.line(length_rotated);
		size = length_rotated.abs.asSize;
		[left, top] = updateLine(length_rotated, focus_rotated);
		[head_start, head_end] = new Rect(Point.zero, size).cornersForAngle(angle);
		switch (u.angle_quadrant(angle)) {
			case Quadrant.upperRight: label_top = 40; break;
			case Quadrant.lowerLeft:  label_top = 20; break;
			case Quadrant.upperLeft:  break;
			default:				  break;
		}
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
		top: {top + center.y}px;
		left: {left + center.x}px;'>
	<svg class='line'
		bind:this={line}
		width={size.width}px
		height={size.height}px>
		style='z-index: {ZIndex.lines}; position: absolute'
		<path d={svgPath} stroke={color} fill='none'/>
	</svg>
	<div class='label' style='
		position: absolute;
		font-family: Arial;
		top: {label_top}px;
		font-size: 0.5em;
		color: {color};
		background-color: {k.color_background};
		left: 20px;'>
		{cluster.title}
	</div>
	{#if showArrows}
		{#if cluster.predicate.directions == 2}
			<ArrowHead name='to'   angle={angle} color={color} color_background={color} radius={thickness} center={head_end}/>
			<ArrowHead name='from' angle={angle + Angles.half} color={color} color_background={color} radius={thickness} center={head_start}/>
		{:else if cluster.pointsTo}
			<ArrowHead name='to'   angle={angle} color={color} color_background={color} radius={thickness} center={head_end}/>
		{:else}
			<ArrowHead name='from' angle={angle + Angles.half} color={color} color_background={color} radius={thickness} center={head_start}/>
		{/if}
	{/if}
</div>