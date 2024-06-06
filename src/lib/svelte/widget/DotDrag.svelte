<script>
	import { s_thing_changed, s_layout_asClusters, s_ancestries_grabbed, s_ancestry_editingTools } from '../../ts/state/ReactiveState';
	import { k, s, u, Rect, Size, Point, Thing, debug, ZIndex, onMount } from '../../ts/common/GlobalImports';
	import { signals, svgPaths, Direction, MouseData, SvelteWrapper } from '../../ts/common/GlobalImports';
	import { dbDispatch, AlterationType, createPopper } from '../../ts/common/GlobalImports';
	import MouseButton from '../mouse buttons/MouseButton.svelte';
	import Tooltip from '../kit/Tooltip.svelte';
	import SVGD3 from '../kit/SVGD3.svelte';
	import Box from '../kit/Box.svelte';
	export let center = Point.zero;
	export let name = 'k.empty';
    export let ancestry;
	const radius = k.dot_size;
	const diameter = radius * 2;
	const dragState = s.dragState_forName(name);
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
	let clickCount = 0;
	let rebuilds = 0;
	let tinyDotsPath;
	let left = 0;
	let top = 0;
	let tooltip;
	let popper;
	let button;
    let thing;

	function handle_context_menu(event) { event.preventDefault(); }		// no default context menu on right-click
	function handle_mouse_up() { clearTimeout(mouse_click_timer); }

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

	function clearClicks() {
		clickCount = 0;
		clearTimeout(mouse_click_timer);	// clear all previous timers
	}
	
	function handle_mouse_out(event) {
		updateColorsForHover(false);
		// tooltip.removeAttribute('data-show');
	}

	function handle_mouse_over(event) {
		updateColorsForHover(true);
		// tooltip.setAttribute('data-show', '');
		// popper.update();
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

	function handle_longClick(event) {
		clearClicks();
		mouse_click_timer = setTimeout(() => {
			handle_doubleClick(event);
		}, k.threshold_longClick);
	}

	function handle_doubleClick(event) {
		clearClicks();
		if (ancestry?.becomeFocus()) {
			signals.signal_rebuildGraph_fromFocus();
		}
    }

	function handle_singleClick(event) {
		clickCount++;
		mouse_click_timer = setTimeout(() => {
			if (clickCount === 1) {
				ancestry?.handle_singleClick_onDragDot(event.shiftKey);
				clearClicks();
			}
		}, k.threshold_doubleClick);
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

	// <Tooltip color={strokeColor} bind:this={tooltip}>This is a drag dot</Tooltip>

</script>

{#key rebuilds}
	<MouseButton
		name={name}
		center={center}
		width={diameter}
		height={diameter}
		closure={closure}
		zindex={ZIndex.dots}
		detect_longClick={false}
		cursor={dragState.cursor}
		hover_closure={determine_isHovering}>
	</MouseButton>
	<button class='dot-drag'
		bind:this={button}
		on:blur={u.ignore}
		on:focus={u.ignore}
		on:keyup={u.ignore}
		on:keydown={u.ignore}
		on:keypress={u.ignore}
		on:mouseup={handle_mouse_up}
		on:click={handle_singleClick}
		on:mouseout={handle_mouse_out}
		on:mousedown={handle_longClick}
		on:mouseover={handle_mouse_over}
		on:dblclick={handle_doubleClick}
		on:contextmenu={handle_context_menu}
		style='
			border: none;
			cursor: pointer;
			background: none;
			height: {size}px;
			top: {center.y}px;
			left: {center.x}px;
			position: absolute;
			width: {size / 2}px;
			z-index: {ZIndex.dots};
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
{/key}
