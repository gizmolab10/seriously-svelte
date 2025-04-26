<script lang='ts'>
	import { c, k, ux, w, show, Rect, Size, Point, debug, Angle, colors, signals } from '../../ts/common/Global_Imports';
	import { w_ancestry_focus, w_thing_color, w_background_color, w_thing_fontFamily } from '../../ts/common/Stores';
	import { w_count_mouse_up, w_g_paging_cluster, w_ring_rotation_radius } from '../../ts/common/Stores';
	import { T_Layer, G_Cluster, Direction } from '../../ts/common/Global_Imports';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import Identifiable from '../../ts/runtime/Identifiable';
	import Angled_Text from '../kit/Angled_Text.svelte';
	import Gull_Wings from '../kit/Gull_Wings.svelte';
	import { onMount } from 'svelte';
	export let color = 'red';
	export let g_cluster!: G_Cluster;
	const offset = k.radial_widget_inset;
	const g_sliderArc = g_cluster.g_sliderArc;
	const thumb_name = `thumb-${g_cluster.name}`;
	const radius = $w_ring_rotation_radius + offset;
	const viewBox=`${-offset} ${-offset} ${radius * 2} ${radius * 2}`;
	let origin = w.center_ofGraphSize.offsetBy(Point.square(-radius));
	let text_background_color = $w_background_color;
	let mouse_up_count = $w_count_mouse_up;
	let angled_text_color = color;
	let fork_stroke_color = color;
	let thumb_fill_color = color;
	let arc_stroke_color = color;
	let arc_fill_color = color;
	let arc_slider;

	//////////////////////////////////////////////////
	//												//
	//	draw arc, thumb, label, fork line			//
	//												//
	//	radial graph => radial rings => this		//
	//	ignores signals: {rebuild, recreate}		//
	//	uses g_cluster => {geometry, text}			//
	//	& {g_sliderArc, g_thumbArc} => svg paths	//
	//												//
	//////////////////////////////////////////////////

	debug.log_build(`ARC SLIDER  ${g_cluster.name}`);
	// g_cluster.layout_cluster();
	
	onMount(() => {
		update_colors();
	});

	$: {
		const _ = $w_g_paging_cluster + $w_background_color + $w_thing_color;
		update_colors();
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
		const background	  = $w_background_color;
		const ratio			  = k.ratio.standard_saturation;
		const blend			  = colors.blendWithOpacity(color, background, ratio);
		arc_fill_color		  = background;			// N.B., no effect because z-level not high enough
		arc_stroke_color	  = blend;
		fork_stroke_color	  = blend;
		angled_text_color	  = $w_ancestry_focus.thing?.color ?? colors.default_forThings;
		thumb_fill_color	  = colors.blendWithOpacity(color, background, ux.s_ring_rotation.isActive ? ratio : g_cluster.s_paging_rotation.thumb_saturation);
		text_background_color = !ux.s_ring_resizing.isHovering ? background : colors.blendWithOpacity(color, background, ux.s_ring_resizing.fill_opacity);
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

{#if g_cluster.widgets_shown > 1}
	<Gull_Wings
		zindex={T_Layer.paging}
		color={fork_stroke_color}
		thickness={k.thickness.fork}
		radius={k.thickness.fork * 3}
		center={g_sliderArc.tip_ofFork}
		direction={g_sliderArc.angle_ofFork}/>
{/if}
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
				id = 'path-arc-slider'
				fill = {arc_fill_color}
				stroke = {arc_stroke_color}
				stroke-width = {k.thickness.fork}
				d = {g_sliderArc.svgPathFor_arcSlider}/>
			<path
				id = 'path-fork'
				fill = transparent
				stroke = {fork_stroke_color}
				stroke-width = {k.thickness.fork}
				d = {g_sliderArc.svgPathFor_radialFork}/>
			{#if g_cluster.isPaging && g_cluster.widgets_shown > 1}
				<path
					id = {thumb_name}
					fill = {thumb_fill_color}
					d = {g_cluster.g_thumbArc.svgPathFor_arcSlider}/>
			{/if}
		</svg>
	</Mouse_Responder>
</div>
<Angled_Text
	zindex = {T_Layer.paging}
	color = {angled_text_color}
	text = {g_cluster.cluster_title}
	center = {g_cluster.label_center}
	font_family = {$w_thing_fontFamily}
	font_size = {k.size.smaller_font}px
	angle = {g_sliderArc.label_text_angle}
	background_color = {text_background_color}/>