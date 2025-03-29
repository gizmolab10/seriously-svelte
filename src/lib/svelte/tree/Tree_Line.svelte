<script lang='ts'>
	import { k, Rect, Size, Point, debug, T_Layer, signals, svgPaths } from '../../ts/common/Global_Imports';
	import { Svelte_Wrapper, Ancestry, T_SvelteComponent, T_Curve } from '../../ts/common/Global_Imports';
	import { w_color_trigger } from '../../ts/common/Stores';
	import Circle from '../kit/Circle.svelte';
	import { onMount } from 'svelte';
	export let stroke_width = 1;
	export let g_line!:G_TreeLine;
	export let svg_dasharray = k.empty;
	const ancestry = g_line.parent_ancestry;
	const lineOffset = new Point(-122.5, 2.5);
	const debugOffset = new Point(142, -0);
	const curveType = g_line.curveType;
	let lineRect = g_line.rect.offsetBy(lineOffset);
	let lineWrapper: Svelte_Wrapper;
	let origin = lineRect.origin;
	let extent = lineRect.extent;
	let viewBox = Rect.zero;
	let linePath = k.empty;
	let line_rebuilds = 0;
	let size = Size.zero;
	let line;

	//////////////////////////////////////
	//	draw a curved line in lineRect	//
	//		up, down or flat 			//
	//		solid or dashed 			//
	//////////////////////////////////////

	onMount(() => {
		const handle_reposition = signals.handle_reposition_widgets(2, (received_ancestry) => {
			lineRect = g_line.rect.offsetBy(lineOffset);
			debug.log_reposition(`tree line [. .] on "${ancestry.title}"`);
			reposition();
		});
		return () => { handle_reposition.disconnect() };
	});

	$: {
		if (!!line) {
			lineWrapper = new Svelte_Wrapper(line, handle_mouse_state, ancestry.hid, T_SvelteComponent.line);
		}
	}

	$: {
		if (!!ancestry.thing && ancestry.thing.id == $w_color_trigger?.split(k.generic_separator)[0]) {
			line_rebuilds += 1;
		}
	}

	$: {
		if (k.dot_size > 0) {
			reposition();
		}
	}
 
	function isHit(): boolean {
		return false
	}

	function handle_mouse_state(s_mouse: S_Mouse): boolean {
		return false;
	}

	function reposition() {
		switch (curveType) {
			case T_Curve.up:
				origin = lineRect.origin;
				extent = lineRect.extent.offsetByY(-1.5);
				break;
			case T_Curve.down:
				origin = lineRect.bottomLeft.offsetByY(-0.5);
				extent = origin.offsetBy(lineRect.size.asPoint).offsetByY(0.5);
				break;
			case T_Curve.flat:
				lineRect = lineRect.offsetByY(-1.5);
				origin = lineRect.centerLeft;
				extent = lineRect.centerRight;
				linePath = svgPaths.line(origin.vector_to(extent));
				break;
		}
		const vector = origin.vector_to(extent);
		size = vector.abs.asSize;
		if (curveType != T_Curve.flat) {
			const flag = (curveType == T_Curve.down) ? 0 : 1;
			const originY = curveType == T_Curve.down ? 0 : size.height;
			const extentY = curveType == T_Curve.up   ? 0 : size.height;
			linePath = `M0 ${originY} A ${size.description} 0 0 ${flag} ${size.width} ${extentY}`;
		}
		const boxSize = new Size(size.width, Math.max(2, size.height));
		viewBox = new Rect(origin, boxSize);
	}

</script>

{#key line_rebuilds}
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
			stroke-width = {stroke_width}
			stroke = {ancestry.thing.color}
			stroke-dasharray = {svg_dasharray}/>
	</svg>
	{#if debug.lines}
		<Circle
			radius = 1
			thickness = 1
			color = black
			center = {lineRect.extent.offsetBy(debugOffset)}/>
	{/if}
{/key}
