<script lang='ts'>
	import { k, Rect, Size, Point, debug, ZIndex, signals, svgPaths } from '../../ts/common/GlobalImports';
	import { Wrapper, Ancestry, debugReact, IDWrapper, IDLine } from '../../ts/common/GlobalImports';
	import { s_thing_changed } from '../../ts/state/State';
	import Circle from '../kit/Circle.svelte';
	import Box from '../kit/Box.svelte';
    export let ancestry;
	export let rect = new Rect();
	export let curveType: string = IDLine.up;
	const debugOffset = new Point(140.5, -1.2);
	let scalablePath = k.empty;
	let lineWrapper: Wrapper;
	let origin = rect.origin;
	let extent = rect.extent;
	let viewBox = new Rect();
	let size = new Size();
	let rebuilds = 0;
	let line;

	$: {
		if (line) {
			lineWrapper = new Wrapper(line, ancestry, IDWrapper.line);
		}
	}

	$: {
		if (ancestry.thing.id == $s_thing_changed.split(k.genericSeparator)[0]) {
			rebuilds += 1;
		}
	}

	////////////////////////////////////////////////////
	//	draw a curved line in rect, up, down or flat  //
	////////////////////////////////////////////////////

	$: {
		if (k.dot_size > 0) {
			// debugReact.log_origins(`LINE ${ancestry.thing.description}`);
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
					size = origin.distanceTo(extent).abs.asSize;
					scalablePath = svgPaths.line(new Point(size.width, 0));
					break;
			}
			if (curveType != IDLine.flat) {
				let flag = (curveType == IDLine.down) ? 0 : 1;
				const noHeight = origin.y == extent.y;
				size = origin.distanceTo(extent).abs.asSize;
				const originY = curveType == IDLine.down ? 1 : size.height;
				const extentY = curveType == IDLine.up   ? 1 : size.height;
				const boxSize = new Size(size.width, (noHeight ? 2 : size.height));
				viewBox = new Rect(origin, boxSize);
				scalablePath = 'M0 ' + originY + 'A' + size.description + ' 0 0 ' + flag + k.space + size.width + k.space + extentY;
			}
		}
	}

</script>

<style lang='scss'>
	.svg-tree-line {
		position: absolute;
	}
</style>

{#key rebuilds}
	<svg class='svg-tree-line'
		bind:this={line}
		width={size.width}px
		height={Math.max(2, size.height)}px
		style='z-index: {ZIndex.lines};
			top: {origin.y - Math.max(1, size.height)}px;
			left: {origin.x + 142}px;'>
		<path d={scalablePath} stroke={ancestry.thing.color} fill='none'/>
	</svg>
	{#if debug.lines}
		<Circle radius=1 center={rect.extent.offsetBy(debugOffset)} color=black thickness=1/>
	{/if}
{/key}
