<script lang='ts'>
	import { Rect, Size, Point, debug, onMount, ZIndex, SVGType, svgPath, Wrapper, debugReact, LineCurveType } from '../../ts/common/GlobalImports';
	import { dot_size } from '../../ts/managers/State';
	import Circle from '../kit/Circle.svelte';
	import Box from '../kit/Box.svelte';
	export let curveType: string = LineCurveType.up;
	export let rect = new Rect();
	export let thing: Thing;
	const debugOffset = new Point(141, -1.5);
	let origin = rect.origin;
	let extent = rect.extent;
	let viewBox = new Rect();
	let size = new Size();
	let wrapper: Wrapper;
	let path = '';

	////////////////////////////////////////////////////
	//	draw a curved line in rect, up, down or flat  //
	////////////////////////////////////////////////////

	onMount(() => {
		wrapper = new Wrapper(this);
	})

	$: {
		if ($dot_size > 0) {
			// debugReact.log_origins(`LINE ${thing.description}`);
			switch (curveType) {
				case LineCurveType.up:
					origin = rect.origin;
					extent = rect.extent.offsetByY(-1.5);
					break;
				case LineCurveType.down:
					origin = rect.bottomLeft.offsetByY(-0.5);
					extent = origin.offsetBy(rect.size.asPoint).offsetByY(0.5);
					break;
				case LineCurveType.flat:
					origin = rect.centerLeft.offsetByY(-0.5);
					extent = rect.centerRight.offsetBy(new Point(0.5, -0.5));
					size = origin.distanceTo(extent).asSize;
					path = svgPath.line(size.width);
					break;
			}
			if (curveType != LineCurveType.flat) {
				let flag = (curveType == LineCurveType.down) ? 0 : 1;
				const noHeight = origin.y == extent.y;
				size = origin.distanceTo(extent).asSize;
				const originY = curveType == LineCurveType.down ? 1 : size.height;
				const extentY = curveType == LineCurveType.up   ? 1 : size.height;
				const boxSize = new Size(size.width, (noHeight ? 2 : size.height));
				viewBox = new Rect(origin, boxSize);
				path = 'M0 ' + originY + 'A' + size.description + ' 0 0 ' + flag + ' ' + size.width + ' ' + extentY;
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
	width={size.width}px
	height={Math.max(2, size.height)}px
	style='z-index: {ZIndex.lines};
		top: {origin.y - Math.max(1, size.height)}px;
		left: {origin.x + 142}px;'>
	<path d={path} stroke={thing.color} fill='none'/>
</svg>
{#if debug.lines}
	<!--Box rect={rect.offsetBy(debugOffset)} color=gray/-->
	<Circle radius=1 center={rect.extent.offsetBy(debugOffset)} color=black thickness=1/>
{/if}
