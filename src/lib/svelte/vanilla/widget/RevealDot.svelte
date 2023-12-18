<script>
	import { k, get, Size, Thing, Point, debug, ZIndex, Signals, onMount } from "../../../ts/common/GlobalImports";
	import { svgPath, Direction, onDestroy, dbDispatch, graphEditor } from "../../../ts/common/GlobalImports";
	import { expanded, dot_size, ids_grabbed, id_showRevealCluster } from '../../../ts/managers/State';
	import SVGD3 from '../../kit/SVGD3.svelte';
	export let center = new Point();
	export let thing;
	let insidePath = svgPath.circle(16, 6);
	let aliasFillColor = k.backgroundColor;
	let fillColor = k.backgroundColor;
	let strokeColor = thing.color;
	let isHovering = false;
	let size = $dot_size;
	let clickCount = 0;
	let button = null;
	let clickTimer;
	let path = '';
	
	function ignore(event) {}
	onMount( () => { setIsHovering_updateColors(false); updatePath(); });
	function handleContextMenu(event) { event.preventDefault(); } 		// Prevent the default context menu on right
	function handleMouseOut(event) { setIsHovering_updateColors(false); }
	function handleMouseOver(event) { setIsHovering_updateColors(true); }
	function handleMouseUp() { clearTimeout(clickTimer); }

	function clearClicks() {
		clickCount = 0;
		clearTimeout(clickTimer);	// clear all previous timers
	}

	$: {
		const _ = $expanded;
		updatePath();
	}

	$: {
		if (strokeColor != thing.color) {
			strokeColor = thing.color
			updateColors();
		}
	}

	$: {
		if ($dot_size > 0) {
			size = $dot_size;
			updatePath();
		}
	}

	$: {
		if ($ids_grabbed != null) {
			updateColors();
		}

	}

	function setIsHovering_updateColors(hovering) {
		isHovering = hovering;
		updateColors();
	}

	function updateColors() {
		thing.updateColorAttributes();
		const collapsedGrabbed = !thing.isExpanded || thing.isGrabbed;
		fillColor = thing.revealColor(collapsedGrabbed != isHovering);
		aliasFillColor = thing.revealColor(collapsedGrabbed == isHovering);
	}

	function updatePath() {
		if ((!thing.hasChildren && !thing.isBulkAlias) || ($id_showRevealCluster == thing.id)) {
			path = svgPath.circle(size, size / 2);
		} else {
			const direction = (thing.isExpanded && thing.hasChildren) ? Direction.left : Direction.right;
			path = svgPath.triangle(Size.square(size), direction);
			if (thing.isBulkAlias) {
				insidePath = svgPath.circle(size, size / 3);
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
		setIsHovering_updateColors(false);
		updatePath();
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
		width={size}px;
		height={size}px;
		top: {$dot_size / 2 - 1}px;
		left: {size + thing.titleWidth - 5}px;
	'>
	<SVGD3
		path={path}
		fill={debug.lines ? 'transparent' : fillColor}
		stroke={strokeColor}
		zIndex={ZIndex.dots}
		size={Size.square(size)}
	/>
	{#if thing.isBulkAlias}
		<div style='left:-1px; width:14px; height:14px; position:absolute;'>
			<SVGD3
				path={insidePath}
				fill={aliasFillColor}
				stroke={strokeColor}
				zIndex={ZIndex.dots}
				size={Size.square(size)}
			/>
		</div>
	{/if}
</button>