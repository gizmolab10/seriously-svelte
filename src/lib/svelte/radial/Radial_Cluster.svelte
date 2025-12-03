<script lang='ts'>
	import { k, s, hits, show, colors, radial, layout } from '../../ts/common/Global_Imports';
	import { Point, T_Layer, G_Cluster } from '../../ts/common/Global_Imports';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import Curved_Text from '../text/Curved_Text.svelte';
	import Angled_Text from '../text/Angled_Text.svelte';
	import Gull_Wings from '../draw/Gull_Wings.svelte';
	export let g_cluster: G_Cluster;
	export let color = 'red';
	const show_fat_arc = false;
	const { w_thing_fontFamily } = s;
	const s_paging = g_cluster.s_paging;
	const inset = k.radial_widget_inset;
	const { w_show_arc_sliders } = show;
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
	
	$: textBackground = $w_show_arc_sliders ? radial.s_rotation.isHighlighted ? $w_background_color : colors.specialBlend(color, $w_background_color, radial.s_resizing.fill_opacity) : 'transparent';
	$: $w_g_cluster, thumbFill = colors.specialBlend(color, $w_background_color, radial.s_rotation.isHighlighted ? k.opacity.radial.thumb : s_paging.thumb_opacity);
	$: origin = layout.center_ofGraphView.offsetBy(Point.square(-radius));
	$: viewBox=`${-inset} ${-inset} ${radius * 2} ${radius * 2}`;
	$: radius = $w_resize_radius + inset;



</script>

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
			{#if show_fat_arc}
				<path class='path-arc-fat'
					fill='transparent'
					d={g_arcSlider.svgPathFor_fatArc}
					stroke-width={k.thickness.radial.fork}
					stroke={colors.specialBlend('transparent', $w_background_color, k.opacity.radial.armature)}/>
			{/if}
			<path class='path-fork'
				fill='transparent'
				d={g_arcSlider.svgPathFor_radialFork}
				stroke-width={k.thickness.radial.fork * ($w_show_arc_sliders ? 1 : 2)}
				stroke={colors.specialBlend(color, $w_background_color, k.opacity.radial.default)}/>
			{#if $w_show_arc_sliders}
				<path class='path-arc-slider'
					fill='transparent'
					d={g_arcSlider.svgPathFor_arcSlider}
					stroke-width={k.thickness.radial.fork}
					stroke={colors.specialBlend(color, $w_background_color, k.opacity.radial.armature)}/>
				{#if g_cluster.widgets_shown > 1}
					{#if g_cluster.isPaging}
						<path class='path-thumb'
							fill={thumbFill}
							id={`thumb-${g_cluster.name}`}
							d={g_cluster.g_thumbArc.svgPathFor_arcSlider}/>
					{/if}
				{/if}
			{/if}
        </svg>
    </Mouse_Responder>
</div>
{#if $w_show_arc_sliders}
	{#if g_cluster.widgets_shown > 1}
		<Gull_Wings
			zindex={T_Layer.paging}
			radius={k.thickness.radial.fork * 3}
			center={g_arcSlider.tip_ofFork}
			direction={g_arcSlider.angle_ofFork}
			color={colors.specialBlend(color, $w_background_color, k.opacity.radial.armature)}/>
	{/if}
	<Angled_Text
		zindex={T_Layer.paging}
		text={g_cluster.cluster_title}
		center={g_cluster.label_center}
		font_family={$w_thing_fontFamily}
		background_color={textBackground}
		angle={g_arcSlider.label_text_angle}
		font_size={k.font_size.arc_slider}px
		color={colors.specialBlend(color, $w_background_color, k.opacity.radial.text)}/>
{:else}
	<Curved_Text
		viewBox={viewBox}
		zindex={T_Layer.text}
		isPaging={g_cluster.isPaging}
		text={g_cluster.cluster_title}
		name={g_cluster.predicate.kind}
		angle={-g_arcSlider.angle_ofFork}
		font_family={$w_thing_fontFamily}
		background_color={textBackground}
		radius={g_cluster.ring_radius + 8}
		font_size={k.font_size.arc_slider}px
		center_ofArc={layout.center_ofGraphView}
		color={colors.specialBlend(color, $w_background_color, k.opacity.radial.text)}/>
{/if}