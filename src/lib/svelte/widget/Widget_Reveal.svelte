<script lang='ts'>
	import { w_show_countDots_ofType, w_ancestries_grabbed, w_ancestries_expanded } from '../../ts/managers/Stores';
	import { S_Element, S_Component, T_Layer, T_Graph, T_Component } from '../../ts/common/Global_Imports';
	import { c, h, k, u, ux, debug, layout, signals, svgPaths } from '../../ts/common/Global_Imports';
	import { w_thing_title, w_thing_color, w_background_color } from '../../ts/managers/Stores';
	import { Size, Thing, Point, Predicate } from '../../ts/common/Global_Imports';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import SVG_D3 from '../draw/SVG_D3.svelte';
	import { onMount } from 'svelte';
	export let s_reveal!: S_Element;
    export let zindex = T_Layer.dots;
	export let points_toChild = true;
    export let hover_isReversed = false;
	const ancestry = s_reveal.ancestry;
	const g_widget = ancestry.g_widget;
	const tinyDotsOffset = new Point(-4.9, -2.45);
	const outer_diameter = k.diameterOf_outer_tinyDots;
	const viewBox = `0.5 2.35 ${outer_diameter} ${outer_diameter}`;
	const size_ofTinyDots = Size.width(3).expandedEquallyBy(outer_diameter)
	let fill_color = debug.lines ? 'transparent' : s_reveal.fill;
	let svgPathFor_outer_tinyDots: string | null = null;
	let svg_outline_color = s_reveal.svg_outline_color;
	let svgPathFor_innerDot: string | null = null;
	let bulkAlias_color = s_reveal.stroke;
	let center = g_widget.center_ofReveal;
	let svgPathFor_revealDot = k.empty;
	let color = ancestry.thing?.color;
	let s_component: S_Component;
	let offsetFor_innerDot = 0;
	let dotReveal = null;
	update_colors();
	
	function handle_context_menu(event) { event.preventDefault(); } 		// Prevent the default context menu on right

	onMount(() => {
		update_svgPaths();
		set_isHovering(false);
		s_component = signals.handle_reposition_widgets(2, ancestry?.hid ?? -1 as Integer, T_Component.reveal, (received_ancestry) => {
			if (!!dotReveal) {
				center = g_widget.center_ofReveal;
			}
		});
		return () => s_component.disconnect();
	});

	$: if (!!dotReveal) {
		s_component.element = dotReveal;
		s_reveal.set_forHovering(color, 'pointer');
	}
	
	$: {
		const _ = `${$w_ancestries_grabbed.map(a => a.id).join(',')}${$w_ancestries_expanded.map(a => a.id).join(',')}${$w_show_countDots_ofType}${$w_thing_title}${$w_background_color}${$w_thing_color}`;
		update_svgPaths();
		update_colors();
	}

	function update_colors() {
		s_reveal.set_forHovering(color, 'pointer');
		fill_color = debug.lines ? 'transparent' : s_reveal.fill;
		svg_outline_color = s_reveal.svg_outline_color;
		bulkAlias_color = s_reveal.stroke;
		color = ancestry.thing?.color;
		debug.log_colors(`REVEAL ${ancestry.title}${s_reveal.isInverted ? ' INVERTED' : ''}`)
	}

	function set_isHovering(hovering) {
		const corrected = (hover_isReversed != ancestry.isGrabbed) ? !hovering : hovering;
		if (!!s_reveal && s_reveal.isOut == corrected) {
			s_reveal.isOut = !corrected
			update_colors();
		}
	}

	function update_svgPaths() {
		const thing = ancestry.thing;
		if (!!thing) {
			const has_innerDot = thing.isBulkAlias;
			offsetFor_innerDot = has_innerDot ? 0 : -1;
			svgPathFor_revealDot = ancestry.svgPathFor_revealDot;
			svgPathFor_innerDot = has_innerDot ? svgPaths.circle_atOffset(k.height.dot, 3) : null;
			svgPathFor_outer_tinyDots = ancestry.svgPathFor_tinyDots_outsideReveal(points_toChild);
		}
	}

	function up_hover_closure(s_mouse) {
		if (s_mouse.isHover) {
			set_isHovering(!s_mouse.isOut);
		} else if (s_mouse.isUp && (ancestry.hasChildren || ancestry.thing.isBulkAlias)) {
			h.ancestry_toggle_expansion(ancestry);
		}
	}
 
	function isHit(): boolean {
		return false
	}

	function handle_s_mouse(s_mouse: S_Mouse): boolean {
		return false;
	}

</script>

{#if s_reveal}
	<Mouse_Responder
		center={center}
		zindex={zindex}
		name={s_reveal.name}
		width={k.height.dot}
		height={k.height.dot}
		bind:this={dotReveal}
		handle_s_mouse={up_hover_closure}>
		<div class='reveal-dot'
			on:contextmenu={handle_context_menu}
			style='
				width: {k.height.dot}px;
				height: {k.height.dot}px;'>
			<SVG_D3 name='reveal-dot-svg'
				svgPath={svgPathFor_revealDot}
				stroke={svg_outline_color}
				height={k.height.dot}
				width={k.height.dot}
				fill={fill_color}/>
			{#if !!svgPathFor_innerDot}
				<div class='bulk-alias-dot' style='
					left:{offsetFor_innerDot}px;
					top:{offsetFor_innerDot}px;
					height:{k.height.dot}px;
					width:{k.height.dot}px;
					position:absolute;'>
					<SVG_D3 name='bulk-alias-dot-svg'
						svgPath={svgPathFor_innerDot}
						stroke={bulkAlias_color}
						fill={bulkAlias_color}
						height={k.height.dot}
						width={k.height.dot}
					/>
				</div>
			{/if}
			{#if !!svgPathFor_outer_tinyDots}
				<div class='tiny-dots' style='
					height:{size_ofTinyDots.height}px;
					width:{size_ofTinyDots.width}px;
					left:{tinyDotsOffset.x}px;
					top:{tinyDotsOffset.y}px;
					position:absolute;
					z-index:0'>
					<svg class='tiny-dots-svg'
						height={size_ofTinyDots.height}px
						width={size_ofTinyDots.width}px
						viewBox='{viewBox}'
						style='
							shape-rendering: geometricPrecision;
							position: absolute;'>
						<path
							d={svgPathFor_outer_tinyDots}
							stroke={svg_outline_color}
							fill={color}/>
					</svg>
				</div>
			{/if}
		</div>
	</Mouse_Responder>
{/if}
