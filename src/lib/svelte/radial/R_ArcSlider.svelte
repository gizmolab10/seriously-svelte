<script lang='ts'>
	import { c, k, u, ux, w, show, Rect, Size, Point, debug, Angle } from '../../ts/common/Global_Imports';
	import { T_Layer, G_Cluster, Svelte_Wrapper, T_SvelteComponent } from '../../ts/common/Global_Imports';
	import { w_thing_fontFamily, w_ring_rotation_radius } from '../../ts/common/Stores';
	import { w_count_mouse_up, w_ancestry_focus } from '../../ts/common/Stores';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import Identifiable from '../../ts/data/runtime/Identifiable';
	import Angled_Text from '../kit/Angled_Text.svelte';
	export let color = 'red';
	export let g_cluster!: G_Cluster;
	const offset = k.radial_widget_inset;
	const thumb_name = `thumb-${g_cluster.name}`;
	const radius = $w_ring_rotation_radius + offset;
	const viewBox=`${-offset} ${-offset} ${radius * 2} ${radius * 2}`;
	let origin = w.center_ofGraphSize.offsetBy(Point.square(-radius));
	let mouse_up_count = $w_count_mouse_up;
	let arc_wrapper!: Svelte_Wrapper;
	let thumb_color = color;
	let fork_color = color;
	let arc_color = color;
	let arc;

	// draws the arc, thumb and label
	// uses g_arcSlider for svg
	// and cluster map for geometry and text
	//
	// contained by radial, which is contained by radial graph

	debug.log_build(` P ARC (svelte)  ${g_cluster.name}`);
	g_cluster.update_all();
	update_colors();

	$: {
		if (!!arc) {
			arc_wrapper = new Svelte_Wrapper(arc, handle_isHit, -1, T_SvelteComponent.thumb);
		}
	}

	$: {
		if (mouse_up_count != $w_count_mouse_up) {		// NEVER gets executed
			mouse_up_count = $w_count_mouse_up;			// WHY? because mouse_up_count is always
			g_cluster.s_paging_rotation.reset();		// reset to w_count_mouse_up by rebuild
		}
	}

	function computed_mouse_angle(): number | null {
		return w.mouse_angle_fromGraphCenter ?? null
	}

	function update_colors() {
		fork_color = u.opacitize(color, 0.3);
		arc_color = u.opacitize(color, ux.s_cluster_rotation.stroke_opacity);
		thumb_color = u.opacitize(color, ux.s_ring_rotation.isActive ? 0.15 : g_cluster.s_paging_rotation.three_level_opacity);
	}

	function hover_closure(s_mouse) {
		if (g_cluster.isPaging) {
			if (s_mouse.isHover) {
				g_cluster.s_paging_rotation.isHovering = g_cluster.thumb_isHit;	// show highlight around ring
				update_colors();
			}
		}
	}

	function handle_isHit(s_mouse: S_Mouse): boolean {
		return g_cluster.thumb_isHit;
	}

</script>

{#if !!g_cluster}
	{#key arc_color}
		<div class='arc' bind:this={arc} style='z-index:{T_Layer.paging};'>
			{#if !debug.noRadial}
				<Mouse_Responder
					width={radius * 2}
					height={radius * 2}
					name={g_cluster.name}
					zindex={T_Layer.backmost}
					cursor={k.cursor_default}
					handle_isHit={handle_isHit}
					center={w.center_ofGraphSize}
					handle_mouse_state={hover_closure}>
					<svg id='arc' viewBox={viewBox}>
						<path id='arc' stroke={arc_color} fill=transparent d={g_cluster.g_arcSlider.svgPathFor_arcSlider}/>
						<path id='fork' stroke={fork_color} fill=transparent d={g_cluster.g_arcSlider.svgPathFor_forkRadial}/>
						{#if g_cluster.isPaging && g_cluster.widgets_shown > 1}
							<path id={thumb_name} fill={thumb_color} d={g_cluster.g_thumbSlider.svgPathFor_arcSlider}/>
						{/if}
					</svg>
				</Mouse_Responder>
			{/if}
		</div>
	{/key}
	<Angled_Text
		text={g_cluster.cluster_title}
		center={g_cluster.label_center}
		font_size={k.small_font_size}px
		font_family={$w_thing_fontFamily}
		angle={g_cluster.g_arcSlider.label_text_angle}
		color={$w_ancestry_focus.thing?.color ?? k.thing_color_default}/>
{/if}
