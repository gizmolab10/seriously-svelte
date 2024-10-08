<script lang='ts'>
	import { g, k, u, ux, w, Thing, Point, Angle, debug, ZIndex, onMount, signals } from '../../ts/common/Global_Imports';
	import { s_rotation_ring_angle, s_ring_rotation_radius, s_ring_paging_state } from '../../ts/state/Reactive_State';
	import { s_focus_ancestry, s_clusters_geometry, s_active_cluster_map } from '../../ts/state/Reactive_State';
	import { s_graphRect, s_color_thing, s_mouse_location } from '../../ts/state/Reactive_State';
	import { Ring_Zone, svgPaths, dbDispatch, opacitize } from '../../ts/common/Global_Imports';
	import { s_mouse_up_count, s_user_graphOffset } from '../../ts/state/Reactive_State';
	import Mouse_Responder from '../mouse buttons/Mouse_Responder.svelte';
	import Identifiable from '../../ts/basis/Identifiable';
	import Paging_Arc from './Paging_Arc.svelte';
	export let zindex = ZIndex.backmost;
	export let cursor_closure = () => {};
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
	let color = $s_focus_ancestry?.thing?.color ?? k.color_default;
	let mouse_up_count = $s_mouse_up_count;
	let rebuilds = 0;
	let pagingArcs;

	// debug.log_build(` RINGS (svelte)`);
	$s_clusters_geometry.layoutAll_clusters();

	$: {
		if (!!$s_focus_ancestry.thing && $s_focus_ancestry.thing.id == $s_color_thing?.split(k.generic_separator)[0]) {
			color = $s_focus_ancestry?.thing?.color ?? k.color_default;
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

	$: {

		////////////////////////////////////
		// detect movement & adjust state //
		////////////////////////////////////

		const _ = $s_mouse_location;											// use store, to invoke this code
		const from_center = u.vector_ofOffset_fromGraphCenter_toMouseLocation(g.graph_center);
		if (!!from_center) {
			const mouse_angle = from_center.angle;
			const rotation_state = g.ring_rotation_state;
			detect_hovering();
			if (!!rotation_state.active_angle || rotation_state.active_angle == 0) {		// rotate clusters
				if (!signals.signal_isInFlight && !mouse_angle.isClocklyAlmost(rotation_state.active_angle, Angle.radians_from_degrees(4), Angle.full)) {		// detect >= 4° change
					$s_rotation_ring_angle = mouse_angle.add_angle_normalized(-rotation_state.basis_angle);
					debug.log_action(` rotate ${$s_rotation_ring_angle.degrees_of(0)} RINGS`);
					rotation_state.active_angle = mouse_angle;
					signals.signal_relayoutWidgets_fromFocus();					// destroys this component (properties are in s_ring_rotation_state)
					cursor_closure();
					rebuilds += 1;
				}
			} else if (!!$s_active_cluster_map) {
				const paging_rotation = $s_active_cluster_map.paging_rotation;
				const basis_angle = paging_rotation.basis_angle;
				const active_angle = paging_rotation.active_angle;
				const delta_angle = (active_angle - mouse_angle).angle_normalized_aroundZero();
				paging_rotation.active_angle = mouse_angle;
				if (!!basis_angle && !!active_angle && basis_angle != active_angle && $s_active_cluster_map.adjust_paging_index_byAdding_angle(delta_angle)) {
					debug.log_action(` page  ${delta_angle.degrees_of(0)} RINGS`);
					signals.signal_rebuildGraph_fromFocus();
				}
			} else if (!!g.ring_resizing_state.basis_radius) {					// resize
				const smallest = k.smallest_radius;
				const largest = k.smallest_radius * 3;
				const magnitude = from_center.magnitude - g.ring_resizing_state.basis_radius;
				const distance = magnitude.force_between(smallest, largest);
				const delta = distance - $s_ring_rotation_radius;
				const radius = $s_ring_rotation_radius + delta;
				// if (Math.abs(delta) > 1 && radius >= smallest) {				// granularity of 1 pixel
				if (Math.abs(delta) > 1) {										// granularity of 1 pixel
					debug.log_action(` resize  D ${distance.toFixed(0)}  R ${radius.toFixed(0)}  + ${delta.toFixed(1)} RINGS`);
					$s_ring_rotation_radius = radius;
					signals.signal_rebuildGraph_fromFocus();					// destroys this component (properties are in s_ring_resizing_state)
				}
			}
		}
	}

	function up_down_closure(mouse_state) {

		/////////////////////////////
		// setup or teardown state //
		/////////////////////////////

		if (!mouse_state.isHover) {
			const mouse_wentDown_angle = u.angle_fromCenter;
			const ring_zone = u.ringZone_forMouseLocation;
			let needsRebuild = false;
			if (mouse_state.isUp) {
				reset();
			} else if (mouse_state.isDown) {
				switch (ring_zone) {
					case Ring_Zone.resize:
						const radius_offset = u.distance_fromCenter - $s_ring_rotation_radius;
						debug.log_action(` begin resize  ${radius_offset.toFixed(0)} RINGS`);
						g.ring_resizing_state.basis_radius = radius_offset;
						needsRebuild = true;
						break;
					case Ring_Zone.rotate:
						const rotation_angle = mouse_wentDown_angle.add_angle_normalized(-$s_rotation_ring_angle);
						debug.log_action(` begin rotate  ${rotation_angle.degrees_of(0)} RINGS`);
						g.ring_rotation_state.active_angle = mouse_wentDown_angle;
						g.ring_rotation_state.basis_angle = rotation_angle;
						needsRebuild = true;
						break;
					case Ring_Zone.paging: 
						const paging_angle = mouse_wentDown_angle.angle_normalized();
						const map = $s_clusters_geometry.cluster_mapFor_mouseLocation;
						debug.log_action(` mouse is ${mouse_state.isDown ? 'down' : 'not down'} RINGS`);
						if (!!map && mouse_state.isDown) {
							debug.log_action(` begin paging  ${paging_angle.degrees_of(0)} RINGS`);
							map.paging_rotation.active_angle = paging_angle;
							map.paging_rotation.basis_angle = paging_angle;
							$s_active_cluster_map = map;
							needsRebuild = true;
						}
						break;
				}
			}
			if (needsRebuild) {
				cursor_closure();
				rebuilds += 1
			}
		}
	}

	function handle_mouse_state(mouse_state: Mouse_State): boolean { return true; }		// only for wrappers
	function isHit(): boolean { return u.distance_fromCenter <= outer_radius; }

	function detect_hovering() {
		const ring_zone = u.ringZone_forMouseLocation;
		const arc_isActive = ux.isAny_paging_arc_active;
		const inRotate = ring_zone == Ring_Zone.rotate && !arc_isActive && !g.ring_resizing_state.isActive;
		const inResize = ring_zone == Ring_Zone.resize && !arc_isActive && !g.ring_rotation_state.isActive;
		const inPaging = ring_zone == Ring_Zone.paging && !g.ring_rotation_state.isActive && !g.ring_resizing_state.isActive;
		if ($s_ring_paging_state.isHovering != inPaging) {
			$s_ring_paging_state.isHovering = inPaging;			// all arcs and thumbs
		}
		if (g.ring_rotation_state.isHovering != inRotate) {
			g.ring_rotation_state.isHovering = inRotate;
			// debug.log_action(`rotation ${g.ring_rotation_state.cursor}`);
		}
		if (g.ring_resizing_state.isHovering != inResize) {
			g.ring_resizing_state.isHovering = inResize;
			// debug.log_action(`resizing ${g.ring_resizing_state.cursor}`);
		}
	}

	function reset() {
		ux.mouse_timer_forName(name).reset();
		g.ring_rotation_state.reset();
		g.ring_resizing_state.reset();
		$s_active_cluster_map = null;
		mouse_timer.reset();
		ux.reset_paging();
		cursor_closure();
		rebuilds += 1;
	}

	function cursor(): string {
		return g.ring_rotation_state.cursor;
	}

	// cursor={g.ring_resizing_state.cursor}cursor_forMouseLocation
	// cursor={g.ring_rotation_state.cursor}
	// const ring_zone = u.ringZone_forMouseLocation;
	// debug.log_action(` mouse up in  '${ring_zone}' RINGS`);

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
		{#if !debug.hide_rings}
			<div class='resize' style='z-index:{ZIndex.rings};'>
				<Mouse_Responder
					name='resize'
					zindex={zindex}
					isHit_closure={isHit}
					center={g.graph_center}
					width={outer_diameter}
					height={outer_diameter}
					cursor={g.ring_resizing_state.cursor}
					mouse_state_closure={up_down_closure}>
					<svg
						class='svg-resize'
						viewBox={viewBox}>
						<path class='path-resize' d={svg_ring_resizing_path}
							fill={u.opacitize(color, g.ring_resizing_state.fill_opacity)}
							stroke={u.opacitize(color, g.ring_resizing_state.stroke_opacity)}/>
					</svg>
				</Mouse_Responder>
			</div>
			<div class='rotate' style='z-index:{ZIndex.rings};'>
				<Mouse_Responder
					name='rotate'
					zindex={zindex}
					isHit_closure={isHit}
					center={g.graph_center}
					width={outer_diameter}
					height={outer_diameter}
					cursor={g.ring_rotation_state.cursor}
					mouse_state_closure={up_down_closure}>
					<svg
						class='svg-rotate'
						viewBox={viewBox}>
						{#if debug.reticule}
							<path class='path-reticule' stroke='green' fill=transparent d={svgPaths.t_cross(middle_radius * 2, -2)}/>
						{/if}
						<path class='path-rotate' d={svg_ring_rotation_path}
							fill={u.opacitize(color, g.ring_rotation_state.fill_opacity * (g.ring_resizing_state.isHighlighted ? 0.3 : 1))}
							stroke={u.opacitize(color, g.ring_rotation_state.stroke_opacity * (g.ring_resizing_state.isHighlighted ? 0.7 : 1))}/>
					</svg>
				</Mouse_Responder>
			</div>
		{/if}
	</div>
{/key}
