<script lang='ts'>
	import { g, k, Rect, Size, Point, onMount, ZIndex, svgPath } from '../../ts/common/GlobalImports';
	import { IDLine, Wrapper, IDWrapper, NecklaceCluster } from '../../ts/common/GlobalImports';
	import Circle from '../kit/Circle.svelte';
	import Box from '../kit/Box.svelte';
    export let cluster: NecklaceCluster;
	export let color = k.color_default;
	export let center = new Point();
	let translated = new Point();
	let scalablePath = k.empty;
	let rotated = new Point();
	let lineWrapper: Wrapper;
	let size = new Size();
	let dot_radius = 2;
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
		const angle = cluster.angle_necklacePredicate + Math.PI/6.5;
		const x = length * Math.cos(angle);
		const y = length * Math.sin(angle);
		const distance = new Point(x, y)
		scalablePath = svgPath.line(x, y);
		rotated = radial.rotateBy(angle);
		size = distance.asSize;
		if (cluster.predicate.directions == 2 || !cluster.pointsTo) {
			translated = rotated.offsetBy(distance);
		} else {
			translated = rotated;
		}
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
		// const other = distance.negated.offsetBy(new Point(7, 34.5));
		// translated = translated.offsetBy(other);
		// rotated = rotated.offsetBy(other);
	}

</script>

<div class='arrow'
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
		<Circle radius={dot_radius} center={rotated} color={color} thickness={thickness}/>
		<Circle radius={dot_radius} center={translated} color={color} thickness={thickness}/>
	{:else if cluster.pointsTo}
		<Circle radius={dot_radius} center={rotated} color={color} thickness={thickness}/>
	{:else}
		<Circle radius={dot_radius} center={translated} color={color} thickness={thickness}/>
	{/if}
</div>