<script lang='ts'>
	import { k, s, u, Thing, Point, ZIndex, signals, svgPaths, dbDispatch, transparentize } from '../../ts/common/GlobalImports';
	import { s_thing_changed, s_ancestry_focus, s_ring_angle, s_cluster_arc_radius } from '../../ts/state/ReactiveState';
	import { s_graphRect, s_user_graphOffset, s_mouse_location, s_mouse_up_count } from '../../ts/state/ReactiveState';
	import Mouse_Responder from '../mouse buttons/Mouse_Responder.svelte';
	import { necklace_ringState } from '../../ts/state/Expand_State';
	import { scrolling_state } from '../../ts/state/Rotate_State';
	export let radius = 0;
	export let thing: Thing;
	export let ring_width = 0;
	export let name = k.empty;
	export let color = k.empty;
	export let center = Point.zero;
	export let zindex = ZIndex.panel;
	export let cursor_closure = () => {};
	const outer_radius = radius + ring_width;
	const diameter = outer_radius * 2;
	const borderStyle = '1px solid';
	const ringOrigin = center.distanceFrom(Point.square(outer_radius));
	const viewBox = `${-ring_width}, ${-ring_width}, ${diameter}, ${diameter}`;
	const svg_ringPath = svgPaths.ring(Point.square(radius), outer_radius, ring_width);
	let mouse_up_count = $s_mouse_up_count;
	let scrolling_ring;
	let rebuilds = 0

	$: {
		if ($s_ancestry_focus.thing.id == $s_thing_changed.split(k.genericSeparator)[0]) {
			rebuilds += 1;
		}
	}

	$: {
		if (mouse_up_count != $s_mouse_up_count) {
			mouse_up_count = $s_mouse_up_count;
			scrolling_state.reset();
			rebuilds += 1;
		}
	}

	$: {

		////////////////////////////////////
		// detect movement & adjust state //
		////////////////////////////////////

		const from_center = distance_fromCenter_of($s_mouse_location);	// use store, to react
		if (!!from_center) {
			scrolling_state.isHovering = isHit();	// show highlight around ring
			cursor_closure();
			rebuilds += 1;
		}
	}

	function closure(mouseState) {

		/////////////////////////////
		// setup or teardown state //
		/////////////////////////////

		if (!mouseState.isHover) {
			const from_center = distance_fromCenter_of($s_mouse_location);
			if (mouseState.isUp) {

				// end rotate

				rebuilds += 1;
			} else if (mouseState.isDown) {
				const mouseAngle = from_center.angle;

				// begin rotate

				rebuilds += 1;
				
			}
			cursor_closure();
		} else {
			const okayToHover = !!scrolling_state.startAngle || !!scrolling_state.radiusOffset || !!necklace_ringState.startAngle || !!necklace_ringState.radiusOffset;
			scrolling_state.isHovering = okayToHover && !mouseState.isOut;	// show highlight around ring

			// hover

			rebuilds += 1;
		}
	}

	function distance_fromCenter_of(location?: Point): Point | null {
		if (!!location) {
			const mainOffset = $s_graphRect.origin.offsetBy($s_user_graphOffset);
			return mainOffset.offsetBy(center).distanceTo(location);
		}
		return null
	}
 
	function isHit(): boolean {
		const vector = distance_fromCenter_of($s_mouse_location);
		const distance = vector.magnitude;
		if (!!distance && distance.isBetween(radius, outer_radius)) {
			return true;
		}
		return false;
	}

	function handle_mouseData(mouseData: Mouse_State) {
		if (isHit()) {
			closure(mouseData);
		}
	}

</script>

{#key rebuilds}
	<div class='ring-button' bind:this={scrolling_ring}>
		<Mouse_Responder
			name={name}
			center={center}
			zindex={zindex}
			width={diameter}
			height={diameter}
			closure={closure}
			detect_longClick={false}
			cursor={scrolling_state.cursor}
			detectHit_closure={isHit}>
			<svg
				viewBox={viewBox}
				class= 'svg-ring-button'
				fill={transparentize(color, scrolling_state.fill_transparency)}
				stroke={transparentize(color, scrolling_state.stroke_transparency)}>
				<path d={svg_ringPath}>
			</svg>
		</Mouse_Responder>
	</div>
{/key}
