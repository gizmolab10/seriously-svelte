<script lang='ts'>
	import { s_ancestries_expanded, s_altering, s_ancestries_grabbed, s_ancestry_showingTools } from '../../ts/state/Reactive_State';
	import { Direction, onDestroy, dbDispatch, Predicate, Svelte_Wrapper, SvelteComponentType } from '../../ts/common/Global_Imports';
	import { k, u, ux, Size, Thing, Point, debug, ZIndex, onMount, signals, svgPaths } from '../../ts/common/Global_Imports';
	import Mouse_Responder from '../mouse buttons/Mouse_Responder.svelte';
	import { h } from '../../ts/db/DBDispatch';
	import SVGD3 from '../kit/SVGD3.svelte';
	export let center;
    export let ancestry;
	export let name = k.empty;
    export let zindex = ZIndex.dots;
    export let hover_isReversed = false;
	const element_state = ux.elementState_forName(name);		// survives onDestroy, created by widget
	let size = k.dot_size;
	let tinyDotsDiameter = size * 1.8;
	let tinyDotsOffset = size * -0.4 + 0.01;
	let childrenCount = ancestry.childRelationships.length;
	let insidePath = svgPaths.circle_atOffset(16, 6);
	let revealWrapper!: Svelte_Wrapper;
	let revealDotPath = k.empty;
	let hasInsidePath = false;
	let insideOffset = 0;
	let dotReveal = null;
	let rebuilds = 0;
	
	function handle_context_menu(event) { event.preventDefault(); } 		// Prevent the default context menu on right

	onMount(() => {
		updateScalablePaths();
		set_isHovering(false);
	});

	$: {
		if (dotReveal && !($s_ancestry_showingTools?.matchesAncestry(ancestry) ?? false)) {
			revealWrapper = new Svelte_Wrapper(dotReveal, handle_mouse_state, ancestry.idHashed, SvelteComponentType.reveal);
			element_state.set_forHovering(ancestry.thing.color, 'pointer');
		}
	}

	$: {
		const _ = $s_ancestries_expanded;
		updateScalablePaths();
	}

	$: {
		if (!!$s_ancestries_grabbed || !!ancestry.thing) {
			updateScalablePaths();
		}
	}

	function set_isHovering(hovering) {
		const corrected = hover_isReversed ? !hovering : hovering;
		if (!!element_state && element_state.isOut == corrected) {
			element_state.isOut = !corrected;
			rebuilds += 1;
		}
	}

	function updateScalablePaths() {
		const thing = ancestry.thing;
		hasInsidePath = ancestry.toolsGrabbed || thing.isBulkAlias;
		insideOffset = hasInsidePath ? 0 : -1;
		if (!ancestry.showsReveal || ancestry.toolsGrabbed) {
			revealDotPath = svgPaths.circle_atOffset(size, size - 1);
		} else {
			const goLeft = ancestry.showsChildRelationships;
			const direction = goLeft ? Direction.left : Direction.right;
			revealDotPath = svgPaths.fat_polygon(size, direction);
		}
		if (ancestry.toolsGrabbed) {
			insidePath = svgPaths.x_cross(size, 1.5);
		} else if (hasInsidePath) {
			insidePath = svgPaths.circle_atOffset(size, 3);
		}
	}

	function closure(mouse_state) {
		if (mouse_state.isHover) {
			set_isHovering(!mouse_state.isOut);
		} else if (mouse_state.isUp) {
			if (ancestry.toolsGrabbed) {
				$s_altering = null;
				$s_ancestry_showingTools = null;
				signals.signal_relayoutWidgets_fromFocus();
			} else if (ancestry.hasChildRelationships || ancestry.thing.isBulkAlias) {
				h.ancestry_rebuild_remoteMoveRight(ancestry, !ancestry.isExpanded, true, false);
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
			closure={closure}
			name={element_state.name}>
			<button class='dot'
				bind:this={dotReveal}
				on:contextmenu={handle_context_menu}
				style='
					width: {size}px;
					height: {size}px;
					z-index: {zindex};
				'>
				{#key revealDotPath}
					<SVGD3 name='svg-reveal'
						fill={debug.lines ? 'transparent' : element_state.fill}
						stroke={ancestry.thing.color}
						svg_path={revealDotPath}
						height={size}
						width={size}
					/>
				{/key}
				{#if k.show_tinyDots}
					{#if hasInsidePath}
						<div class='reveal-inside' style='
							left:{insideOffset}px;
							top:{insideOffset}px;
							position:absolute;
							height:{size}px;
							width:{size}px;'>
							<SVGD3 name='svg-inside'
								stroke={element_state.stroke}
								fill={element_state.stroke}
								svg_path={insidePath}
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
							<SVGD3 name='svg-tiny-dots'
								svg_path={svgPaths.tinyDots_circular(tinyDotsDiameter, childrenCount)}
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