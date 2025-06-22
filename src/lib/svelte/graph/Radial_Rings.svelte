<script lang='ts'>
	import { k, u, ux, w, busy, Thing, Point, Angle, debug, colors } from '../../ts/common/Global_Imports';
	import { layout, radial, signals, svgPaths, databases } from '../../ts/common/Global_Imports';
	import { w_count_mouse_up, w_s_text_edit, w_g_paging_cluster } from '../../ts/common/Stores';
	import { w_thing_color, w_background_color, w_ancestry_focus } from '../../ts/common/Stores';
	import { w_ring_rotation_angle, w_ring_rotation_radius } from '../../ts/common/Stores';
	import { w_graph_rect, w_mouse_location_scaled } from '../../ts/common/Stores';
	import { T_Layer, T_RingZone } from '../../ts/common/Global_Imports';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import Radial_ArcSlider from './Radial_ArcSlider.svelte';
	import { onMount } from 'svelte';
	const ring_width = k.thickness.rotation_ring;
	const name = 'rings';
	const mouse_timer = ux.mouse_timer_forName(name);	// persist across destroy/recreate
	let color = $w_ancestry_focus?.thing?.color ?? colors.default_forThings;
	let mouse_up_count = $w_count_mouse_up;
	let cursor = k.cursor_default;
	let ring_reattachments = 0;
	let last_action = 0;

	$: middle_radius   = $w_ring_rotation_radius + k.thickness.rotation_ring;
	$: outer_radius	   = middle_radius + ring_width;
	$: outer_diameter  = outer_radius * 2;
	$: viewBox		   = `${-ring_width}, ${-ring_width}, ${outer_diameter}, ${outer_diameter}`;
	$: reticle_svgPath = debug.reticle ? svgPaths.t_cross(outer_diameter, -2) : '';
	$: resize_svgPath  = svgPaths.circle(Point.square($w_ring_rotation_radius).offsetEquallyBy(44), $w_ring_rotation_radius - 0.3, true);
	$: rotate_svgPath  = svgPaths.annulus(Point.square($w_ring_rotation_radius), middle_radius, ring_width, Point.square(ring_width));
	$: resize_fill	   = (radial.s_ring_resizing.isHighlighted || radial.s_ring_resizing.isActive) ? colors.opacitize(color, radial.s_ring_resizing.fill_opacity) : 'transparent';
	$: rotate_fill	   = (radial.s_ring_rotation.isHighlighted && !radial.s_ring_rotation.isActive) ? colors.opacitize(color, radial.s_ring_rotation.fill_opacity * (radial.s_ring_resizing.isActive ? 0 : 1)) : 'transparent';
	
	onMount(() => {
		cursor = radial.cursor_forRingZone;
		const handle_reposition = signals.handle_reposition_widgets(2, (received_ancestry) => {
			ring_reattachments += 1;
		});
		return () => { handle_reposition.disconnect(); };
	});
		
	$: {
		if (!!$w_ancestry_focus.thing && $w_ancestry_focus.thing.id == $w_thing_color?.split(k.separator.generic)[0]) {
			color = $w_ancestry_focus?.thing?.color ?? colors.default_forThings;
		}
	}

	$: {
		if (mouse_up_count != $w_count_mouse_up) {
			mouse_up_count = $w_count_mouse_up;
			s_reset();			// mouse up ... end all (rotation, resizing, paging)
		}
	}

	function handle_s_mouse(s_mouse: S_Mouse): boolean { return true; }				// only for wrappers

	function handle_isHit(): boolean {
		const zone = radial.ring_zone_atMouseLocation;
		return [T_RingZone.resize, T_RingZone.rotate].includes(zone);
	}

	function s_reset() {
		ux.mouse_timer_forName(name).reset();
		$w_g_paging_cluster = null;
		mouse_timer.reset();
		cursor = 'default';
		radial.reset();
	}

	function detect_hovering() {
		const isPaging = radial.isAny_paging_arc_active;
		const isResizing = radial.s_ring_resizing.isActive;
		const isRotating = radial.s_ring_rotation.isActive;
		const ring_zone = radial.ring_zone_atMouseLocation;
		const inRotate = ring_zone == T_RingZone.rotate && !isPaging && !isResizing;
		const inResize = ring_zone == T_RingZone.resize && !isPaging && !isRotating;
		const inPaging = ring_zone == T_RingZone.paging && !isRotating && !isResizing;
		if (radial.s_ring_rotation.isHovering != inRotate) {
			radial.s_ring_rotation.isHovering  = inRotate;
			debug.log_hover(` hover rotate  ${inRotate}`);
		}
		if (radial.s_ring_resizing.isHovering != inResize) {
			radial.s_ring_resizing.isHovering  = inResize;
			debug.log_hover(` hover resize  ${inResize}`);
		}
		if (radial.s_cluster_rotation.isHovering != inPaging) {
			radial.s_cluster_rotation.isHovering  = inPaging;
			debug.log_hover(` hover paging  ${inPaging}`);
		}
	}

	$: {

		////////////////////////////////////
		// detect movement & adjust state //
		////////////////////////////////////

		const _ = $w_mouse_location_scaled;
		const mouse_vector = layout.mouse_vector_ofOffset_fromGraphCenter();
		if (!!mouse_vector) {
			const now = new Date().getTime();
			const mouse_angle = mouse_vector.angle;
			const rotation_state = radial.s_ring_rotation;
			const resizing_state = radial.s_ring_resizing;
			function enoughTimeHasPassed(duration: number) { return (now - last_action) > duration; }		// must not overload DOM refresh

			// check if one of the three ring zones is active (already dragging)

			if (resizing_state.isActive) {										// resize, check this FIRST (when both states return isActive true, rotation should be ignored)
				const smallest = k.radius.ring_center;
				const largest = smallest * 3;
				const magnitude = mouse_vector.magnitude - resizing_state.basis_radius;
				const distance = magnitude.force_between(smallest, largest);
				const delta = distance - $w_ring_rotation_radius;
				const radius = $w_ring_rotation_radius + delta;
				resizing_state.active_angle = mouse_angle + Angle.quarter;
				detect_hovering();
				cursor = radial.s_ring_resizing.cursor;
				if (Math.abs(delta) > 1 && enoughTimeHasPassed(500)) {				// granularity of 1 pixel & 1 tenth second
					last_action = now;
					debug.log_radial(` resize  D ${distance.asInt()}  R ${radius.asInt()}  + ${delta.toFixed(1)}`);
					$w_ring_rotation_radius = radius;
					layout.grand_layout();
				}
			} else if (rotation_state.isActive) {								// rotate clusters
				if (!busy.anySignal_isInFlight && enoughTimeHasPassed(75)) {		// 1 tenth second
					last_action = now;
					$w_ring_rotation_angle = mouse_angle.add_angle_normalized(-rotation_state.basis_angle);
					debug.log_radial(` rotate ${$w_ring_rotation_angle.asDegrees()}`);
					rotation_state.active_angle = mouse_angle;
					detect_hovering();
					cursor = radial.s_ring_rotation.cursor;
					layout.grand_layout();										// reposition necklace widgets and arc sliders
				}
			} else if (!!$w_g_paging_cluster) {
				const g_paging_rotation = $w_g_paging_cluster.g_paging_rotation;
				const basis_angle = g_paging_rotation.basis_angle;
				const active_angle = g_paging_rotation.active_angle;
				const delta_angle = (active_angle - mouse_angle).angle_normalized_aroundZero();
				g_paging_rotation.active_angle = mouse_angle;
				detect_hovering();
				cursor = g_paging_rotation.cursor;
				debug.log_radial(` page  ${delta_angle.asDegrees()}`);
				if (!!basis_angle && !!active_angle && basis_angle != active_angle && $w_g_paging_cluster.adjust_paging_index_byAdding_angle(delta_angle)) {
					layout.grand_build();
				}
			} else {				// not dragging
				detect_hovering();
				cursor = radial.cursor_forRingZone;
			}
		}
	}

	function up_down_closure(s_mouse) {

		/////////////////////////////
		// setup or teardown state //
		/////////////////////////////

		if (!s_mouse.isHover) {
			if (s_mouse.isUp) {
				s_reset();
			} else if (s_mouse.isDown) {
				const angle_ofMouseDown = layout.mouse_angle_fromGraphCenter;
				const angle_ofRotation = angle_ofMouseDown.add_angle_normalized(-$w_ring_rotation_angle);
				const zone = radial.ring_zone_atMouseLocation;
				$w_s_text_edit?.stop_editing();
				$w_s_text_edit = null;		// so widget will react
				switch (zone) {
					case T_RingZone.rotate:
						debug.log_radial(` begin rotate  ${angle_ofRotation.asDegrees()}`);
						radial.s_ring_rotation.active_angle = angle_ofMouseDown;
						radial.s_ring_rotation.basis_angle = angle_ofRotation;
						break;
					case T_RingZone.resize:
						const change_ofRadius = layout.mouse_distance_fromGraphCenter - $w_ring_rotation_radius;
						debug.log_radial(` begin resize  ${change_ofRadius.asInt()}`);
						radial.s_ring_rotation.active_angle = angle_ofMouseDown + Angle.quarter;	// needed for cursor
						radial.s_ring_rotation.basis_angle = angle_ofRotation + Angle.quarter;		// "
						radial.s_ring_resizing.basis_radius = change_ofRadius;
						break;
					case T_RingZone.paging: 
						const angle_ofPage = angle_ofMouseDown.angle_normalized();
						const g_cluster = layout.g_radialGraph.g_cluster_atMouseLocation;
						if (!!g_cluster) {
							debug.log_radial(` begin paging  ${angle_ofPage.asDegrees()}`);
							g_cluster.g_paging_rotation.active_angle = angle_ofPage;
							g_cluster.g_paging_rotation.basis_angle = angle_ofPage;
							$w_g_paging_cluster = g_cluster;
						}
						break;
				}
			}
		}
		detect_hovering();
		cursor = radial.cursor_forRingZone;
	}

</script>

{#key ring_reattachments}
	{#if !debug.hide_rings}
		<div class = 'rings'
			style = 'z-index:{T_Layer.rings};'>
			<Mouse_Responder name = 'rings'
				cursor = {cursor}
				width = {outer_diameter}
				height = {outer_diameter}
				zindex = {T_Layer.rings}
				handle_isHit = {handle_isHit}
				center = {layout.center_ofGraphSize}
				handle_s_mouse = {up_down_closure}>
				<svg class = 'rings-svg'
					viewBox = {viewBox}>
					<path class = 'resize-path'
						fill = {resize_fill}
						d = {resize_svgPath}/>
					{#if debug.reticle}
						<path class = 'reticle-path'
							stroke = 'green'
							fill = 'transparent'
							d = {reticle_svgPath}/>
					{/if}
					<path class = 'rotate-path'
						fill = {rotate_fill}
						d = {rotate_svgPath}/>
				</svg>
			</Mouse_Responder>
		</div>
	{/if}
	<div
		class = 'paging-arcs'
		style = 'z-index:{T_Layer.paging};'>
		{#each layout.g_radialGraph.g_clusters as g_cluster}
			{#if !!g_cluster && (g_cluster.widgets_shown > 0)}
				<Radial_ArcSlider
					color = {color}
					g_cluster = {g_cluster}/>
			{/if}
		{/each}
	</div>
{/key}
