<script>
	import { k, Thing, Point, debug, ZIndex, Signals, onMount } from "../../ts/common/GlobalImports";
	import { graphEditor, dbDispatch, Direction, svgPath } from "../../ts/common/GlobalImports";
	import { dot_size, ids_grabbed, id_showRevealCluster } from '../../ts/managers/State';
	export let center = new Point();
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
		if ($dot_size > 0) {
			size = $dot_size;
			left = (size / 8) - 6;
			path = svgPath.oval(size, false);
			top = $id_showRevealCluster == thing.id ? 23 : left / 2 + 1;
		}
	}

	$: {
		const grabbed = $ids_grabbed?.includes(thing.id);
		if (isGrabbed != grabbed) {
			isGrabbed = grabbed;
			updateColors(false);
		}
	}

	function updateColors(isHovering) {
		thing.updateColorAttributes();	// needed for revealColor
		const flag = isHovering;// && thing.hasChildren;
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

</script>

<style>
	.dot {
		border: none;
		cursor: pointer;
		background: none;
		position: relative;
	}
</style>

<button class='dot'
	bind:this={button}
	style='
		top: {(size / 2) - 6}px;
		width: {size}px;	 /* Match SVG viewbox width */
		height: {size}px;	/* Match SVG viewbox height */
	'>
	<svg width={size}
		height={size}
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
		viewbox='0 0 {size} {size}'
		style='
			top: {top}px;
			left: {left}px;
			position: relative;
			z-index: {ZIndex.dots};'>
		<path d={path} stroke={thing.color} fill={fillColor}/>
	</svg>
</button>