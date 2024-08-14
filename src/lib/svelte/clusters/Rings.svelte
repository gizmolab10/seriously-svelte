<script lang='ts'>
	import { s_graphRect, s_mouse_location, s_active_wrapper, s_mouse_up_count } from '../../ts/state/Reactive_State';
	import { k, u, ux, w, Thing, Point, Angle, ZIndex, signals, svgPaths } from '../../ts/common/Global_Imports';
	import { dbDispatch, opacitize, Svelte_Wrapper, SvelteComponentType } from '../../ts/common/Global_Imports';
	import { s_thing_changed, s_ancestry_focus, s_user_graphOffset } from '../../ts/state/Reactive_State';
	import { s_rotation_ring_angle, s_rotation_ring_radius } from '../../ts/state/Reactive_State';
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
	const geometry = ux.clusters_geometry;
	const diameter = outer_radius * 2;
	const borderStyle = '1px solid';
	const svg_ringPath = svgPaths.ring(Point.square(radius), outer_radius, ring_width);
	const rotation_viewBox = `${-ring_width}, ${-ring_width}, ${diameter}, ${diameter}`;
	let mouse_up_count = $s_mouse_up_count;
	let rotationWrapper = Svelte_Wrapper;
	let pagingWrapper = Svelte_Wrapper;
	let rotationRing;
	let rebuilds = 0
	let pagingRing;

	$: {
		if ($s_ancestry_focus.thing.id == $s_thing_changed.split(k.generic_separator)[0]) {
			rebuilds += 1;
		}
	}

	$: {		// setup wrappers

		if (!!rotationRing && !rotationWrapper) {
			rotationWrapper = new Svelte_Wrapper(rotationRing, handle_mouse_state, -1, SvelteComponentType.rotation);
		}
		if (!!pagingRing && !pagingWrapper) {
			pagingWrapper = new Svelte_Wrapper(pagingRing, handle_mouse_state, -1, SvelteComponentType.rotation);
		}
	}

	$: {		// mouse up ...
				// end rotate, resize. paging

		if (mouse_up_count != $s_mouse_up_count) {
			mouse_up_count = $s_mouse_up_count;
			ux.active_thumb_cluster = null;
			ux.rotation_ring_state.reset();
			ux.paging_ring_state.reset();
			$s_active_wrapper = null;
			cursor_closure();
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
			const rotate_resize = ux.rotation_ring_state;
			if (!!ux.active_thumb_cluster) {					// send into paging arc to change index
				if (ux.active_thumb_cluster.adjust_paging_index_forMouse_angle(mouse_angle)) {
					sendSignal = true;
				}
			} else if (!!rotate_resize.lastRotated_angle) {		// rotate_resize clusters
				const rotation_angle = convert_angle(rotate_resize, mouse_angle);
				if (!!rotation_angle) {
					$s_rotation_ring_angle = rotation_angle;
					sendSignal = true;
				}
			} else if (!!rotate_resize.radiusOffset) {			// resize
				const magnitude = from_center.magnitude
				const largest = k.cluster_inside_radius * 4;
				const smallest = k.cluster_inside_radius * 1.5;
				const distance = magnitude.force_between(smallest, largest);
				const pixels = distance - $s_rotation_ring_radius - rotate_resize.radiusOffset;
				if (Math.abs(pixels) > 5) {
					sendSignal = true;
					$s_rotation_ring_radius += pixels;
				}
			} else if (!ux.isAny_paging_arc_active) {
				if (rotate_resize.isHovering != isHit()) {
					rotate_resize.isHovering = isHit()		;	// show highlight around ring
				}
				cursor_closure();
			}
			if (sendSignal) {
				rebuilds += 1;
				signals.signal_relayoutWidgets_fromFocus();		// destroys this component (properties are in ux: rotation_ring_state && active_thumb_cluster)
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

	function closure(mouse_state) {

		/////////////////////////////
		// setup or teardown state //
		/////////////////////////////

		const rotate_resize = ux.rotation_ring_state;
		if (mouse_state.isHover) {

			// adjust hover highlight

			if (mouse_state.isOut) {
				rotate_resize.isHovering = false;
			} else {
				const okayToHover = !ux.paging_ring_state.isActive;
				rotate_resize.isHovering = okayToHover;	// show highlight around ring
			}
			rebuilds += 1;
		} else {
			const from_center = u.vector_ofOffset_fromGraphCenter_toMouseLocation(center);
			const mouse_wentDown_angle = from_center.angle;
			if (isInterior()) {
				const map = geometry.cluster_mapFor(mouse_wentDown_angle);
				if (!!map) {
					if (mouse_state.isDown) {
	
						// begin paging
	
						ux.paging_ring_state.basis_angle = mouse_wentDown_angle;
						$s_active_wrapper = pagingWrapper;
						ux.active_thumb_cluster = map;
					}
				}
			} else if (isHit()) {
				if (mouse_state.isDouble) {
	
					// begin resize
					
					rotate_resize.radiusOffset = from_center.magnitude - $s_rotation_ring_radius;
					$s_active_wrapper = rotationWrapper;
					rebuilds += 1;
				} else if (mouse_state.isDown) {

					// begin rotate
	
					const basis_angle = mouse_wentDown_angle.add_angle_normalized(-$s_rotation_ring_angle);
					rotate_resize.lastRotated_angle = mouse_wentDown_angle;
					rotate_resize.basis_angle = basis_angle;
					$s_active_wrapper = rotationWrapper;
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
			cursor={ux.rotation_ring_state.cursor}>
			<svg
				class= 'svg-rotation-ring'
				viewBox={rotation_viewBox}
				fill={u.opacitize(color, ux.rotation_ring_state.fill_opacity)}
				stroke={u.opacitize(color, ux.rotation_ring_state.stroke_opacity)}>
				<path d={svg_ringPath}>
			</svg>
		</Mouse_Responder>
	</div>
{/key}
