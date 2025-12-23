<script lang='ts'>
	import { h, k, s, u, x, hits, show, debug, colors, signals, elements, svgPaths } from '../../ts/common/Global_Imports';
	import { S_Element, S_Component, T_Layer, T_Hit_Target } from '../../ts/common/Global_Imports';
	import { onMount, onDestroy } from 'svelte';
	import SVG_D3 from '../draw/SVG_D3.svelte';
    export let zindex = T_Layer.dot;
	export let pointsTo_child = true;
	export let s_reveal!: S_Element;
	const { w_s_hover } = hits;
	const { w_thing_title } = s;
	const ancestry = s_reveal.ancestry;
	const g_widget = ancestry.g_widget;
	const { w_t_countDots } = show;
	const { w_items: w_grabbed } = x.si_grabs;
	const viewBox = k.tiny_outer_dots.viewBox;
	const { w_items: w_expanded } = x.si_expanded;
	const { w_thing_color, w_background_color } = colors;
	let fill_color = debug.lines ? 'transparent' : s_reveal.fill;
	let svgPathFor_tiny_outer_dots: string | null = null;
	let svgPathFor_fat_center_dot: string | null = null;
	let svg_outline_color = s_reveal.svg_outline_color;
	let element: HTMLElement | null = null;
	let bulkAlias_color = s_reveal.stroke;
	let center = g_widget.center_ofReveal;
	let svgPathFor_revealDot = k.empty;
	let color = ancestry.thing?.color;
	let offsetFor_fat_center_dot = 0;
	let s_component: S_Component;
	let wrapper_style = k.empty;
	const viewBox_left = 0;
	const size = k.height.dot;
	const viewBox_width = size;

	update_colors();

	s_component = signals.handle_reposition_widgets_atPriority(2, ancestry, T_Hit_Target.reveal, (received_ancestry) => {
		center = g_widget.center_ofReveal;
	});

	onMount(() => {
		update_svgPaths();
		s_reveal.isHovering = false;
		update_colors();
		return () => s_component.disconnect();
	});

	// Set handler when element becomes available (handles re-renders)
	$: if (!!element) {
		s_reveal.set_html_element(element);
		s_reveal.handle_s_mouse = (s_mouse) => {
			if (s_mouse.isDown && (ancestry.hasChildren || ancestry.thing.isBulkAlias)) {
				h.ancestry_toggle_expansion(ancestry);
			}
			return true;
		};
	}

	onDestroy(() => {
		hits.delete_hit_target(s_reveal);
	});
	
	$: {
		const _ = `${u.descriptionBy_titles($w_grabbed)}
			:::${u.descriptionBy_titles($w_expanded)}
			:::${$w_s_hover?.id ?? 'null'}
			:::${$w_background_color}
			:::${$w_t_countDots}
			:::${$w_thing_title}
			:::${$w_thing_color}`;
		update_svgPaths();
		update_colors();
	}

	$: {
		wrapper_style = `
			cursor: pointer;
			width: ${size}px;
			position: absolute;
			z-index: ${zindex};
			height: ${size}px;
			top: ${center.y - size / 2}px;
			left: ${center.x - size / 2}px;
		`.removeWhiteSpace();
	}

	function update_colors() {
		// element_color is now reactive (uses thing_color automatically for dots)
		// hoverColor is also reactive (computed from element_color)
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
			svgPathFor_fat_center_dot = has_fat_center_dot ? svgPaths.circle_atOffset(size, 3) : null;
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
				overflow: visible;
				width: {size}px;
				height: {size}px;
				position: relative;'>
			<div style='
				top: 0px;
				left: 0px;
				width: {size}px;
				height: {size}px;
				position: absolute;'>
				<SVG_D3 name='reveal-dot-svg'
					svgPath={svgPathFor_revealDot}
					viewBox_width={viewBox_width}
					stroke={svg_outline_color}
					left={viewBox_left}
					fill={fill_color}
					height={size}
					width={size}
					top={0}/>
			</div>
			{#if !!svgPathFor_fat_center_dot}
				<div class='fat_center-dot' style='
					left:{offsetFor_fat_center_dot}px;
					top:{offsetFor_fat_center_dot}px;
					position:absolute;
					height:{size}px;
					width:{size}px;'>
					<SVG_D3 name='fat_center-dot-svg'
						svgPath={svgPathFor_fat_center_dot}
						stroke={bulkAlias_color}
						fill={bulkAlias_color}
						height={size}
						width={size}
					/>
				</div>
			{/if}
			{#if !!svgPathFor_tiny_outer_dots}
				<div class='tiny-outer-dots' style='
					overflow:visible;
					position:absolute;
					top:{k.tiny_outer_dots.offset.y}px;
					left:{k.tiny_outer_dots.offset.x}px;
					width:{k.tiny_outer_dots.diameter}px;
					height:{k.tiny_outer_dots.diameter}px;
					z-index:0;'>
					<svg class='tiny-outer-dots-svg'
						viewBox='{viewBox}'
						preserveAspectRatio='none'
						width={k.tiny_outer_dots.diameter}px
						height={k.tiny_outer_dots.diameter}px
						style='
							position: absolute;
							shape-rendering: geometricPrecision;'>
						<path
							fill={color}
							stroke={svg_outline_color}
							d={svgPathFor_tiny_outer_dots}
							vector-effect='non-scaling-stroke'/>
					</svg>
				</div>
			{/if}
		</div>
	</div>
{/if}
