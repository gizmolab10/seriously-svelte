<script>
	import { k, Size, Point, Thing, debug, ZIndex, onMount, signals, svgPath } from "../../ts/common/GlobalImports";
	import { Direction, onDestroy, dbDispatch, graphEditor, AlteringParent } from "../../ts/common/GlobalImports";
	import { s_dot_size, s_paths_grabbed, s_path_toolsGrab } from '../../ts/managers/State';
	import SVGD3 from '../svg/SVGD3.svelte';
    export let widget;
	export let thing;
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
	let extra = null;
	let clickTimer;
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
        handler = signals.handle_alteringParent((alteration) => {
			const applyFlag = $s_path_toolsGrab && widget.path.things_canAlter_asParentOf_toolsGrab;
			extra = (thing.parents.length < 2) ? null : svgPath.circle(size, size / 5);
			altering = applyFlag ? (alteration != null) : false;
			updateColors();
        })
    })

	$: {
		const grabbed = $s_paths_grabbed?.filter(p => p.endsWithID(thing.id)).length > 0;
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
		const asReveal = isHovering == altering;
		thing.updateColorAttributes(widget.path);	// for revealColor
		tinyDotColor = thing.revealColor(asReveal, widget.path);
		fillColor = debug.lines ? 'transparent' : thing.revealColor(!asReveal, widget.path);
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
		widget.path.becomeHere();
    }

	function handleSingleClick(event) {
		clickCount++;
		clickTimer = setTimeout(() => {
			if (clickCount === 1) {
				widget.path.clicked_dragDot(event.shiftKey);
				clearClicks();
			}
		}, k.doubleClickThreshold);
	}

	$: {
		if ($s_dot_size > 0) {
			size = $s_dot_size;
			scalablePath = svgPath.oval(size, false);
			left = 1 - (size / 2); // offset from center?
			top = widget.path.toolsGrabbed ? 23 : -size / 2 + 2;
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
		size={size}
		fill={fillColor}
		stroke={strokeColor}
		zIndex={ZIndex.dots}
		scalablePath={scalablePath}
	/>
	{#if extra}
		<SVGD3
			size={size}
			fill={tinyDotColor}
			zIndex={ZIndex.dots}
			scalablePath={extra}
			stroke={tinyDotColor}
		/>
	{/if}
</button>
