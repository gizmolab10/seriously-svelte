<script lang='ts'>
	import { c, k, u, ux, Size, Thing, Point, debug, signals, svgPaths, databases } from '../../ts/common/Global_Imports';
	import { T_Layer, T_Graph, Predicate, Svelte_Wrapper, T_SvelteComponent } from '../../ts/common/Global_Imports';
	import { w_ancestries_grabbed, w_ancestries_expanded, w_ancestry_showing_tools } from '../../ts/common/Stores';
	import { w_hierarchy, w_t_countDots, w_s_alteration } from '../../ts/common/Stores';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import { w_background_color } from '../../ts/common/Stores';
	import SVGD3 from '../kit/SVGD3.svelte';
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
	let svgPathFor_outer_tinyDots: string | null = null;
	let svgPathFor_bulkAlias: string | null = null;
	let center = ancestry.g_widget.center_ofReveal;
	let revealWrapper!: Svelte_Wrapper;
	let svgPathFor_revealDot = k.empty;
	let bulkAliasOffset = 0;
	let reveal_rebuilds = 0;
	let dotReveal = null;
	
	function handle_context_menu(event) { event.preventDefault(); } 		// Prevent the default context menu on right

	onMount(() => {
		svgPath_update();
		set_isHovering(false);
		const handle_reposition = signals.handle_reposition_widgets(2, (received_ancestry) => {
			if (!!dotReveal) {
				center = ancestry.g_widget.center_ofReveal;
				const origin = center.offsetEquallyBy(-k.dot_size);
				debug.log_reposition(`dotReveal [. . .] o: (${origin.x.asInt()}, ${origin.y.asInt()}) ${ancestry.title}`);
				reveal_rebuilds += 1;
			}
		});
		return () => { handle_reposition.disconnect(); };
	});

	$: {
		const _ = $w_ancestries_expanded + $w_t_countDots + ancestry.title;
		svgPath_update();
	}

	$: {
		if (!!dotReveal) {
			revealWrapper = new Svelte_Wrapper(dotReveal, handle_mouse_state, ancestry.hid, T_SvelteComponent.reveal);
			es_reveal.set_forHovering(ancestry.thing.color, 'pointer');
		}
	}

	function set_isHovering(hovering) {
		const corrected = hover_isReversed ? !hovering : hovering;
		if (!!es_reveal && es_reveal.isOut == corrected) {
			es_reveal.isOut = !corrected;
			reveal_rebuilds += 1;
		}
	}

	function svgPath_update() {
		const thing = ancestry.thing;
		bulkAliasOffset = thing.isBulkAlias ? 0 : -1;
		svgPathFor_revealDot = ancestry.svgPathFor_revealDot;
		svgPathFor_outer_tinyDots = ancestry.svgPathFor_tinyDots_outsideReveal(points_toChild);
		svgPathFor_bulkAlias = thing.isBulkAlias ? svgPaths.circle_atOffset(k.dot_size, 3) : null;
		reveal_rebuilds += 1;
	}

	function up_hover_closure(s_mouse) {
		if (s_mouse.isHover) {
			set_isHovering(!s_mouse.isOut);
		} else if (s_mouse.isUp && (ancestry.hasChildRelationships || ancestry.thing.isBulkAlias)) {
			const RIGHT = ancestry.thing_isChild != ancestry.isExpanded || ux.inRadialMode;
			$w_hierarchy.ancestry_rebuild_persistentMoveRight(ancestry, RIGHT, false, false, false, true);
		}
	}
 
	function isHit(): boolean {
		return false
	}

	function handle_mouse_state(s_mouse: S_Mouse): boolean {
		return false;
	}

</script>

{#key reveal_rebuilds}
	{#if es_reveal}
		<Mouse_Responder
			center={center}
			zindex={zindex}
			width={k.dot_size}
			height={k.dot_size}
			name={es_reveal.name}
			bind:this={dotReveal}
			handle_mouse_state={up_hover_closure}>
			<div class='reveal-dot'
				on:contextmenu={handle_context_menu}
				style='
					width: {k.dot_size}px;
					height: {k.dot_size}px;
				'>
				{#key svgPathFor_revealDot + $w_background_color}
					<SVGD3 name='reveal-dot-svg'
						fill={debug.lines ? 'transparent' : es_reveal.fill}
						svgPath={svgPathFor_revealDot}
						stroke={ancestry.thing.color}
						height={k.dot_size}
						width={k.dot_size}
					/>
				{/key}
				{#if !!svgPathFor_bulkAlias}
					<div class='bulk-alias-dot' style='
						left:{bulkAliasOffset}px;
						top:{bulkAliasOffset}px;
						position:absolute;
						height:{k.dot_size}px;
						width:{k.dot_size}px;'>
						<SVGD3 name='bulk-alias-dot-svg'
							svgPath={svgPathFor_bulkAlias}
							stroke={es_reveal.stroke}
							fill={es_reveal.stroke}
							height={k.dot_size}
							width={k.dot_size}
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
								position: absolute;
								shape-rendering: geometricPrecision;'>
							<path
								d={svgPathFor_outer_tinyDots}
								fill={ancestry.thing.color}
								stroke={ancestry.thing.color}
							/>
						</svg>
					</div>
				{/if}
			</div>
		</Mouse_Responder>
	{/if}
{/key}