<script>
	import { s_thing_changed, s_layout_asClusters, s_ancestries_grabbed, s_ancestry_editingTools } from '../../ts/state/ReactiveState';
	import { k, s, u, Rect, Size, Point, Thing, debug, ZIndex, onMount } from '../../ts/common/GlobalImports';
	import { signals, svgPaths, Direction, MouseData, SvelteWrapper } from '../../ts/common/GlobalImports';
	import { dbDispatch, AlterationType, createPopper } from '../../ts/common/GlobalImports';
	import Button from '../mouse buttons/Button.svelte';
	import Tooltip from '../kit/Tooltip.svelte';
	import SVGD3 from '../kit/SVGD3.svelte';
	import Box from '../kit/Box.svelte';
	export let center = Point.zero;
	export let name = 'k.empty';
    export let ancestry;
	const radius = k.dot_size;
	const diameter = radius * 2;
	const dragState = s.mouseState_forName(name);
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
	let relatedAncestry;
	let rebuilds = 0;
	let tinyDotsPath;
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
		const grabbedAncestries = $s_ancestries_grabbed;		// use state variable for react logic
		const grabbed = ancestry?.includedInAncestries(grabbedAncestries);
		if (isGrabbed != grabbed) {
			isGrabbed = grabbed;
			updateColors();
		}
	}

	function updateColorsForHover(flag) {
		if (isHovering != flag) {
			isHovering = flag;
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

	function updateColors() {
		if (!!thing) {
			thing.updateColorAttributes(ancestry);
			fillColor = debug.lines ? 'transparent' : ancestry?.dotColor(isHovering != isAltering);
			tinyDotsColor = relatedColor = ancestry?.dotColor(!isHovering && !isAltering);
			strokeColor = thing.color;
		}
	}

	function updateExtraSVGPaths() {
		relatedAncestry = tinyDotsPath = null;
		if (!!thing) {
			const count = thing.parents.length;		
			if (count > 1) {
				tinyDotsPath = svgPaths.ellipses(6, 0.5, false, count, size / 2);
			}
			if (thing.hasRelated) {
				relatedAncestry = svgPaths.circle_atOffset(size, 3, new Point(-4.5, 0));
			}
		}
	}

	function closure(mouseData) {
		if (mouseData.isHover) {
			updateColorsForHover(!mouseData.isOut);
			if (mouseData.isOut) {
				// tooltip.setAttribute('data-show', '');
				// popper.update();
			} else {
				// tooltip.removeAttribute('data-show');
			}
		} else if (mouseData.isUp) {
			ancestry?.handle_singleClick_onDragDot(mouseData.event.shiftKey);
		}
	}

	// <Tooltip color={strokeColor} bind:this={tooltip}>This is a drag dot</Tooltip>
	// on:contextmenu={handle_context_menu}

</script>

{#key rebuilds}
	<Button
		name={name}
		height={size}
		center={center}
		width={size}
		closure={closure}
		border_thickness=0>
		<SVGD3 name='svg-drag'
			width={size}
			height={size}
			fill={fillColor}
			stroke={strokeColor}
			svg_path={dragDotPath}
		/>
		{#if tinyDotsPath}
			<SVGD3 name='svg-dot-inside'
				width={size}
				height={size}
				fill={tinyDotsColor}
				stroke={tinyDotsColor}
				svg_path={tinyDotsPath}
			/>
		{/if}
		{#if relatedAncestry}
			<SVGD3 name='svg-dot-related'
				width={size}
				height={size}
				fill={relatedColor}
				svg_path={relatedAncestry}
				stroke={$s_layout_asClusters ? relatedColor : strokeColor}
			/>
		{/if}
	</Button>
{/key}
