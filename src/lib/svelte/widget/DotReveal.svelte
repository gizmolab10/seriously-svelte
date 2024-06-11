<script lang='ts'>
	import { s_ancestries_expanded, s_altering, s_ancestries_grabbed, s_ancestry_editingTools } from '../../ts/state/ReactiveState';
	import { Direction, onDestroy, dbDispatch, Predicate, SvelteWrapper, SvelteComponentType } from '../../ts/common/GlobalImports';
	import { k, s, u, Size, Thing, Point, debug, ZIndex, onMount, signals, svgPaths } from '../../ts/common/GlobalImports';
	import MouseResponder from '../mouse buttons/MouseResponder.svelte';
	import { h } from '../../ts/db/DBDispatch';
	import SVGD3 from '../kit/SVGD3.svelte';
	export let center;
    export let ancestry;
	export let name = k.empty;
	const elementState = s.elementState_forName(name);		// survives onDestroy, created by widget
	let size = k.dot_size;
	let tinyDotsDiameter = size * 1.8;
	let tinyDotsOffset = size * -0.4 + 0.01;
	let childrenCount = ancestry.childRelationships.length;
	let insidePath = svgPaths.circle_atOffset(16, 6);
	let insideFillColor = k.color_background;
	let strokeColor = ancestry.thing.color;
	let fillColor = k.color_background;
	let revealWrapper = SvelteWrapper;
	let revealDotPath = k.empty;
	let hasInsidePath = false;
	let isHovering = false;
	let insideOffset = 0;
	let dotReveal = null;
	let rebuilds = 0;
	
	onMount(() => { setIsHovering_updateColors(false); updateScalablePaths(); });
	function handle_context_menu(event) { event.preventDefault(); } 		// Prevent the default context menu on right

	$: {
		if (dotReveal && !($s_ancestry_editingTools?.matchesAncestry(ancestry) ?? false)) {
			revealWrapper = new SvelteWrapper(dotReveal, ancestry, SvelteComponentType.reveal);
		}
	}

	$: {
		const _ = $s_ancestries_expanded;
		updateScalablePaths();
	}

	$: {
		if (strokeColor != ancestry.thing.color) {
			strokeColor = ancestry.thing.color
			updateColors();
		}
	}

	$: {
		if (!!$s_ancestries_grabbed || !!ancestry.thing) {
			updateColors();
			updateScalablePaths();
		}
	}

	function setIsHovering_updateColors(hovering) {
		if (isHovering != hovering) {
			isHovering = hovering;
			updateColors();
			rebuilds += 1;
		}
	}

	function updateColors() {
		ancestry.thing.updateColorAttributes(ancestry);
		const collapsedOrGrabbed = !ancestry.isExpanded || ancestry.isGrabbed;
		fillColor = ancestry.dotColor(collapsedOrGrabbed != isHovering, ancestry);
		insideFillColor = ancestry.dotColor(collapsedOrGrabbed == isHovering, ancestry);
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

	function handle_singleClick(event) {
		setIsHovering_updateColors(false);
		if (ancestry.toolsGrabbed) {
			$s_altering = null;
			$s_ancestry_editingTools = null;
			signals.signal_relayoutWidgets_fromFocus();
		} else if (ancestry.hasChildRelationships || ancestry.thing.isBulkAlias) {
			h.ancestry_rebuild_remoteMoveRight(ancestry, !ancestry.isExpanded, true, false);
		}
	}

	function closure(mouseState) {
		if (mouseState.isHover) {
			setIsHovering_updateColors(!mouseState.isOut);
		} else if (mouseState.isUp) {
			handle_singleClick(mouseState.event);
		}
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
	{#if elementState}
		<MouseResponder
			width={size}
			height={size}
			center={center}
			closure={closure}
			name={elementState.name}>
			<button class='dot'
				bind:this={dotReveal}
				on:contextmenu={handle_context_menu}
				style='
					width: {size}px;
					height: {size}px;
				'>
				{#key revealDotPath}
					<SVGD3 name='svg-reveal'
						fill={debug.lines ? 'transparent' : fillColor}
						svg_path={revealDotPath}
						stroke={strokeColor}
						height={size}
						width={size}
					/>
				{/key}
				{#if hasInsidePath}
					<div class='reveal-inside' style='
						left:{insideOffset}px;
						top:{insideOffset}px;
						position:absolute;
						height:{size}px;
						width:{size}px;'>
						<SVGD3 name='svg-inside'
							stroke={insideFillColor}
							fill={insideFillColor}
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
							height={tinyDotsDiameter}
							width={tinyDotsDiameter}
							stroke={strokeColor}
							fill={strokeColor}
						/>
					</div>
				{/if}
			</button>
		</MouseResponder>
	{/if}
{/key}