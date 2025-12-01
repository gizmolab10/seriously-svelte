<script lang='ts'>
	import { k, s, hits, show, colors, radial, layout } from '../../ts/common/Global_Imports';
	import { Point, T_Layer, G_Cluster } from '../../ts/common/Global_Imports';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import Angled_Text from '../text/Angled_Text.svelte';
	import Gull_Wings from '../draw/Gull_Wings.svelte';
	export let g_cluster!: G_Cluster;
	export let color = 'red';
	const { w_thing_fontFamily } = s;
	const s_paging = g_cluster.s_paging;
	const offset = k.radial_widget_inset;
	const { w_show_radial_forks } = show;
	const { w_background_color } = colors;
	const g_arcSlider = g_cluster.g_arcSlider;
	const { w_g_cluster, w_resize_radius } = radial;
	let textBackground = 'transparent';
	let thumbFill = 'transparent';

	//////////////////////////////////////////////////
	//												//
	//		draw arc, thumb, label, fork line		//
	//												//
	//	radial graph => radial rings => this		//
	//	ignores signals: {rebuild, recreate}		//
	//	uses g_cluster => {geometry, text} &		//
	//	  {g_arcSlider, g_thumbArc} => svg paths	//
	//												//
	//////////////////////////////////////////////////
	
	$: textBackground = $w_show_radial_forks ? radial.s_rotation.isHighlighted ? $w_background_color : colors.specialBlend(color, $w_background_color, radial.s_resizing.fill_opacity) : 'transparent';
	$: $w_g_cluster, thumbFill = colors.specialBlend(color, $w_background_color, radial.s_rotation.isHighlighted ? k.opacity.radial.thumb : s_paging.thumb_opacity);
	$: origin = layout.center_ofGraphView.offsetBy(Point.square(-radius));
	$: viewBox=`${-offset} ${-offset} ${radius * 2} ${radius * 2}`;
	$: radius = $w_resize_radius + offset;

</script>

{#if $w_show_radial_forks && g_cluster.widgets_shown > 1}
	<Gull_Wings
		zindex={T_Layer.paging}
		radius={k.thickness.radial.fork * 3}
		center={g_arcSlider.tip_ofFork}
		direction={g_arcSlider.angle_ofFork}
		color={colors.specialBlend(color, $w_background_color, k.opacity.radial.armature)}/>
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
		center = {layout.center_ofGraphView}>
        <svg class='svg-radial-cluster'
			viewBox={viewBox}>
            <path class='path-arc-big'
                fill='transparent'
				d={g_arcSlider.svgPathFor_bigArc}
                stroke-width={k.thickness.radial.fork}
                stroke={colors.specialBlend('transparent', $w_background_color, k.opacity.radial.armature)}/>
            <path class='path-arc-slider'
                fill='transparent'
                d={g_arcSlider.svgPathFor_arcSlider}
                stroke-width={k.thickness.radial.fork}
                stroke={colors.specialBlend(color, $w_background_color, k.opacity.radial.armature)}/>
			{#if $w_show_radial_forks}
				<path class='path-fork'
					fill='transparent'
					d={g_arcSlider.svgPathFor_radialFork}
					stroke-width={k.thickness.radial.fork}
					stroke={colors.specialBlend(color, $w_background_color, k.opacity.radial.armature)}/>
			{/if}
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
    zindex={T_Layer.paging}
    text={g_cluster.cluster_title}
    center={g_cluster.label_center}
    font_family={$w_thing_fontFamily}
    background_color={textBackground}
    angle={g_arcSlider.label_text_angle}
    font_size={k.font_size.arc_slider}px
    color={colors.specialBlend(color, $w_background_color, k.opacity.radial.text)}/>