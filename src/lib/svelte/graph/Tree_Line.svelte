<script lang='ts'>
	import { run } from 'svelte/legacy';

	import { Svelte_Wrapper, T_SvelteComponent } from '../ts/common/Global_Imports';
	import { k, Point, debug, colors, T_Layer } from '../ts/common/Global_Imports';
	import { w_color_trigger } from '../ts/common/Stores';
	import Circle from '../kit/Circle.svelte';
	import Box from '../debug/Box.svelte';
	interface Props {
		g_line: G_TreeLine;
	}

	let { g_line }: Props = $props();
	const t_curve = g_line.t_curve;
	const ancestry = g_line.branchAncestry;
	const debugOffset = new Point(k.line_stretch - 2.4, 2.5);
	let stroke_color = $state(ancestry?.thing?.color);
	let lineWrapper: Svelte_Wrapper = $state();
	let svg_dasharray = $state(k.empty);
	let line_rebuilds = $state(0);
	let stroke_width = $state(1);
	let line = $state();

	//////////////////////////////
	//	draw a curved line		//
	//		in g_line.rect:		//
	//		up, down or flat 	//
	//		solid or dashed 	//
	//////////////////////////////
 
	function isHit(): boolean { return false }
	function handle_mouse_state(s_mouse: S_Mouse): boolean { return false; }

	if (g_line.isBidirectional) {
		stroke_color = colors.opacitize(ancestry.thing.color, 0.2);
		svg_dasharray = '4,3';
		stroke_width = 2;
	}

	run(() => {
		if (!!ancestry && !!line) {
			lineWrapper = new Svelte_Wrapper(line, handle_mouse_state, ancestry.hid, T_SvelteComponent.line);
		}
	});

	run(() => {
		if (!!ancestry && !!ancestry.thing && ancestry.thing.id == $w_color_trigger?.split(k.generic_separator)[0]) {
			line_rebuilds += 1;
		}
	});

</script>

{#key line_rebuilds}
	{#if !!ancestry}
		<svg
			bind:this = {line}
			id = {g_line.name}
			class = 'tree-line-svg'
			viewBox = {g_line.viewBox.verbose}
			style = '
				top: {g_line.origin.y - g_line.size.height + 1 - stroke_width / 2}px;
				left: {g_line.origin.x + 142 + stroke_width / 2}px;
				height: {g_line.size.height + stroke_width * 2}px;
				width: {g_line.size.width + stroke_width * 2}px;
				z-index: {T_Layer.lines};
				position: absolute;'>
			<path
				fill = 'none'
				d = {g_line.linePath}
				stroke = {stroke_color}
				class = 'tree-line-path'
				stroke-width = {stroke_width}
				stroke-dasharray = {svg_dasharray}/>
		</svg>
		{#if debug.lines}
			<Circle
				radius = 1
				thickness = 1
				color = black
				center = {g_line.rect.extent.offsetBy(debugOffset)}/>
		{/if}
	{/if}
{/key}
