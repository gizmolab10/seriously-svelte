<script lang='ts'>
	import { k, u, ux, show, Size, Thing, Point, debug, signals, svgPaths, databases } from '../../ts/common/Global_Imports';
	import { Predicate, Svelte_Wrapper, T_Layer, T_Graph, T_SvelteComponent } from '../../ts/common/Global_Imports';
	import { s_ancestries_grabbed, s_ancestries_expanded, s_ancestry_showing_tools } from '../../ts/state/S_Stores';
	import { s_hierarchy, s_t_graph, s_s_alteration } from '../../ts/state/S_Stores';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import SVGD3 from '../kit/SVGD3.svelte';
	import { onMount } from 'svelte';
	export let center;
    export let ancestry;
	export let name = k.empty;
    export let zindex = T_Layer.dots;
	export let points_toChild = true;
    export let hover_isReversed = false;
	const outside_tinyDots_count = ancestry.relationships_forChildren(points_toChild).length;
	const element_state = ux.element_state_forName(name);		// survives onDestroy, created by widget
	const size = k.dot_size;
	let svgPathFor_insideReveal = svgPaths.circle_atOffset(16, 6);
	let tinyDotsOffset = new Point(0.65, -0.361);
	let tinyDotsDelta = size * -0.4 + 0.01;
	let svgPathFor_revealDot = k.empty;
	let revealWrapper!: Svelte_Wrapper;
	let tinyDotsDiameter = size * 1.8;
	let hasInsidePath = false;
	let insideOffset = 0;
	let dotReveal = null;
	let rebuilds = 0;
	
	console.log(`reveal ${outside_tinyDots_count} ${points_toChild ? 'children' : 'parents'} ${ancestry.title}`)
	function handle_context_menu(event) { event.preventDefault(); } 		// Prevent the default context menu on right

	onMount(() => {
		svgPath_update();
		set_isHovering(false);
	});

	$: {
		if (!!dotReveal) {
			revealWrapper = new Svelte_Wrapper(dotReveal, handle_mouse_state, ancestry.hid, T_SvelteComponent.reveal);
			element_state.set_forHovering(ancestry.thing.color, 'pointer');
		}
	}

	$: {
		const _ = $s_ancestries_expanded;
		svgPath_update();
	}

	$: {
		if (!!$s_ancestries_grabbed || !!ancestry.thing) {
			svgPath_update();
		}
	}

	function set_isHovering(hovering) {
		const corrected = hover_isReversed ? !hovering : hovering;
		if (!!element_state && element_state.isOut == corrected) {
			element_state.isOut = !corrected;
			rebuilds += 1;
		}
	}

	function svgPath_update() {
		const thing = ancestry.thing;
		hasInsidePath = thing.isBulkAlias;
		insideOffset = hasInsidePath ? 0 : -1;
		if (!ancestry.showsReveal) {
			svgPathFor_revealDot = svgPaths.circle_atOffset(size, size - 1);
		} else {
			svgPathFor_revealDot = svgPaths.fat_polygon(size, ancestry.direction_ofReveal);
		}
		if (hasInsidePath) {
			svgPathFor_insideReveal = svgPaths.circle_atOffset(size, 3);
		}
	}

	function up_hover_closure(mouse_state) {
		if (mouse_state.isHover) {
			set_isHovering(!mouse_state.isOut);
		} else if (mouse_state.isUp) {
			if (ancestry.toolsGrabbed) {
				$s_s_alteration = null;
				$s_ancestry_showing_tools = null;
				signals.signal_relayoutWidgets_fromFocus();
			} else if (ancestry.hasChildRelationships || ancestry.thing.isBulkAlias) {
				const RIGHT = ancestry.thing_isChild != ancestry.isExpanded || $s_t_graph == T_Graph.radial;
				$s_hierarchy.ancestry_rebuild_persistentMoveRight(ancestry, RIGHT, false, false, false, true);
			}
		}
	}
 
	function isHit(): boolean {
		return false
	}

	function handle_mouse_state(mouse_state: S_Mouse): boolean {
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
	{#if element_state}
		<Mouse_Responder
			width={size}
			height={size}
			center={center}
			name={element_state.name}
			mouse_state_closure={up_hover_closure}>
			<button class='dot'
				bind:this={dotReveal}
				on:contextmenu={handle_context_menu}
				style='
					width: {size}px;
					height: {size}px;
					z-index: {zindex};
				'>
				{#key svgPathFor_revealDot}
					<SVGD3 name='reveal-svg'
						fill={debug.lines ? 'transparent' : element_state.fill}
						svgPath={svgPathFor_revealDot}
						stroke={ancestry.thing.color}
						height={size}
						width={size}
					/>
				{/key}
				{#if show.tiny_dots}
					{#if hasInsidePath}
						<div class='inside-tiny-dots' style='
							left:{insideOffset}px;
							top:{insideOffset}px;
							position:absolute;
							height:{size}px;
							width:{size}px;'>
							<SVGD3 name='inside-tiny-dots-svg'
								svgPath={svgPathFor_insideReveal}
								stroke={element_state.stroke}
								fill={element_state.stroke}
								height={size}
								width={size}
							/>
						</div>
					{/if}
					{#if (!ancestry.isExpanded || $s_t_graph == T_Graph.radial) && ancestry.hasChildRelationships}
						<div class='outside-tiny-dots' style='
							left:{tinyDotsDelta + tinyDotsOffset.x}px;
							top:{tinyDotsDelta + tinyDotsOffset.y}px;
							height:{tinyDotsDiameter}px;
							width:{tinyDotsDiameter}px;
							position:absolute;'>
							<SVGD3 name='outside-tiny-dots-svg'
								svgPath={svgPaths.tinyDots_circular(tinyDotsDiameter, outside_tinyDots_count, ancestry.points_right)}
								stroke={ancestry.thing.color}
								fill={ancestry.thing.color}
								height={tinyDotsDiameter}
								width={tinyDotsDiameter}
							/>
						</div>
					{/if}
				{/if}
			</button>
		</Mouse_Responder>
	{/if}
{/key}