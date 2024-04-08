<script>
	import { k, u, Rect, Size, Point, Thing, debug, ZIndex, onMount, signals, svgPaths } from "../../ts/common/GlobalImports";
	import { s_paths_grabbed, s_altering_parent, s_layout_byClusters, s_path_clusterTools } from '../../ts/common/State';
	import { Wrapper, Direction, onDestroy, dbDispatch, AlteringParent } from "../../ts/common/GlobalImports";
	import SVGD3 from '../svg/SVGD3.svelte';
	import Box from '../kit/Box.svelte';
	export let center = new Point(0, 0);
    export let path;
	let strokeColor = k.color_background;
	let extraColor = k.color_background;
	let fillColor = k.color_background;
	let path_scalable = k.empty;
	let size = k.dot_size;
	let path_extra = null;
	let isHovering = true;
	let isGrabbed = false;
	let altering = false;
	let clickCount = 0;
	let button = null;
	let clickTimer;
	let left = 0;
	let top = 0;
    let thing;
	
	function mouseOver(event) { updateColorsForHover(true); }
	function handleMouseUp() { clearTimeout(clickTimer); }
	function mouseOut(event) { updateColorsForHover(false); }
	function handleContextMenu(event) { event.preventDefault(); } 		// Prevent the default context menu on right-

    onMount(() => {
		if (path) {
			thing = path.thing;
		}
		updatePaths();
		updateColorsForHover(false);
        const handler = signals.handle_alteringParent((alteration) => {
			const applyFlag = $s_path_clusterTools && path?.things_canAlter_asParentOf_toolsGrab;
			altering = applyFlag ? (alteration != null) : false;
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

	function updateColors() {
		if (thing) {
			thing.updateColorAttributes(path);
			fillColor = debug.lines ? 'transparent' : path?.dotColor(isHovering != altering);
			extraColor = path?.dotColor(!isHovering && !altering)
			strokeColor = thing.color;
		}
	}

	function updateColorsForHover(flag) {
		if (isHovering != flag) {
			isHovering = flag;
			updateColors();
		}
	}

	function clearClicks() {
		clickCount = 0;
		clearTimeout(clickTimer);	// clear all previous timers
	}

	function handleLongClick(event) {
		clearClicks();
		clickTimer = setTimeout(() => {
			handleDoubleClick(event);
		}, k.threshold_longClick);
	}

	function handleDoubleClick(event) {
		clearClicks();
		if (path?.becomeHere()) {
			signals.signal_rebuildWidgets_fromHere();
		}
    }

	function handleSingleClick(event) {
		clickCount++;
		clickTimer = setTimeout(() => {
			if (clickCount === 1) {
				path?.clicked_dotDrag(event.shiftKey);
				clearClicks();
			}
		}, k.threshold_doubleClick);
	}

	function updatePathExtra() {
		if (thing) {
			const count = thing.parents.length;		
			if (count > 1) {
				path_extra = svgPaths.tinyDots_linear(6, 0.5, false, count, size / 2);
				return;
			}
		}
		path_extra = null;
	}

	function updatePaths() {
		if ($s_layout_byClusters) {
			path_scalable = svgPaths.circle(size, size - 1);
		} else {
			path_scalable = svgPaths.oval(size, false);
		}
		updatePathExtra();
	}

</script>

<button class='dotDrag'
	bind:this={button}
	on:blur={u.ignore}
	on:focus={u.ignore}
	on:keyup={u.ignore}
	on:keydown={u.ignore}
	on:keypress={u.ignore}
	on:mouseout={mouseOut}
	on:mouseover={mouseOver}
	on:mouseup={handleMouseUp}
	on:click={handleSingleClick}
	on:mousedown={handleLongClick}
	on:dblclick={handleDoubleClick}
	on:contextmenu={handleContextMenu}
	style='
		top: 2.7px;
		border: none;
		cursor: pointer;
		background: none;
		height: {size}px;
		position: absolute;
		left: {center.x}px;
		width: {size / 2}px;
	'>
	<SVGD3 name='dotDrag'
		width={size}
		height={size}
		fill={fillColor}
		stroke={strokeColor}
		svgPath={path_scalable}
	/>
	{#if path_extra}
		<SVGD3 name='dotInside'
			width={size}
			height={size}
			fill={extraColor}
			stroke={extraColor}
			svgPath={path_extra}
		/>
	{/if}
</button>
