<script lang='ts'>
	import { e, h, k, s, u, x, hits, show, debug, colors, signals, elements, svgPaths } from '../../ts/common/Global_Imports';
	import { S_Mouse, S_Element, S_Component, T_Layer, T_Hit_Target } from '../../ts/common/Global_Imports';
	import { Size, Point } from '../../ts/common/Global_Imports';
	import { onMount, onDestroy } from 'svelte';
	import SVG_D3 from '../draw/SVG_D3.svelte';
    export let zindex = T_Layer.dot;
	export let pointsTo_child = true;
	export let s_reveal!: S_Element;
	const { w_s_hover } = hits;
	const { w_thing_title } = s;
	const ancestry = s_reveal.ancestry;
	const g_widget = ancestry.g_widget;
	const { w_count_mouse_up } = e;
	const { w_show_countDots_ofType } = show;
	const { w_items: w_grabbed } = x.si_grabs;
	const viewBox = k.tiny_outer_dots.viewBox;
	const { w_items: w_expanded } = x.si_expanded;
	const { w_thing_color, w_background_color } = colors;
	let fill_color = debug.lines ? 'transparent' : s_reveal.fill;
	let svgPathFor_tiny_outer_dots: string | null = null;
	let svgPathFor_fat_center_dot: string | null = null;
	let svg_outline_color = s_reveal.svg_outline_color;
	let mouse_up_count = $w_count_mouse_up;
	let element: HTMLElement | null = null;
	let bulkAlias_color = s_reveal.stroke;
	let center = g_widget.center_ofReveal;
	let svgPathFor_revealDot = k.empty;
	let color = ancestry.thing?.color;
	let offsetFor_fat_center_dot = 0;
	let s_component: S_Component;

	update_colors();

	s_component = signals.handle_reposition_widgets_atPriority(2, ancestry, T_Hit_Target.reveal, (received_ancestry) => {
		center = g_widget.center_ofReveal;
	});

	onMount(() => {
		update_svgPaths();
		s_reveal.isHovering = false;
		update_colors();
		s_reveal.set_forHovering(color, 'pointer');
		if (!!element) {
			s_reveal.set_html_element(element);
		}
		return () => s_component.disconnect();
	});

	onDestroy(() => {
		hits.delete_hit_target(s_reveal);
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

	$: if (mouse_up_count != $w_count_mouse_up) {
		mouse_up_count = $w_count_mouse_up;
		if ($w_s_hover?.id === s_reveal.id && (ancestry.hasChildren || ancestry.thing.isBulkAlias)) {
			h.ancestry_toggle_expansion(ancestry);
		}
	}

	$: wrapper_style = `
		position: absolute;
		width: ${k.height.dot}px;
		height: ${k.height.dot}px;
		z-index: ${zindex};
		cursor: pointer;
		left: ${center.x - k.height.dot / 2}px;
		top: ${center.y - k.height.dot / 2}px;
	`.removeWhiteSpace();

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
			svgPathFor_tiny_outer_dots = ancestry.svgPathFor_tiny_outer_dot_pointTo_child(pointsTo_child);
			svgPathFor_fat_center_dot = has_fat_center_dot ? svgPaths.circle_atOffset(k.height.dot, 3) : null;
		}
	}

</script>

{#if s_reveal}
	<div class='reveal-responder'
		style={wrapper_style}
		bind:this={element}>
		<div class='reveal-dot'
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
	</div>
{/if}
