<script lang='ts'>
	import { g, k, u, ux, w, Thing, Point, Angle, debug, T_Layer } from '../../ts/common/Global_Imports';
	import { w_thing_color, w_ancestry_focus, w_g_radial } from '../../ts/state/S_Stores';
	import { w_ring_rotation_angle, w_ring_rotation_radius } from '../../ts/state/S_Stores';
	import { signals, svgPaths, T_RingZone, databases } from '../../ts/common/Global_Imports';
	import { w_count_mouse_up, w_g_active_cluster } from '../../ts/state/S_Stores';
	import { w_graph_rect, w_mouse_location_scaled } from '../../ts/state/S_Stores';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import Identifiable from '../../ts/data/runtime/Identifiable';
	import Paging_ArcSlider from './Paging_ArcSlider.svelte';
	import { onMount } from 'svelte';
	export let zindex = T_Layer.backmost;
	const ring_width = k.ring_rotation_thickness;
	const middle_radius = $w_ring_rotation_radius + k.ring_rotation_thickness;
	const middle_diameter = middle_radius * 2;
	const outer_radius = middle_radius + ring_width;
	const outer_diameter = outer_radius * 2;
	const name = 'rings';
	const mouse_timer = ux.mouse_timer_forName(name);	// persist across destroy/recreate
	const svgPathFor_rotationRing = svgPaths.annulus(Point.square($w_ring_rotation_radius), middle_radius, ring_width, Point.square(ring_width));
	const svgPathFor_resizingRing = svgPaths.annulus(Point.square(middle_radius), outer_radius, ring_width);
	const viewBox = `${-ring_width}, ${-ring_width}, ${outer_diameter}, ${outer_diameter}`;
	let color = $w_ancestry_focus?.thing?.color ?? k.thing_color_default;
	let mouse_up_count = $w_count_mouse_up;
	let cursor = k.cursor_default;
	let rebuilds = 0;
	let pagingArcs;

	// paging arcs and rings

	update_cursor();
	debug.log_build(` (svelte)`);
	$w_g_radial.layout_allClusters();
	function handle_mouse_state(s_mouse: S_Mouse): boolean { return true; }				// only for wrappers
	function isHit(): boolean { return w.mouse_distance_fromGraphCenter <= outer_radius; }

	$: {
		if (!!$w_ancestry_focus.thing && $w_ancestry_focus.thing.id == $w_thing_color?.split(k.generic_separator)[0]) {
			color = $w_ancestry_focus?.thing?.color ?? k.thing_color_default;
			rebuilds += 1;
		}
	}

	$: {
		// mouse up ... end all (rotation, resizing, paging)
		if (mouse_up_count != $w_count_mouse_up) {
			mouse_up_count = $w_count_mouse_up;
			if (ringZone_forMouseLocation() == T_RingZone.miss) {			// only respond if NOT isHit
				reset();
			}
		}
	}

	function update_cursor() {
		switch (ringZone_forMouseLocation()) {
			case T_RingZone.paging: cursor = g.s_cluster_rotation.cursor; break;
			case T_RingZone.resize: cursor = g.s_ring_resizing.cursor; break;
			case T_RingZone.rotate: cursor = g.s_ring_rotation.cursor; break;
			default:			   cursor = 'default'; break;
		}
	}

	function reset() {
		ux.mouse_timer_forName(name).reset();
		g.s_ring_resizing.reset();
		g.s_ring_rotation.reset();
		$w_g_active_cluster = null;
		mouse_timer.reset();
		ux.reset_paging();
		rebuilds += 1;
	}

	function ringZone_forMouseLocation(): T_RingZone {
		let ring_zone = T_RingZone.miss;
		const mouse_vector = w.mouse_vector_ofOffset_fromGraphCenter();
		if (!!mouse_vector) {
			const distance = mouse_vector.magnitude;
			const thick = k.ring_rotation_thickness;
			const inner = $w_ring_rotation_radius;
			const thin = k.paging_arc_thickness;
			const resize = inner + thick * 2;
			const rotate = inner + thick;
			const thumb = inner - thin;
			if (!!distance && distance <= resize) {
				if (distance > rotate) {
					ring_zone = T_RingZone.resize;
				} else if (distance > inner) {
					ring_zone = T_RingZone.rotate;
				} else if (distance > thumb) {
					ring_zone = T_RingZone.paging;
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
		const inRotate = ring_zone == T_RingZone.rotate && !arc_isActive && !g.s_ring_resizing.isActive;
		const inResize = ring_zone == T_RingZone.resize && !arc_isActive && !g.s_ring_rotation.isActive;
		const inPaging = ring_zone == T_RingZone.paging && !g.s_ring_rotation.isActive && !g.s_ring_resizing.isActive;
		if (g.s_cluster_rotation.isHovering != inPaging) {
			g.s_cluster_rotation.isHovering  = inPaging;
			debug.log_hover(` hover paging  ${inPaging}`);
			rebuilds += 1;
		}
		if (g.s_ring_rotation.isHovering != inRotate) {
			g.s_ring_rotation.isHovering  = inRotate;
			debug.log_hover(` hover rotate  ${inRotate}`);
			rebuilds += 1;
		}
		if (g.s_ring_resizing.isHovering != inResize) {
			g.s_ring_resizing.isHovering  = inResize;
			debug.log_hover(` hover resize  ${inResize}`);
			rebuilds += 1;
		}
	}

	$: {

		////////////////////////////////////
		// detect movement & adjust state //
		////////////////////////////////////

		const _ = $w_mouse_location_scaled;											// use store, to invoke this code
		const mouse_vector = w.mouse_vector_ofOffset_fromGraphCenter();
		if (!!mouse_vector) {
			const mouse_angle = mouse_vector.angle;
			const rotation_state = g.s_ring_rotation;
			const resizing_state = g.s_ring_resizing;

			// check if already dragging in one of the three ring zones

			if (!!resizing_state.isActive) {									// resize, check this FIRST (when both states return isActive true, rotation should be ignored)
				const smallest = k.innermost_ring_radius;
				const largest = smallest * 3;
				const magnitude = mouse_vector.magnitude - resizing_state.basis_radius;
				const distance = magnitude.force_between(smallest, largest);
				const delta = distance - $w_ring_rotation_radius;
				const radius = $w_ring_rotation_radius + delta;
				resizing_state.active_angle = mouse_angle + Angle.quarter;
				detect_hovering();
				cursor = g.s_ring_resizing.cursor;
				if (Math.abs(delta) > 1) {										// granularity of 1 pixel
					debug.log_radial(` resize  D ${distance.toFixed(0)}  R ${radius.toFixed(0)}  + ${delta.toFixed(1)}`);
					$w_ring_rotation_radius = radius;
					signals.signal_rebuildGraph_fromFocus();					// destroys this component (properties are in w_w_ring_resizing)
					rebuilds += 1;
				}
			} else if (!!rotation_state.isActive) {								// rotate clusters
				if (!signals.signal_isInFlight && !mouse_angle.isClocklyAlmost(rotation_state.active_angle, Angle.radians_from_degrees(4), Angle.full)) {		// detect >= 4° change
					$w_ring_rotation_angle = mouse_angle.add_angle_normalized(-rotation_state.basis_angle);
					debug.log_radial(` rotate ${$w_ring_rotation_angle.degrees_of(0)}`);
					rotation_state.active_angle = mouse_angle;
					detect_hovering();
					cursor = g.s_ring_rotation.cursor;
					signals.signal_relayoutAndRecreate_widgets_fromFocus();					// destroys this component (properties are in w_w_ring_rotation)
					rebuilds += 1;
				}
			} else if (!!$w_g_active_cluster) {
				const paging_rotation = $w_g_active_cluster.paging_rotation;
				const basis_angle = paging_rotation.basis_angle;
				const active_angle = paging_rotation.active_angle;
				const delta_angle = (active_angle - mouse_angle).angle_normalized_aroundZero();
				paging_rotation.active_angle = mouse_angle;
				detect_hovering();
				cursor = paging_rotation.cursor;
				if (!!basis_angle && !!active_angle && basis_angle != active_angle && $w_g_active_cluster.adjust_paging_index_byAdding_angle(delta_angle)) {
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

	function down_up_closure(s_mouse) {

		/////////////////////////////
		// setup or teardown state //
		/////////////////////////////

		if (!s_mouse.isHover) {
			if (s_mouse.isUp) {
				// debug.log_radial(`UP`);
				reset();
				rebuilds += 1;
			} else if (s_mouse.isDown) {
				// debug.log_radial(`DOWN`);
				const mouse_wentDown_angle = w.mouse_angle_fromGraphCenter;
				const rotation_angle = mouse_wentDown_angle.add_angle_normalized(-$w_ring_rotation_angle);
				switch (ringZone_forMouseLocation()) {
					case T_RingZone.rotate:
						debug.log_radial(` begin rotate  ${rotation_angle.degrees_of(0)}`);
						g.s_ring_rotation.active_angle = mouse_wentDown_angle;
						g.s_ring_rotation.basis_angle = rotation_angle;
						rebuilds += 1;
						break;
					case T_RingZone.resize:
						const radius_offset = w.mouse_distance_fromGraphCenter - $w_ring_rotation_radius;
						debug.log_radial(` begin resize  ${radius_offset.toFixed(0)}`);
						g.s_ring_rotation.active_angle = mouse_wentDown_angle + Angle.quarter;	// needed for cursor
						g.s_ring_rotation.basis_angle = rotation_angle + Angle.quarter;
						g.s_ring_resizing.basis_radius = radius_offset;
						rebuilds += 1;
						break;
					case T_RingZone.paging: 
						const paging_angle = mouse_wentDown_angle.angle_normalized();
						const g_cluster = $w_g_radial.g_cluster_forMouseLocation;
						if (!!g_cluster) {
							debug.log_radial(` begin paging  ${paging_angle.degrees_of(0)}`);
							g_cluster.paging_rotation.active_angle = paging_angle;
							g_cluster.paging_rotation.basis_angle = paging_angle;
							$w_g_active_cluster = g_cluster;
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
		{#each $w_g_radial.g_clusters as g_cluster}
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
				mouse_closure={down_up_closure}>
				<svg
					class='rings-svg'
					viewBox={viewBox}>
					<path class='resize-path' d={svgPathFor_resizingRing}
						fill={u.opacitize(color, g.s_ring_resizing.fill_opacity)}
						stroke={u.opacitize(color, g.s_ring_resizing.stroke_opacity)}/>
					{#if debug.reticle}
						<path class='reticle-path' stroke='green' fill=transparent d={svgPaths.t_cross(middle_radius * 2, -2)}/>
					{/if}
					<path class='rotate-path' d={svgPathFor_rotationRing}
						fill={u.opacitize(color, g.s_ring_rotation.fill_opacity * (g.s_ring_resizing.isHighlighted ? 0.3 : 1))}
						stroke={u.opacitize(color, g.s_ring_rotation.stroke_opacity * (g.s_ring_resizing.isHighlighted ? 0.7 : 1))}/>
				</svg>
			</Mouse_Responder>
		</div>
	{/if}
{/key}
