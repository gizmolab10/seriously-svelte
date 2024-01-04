<script>
	import { k, Size, Point, Thing, debug, ZIndex, onMount, svgPath, onDestroy } from "../../ts/common/GlobalImports";
	import { Direction, dbDispatch, graphEditor, handle_addParent } from "../../ts/common/GlobalImports";
	import { dot_size, add_parent, ids_grabbed, id_showingTools } from '../../ts/managers/State';
	import SVGD3 from '../svg/SVGD3.svelte';
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
	function handleMouseIn(event) { updateColorsForIsHovering(true); }
	function handleMouseUp() { clearTimeout(clickTimer); }
	function handleMouseOut(event) { updateColorsForIsHovering(false); }
	function handleContextMenu(event) { event.preventDefault(); } 		// Prevent the default context menu on right-

    onMount(() => {
		updateColorsForIsHovering(false);
        handler = handle_addParent((childID) => {
			alter = !alter == (!childID || !thing.canAddChild);
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

	function updateColorsForIsHovering(flag) {
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
		thing.becomeHere();
    }

	function handleSingleClick(event) {
		clickCount++;
		clickTimer = setTimeout(() => {
			if (clickCount === 1) {
				handleClick(event);
				clearClicks();
			}
		}, k.doubleClickThreshold);
	}

	async function handleClick(event) {
		if (!thing.isExemplar) {
			if ($add_parent) {
				add_parentMaybe();
			} else if (event.shiftKey || isGrabbed) {
				thing.toggleGrab();
			} else {
				thing.grabOnly();
			}
		}
	}

	function add_parentMaybe() {
		if (thing.canAddChild) {
			alert('hah');	// create a new relationship
		}
	}

	$: {
		if ($dot_size > 0) {
			size = $dot_size;
			top = $id_showingTools == thing.id ? 23 : -size / 2 + 2;
			left = 1.5 - (size / 2); // offset from center?
			path = svgPath.oval(size, false);
			if (thing.parents.length > 1) {
				extra = svgPath.circle(size, size / 5);74
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
