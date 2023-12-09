<script lang='ts'>
	import { Rect, Size, Point, debug, ZIndex, SVGType, svgPath, LineCurveType } from '../../ts/common/GlobalImports';
	import { dot_size, line_stretch, user_graphOffset } from '../../ts/managers/State';
	import Circle from '../kit/Circle.svelte';
	import Box from '../kit/Box.svelte';
	export let curveType = '';
	export let thing: Thing;
	export let origin = 0;
	export let extent = 0;
	const height = Math.abs(extent - origin);
	let viewBox = '';
	let path = '';

	//////////////////////////////////////////
	//	draw a line, from origin to extent	//
	//	  flat, curved up or curved down	//
	//////////////////////////////////////////

	$: {
		if ($line_stretch > 0) {
			if (curveType == LineCurveType.flat) {
				path = svgPath.line(origin, $line_stretch);
				viewBox = `0 ${origin} ${$line_stretch} 2`;
			} else {
				let o = origin;
				let e = extent;
				if (curveType == LineCurveType.up) {
					o = extent;
					e = origin;
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
		top: {Math.min(origin, extent)}px;'>
	<svg class='svg'
		viewBox={viewBox}
		width={$line_stretch}px
		height={Math.max(2, height)}px
		style='z-index: {ZIndex.lines};'>
		<path d={path} stroke={thing.color} fill='none'/>
	</svg>
	{#if debug.lines}
		<Circle radius=1 center={new Point($line_stretch, extent - 46)} color=red thickness=1/>
	{/if}
</div>
