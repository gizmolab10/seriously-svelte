<script lang='ts'>
	import { Point, T_Layer, G_Cluster, T_Cluster_Pager } from '../../ts/common/Global_Imports';
	import { k, s, u, colors, radial, g } from '../../ts/common/Global_Imports';
	import Cluster_Pager from '../mouse/Cluster_Pager.svelte';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import Curved_Text from '../text/Curved_Text.svelte';
	import Angled_Text from '../text/Angled_Text.svelte';
	import Gull_Wings from '../draw/Gull_Wings.svelte';
	export let g_cluster: G_Cluster;
	export let color = 'red';
	const show_fat_arc = false;
	const s_paging = g_cluster.s_paging;
	const inset = k.radial_widget_inset;
	const { w_background_color } = colors;
	const { w_g_cluster, w_resize_radius } = radial;
	const { w_t_cluster_pager, w_thing_fontFamily } = s;
	const g_cluster_pager = g_cluster.g_cluster_pager;
	let textBackground = 'transparent';
	let thumbFill = 'transparent';

	//////////////////////////////////////////////////////
	//													//
	//		draw arc, thumb, label, fork line			//
	//													//
	//	radial graph => radial rings => this			//
	//	ignores signals: {rebuild, recreate}			//
	//	uses g_cluster => {geometry, text} &			//
	//	  {g_cluster_pager, g_thumbArc} => svg paths	//
	//													//
	//////////////////////////////////////////////////////
	
	$: textBackground = $w_t_cluster_pager ? radial.s_rotation.isHighlighted ? $w_background_color : colors.specialBlend(color, $w_background_color, radial.s_resizing.fill_opacity) : 'transparent';
	$: $w_g_cluster, thumbFill = colors.specialBlend(color, $w_background_color, radial.s_rotation.isHighlighted ? k.opacity.radial.thumb : s_paging.thumb_opacity);
	$: origin = g.center_ofGraphView.offsetBy(Point.square(-radius));
	$: viewBox=`${-inset} ${-inset} ${radius * 2} ${radius * 2}`;
	$: radius = $w_resize_radius + inset;

	// Compute arc layout for pagers (when not using sliders)
	$: pager_font_size = `${k.font_size.cluster_slider}px`;
	$: arcLength = u.getWidth_ofString_withSize(g_cluster.cluster_title, pager_font_size) * 1.3;
	$: pager_radius = radial.ring_radius + 8;
	$: pager_angle = -g_cluster_pager.angle_ofFork;
	$: ({ start_thumb_transform, end_thumb_transform } = g_cluster_pager.layout_endpoints_onArc(pager_radius, pager_angle, arcLength));
	$: pager_color = colors.specialBlend(color, $w_background_color, k.opacity.radial.text);

	function handle_page(delta: number) {
		g_cluster.g_focusPaging?.addTo_paging_index_for(delta);
		g.layout();
	}

	function handle_backward() { handle_page(-1); }
	function handle_forward() { handle_page(1); }

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
		center = {g.center_ofGraphView}>
        <svg class='svg-radial-cluster'
			viewBox={viewBox}>
			{#if show_fat_arc}
				<path class='path-arc-fat'
					fill='transparent'
					d={g_cluster_pager.svgPathFor_fatArc}
					stroke-width={k.thickness.radial.fork}
					stroke={colors.specialBlend('transparent', $w_background_color, k.opacity.radial.armature)}/>
			{/if}
			<path class='path-fork'
				fill='transparent'
				d={g_cluster_pager.svgPathFor_radialFork}
				stroke-width={k.thickness.radial.fork * ($w_t_cluster_pager == T_Cluster_Pager.sliders ? 1 : 2)}
				stroke={colors.specialBlend(color, $w_background_color, k.opacity.radial.default)}/>
			{#if $w_t_cluster_pager == T_Cluster_Pager.sliders}
				<path class='path-arc-slider'
					fill='transparent'
					d={g_cluster_pager.svgPathFor_arcSlider}
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
{#if $w_t_cluster_pager == T_Cluster_Pager.sliders}
	{#if g_cluster.widgets_shown > 1}
		<Gull_Wings
			zindex={T_Layer.paging}
			radius={k.thickness.radial.fork * 3}
			center={g_cluster_pager.tip_ofFork}
			direction={g_cluster_pager.angle_ofFork}
			color={colors.specialBlend(color, $w_background_color, k.opacity.radial.armature)}/>
	{/if}
	<Angled_Text
		zindex={T_Layer.paging}
		text={g_cluster.cluster_title}
		center={g_cluster.label_center}
		font_family={$w_thing_fontFamily}
		background_color={textBackground}
		angle={g_cluster_pager.label_text_angle}
		font_size={k.font_size.cluster_slider}px
		color={colors.specialBlend(color, $w_background_color, k.opacity.radial.text)}/>
{:else}
	<Curved_Text
		zindex={T_Layer.text}
		text={g_cluster.cluster_title}
		radius={radial.ring_radius + 8}
		g_cluster_pager={g_cluster_pager}
		font_family={$w_thing_fontFamily}
		background_color={textBackground}
		center_ofArc={g.center_ofGraphView}
		angle={-g_cluster_pager.angle_ofFork}
		font_size={k.font_size.cluster_slider}px
		color={colors.specialBlend(color, $w_background_color, k.opacity.radial.text)}/>
	{#if g_cluster.isPaging}
		<svg class='pager-container'
			style='position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; z-index: {T_Layer.paging};'>
			<Cluster_Pager
				color={pager_color}
				viewBox={viewBox}
				size={k.height.dot}
				direction='backward'
				name={g_cluster.name + '-start'}
				handle_click={handle_backward}
				thumbTransform={start_thumb_transform}/>
			<Cluster_Pager
				color={pager_color}
				viewBox={viewBox}
				direction='forward'
				size={k.height.dot}
				name={g_cluster.name + '-end'}
				handle_click={handle_forward}
				thumbTransform={end_thumb_transform}/>
		</svg>
	{/if}
{/if}
