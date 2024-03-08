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
	let extraDiameter = k.dot_size * 1.3;
	let extraOffset = k.dot_size * -0.3;
	let strokeColor = thing.color;
	let fillColor = thing.color;
	let path_scalable = '';
	let path_extra = null;
	let isHovering = true;
	let isGrabbed = false;
	let altering = false;
	let clickCount = 0;
	let handler = null;
	let button = null;
	let clickTimer;
	let size = 0;
	let left = 0;
	let top = 0;
	
    onDestroy(() => { handler?.disconnect(); })
	function mouseOver(event) { updateColorsForHover(true); }
	function handleMouseUp() { clearTimeout(clickTimer); }
	function mouseOut(event) { updateColorsForHover(false); }
	function handleContextMenu(event) { event.preventDefault(); } 		// Prevent the default context menu on right-

    onMount(() => {
		updatePathAndPosition();
		updateColorsForHover(false);
        handler = signals.handle_alteringParent((alteration) => {
			const applyFlag = $s_path_toolsCluster && path.things_canAlter_asParentOf_toolsGrab;
			path_extra = (thing.parents.length < 2) ? null : svgPath.circle(size, size / 5);
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
		const isInverted = isHovering == altering;
		thing.updateColorAttributes(path);
		fillColor = debug.lines ? 'transparent' : thing.dotColor(!isInverted, path);
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

	function updatePathAndPosition() {
		size = k.dot_size;
		left = center.x + 7 - (size / 2);
		top = path.toolsGrabbed ? 2 : (size / 2) - 4;
		path_scalable = svgPath.oval(size, false);
		if (thing.parents.length > 1) {
			path_extra = svgPath.circle(k.dot_size, k.dot_size / 4);
			// path_extra = svgPath.extra_circular(extraDiameter, parentsCount);
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
	on:mouseout={mouseOut}
	on:mouseover={mouseOver}
	on:mouseup={handleMouseUp}
	on:click={handleSingleClick}
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
	<SVGD3 name='dragDot'
		width={size}
		height={size}
		fill={fillColor}
		stroke={strokeColor}
		scalablePath={path_scalable}
	/>
	{#if path_extra}
		<SVGD3
			fill={strokeColor}
			name='dragInnerDot'
			stroke={strokeColor}
			y={extraOffset + 4}
			width={extraDiameter}
			height={extraDiameter}
			scalablePath={path_extra}
			x={extraOffset + left + 3.5}
		/>
	{/if}
</button>
