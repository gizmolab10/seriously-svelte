<script lang='ts'>
	import { Direction, dbDispatch, Predicate, Svelte_Wrapper, SvelteComponentType } from '../../ts/common/Global_Imports';
	import { k, u, ux, show, Size, Thing, Point, debug, ZIndex, signals, svgPaths } from '../../ts/common/Global_Imports';
	import { s_hierarchy, s_alteration_mode, s_ancestry_showing_tools } from '../../ts/state/Svelte_Stores';
	import { s_expanded_ancestries, s_grabbed_ancestries } from '../../ts/state/Svelte_Stores';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import SVGD3 from '../kit/SVGD3.svelte';
	import { onMount } from 'svelte';
	export let center;
    export let ancestry;
	export let name = k.empty;
    export let zindex = ZIndex.dots;
    export let hover_isReversed = false;
	const element_state = ux.element_state_forName(name);		// survives onDestroy, created by widget
	let size = k.dot_size;
	let tinyDotsDiameter = size * 1.8;
	let tinyDotsOffset = size * -0.4 + 0.01;
	let childrenCount = ancestry.childRelationships.length;
	let svgPathFor_insideReveal = svgPaths.circle_atOffset(16, 6);
	let revealWrapper!: Svelte_Wrapper;
	let svgPathFor_revealDot = k.empty;
	let hasInsidePath = false;
	let insideOffset = 0;
	let dotReveal = null;
	let rebuilds = 0;
	
	function handle_context_menu(event) { event.preventDefault(); } 		// Prevent the default context menu on right

	onMount(() => {
		svgPath_update();
		set_isHovering(false);
	});

	$: {
		if (!!dotReveal && !($s_ancestry_showing_tools?.matchesAncestry(ancestry) ?? false)) {
			revealWrapper = new Svelte_Wrapper(dotReveal, handle_mouse_state, ancestry.idHashed, SvelteComponentType.reveal);
			element_state.set_forHovering(ancestry.thing.color, 'pointer');
		}
	}

	$: {
		const _ = $s_expanded_ancestries;
		svgPath_update();
	}

	$: {
		if (!!$s_grabbed_ancestries || !!ancestry.thing) {
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
		hasInsidePath = ancestry.toolsGrabbed || thing.isBulkAlias;
		insideOffset = hasInsidePath ? 0 : -1;
		if (!ancestry.showsReveal || ancestry.toolsGrabbed) {
			svgPathFor_revealDot = svgPaths.circle_atOffset(size, size - 1);
		} else {
			svgPathFor_revealDot = svgPaths.fat_polygon(size, ancestry.svgAngleOf_reveal);
		}
		if (ancestry.toolsGrabbed) {
			svgPathFor_insideReveal = svgPaths.x_cross(size, 1.5);
		} else if (hasInsidePath) {
			svgPathFor_insideReveal = svgPaths.circle_atOffset(size, 3);
		}
	}

	function up_hover_closure(mouse_state) {
		if (mouse_state.isHover) {
			set_isHovering(!mouse_state.isOut);
		} else if (mouse_state.isUp) {
			if (ancestry.toolsGrabbed) {
				$s_alteration_mode = null;
				$s_ancestry_showing_tools = null;
				signals.signal_relayoutWidgets_fromFocus();
			} else if (ancestry.hasChildRelationships || ancestry.thing.isBulkAlias) {
				$s_hierarchy.ancestry_rebuild_persistentMoveRight(ancestry, ancestry.isParental != ancestry.isExpanded, false, false, false, false);
			}
		}
	}
 
	function isHit(): boolean {
		return false
	}

	function handle_mouse_state(mouse_state: Mouse_State): boolean {
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
				{#if show.tinyDots}
					{#if hasInsidePath}
						<div class='reveal-inside' style='
							left:{insideOffset}px;
							top:{insideOffset}px;
							position:absolute;
							height:{size}px;
							width:{size}px;'>
							<SVGD3 name='inside-svg'
								stroke={element_state.stroke}
								fill={element_state.stroke}
								svgPath={svgPathFor_insideReveal}
								height={size}
								width={size}
							/>
						</div>
					{/if}
					{#if !ancestry.isExpanded && ancestry.hasChildRelationships}
						<div class='outside-tiny-dots' style='
							left:{tinyDotsOffset + 0.65}px;
							top:{tinyDotsOffset - 0.28}px;
							height:{tinyDotsDiameter}px;
							width:{tinyDotsDiameter}px;
							position:absolute;'>
							<SVGD3 name='tiny-dots-svg'
								svgPath={svgPaths.tinyDots_circular(tinyDotsDiameter, childrenCount)}
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