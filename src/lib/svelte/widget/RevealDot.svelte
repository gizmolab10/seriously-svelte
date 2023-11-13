<script>
	import { k, noop, Thing, Point, ZIndex, Signals, SVGType, svgFactory, dbDispatch } from "../../ts/common/GlobalImports";
	import { onMount, onDestroy, graphEditor, Direction, handleSignalOfKind } from "../../ts/common/GlobalImports";
	import { dotDiameter, idShowRevealCluster } from '../../ts/managers/State';
	export let thing;
	const longClickThreshold = 500;
	const doubleClickThreshold = 100;				// one fifth of a second
	let path = svgFactory.triangle($dotDiameter + 2, Direction.left);
	let insidePath = svgFactory.circle(16, 6);
	let antiFillColor = k.backgroundColor;
	let fillColor = k.backgroundColor;
	let clickCount = 0;
	let button = null;
	let clickTimer;
	
	onMount( () => { updateState(false); });
	onDestroy( () => { signalHandler.disconnect(); });
	function handleMouseUp() { clearTimeout(clickTimer); }
	function handleMouseOut(event) { updateColors(false); }
	function handleMouseOver(event) { updateColors(true); }
	function handleContextMenu(event) { event.preventDefault(); } 		// Prevent the default context menu on right

	function handleClick(event) {
		if ($idShowRevealCluster == thing.id) {
			$idShowRevealCluster = null;
		} else {
			graphEditor.thing_redraw_remoteMoveRight(thing, !thing.isExpanded, true);
		}
		updateState(false);
	}

	function handleDoubleClick(event) {
		clearClicks();
		// do nothing
    }
 
	function clearClicks() {
		clickCount = 0;
		clearTimeout(clickTimer);	// clear all previous timers
	}

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
		antiFillColor = thing.revealColor(buttonFlag == isHovering);
	}

	function handleLongClick(event) {
		clearClicks();
		clickTimer = setTimeout(() => {
			clearClicks();
			thing.grabOnly()
			$idShowRevealCluster = thing.id;
		}, longClickThreshold);
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

	function updatePath() {
		if (!thing.hasChildren && !thing.isBulkAlias) {
			path = svgFactory.oval(16);			// horizontal oval
		} else {
			const direction = (thing.isExpanded && thing.hasChildren) ? Direction.left : Direction.right;
			path = svgFactory.triangle($dotDiameter + 2, direction);
			if (thing.isBulkAlias) {
				insidePath = svgFactory.circle(16, 6);
			}
		}
	}

</script>

<button class='dot'
	bind:this={button}
	style='
		left: {$dotDiameter + thing.titleWidth + 10}px;
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
			top: 0px;
			z-index: {ZIndex.dots};'>
		<path d={path} stroke={thing.color} fill={fillColor}/>
		{#if thing.isBulkAlias && !thing.hasChildren}
			<path d={insidePath} stroke={thing.color} fill={antiFillColor}/>
		{/if}
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