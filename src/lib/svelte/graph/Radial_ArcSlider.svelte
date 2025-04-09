<script lang='ts'>
	import { c, k, ux, w, show, Rect, Size, Point, debug, Angle, colors, signals } from '../../ts/common/Global_Imports';
	import { w_count_mouse_up, w_ancestry_focus, w_g_active_cluster, w_ring_rotation_radius } from '../../ts/common/Stores';
	import { T_Layer, G_Cluster, Svelte_Wrapper, T_SvelteComponent } from '../../ts/common/Global_Imports';
	import { w_color_trigger, w_background_color, w_thing_fontFamily } from '../../ts/common/Stores';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import Identifiable from '../../ts/data/runtime/Identifiable';
	import Angled_Text from '../kit/Angled_Text.svelte';
	import { onMount } from 'svelte';
	export let color = 'red';
	export let g_cluster!: G_Cluster;
	const offset = k.radial_widget_inset;
	const thumb_name = `thumb-${g_cluster.name}`;
	const radius = $w_ring_rotation_radius + offset;
	const viewBox=`${-offset} ${-offset} ${radius * 2} ${radius * 2}`;
	let origin = w.center_ofGraphSize.offsetBy(Point.square(-radius));
	let text_background_color = $w_background_color;
	let mouse_up_count = $w_count_mouse_up;
	let arc_wrapper!: Svelte_Wrapper;
	let angled_text_color = color;
	let fork_stroke_color = color;
	let thumb_fill_color = color;
	let arc_stroke_color = color;
	let arc_fill_color = color;
	let arc_slider_path;
	let arc_slider;
	let thumb_path;
	let fork_path;

	//////////////////////////////////////////////////
	//												//
	//	radial graph => radial rings => this		//
	//	=> {arc, thumb, label, fork line}			//
	//												//
	//	ignores signals: {rebuild, recreate}		//
	//	uses g_cluster => {geometry, text}			//
	//	& {g_sliderArc, g_thumbArc} => svg paths	//
	//												//
	//////////////////////////////////////////////////

	debug.log_build(`ARC SLIDER  ${g_cluster.name}`);
	g_cluster.layout_cluster();
	
	onMount(() => {
		update_colors();
		reposition();
		const handle_reposition = signals.handle_reposition_widgets(2, (received_ancestry) => {
			reposition();
		});
		return () => { handle_reposition.disconnect() };
	});

	$: {
		const _ = $w_g_active_cluster + $w_background_color + $w_color_trigger;
		update_colors();
	}

	$: {
		if (!!arc_slider) {
			arc_wrapper = new Svelte_Wrapper(arc_slider, handle_isHit, -1, T_SvelteComponent.thumb);
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
		arc_fill_color = $w_background_color;	// no effect because z-level not high enough
		arc_stroke_color = colors.opacitize(color, 0.4);
		fork_stroke_color = colors.opacitize(color, 0.3);
		angled_text_color = $w_ancestry_focus.thing?.color ?? colors.default_forThings;
		thumb_fill_color = colors.opacitize(color, ux.s_ring_rotation.isActive ? 0.15 : g_cluster.s_paging_rotation.thumb_opacity);
		text_background_color = !ux.s_ring_resizing.isHovering ? $w_background_color : colors.opacitize(color, ux.s_ring_resizing.fill_opacity);
	}

	// function update_colors() {
	// 	fork_path?.setAttribute('stroke', colors.opacitize(color, 0.3));
	// 	arc_slider_path?.setAttribute('stroke', colors.opacitize(color, 0.4));
	// 	thumb_path?.setAttribute('stroke', colors.opacitize(color, ux.s_ring_rotation.isActive ? 0.15 : g_cluster.s_paging_rotation.thumb_opacity));
	// }

	function reposition() {
		// INCOMPLETE: need to update view box, Mouse_Responder's center and Angled_Text's [dunno]
		// g cluster is source of truth for svg paths, including coordinates
		arc_slider_path.setAttribute('d', g_cluster.g_sliderArc.svgPathFor_arcSlider);
		fork_path?.setAttribute('d', g_cluster.g_sliderArc.svgPathFor_radialFork);
		thumb_path?.setAttribute('d', g_cluster.g_thumbArc.svgPathFor_arcSlider);
	}

	function hover_closure(s_mouse) {
		if (g_cluster.isPaging && s_mouse.isHover) {
			g_cluster.s_paging_rotation.isHovering = g_cluster.thumb_isHit;	// show highlight around ring
			update_colors();
		}
	}

	function handle_isHit(s_mouse: S_Mouse): boolean {
		return g_cluster.thumb_isHit;
	}

</script>

<div
	class = 'arc-slider'
	bind:this = {arc_slider}
	style = 'z-index:{T_Layer.paging};'>
	<Mouse_Responder
		width = {radius * 2}
		height = {radius * 2}
		name = {g_cluster.name}
		zindex = {T_Layer.paging}
		cursor = {k.cursor_default}
		handle_isHit = {handle_isHit}
		center = {w.center_ofGraphSize}
		handle_mouse_state = {hover_closure}>
		<svg class = 'svg-arc-slider' viewBox = {viewBox}>
			<path
				stroke-width = 0.5
				id = 'path-arc-slider'
				fill = {arc_fill_color}
				stroke = {arc_stroke_color}
				bind:this = {arc_slider_path}/>
			<path
				id = 'path-fork'
				fill = transparent
				bind:this = {fork_path}
				stroke = {fork_stroke_color}
				stroke-width = {k.line_thickness}/>
			{#if g_cluster.isPaging && g_cluster.widgets_shown > 1}
				<path
					id = {thumb_name}
					bind:this = {thumb_path}
					fill = {thumb_fill_color}/>
			{/if}
		</svg>
	</Mouse_Responder>
</div>
<Angled_Text
	zindex = {T_Layer.paging}
	color = {angled_text_color}
	text = {g_cluster.cluster_title}
	center = {g_cluster.label_center}
	font_size = {k.small_font_size}px
	font_family = {$w_thing_fontFamily}
	background_color = {text_background_color}
	angle = {g_cluster.g_sliderArc.label_text_angle}/>