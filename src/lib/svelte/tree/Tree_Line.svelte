<script lang='ts'>
	import { k, Rect, Size, Point, debug, ZIndex, signals, svgPaths } from '../../ts/common/Global_Imports';
	import { Svelte_Wrapper, Ancestry, SvelteComponentType, IDLine } from '../../ts/common/Global_Imports';
	import { s_color_thing } from '../../ts/state/Svelte_Stores';
	import Circle from '../kit/Circle.svelte';
    export let ancestry;
	export let rect = new Rect();
	export let curveType: string = IDLine.up;
	const debugOffset = new Point(131, -0.5);
	let lineWrapper: Svelte_Wrapper;
	let origin = rect.origin;
	let extent = rect.extent;
	let viewBox = new Rect();
	let linePath = k.empty;
	let size = Size.zero;
	let rebuilds = 0;
	let line;

	$: {
		if (!!line) {
			lineWrapper = new Svelte_Wrapper(line, handle_mouse_state, ancestry.idHashed, SvelteComponentType.line);
		}
	}

	$: {
		if (!!ancestry.thing && ancestry.thing.id == $s_color_thing?.split(k.generic_separator)[0]) {
			rebuilds += 1;
		}
	}

	////////////////////////////////////////////////////
	//	draw a curved line in rect, up, down or flat  //
	////////////////////////////////////////////////////

	$: {
		if (k.dot_size > 0) {
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
					rect = rect.offsetByY(-1.5);
					origin = rect.centerLeft;
					extent = rect.centerRight;
					linePath = svgPaths.line(origin.vector_to(extent));
					break;
			}
			const vector = origin.vector_to(extent);
			size = vector.abs.asSize;
			if (curveType != IDLine.flat) {
				const flag = (curveType == IDLine.down) ? 0 : 1;
				const originY = curveType == IDLine.down ? 0 : size.height;
				const extentY = curveType == IDLine.up   ? 0 : size.height;
				linePath = `M0 ${originY} A ${size.description} 0 0 ${flag} ${size.width} ${extentY}`;
			}
			const boxSize = new Size(size.width, Math.max(2, size.height));
			viewBox = new Rect(origin, boxSize);
		}
	}
 
	function isHit(): boolean {
		return false
	}

	function handle_mouse_state(mouse_state: Mouse_State): boolean {
		return false;
	}

</script>

{#key rebuilds}
	<svg
		bind:this={line}
		id={ancestry.title}
		width={size.width}px
		class='tree-line-svg'
		viewBox={viewBox.verbose}
		height={Math.max(2, size.height)}px
		style='z-index: {ZIndex.lines};
			top: {origin.y - size.height + 0.5}px;
			left: {origin.x + 142}px;
			position: absolute;
			stroke-width:1px;'>
		<path class='tree-line-path' d={linePath} stroke={ancestry.thing.color} fill='none'/>
	</svg>
	{#if debug.lines}
		<Circle radius=1 center={rect.extent.offsetBy(debugOffset)} color=black thickness=1/>
	{/if}
{/key}
