<script lang='ts'>
	import { c, k, u, ux, Size, Thing, Point, debug, layout, signals, svgPaths, databases } from '../../ts/common/Global_Imports';
	import { w_ancestries_grabbed, w_ancestries_expanded, w_ancestry_showing_tools } from '../../ts/common/Stores';
	import { w_hierarchy, w_t_countDots, w_s_alteration } from '../../ts/common/Stores';
	import { w_thing_color, w_background_color } from '../../ts/common/Stores';
	import { T_Layer, T_Graph, Predicate } from '../../ts/common/Global_Imports';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import SVG_D3 from '../kit/SVG_D3.svelte';
	import { onMount } from 'svelte';
    export let ancestry;
	export let name = k.empty;
    export let zindex = T_Layer.dots;
	export let points_toChild = true;
    export let hover_isReversed = false;
	const tinyDotsOffset = new Point(-5, -2.6);
	const es_reveal = ux.s_element_forName(name);
	const outer_diameter = k.diameterOf_outer_tinyDots;
	const size_ofTinyDots = Size.width(3).expandedEquallyBy(outer_diameter)
	const viewBox = `0.5 2.35 ${outer_diameter} ${outer_diameter}`;
	let fill_color = debug.lines ? 'transparent' : es_reveal.fill;
	let svgPathFor_outer_tinyDots: string | null = null;
	let svgPathFor_bulkAlias: string | null = null;
	let center = ancestry.g_widget.center_ofReveal;
	let bulkAlias_color = es_reveal.stroke;
	let svgPathFor_revealDot = k.empty;
	let color = ancestry.thing?.color;
	let bulkAliasOffset = 0;
	let dotReveal = null;
	
	function handle_context_menu(event) { event.preventDefault(); } 		// Prevent the default context menu on right

	onMount(() => {
		svgPath_update();
		set_isHovering(false);
		const handle_reposition = signals.handle_reposition_widgets(2, (received_ancestry) => {
			if (!!dotReveal) {
				center = ancestry.g_widget.center_ofReveal;
			}
		});
		return () => { handle_reposition.disconnect(); };
	});

	$: {
		const _ = $w_ancestries_expanded + $w_t_countDots + ancestry.title;
		svgPath_update();
	}

	$: {
		const _ = $w_ancestries_expanded + $w_background_color + $w_thing_color;
		fill_color = debug.lines ? 'transparent' : es_reveal.fill;
		es_reveal.set_forHovering(color, 'pointer');
		bulkAlias_color = es_reveal.stroke;
		color = ancestry.thing?.color;
	}

	$: {
		if (!!dotReveal) {
			es_reveal.set_forHovering(color, 'pointer');
		}
	}

	function set_isHovering(hovering) {
		const corrected = hover_isReversed ? !hovering : hovering;
		if (!!es_reveal && es_reveal.isOut == corrected) {
			es_reveal.isOut = !corrected;
		}
	}

	function svgPath_update() {
		const thing = ancestry.thing;
		bulkAliasOffset = thing.isBulkAlias ? 0 : -1;
		svgPathFor_revealDot = ancestry.svgPathFor_revealDot;
		svgPathFor_outer_tinyDots = ancestry.svgPathFor_tinyDots_outsideReveal(points_toChild);
		svgPathFor_bulkAlias = thing.isBulkAlias ? svgPaths.circle_atOffset(k.size.dot, 3) : null;
	}

	function up_hover_closure(s_mouse) {
		if (s_mouse.isHover) {
			set_isHovering(!s_mouse.isOut);
		} else if (s_mouse.isUp && (ancestry.hasChildren || ancestry.thing.isBulkAlias)) {
			const RIGHT = !ancestry.isExpanded || layout.inRadialMode;
			$w_hierarchy.ancestry_rebuild_persistentMoveRight(ancestry, RIGHT, false, false, false, true);
		}
	}
 
	function isHit(): boolean {
		return false
	}

	function handle_s_mouse(s_mouse: S_Mouse): boolean {
		return false;
	}

</script>

{#if es_reveal}
	<Mouse_Responder
		center={center}
		zindex={zindex}
		width={k.size.dot}
		height={k.size.dot}
		name={es_reveal.name}
		bind:this={dotReveal}
		handle_s_mouse={up_hover_closure}>
		<div class='reveal-dot'
			on:contextmenu={handle_context_menu}
			style='
				width: {k.size.dot}px;
				height: {k.size.dot}px;'>
			<SVG_D3 name='reveal-dot-svg'
				svgPath={svgPathFor_revealDot}
				height={k.size.dot}
				width={k.size.dot}
				fill={fill_color}
				stroke={color}/>
			{#if !!svgPathFor_bulkAlias}
				<div class='bulk-alias-dot' style='
					left:{bulkAliasOffset}px;
					top:{bulkAliasOffset}px;
					height:{k.size.dot}px;
					width:{k.size.dot}px;
					position:absolute;'>
					<SVG_D3 name='bulk-alias-dot-svg'
						svgPath={svgPathFor_bulkAlias}
						stroke={bulkAlias_color}
						fill={bulkAlias_color}
						height={k.size.dot}
						width={k.size.dot}
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
							stroke={color}
							fill={color}/>
					</svg>
				</div>
			{/if}
		</div>
	</Mouse_Responder>
{/if}
