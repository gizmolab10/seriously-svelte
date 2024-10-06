<script lang='ts'>
	import { g, k, u, ux, Rect, Size, Point, debug, Angle, ZIndex, onMount } from '../../ts/common/Global_Imports';
	import { opacitize, Cluster_Map, Svelte_Wrapper, SvelteComponentType } from '../../ts/common/Global_Imports';
	import { s_mouse_location, s_mouse_up_count, s_focus_ancestry } from '../../ts/state/Reactive_State';
	import { s_ring_rotation_state, s_rotation_ring_radius } from '../../ts/state/Reactive_State';
	import { s_thing_fontFamily, s_ring_paging_state } from '../../ts/state/Reactive_State';
	import Mouse_Responder from '../mouse buttons/Mouse_Responder.svelte';
	import { ArcPart } from '../../ts/common/Enumerations';
	import Identifiable from '../../ts/data/Identifiable';
	import Angled_Text from '../kit/Angled_Text.svelte';
	export let color = 'red';
	export let cluster_map!: Cluster_Map;
	const offset = k.ring_widget_padding;
	const radius = $s_rotation_ring_radius + offset;
	const thumb_name = `thumb-${cluster_map?.name}`;
	const viewBox=`${-offset} ${-offset} ${radius * 2} ${radius * 2}`;
	let origin = g.graph_center.offsetBy(Point.square(-radius));
	let mouse_up_count = $s_mouse_up_count;
	let arc_wrapper!: Svelte_Wrapper;
	let thumb_color = color;
	let arc_color = color;
	let arc;

	// draws the arc, thumb and label
	// uses arc_map for svg
	// and cluster map for geometry and text
	//
	// contained by rings, which is contained by clusters view

	debug.log_build(` P ARC (svelte)  ${cluster_map?.name}`);
	cluster_map?.update_all();
	update_colors();

	$: {
		const _ = $s_ring_paging_state;
		update_colors();
	}

	$: {
		if (!!arc) {
			arc_wrapper = new Svelte_Wrapper(arc, handle_mouse_state, -1, SvelteComponentType.thumb);
		}
	}

	$: {
		if (mouse_up_count != $s_mouse_up_count) {		// NEVER gets executed
			mouse_up_count = $s_mouse_up_count;			// WHY? because mouse_up_count is always
			cluster_map?.paging_rotation.reset();		// reset to s_mouse_up_count by rebuild
		}
	}

	function handle_mouse_state(mouse_state: Mouse_State): boolean { return cluster_map.thumb_isHit; }

	function update_colors() {
		arc_color = u.opacitize(color, $s_ring_paging_state.stroke_opacity);
		thumb_color = u.opacitize(color, $s_ring_rotation_state.isActive ? 0.15 : cluster_map?.paging_rotation.three_level_opacity);
	}

	function computed_mouse_angle(): number | null {
		return u.vector_ofOffset_fromGraphCenter_toMouseLocation(g.graph_center)?.angle ?? null
	}

	function mouse_state_closure(mouse_state) {
		if (cluster_map.isPaging) {
			if (mouse_state.isHover) {
				cluster_map?.paging_rotation.isHovering = cluster_map.thumb_isHit;	// show highlight around ring
				update_colors();
			}
		}
	}

</script>

{#if !!cluster_map}
	{#key arc_color}
		<div class='arc' bind:this={arc} style='z-index:{ZIndex.paging};'>
			{#if !debug.noRings}
				<Mouse_Responder
					width={radius * 2}
					height={radius * 2}
					zindex={ZIndex.backmost}
					center={g.graph_center}
					detect_longClick={false}
					name={cluster_map?.name}
					cursor={k.cursor_default}
					mouse_state_closure={mouse_state_closure}
					isHit_closure={() => cluster_map.thumb_isHit}>
					<svg class='svg-arc' viewBox={viewBox}>
						<path stroke={arc_color} fill=transparent d={cluster_map.arc_map.svg_arc_path}/>
						{#if debug.reticule}
							<path stroke='maroon' fill=transparent d={cluster_map.arc_map.svg_reticule_path}/>
						{/if}
						{#if cluster_map.isPaging && cluster_map.shown > 1}
							<path fill={thumb_color} d={cluster_map.thumb_map.svg_arc_path}/>
						{/if}
					</svg>
				</Mouse_Responder>
			{/if}
		</div>
	{/key}
	<Angled_Text
		text={cluster_map.cluster_title}
		center={cluster_map.label_center}
		font_family={$s_thing_fontFamily}
		font_size={k.thing_fontSize * 0.6}
		angle={cluster_map.label_text_angle}
		color={$s_focus_ancestry.thing?.color ?? k.color_default}/>
{/if}
