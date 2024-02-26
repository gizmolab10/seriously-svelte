<script>
	import { k, u, Rect, Size, Point, Thing, debug, ZIndex, onMount, signals, svgPath } from "../../ts/common/GlobalImports";
	import { Wrapper, Direction, onDestroy, dbDispatch, AlteringParent } from "../../ts/common/GlobalImports";
	import { s_paths_grabbed, s_path_toolsCluster } from '../../ts/managers/State';
	import SVGD3 from '../svg/SVGD3.svelte';
	import Box from '../kit/Box.svelte';
	export let center;
	export let thing;
	export let path;
	let tinyDotColor = thing.color;
	let strokeColor = thing.color;
	let fillColor = thing.color;
	let scalablePath = '';
	let isHovering = true;
	let isGrabbed = false;
	let altering = false;
	let clickCount = 0;
	let handler = null;
	let button = null;
	let extraPath = null;
	let clickTimer;
	let size = 0;
	let left = 0;
	let top = 0;
	
    onDestroy(() => { handler?.disconnect(); })
	function handleMouseIn(event) { updateColorsForHover(true); }
	function handleMouseUp() { clearTimeout(clickTimer); }
	function handleMouseOut(event) { updateColorsForHover(false); }
	function handleContextMenu(event) { event.preventDefault(); } 		// Prevent the default context menu on right-

    onMount(() => {
		updatePathAndPosition();
		updateColorsForHover(false);
        handler = signals.handle_alteringParent((alteration) => {
			const applyFlag = $s_path_toolsCluster && path.things_canAlter_asParentOf_toolsGrab;
			extraPath = (thing.parents.length < 2) ? null : svgPath.circle(size, size / 5);
			altering = applyFlag ? (alteration != null) : false;
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
		updatePathAndPosition();
	}

	function updateColors() {
		const asReveal = isHovering == altering;
		thing.updateColorAttributes(path);	// for revealColor
		tinyDotColor = thing.revealColor(asReveal, path);
		fillColor = debug.lines ? 'transparent' : thing.revealColor(!asReveal, path);
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
		}, k.longClickThreshold);
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
		}, k.doubleClickThreshold);
	}

	function updatePathAndPosition() {
		size = k.dot_size;
		left = center.x + 1;// - (size / 2);
		top = path.toolsGrabbed ? 2 : (size / 2) - 5;
		scalablePath = svgPath.oval(size, false);
		if (thing.parents.length > 1) {
			extraPath = svgPath.circle(size, size / 5);
		}
	}

</script>

<button class='dragDot'
	bind:this={button}
	on:blur={u.ignore}
	on:focus={u.ignore}
	on:keyup={u.ignore}
	on:keydown={u.ignore}
	on:keypress={u.ignore}
	on:mouseup={handleMouseUp}
	on:click={handleSingleClick}
	on:mouseout={handleMouseOut}
	on:mouseover={handleMouseIn}
	on:mousedown={handleLongClick}
	on:dblclick={handleDoubleClick}
	on:contextmenu={handleContextMenu}
	style='
		border: none;
		top: {top}px;
		left: {left}px;
		cursor: pointer;
		height: {size}px;
		background: none;
		position: absolute;
		width: {size / 2}px;
	'>
	<SVGD3
		size={size}
		fill={fillColor}
		stroke={strokeColor}
		scalablePath={scalablePath}
	/>
	{#if extraPath}
		<SVGD3
			size={size}
			fill={tinyDotColor}
			scalablePath={extraPath}
			stroke={tinyDotColor}
		/>
	{/if}
</button>
