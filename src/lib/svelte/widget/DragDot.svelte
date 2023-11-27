<script>
	import { Direction, BrowserType, getBrowserType, svgPath, handleSignalOfKind } from "../../ts/common/GlobalImports";
	import { k, Thing, Point, ZIndex, Signals, onMount, graphEditor, dbDispatch } from "../../ts/common/GlobalImports";
	import { dotSize, idsGrabbed, idShowRevealCluster } from '../../ts/managers/State';
	export let thing;
	let diameter = $dotSize;
	const browserType = getBrowserType();
	const path = svgPath.oval(diameter, false);
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
	function ignore(event) {}
	
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

	function updateColors(isHovering) {
		thing.updateColorAttributes();	// needed for revealColor
		const flag = isHovering;// && thing.hasChildren;
		hoverColor = thing.revealColor(!flag);
		fillColor = thing.revealColor(flag);
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

<button class='dot'
	bind:this={button}
	style='
		left: 1px;
		width: {diameter}px;	 /* Match SVG viewbox width */
		height: {diameter}px;	/* Match SVG viewbox height */
	'>
	<svg width={diameter}
		height={diameter}
		viewbox='0 0 {diameter} {diameter}'
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
			position: absolute;
			left: 1px;
			top: {$idShowRevealCluster == thing.id ? 23 : -2}px;
			z-index: {ZIndex.dots};'>
		<path d={path} stroke={thing.color} fill={fillColor}/>
	</svg>
</button>

<style>
	.dot {
		top: 6px;
		border: none;
		cursor: pointer;
		background: none;
		position: absolute;
	}
</style>