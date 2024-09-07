<script lang='ts'>
	import { s_graphRect, s_thing_changed, s_mouse_location, s_active_wrapper, s_mouse_up_count } from '../../ts/state/Reactive_State';
	import { s_ancestry_focus, s_user_graphOffset, s_clusters_geometry, s_active_cluster_map } from '../../ts/state/Reactive_State';
	import { g, k, u, ux, w, Thing, Point, Angle, debug, ZIndex, onMount, signals } from '../../ts/common/Global_Imports';
	import { svgPaths, dbDispatch, opacitize, Svelte_Wrapper, SvelteComponentType } from '../../ts/common/Global_Imports';
	import { s_paging_ring_state, s_resize_ring_state, s_rotation_ring_state } from '../../ts/state/Reactive_State';
	import { s_rotation_ring_angle, s_rotation_ring_radius } from '../../ts/state/Reactive_State';
	import Mouse_Responder from '../mouse buttons/Mouse_Responder.svelte';
	import Identifiable from '../../ts/data/Identifiable';
	import Paging_Arc from './Paging_Arc.svelte';
	export let ring_width = 0;
	export let name = k.empty;
	export let color = k.empty;
	export let zindex = ZIndex.rotation;
	export let cursor_closure = () => {};
	const inner_radius = $s_rotation_ring_radius;
	const outer_radius = inner_radius + ring_width;
	const resize_radius = outer_radius + ring_width;
	const outer_diameter = outer_radius * 2;
	const mouse_timer = ux.mouse_timer_forName(name);	// persist across destroy/recreate
	const svg_ringPath = svgPaths.ring(Point.square(inner_radius), outer_radius, ring_width);
	const rotation_viewBox = `${-ring_width}, ${-ring_width}, ${outer_diameter}, ${outer_diameter}`;
	let mouse_up_count = $s_mouse_up_count;
	let rotationWrapper!: Svelte_Wrapper;
	let pagingWrapper!: Svelte_Wrapper;
	let rotationRing;
	let rebuilds = 0;
	let pagingArcs;

	enum Ring_Zone {
		miss	= 'miss',
		resize	= 'resize',
		rotate	= 'rotate',
		paging	= 'paging',
	}

	debug.log_build(` RINGS (svelte)`);
	$s_clusters_geometry.layoutAll_clusters();

	$: {
		if (!!$s_ancestry_focus.thing && $s_ancestry_focus.thing.id == $s_thing_changed?.split(k.generic_separator)[0]) {
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
			const ring_zone = ringZone_forMouseLocation();
			if (ring_zone == Ring_Zone.miss) {			// only respond if NOT isHit
				debug.log_action(`RINGS  mouse up in  '${ring_zone}'`);
				ux.mouse_timer_forName(name).reset();
				$s_rotation_ring_state.reset();
				$s_active_cluster_map = null;
				$s_active_wrapper = null;
				mouse_timer.reset();
				ux.reset_paging();
				cursor_closure();
				rebuilds += 1;
			}
		}
	}

	$: {

		////////////////////////////////////
		// detect movement & adjust state //
		////////////////////////////////////

		const _ = $s_mouse_location;								// use store, to invoke this code
		const from_center = u.vector_ofOffset_fromGraphCenter_toMouseLocation(g.graph_center);
		if (!!from_center) {
			const mouse_angle = from_center.angle;
			const rotate_state = $s_rotation_ring_state;
			detect_hovering();
			if (!!rotate_state.active_angle || rotate_state.active_angle == 0) {		// rotate_resize clusters
				if (!signals.signal_isInFlight && !mouse_angle.isClocklyAlmost(rotate_state.active_angle, Angle.radians_from_degrees(4), Angle.full)) {		// detect >= 4° change
					$s_rotation_ring_angle = mouse_angle.add_angle_normalized(-rotate_state.basis_angle);
					debug.log_action(`RINGS  rotate  ${$s_rotation_ring_angle.degrees_of(0)}`);
					rotate_state.active_angle = mouse_angle;
					signals.signal_relayoutWidgets_fromFocus();			// destroys this component (properties are in s_rotation_ring_state && s_active_cluster_map)
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
					rebuilds += 1;
				}
			} else if (!!rotate_state.radiusOffset) {		// resize
				const magnitude = from_center.magnitude
				const smallest = k.ring_smallest_radius;
				const largest = k.ring_smallest_radius * 3;
				const distance = magnitude.force_between(smallest, largest);
				const delta = distance - $s_rotation_ring_radius - rotate_state.radiusOffset;
				if (Math.abs(delta) > 1) {							// granularity of 1 pixel
					const radius = $s_rotation_ring_radius + delta;
					debug.log_action(`RINGS  resize  ${radius.toFixed(0)}`);
					$s_rotation_ring_radius = radius;
					signals.signal_rebuildGraph_fromFocus();			// destroys this component (properties are in s_rotation_ring_state && s_active_cluster_map)
					rebuilds += 1;
				}
			}
			cursor_closure();
		}
	}

	function closure(mouse_state) {

		/////////////////////////////
		// setup or teardown state //
		/////////////////////////////

		debug.log_hover(mouse_state.description);
		if (!mouse_state.isHover) {
			const mouse_wentDown_angle = angle_fromCenter();
			const ring_zone = ringZone_forMouseLocation();
			switch (ring_zone) {
				case Ring_Zone.resize:
					const resize_radius = distance_fromCenter() - $s_rotation_ring_radius;
					debug.log_action(`RINGS  begin resize  ${resize_radius.toFixed(0)}`);
					$s_rotation_ring_state.radiusOffset = resize_radius;
					$s_active_wrapper = rotationWrapper;
					rebuilds += 1;
					break;
				case Ring_Zone.rotate:
					const rotation_angle = mouse_wentDown_angle.add_angle_normalized(-$s_rotation_ring_angle);
					debug.log_action(`RINGS  begin rotate  ${rotation_angle.degrees_of(0)}`);
					$s_rotation_ring_state.active_angle = mouse_wentDown_angle;
					$s_rotation_ring_state.basis_angle = rotation_angle;
					$s_active_wrapper = rotationWrapper;
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
						$s_active_wrapper = pagingWrapper;
						$s_active_cluster_map = map;
						rebuilds += 1;
					}
					break;
			}
			cursor_closure();
		}
	}

	function vector_fromCenter(): number { return u.vector_ofOffset_fromGraphCenter_toMouseLocation(g.graph_center); }
	function angle_fromCenter(): number | null { return vector_fromCenter()?.angle ?? null; }
	function distance_fromCenter(): number { return vector_fromCenter()?.magnitude ?? 0; }
	function handle_mouse_state(mouse_state: Mouse_State): boolean { return true; }		// only for wrappers
	function isHit(): boolean { return distance_fromCenter() <= resize_radius; }

	function detect_hovering() {
		const ring_zone = ringZone_forMouseLocation();
		const ring_isActive = $s_rotation_ring_state.isActive;
		const inPaging = ring_zone == Ring_Zone.paging;
		const inRing = (ring_zone == Ring_Zone.rotate || ring_zone == Ring_Zone.resize) && !ux.isAny_paging_arc_active;
		if ($s_paging_ring_state.isHovering != inPaging && !ring_isActive) {
			$s_paging_ring_state.isHovering = inPaging;			// adjust hover highlight for all arcs  (paging arc handles thumb hover)
		}
		if ($s_rotation_ring_state.isHovering != inRing) {
			$s_rotation_ring_state.isHovering = inRing;
		}
	}

	function ringZone_forMouseLocation(): Ring_Zone {
		const distance = distance_fromCenter();
		if (!!distance && distance <= resize_radius) {
			if (distance > outer_radius) {
				return Ring_Zone.resize;
			} else if (distance > inner_radius) {
				return Ring_Zone.rotate;
			}
			return Ring_Zone.paging;
		}
		return Ring_Zone.miss;
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
				width={outer_diameter}
				height={outer_diameter}
				closure={closure}
				center={g.graph_center}
				detect_longClick={false}
				detectHit_closure={isHit}
				detect_doubleClick={false}
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
