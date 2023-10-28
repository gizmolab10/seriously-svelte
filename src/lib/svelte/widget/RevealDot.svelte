<script>
	import { k, noop, Thing, Point, ZIndex, dbDispatch, Signals, handleSignalOfKind } from "../../ts/common/GlobalImports";
	import { onMount, onDestroy, graphEditor, Direction, FatTrianglePath } from "../../ts/common/GlobalImports";
	import { dotDiameter } from '../../ts/managers/State';
	export let thing;
	const longClickThreshold = 500;
	const doubleClickThreshold = 200;				// one fifth of a second
	let triangle = new FatTrianglePath($dotDiameter + 2, Direction.left);
	let fillColor = k.backgroundColor;
	let path = triangle.path;
	let clickCount = 0;
	let button = null;
	let clickTimer;
	
	onMount( () => { updateState(false); });
	onDestroy( () => { signalHandler.disconnect(); });
	function handleMouseUp() { clearTimeout(clickTimer); }
	function handleMouseOut(event) { updateColors(false); }
	function handleMouseOver(event) { updateColors(true); }
	function handleContextMenu(event) { event.preventDefault(); } 		// Prevent the default context menu on right-

	function updateState(isHovering) {
		updateColors(isHovering);
		updatePath();
	}

	const signalHandler = handleSignalOfKind(Signals.dots, (id) => {
		if (thing.id == id) {
			updatePath();
		}
	});

	function updateColors(isHovering) {
		thing.updateColorAttributes();
		const buttonFlag = !thing.isExpanded || thing.isGrabbed;
		fillColor = thing.revealColor(buttonFlag != isHovering);
	}

	function updatePath() {
		const asTriangle = thing.hasChildren || thing.isBulkAlias;
		if (asTriangle) {
			const direction = thing.isExpanded ? Direction.left : Direction.right;
			triangle = new FatTrianglePath($dotDiameter + 2, direction);
			path = triangle.path;
		} else {
			path = null;
		}
	}

	function clearClicks() {
		clickCount = 0;
		clearTimeout(clickTimer);	// clear all previous timers
	}

	function handleLongClick(event) {
		clearClicks();
		clickTimer = setTimeout(() => {
			// do nothing
		}, longClickThreshold);
	}

	function handleDoubleClick(event) {
		clearClicks();
		// do nothing
    }

	function handleSingleClick(event) {
		clickCount++;

		clickTimer = setTimeout(() => {
			if (clickCount === 1) {
				handleClick(event);
			}
			clearClicks();
		}, doubleClickThreshold);
	}

	function handleClick(event) {
		graphEditor.thing_redraw_remoteMoveRight(thing, !thing.isExpanded, true);
		updateState(false);
	}

</script>

<button class='svg-button'
	bind:this={button}
	style='
		top: 5px;
		left: {$dotDiameter + thing.titleWidth + 23}px;
	'>
	<svg width='16'
		height='16'
		viewbox='0 0 16 16'
		on:blur={noop()}
		on:focus={noop()}
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
			top: 0px;
			z-index: {ZIndex.dots};'>
		<path d={path} stroke={thing.color} fill={fillColor}/>
	</svg>
</button>

<style>
	.svg-button {
		position: absolute;
		width: 16px;	 /* Match SVG viewbox width */
		height: 16px;	/* Match SVG viewbox height */
		cursor: pointer;
		background: none;
		border: none;
	}

	.svg-button svg {
	}

	.svg-button:hover {
			/* Styles for hover state, e.g., change SVG color */
	}

	.svg-button:active {
			/* Styles for active state */
	}

	.svg-button:focus {
			/* Styles for focus state, e.g., add an outline or change SVG color */
	}
</style>