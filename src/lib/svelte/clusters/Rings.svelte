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
			s.rotation_ring_state.reset();
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
			const mouse_angle = from_center.angle;
			const paging_state = s.paging_ring_state;
			const rotation_state = s.rotation_ring_state;
			if (!!paging_state.lastRotated_angle) {				// rotate paging thumb
				const paging_angle = convert_angle(paging_state, mouse_angle);
				if (!!paging_angle) {
					adjustIndex_forAngle(paging_angle);					// send into paging arc to change index
					sendSignal = true;
				}
			} else if (!!rotation_state.lastRotated_angle) {		// rotate clusters
				const rotation_angle = convert_angle(rotation_state, mouse_angle);
				if (!!rotation_angle) {
					$s_rotation_ring_angle = rotation_angle;
					sendSignal = true;
				}
			} else if (!!rotation_state.radiusOffset) {			// resize
				const magnitude = from_center.magnitude
				const largest = k.cluster_inside_radius * 4;
				const smallest = k.cluster_inside_radius * 1.5;
				const distance = magnitude.force_between(smallest, largest);
				const pixels = distance - $s_rotation_ring_radius - rotation_state.radiusOffset;
				if (Math.abs(pixels) > 5) {
					sendSignal = true;
					$s_rotation_ring_radius += pixels;
				}
			} else if (!s.isAny_paging_arc_active) {
				if (rotation_state.isHovering != isHit()) {
					rotation_state.isHovering = isHit()		;	// show highlight around ring
				}
				cursor_closure();
			}
			if (sendSignal) {
				rebuilds += 1;
				signals.signal_relayoutWidgets_fromFocus();				// destroys this component (variables wiped)
			}
		}
	}

	function convert_angle(state: Rotation_State, mouse_angle: number): number | null {
		if (!mouse_angle.isClocklyAlmost(state.lastRotated_angle, Math.PI / 180, Math.PI * 2)) {		// detect >= 1° change
			state.lastRotated_angle = mouse_angle;
			return mouse_angle.add_angle_normalized(-state.basis_angle);
		}
		return null;
	}

	function adjustIndex_forAngle(angle: number) {
		console.log(`rings ${angle.degrees_of(0)}`)
	}

	function closure(mouse_state) {

		/////////////////////////////
		// setup or teardown state //
		/////////////////////////////

		if (mouse_state.isHover) {
			const rotation_state = s.rotation_ring_state;
			if (mouse_state.isOut) {
				rotation_state.isHovering = false;
			} else {
				const okayToHover = !s.isAny_paging_arc_active;
				rotation_state.isHovering = okayToHover;	// show highlight around ring
			}

			// hover

			rebuilds += 1;
		} else {
			const from_center = u.vector_ofOffset_fromGraphCenter_toMouseLocation(center);
			const mouse_wentDown_angle = from_center.angle;
			if (isInterior()) {
				const paging_state = s.paging_ring_state;
				if (mouse_state.isDown) {

					// begin paging

					paging_state.basis_angle = mouse_wentDown_angle;
					paging_state.lastRotated_angle = mouse_wentDown_angle;
				} else if (mouse_state.isUp) {

					// end paging

					paging_state.reset();
				}
			} else if (isHit()) {
				const ring_angle = $s_rotation_ring_angle;
				const rotation_state = s.rotation_ring_state;
				const basis_angle = mouse_wentDown_angle.add_angle_normalized(-ring_angle);
				if (mouse_state.isDouble) {
	
					// begin resize
					
					rotation_state.radiusOffset = from_center.magnitude - $s_rotation_ring_radius;
					rebuilds += 1;
				} else if (mouse_state.isDown) {

					// begin rotate
	
					rotation_state.basis_angle = basis_angle;
					rotation_state.lastRotated_angle = mouse_wentDown_angle;
					rebuilds += 1;
				} else if (mouse_state.isUp) {
	
					// end rotate and resize
	
					rotation_state.reset();
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
			cursor={s.rotation_ring_state.cursor}>
			<svg
				viewBox={viewBox}
				class= 'svg-rotation-ring'
				fill={transparentize(color, s.rotation_ring_state.fill_transparency)}
				stroke={transparentize(color, s.rotation_ring_state.stroke_transparency)}>
				<path d={svg_ringPath}>
			</svg>
		</Mouse_Responder>
	</div>
{/key}
