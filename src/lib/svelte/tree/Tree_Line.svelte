<script lang='ts'>
	import { k, Rect, Size, Point, debug, T_Layer, signals, svgPaths } from '../../ts/common/Global_Imports';
	import { Svelte_Wrapper, Ancestry, T_SvelteComponent, T_Line } from '../../ts/common/Global_Imports';
	import { w_thing_color } from '../../ts/state/S_Stores';
	import Circle from '../kit/Circle.svelte';
    export let ancestry;
	export let rect = new Rect();
	export let curveType: string = T_Line.up;
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
			lineWrapper = new Svelte_Wrapper(line, handle_mouse_state, ancestry.hid, T_SvelteComponent.line);
		}
	}

	$: {
		if (!!ancestry.thing && ancestry.thing.id == $w_thing_color?.split(k.generic_separator)[0]) {
			rebuilds += 1;
		}
	}

	////////////////////////////////////////////////////
	//	draw a curved line in rect, up, down or flat  //
	////////////////////////////////////////////////////

	$: {
		if (k.dot_size > 0) {
			switch (curveType) {
				case T_Line.up:
					origin = rect.origin;
					extent = rect.extent.offsetByY(-1.5);
					break;
				case T_Line.down:
					origin = rect.bottomLeft.offsetByY(-0.5);
					extent = origin.offsetBy(rect.size.asPoint).offsetByY(0.5);
					break;
				case T_Line.flat:
					rect = rect.offsetByY(-1.5);
					origin = rect.centerLeft;
					extent = rect.centerRight;
					linePath = svgPaths.line(origin.vector_to(extent));
					break;
			}
			const vector = origin.vector_to(extent);
			size = vector.abs.asSize;
			if (curveType != T_Line.flat) {
				const flag = (curveType == T_Line.down) ? 0 : 1;
				const originY = curveType == T_Line.down ? 0 : size.height;
				const extentY = curveType == T_Line.up   ? 0 : size.height;
				linePath = `M0 ${originY} A ${size.description} 0 0 ${flag} ${size.width} ${extentY}`;
			}
			const boxSize = new Size(size.width, Math.max(2, size.height));
			viewBox = new Rect(origin, boxSize);
		}
	}
 
	function isHit(): boolean {
		return false
	}

	function handle_mouse_state(s_mouse: S_Mouse): boolean {
		return false;
	}

</script>

{#key rebuilds}
	<svg
		bind:this = {line}
		id = {ancestry.title}
		width = {size.width}px
		class = 'tree-line-svg'
		viewBox = {viewBox.verbose}
		height = {Math.max(2, size.height)}px
		style = '
			top: {origin.y - size.height + 0.5}px;
			left: {origin.x + 142}px;
			z-index: {T_Layer.lines};
			position: absolute;
			stroke-width:1px;'>
		<path
			fill = 'none'
			d = {linePath}
			class = 'tree-line-path'
			stroke = {ancestry.thing.color}/>
	</svg>
	{#if debug.lines}
		<Circle
			radius = 1
			thickness = 1
			color = black
			center = {rect.extent.offsetBy(debugOffset)}/>
	{/if}
{/key}
