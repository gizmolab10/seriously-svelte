<script lang='ts'>
	import { c, k, s, show, Rect, Size, Point, debug, Angle, colors, radial, layout, signals } from '../../ts/common/Global_Imports';
	import { T_Layer, G_Cluster, Direction } from '../../ts/common/Global_Imports';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import Identifiable from '../../ts/runtime/Identifiable';
	import Angled_Text from '../text/Angled_Text.svelte';
	import Gull_Wings from '../draw/Gull_Wings.svelte';
	import Arc from '../draw/Arc.svelte';
	export let color = 'red';
	export let g_cluster!: G_Cluster;
	const offset = k.radial_widget_inset;
	const { w_background_color } = colors;
	const g_sliderArc = g_cluster.g_sliderArc;
	const { w_count_mouse_up, w_thing_fontFamily } = s;
	const s_paging_rotation = g_cluster.s_paging_rotation;
	const { w_g_paging_cluster, w_ring_rotation_radius } = layout;
	let mouse_up_count = $w_count_mouse_up;
	let textBackground = 'transparent';
	let thumbFill = 'transparent';

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
	
	$: $w_g_paging_cluster, thumbFill = colors.specialBlend(color, $w_background_color, radial.s_ring_rotation.isHighlighted ? k.opacity.radial.thumb : s_paging_rotation.thumb_opacity);
	$: textBackground = radial.s_ring_rotation.isHighlighted ? $w_background_color : colors.specialBlend(color, $w_background_color, radial.s_ring_resizing.fill_opacity);
	$: origin = layout.center_ofGraphView.offsetBy(Point.square(-radius));
	$: viewBox=`${-offset} ${-offset} ${radius * 2} ${radius * 2}`;
	$: radius = $w_ring_rotation_radius + offset;

	function handle_s_mouse(s_mouse) {
		if (s_mouse.hover_didChange) {
			s_paging_rotation.isHovering = s_mouse.isHovering;
		}
	}

</script>

{#if g_cluster.widgets_shown > 1}
	<Gull_Wings
		zindex={T_Layer.paging}
		radius={k.thickness.radial.fork * 3}
		center={g_sliderArc.tip_ofFork}
		direction={g_sliderArc.angle_ofFork}
		color={colors.specialBlend(color, $w_background_color, k.opacity.radial.least)}/>
{/if}
<div class='radial-cluster'
	style='
		z-index:{T_Layer.paging};
		background-color: transparent;'>
    <Mouse_Responder
		width = {radius * 2}
		height = {radius * 2}
		name = {g_cluster.name}
		zindex = {T_Layer.paging}
		cursor = {k.cursor_default}
		handle_s_mouse = {handle_s_mouse}
		center = {layout.center_ofGraphView}>
        <svg class='svg-radial-cluster'
			viewBox={viewBox}>
            <path class='path-arc-big'
                fill='transparent'
                stroke-width={k.thickness.radial.fork}
				d={g_sliderArc.svgPathFor_bigArc}
                stroke={colors.specialBlend('transparent', $w_background_color, k.opacity.radial.least)}/>
            <path class='path-arc-slider'
                fill='transparent'
                stroke-width={k.thickness.radial.fork}
                d={g_sliderArc.svgPathFor_arcSlider}
                stroke={colors.specialBlend(color, $w_background_color, k.opacity.radial.least)}/>
            <path class='path-fork'
                fill='transparent'
                stroke-width={k.thickness.radial.fork}
                d={g_sliderArc.svgPathFor_radialFork}
                stroke={colors.specialBlend(color, $w_background_color, k.opacity.radial.least)}/>
            {#if g_cluster.isPaging && g_cluster.widgets_shown > 1}
                <path class='path-thumb'
					fill={thumbFill}
					id={`thumb-${g_cluster.name}`}
                    d={g_cluster.g_thumbArc.svgPathFor_arcSlider}/>
            {/if}
        </svg>
    </Mouse_Responder>
</div>
<Angled_Text
    color={colors.specialBlend(color, $w_background_color, k.opacity.radial.text)}
    zindex={T_Layer.paging}
    text={g_cluster.cluster_title}
    center={g_cluster.label_center}
    font_family={$w_thing_fontFamily}
    background_color={textBackground}
    angle={g_sliderArc.label_text_angle}
    font_size={k.font_size.arc_slider}px/>