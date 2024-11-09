<script lang='ts'>
	import { g, k, u, ux, w, show, Rect, Size, Point, debug, Angle, ZIndex, onMount } from '../../ts/common/Global_Imports';
	import { opacitize, Cluster_Map, Svelte_Wrapper, SvelteComponentType } from '../../ts/common/Global_Imports';
	import { s_mouse_location, s_mouse_up_count, s_focus_ancestry } from '../../ts/state/Reactive_State';
	import { s_thing_fontFamily, s_ring_rotation_radius } from '../../ts/state/Reactive_State';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import { ArcPart } from '../../ts/common/Enumerations';
	import Identifiable from '../../ts/basis/Identifiable';
	import Angled_Text from '../kit/Angled_Text.svelte';
	export let color = 'red';
	export let cluster_map!: Cluster_Map;
	const offset = k.ring_widget_padding;
	const radius = $s_ring_rotation_radius + offset;
	const thumb_name = `thumb-${cluster_map?.name}`;
	const viewBox=`${-offset} ${-offset} ${radius * 2} ${radius * 2}`;
	let origin = w.center_ofGraphRect.offsetBy(Point.square(-radius));
	let mouse_up_count = $s_mouse_up_count;
	let arc_wrapper!: Svelte_Wrapper;
	let thumb_color = color;
	let fork_color = color;
	let arc_color = color;
	let arc;

	// draws the arc, thumb and label
	// uses arc_map for svg
	// and cluster map for geometry and text
	//
	// contained by rings, which is contained by rings graph

	debug.log_build(` P ARC (svelte)  ${cluster_map?.name}`);
	cluster_map?.update_all();
	update_colors();

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
		fork_color = u.opacitize(color, 0.3);
		arc_color = u.opacitize(color, g.cluster_paging_state.stroke_opacity);
		thumb_color = u.opacitize(color, g.ring_rotation_state.isActive ? 0.15 : cluster_map?.paging_rotation.three_level_opacity);
	}

	function computed_mouse_angle(): number | null {
		return u.mouse_angle_fromGraphCenter ?? null
	}

	function hover_closure(mouse_state) {
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
					name={cluster_map?.name}
					cursor={k.cursor_default}
					center={w.center_ofGraphRect}
					mouse_state_closure={hover_closure}
					isHit_closure={() => cluster_map.thumb_isHit}>
					<svg id='arc' viewBox={viewBox}>
						<path id='arc' stroke={arc_color} fill=transparent d={cluster_map.arc_map.svg_arc_path}/>
						<path id='fork' stroke={fork_color} fill=transparent d={cluster_map.arc_map.svg_fork_radial_path}/>
						{#if cluster_map.isPaging && cluster_map.shown > 1}
							<path id='thumb' fill={thumb_color} d={cluster_map.thumb_map.svg_arc_path}/>
						{/if}
					</svg>
				</Mouse_Responder>
			{/if}
		</div>
	{/key}
	<Angled_Text
		font_size='0.6em'
		text={cluster_map.cluster_title}
		center={cluster_map.label_center}
		font_family={$s_thing_fontFamily}
		angle={cluster_map.arc_map.label_text_angle}
		color={$s_focus_ancestry.thing?.color ?? k.thing_color_default}/>
{/if}
