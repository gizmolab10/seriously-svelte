<script lang='ts'>
	import { s_graphRect, s_mouse_location, s_active_wrapper, s_mouse_up_count, s_ancestry_focus } from '../../ts/state/Reactive_State';
	import { s_user_graphOffset, s_clusters_geometry, s_active_cluster_map, s_paging_ring_state } from '../../ts/state/Reactive_State';
	import { g, k, u, ux, w, Thing, Point, Angle, debug, ZIndex, onMount, signals, svgPaths } from '../../ts/common/Global_Imports';
	import { debugReact, dbDispatch, opacitize, Svelte_Wrapper, SvelteComponentType } from '../../ts/common/Global_Imports';
	import { s_rotation_ring_state, s_rotation_ring_angle, s_rotation_ring_radius } from '../../ts/state/Reactive_State';
	import Mouse_Responder from '../mouse buttons/Mouse_Responder.svelte';
	import Identifiable from '../../ts/data/Identifiable';
	import Paging_Arc from './Paging_Arc.svelte';
	export let radius = 0;
	export let ring_width = 0;
	export let name = k.empty;
	export let color = k.empty;
	export let zindex = ZIndex.rotation;
	export let cursor_closure = () => {};
	const outer_radius = radius + ring_width;
	const diameter = outer_radius * 2;
	const borderStyle = '1px solid';
	const rotation_viewBox = `${-ring_width}, ${-ring_width}, ${diameter}, ${diameter}`;
	const svg_ringPath = svgPaths.ring(Point.square(radius), outer_radius, ring_width);
	let mouse_up_count = $s_mouse_up_count;
	let rotationWrapper!: Svelte_Wrapper;
	let pagingWrapper!: Svelte_Wrapper;
	let rebuilds = 0;
	let rotationRing;
	let pagingArcs;

	debugReact.log_build(` RINGS (svelte)`);
	$s_clusters_geometry.layoutAll_clusters();

	$: {
		if ($s_ancestry_focus.thing?.changed_state ?? false) {
			rebuilds += 1;
		}
	}

	$: {
		// setup wrappers
		if (!!rotationRing && !rotationWrapper) {
			rotationWrapper = new Svelte_Wrapper(rotationRing, handle_mouse_state, -1, SvelteComponentType.rotation);
		}
		if (!!pagingArcs && !pagingWrapper) {
			pagingWrapper = new Svelte_Wrapper(pagingArcs, handle_mouse_state, -1, SvelteComponentType.rotation);
		}
	}

	$: {
		// mouse up ... end all (rotate, resize, paging)
		if (mouse_up_count != $s_mouse_up_count) {
			mouse_up_count = $s_mouse_up_count;
			debugReact.log_action(`RINGS  mouse up`);
			$s_rotation_ring_state.reset();
			$s_active_cluster_map = null;
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

		const _ = $s_mouse_location;								// use store, to invoke this code
		const from_center = u.vector_ofOffset_fromGraphCenter_toMouseLocation(g.graph_center);
		if (!!from_center) {
			let sendSignal = false;
			const inPaging = isInterior();
			const mouse_angle = from_center.angle;
			const isHovering = isHit() && !inPaging && !ux.isAny_paging_arc_active;
			if ($s_rotation_ring_state.isHovering != isHovering) {
				$s_rotation_ring_state.isHovering = isHovering;
			}
			if ($s_paging_ring_state.isHovering != inPaging) {
				$s_paging_ring_state.isHovering = inPaging;			// adjust hover highlight for all arcs  (paging arc handles thumb hover)
			}
			if (!!$s_active_cluster_map) {
				const needs_update = $s_active_cluster_map.paging_state.needs_update;
				$s_active_cluster_map.paging_state.active_angle = mouse_angle;
				if (needs_update && $s_active_cluster_map.adjust_paging_index_forMouse_angle(mouse_angle)) {
					sendSignal = true;
				}
			} else if (!!$s_rotation_ring_state.active_angle || $s_rotation_ring_state.active_angle == 0) {		// rotate_resize clusters
				if (!signals.signal_isInFlight && !mouse_angle.isClocklyAlmost($s_rotation_ring_state.active_angle, Angle.radians_from_degrees(4), Angle.full)) {		// detect >= 4° change
					$s_rotation_ring_angle = mouse_angle.add_angle_normalized(-$s_rotation_ring_state.basis_angle);
					$s_rotation_ring_state.active_angle = mouse_angle;
					sendSignal = true;
				}
			} else if (!!$s_rotation_ring_state.radiusOffset) {		// resize
				const magnitude = from_center.magnitude
				const smallest = k.ring_smallest_radius;
				const largest = k.ring_smallest_radius * 3;
				const distance = magnitude.force_between(smallest, largest);
				const delta = distance - $s_rotation_ring_radius - $s_rotation_ring_state.radiusOffset;
				if (Math.abs(delta) > 1) {							// granularity of 1 pixel
					const radius = $s_rotation_ring_radius + delta;
					debugReact.log_action(`RINGS  ${radius.toFixed(0)}`);
					$s_rotation_ring_radius = radius;
					sendSignal = true;
				}
			}
			cursor_closure();
			if (sendSignal) {
				signals.signal_relayoutWidgets_fromFocus();			// destroys this component (properties are in s_rotation_ring_state && s_active_cluster_map)
				rebuilds += 1;
			}
		}
	}

	function closure(mouse_state) {

		/////////////////////////////
		// setup or teardown state //
		/////////////////////////////

		const from_center = u.vector_ofOffset_fromGraphCenter_toMouseLocation(g.graph_center);
		const mouse_wentDown_angle = from_center.angle;
		if (isInterior()) {
			const basis_angle = mouse_wentDown_angle.normalized_angle();
			const map = $s_clusters_geometry.cluster_mapFor_mouseLocation;
			if (!!map && mouse_state.isDown) {
					
				// begin paging

				map.paging_state.active_angle = basis_angle;
				map.paging_state.basis_angle = basis_angle;
				$s_active_wrapper = pagingWrapper;
				$s_active_cluster_map = map;
				console.log('PAGING')
				rebuilds += 1;
			}
		} else if (isHit()) {
			if (mouse_state.isDouble) {

				// begin resize
				
				const radius = from_center.magnitude - $s_rotation_ring_radius;
				debugReact.log_action(`RINGS  ${radius.toFixed(0)}`);
				$s_rotation_ring_state.radiusOffset = radius;
				$s_active_wrapper = rotationWrapper;
				rebuilds += 1;
			} else if (mouse_state.isDown) {

				// begin rotate

				const basis_angle = mouse_wentDown_angle.add_angle_normalized(-$s_rotation_ring_angle);
				$s_rotation_ring_state.active_angle = mouse_wentDown_angle;
				$s_rotation_ring_state.basis_angle = basis_angle;
				$s_active_wrapper = rotationWrapper;
				rebuilds += 1;
			}
		}
		cursor_closure();
	}

	function distance_fromCenter(): number | null {
		const vector = u.vector_ofOffset_fromGraphCenter_toMouseLocation(g.graph_center);
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
		<div class='paging-arcs' bind:this={pagingArcs} style='z-index:{ZIndex.paging};'>
			{#each $s_clusters_geometry.cluster_maps as cluster_map}
				{#if !!cluster_map && (cluster_map.shown > 0)}
					<Paging_Arc
						color={color}
						cluster_map={cluster_map}/>
				{/if}
			{/each}
		</div>
		<div class='rotates-expands' bind:this={rotationRing} style='z-index:{ZIndex.rotation};'>
			<Mouse_Responder
				name={name}
				zindex={zindex}
				width={diameter}
				height={diameter}
				closure={closure}
				center={g.graph_center}
				detect_longClick={false}
				detectHit_closure={isHit}
				cursor={$s_rotation_ring_state.cursor}>
				<svg
					class= 'svg-rotates'
					viewBox={rotation_viewBox}>
					{#if debug.reticule}
						<path stroke='green' fill=transparent d={svgPaths.t_cross($s_rotation_ring_radius * 2, 0)}/>
					{/if}
					<path d={svg_ringPath}
						fill={u.opacitize(color, $s_rotation_ring_state.fill_opacity)}
						stroke={u.opacitize(color, $s_rotation_ring_state.stroke_opacity)}/>
				</svg>
			</Mouse_Responder>
		</div>
	</div>
{/key}
