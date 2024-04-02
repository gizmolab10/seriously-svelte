<script lang='ts'>
	import { g, k, Rect, Size, Point, onMount, ZIndex, svgPath } from '../../ts/common/GlobalImports';
	import { IDLine, Wrapper, IDWrapper, NecklaceCluster } from '../../ts/common/GlobalImports';
	import Circle from '../kit/Circle.svelte';
	import Box from '../kit/Box.svelte';
    export let cluster: NecklaceCluster;
	export let origin = new Point();
	export let color = 'red';
	let scalablePath = k.empty;
	let lineWrapper: Wrapper;
	let extent = new Point();
	let offset = new Point();
	let size = new Size();
	let thickness = 1;
	let radius = 2;
	let left = 0;
	let top = 0;
	let line;

	$: {
		if (line && !lineWrapper) {
			lineWrapper = new Wrapper(line, g.rootPath, IDWrapper.line);
		}
		const length = k.necklace_radius - k.cluster_focus_radius - k.dot_size;
		const radial = new Point(k.cluster_focus_radius + 2, 0);
		const angle = cluster.necklace_angle + Math.PI/6.5;
		const x = length * Math.cos(angle);
		const y = length * Math.sin(angle);
		const distance = new Point(x, y)
		offset = radial.rotateBy(angle);
		scalablePath = svgPath.line(x, y);
		size = distance.asSize;
		if (cluster.predicate.directions == 2 || !cluster.isFrom) {
			extent = offset.offsetBy(distance);
		} else {
			extent = offset;
		}
		if (x < 0 && y < 0) {
			left = extent.x;
			top = extent.y;
		} else if (x < 0 && y >= 0) {
			left = extent.x;
			top = offset.y;
		} else if (x >= 0 && y < 0) {
			left = offset.x;
			top = extent.y;
		} else if (x >= 0 && y >= 0) {
			left = offset.x;
			top = offset.y;
		}
		const other = origin.distanceTo(new Point(left, top))
		console.log(`${cluster.predicate.kind} ${(angle / Math.PI * 180).toFixed(2)} (${other.x.toFixed(2)}, ${other.y.toFixed(2)})`)
	}

</script>

<div class='arrow'
	style='z-index: {ZIndex.lines};
	position: absolute;
	left: {left + origin.x}px;
	top: {top + origin.y}px;'>
	<svg class='line'
		bind:this={line}
		width={size.width}px
		height={size.height}px>
		style='position: absolute'
		<path d={scalablePath} stroke={color} fill='none'/>
	</svg>
	{#if cluster.predicate.directions == 2}
		<Circle radius={radius} center={offset} color={color} thickness={thickness}/>
		<Circle radius={radius} center={extent} color={color} thickness={thickness}/>
	{:else if cluster.isFrom}
		<Circle radius={radius} center={offset} color={color} thickness={thickness}/>
	{:else}
		<Circle radius={radius} center={extent} color={color} thickness={thickness}/>
	{/if}
</div>