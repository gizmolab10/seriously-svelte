<script lang='ts'>
	import { g, k, u, ux, w, Thing, Point, Angle, debug, ZIndex, onMount, signals } from '../../ts/common/Global_Imports';
	import { s_focus_ancestry, s_clusters_geometry, s_active_cluster_map } from '../../ts/state/Reactive_State';
	import { s_rotation_ring_angle, s_ring_rotation_radius } from '../../ts/state/Reactive_State';
	import { s_graphRect, s_color_thing, s_mouse_location } from '../../ts/state/Reactive_State';
	import { Ring_Zone, svgPaths, dbDispatch, opacitize } from '../../ts/common/Global_Imports';
	import { s_mouse_up_count, s_user_graphOffset } from '../../ts/state/Reactive_State';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import Identifiable from '../../ts/basis/Identifiable';
	import Paging_Arc from './Paging_Arc.svelte';
	export let zindex = ZIndex.backmost;
	const ring_width = k.ring_rotation_thickness;
	const middle_radius = $s_ring_rotation_radius + k.ring_rotation_thickness;
	const middle_diameter = middle_radius * 2;
	const outer_radius = middle_radius + ring_width;
	const outer_diameter = outer_radius * 2;
	const name = 'rings';
	const mouse_timer = ux.mouse_timer_forName(name);	// persist across destroy/recreate
	const svg_ring_rotation_path = svgPaths.annulus(Point.square($s_ring_rotation_radius), middle_radius, ring_width, Point.square(ring_width));
	const svg_ring_resizing_path = svgPaths.annulus(Point.square(middle_radius), outer_radius, ring_width);
	const viewBox = `${-ring_width}, ${-ring_width}, ${outer_diameter}, ${outer_diameter}`;
	let color = $s_focus_ancestry?.thing?.color ?? k.thing_color_default;
	let mouse_up_count = $s_mouse_up_count;
	let cursor = k.cursor_default;
	let rebuilds = 0;
	let pagingArcs;

	update_cursor();
	debug.log_build(` (svelte)`);
	$s_clusters_geometry.layoutAll_clusters();
	function isHit(): boolean { return u.distance_fromCenter <= outer_radius; }
	function handle_mouse_state(mouse_state: Mouse_State): boolean { return true; }		// only for wrappers

	$: {
		if (!!$s_focus_ancestry.thing && $s_focus_ancestry.thing.id == $s_color_thing?.split(k.generic_separator)[0]) {
			color = $s_focus_ancestry?.thing?.color ?? k.thing_color_default;
			rebuilds += 1;
		}
	}

	$: {
		// mouse up ... end all (rotation, resizing, paging)
		if (mouse_up_count != $s_mouse_up_count) {
			mouse_up_count = $s_mouse_up_count;
			const ring_zone = u.ringZone_forMouseLocation;
			if (ring_zone == Ring_Zone.miss) {			// only respond if NOT isHit
				reset();
			}
		}
	}

	function update_cursor() {
		const ring_zone = u.ringZone_forMouseLocation;
		switch (ring_zone) {
			case Ring_Zone.paging: cursor = g.cluster_paging_state.cursor; break;
			case Ring_Zone.resize: cursor = g.ring_resizing_state.cursor; break;
			case Ring_Zone.rotate: cursor = g.ring_rotation_state.cursor; break;
			default:			   cursor = 'default'; break;
		}
	}

	function reset() {
		ux.mouse_timer_forName(name).reset();
		g.ring_rotation_state.reset();
		g.ring_resizing_state.reset();
		$s_active_cluster_map = null;
		mouse_timer.reset();
		ux.reset_paging();
		rebuilds += 1;
	}

	function detect_hovering() {
		const ring_zone = u.ringZone_forMouseLocation;
		const arc_isActive = ux.isAny_paging_arc_active;
		const inRotate = ring_zone == Ring_Zone.rotate && !arc_isActive && !g.ring_resizing_state.isActive;
		const inResize = ring_zone == Ring_Zone.resize && !arc_isActive && !g.ring_rotation_state.isActive;
		const inPaging = ring_zone == Ring_Zone.paging && !g.ring_rotation_state.isActive && !g.ring_resizing_state.isActive;
		if (g.cluster_paging_state.isHovering != inPaging) {
			g.cluster_paging_state.isHovering = inPaging;
			rebuilds += 1;
		}
		if (g.ring_rotation_state.isHovering != inRotate) {
			g.ring_rotation_state.isHovering = inRotate;
			rebuilds += 1;
		}
		if (g.ring_resizing_state.isHovering != inResize) {
			g.ring_resizing_state.isHovering = inResize;
			rebuilds += 1;
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
			const rotation_state = g.ring_rotation_state;
			const resizing_state = g.ring_resizing_state;
			if (!!resizing_state.isActive) {									// resize, check this FIRST (when both states return isActive true, rotation should be ignored)
				const smallest = k.innermost_ring_radius;
				const largest = smallest * 3;
				const magnitude = from_center.magnitude - resizing_state.basis_radius;
				const distance = magnitude.force_between(smallest, largest);
				const delta = distance - $s_ring_rotation_radius;
				const radius = $s_ring_rotation_radius + delta;
				resizing_state.active_angle = mouse_angle + Angle.quarter;
				detect_hovering();
				cursor = g.ring_resizing_state.cursor;
				if (Math.abs(delta) > 1) {										// granularity of 1 pixel
					debug.log_action(` resize  D ${distance.toFixed(0)}  R ${radius.toFixed(0)}  + ${delta.toFixed(1)}`);
					$s_ring_rotation_radius = radius;
					signals.signal_rebuildGraph_fromFocus();					// destroys this component (properties are in s_ring_resizing_state)
					rebuilds += 1;
				}
			} else if (!!rotation_state.isActive) {								// rotate clusters
				if (!signals.signal_isInFlight && !mouse_angle.isClocklyAlmost(rotation_state.active_angle, Angle.radians_from_degrees(4), Angle.full)) {		// detect >= 4° change
					$s_rotation_ring_angle = mouse_angle.add_angle_normalized(-rotation_state.basis_angle);
					debug.log_action(` rotate ${$s_rotation_ring_angle.degrees_of(0)}`);
					rotation_state.active_angle = mouse_angle;
					detect_hovering();
					cursor = g.ring_rotation_state.cursor;
					signals.signal_relayoutWidgets_fromFocus();					// destroys this component (properties are in s_ring_rotation_state)
					rebuilds += 1;
				}
			} else if (!!$s_active_cluster_map) {
				const paging_rotation = $s_active_cluster_map.paging_rotation;
				const basis_angle = paging_rotation.basis_angle;
				const active_angle = paging_rotation.active_angle;
				const delta_angle = (active_angle - mouse_angle).angle_normalized_aroundZero();
				paging_rotation.active_angle = mouse_angle;
				detect_hovering();
				cursor = paging_rotation.cursor;
				if (!!basis_angle && !!active_angle && basis_angle != active_angle && $s_active_cluster_map.adjust_paging_index_byAdding_angle(delta_angle)) {
					debug.log_action(` page  ${delta_angle.degrees_of(0)}`);
					signals.signal_rebuildGraph_fromFocus();
					rebuilds += 1;
				}
			} else {
				detect_hovering();
				update_cursor();
				rebuilds += 1;
			}
		}
	}

	function mouse_state_closure(mouse_state) {

		/////////////////////////////
		// setup or teardown state //
		/////////////////////////////

		if (!mouse_state.isHover) {
			const mouse_wentDown_angle = u.angle_fromCenter;
			const rotation_angle = mouse_wentDown_angle.add_angle_normalized(-$s_rotation_ring_angle);
			const ring_zone = u.ringZone_forMouseLocation;
			if (mouse_state.isUp) {
				reset();
				rebuilds += 1;
			} else if (mouse_state.isDown) {
				switch (ring_zone) {
					case Ring_Zone.rotate:
						debug.log_action(` begin rotate  ${rotation_angle.degrees_of(0)}`);
						g.ring_rotation_state.active_angle = mouse_wentDown_angle;
						g.ring_rotation_state.basis_angle = rotation_angle;
						rebuilds += 1;
						break;
					case Ring_Zone.resize:
						const radius_offset = u.distance_fromCenter - $s_ring_rotation_radius;
						debug.log_action(` begin resize  ${radius_offset.toFixed(0)}`);
						g.ring_rotation_state.active_angle = mouse_wentDown_angle + Angle.quarter;	// needed for cursor
						g.ring_rotation_state.basis_angle = rotation_angle + Angle.quarter;
						g.ring_resizing_state.basis_radius = radius_offset;
						rebuilds += 1;
						break;
					case Ring_Zone.paging: 
						const paging_angle = mouse_wentDown_angle.angle_normalized();
						const map = $s_clusters_geometry.cluster_mapFor_mouseLocation;
						if (!!map) {
							debug.log_action(` begin paging  ${paging_angle.degrees_of(0)}`);
							map.paging_rotation.active_angle = paging_angle;
							map.paging_rotation.basis_angle = paging_angle;
							$s_active_cluster_map = map;
							rebuilds += 1;
						}
						break;
				}
			}
		}
		detect_hovering();
		update_cursor();
	}

</script>

{#key rebuilds}
	<div class='paging-arcs' bind:this={pagingArcs} style='z-index:{ZIndex.paging};'>
		{#each $s_clusters_geometry.cluster_maps as cluster_map}
			{#if !!cluster_map && (cluster_map.shown > 0)}
				<Paging_Arc
					color={color}
					cluster_map={cluster_map}/>
			{/if}
		{/each}
	</div>
	{#if !debug.hide_rings}
		<div class='rings' style='z-index:{ZIndex.rings};'>
			<Mouse_Responder
				name='rings'
				zindex={zindex}
				cursor={cursor}
				isHit_closure={isHit}
				width={outer_diameter}
				height={outer_diameter}
				center={g.graph_center}
				mouse_state_closure={mouse_state_closure}>
				<svg
					class='rings-svg'
					viewBox={viewBox}>
					<path class='resize-path' d={svg_ring_resizing_path}
						fill={u.opacitize(color, g.ring_resizing_state.fill_opacity)}
						stroke={u.opacitize(color, g.ring_resizing_state.stroke_opacity)}/>
					{#if debug.reticule}
						<path class='reticule-path' stroke='green' fill=transparent d={svgPaths.t_cross(middle_radius * 2, -2)}/>
					{/if}
					<path class='rotate-path' d={svg_ring_rotation_path}
						fill={u.opacitize(color, g.ring_rotation_state.fill_opacity * (g.ring_resizing_state.isHighlighted ? 0.3 : 1))}
						stroke={u.opacitize(color, g.ring_rotation_state.stroke_opacity * (g.ring_resizing_state.isHighlighted ? 0.7 : 1))}/>
				</svg>
			</Mouse_Responder>
		</div>
	{/if}
{/key}
