<script lang='ts'>
	import { k, ux, w, Thing, Point, Angle, debug, colors, signals, svgPaths, databases } from '../../ts/common/Global_Imports';
	import { w_color_trigger, w_ancestry_focus, w_s_title_edit } from '../../ts/common/Stores';
	import { w_ring_rotation_angle, w_ring_rotation_radius } from '../../ts/common/Stores';
	import { w_graph_rect, w_mouse_location_scaled } from '../../ts/common/Stores';
	import { w_count_mouse_up, w_g_active_cluster } from '../../ts/common/Stores';
	import { T_Layer, T_RingZone } from '../../ts/common/Global_Imports';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import Identifiable from '../../ts/data/runtime/Identifiable';
	import Radial_ArcSlider from './Radial_ArcSlider.svelte';
	import { onMount } from 'svelte';
	const name = 'rings';
	const ring_width = k.ring_rotation_thickness;
	const middle_radius = $w_ring_rotation_radius + k.ring_rotation_thickness;
	const middle_diameter = middle_radius * 2;
	const outer_radius = middle_radius + ring_width;
	const outer_diameter = outer_radius * 2;
	const mouse_timer = ux.mouse_timer_forName(name);	// persist across destroy/recreate
	const viewBox = `${-ring_width}, ${-ring_width}, ${outer_diameter}, ${outer_diameter}`;
	let color = $w_ancestry_focus?.thing?.color ?? k.thing_color_default;
	let mouse_up_count = $w_count_mouse_up;
	let cursor = k.cursor_default;
	let rings_rebuilds = 0;
	let rotationPath;
	let resizingPath;
	let reticlePath;
	let pagingArcs;
	let time = 0;
	
	// paging arcs and rings
	
	class Path { d: string; stroke: string; fill: string; };
	function handle_mouse_state(s_mouse: S_Mouse): boolean { return true; }				// only for wrappers
	function handle_isHit(): boolean { return w.mouse_distance_fromGraphCenter <= outer_radius; }
	
	debug.log_build(`RINGS`);
		
	onMount(() => {
		update_svgs();
		update_cursor();
	});

	$: {
		if (!!$w_ancestry_focus.thing && $w_ancestry_focus.thing.id == $w_color_trigger?.split(k.generic_separator)[0]) {
			color = $w_ancestry_focus?.thing?.color ?? k.thing_color_default;
		}
	}

	$: {
		if (mouse_up_count != $w_count_mouse_up) {
			mouse_up_count = $w_count_mouse_up;
			reset_ux();			// mouse up ... end all (rotation, resizing, paging)
		}
	}

	function update_cursor() {
		switch (ux.ring_zone_atMouseLocation) {
			case T_RingZone.paging: cursor = ux.s_cluster_rotation.cursor; break;
			case T_RingZone.resize: cursor = ux.s_ring_resizing.cursor; break;
			case T_RingZone.rotate: cursor = ux.s_ring_rotation.cursor; break;
			default:				cursor = 'default'; break;
		}
	}

	function reset_ux() {
		debug.log_radial(` STOP`);
		ux.mouse_timer_forName(name).reset();
		ux.s_ring_resizing.reset();
		ux.s_ring_rotation.reset();
		$w_g_active_cluster = null;
		cursor = 'default';
		mouse_timer.reset();
		ux.reset_paging();
	}

	function update_svgs() {
		const center = Point.square($w_ring_rotation_radius);
		if (!!reticlePath) {
			reticlePath. setAttribute('stroke', 'green');
			reticlePath. setAttribute('fill', 'transparent');
			reticlePath. setAttribute('d', svgPaths.t_cross(middle_radius * 2, -2));
		}
		if (!!resizingPath) {
			resizingPath.setAttribute('fill', colors.opacitize(color, ux.s_ring_resizing.fill_opacity));
			resizingPath.setAttribute('stroke', colors.opacitize(color, ux.s_ring_resizing.stroke_opacity));
			resizingPath.setAttribute('d', svgPaths.circle(center.offsetEquallyBy(44), $w_ring_rotation_radius, true));
		}
		if (!!rotationPath) {
			rotationPath.setAttribute('fill', colors.opacitize(color, ux.s_ring_rotation.fill_opacity * (ux.s_ring_resizing.isActive ? 0 : 1)));
			rotationPath.setAttribute('stroke', colors.opacitize(color, ux.s_ring_rotation.stroke_opacity * (ux.s_ring_resizing.isActive ? 0 : 1)));
			rotationPath.setAttribute('d', svgPaths.annulus(center, middle_radius, ring_width, Point.square(ring_width)));
		}
	}

	function detect_hovering() {
		let needs_toUpdate_svgs = false;
		const ring_zone = ux.ring_zone_atMouseLocation;
		const arc_isActive = ux.isAny_paging_arc_active;
		const inRotate = ring_zone == T_RingZone.rotate && !arc_isActive && !ux.s_ring_resizing.isActive;
		const inResize = ring_zone == T_RingZone.resize && !arc_isActive && !ux.s_ring_rotation.isActive;
		const inPaging = ring_zone == T_RingZone.paging && !ux.s_ring_rotation.isActive && !ux.s_ring_resizing.isActive;
		if (ux.s_cluster_rotation.isHovering != inPaging) {
			ux.s_cluster_rotation.isHovering  = inPaging;
			debug.log_hover(` hover paging  ${inPaging}`);
			needs_toUpdate_svgs = true;
		}
		if (ux.s_ring_rotation.isHovering != inRotate) {
			ux.s_ring_rotation.isHovering  = inRotate;
			debug.log_hover(` hover rotate  ${inRotate}`);
			needs_toUpdate_svgs = true;
		}
		if (ux.s_ring_resizing.isHovering != inResize) {
			ux.s_ring_resizing.isHovering  = inResize;
			debug.log_hover(` hover resize  ${inResize}`);
			needs_toUpdate_svgs = true;
		}
		if (needs_toUpdate_svgs) {
			update_svgs();
		}
	}

	$: {

		////////////////////////////////////
		// detect movement & adjust state //
		////////////////////////////////////

		const _ = $w_mouse_location_scaled;
		const mouse_vector = w.mouse_vector_ofOffset_fromGraphCenter();
		if (!!mouse_vector) {
			const now = new Date().getTime();
			const mouse_angle = mouse_vector.angle;
			const rotation_state = ux.s_ring_rotation;
			const resizing_state = ux.s_ring_resizing;
			const enoughTimeHasPassed = (now - time) > 50;

			// check if one of the three ring zones is active (already dragging)

			if (resizing_state.isActive) {										// resize, check this FIRST (when both states return isActive true, rotation should be ignored)
				const smallest = k.innermost_ring_radius;
				const largest = smallest * 3;
				const magnitude = mouse_vector.magnitude - resizing_state.basis_radius;
				const distance = magnitude.force_between(smallest, largest);
				const delta = distance - $w_ring_rotation_radius;
				const radius = $w_ring_rotation_radius + delta;
				resizing_state.active_angle = mouse_angle + Angle.quarter;
				detect_hovering();
				cursor = ux.s_ring_resizing.cursor;
				if (Math.abs(delta) > 1 && enoughTimeHasPassed) {				// granularity of 1 pixel & 1 tenth second
					time = now;
					debug.log_radial(` resize  D ${distance.asInt()}  R ${radius.asInt()}  + ${delta.toFixed(1)}`);
					$w_ring_rotation_radius = radius;
					ux.grand_build();					// destroys this component (properties are in w_w_ring_resizing)
				}
			} else if (rotation_state.isActive) {								// rotate clusters
				if (!signals.signal_isInFlight && enoughTimeHasPassed) {		// 1 tenth second
					time = now;
					$w_ring_rotation_angle = mouse_angle.add_angle_normalized(-rotation_state.basis_angle);
					debug.log_radial(` rotate ${$w_ring_rotation_angle.asDegrees()}`);
					rotation_state.active_angle = mouse_angle;
					detect_hovering();
					cursor = ux.s_ring_rotation.cursor;
					ux.grand_layout();											// to reposition necklace widgets
					setTimeout(() => {
						rings_rebuilds += 1;									// for arc sliders
					}, 1)
				}
			} else if (!!$w_g_active_cluster) {
				const s_paging_rotation = $w_g_active_cluster.s_paging_rotation;
				const basis_angle = s_paging_rotation.basis_angle;
				const active_angle = s_paging_rotation.active_angle;
				const delta_angle = (active_angle - mouse_angle).angle_normalized_aroundZero();
				s_paging_rotation.active_angle = mouse_angle;
				detect_hovering();
				cursor = s_paging_rotation.cursor;
				debug.log_radial(` page  ${delta_angle.asDegrees()}`);
				if (!!basis_angle && !!active_angle && basis_angle != active_angle && $w_g_active_cluster.adjust_paging_index_byAdding_angle(delta_angle)) {
					ux.grand_build();
				}
			} else {				// not dragging
				detect_hovering();
				update_cursor();
			}
		}
	}

	function down_up_closure(s_mouse) {

		/////////////////////////////
		// setup or teardown state //
		/////////////////////////////

		if (!s_mouse.isHover) {
			if (s_mouse.isUp) {
				reset_ux();
			} else if (s_mouse.isDown) {
				const angle_ofMouseDown = w.mouse_angle_fromGraphCenter;
				const angle_ofRotation = angle_ofMouseDown.add_angle_normalized(-$w_ring_rotation_angle);
				const zone = ux.ring_zone_atMouseLocation;
				$w_s_title_edit?.stop_editing();
				switch (zone) {
					case T_RingZone.rotate:
						debug.log_radial(` begin rotate  ${angle_ofRotation.asDegrees()}`);
						ux.s_ring_rotation.active_angle = angle_ofMouseDown;
						ux.s_ring_rotation.basis_angle = angle_ofRotation;
						break;
					case T_RingZone.resize:
						const change_ofRadius = w.mouse_distance_fromGraphCenter - $w_ring_rotation_radius;
						debug.log_radial(` begin resize  ${change_ofRadius.asInt()}`);
						ux.s_ring_rotation.active_angle = angle_ofMouseDown + Angle.quarter;	// needed for cursor
						ux.s_ring_rotation.basis_angle = angle_ofRotation + Angle.quarter;		// "
						ux.s_ring_resizing.basis_radius = change_ofRadius;
						break;
					case T_RingZone.paging: 
						const angle_ofPage = angle_ofMouseDown.angle_normalized();
						const g_cluster = ux.g_radialGraph.g_cluster_atMouseLocation;
						if (!!g_cluster) {
							debug.log_radial(` begin paging  ${angle_ofPage.asDegrees()}`);
							g_cluster.s_paging_rotation.active_angle = angle_ofPage;
							g_cluster.s_paging_rotation.basis_angle = angle_ofPage;
							$w_g_active_cluster = g_cluster;
						}
						break;
				}
			}
		}
		detect_hovering();
		update_cursor();
	}

</script>

{#key rings_rebuilds}
	{#if !debug.hide_rings}
		<div class = 'rings'
			style = 'z-index:{T_Layer.rings};'>
			<Mouse_Responder name = 'rings'
				cursor = {cursor}
				width = {outer_diameter}
				height = {outer_diameter}
				zindex = {T_Layer.rings}
				handle_isHit = {handle_isHit}
				center = {w.center_ofGraphSize}
				handle_mouse_state = {down_up_closure}>
				<svg class = 'rings-svg'
					viewBox = {viewBox}>
					<path class = 'resize-path'
						stroke-width = 0.50
						bind:this = {resizingPath}/>
					{#if debug.reticle}
						<path class = 'reticle-path'
							bind:this = {reticlePath}/>
					{/if}
					<path class = 'rotate-path'
						stroke-width = 0.5
						bind:this = {rotationPath}/>
				</svg>
			</Mouse_Responder>
		</div>
	{/if}
	<div
		class = 'paging-arcs'
		bind:this = {pagingArcs}
		style = 'z-index:{T_Layer.paging};'>
		{#each ux.g_radialGraph.g_clusters as g_cluster}
			{#if !!g_cluster && (g_cluster.widgets_shown > 0)}
				<Radial_ArcSlider
					color = {color}
					g_cluster = {g_cluster}/>
			{/if}
		{/each}
	</div>
{/key}
