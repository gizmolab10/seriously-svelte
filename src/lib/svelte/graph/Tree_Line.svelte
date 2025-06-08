<script lang='ts'>
	import { k, Point, debug, colors, signals, T_Layer } from '../../ts/common/Global_Imports';
	import { w_thing_color } from '../../ts/common/Stores';
	import Circle from '../kit/Circle.svelte';
	import Box from '../debug/Box.svelte';
	import { onMount } from 'svelte';
	export let g_line!: G_TreeLine;
	const t_curve = g_line.t_curve;
	const ancestry = g_line.branchAncestry;
	const debugOffset = new Point(k.height.line - 2.4, 2.5);
	let stroke_color = ancestry?.thing?.color;
	let lineWrapper: Svelte_Wrapper;
	let svg_dasharray = k.empty;
	let line_reattachments = 0;
	let stroke_width = 0.5;
	let line;

	//////////////////////////////
	//	draw a curved line		//
	//		in g_line.rect		//
	//		up, down or flat 	//
	//		solid or dashed 	//
	//////////////////////////////
 
	function isHit(): boolean { return false }

	onMount(() => {
		const handle_reposition = signals.handle_reposition_widgets(2, (received_ancestry) => {
			line_reattachments += 1;
		});
		return () => { handle_reposition.disconnect(); }
	});

	if (g_line.isBidirectional) {
		stroke_color = colors.opacitize(ancestry.thing.color, 0.7);
		svg_dasharray = '4,3';
		stroke_width = 0.5;
	}

	$: {
		if (!!ancestry && !!ancestry.thing && ancestry.thing.id == $w_thing_color?.split(k.separator.generic)[0]) {
			line_reattachments += 1;
		}
	}

</script>

{#key line_reattachments}
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
