<script lang='ts'>
	import { s_user_graph_center, s_ancestry_showing_tools } from '../../ts/state/S_Stores';
	import { g, u, w, Rect, Size, Point, debug, ZIndex } from '../../ts/common/Global_Imports';
	import { s_graphRect, s_scaled_mouse_location } from '../../ts/state/S_Stores';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import Box from './Box.svelte';
	export let size = 16;
	const multiplier = 0.6;
	let mouse_rect = Rect.zero;
	let base = new Point(-39, -28);
	let debug_origin = $s_user_graph_center.offsetBy(base);

	$: {
		debug_origin = $s_user_graph_center.offsetBy(base);
	}

	$: {
		const point = $s_scaled_mouse_location;
		if (!!point) {
			const square = Size.square(size);
			const origin = point.offsetBy(square.asPoint.negatedInHalf);
			mouse_rect = new Rect(origin, square);
		}
	}

	function hover_closure(mouse_state) {
		if (mouse_state.isMove) {
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
		zindex = {ZIndex.common}
		rect = {$s_graphRect}/>
{/if}
{#if debug.tools && !!$s_ancestry_showing_tools}
	<Box
		name = 'tools'
		color = 'purple'
		zindex = {ZIndex.frontmost}
		rect = {$s_ancestry_showing_tools.titleRect}/>
{/if}
{#if debug.cursor}
	<Mouse_Responder
		name='debug-cursor'
		origin={Point.zero}
		zindex = {ZIndex.common}
		width={w.windowSize.width}
		height={w.windowSize.height}
		mouse_state_closure={hover_closure}>
		<Box
			color = 'red'
			cross = {true}
			name = 'cursor'
			rect = {mouse_rect}
			zindex = {ZIndex.common}/>
		{#if false}
			<Box
				cross = {true}
				color = 'blue'
				name = 'origin'
				zindex = {ZIndex.common}
				rect = {new Rect(debug_origin, Size.square(18))}/>
		{/if}
	</Mouse_Responder>
{/if}
