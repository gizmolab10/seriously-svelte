<script lang='ts'>
	import { noop, Thing, onMount, ZIndex, signal, Signals, BrowserType, getBrowserType, dbDispatch } from '../../ts/common/GlobalImports';
	import { idsGrabbed, dotDiameter } from '../../ts/managers/State';
	export let thing = Thing;
	const longClickThreshold = 500;
	const doubleClickThreshold = 100;				// one fifth of a second
	const browserType = getBrowserType();
	let hoverColor = thing.color;
	let fillColor = thing.color;
	let placement = 'left: 5px; top: 4px;'			// tiny browser compensation
	let isGrabbed = false;
	let clickCount = 0;
	let clickTimer;
	let dot = null;
	
	function handleContextMenu(event) { event.preventDefault(); } 		// Prevent the default context menu on right-
	function handleMouseOut(event) { updateColors(false); }
	function handleMouseOver(event) { updateColors(true); }
	function handleMouseUp() { clearTimeout(clickTimer); }

	onMount( () => {
		updateColors(false);		
		if (browserType != BrowserType.chrome) {
			placement = 'top: 2px; left: 5px;'
		}
	});

	function updateColors(isHovering) {
		thing.updateColorAttributes();	// needed for revealColor
		fillColor = thing.revealColor(isHovering);
		hoverColor = thing.revealColor(!isHovering);
	}

	$: {
		const grabbed = $idsGrabbed?.includes(thing.id);
		if (isGrabbed != grabbed) {
			isGrabbed = grabbed;
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
			clearClicks();
			// do nothing
		}, longClickThreshold);
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
		}, doubleClickThreshold);
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

<button class='dragDot'
	bind:this={dot}
	on:blur={noop()}
	on:focus={noop()}
	on:keypress={noop()}
	on:mouseup={handleMouseUp}
    on:click={handleSingleClick}
	on:mouseout={handleMouseOut}
	on:mouseover={handleMouseOver}
    on:mousedown={handleLongClick}
    on:dblclick={handleDoubleClick}
    on:contextmenu={handleContextMenu}
	style='{placement}
		z-index: {ZIndex.dots};
		width:{$dotDiameter}px;
		height:{$dotDiameter}px;
		background-color: {fillColor};
		border-color: {thing.color};
		color: {hoverColor};'>
</button>

<style lang='scss'>
	.dragDot {
		min-width: 1px;
		cursor: pointer;
		border: 1px solid;
		border-radius: 50%;
		position: relative;
	}
</style>
