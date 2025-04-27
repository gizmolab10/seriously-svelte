<script lang='ts'>
	import { c, k, w, show, Rect, Size, Point, debug, Angle, colors, radial, signals } from '../../ts/common/Global_Imports';
	import { w_ring_rotation_radius, w_ring_rotation_angle, w_g_paging_cluster } from '../../ts/common/Stores';
	import { w_background_color, w_thing_color, w_thing_fontFamily } from '../../ts/common/Stores';
	import { T_Layer, G_Cluster, Direction } from '../../ts/common/Global_Imports';
	import { w_ancestry_focus, w_count_mouse_up } from '../../ts/common/Stores';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import Identifiable from '../../ts/runtime/Identifiable';
	import Angled_Text from '../kit/Angled_Text.svelte';
	import Gull_Wings from '../kit/Gull_Wings.svelte';
	export let color = 'red';
	export let g_cluster!: G_Cluster;
	const offset = k.radial_widget_inset;
	const g_arcSlider = g_cluster.g_arcSlider;
	const thumb_name = `thumb-${g_cluster.name}`;
	const radius = $w_ring_rotation_radius + offset;
	const viewBox=`${-offset} ${-offset} ${radius * 2} ${radius * 2}`;
	let origin = w.center_ofGraphSize.offsetBy(Point.square(-radius));
	let mouse_up_count = $w_count_mouse_up;

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
	
	$: thumbPath = g_cluster.isPaging && g_cluster.widgets_shown > 1 ? g_cluster.g_thumbArc.svgPathFor_arcSlider : '';
	$: arcSliderPath = g_arcSlider.svgPathFor_arcSlider;
	$: forkPath = g_arcSlider.svgPathFor_radialFork;
	$: labelAngle = g_arcSlider.label_text_angle;
	$: forkDirection = g_arcSlider.angle_ofFork;
	$: labelCenter = g_cluster.label_center;
	$: forkTip = g_arcSlider.tip_ofFork;

	function computed_mouse_angle(): number | null {
		return w.mouse_angle_fromGraphCenter ?? null
	}

	function handle_isHit(s_mouse: S_Mouse): boolean {
		return g_cluster.thumb_isHit;
	}

	function hover_closure(s_mouse) {
		if (s_mouse.isUp) {
			g_cluster.s_paging_rotation.reset();
		} else if (s_mouse.isDown) {
			g_cluster.s_paging_rotation.basis_angle = w.mouse_angle_fromGraphCenter;
		} else if (s_mouse.isHover) {
			g_cluster.s_paging_rotation.isHovering = true;
		}
	}

</script>

{#if g_cluster.widgets_shown > 1}
	<Gull_Wings
		zindex={T_Layer.paging}
		thickness={k.thickness.fork}
		radius={k.thickness.fork * 3}
		center={forkTip}
		direction={forkDirection}
		color={colors.specialBlend($w_ancestry_focus.thing?.color ?? colors.default_forThings, $w_background_color, k.opacity.standard)}/>
{/if}
<div class='arc-slider' style='z-index:{T_Layer.paging};'>
    <Mouse_Responder
		width = {radius * 2}
		height = {radius * 2}
		name = {g_cluster.name}
		zindex = {T_Layer.paging}
		cursor = {k.cursor_default}
		handle_isHit = {handle_isHit}
		center = {w.center_ofGraphSize}
		handle_mouse_state = {hover_closure}>
        <svg class='svg-arc-slider' viewBox={viewBox}>
            <path
                id='path-arc-slider'
                fill={$w_background_color}
                stroke-width={k.thickness.fork}
                d={arcSliderPath}
                stroke={colors.specialBlend($w_ancestry_focus.thing?.color ?? colors.default_forThings, $w_background_color, k.opacity.standard)}/>
            <path
                id='path-fork'
                fill="transparent"
                stroke={colors.specialBlend($w_ancestry_focus.thing?.color ?? colors.default_forThings, $w_background_color, k.opacity.standard)}
                stroke-width={k.thickness.fork}
                d={forkPath}/>
            {#if g_cluster.isPaging && g_cluster.widgets_shown > 1}
                <path
                    id={thumb_name}
                    d={thumbPath}
                    fill={colors.specialBlend($w_ancestry_focus.thing?.color ?? colors.default_forThings, $w_background_color, radial.s_ring_rotation.isHighlighted ? k.opacity.standard : g_cluster.s_paging_rotation.thumb_opacity)}/>
            {/if}
        </svg>
    </Mouse_Responder>
</div>
<Angled_Text
    zindex={T_Layer.paging}
    text={g_cluster.cluster_title}
    center={labelCenter}
    color={$w_ancestry_focus.thing?.color ?? colors.default_forThings}
    font_family={$w_thing_fontFamily}
    font_size={k.size.smaller_font}px
    angle={labelAngle}
    background_color={!radial.s_ring_resizing.isHovering ? $w_background_color : colors.specialBlend($w_ancestry_focus.thing?.color ?? colors.default_forThings, $w_background_color, radial.s_ring_resizing.fill_opacity)}/>