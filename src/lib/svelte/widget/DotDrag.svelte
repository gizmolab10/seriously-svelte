<script>
	import { s_thing_changed, s_layout_asClusters, s_ancestries_grabbed, s_ancestry_editingTools } from '../../ts/state/ReactiveState';
	import { signals, svgPaths, Direction, ElementType, MouseState, dbDispatch } from '../../ts/common/GlobalImports';
	import { k, s, u, Rect, Size, Point, Thing, debug, ZIndex, onMount } from '../../ts/common/GlobalImports';
	import { createPopper, SvelteWrapper, AlterationType } from '../../ts/common/GlobalImports';
	import Button from '../mouse buttons/Button.svelte';
	import Tooltip from '../kit/Tooltip.svelte';
	import SVGD3 from '../kit/SVGD3.svelte';
	import Box from '../kit/Box.svelte';
	export let center = Point.zero;
	export let name = 'k.empty';
    export let ancestry;
	const radius = k.dot_size;
	const diameter = radius * 2;
	const elementState = s.elementState_forType(name, ancestry, ElementType.drag);
	let tinyDotsColor = k.color_background;
	let relatedColor = k.color_background;
	let strokeColor = k.color_background;
	let fillColor = k.color_background;
	let dragDotPath = k.empty;
	let isAltering = false;
	let isGrabbed = false;
	let isHovering = true;
	let size = k.dot_size;
	let mouse_click_timer;
	let isRelatedPath;
	let tinyDotsPath;
	let rebuilds = 0;
	let redraws = 0;
	let left = 0;
	let top = 0;
	let tooltip;
	let popper;
	let button;
    let thing;

	function handle_context_menu(event) { event.preventDefault(); }		// no default context menu on right-click

    onMount(() => {
		if (!!ancestry) {
			thing = ancestry.thing;
		}
		updateSVGPaths();
		updateColorsForHover(false);
		popper = createPopper(button, tooltip, { placement: 'bottom' });
        const handleAltering = signals.handle_altering((state) => {
			const applyFlag = $s_ancestry_editingTools && !!ancestry && ancestry.things_canAlter_asParentOf_toolsAncestry;
			isAltering = applyFlag ? !!state : false;
			updateExtraSVGPaths();
			updateColors();
        });
		return () => {
			handleAltering.disconnect();
		};
	});

	$: {
		if (thing?.id == $s_thing_changed.split(k.genericSeparator)[0]) {
			updateColorsForHover(false);
			rebuilds += 1;
		}
	}

	$: {
		const grabbed = ancestry?.isGrabbed;
		if (isGrabbed != grabbed) {
			isGrabbed = grabbed;
			updateColors();
		}
	}

	function updateSVGPaths() {
		if ($s_layout_asClusters) {
			dragDotPath = svgPaths.circle_atOffset(size, size - 1);
		} else {
			dragDotPath = svgPaths.oval(size, false);
		}
		updateExtraSVGPaths();
	}

	function updateExtraSVGPaths() {
		isRelatedPath = tinyDotsPath = null;
		if (!!thing) {
			const count = thing.parents.length;		
			if (count > 1) {
				tinyDotsPath = svgPaths.ellipses(6, 0.5, false, count, size / 2);
			}
			if (thing.hasRelated) {
				isRelatedPath = svgPaths.circle_atOffset(size, 3, new Point(-4.5, 0));
			}
		}
	}

	function updateColorsForHover(isHovering) {
		const cursor = !ancestry.isGrabbed && ancestry.hasChildRelationships ? 'pointer' : k.cursor_default;
		elementState.update(!isHovering, thing.color, cursor);
		redraws += 1;
	}

	function updateColors() {
		if (!!thing) {
			thing.updateColorAttributes(ancestry);
			fillColor = debug.lines ? 'transparent' : ancestry?.dotColor(isHovering != isAltering);
			tinyDotsColor = relatedColor = ancestry?.dotColor(!isHovering && !isAltering);
			strokeColor = thing.color;
		}
	}

	function closure(mouseState) {
		if (mouseState.isHover) {
			updateColorsForHover(!mouseState.isOut);
		} else if (mouseState.isUp) {
			ancestry?.handle_singleClick_onDragDot(mouseState.event.shiftKey);
		}
	}

	// <Tooltip color={strokeColor} bind:this={tooltip}>This is a drag dot</Tooltip>
	// on:contextmenu={handle_context_menu}

</script>

{#key rebuilds}
	<Button
		name={name}
		width={size}
		height={size}
		center={center}
		closure={closure}
		border_thickness=0>
		{#key redraws}
			<div id={'inner-div-for-' + name}
				style='
					top:0px;
					left:0px;
					width:{size}px;
					height:{size}px;
					position:absolute;
					z-index:{ZIndex.dots};
					cursor:{elementState.cursor};'>
				<SVGD3 name='svg-drag'
					width={size}
					height={size}
					svg_path={dragDotPath}
					fill={elementState.fill}
					stroke={elementState.color}
				/>
				{#if tinyDotsPath}
					<SVGD3 name='svg-dot-inside'
						width={size}
						height={size}
						fill={elementState.color}
						stroke={elementState.color}
						svg_path={tinyDotsPath}
					/>
				{/if}
				{#if isRelatedPath}
					<SVGD3 name='svg-dot-related'
						width={size}
						height={size}
						fill={k.color_background}
						svg_path={isRelatedPath}
						stroke={$s_layout_asClusters ? thing.color : elementState.color}
					/>
				{/if}
			</div>
		{/key}
	</Button>
{/key}
