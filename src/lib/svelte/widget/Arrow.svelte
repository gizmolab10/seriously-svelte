<script lang='ts'>
	import { g, k, u, Rect, Size, Point, onMount, ZIndex, svgPath } from '../../ts/common/GlobalImports';
	import { IDLine, Quadrant, Wrapper, IDWrapper, NecklaceCluster } from '../../ts/common/GlobalImports';
	import Circle from '../kit/Circle.svelte';
	import Box from '../kit/Box.svelte';
    export let cluster: NecklaceCluster;
	export let color = k.color_default;
	export let center = Point.zero;
	const name = `${cluster.pointsTo ? 'to' : 'from'} ${cluster.predicate.kind}`;
	let translated = Point.zero;
	let scalablePath = k.empty;
	let lineWrapper: Wrapper;
	let rotated = Point.zero;
	let origin = Point.zero;
	let extent = Point.zero;
	let size = Size.zero;
	let rect = Rect.zero;
	let thickness = 1;
	let left = 0;
	let top = 0;
	let line;

	$: {
		if (line && !lineWrapper) {
			lineWrapper = new Wrapper(line, g.rootPath, IDWrapper.line);
		}
		const length = k.necklace_radius - k.cluster_focus_radius - k.dot_size;
		const radial = new Point(k.cluster_focus_radius, 0);
		const angle = cluster.angle + Math.PI/6.9;
		const x = length * Math.cos(angle);
		const y = length * Math.sin(angle);
		scalablePath = svgPath.line(x, y);
		rotated = radial.rotateBy(angle);
		extent = new Point(x, y)
		size = extent.asSize;
		if (cluster.predicate.directions == 2 || !cluster.pointsTo) {
			translated = rotated.offsetBy(extent);
		} else {
			translated = rotated;
		}
		updateTips(angle);
		updateLine(x, y);
	}

	function updateLine(x: number, y: number) {
		if (x >= 0 && y >= 0) {
			left = rotated.x;
			top = rotated.y;
		} else if (x >= 0 && y < 0) {
			left = rotated.x;
			top = translated.y;
		} else if (x < 0 && y >= 0) {
			left = translated.x;
			top = rotated.y;
		} else if (x < 0 && y < 0) {
			left = translated.x;
			top = translated.y;
		}
	}

	function updateTips(angle: number) {
		rect = new Rect(Point.zero, size);
		switch (u.angle_quadrant(angle)) {
			case Quadrant.upperRight:
				origin = rect.bottomLeft;
				extent = rect.topRight
				break;
			case Quadrant.upperLeft:
				origin = rect.extent;
				extent = rect.origin
				break;
			case Quadrant.lowerLeft:
				origin = rect.topRight;
				extent = rect.bottomLeft
				break;
			case Quadrant.lowerRight:
				origin = rect.origin;
				extent = rect.extent
				break;
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
		<Circle name='to'   color={color} color_background={color} thickness={thickness} center={extent}/>
		<Circle name='from' color={color} color_background={color} thickness={thickness} center={origin}/>
	{:else if cluster.pointsTo}
		<Circle name='to'   color={color} color_background={color} thickness={thickness} center={extent}/>
	{:else}
		<Circle name='from' color={color} color_background={color} thickness={thickness} center={origin}/>
	{/if}
</div>