<script lang='ts'>
	import { g, k, u, ux, w, Thing, Point, Angle, debug, T_Layer } from '../../ts/common/Global_Imports';
	import { s_thing_color, s_ancestry_focus, s_g_radial } from '../../ts/state/S_Stores';
	import { s_ring_rotation_angle, s_ring_rotation_radius } from '../../ts/state/S_Stores';
	import { signals, svgPaths, T_Ring, databases } from '../../ts/common/Global_Imports';
	import { s_count_mouse_up, s_g_active_cluster } from '../../ts/state/S_Stores';
	import { s_graphRect, s_mouse_location_scaled } from '../../ts/state/S_Stores';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import Identifiable from '../../ts/data/basis/Identifiable';
	import Paging_ArcSlider from './Paging_ArcSlider.svelte';
	import { onMount } from 'svelte';
	export let zindex = T_Layer.backmost;
	const ring_width = k.ring_rotation_thickness;
	const middle_radius = $s_ring_rotation_radius + k.ring_rotation_thickness;
	const middle_diameter = middle_radius * 2;
	const outer_radius = middle_radius + ring_width;
	const outer_diameter = outer_radius * 2;
	const name = 'rings';
	const mouse_timer = ux.mouse_timer_forName(name);	// persist across destroy/recreate
	const svgPathFor_rotationRing = svgPaths.annulus(Point.square($s_ring_rotation_radius), middle_radius, ring_width, Point.square(ring_width));
	const svgPathFor_resizingRing = svgPaths.annulus(Point.square(middle_radius), outer_radius, ring_width);
	const viewBox = `${-ring_width}, ${-ring_width}, ${outer_diameter}, ${outer_diameter}`;
	let color = $s_ancestry_focus?.thing?.color ?? k.thing_color_default;
	let mouse_up_count = $s_count_mouse_up;
	let cursor = k.cursor_default;
	let rebuilds = 0;
	let pagingArcs;

	// paging arcs and rings

	update_cursor();
	debug.log_build(` (svelte)`);
	$s_g_radial.layoutAll_clusters();
	function handle_mouse_state(mouse_state: S_Mouse): boolean { return true; }				// only for wrappers
	function isHit(): boolean { return w.mouse_distance_fromGraphCenter <= outer_radius; }

	$: {
		if (!!$s_ancestry_focus.thing && $s_ancestry_focus.thing.id == $s_thing_color?.split(k.generic_separator)[0]) {
			color = $s_ancestry_focus?.thing?.color ?? k.thing_color_default;
			rebuilds += 1;
		}
	}

	$: {
		// mouse up ... end all (rotation, resizing, paging)
		if (mouse_up_count != $s_count_mouse_up) {
			mouse_up_count = $s_count_mouse_up;
			if (ringZone_forMouseLocation() == T_Ring.miss) {			// only respond if NOT isHit
				reset();
			}
		}
	}

	function update_cursor() {
		switch (ringZone_forMouseLocation()) {
			case T_Ring.paging: cursor = g.cluster_paging_state.cursor; break;
			case T_Ring.resize: cursor = g.ring_resizing_state.cursor; break;
			case T_Ring.rotate: cursor = g.ring_rotation_state.cursor; break;
			default:			   cursor = 'default'; break;
		}
	}

	function reset() {
		ux.mouse_timer_forName(name).reset();
		g.ring_resizing_state.reset();
		g.ring_rotation_state.reset();
		$s_g_active_cluster = null;
		mouse_timer.reset();
		ux.reset_paging();
		rebuilds += 1;
	}

	function ringZone_forMouseLocation(): T_Ring {
		let ring_zone = T_Ring.miss;
		const mouse_vector = w.mouse_vector_ofOffset_fromGraphCenter();
		if (!!mouse_vector) {
			const distance = mouse_vector.magnitude;
			const thick = k.ring_rotation_thickness;
			const inner = $s_ring_rotation_radius;
			const thin = k.paging_arc_thickness;
			const resize = inner + thick * 2;
			const rotate = inner + thick;
			const thumb = inner - thin;
			if (!!distance && distance <= resize) {
				if (distance > rotate) {
					ring_zone = T_Ring.resize;
				} else if (distance > inner) {
					ring_zone = T_Ring.rotate;
				} else if (distance > thumb) {
					ring_zone = T_Ring.paging;
				}
			}
			debug.log_hover(` ring zone ${ring_zone} ${distance.toFixed(0)}`);
			debug.log_cursor(` ring zone ${ring_zone} ${mouse_vector.description}`);
		}
		return ring_zone;
	}

	function detect_hovering() {
		const ring_zone = ringZone_forMouseLocation();
		const arc_isActive = ux.isAny_paging_arc_active;
		const inRotate = ring_zone == T_Ring.rotate && !arc_isActive && !g.ring_resizing_state.isActive;
		const inResize = ring_zone == T_Ring.resize && !arc_isActive && !g.ring_rotation_state.isActive;
		const inPaging = ring_zone == T_Ring.paging && !g.ring_rotation_state.isActive && !g.ring_resizing_state.isActive;
		if (g.cluster_paging_state.isHovering != inPaging) {
			g.cluster_paging_state.isHovering  = inPaging;
			debug.log_hover(` hover paging  ${inPaging}`);
			rebuilds += 1;
		}
		if (g.ring_rotation_state.isHovering != inRotate) {
			g.ring_rotation_state.isHovering  = inRotate;
			debug.log_hover(` hover rotate  ${inRotate}`);
			rebuilds += 1;
		}
		if (g.ring_resizing_state.isHovering != inResize) {
			g.ring_resizing_state.isHovering  = inResize;
			debug.log_hover(` hover resize  ${inResize}`);
			rebuilds += 1;
		}
	}

	$: {

		////////////////////////////////////
		// detect movement & adjust state //
		////////////////////////////////////

		const _ = $s_mouse_location_scaled;											// use store, to invoke this code
		const mouse_vector = w.mouse_vector_ofOffset_fromGraphCenter();
		if (!!mouse_vector) {
			const mouse_angle = mouse_vector.angle;
			const rotation_state = g.ring_rotation_state;
			const resizing_state = g.ring_resizing_state;

			// check if already dragging in one of the three ring zones

			if (!!resizing_state.isActive) {									// resize, check this FIRST (when both states return isActive true, rotation should be ignored)
				const smallest = k.innermost_ring_radius;
				const largest = smallest * 3;
				const magnitude = mouse_vector.magnitude - resizing_state.basis_radius;
				const distance = magnitude.force_between(smallest, largest);
				const delta = distance - $s_ring_rotation_radius;
				const radius = $s_ring_rotation_radius + delta;
				resizing_state.active_angle = mouse_angle + Angle.quarter;
				detect_hovering();
				cursor = g.ring_resizing_state.cursor;
				if (Math.abs(delta) > 1) {										// granularity of 1 pixel
					debug.log_radial(` resize  D ${distance.toFixed(0)}  R ${radius.toFixed(0)}  + ${delta.toFixed(1)}`);
					$s_ring_rotation_radius = radius;
					signals.signal_rebuildGraph_fromFocus();					// destroys this component (properties are in s_ring_resizing_state)
					rebuilds += 1;
				}
			} else if (!!rotation_state.isActive) {								// rotate clusters
				if (!signals.signal_isInFlight && !mouse_angle.isClocklyAlmost(rotation_state.active_angle, Angle.radians_from_degrees(4), Angle.full)) {		// detect >= 4° change
					$s_ring_rotation_angle = mouse_angle.add_angle_normalized(-rotation_state.basis_angle);
					debug.log_radial(` rotate ${$s_ring_rotation_angle.degrees_of(0)}`);
					rotation_state.active_angle = mouse_angle;
					detect_hovering();
					cursor = g.ring_rotation_state.cursor;
					signals.signal_relayoutWidgets_fromFocus();					// destroys this component (properties are in s_ring_rotation_state)
					rebuilds += 1;
				}
			} else if (!!$s_g_active_cluster) {
				const paging_rotation = $s_g_active_cluster.paging_rotation;
				const basis_angle = paging_rotation.basis_angle;
				const active_angle = paging_rotation.active_angle;
				const delta_angle = (active_angle - mouse_angle).angle_normalized_aroundZero();
				paging_rotation.active_angle = mouse_angle;
				detect_hovering();
				cursor = paging_rotation.cursor;
				if (!!basis_angle && !!active_angle && basis_angle != active_angle && $s_g_active_cluster.adjust_paging_index_byAdding_angle(delta_angle)) {
					debug.log_radial(` page  ${delta_angle.degrees_of(0)}`);
					signals.signal_rebuildGraph_fromFocus();
					rebuilds += 1;
				}
			} else {				// not dragging
				detect_hovering();
				update_cursor();
				rebuilds += 1;
			}
		}
	}

	function down_up_closure(mouse_state) {

		/////////////////////////////
		// setup or teardown state //
		/////////////////////////////

		if (!mouse_state.isHover) {
			if (mouse_state.isUp) {
				// debug.log_radial(`UP`);
				reset();
				rebuilds += 1;
			} else if (mouse_state.isDown) {
				// debug.log_radial(`DOWN`);
				const mouse_wentDown_angle = w.mouse_angle_fromGraphCenter;
				const rotation_angle = mouse_wentDown_angle.add_angle_normalized(-$s_ring_rotation_angle);
				switch (ringZone_forMouseLocation()) {
					case T_Ring.rotate:
						debug.log_radial(` begin rotate  ${rotation_angle.degrees_of(0)}`);
						g.ring_rotation_state.active_angle = mouse_wentDown_angle;
						g.ring_rotation_state.basis_angle = rotation_angle;
						rebuilds += 1;
						break;
					case T_Ring.resize:
						const radius_offset = w.mouse_distance_fromGraphCenter - $s_ring_rotation_radius;
						debug.log_radial(` begin resize  ${radius_offset.toFixed(0)}`);
						g.ring_rotation_state.active_angle = mouse_wentDown_angle + Angle.quarter;	// needed for cursor
						g.ring_rotation_state.basis_angle = rotation_angle + Angle.quarter;
						g.ring_resizing_state.basis_radius = radius_offset;
						rebuilds += 1;
						break;
					case T_Ring.paging: 
						const paging_angle = mouse_wentDown_angle.angle_normalized();
						const map = $s_g_radial.cluster_mapFor_mouseLocation;
						if (!!map) {
							debug.log_radial(` begin paging  ${paging_angle.degrees_of(0)}`);
							map.paging_rotation.active_angle = paging_angle;
							map.paging_rotation.basis_angle = paging_angle;
							$s_g_active_cluster = map;
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
	<div class='paging-arcs' bind:this={pagingArcs} style='z-index:{T_Layer.paging};'>
		{#each $s_g_radial.cluster_maps as g_cluster}
			{#if !!g_cluster && (g_cluster.widgets_shown > 0)}
				<Paging_ArcSlider
					color={color}
					g_cluster={g_cluster}/>
			{/if}
		{/each}
	</div>
	{#if !debug.hide_rings}
		<div class='rings' style='z-index:{T_Layer.rings};'>
			<Mouse_Responder
				name='rings'
				zindex={zindex}
				cursor={cursor}
				isHit_closure={isHit}
				width={outer_diameter}
				height={outer_diameter}
				center={w.center_ofGraphSize}
				mouse_state_closure={down_up_closure}>
				<svg
					class='rings-svg'
					viewBox={viewBox}>
					<path class='resize-path' d={svgPathFor_resizingRing}
						fill={u.opacitize(color, g.ring_resizing_state.fill_opacity)}
						stroke={u.opacitize(color, g.ring_resizing_state.stroke_opacity)}/>
					{#if debug.reticule}
						<path class='reticule-path' stroke='green' fill=transparent d={svgPaths.t_cross(middle_radius * 2, -2)}/>
					{/if}
					<path class='rotate-path' d={svgPathFor_rotationRing}
						fill={u.opacitize(color, g.ring_rotation_state.fill_opacity * (g.ring_resizing_state.isHighlighted ? 0.3 : 1))}
						stroke={u.opacitize(color, g.ring_rotation_state.stroke_opacity * (g.ring_resizing_state.isHighlighted ? 0.7 : 1))}/>
				</svg>
			</Mouse_Responder>
		</div>
	{/if}
{/key}
