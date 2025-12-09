<script lang='ts'>
	import { Point, T_Layer, G_Cluster, T_Cluster_Pager } from '../../ts/common/Global_Imports';
	import { k, s, u, colors, radial, g } from '../../ts/common/Global_Imports';
	import Cluster_Pager from '../mouse/Cluster_Pager.svelte';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import Curved_Text from '../text/Curved_Text.svelte';
	import Gull_Wings from '../draw/Gull_Wings.svelte';
	import { onDestroy } from 'svelte';
	export let g_cluster: G_Cluster;
	export let color = 'red';
	const show_fat_arc = false;
	const s_paging = g_cluster.s_paging;
	const inset = k.radial_widget_inset;
	const { w_background_color } = colors;
	const { w_g_cluster, w_resize_radius } = radial;
	const g_cluster_pager = g_cluster.g_cluster_pager;
	const { w_t_cluster_pager, w_thing_fontFamily } = s;
	let thumbFill = 'transparent';
	let pager_offset = 8;

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
	$: ({ start_thumb_transform, end_thumb_transform } = g_cluster_pager.layout_endpoints_onArc(curved_text_radius, pager_angle, arcLength));
	$: $w_t_cluster_pager, pager_offset = ($w_t_cluster_pager == T_Cluster_Pager.sliders) ? -8 : 8;
	$: arcLength = u.getWidth_ofString_withSize(g_cluster.cluster_title, pager_font_size) * 1.3;
	$: pager_color = colors.specialBlend(color, $w_background_color, k.opacity.radial.text);
	$: origin = g.center_ofGraphView.offsetBy(Point.square(-radius));
	$: viewBox=`${-inset} ${-inset} ${radius * 2} ${radius * 2}`;
	$: curved_text_radius = $w_resize_radius + pager_offset;
	$: pager_font_size = `${k.font_size.cluster_slider}px`;
	$: pager_angle = -g_cluster_pager.angle_ofFork;
	$: radius = $w_resize_radius + inset;

	const unsubscribe = w_t_cluster_pager.subscribe(value => {
		pager_offset = (value == T_Cluster_Pager.sliders) ? -2 : 8;
	});

	onDestroy(unsubscribe);

	function handle_page(delta: number) {
		g_cluster.g_paging?.addTo_paging_index_for(delta);
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
<Curved_Text
	zindex={T_Layer.text}
	radius={curved_text_radius}
	text={g_cluster.cluster_title}
	g_cluster_pager={g_cluster_pager}
	font_family={$w_thing_fontFamily}
	background_color={textBackground}
	center_ofArc={g.center_ofGraphView}
	angle={-g_cluster_pager.angle_ofFork}
	font_size={k.font_size.cluster_slider}px
	color={colors.specialBlend(color, $w_background_color, k.opacity.radial.text)}/>
{#if $w_t_cluster_pager == T_Cluster_Pager.steppers && g_cluster.isPaging}
	<svg class='pager-container'
		style='
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			overflow: visible;
			position: absolute;
			pointer-events: none;
			z-index: {T_Layer.text};'>
		<Cluster_Pager
			viewBox={viewBox}
			size={k.height.dot}
			color={pager_color}
			direction='backward'
			handle_click={handle_backward}
			name={g_cluster.name + '-start'}
			thumbTransform={start_thumb_transform}/>
		<Cluster_Pager
			viewBox={viewBox}
			direction='forward'
			size={k.height.dot}
			color={pager_color}
			handle_click={handle_forward}
			name={g_cluster.name + '-end'}
			thumbTransform={end_thumb_transform}/>
	</svg>
{/if}
