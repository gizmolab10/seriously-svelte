<script lang='ts'>
	import { c, k, w, show, Rect, Size, Point, debug, Angle, colors, radial, layout, signals } from '../../ts/common/Global_Imports';
	import { w_ring_rotation_radius, w_ring_rotation_angle, w_g_paging_cluster } from '../../ts/common/Stores';
	import { w_background_color, w_thing_color, w_thing_fontFamily } from '../../ts/common/Stores';
	import { T_Layer, G_Cluster, Direction } from '../../ts/common/Global_Imports';
	import { w_ancestry_focus, w_count_mouse_up } from '../../ts/common/Stores';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import Identifiable from '../../ts/runtime/Identifiable';
	import Angled_Text from '../kit/Angled_Text.svelte';
	import Gull_Wings from '../kit/Gull_Wings.svelte';
	import Arc from '../kit/Arc.svelte';
	export let color = 'red';
	export let g_cluster!: G_Cluster;
	const offset = k.radial_widget_inset;
	const g_arcSlider = g_cluster.g_arcSlider;
	const thumb_name = `thumb-${g_cluster.name}`;
	const g_paging_rotation = g_cluster.g_paging_rotation;
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
	//	& {g_arcSlider, g_thumbArc} => svg paths	//
	//												//
	//////////////////////////////////////////////////
	
	$: $w_g_paging_cluster, thumbFill = colors.specialBlend(color, $w_background_color, radial.s_ring_rotation.isHighlighted ? k.opacity.thumb : g_paging_rotation.thumb_opacity);
	$: textBackground = radial.s_ring_rotation.isHighlighted ? $w_background_color : colors.specialBlend(color, $w_background_color, radial.s_ring_resizing.fill_opacity);
	$: thumbPath = g_cluster.isPaging && g_cluster.widgets_shown > 1 ? g_cluster.g_thumbArc.svgPathFor_arcSlider : '';
	$: origin = layout.center_ofGraphSize.offsetBy(Point.square(-radius));
	$: viewBox=`${-offset} ${-offset} ${radius * 2} ${radius * 2}`;
	$: arcSliderPath = g_arcSlider.svgPathFor_arcSlider;
	$: forkPath = g_arcSlider.svgPathFor_radialFork;
	$: radius = $w_ring_rotation_radius + offset;
	$: labelAngle = g_arcSlider.label_text_angle;
	$: forkDirection = g_arcSlider.angle_ofFork;
	$: labelCenter = g_cluster.label_center;
	$: forkTip = g_arcSlider.tip_ofFork;

	function handle_isHit(s_mouse: S_Mouse): boolean { return g_cluster.isMouse_insideThumb; }

	function hover_closure(s_mouse) {
		if (s_mouse.isHover) {
			g_paging_rotation.isHovering = !s_mouse.isOut;
		}
	}

</script>

{#if g_cluster.widgets_shown > 1}
	<Gull_Wings
		center={forkTip}
		zindex={T_Layer.paging}
		direction={forkDirection}
		radius={k.thickness.fork * 3}
		color={colors.specialBlend(color, $w_background_color, k.opacity.least)}/>
{/if}
<div class='arc-slider' style='z-index:{T_Layer.paging};'>
    <Mouse_Responder
		width = {radius * 2}
		height = {radius * 2}
		name = {g_cluster.name}
		zindex = {T_Layer.paging}
		cursor = {k.cursor_default}
		handle_isHit = {handle_isHit}
		center = {layout.center_ofGraphSize}
		handle_s_mouse = {hover_closure}>
        <svg class='svg-arc-slider' viewBox={viewBox}>
            <path
                d={arcSliderPath}
                class='path-arc-slider'
                fill={$w_background_color}
                stroke-width={k.thickness.fork}
                stroke={colors.specialBlend(color, $w_background_color, k.opacity.least)}/>
            <path
                d={forkPath}
                class='path-fork'
                fill="transparent"
                stroke-width={k.thickness.fork}
                stroke={colors.specialBlend(color, $w_background_color, k.opacity.least)}/>
            {#if g_cluster.isPaging && g_cluster.widgets_shown > 1}
                <path
                    d={thumbPath}
					id={thumb_name}
                    fill={thumbFill}
                    class='path-thumb'/>
            {/if}
        </svg>
    </Mouse_Responder>
</div>
<Angled_Text
    color={color}
    angle={labelAngle}
    center={labelCenter}
    zindex={T_Layer.paging}
    text={g_cluster.cluster_title}
    background_color={textBackground}
    font_family={$w_thing_fontFamily}
    font_size={k.font_size.smaller}px/>