<script lang='ts'>
	import { Svelte_Wrapper, T_SvelteComponent } from '../../ts/common/Global_Imports';
	import { k, Point, debug, T_Layer } from '../../ts/common/Global_Imports';
	import { w_color_trigger } from '../../ts/common/Stores';
	import Circle from '../kit/Circle.svelte';
	import Box from '../debug/Box.svelte';
	export let stroke_width = 1;
	export let g_line!: G_TreeLine;
	export let svg_dasharray = k.empty;
	const debugOffset = new Point(k.line_stretch - 2.4, 2.5);
	const curveType = g_line.curveType;
	const ancestry = g_line.ancestry;
	let lineWrapper: Svelte_Wrapper;
	let line_rebuilds = 0;
	let line;

	//////////////////////////////
	//	draw a curved line		//
	//		in g_line.rect:		//
	//		up, down or flat 	//
	//		solid or dashed 	//
	//////////////////////////////
 
	function isHit(): boolean { return false }
	function handle_mouse_state(s_mouse: S_Mouse): boolean { return false; }

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

</script>

{#key line_rebuilds}
	{#if ancestry.isBidirectional}
		<Box rect={g_line.rect} color={ancestry.thing.color}/>
	{/if}
	<svg
		bind:this = {line}
		id = {ancestry.title}
		width = {g_line.size.width}px
		class = 'tree-line-svg'
		viewBox = {g_line.viewBox.verbose}
		height = {Math.max(2, g_line.size.height)}px
		style = '
			top: {g_line.origin.y - g_line.size.height + 0.5}px;
			left: {g_line.origin.x + 142}px;
			z-index: {T_Layer.lines};
			position: absolute;
			stroke-width:1px;'>
		<path
			fill = 'none'
			d = {g_line.linePath}
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
			center = {g_line.rect.extent.offsetBy(debugOffset)}/>
	{/if}
{/key}
