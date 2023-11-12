<script>
	import { k, noop, Thing, Point, ZIndex, Signals, dbDispatch, BrowserType, getBrowserType, handleSignalOfKind } from "../../ts/common/GlobalImports";
	import { onMount, graphEditor, Direction, FatTrianglePath } from "../../ts/common/GlobalImports";
	import { idsGrabbed, dotDiameter, idShowRevealCluster } from '../../ts/managers/State';
	export let thing;
	const longClickThreshold = 500;
	const doubleClickThreshold = 100;				// one fifth of a second
	const browserType = getBrowserType();
	let path = 'M6,8 m-5,0a5,7 0 1,0 10,0a5,7 0 1,0 -10,0';
	let placement = 'left: 5px; top: 4px;'			// tiny browser compensation
	let hoverColor = thing.color;
	let fillColor = thing.color;
	let isGrabbed = false;
	let clickCount = 0;
	let button = null;
	let clickTimer;
	
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

	$: {
		const grabbed = $idsGrabbed?.includes(thing.id);
		if (isGrabbed != grabbed) {
			isGrabbed = grabbed;
			updateColors(false);
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

	function updateColors(isHovering) {
		thing.updateColorAttributes();	// needed for revealColor
		fillColor = thing.revealColor(isHovering);
		hoverColor = thing.revealColor(!isHovering);
	}

</script>

<button class='dot'
	bind:this={button}
	style='
		left: 3px;
		width: 16px;
	'>
	<svg width='16'
		height='16'
		viewbox='0 0 16 16'
		on:blur={noop()}
		on:focus={noop()}
		on:keyup={noop()}
		on:keydown={noop()}
		on:keypress={noop()}
		on:mouseup={handleMouseUp}
		on:click={handleSingleClick}
		on:mouseout={handleMouseOut}
		on:mouseover={handleMouseOver}
		on:mousedown={handleLongClick}
		on:dblclick={handleDoubleClick}
		on:contextmenu={handleContextMenu}
		style='
			position: absolute;
			left: 0px;
			top: {$idShowRevealCluster == thing.id ? 23 : 0}px;
			z-index: {ZIndex.dots};'>
		<path d={path} stroke={thing.color} fill={fillColor}/>
	</svg>
</button>

<style>
	.dot {
		top: 5px;
		width: 16px;	 /* Match SVG viewbox width */
		height: 16px;	/* Match SVG viewbox height */
		border: none;
		cursor: pointer;
		background: none;
		position: absolute;
	}
</style>