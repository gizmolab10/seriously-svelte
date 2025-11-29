<script lang='ts'>
	import { e, k, s, x, hits, busy, debug, colors, radial, layout, signals, svgPaths } from '../../ts/common/Global_Imports';
	import { T_Layer, T_Radial_Zone, T_Hit_Target, S_Component } from '../../ts/common/Global_Imports';
	import { Thing, Point, Angle, g_radial, databases } from '../../ts/common/Global_Imports';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import Radial_Cluster from './Radial_Cluster.svelte';
	import { onMount } from 'svelte';
	const name = 'rings';
	const { w_thing_color } = colors;
	const ring_width = k.thickness.radial.ring;
	const mouse_timer = e.mouse_timer_forName(name);
	const { w_count_mouse_up, w_s_title_edit, w_ancestry_focus } = s;
	const { w_g_paging_cluster, w_radial_ring_angle, w_radial_ring_radius } = radial;
	let color = $w_ancestry_focus?.thing?.color ?? colors.default_forThings;
	let mouse_up_count = $w_count_mouse_up;
	let cursor = k.cursor_default;
	let s_component: S_Component;
	let reattachments = 0;
	let last_action = 0;

	$: middle_radius   = $w_radial_ring_radius + k.thickness.radial.ring;
	$: outer_radius	   = middle_radius + ring_width;
	$: outer_diameter  = outer_radius * 2;
	$: viewBox		   = `${-ring_width}, ${-ring_width}, ${outer_diameter}, ${outer_diameter}`;
	$: reticle_svgPath = debug.reticle ? svgPaths.t_cross(outer_diameter, -2) : '';
	$: resize_svgPath  = svgPaths.circle(Point.square($w_radial_ring_radius).offsetEquallyBy(44), $w_radial_ring_radius - 0.3, true);
	$: rotate_svgPath  = svgPaths.annulus(Point.square($w_radial_ring_radius), middle_radius, ring_width, Point.square(ring_width));
	$: resize_fill	   = (radial.s_ring_resizing.isHighlighted || radial.s_ring_resizing.isActive) ? colors.opacitize(color, radial.s_ring_resizing.fill_opacity) : 'transparent';
	$: rotate_fill	   = (radial.s_radial_ring.isHighlighted && !radial.s_radial_ring.isActive) ? colors.opacitize(color, radial.s_radial_ring.fill_opacity * (radial.s_ring_resizing.isActive ? 0 : 1)) : 'transparent';
	$: is_dragging	   = radial.s_radial_ring.isActive || radial.s_ring_resizing.isActive || !!$w_g_paging_cluster;

	s_component = signals.handle_reposition_widgets_atPriority(2, null, T_Hit_Target.rings, (received_ancestry) => {
		reattachments += 1;
	});

	onMount(() => {
		cursor = radial.cursor_forRingZone;
		return () => s_component.disconnect();
	});
		
	$: {
		const thing = $w_ancestry_focus?.thing;	
		if (!!thing && thing.id == $w_thing_color?.split(k.separator.generic)[0]) {
			color = thing.color ?? colors.default_forThings;
		}
	}

	$: {
		if (mouse_up_count != $w_count_mouse_up) {
			mouse_up_count = $w_count_mouse_up;
			s_reset();			// mouse up ... end all (rotation, resizing, paging)
		}
	}

	function s_reset() {
		e.mouse_timer_forName(name).reset();
		$w_g_paging_cluster = null;
		mouse_timer.reset();
		cursor = 'default';
		radial.reset();
	}

	function detect_hovering() {
		const isPaging = radial.isAny_paging_arc_active;
		const isResizing = radial.s_ring_resizing.isActive;
		const isRotating = radial.s_radial_ring.isActive;
		const ring_zone = radial.ring_zone_atMouseLocation;
		const inRotate = ring_zone == T_Radial_Zone.rotate && !isPaging && !isResizing;
		const inResize = ring_zone == T_Radial_Zone.resize && !isPaging && !isRotating;
		const inPaging = ring_zone == T_Radial_Zone.paging && !isRotating && !isResizing;
		if (radial.s_radial_ring.isHovering != inRotate) {
			radial.s_radial_ring.isHovering  = inRotate;
			debug.log_hits(` hover rotate  ${inRotate}`);
		}
		if (radial.s_ring_resizing.isHovering != inResize) {
			radial.s_ring_resizing.isHovering  = inResize;
			debug.log_hits(` hover resize  ${inResize}`);
		}
		if (radial.s_cluster_rotation.isHovering != inPaging) {
			radial.s_cluster_rotation.isHovering  = inPaging;
			debug.log_hits(` hover paging  ${inPaging}`);
		}
	}
	
	function detect_movement() {
		const mouse_vector = layout.mouse_vector_ofOffset_fromGraphCenter();
		if (!!mouse_vector) {
			const now = new Date().getTime();
			const mouse_angle = mouse_vector.angle;
			const rotation_state = radial.s_radial_ring;
			const resizing_state = radial.s_ring_resizing;
			function enoughTimeHasPassed(duration: number) { return (now - last_action) > duration; }		// must not overload DOM refresh
			if (is_dragging) {
				window.getSelection()?.removeAllRanges();		// Prevent text selection during dragging
			}

			// check if one of the three ring zones is active (already dragging)

			if (resizing_state.isActive) {										// resize, check this FIRST (when both states return isActive true, rotation should be ignored)
				const smallest = k.radius.ring_minimum;
				const largest = smallest * 3;
				const magnitude = mouse_vector.magnitude - resizing_state.basis_radius;
				const distance = magnitude.force_between(smallest, largest);
				const delta = distance - $w_radial_ring_radius;
				const radius = $w_radial_ring_radius + delta;
				resizing_state.active_angle = mouse_angle + Angle.quarter;
				detect_hovering();
				cursor = radial.s_ring_resizing.cursor;
				if (Math.abs(delta) > 1 && enoughTimeHasPassed(500)) {				// granularity of 1 pixel & 1 tenth second
					last_action = now;
					debug.log_radial(` resize  D ${distance.asInt()}  R ${radius.asInt()}  + ${delta.toFixed(1)}`);
					$w_radial_ring_radius = radius;
					layout.grand_layout();
				}
			} else if (rotation_state.isActive) {								// rotate clusters
				if (!signals.anySignal_isInFlight && enoughTimeHasPassed(75)) {		// 1 tenth second
					last_action = now;
					$w_radial_ring_angle = mouse_angle.add_angle_normalized(-rotation_state.basis_angle);
					debug.log_radial(` rotate ${$w_radial_ring_angle.asDegrees()}`);
					rotation_state.active_angle = mouse_angle;
					detect_hovering();
					cursor = radial.s_radial_ring.cursor;
					layout.grand_layout();										// reposition necklace widgets and arc sliders
				}
			} else if (!!$w_g_paging_cluster) {
				const s_paging_rotation = $w_g_paging_cluster.s_paging_rotation;
				const basis_angle = s_paging_rotation.basis_angle;
				const active_angle = s_paging_rotation.active_angle;
				const delta_angle = (active_angle - mouse_angle).angle_normalized_aroundZero();
				s_paging_rotation.active_angle = mouse_angle;
				detect_hovering();
				cursor = s_paging_rotation.cursor;
				debug.log_radial(` page  ${delta_angle.asDegrees()}`);
				if (!!basis_angle && !!active_angle && basis_angle != active_angle && $w_g_paging_cluster.adjust_paging_index_byAdding_angle(delta_angle)) {
					layout.grand_layout();
				}
			} else {				// not dragging
				detect_hovering();
				cursor = radial.cursor_forRingZone;
			}
		}
	}

	function handle_s_mouse(s_mouse) {

		/////////////////////////////
		// setup or teardown state //
		/////////////////////////////

		if (s_mouse.isUp) {
			s_reset();
		} else if (s_mouse.isDown) {
			const angle_ofMouseDown = layout.mouse_angle_fromGraphCenter;
			const angle_ofRotation = angle_ofMouseDown.add_angle_normalized(-$w_radial_ring_angle);
			const zone = radial.ring_zone_atMouseLocation;
			$w_s_title_edit?.stop_editing();
			$w_s_title_edit = null;		// so widget will react
			switch (zone) {
				case T_Radial_Zone.rotate:
					debug.log_radial(` begin rotate  ${angle_ofRotation.asDegrees()}`);
					radial.s_radial_ring.active_angle = angle_ofMouseDown;
					radial.s_radial_ring.basis_angle = angle_ofRotation;
					break;
				case T_Radial_Zone.resize:
					const change_ofRadius = layout.mouse_distance_fromGraphCenter - $w_radial_ring_radius;
					debug.log_radial(` begin resize  ${change_ofRadius.asInt()}`);
					radial.s_radial_ring.active_angle = angle_ofMouseDown + Angle.quarter;	// needed for cursor
					radial.s_radial_ring.basis_angle = angle_ofRotation + Angle.quarter;		// "
					radial.s_ring_resizing.basis_radius = change_ofRadius;
					break;
				case T_Radial_Zone.paging: 
					const angle_ofPage = angle_ofMouseDown.angle_normalized();
					const g_cluster = g_radial.g_cluster_atMouseLocation;
					if (!!g_cluster) {
						debug.log_radial(` begin paging  ${angle_ofPage.asDegrees()}`);
						g_cluster.s_paging_rotation.active_angle = angle_ofPage;
						g_cluster.s_paging_rotation.basis_angle = angle_ofPage;
						$w_g_paging_cluster = g_cluster;
					}
					break;
			}
		}
		detect_hovering();
		cursor = radial.cursor_forRingZone;
	}

</script>

{#key reattachments}
	{#if !debug.hide_rings}
		<div class = 'rings'
			id = {s_component.id}
			on:mousemove={detect_movement}
			style = 'z-index:{T_Layer.radial}; user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;'>
			<Mouse_Responder name = 'rings'
				cursor = {cursor}
				width = {outer_diameter}
				height = {outer_diameter}
				zindex = {T_Layer.radial}
				handle_s_mouse = {handle_s_mouse}
				center = {layout.center_ofGraphView}>
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
	<div class = 'paging-arcs'
		style = '
			z-index:{T_Layer.paging};
			background-color: transparent;'>
		{#each g_radial.g_clusters as g_cluster}
			{#if !!g_cluster && (g_cluster.widgets_shown > 0)}
				<Radial_Cluster
					color = {color}
					g_cluster = {g_cluster}/>
			{/if}
		{/each}
	</div>
{/key}
