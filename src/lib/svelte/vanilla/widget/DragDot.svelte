<script>
	import { k, Size, Point, Thing, debug, ZIndex, Signals, onMount } from "../../../ts/common/GlobalImports";
	import { graphEditor, dbDispatch, Direction, svgPath } from "../../../ts/common/GlobalImports";
	import { dot_size, ids_grabbed, id_showRevealCluster } from '../../../ts/managers/State';
	import SVGD3 from '../../kit/SVGD3.svelte';
	export let thing;
	let hoverColor = thing.color;
	let fillColor = thing.color;
	let isGrabbed = false;
	let clickCount = 0;
	let button = null;
	let clickTimer;
	let path = '';
	let size = 0;
	let left = 0;
	let top = 0;
	
	function handleContextMenu(event) { event.preventDefault(); } 		// Prevent the default context menu on right-
	function handleMouseOut(event) { updateColors(false); }
	function handleMouseOver(event) { updateColors(true); }
	function handleMouseUp() { clearTimeout(clickTimer); }
	function ignore(event) {}
	
	onMount( () => {
		updateColors(false);
	});

	$: {
		const grabbed = $ids_grabbed?.includes(thing.id);
		if (isGrabbed != grabbed) {
			isGrabbed = grabbed;
			updateColors(false);
		}
	}

	function updateColors(isHovering) {
		thing.updateColorAttributes();	// needed for revealColor
		const flag = isHovering;
		hoverColor = thing.revealColor(!flag);
		fillColor = debug.lines ? 'transparent' : thing.revealColor(flag);
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
		if (thing.isExemplar) { return; }
		if (event.shiftKey || isGrabbed) {
			thing.toggleGrab();
		} else {
			thing.grabOnly();
		}
	}

	$: {
		if ($dot_size > 0) {
			size = $dot_size;
			left = 1 - (size / 2);
			path = svgPath.oval(size, false);
			top = $id_showRevealCluster == thing.id ? 23 : -5;
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
	on:mouseover={handleMouseOver}
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
		stroke={thing.color}
		zIndex={ZIndex.dots}
		size={Size.square(size)}
	/>
</button>
