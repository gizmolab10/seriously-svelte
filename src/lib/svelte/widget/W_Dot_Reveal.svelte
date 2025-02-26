<script lang='ts'>
	import { g, k, u, ux, Size, Thing, Point, debug, signals, svgPaths, databases } from '../../ts/common/Global_Imports';
	import { T_Layer, T_Graph, Predicate, Svelte_Wrapper, T_SvelteComponent } from '../../ts/common/Global_Imports';
	import { w_ancestries_grabbed, w_ancestries_expanded, w_ancestry_showing_tools } from '../../ts/state/S_Stores';
	import { w_t_countDots, w_hierarchy, w_s_alteration } from '../../ts/state/S_Stores';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import { w_count_relayout } from '../../ts/state/S_Stores';
	import SVGD3 from '../kit/SVGD3.svelte';
	import { onMount } from 'svelte';
	export let center;
    export let ancestry;
	export let name = k.empty;
    export let zindex = T_Layer.dots;
	export let points_toChild = true;
    export let hover_isReversed = false;
	const es_reveal = ux.s_element_forName(name);		// survives onDestroy, created by widget
	const outside_tinyDots_count = ancestry.relationships_forChildren(points_toChild).length;
	let svgPathFor_outer_tinyDots: string | null = null;
	let svgPathFor_bulkAlias: string | null = null;
	let tinyDotsOffset = new Point(0.65, -0.361);
	let tinyDotsDelta = k.dot_size * -0.4 + 0.01;
	let svgPathFor_revealDot = k.empty;
	let revealWrapper!: Svelte_Wrapper;
	let bulkAliasOffset = 0;
	let dotReveal = null;
	let rebuilds = 0;
	
	function handle_context_menu(event) { event.preventDefault(); } 		// Prevent the default context menu on right

	onMount(() => {
		svgPath_update();
		set_isHovering(false);
	});

	$: {
		const _ = $w_count_relayout;
	}

	$: {
		const _ = $w_t_countDots;
		svgPath_update();
	}

	$: {
		const _ = $w_ancestries_expanded;
		svgPath_update();
	}

	$: {
		if (!!$w_ancestries_grabbed || !!ancestry.thing) {
			svgPath_update();
		}
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
			rebuilds += 1;
		}
	}

	function svgPath_update() {
		const thing = ancestry.thing;
		bulkAliasOffset = thing.isBulkAlias ? 0 : -1;
		if (thing.isBulkAlias) {
			svgPathFor_bulkAlias = svgPaths.circle_atOffset(k.dot_size, 3);
		}
		svgPathFor_outer_tinyDots = ancestry.svgPathFor_tinyDots_outsideReveal(points_toChild);
		svgPathFor_revealDot = ancestry.svgPathFor_revealDot;
		rebuilds += 1;
	}

	function up_hover_closure(s_mouse) {
		if (s_mouse.isHover) {
			set_isHovering(!s_mouse.isOut);
		} else if (s_mouse.isUp) {
			if (ancestry.toolsGrabbed) {
				$w_s_alteration = null;
				$w_ancestry_showing_tools = null;
				signals.signal_relayoutAndRecreate_widgets_fromFocus();
			} else if (ancestry.hasChildRelationships || ancestry.thing.isBulkAlias) {
				const RIGHT = ancestry.thing_isChild != ancestry.isExpanded || g.inRadialMode;
				$w_hierarchy.ancestry_rebuild_persistentMoveRight(ancestry, RIGHT, false, false, false, true);
			}
		}
	}
 
	function isHit(): boolean {
		return false
	}

	function handle_mouse_state(s_mouse: S_Mouse): boolean {
		return false;
	}

</script>

<style>
	.dot {
		border: none;
		cursor: pointer;
		background: none;
		position: absolute;
	}
</style>

{#key rebuilds}
	{#if es_reveal}
		<Mouse_Responder
			width={k.dot_size}
			height={k.dot_size}
			center={center}
			name={es_reveal.name}
			handle_mouse_state={up_hover_closure}>
			<button class='dot'
				bind:this={dotReveal}
				on:contextmenu={handle_context_menu}
				style='
					width: {k.dot_size}px;
					height: {k.dot_size}px;
					z-index: {zindex};
				'>
				{#key svgPathFor_revealDot}
					<SVGD3 name='reveal-svg'
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
					<div class='outside-tiny-dots' style='
						left:{tinyDotsDelta + tinyDotsOffset.x}px;
						top:{tinyDotsDelta + tinyDotsOffset.y}px;
						height:{k.diameterOf_outside_tinyDots}px;
						width:{k.diameterOf_outside_tinyDots}px;
						position:absolute;'>
						<SVGD3 name='outside-tiny-dots-svg'
							svgPath={svgPathFor_outer_tinyDots}
							height={k.diameterOf_outside_tinyDots}
							width={k.diameterOf_outside_tinyDots}
							stroke={ancestry.thing.color}
							fill={ancestry.thing.color}
						/>
					</div>
				{/if}
			</button>
		</Mouse_Responder>
	{/if}
{/key}