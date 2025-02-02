<script lang='ts'>
	import { w_user_graph_center, w_ancestry_showing_tools } from '../../ts/state/S_Stores';
	import { g, u, w, Rect, Size, Point, debug, T_Layer } from '../../ts/common/Global_Imports';
	import { w_graph_rect, w_mouse_location_scaled } from '../../ts/state/S_Stores';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import Box from './Box.svelte';
	export let size = 16;
	const multiplier = 0.6;
	let mouse_rect = Rect.zero;
	let base = new Point(-39, -28);
	let debug_origin = $w_user_graph_center.offsetBy(base);

	$: {
		debug_origin = $w_user_graph_center.offsetBy(base);
	}

	$: {
		const point = $w_mouse_location_scaled;
		if (!!point) {
			const square = Size.square(size);
			const origin = point.offsetBy(square.asPoint.negatedInHalf);
			mouse_rect = new Rect(origin, square);
		}
	}

	function hover_closure(s_mouse) {
		if (s_mouse.isMove) {
			const distance = u.mouse_distance_fromGraphCenter;
			// debug.log_cursor(distance.toFixed(2));
			// mouse location
			// measure distance to debug_origin
			// when "close enough to zero"
			// store mouse location in debug_origin
			// redraw debug
		}
	}

</script>

{#if debug.graph}
	<Box
		cross = {true}
		name = 'graph'
		color = 'green'
		zindex = {T_Layer.common}
		rect = {$w_graph_rect}/>
{/if}
{#if debug.tools && !!$w_ancestry_showing_tools}
	<Box
		name = 'tools'
		color = 'purple'
		zindex = {T_Layer.frontmost}
		rect = {$w_ancestry_showing_tools.titleRect}/>
{/if}
{#if debug.cursor}
	<Mouse_Responder
		name='debug-cursor'
		origin={Point.zero}
		zindex = {T_Layer.common}
		width={w.windowSize.width}
		height={w.windowSize.height}
		mouse_closure={hover_closure}>
		<Box
			color = 'red'
			cross = {true}
			name = 'cursor'
			rect = {mouse_rect}
			zindex = {T_Layer.common}/>
		{#if false}
			<Box
				cross = {true}
				color = 'blue'
				name = 'origin'
				zindex = {T_Layer.common}
				rect = {new Rect(debug_origin, Size.square(18))}/>
		{/if}
	</Mouse_Responder>
{/if}
