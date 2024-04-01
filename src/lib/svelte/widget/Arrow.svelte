<script lang='ts'>
	import { g, k, Rect, Size, Point, debug, onMount, ZIndex, svgPath } from '../../ts/common/GlobalImports';
	import { IDLine, Wrapper, debugReact, IDWrapper, NecklaceCluster } from '../../ts/common/GlobalImports';
	import Circle from '../kit/Circle.svelte';
	import Box from '../kit/Box.svelte';
    export let cluster: NecklaceCluster;
	export let origin = new Point();
	let scalablePath = k.empty;
	let lineWrapper: Wrapper;
	let offset = new Point();
	let size = new Size();
	let line;

	$: {
		if (line && !lineWrapper) {
			lineWrapper = new Wrapper(line, g.rootPath, IDWrapper.line);
		}
		const length = k.necklace_radius - k.cluster_focus_radius - k.dot_size;
		const angle = cluster.necklace_angle;
		const x = length * Math.cos(angle);
		const y = length * Math.sin(angle);
		offset = new Point(k.cluster_focus_radius + 2, 0).rotateBy(angle).offsetBy(origin);
		scalablePath = svgPath.line(x, y);
		size = new Size(x, y);
	}

</script>

<style lang='scss'>
	.line {
		position: absolute;
	}
</style>

<svg class='line'
	bind:this={line}
	width={size.width}px
	height={Math.max(2, size.height)}px
	style='z-index: {ZIndex.lines};
		top: {offset.y}px;
		left: {offset.x}px;'>
	<path d={scalablePath} stroke=red fill='none'/>
</svg>
{#if debug.lines}
	<Circle radius=1 center={rect.extent.offsetBy(debugOffset)} color=black thickness=1/>
{/if}
