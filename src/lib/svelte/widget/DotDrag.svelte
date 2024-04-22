<script>
	import { k, u, Rect, Size, Point, Thing, debug, ZIndex, onMount, signals } from "../../ts/common/GlobalImports";
	import { Wrapper, svgPaths, Direction, onDestroy, dbDispatch, Alteration } from "../../ts/common/GlobalImports";
	import { s_paths_grabbed, s_layout_asClusters, s_path_editingTools } from '../../ts/state/State';
	import SVGD3 from '../kit/SVGD3.svelte';
	import Box from '../kit/Box.svelte';
	export let center = new Point(0, 0);
    export let path;
	let strokeColor = k.color_background;
	let extraColor = k.color_background;
	let fillColor = k.color_background;
	let path_scalable = k.empty;
	let isAltering = false;
	let isGrabbed = false;
	let isHovering = true;
	let path_extra = null;
	let size = k.dot_size;
	let clickCount = 0;
	let button = null;
	let clickTimer;
	let left = 0;
	let top = 0;
    let thing;
	
	function handle_mouse_over(event) { updateColorsForHover(true); }
	function handle_mouse_out(event) { updateColorsForHover(false); }
	function handle_context_menu(event) { event.preventDefault(); }		// no default context menu on right-click
	function handle_mouseUp() { clearTimeout(clickTimer); }

    onMount(() => {
		if (!!path) {
			thing = path.thing;
		}
		updatePaths();
		updateColorsForHover(false);
        const handler = signals.handle_altering((state) => {
			const applyFlag = $s_path_editingTools && !!path && path.things_canAlter_asParentOf_toolsPath;
			isAltering = applyFlag ? !!state : false;
			updatePathExtra();
			updateColors();
        })
		return () => { handler.disconnect() };
	});

	$: {
		const grabbedPaths = $s_paths_grabbed;		// use state variable for react logic
		const grabbed = path?.includedInPaths(grabbedPaths);
		if (isGrabbed != grabbed) {
			isGrabbed = grabbed;
			updateColors();
		}
	}

	$: {
		const _ = thing;
		updateColors();
	}

	$: {
		const _ = k.dot_size;
		updatePaths();
	}

	function clearClicks() {
		clickCount = 0;
		clearTimeout(clickTimer);	// clear all previous timers
	}

	function updateColorsForHover(flag) {
		if (isHovering != flag) {
			isHovering = flag;
			updateColors();
		}
	}

	function handle_longClick(event) {
		clearClicks();
		clickTimer = setTimeout(() => {
			handle_doubleClick(event);
		}, k.threshold_longClick);
	}

	function handle_doubleClick(event) {
		clearClicks();
		if (path?.becomeFocus()) {
			signals.signal_rebuildGraph_fromFocus();
		}
    }

	function handle_singleClick(event) {
		clickCount++;
		clickTimer = setTimeout(() => {
			if (clickCount === 1) {
				path?.handle_singleClick_onDragDot(event.shiftKey);
				clearClicks();
			}
		}, k.threshold_doubleClick);
	}

	function updateColors() {
		if (!!thing) {
			thing.updateColorAttributes(path);
			fillColor = debug.lines ? 'transparent' : path?.dotColor(isHovering != isAltering);
			extraColor = path?.dotColor(!isHovering && !isAltering)
			strokeColor = thing.color;
		}
	}

	function updatePathExtra() {
		if (!!thing) {
			const count = thing.parents.length;		
			if (count > 1) {
				path_extra = svgPaths.tinyDots_linear(6, 0.5, false, count, size / 2);
				return;
			}
		}
		path_extra = null;
	}

	function updatePaths() {
		if ($s_layout_asClusters && !path?.isExemplar) {
			path_scalable = svgPaths.circle(size, size - 1);
		} else {
			path_scalable = svgPaths.oval(size, false);
		}
		updatePathExtra();
	}
</script>

<button class='dot-drag'
	bind:this={button}
	on:blur={u.ignore}
	on:focus={u.ignore}
	on:keyup={u.ignore}
	on:keydown={u.ignore}
	on:keypress={u.ignore}
	on:mouseup={handle_mouseUp}
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
	'>
	<SVGD3 name='svg-drag'
		width={size}
		height={size}
		fill={fillColor}
		stroke={strokeColor}
		svgPath={path_scalable}
	/>
	{#if path_extra}
		<SVGD3 name='svg-dot-inside'
			width={size}
			height={size}
			fill={extraColor}
			stroke={extraColor}
			svgPath={path_extra}
		/>
	{/if}
</button>
