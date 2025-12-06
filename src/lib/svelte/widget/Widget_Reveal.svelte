<script lang='ts'>
	import { h, k, s, u, x, hits, show, debug, colors, signals, elements, svgPaths } from '../../ts/common/Global_Imports';
	import { S_Mouse, S_Element, S_Component, T_Layer, T_Hit_Target } from '../../ts/common/Global_Imports';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import { Size, Point } from '../../ts/common/Global_Imports';
	import SVG_D3 from '../draw/SVG_D3.svelte';
	import { onMount } from 'svelte';
    export let zindex = T_Layer.dots;
	export let points_toChild = true;
	export let s_reveal!: S_Element;
	const { w_s_hover } = hits;
	const { w_thing_title } = s;
	const ancestry = s_reveal.ancestry;
	const g_widget = ancestry.g_widget;
	const { w_show_countDots_ofType } = show;
	const { w_items: w_grabbed } = x.si_grabs;
	const viewBox = k.tiny_outer_dots.viewBox;
	const { w_items: w_expanded } = x.si_expanded;
	const { w_thing_color, w_background_color } = colors;
	let fill_color = debug.lines ? 'transparent' : s_reveal.fill;
	let svgPathFor_tiny_outer_dots: string | null = null;
	let svgPathFor_fat_center_dot: string | null = null;
	let svg_outline_color = s_reveal.svg_outline_color;
	let bulkAlias_color = s_reveal.stroke;
	let center = g_widget.center_ofReveal;
	let svgPathFor_revealDot = k.empty;
	let color = ancestry.thing?.color;
	let s_component: S_Component;
	let offsetFor_fat_center_dot = 0;

	update_colors();

	s_component = signals.handle_reposition_widgets_atPriority(2, ancestry, T_Hit_Target.reveal, (received_ancestry) => {
		center = g_widget.center_ofReveal;
	});

	onMount(() => {
		update_svgPaths();
		s_reveal.isHovering = false;
		update_colors();
		s_reveal.set_forHovering(color, 'pointer');
		return () => s_component.disconnect();
	});
	
	$: {
		const _ = `${u.descriptionBy_titles($w_grabbed)}
			:::${u.descriptionBy_titles($w_expanded)}
			:::${$w_s_hover?.id ?? 'null'}
			:::${$w_show_countDots_ofType}
			:::${$w_background_color}
			:::${$w_thing_title}
			:::${$w_thing_color}`;
		update_svgPaths();
		update_colors();
	}
	
	function handle_context_menu(event) { u.consume_event(event); } 		// Prevent the default context menu on right

	function update_colors() {
		s_reveal.set_forHovering(color, 'pointer');
		fill_color = debug.lines ? 'transparent' : s_reveal.fill;
		svg_outline_color = s_reveal.svg_outline_color;
		bulkAlias_color = s_reveal.stroke;
		color = ancestry.thing?.color;
		debug.log_colors(`REVEAL ${ancestry.title}${s_reveal.isInverted ? ' INVERTED' : ''}`)
	}

	function update_svgPaths() {
		const thing = ancestry.thing;
		if (!!thing) {
			const has_fat_center_dot = thing.isBulkAlias || ancestry.hidden_by_depth_limit;
			offsetFor_fat_center_dot = has_fat_center_dot ? 0 : -1;
			svgPathFor_revealDot = ancestry.svgPathFor_revealDot;
			svgPathFor_tiny_outer_dots = ancestry.svgPathFor_tiny_outer_dots_points_toChild(points_toChild);
			svgPathFor_fat_center_dot = has_fat_center_dot ? svgPaths.circle_atOffset(k.height.dot, 3) : null;
		}
	}

	function handle_s_mouse(s_mouse) {
		if (s_mouse.isUp && (ancestry.hasChildren || ancestry.thing.isBulkAlias)) {
			h.ancestry_toggle_expansion(ancestry);
		}
	}
 
	function isHit(): boolean {
		return false
	}

</script>

{#if s_reveal}
	<Mouse_Responder
		center={center}
		zindex={zindex}
		s_element={s_reveal}
		width={k.height.dot}
		height={k.height.dot}
		name={s_component.id}
		handle_s_mouse={handle_s_mouse}>
		<div class='reveal-dot'
			on:contextmenu={handle_context_menu}
			role="button"
			tabindex="0"
			style='
				width: {k.height.dot}px;
				height: {k.height.dot}px;'>
			<SVG_D3 name='reveal-dot-svg'
				svgPath={svgPathFor_revealDot}
				stroke={svg_outline_color}
				height={k.height.dot}
				width={k.height.dot}
				fill={fill_color}/>
			{#if !!svgPathFor_fat_center_dot}
				<div class='fat_center-dot' style='
					left:{offsetFor_fat_center_dot}px;
					top:{offsetFor_fat_center_dot}px;
					height:{k.height.dot}px;
					width:{k.height.dot}px;
					position:absolute;'>
					<SVG_D3 name='fat_center-dot-svg'
						svgPath={svgPathFor_fat_center_dot}
						stroke={bulkAlias_color}
						fill={bulkAlias_color}
						height={k.height.dot}
						width={k.height.dot}
					/>
				</div>
			{/if}
			{#if !!svgPathFor_tiny_outer_dots}
				<div class='tiny-outer-dots' style='
					height:{k.tiny_outer_dots.size.height}px;
					width:{k.tiny_outer_dots.size.width}px;
					left:{k.tiny_outer_dots.offset.x}px;
					top:{k.tiny_outer_dots.offset.y}px;
					position:absolute;
					z-index:0'>
					<svg class='tiny-outer-dots-svg'
						height={k.tiny_outer_dots.size.height}px
						width={k.tiny_outer_dots.size.width}px
						viewBox='{viewBox}'
						style='
							shape-rendering: geometricPrecision;
							position: absolute;'>
						<path
							d={svgPathFor_tiny_outer_dots}
							stroke={svg_outline_color}
							fill={color}/>
					</svg>
				</div>
			{/if}
		</div>
	</Mouse_Responder>
{/if}

