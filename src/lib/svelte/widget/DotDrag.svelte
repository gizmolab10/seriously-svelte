<script>
	import { s_thing_changed, s_layout_asClusters, s_ancestries_grabbed, s_ancestry_editingTools } from '../../ts/state/State';
	import { onDestroy, dbDispatch, Alteration, createPopper } from '../../ts/common/GlobalImports';
	import { Wrapper, onMount, signals, svgPaths, Direction } from '../../ts/common/GlobalImports';
	import { k, u, Rect, Size, Point, Thing, debug, ZIndex } from '../../ts/common/GlobalImports';
	import Tooltip from '../kit/Tooltip.svelte';
	import SVGD3 from '../kit/SVGD3.svelte';
	import Mouse from '../kit/Mouse.svelte';
	import Box from '../kit/Box.svelte';
	export let center = new Point(0, 0);
    export let ancestry;
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
	function hover_closure(isHovering) { updateColorsForHover(isHovering); }

    onMount(() => {
		if (!!ancestry) {
			thing = ancestry.thing;
		}
		updateAncestries();
		updateColorsForHover(false);
		popper = createPopper(button, tooltip, { placement: 'bottom' });
        const handleAltering = signals.handle_altering((state) => {
			const applyFlag = $s_ancestry_editingTools && !!ancestry && ancestry.things_canAlter_asParentOf_toolsAncestry;
			isAltering = applyFlag ? !!state : false;
			updateExtraPaths();
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

	$: {
		const _ = thing;
		updateColors();
	}

	function updateColorsForHover(flag) {
		if (isHovering != flag) {
			isHovering = flag;
			updateColors();
		}
	}

	function mouse_click_closure(mouseData) {
		if (mouseData.isUp) {
			ancestry?.handle_singleClick_onDragDot(mouseData.event.shiftKey);
		} else if (mouseData.isLong) {
			if (ancestry?.becomeFocus()) {
				signals.signal_rebuildGraph_fromFocus();
			}
		}
	}

	function updateColors() {
		if (!!thing) {
			thing.updateColorAttributes(ancestry);
			fillColor = debug.lines ? 'transparent' : ancestry?.dotColor(isHovering != isAltering);
			tinyDotsColor = relatedColor = ancestry?.dotColor(!isHovering && !isAltering);
			strokeColor = thing.color;
		}
	}

	function updateExtraPaths() {
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

	function updateAncestries() {
		if ($s_layout_asClusters && !ancestry?.isExemplar) {
			dragDotPath = svgPaths.circle_atOffset(size, size - 1);
		} else {
			dragDotPath = svgPaths.oval(size, false);
		}
		updateExtraPaths();
	}

	// <Tooltip color={strokeColor} bind:this={tooltip}>This is a drag dot</Tooltip>

</script>

{#key rebuilds}
	<Mouse
		width={size}
		height={size}
		center={center}
		name='dot-drag-mouse'
		hover_closure={hover_closure}
		mouse_click_closure={mouse_click_closure}>
		<button class='dot-drag'
			bind:this={button}
			on:contextmenu={handle_context_menu}
			style='
				border: none;
				cursor: pointer;
				background: none;
				height: {size}px;
				position: absolute;
				width: {size / 2}px;
			'>
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
		</button>
	</Mouse>
{/key}
