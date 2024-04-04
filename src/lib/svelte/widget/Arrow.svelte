<script lang='ts'>
	import { g, k, u, Rect, Size, Point, Angles, onMount, ZIndex, svgPath } from '../../ts/common/GlobalImports';
	import { IDLine, Quadrant, Wrapper, IDWrapper, NecklaceCluster } from '../../ts/common/GlobalImports';
	import ArrowHead from '../kit/ArrowHead.svelte';
	import Box from '../kit/Box.svelte';
    export let cluster: NecklaceCluster;
	export let color = k.color_default;
	export let center = Point.zero;
	const name = `${cluster.pointsTo ? 'to' : 'from'} ${cluster.predicate.kind}`;
	let scalablePath = k.empty;
	let lineWrapper: Wrapper;
	let origin = Point.zero;
	let extent = Point.zero;
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
		const length = k.necklace_radius - k.cluster_focus_radius - k.dot_size;
		const rotated = new Point(k.cluster_focus_radius, 0).rotateBy(angle);
		const vector = new Point(length, 0).rotateBy(angle);
		const rect = new Rect(Point.zero, vector.asSize);
		[origin, extent] = rect.cornersForAngle(angle);
		[left, top] = updateLine(vector, rotated);
		scalablePath = svgPath.line(vector);
		size = vector.asSize;
	}

	function updateLine(vector: Point, rotated: Point): [number, number] {
		let translated = rotated;
		if (cluster.predicate.directions == 2 || !cluster.pointsTo) {
			translated = rotated.offsetBy(vector);
		}
		switch (u.point_quadrant(vector)) {
			case Quadrant.upperRight: return [rotated.x, rotated.y];
			case Quadrant.lowerRight: return [rotated.x, translated.y];
			case Quadrant.upperLeft:  return [translated.x, rotated.y];
			default:				  return [translated.x, translated.y];		
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
		<path d={scalablePath} stroke={color} fill='none'/>
	</svg>
	{#if cluster.predicate.directions == 2}
		<ArrowHead name='to'   angle={angle} color={color} color_background={color} radius={thickness} center={extent}/>
		<ArrowHead name='from' angle={angle + Angles.half} color={color} color_background={color} radius={thickness} center={origin}/>
	{:else if cluster.pointsTo}
		<ArrowHead name='to'   angle={angle} color={color} color_background={color} radius={thickness} center={extent}/>
	{:else}
		<ArrowHead name='from' angle={angle + Angles.half} color={color} color_background={color} radius={thickness} center={origin}/>
	{/if}
</div>