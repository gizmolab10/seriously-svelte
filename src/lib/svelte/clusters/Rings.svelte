<script lang='ts'>
	import { s_thing_changed, s_ancestry_focus, s_rotation_ring_angle, s_rotation_ring_radius } from '../../ts/state/Reactive_State';
	import { s_graphRect, s_user_graphOffset, s_mouse_location, s_mouse_up_count } from '../../ts/state/Reactive_State';
	import { k, s, u, w, Thing, Point, ZIndex, signals, svgPaths, dbDispatch } from '../../ts/common/Global_Imports';
	import { transparentize, Svelte_Wrapper, SvelteComponentType } from '../../ts/common/Global_Imports';
	import Mouse_Responder from '../mouse buttons/Mouse_Responder.svelte';
	import Identifiable from '../../ts/data/Identifiable';
	import Paging_Arc from './Paging_Arc.svelte';
	export let radius = 0;
	export let ring_width = 0;
	export let name = k.empty;
	export let color = k.empty;
	export let center = Point.zero;
	export let zindex = ZIndex.rotation;
	export let cursor_closure = () => {};
	const outer_radius = radius + ring_width;
	const diameter = outer_radius * 2;
	const borderStyle = '1px solid';
	const geometry = s.clusters_geometry;
	const ringOrigin = center.distanceFrom(Point.square(outer_radius));
	const viewBox = `${-ring_width}, ${-ring_width}, ${diameter}, ${diameter}`;
	const svg_ringPath = svgPaths.ring(Point.square(radius), outer_radius, ring_width);
	let mouse_up_count = $s_mouse_up_count;
	let rotationWrapper = Svelte_Wrapper;
	let rotationRing;
	let rebuilds = 0
	let pagingRing;

	$: {
		if ($s_ancestry_focus.thing.id == $s_thing_changed.split(k.generic_separator)[0]) {
			rebuilds += 1;
		}
	}

	$: {
		if (!!rotationRing) {
			rotationWrapper = new Svelte_Wrapper(rotationRing, handle_mouse_state, -1, SvelteComponentType.rotation);
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

	function closure(mouse_state) {

		/////////////////////////////
		// setup or teardown state //
		/////////////////////////////

		if (mouse_state.isHover) {
			if (mouse_state.isOut) {
				s.rotation_ringState.isHovering = false;
			} else {
				const okayToHover = !s.isAnyRotation_active;
				s.rotation_ringState.isHovering = okayToHover;	// show highlight around ring
			}

			// hover

			rebuilds += 1;
		} else {
			const from_center = u.vector_ofOffset_fromGraphCenter_toMouseLocation(center);
			const mouse_wentDown_angle = from_center.angle;
			const ring_angle = $s_rotation_ring_angle;
			const basis_angle = mouse_wentDown_angle.add_angle_normalized(-ring_angle);
			if (isInterior()) {

				// pass to paging ring

				if (mouse_state.isUp) {
					s.paging_ring_state.reset();
				} else if (mouse_state.isDown) {
					s.paging_ring_state.basis_angle = basis_angle;
					console.log(`${basis_angle.degrees_of(0)}`);
					// eventually calls paging ring's closure
				}
			} else if (isHit()) {
				if (mouse_state.isDouble) {
	
					// begin resize
					
					s.rotation_ringState.radiusOffset = from_center.magnitude - $s_rotation_ring_radius;
					rebuilds += 1;
				} else if (mouse_state.isUp) {
	
					// end rotate and resize
	
					s.rotation_ringState.reset();
					rebuilds += 1;
				} else if (mouse_state.isDown) {

					// begin rotate
	
					s.rotation_ringState.basis_angle = basis_angle;
					s.rotation_ringState.lastRotated_angle = mouse_wentDown_angle;
					rebuilds += 1;
				}
			}
			cursor_closure();
		}
	}

	function distance_fromCenter(): number | null {
		const vector = u.vector_ofOffset_fromGraphCenter_toMouseLocation(center);
		return vector?.magnitude ?? null;
	}

	function isInterior(): boolean {
		const distance = distance_fromCenter();
		return !!distance && distance < radius;
	}
 
	function isHit(): boolean {
		const distance = distance_fromCenter();
		return !!distance && distance.isBetween(radius, outer_radius);
	}

	function handle_mouse_state(mouse_state: Mouse_State): boolean {
		const hit = isHit();
		if (mouse_state.hit) {
			return hit;
		} else if (!mouse_state.isMove && hit) {
			closure(mouse_state);
		}
		return true;	// WRONG?
	}

</script>

{#key rebuilds}
	<div class='paging-ring' bind:this={pagingRing} style='z-index:{ZIndex.paging};'>
		{#each geometry.cluster_maps as cluster_map}
			{#if !!cluster_map && (cluster_map.shown > 0)}
				<Paging_Arc
					color={color}
					center={center}
					cluster_map={cluster_map}/>
			{/if}
		{/each}
	</div>
	<div class='rotation-ring' bind:this={rotationRing} style='z-index:{ZIndex.rotation};'>
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
				class= 'svg-rotation-ring'
				fill={transparentize(color, s.rotation_ringState.fill_transparency)}
				stroke={transparentize(color, s.rotation_ringState.stroke_transparency)}>
				<path d={svg_ringPath}>
			</svg>
		</Mouse_Responder>
	</div>
{/key}
