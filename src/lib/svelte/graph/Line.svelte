<script lang='ts'>
	import { Rect, Size, Point, debug, ZIndex, SVGType, svgPath, LineCurveType } from '../../ts/common/GlobalImports';
	import { dot_size, line_stretch, user_graphOffset } from '../../ts/managers/State';
	import Circle from '../kit/Circle.svelte';
	import Box from '../kit/Box.svelte';
	export let curveType = '';
	export let thing: Thing;
	export let yOrigin = 0;
	export let yExtent = 0;
	const height = Math.abs(yExtent - yOrigin);
	let viewBox = '';
	let path = '';

	//////////////////////////////////////////////
	//	 draw a line, from yOrigin to yExtent	//
	//		flat, curved up or curved down		//
	//		 	width = $line_stretch			//
	//////////////////////////////////////////////

	$: {
		if ($line_stretch > 0) {
			if (curveType == LineCurveType.flat) {
				path = svgPath.line(yOrigin, $line_stretch);
				viewBox = `0 ${yOrigin} ${$line_stretch} 2`;
			} else {
				let o = yOrigin;
				let e = yExtent;
				if (curveType == LineCurveType.up) {
					o = yExtent;
					e = yOrigin;
				}
				const size = new Size($line_stretch, height).description;
				viewBox = `0 ${o} ${size}`;
				if (curveType == LineCurveType.down) {
					path = 'M1 ' + o + 'A' + size + ' 0 0 0 ' + $line_stretch + ' ' + e;
				} else {
					path = 'M1 ' + e + 'A' + size + ' 0 0 1 ' + $line_stretch + ' ' + o;
				}
			}
		}
	}

</script>

<style lang='scss'>
	.svg {
		left: 0px;
		position: absolute;
	}
</style>

<div class='line'
	style='
		left: 0px;
		width: {$line_stretch}px;
		position: absolute;
		height: {Math.max(2, height)}px;
		top: {Math.min(yOrigin, yExtent)}px;'>
	<svg class='svg'
		viewBox={viewBox}
		width={$line_stretch}px
		height={Math.max(2, height)}px
		style='z-index: {ZIndex.lines};'>
		<path d={path} stroke={thing.color} fill='none'/>
	</svg>
	{#if debug.lines}
		<Circle radius=1 center={new Point($line_stretch, yExtent - 46)} color=red thickness=1/>
	{/if}
</div>
