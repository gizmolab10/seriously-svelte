<script>
	import { k, get, Size, Thing, Point, ZIndex, Signals, onMount, onDestroy, dbDispatch } from "../../ts/common/GlobalImports";
	import { Direction, graphEditor, DebugOption, svgPath, handleSignalOfKind } from "../../ts/common/GlobalImports";
	import { dot_size, id_showRevealCluster } from '../../ts/managers/State';
	export let thing;
	let diameter = $dot_size;
	let path = svgPath.triangle(Size.square(diameter), Direction.left);
	let insidePath = svgPath.circle(16, 6);
	let antiFillColor = k.backgroundColor;
	let fillColor = k.backgroundColor;
	let clickCount = 0;
	let button = null;
	let clickTimer;
	
	function ignore(event) {}
	onMount( () => { updateState(false); });
	onDestroy( () => { signalHandler.disconnect(); });
	function handleMouseUp() { clearTimeout(clickTimer); }
	function handleMouseOut(event) { updateColors(false); }
	function handleMouseOver(event) { updateColors(true); }
	function handleContextMenu(event) { event.preventDefault(); } 		// Prevent the default context menu on right

	function clearClicks() {
		clickCount = 0;
		clearTimeout(clickTimer);	// clear all previous timers
	}

	const signalHandler = handleSignalOfKind(Signals.dots, (id) => {
		if (thing.id == id) {
			updatePath();
		}
	});

	function updateState(isHovering) {
		updateColors(isHovering);
		updatePath();
	}

	function updateColors(isHovering) {
		thing.updateColorAttributes();
		const buttonFlag = !thing.isExpanded || thing.isGrabbed;
		fillColor = thing.revealColor(buttonFlag != isHovering);
		antiFillColor = thing.revealColor(buttonFlag == isHovering);
	}

	function updatePath() {
		if ((!thing.hasChildren && !thing.isBulkAlias) || ($id_showRevealCluster == thing.id)) {
			path = svgPath.circle(get(dot_size), 8);
		} else {
			const direction = (thing.isExpanded && thing.hasChildren) ? Direction.left : Direction.right;
			path = svgPath.triangle(Size.square(diameter), direction);
			if (thing.isBulkAlias) {
				insidePath = svgPath.circle(16, 6);
			}
		}
	}

	function handleClick(event) {
		if ($id_showRevealCluster == thing.id) {
			thing.debugLog('CLICK');
			$id_showRevealCluster = null;
		} else {
			graphEditor.thing_redraw_remoteMoveRight(thing, !thing.isExpanded, true);
		}
		updateState(false);
	}

	function handleDoubleClick(event) {
		clearClicks();
		// do nothing
    }
 
	function handleLongClick(event) {
		clearClicks();
		clickTimer = setTimeout(() => {
			clearClicks();
			if ($id_showRevealCluster == thing.id) {
				thing.debugLog('LONG');
				$id_showRevealCluster = null;
			} else {
				thing.grabOnly()
				$id_showRevealCluster = thing.id;
			}
		}, k.longClickThreshold);
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

</script>

<button class='dot'
	bind:this={button}
	style='
		width={diameter}px;
		height={diameter}px;
		left: {diameter + thing.titleWidth + 2}px;
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
			left: 0px;
			top: -1px;
			z-index: {ZIndex.dots};'>
		<path d={path} stroke={thing.color} fill={fillColor}/>
		{#if thing.isBulkAlias}
			<path d={insidePath} stroke={thing.color} fill={antiFillColor}/>
		{/if}
	</svg>
</button>

<style>
	.dot {
		top: 7px;
		border: none;
		cursor: pointer;
		background: none;
		position: absolute;
	}
</style>