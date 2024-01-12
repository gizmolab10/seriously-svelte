<script>
	import { k, Size, Point, Thing, debug, ZIndex, onMount, svgPath, onDestroy, AlteringParent } from "../../ts/common/GlobalImports";
	import { Direction, dbDispatch, graphEditor, handle_alteringParent } from "../../ts/common/GlobalImports";
	import { dot_size, ids_grabbed, id_toolsGrab } from '../../ts/managers/State';
	import SVGD3 from '../svg/SVGD3.svelte';
    export let widget;
	export let thing;
	let tinyDotColor = thing.color;
	let strokeColor = thing.color;
	let fillColor = thing.color;
	let isHovering = true;
	let isGrabbed = false;
	let clickCount = 0;
	let handler = null;
	let alter = false;
	let button = null;
	let extra = null;
	let clickTimer;
	let path = '';
	let size = 0;
	let left = 0;
	let top = 0;
	
	function ignore(event) {}
    onDestroy(() => { handler.disconnect(); })
	function handleMouseIn(event) { updateColorsForHover(true); }
	function handleMouseUp() { clearTimeout(clickTimer); }
	function handleMouseOut(event) { updateColorsForHover(false); }
	function handleContextMenu(event) { event.preventDefault(); } 		// Prevent the default context menu on right-

    onMount(() => {
		updateColorsForHover(false);
        handler = handle_alteringParent((alteration) => {
			const applyFlag = $id_toolsGrab && thing.canAlterParentOf_toolsGrab != null;
			alter = applyFlag ? (alteration != null) : false;
			extra = (thing.parents.length < 2) ? null : svgPath.circle(size, size / 5);
			updateColors();
        })
    })

	$: {
		const grabbed = $ids_grabbed?.includes(thing.id);
		if (isGrabbed != grabbed) {
			isGrabbed = grabbed;
			updateColors();
		}
	}

	$: {
		if (thing != null) {
			updateColors();
		}
	}

	function updateColors() {
		thing.updateColorAttributes();	// needed for revealColor
		fillColor = debug.lines ? 'transparent' : thing.revealColor(isHovering != alter);
		tinyDotColor = thing.revealColor(isHovering == alter);
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
		thing.becomeHere(widget.path);
    }

	function handleSingleClick(event) {
		clickCount++;
		clickTimer = setTimeout(() => {
			if (clickCount === 1) {
				thing.clicked_dragDot(event.shiftKey, widget);
				clearClicks();
			}
		}, k.doubleClickThreshold);
	}

	$: {
		if ($dot_size > 0) {
			size = $dot_size;
			top = $id_toolsGrab == thing.id ? 23 : -size / 2 + 2;
			left = 1.5 - (size / 2); // offset from center?
			path = svgPath.oval(size, false);
			if (thing.parents.length > 1) {
				extra = svgPath.circle(size, size / 5);
			}
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

<button class='dot'
	bind:this={button}
	on:blur={ignore}
	on:focus={ignore}
	on:keyup={ignore}
	on:keydown={ignore}
	on:keypress={ignore}
	on:mouseup={handleMouseUp}
	on:click={handleSingleClick}
	on:mouseout={handleMouseOut}
	on:mouseover={handleMouseIn}
	on:mousedown={handleLongClick}
	on:dblclick={handleDoubleClick}
	on:contextmenu={handleContextMenu}
	style='
		top: {top}px;
		left: {left}px;
		width: {size}px;
		height: {size}px;
	'>
	<SVGD3
		path={path}
		fill={fillColor}
		stroke={strokeColor}
		zIndex={ZIndex.dots}
		size={Size.square(size)}
	/>
	{#if extra}
		<SVGD3
			path={extra}
			fill={tinyDotColor}
			zIndex={ZIndex.dots}
			stroke={tinyDotColor}
			size={Size.square(size)}
		/>
	{/if}
</button>
