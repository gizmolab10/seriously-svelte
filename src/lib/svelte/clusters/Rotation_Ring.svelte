<script lang='ts'>
	import { s_thing_changed, s_ancestry_focus, s_rotation_ring_angle, s_rotation_ring_radius } from '../../ts/state/Reactive_State';
	import { s_graphRect, s_user_graphOffset, s_mouse_location, s_mouse_up_count } from '../../ts/state/Reactive_State';
	import { k, s, u, Thing, Point, ZIndex, signals, svgPaths, dbDispatch } from '../../ts/common/Global_Imports';
	import { transparentize, Svelte_Wrapper, SvelteComponentType } from '../../ts/common/Global_Imports';
	import Mouse_Responder from '../mouse buttons/Mouse_Responder.svelte';
	import Identifiable from '../../ts/data/Identifiable';
	export let radius = 0;
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
	let neckaceWrapper = Svelte_Wrapper;
	let rotationRing;
	let rebuilds = 0

	$: {
		if ($s_ancestry_focus.thing.id == $s_thing_changed.split(k.generic_separator)[0]) {
			rebuilds += 1;
		}
	}

	$: {
		if (!!rotationRing) {
			neckaceWrapper = new Svelte_Wrapper(rotationRing, handle_mouseData, Identifiable.newID(), SvelteComponentType.rotation);
		}
	}

	$: {
		if (mouse_up_count != $s_mouse_up_count) {
			mouse_up_count = $s_mouse_up_count;
			s.rotation_ringState.reset();
			rebuilds += 1;
		}
	}

	$: {

		////////////////////////////////////
		// detect movement & adjust state //
		////////////////////////////////////

		const _ = $s_mouse_location;
		const from_center = u.vector_ofOffset_fromGraphCenter_toMouseLocation(center);	// use store, to react
		if (!!from_center) {
			let sendSignal = false;
			if (!!s.rotation_ringState.lastRotated_angle) {				// rotate
				const mouseAngle = from_center.angle;
				const isAlmost = mouseAngle.isClocklyAlmost(s.rotation_ringState.lastRotated_angle, Math.PI / 180, Math.PI * 2);	// detect >= 1° change
				if (!isAlmost) {
					sendSignal = true;
					s.rotation_ringState.lastRotated_angle = mouseAngle;
					const ring_angle = mouseAngle.add_angle_normalized(-s.rotation_ringState.basis_angle);
					$s_rotation_ring_angle = ring_angle;
				}
			} else if (!!s.rotation_ringState.radiusOffset) {			// resize
				const magnitude = from_center.magnitude
				const largest = k.cluster_inside_radius * 4;
				const smallest = k.cluster_inside_radius * 1.5;
				const distance = magnitude.force_between(smallest, largest);
				const pixels = distance - $s_rotation_ring_radius - s.rotation_ringState.radiusOffset;
				if (Math.abs(pixels) > 5) {
					sendSignal = true;
					$s_rotation_ring_radius += pixels;
				}
			} else if (!s.isAnyRotation_active) {
				if (s.rotation_ringState.isHovering != isHit()) {
					s.rotation_ringState.isHovering = isHit();	// show highlight around ring
				}
				cursor_closure();
			}
			if (sendSignal) {
				rebuilds += 1;
				signals.signal_relayoutWidgets_fromFocus();		// destroys this component (variables wiped)
			}
		}
	}

	function closure(mouseState) {

		/////////////////////////////
		// setup or teardown state //
		/////////////////////////////

		if (mouseState.isHover) {
			if (mouseState.isOut) {
				s.rotation_ringState.isHovering = false;
			} else {
				const okayToHover = !s.isAnyRotation_active;
				s.rotation_ringState.isHovering = okayToHover;	// show highlight around ring
			}

			// hover

			rebuilds += 1;
		} else if (isHit()) {
			const from_center = u.vector_ofOffset_fromGraphCenter_toMouseLocation(center);
			if (mouseState.isDouble) {

				// begin resize
				
				s.rotation_ringState.radiusOffset = from_center.magnitude - $s_rotation_ring_radius;
				rebuilds += 1;
			} else if (mouseState.isUp) {

				// end rotate and resize

				s.rotation_ringState.reset();
				rebuilds += 1;
			} else if (mouseState.isDown) {
				const ring_angle = $s_rotation_ring_angle;
				const mouse_wentDown_angle = from_center.angle;
				const basis_angle = mouse_wentDown_angle.add_angle_normalized(-ring_angle);

				// begin rotate

				s.rotation_ringState.basis_angle = basis_angle;
				s.rotation_ringState.lastRotated_angle = mouse_wentDown_angle;
				rebuilds += 1;
				
			}
			cursor_closure();
		}
	}
 
	function isHit(): boolean {
		const vector = u.vector_ofOffset_fromGraphCenter_toMouseLocation(center);
		const distance = vector?.magnitude;
		if (!!distance && distance.isBetween(radius, outer_radius)) {
			return true;
		}
		return false;
	}

	function handle_mouseData(mouseData: Mouse_State): boolean {
		if (!mouseData.isMove && isHit()) {
			closure(mouseData);
		}
	}

</script>

{#key rebuilds}
	<div class='neckace-ring' bind:this={rotationRing}>
		<Mouse_Responder
			name={name}
			center={center}
			zindex={zindex}
			width={diameter}
			height={diameter}
			closure={closure}
			detect_longClick={false}
			detectHit_closure={isHit}
			cursor={s.rotation_ringState.cursor}>
			<svg
				viewBox={viewBox}
				class= 'svg-neckace-ring'
				fill={transparentize(color, s.rotation_ringState.fill_transparency)}
				stroke={transparentize(color, s.rotation_ringState.stroke_transparency)}>
				<path d={svg_ringPath}>
			</svg>
		</Mouse_Responder>
	</div>
{/key}
