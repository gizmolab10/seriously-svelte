<script lang='ts'>
	import { s_graphRect, s_mouse_location, s_offset_graph_center } from '../../ts/state/Reactive_State';
	import { g, u, w, Rect, Size, Point, debug, ZIndex } from '../../ts/common/Global_Imports';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import Box from './Box.svelte';
	export let size = 16;
	const multiplier = 0.6;
	let mouse_rect = Rect.zero;
	let debug_origin = $s_offset_graph_center;

	$: {
		debug_origin = $s_offset_graph_center;
	}

	$: {
		// N.B.: is scale factor involved?
		const point = $s_mouse_location?.multipliedBy(1 / w.scale_factor);
		if (!!point) {
			const square = Size.square(size);
			const from_center = square.negated.dividedInHalf;
			const origin = point.offsetBySize(from_center);
			mouse_rect = new Rect(origin, square);
		}
	}

	function hover_closure(mouse_state) {
		if (mouse_state.isMove) {
			const distance = w.mouse_distance_fromGraphCenter;
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
		color = 'green'
		cross = {true}
		name = 'graph'
		zindex = {ZIndex.frontmost}
		rect = {$s_graphRect}/>
{/if}
{#if debug.cursor}
	<Mouse_Responder
		name='debug-cursor'
		origin={Point.zero}
		width={w.windowSize.width}
		height={w.windowSize.height}
		mouse_state_closure={hover_closure}>
		<Box
			color = 'red'
			cross = {true}
			name = 'cursor'
			rect = {mouse_rect}
			zindex = {ZIndex.frontmost}/>
		<Box
			color = 'blue'
			cross = {true}
			name = 'cursor'
			zindex = {ZIndex.frontmost}
			rect = {new Rect(debug_origin, Size.square(18))}/>
	</Mouse_Responder>
{/if}
