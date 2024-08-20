<script lang='ts'>
	import { s_mouse_location, s_mouse_up_count, s_ancestry_focus, s_rotation_ring_radius } from '../../ts/state/Reactive_State';
	import { g, k, u, ux, Rect, Size, Point, debug, Angle, ZIndex, onMount } from '../../ts/common/Global_Imports';
	import { opacitize, Cluster_Map, Svelte_Wrapper, SvelteComponentType } from '../../ts/common/Global_Imports';
	import Mouse_Responder from '../mouse buttons/Mouse_Responder.svelte';
	import { ArcPart } from '../../ts/common/Enumerations';
	import Identifiable from '../../ts/data/Identifiable';
	export let color = 'red';
	export let center = Point.zero;
	export let cluster_map!: Cluster_Map;
	const offset = k.rotation_ring_widget_padding;
	const radius = $s_rotation_ring_radius + offset;
	const name = cluster_map?.name;
	const breadth = radius * 2;
	const thumb_name = `thumb-${name}`;
	const paging_state = cluster_map?.paging_rotation_state;
	const thumb_size = (cluster_map?.paging_radius ?? 0) * 2;
	const viewBox=`${-offset} ${-offset} ${breadth} ${breadth}`;
	let origin = center.offsetBy(Point.square(-radius));
	let paging_arc_wrapper!: Svelte_Wrapper;
	let mouse_up_count = $s_mouse_up_count;
	let label_origin = Point.zero;
	let label_title = k.empty;
	let thumb_color = color;
	let arc_color = color;
	let rebuilds = 0;
	let paging_arc;

	// draws the [paging] arc and thumb slider
	// uses paging_map for svg, which also has total and shown
	//
	// drawn by paging ring, which is drawn by clusters graph
	// CHANGE: drawn by clusters (which is drawn by clusters graph)?

	onMount(() => {
		update_colors();
	})

	$: {
		if (!!paging_arc) {
			paging_arc_wrapper = new Svelte_Wrapper(paging_arc, handle_mouse_state, -1, SvelteComponentType.thumb);
		}
	}

	$: {
		if (mouse_up_count != $s_mouse_up_count) {
			mouse_up_count = $s_mouse_up_count;
			paging_state.reset();
			layout_title();
		}
	}

	$: {
		const _ = k.empty + ($s_mouse_location?.description ?? k.empty);			// use store, to react
		handle_mouse_moved();
	}

	function handle_mouse_state(mouse_state: Mouse_State): boolean { return thumb_isHit(); }

	function update_colors() {
		const thumb_opacity = paging_state.isActive ? 0.7 : paging_state.isHovering ? 0.3 : 0.08;
		arc_color = u.opacitize(color, ux.paging_ring_state.stroke_opacity);
		thumb_color = u.opacitize(color, thumb_opacity);
	}

	function computed_mouse_angle(): number | null {
		return u.vector_ofOffset_fromGraphCenter_toMouseLocation(center)?.angle ?? null
	}
 
	function thumb_isHit(): boolean {
		if (!!cluster_map) {
			const ring_origin = center.offsetBy(Point.square(-$s_rotation_ring_radius));
			const vector = u.vector_ofOffset_fromGraphCenter_toMouseLocation(ring_origin);
			return vector.isContainedBy_path(cluster_map.thumb_map.arc_svgPath);
		}
		return false;
	}

	function layout_title() {
		if (!!cluster_map) {
			label_title = cluster_map.cluster_title;
			label_origin = cluster_map.label_origin;
		}
	}

	function mouse_state_closure(mouse_state) {
		if (cluster_map.isPaging) {
			if (mouse_state.isHover) {
				paging_state.isHovering = thumb_isHit();	// show highlight around ring
				update_colors();
			}
		}
	}

	function handle_mouse_moved() {
		// const mouse_angle = computed_mouse_angle();
		// if (!!paging_state.active_angle && !!cluster_map && !!mouse_angle) {		// page
		// 	const delta = Math.abs(mouse_angle - paging_state.active_angle);		// subtract to find difference
		// 	if (delta >= (Angle.half / 90)) {											// minimum two degree changes
		// 		cluster_map.adjust_paging_index_forMouse_angle(mouse_angle);
		// 		console.log(`paging ${mouse_angle.degrees_of(0)}`)
		// 		paging_state.active_angle = mouse_angle;
		// 		rebuilds += 1;
		// 	}
		// }
		layout_title();
	}

</script>

{#if !!cluster_map && cluster_map.shown > 1}
	<div class='paging-arc' bind:this={paging_arc} style='z-index:{ZIndex.paging};'>
		<Mouse_Responder
			name={name}
			center={center}
			width={breadth}
			height={breadth}
			zindex={ZIndex.panel}
			detect_longClick={false}
			cursor={k.cursor_default}
			closure={mouse_state_closure}
			detectHit_closure={thumb_isHit}>
			<svg class='svg-paging-arc' viewBox={viewBox}>
				<path stroke={arc_color} fill=transparent d={cluster_map.paging_map.arc_svgPath}/>
				{#if debug.reticule}
					<path stroke='green' fill=transparent d={cluster_map.paging_map.debug_svgPath}/>
				{/if}
				{#if cluster_map.isPaging}
					<path fill={thumb_color} d={cluster_map.thumb_map.arc_svgPath}/>
				{/if}
			</svg>
		</Mouse_Responder>
	</div>
{/if}
<div class='cluster-label'
	style='
		background-color: {k.color_background};
		left: {label_origin.x}px;
		top: {label_origin.y}px;
		white-space: nowrap;
		font-family: Arial;
		text-align: center;
		position: absolute;
		font-size: 0.5em;
		color: {color};'>
	{@html label_title}
</div>
