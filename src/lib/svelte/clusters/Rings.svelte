<script lang='ts'>
	import { s_graphRect, s_thing_changed, s_mouse_location } from '../../ts/state/Reactive_State';
	import { s_mouse_up_count } from '../../ts/state/Reactive_State';
	import { s_ancestry_focus, s_user_graphOffset, s_clusters_geometry, s_active_cluster_map } from '../../ts/state/Reactive_State';
	import { g, k, u, ux, w, Thing, Point, Angle, debug, ZIndex, onMount, signals } from '../../ts/common/Global_Imports';
	import { s_paging_ring_state, s_ring_resizing_state, s_ring_rotation_state } from '../../ts/state/Reactive_State';
	import { s_rotation_ring_angle, s_rotation_ring_radius } from '../../ts/state/Reactive_State';
	import { svgPaths, dbDispatch, opacitize } from '../../ts/common/Global_Imports';
	import Mouse_Responder from '../mouse buttons/Mouse_Responder.svelte';
	import Identifiable from '../../ts/data/Identifiable';
	import Paging_Arc from './Paging_Arc.svelte';
	export let name = k.empty;
	export let color = k.empty;
	export let zindex = ZIndex.rotation;
	export let cursor_closure = () => {};
	const ring_width = k.ring_rotation_thickness;
	const ring_outer_offset = -ring_width;
	const ring_inner_radius = $s_rotation_ring_radius;
	const ring_middle_radius = ring_inner_radius + ring_width;
	const ring_outer_radius = ring_middle_radius + ring_width;
	const ring_outer_diameter = ring_outer_radius * 2;
	const mouse_timer = ux.mouse_timer_forName(name);	// persist across destroy/recreate
	const svg_ring_rotation_path = svgPaths.annulus(Point.square(ring_inner_radius), ring_middle_radius, ring_width, Point.square(ring_width));
	const svg_ring_resizing_path = svgPaths.annulus(Point.square(ring_middle_radius), ring_outer_radius, ring_width);
	const ring_viewBox = `${ring_outer_offset}, ${ring_outer_offset}, ${ring_outer_diameter}, ${ring_outer_diameter}`;
	let mouse_up_count = $s_mouse_up_count;
	let rotationRing;
	let rebuilds = 0;
	let pagingArcs;

	enum Ring_Zone {
		miss	 = 'miss',
		resizing = 'resizing',
		rotation = 'rotation',
		paging	 = 'paging',
	}

	// debug.log_build(` RINGS (svelte)`);
	$s_clusters_geometry.layoutAll_clusters();

	$: {
		if (!!$s_ancestry_focus.thing && $s_ancestry_focus.thing.id == $s_thing_changed?.split(k.generic_separator)[0]) {
			rebuilds += 1;
		}
	}

	$: {
		// mouse up ... end all (rotation, resizing, paging)
		if (mouse_up_count != $s_mouse_up_count) {
			mouse_up_count = $s_mouse_up_count;
			const ring_zone = ringZone_forMouseLocation();
			if (ring_zone == Ring_Zone.miss) {			// only respond if NOT isHit
				reset();
			}
		}
	}

	$: {

		////////////////////////////////////
		// detect movement & adjust state //
		////////////////////////////////////

		const _ = $s_mouse_location;											// use store, to invoke this code
		const from_center = u.vector_ofOffset_fromGraphCenter_toMouseLocation(g.graph_center);
		if (!!from_center) {
			const mouse_angle = from_center.angle;
			const rotation_state = $s_ring_rotation_state;
			detect_hovering();
			if (!!rotation_state.active_angle || rotation_state.active_angle == 0) {		// rotate clusters
				if (!signals.signal_isInFlight && !mouse_angle.isClocklyAlmost(rotation_state.active_angle, Angle.radians_from_degrees(4), Angle.full)) {		// detect >= 4° change
					$s_rotation_ring_angle = mouse_angle.add_angle_normalized(-rotation_state.basis_angle);
					debug.log_action(`RINGS  rotate  ${$s_rotation_ring_angle.degrees_of(0)}`);
					rotation_state.active_angle = mouse_angle;
					signals.signal_relayoutWidgets_fromFocus();					// destroys this component (properties are in s_ring_rotation_state)
					rebuilds += 1;
				}
			} else if (!!$s_active_cluster_map) {
				const paging_rotation = $s_active_cluster_map.paging_rotation;
				const basis_angle = paging_rotation.basis_angle;
				const active_angle = paging_rotation.active_angle;
				const delta_angle = (active_angle - mouse_angle).angle_normalized_aroundZero();
				paging_rotation.active_angle = mouse_angle;
				if (!!basis_angle && !!active_angle && basis_angle != active_angle && $s_active_cluster_map.adjust_paging_index_byAdding_angle(delta_angle)) {
					debug.log_action(`RINGS  page  ${delta_angle.degrees_of(0)}`);
					signals.signal_rebuildGraph_fromFocus();
				}
			} else if (!!$s_ring_resizing_state.basis_offset) {					// resize
				const smallest = k.ring_smallest_radius;
				const largest = k.ring_smallest_radius * 3;
				const magnitude = from_center.magnitude - $s_ring_resizing_state.basis_offset;
				const distance = magnitude.force_between(smallest, largest);
				const delta = distance - $s_rotation_ring_radius;
				const radius = $s_rotation_ring_radius + delta;
				// if (Math.abs(delta) > 1 && radius >= smallest) {				// granularity of 1 pixel
				if (Math.abs(delta) > 1) {										// granularity of 1 pixel
					debug.log_action(`RINGS  resize  D ${distance.toFixed(0)}  R ${radius.toFixed(0)}  + ${delta.toFixed(1)}`);
					$s_rotation_ring_radius = radius;
					signals.signal_rebuildGraph_fromFocus();					// destroys this component (properties are in s_ring_resizing_state)
				}
			}
			cursor_closure();
		}
	}

	function mouse_state_closure(mouse_state) {

		/////////////////////////////
		// setup or teardown state //
		/////////////////////////////

		debug.log_hover(mouse_state.description);
		if (!mouse_state.isHover) {
			const mouse_wentDown_angle = angle_fromCenter();
			const ring_zone = ringZone_forMouseLocation();
			if (mouse_state.isUp) {
				reset();
			} else if (mouse_state.isDown) {
				switch (ring_zone) {
					case Ring_Zone.resizing:
						const radius_offset = distance_fromCenter() - $s_rotation_ring_radius;
						debug.log_action(`RINGS  begin resize  ${radius_offset.toFixed(0)}`);
						$s_ring_resizing_state.basis_offset = radius_offset;
						rebuilds += 1;
						break;
					case Ring_Zone.rotation:
						const rotation_angle = mouse_wentDown_angle.add_angle_normalized(-$s_rotation_ring_angle);
						debug.log_action(`RINGS  begin rotate  ${rotation_angle.degrees_of(0)}`);
						$s_ring_rotation_state.active_angle = mouse_wentDown_angle;
						$s_ring_rotation_state.basis_angle = rotation_angle;
						rebuilds += 1;
						break;
					case Ring_Zone.paging: 
						const paging_angle = mouse_wentDown_angle.angle_normalized();
						const map = $s_clusters_geometry.cluster_mapFor_mouseLocation;
						debug.log_action(`RINGS  mouse is ${mouse_state.isDown ? 'down' : 'not down'}`)
						if (!!map && mouse_state.isDown) {
							debug.log_action(`RINGS  begin paging  ${paging_angle.degrees_of(0)}`);
							map.paging_rotation.active_angle = paging_angle;
							map.paging_rotation.basis_angle = paging_angle;
							$s_active_cluster_map = map;
							rebuilds += 1;
						}
						break;
				}
			}
			cursor_closure();
		}
	}

	function vector_fromCenter(): number { return u.vector_ofOffset_fromGraphCenter_toMouseLocation(g.graph_center); }
	function angle_fromCenter(): number | null { return vector_fromCenter()?.angle ?? null; }
	function distance_fromCenter(): number { return vector_fromCenter()?.magnitude ?? 0; }
	function handle_mouse_state(mouse_state: Mouse_State): boolean { return true; }		// only for wrappers
	function isHit(): boolean { return distance_fromCenter() <= ring_outer_radius; }

	function detect_hovering() {
		const ring_zone = ringZone_forMouseLocation();
		const arc_isActive = ux.isAny_paging_arc_active;
		const inRotate = ring_zone == Ring_Zone.rotation && !arc_isActive && !$s_ring_resizing_state.isActive;
		const inResize = ring_zone == Ring_Zone.resizing && !arc_isActive && !$s_ring_rotation_state.isActive;
		const inPaging = ring_zone == Ring_Zone.paging && !$s_ring_rotation_state.isActive && !$s_ring_resizing_state.isActive;
		if ($s_paging_ring_state.isHovering != inPaging) {
			$s_paging_ring_state.isHovering = inPaging;			// all arcs and thumbs
		}
		if ($s_ring_rotation_state.isHovering != inRotate) {
			$s_ring_rotation_state.isHovering = inRotate;
		}
		if ($s_ring_resizing_state.isHovering != inResize) {
			$s_ring_resizing_state.isHovering = inResize;
		}
	}

	function ringZone_forMouseLocation(): Ring_Zone {
		const distance = distance_fromCenter();
		if (!!distance && distance <= ring_outer_radius) {
			if (distance > ring_middle_radius) {
				return Ring_Zone.resizing;
			} else if (distance > ring_inner_radius) {
				return Ring_Zone.rotation;
			}
			return Ring_Zone.paging;
		}
		return Ring_Zone.miss;
	}

	function reset() {
		const ring_zone = ringZone_forMouseLocation();
		debug.log_action(`RINGS  mouse up in  '${ring_zone}'`);
		ux.mouse_timer_forName(name).reset();
		$s_ring_rotation_state.reset();
		$s_ring_resizing_state.reset();
		$s_active_cluster_map = null;
		mouse_timer.reset();
		ux.reset_paging();
		cursor_closure();
		rebuilds += 1;
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
				isHit_closure={isHit}
				center={g.graph_center}
				detect_longClick={false}
				detect_doubleClick={false}
				width={ring_outer_diameter}
				height={ring_outer_diameter}
				cursor={$s_ring_rotation_state.cursor}
				mouse_state_closure={mouse_state_closure}>
				<svg
					class='svg-rotates'
					viewBox={ring_viewBox}>
					{#if debug.reticule}
						<path stroke='green' fill=transparent d={svgPaths.t_cross(ring_middle_radius * 2, -2)}/>
					{/if}
					<path d={svg_ring_rotation_path}
						fill={u.opacitize(color, $s_ring_rotation_state.fill_opacity * ($s_ring_resizing_state.isHighlighted ? 0.3 : 1))}
						stroke={u.opacitize(color, $s_ring_rotation_state.stroke_opacity * ($s_ring_resizing_state.isHighlighted ? 0.7 : 1))}/>
					<path d={svg_ring_resizing_path}
						fill={u.opacitize(color, $s_ring_resizing_state.fill_opacity)}
						stroke={u.opacitize(color, $s_ring_resizing_state.stroke_opacity)}/>
				</svg>
			</Mouse_Responder>
		</div>
	</div>
{/key}
