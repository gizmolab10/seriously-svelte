<script>
	import { k, u, Rect, Size, Point, Thing, debug, ZIndex, onMount, signals, svgPath } from "../../ts/common/GlobalImports";
	import { Wrapper, Direction, onDestroy, dbDispatch, AlteringParent } from "../../ts/common/GlobalImports";
	import { s_paths_grabbed, s_path_toolsCluster } from '../../ts/managers/State';
	import SVGD3 from '../svg/SVGD3.svelte';
	import Box from '../kit/Box.svelte';
	export let center = new Point(0, 0);
	export let thing;
	export let path;
	let parentsCount = thing.parents.length;
	let strokeColor = thing.color;
	let extraColor = thing.color;
	let fillColor = thing.color;
	let path_scalable = '';
	let size = k.dot_size;
	let path_extra = null;
	let isHovering = true;
	let isGrabbed = false;
	let altering = false;
	let clickCount = 0;
	let handler = null;
	let button = null;
	let clickTimer;
	let left = 0;
	let top = 0;
	
    onDestroy(() => { handler?.disconnect(); })
	function mouseOver(event) { updateColorsForHover(true); }
	function handleMouseUp() { clearTimeout(clickTimer); }
	function mouseOut(event) { updateColorsForHover(false); }
	function handleContextMenu(event) { event.preventDefault(); } 		// Prevent the default context menu on right-

    onMount(() => {
		updatePaths();
		updateColorsForHover(false);
        handler = signals.handle_alteringParent((alteration) => {
			const applyFlag = $s_path_toolsCluster && path.things_canAlter_asParentOf_toolsGrab;
			altering = applyFlag ? (alteration != null) : false;
			updatePathExtra();
			updateColors();
        })
    })

	$: {
		const grabbed = $s_paths_grabbed?.filter(p => p.matchesPath(path)).length > 0;
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
		thing.updateColorAttributes(path);
		fillColor = debug.lines ? 'transparent' : path.dotColor(isHovering != altering);
		extraColor = path.dotColor(!isHovering)
		strokeColor = thing.color;
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
		if (path.becomeHere()) {
			signals.signal_rebuild_fromHere();
		}
    }

	function handleSingleClick(event) {
		clickCount++;
		clickTimer = setTimeout(() => {
			if (clickCount === 1) {
				path.clicked_dragDot(event.shiftKey);
				clearClicks();
			}
		}, k.threshold_doubleClick);
	}

	function updatePathExtra() {
		const count = thing.parents.length;		
		if (count == 1) {
			path_extra = svgPath.circle(size, size / 10);
		} else if (count != 0) {
			path_extra = svgPath.tinyDots_linear(6, 0.5, false, count, size / 2);
		}
	}

	function updatePaths() {
		path_scalable = svgPath.oval(size, false);
		updatePathExtra();
	}

</script>

<button class='dragDot'
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
		top: 2.5px;
		border: none;
		cursor: pointer;
		background: none;
		height: {size}px;
		position: absolute;
		left: {center.x}px;
		width: {size / 2}px;
	'>
	<SVGD3 name='dragDot'
		width={size}
		height={size}
		fill={fillColor}
		stroke={strokeColor}
		scalablePath={path_scalable}
	/>
	{#if path_extra}
		<SVGD3 name='dragInside'
			width={size}
			height={size}
			fill={extraColor}
			stroke={extraColor}
			scalablePath={path_extra}
		/>
	{/if}
</button>
