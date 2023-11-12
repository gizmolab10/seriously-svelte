<script lang='ts'>

	/////////////////////////////////////////////////////
	//	draw a line in rect, curving up, down or flat	//
	/////////////////////////////////////////////////////

	import { Rect, Size, Point, ZIndex, LineCurveType } from '../../ts/common/GlobalImports';
	import { lineStretch, graphOffset } from '../../ts/managers/State'
	export let curveType: string = LineCurveType.up;
	export let rect = new Rect();
	export let thing: Thing;
	let origin = rect.origin;
	let extent = rect.extent;
	let viewBox = new Rect();
	let size = new Size();
	let path = '';

	$: {
		if (curveType == LineCurveType.flat) {
			origin = rect.centerLeft;
			extent = rect.centerRight;
			size = origin.distanceTo(extent).asSize;
			path = 'M0 1 L' + size.width + ' 1';
		} else {
			let flag = 1;
			if (curveType == LineCurveType.down) {
				flag = 0;
				origin = rect.bottomLeft;
				extent = origin.offsetBy(rect.size.asPoint);
			}
			const noHeight = origin.y == extent.y;
			size = origin.distanceTo(extent).asSize;
			const originY = curveType == LineCurveType.down ? 1 : size.height;
			const extentY = curveType == LineCurveType.up   ? 1 : size.height;
			const boxSize = new Size(size.width, (noHeight ? 2 : size.height));
			viewBox = new Rect(origin.offsetByY($graphOffset.y), boxSize);
			path = 'M0 ' + originY + 'A' + size.description + ' 0 0 ' + flag + ' ' + size.width + ' ' + extentY;
		}
	}

</script>

<svg class='line'
	width={size.width}px
	height={Math.max(2, size.height)}px
	style='z-index: {ZIndex.lines};
		top: {origin.y - Math.max(1, size.height)}px;
		left: {origin.x + 143}px;'>
	<path d={path} stroke={thing.color} fill='none'/>
</svg>

<style lang='scss'>
	.line {
		left: 0px;
		position: absolute;
	}
</style>
