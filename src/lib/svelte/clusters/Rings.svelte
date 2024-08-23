<script lang='ts'>
	import { k, u, ux, w, Thing, Point, Angle, debug, ZIndex, onMount, signals, svgPaths } from '../../ts/common/Global_Imports';
	import { debugReact, dbDispatch, opacitize, Svelte_Wrapper, SvelteComponentType } from '../../ts/common/Global_Imports';
	import { s_graphRect, s_mouse_location, s_active_wrapper, s_mouse_up_count } from '../../ts/state/Reactive_State';
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
	const diameter = outer_radius * 2;
	const borderStyle = '1px solid';
	const rotation_viewBox = `${-ring_width}, ${-ring_width}, ${diameter}, ${diameter}`;
	const svg_ringPath = svgPaths.ring(Point.square(radius), outer_radius, ring_width);
	let mouse_up_count = $s_mouse_up_count;
	let rotationWrapper = Svelte_Wrapper;
	let pagingWrapper = Svelte_Wrapper;
	let rotationRing;
	let rebuilds = 0
	let pagingRing;

	onMount(() => {
		debugReact.log_mount(`RINGS ${rebuilds} rebuilds`);
	});

	$: {
		if (!!$s_thing_changed && $s_ancestry_focus.thing.id == $s_thing_changed.split(k.generic_separator)[0]) {
			rebuilds += 1;
		}
	}

	$: {
		// setup wrappers
		if (!!rotationRing && !rotationWrapper) {
			rotationWrapper = new Svelte_Wrapper(rotationRing, handle_mouse_state, -1, SvelteComponentType.rotation);
		}
		if (!!pagingRing && !pagingWrapper) {
			pagingWrapper = new Svelte_Wrapper(pagingRing, handle_mouse_state, -1, SvelteComponentType.rotation);
		}
	}

	$: {
		// mouse up ... end all (rotate, resize, paging)
		if (mouse_up_count != $s_mouse_up_count) {
			mouse_up_count = $s_mouse_up_count;
			ux.rotation_ring_state.reset();
			ux.active_cluster_map = null;
			$s_active_wrapper = null;
			ux.reset_paging();
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
			const inPaging = isInterior();
			const mouse_angle = from_center.angle;
			const isHovering = isHit() && !inPaging && !ux.isAny_paging_arc_active;
			if (ux.rotation_ring_state.isHovering != isHovering) {
				ux.rotation_ring_state.isHovering = isHovering;
			}
			if (ux.paging_ring_state.isHovering != inPaging) {
				ux.paging_ring_state.isHovering = inPaging;		// adjust hover highlight for all arcs  (paging arc handles thumb hover)
			}
			if (ux.active_cluster_map?.adjust_paging_index_forMouse_angle(mouse_angle) ?? false) {
				ux.active_cluster_map.paging_rotation_state.active_angle = mouse_angle;
				sendSignal = true;
			} else if (!!ux.rotation_ring_state.active_angle || ux.rotation_ring_state.active_angle == 0) {		// rotate_resize clusters
				if (!mouse_angle.isClocklyAlmost(ux.rotation_ring_state.active_angle, Angle.half / 180, Angle.full)) {		// detect >= 1° change
					$s_rotation_ring_angle = mouse_angle.add_angle_normalized(-ux.rotation_ring_state.basis_angle);
					ux.rotation_ring_state.active_angle = mouse_angle;
					sendSignal = true;
				}
			} else if (!!ux.rotation_ring_state.radiusOffset) {			// resize
				const magnitude = from_center.magnitude
				const largest = k.cluster_inside_radius * 4;
				const smallest = k.cluster_inside_radius * 1.5;
				const distance = magnitude.force_between(smallest, largest);
				const delta = distance - $s_rotation_ring_radius - ux.rotation_ring_state.radiusOffset;
				if (Math.abs(delta) > 5) {
					$s_rotation_ring_radius += delta;
					sendSignal = true;
				}
			}
			cursor_closure();
			if (sendSignal) {
				rebuilds += 1;
				signals.signal_relayoutWidgets_fromFocus();		// destroys this component (properties are in ux: rotation_ring_state && active_cluster_map)
			}
		}
	}

	function closure(mouse_state) {

		/////////////////////////////
		// setup or teardown state //
		/////////////////////////////

		const from_center = u.vector_ofOffset_fromGraphCenter_toMouseLocation(center);
		const mouse_wentDown_angle = from_center.angle;
		if (isInterior()) {
			const basis_angle = mouse_wentDown_angle.normalized_angle();
			const map = ux.clusters_geometry.cluster_mapFor(basis_angle);
			if (!!map && mouse_state.isDown) {
					
				// begin paging

				const paging_state = map.paging_rotation_state;
				paging_state.active_angle = basis_angle;
				paging_state.basis_angle = basis_angle;
				$s_active_wrapper = pagingWrapper;
				ux.active_cluster_map = map;
				rebuilds += 1;
			}
		} else if (isHit()) {
			if (mouse_state.isDouble) {

				// begin resize
				
				ux.rotation_ring_state.radiusOffset = from_center.magnitude - $s_rotation_ring_radius;
				$s_active_wrapper = rotationWrapper;
				rebuilds += 1;
			} else if (mouse_state.isDown) {

				// begin rotate

				const basis_angle = mouse_wentDown_angle.add_angle_normalized(-$s_rotation_ring_angle);
				ux.rotation_ring_state.active_angle = mouse_wentDown_angle;
				ux.rotation_ring_state.basis_angle = basis_angle;
				$s_active_wrapper = rotationWrapper;
				rebuilds += 1;
			}
		}
		cursor_closure();
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
	<div class='rings'>
		<div class='arcs' bind:this={pagingRing} style='z-index:{ZIndex.paging};'>
			{#each ux.clusters_geometry.cluster_maps as cluster_map}
				{#if !!cluster_map && (cluster_map.shown > 0)}
					<Paging_Arc
						color={color}
						center={center}
						cluster_map={cluster_map}/>
				{/if}
			{/each}
		</div>
		<div class='rotates' bind:this={rotationRing} style='z-index:{ZIndex.rotation};'>
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
					class= 'svg-rotates'
					viewBox={rotation_viewBox}>
					{#if debug.reticule}
						<path stroke='green' fill=transparent d={svgPaths.t_cross($s_rotation_ring_radius * 2, 0)}/>
					{/if}
					<path d={svg_ringPath}
						fill={u.opacitize(color, ux.rotation_ring_state.fill_opacity)}
						stroke={u.opacitize(color, ux.rotation_ring_state.stroke_opacity)}/>
				</svg>
			</Mouse_Responder>
		</div>
	</div>
{/key}
