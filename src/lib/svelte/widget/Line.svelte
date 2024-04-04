<script lang='ts'>
	import { k, Path, Rect, Size, Point, debug, onMount, ZIndex, svgPaths } from '../../ts/common/GlobalImports';
	import { Wrapper, debugReact, IDWrapper, IDLine } from '../../ts/common/GlobalImports';
	import Circle from '../kit/Circle.svelte';
	import Box from '../kit/Box.svelte';
	export let curveType: string = IDLine.up;
	export let rect = new Rect();
    export let path;
	const debugOffset = new Point(140.5, -1.2);
	let lineWrapper: Wrapper;
	let origin = rect.origin;
	let extent = rect.extent;
	let viewBox = new Rect();
	let svgPath = k.empty;
	let size = new Size();
	let line;

	$: {
		if (line) {
			lineWrapper = new Wrapper(line, path, IDWrapper.line);
		}
	}

	////////////////////////////////////////////////////
	//	draw a curved line in rect, up, down or flat  //
	////////////////////////////////////////////////////

	$: {
		if (k.dot_size > 0) {
			// debugReact.log_origins(`LINE ${path.thing.description}`);
			switch (curveType) {
				case IDLine.up:
					origin = rect.origin;
					extent = rect.extent.offsetByY(-1.5);
					break;
				case IDLine.down:
					origin = rect.bottomLeft.offsetByY(-0.5);
					extent = origin.offsetBy(rect.size.asPoint).offsetByY(0.5);
					break;
				case IDLine.flat:
					origin = rect.centerLeft.offsetByY(-0.5);
					extent = rect.centerRight.offsetBy(new Point(0.5, -0.5));
					size = origin.distanceTo(extent).asSize;
					svgPath = svgPaths.line(new Point(size.width, 0));
					break;
			}
			if (curveType != IDLine.flat) {
				let flag = (curveType == IDLine.down) ? 0 : 1;
				const noHeight = origin.y == extent.y;
				size = origin.distanceTo(extent).asSize;
				const originY = curveType == IDLine.down ? 1 : size.height;
				const extentY = curveType == IDLine.up   ? 1 : size.height;
				const boxSize = new Size(size.width, (noHeight ? 2 : size.height));
				viewBox = new Rect(origin, boxSize);
				svgPath = 'M0 ' + originY + 'A' + size.description + ' 0 0 ' + flag + k.space + size.width + k.space + extentY;
			}
		}
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
		top: {origin.y - Math.max(1, size.height)}px;
		left: {origin.x + 142}px;'>
	<path d={svgPath} stroke={path.thing.color} fill='none'/>
</svg>
{#if debug.lines}
	<Circle radius=1 center={rect.extent.offsetBy(debugOffset)} color=black thickness=1/>
{/if}
