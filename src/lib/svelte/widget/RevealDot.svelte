<script>
	import { Direction, onDestroy, dbDispatch, graphEditor, signal_rebuild_fromHere } from "../../ts/common/GlobalImports";
	import { k, get, Size, Thing, Point, debug, ZIndex, Widget, onMount, svgPath } from "../../ts/common/GlobalImports";
	import { paths_expanded, dot_size, altering_parent, paths_grabbed, path_toolsGrab } from '../../ts/managers/State';
	import SVGD3 from '../svg/SVGD3.svelte';
	export let widget;
	export let thing;
	let bulkAliasFillColor = k.backgroundColor;
	let insidePath = svgPath.circle(16, 6);
	let fillColor = k.backgroundColor;
	let strokeColor = thing.color;
	let isHovering = false;
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
		const _ = $paths_expanded;
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
			updatePath();
		}
	}

	$: {
		if ($paths_grabbed != null || thing != null) {
			updateColors();
			updatePath();
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
		bulkAliasFillColor = thing.revealColor(collapsedGrabbed == isHovering);
	}

	function updatePath() {
		if ((!thing.hasChildren && !thing.isBulkAlias) || ($path_toolsGrab == thing.id)) {
			path = svgPath.circle($dot_size, $dot_size / 2);
		} else {
			const direction = (thing.isExpanded && thing.hasChildren) ? Direction.left : Direction.right;
			path = svgPath.triangle(Size.square($dot_size), direction);
			if (thing.isBulkAlias) {
				insidePath = svgPath.circle($dot_size, $dot_size / 3);
			}
		}
	}

	function handleClick(event) {
		setIsHovering_updateColors(false);
		if ($path_toolsGrab == thing.id) {
			$path_toolsGrab = null;
			$altering_parent = null;
		} else if (!thing.hasChildren) {
			widget.grabOnly();
			$path_toolsGrab = thing.id;
		} else {
			graphEditor.widget_redraw_remoteMoveRight(thing, !thing.isExpanded, true);
			return;
		}
		signal_rebuild_fromHere();
	}

	function handleDoubleClick(event) {
		clearClicks();
		// do nothing
    }
 
	function handleLongClick(event) {
		clearClicks();
		clickTimer = setTimeout(() => {
			clearClicks();
			const path = widget.path;
			if ($path_toolsGrab == path) {
				$path_toolsGrab = null;
			} else {
				dbDispatch.db.hierarchy.grabs.grabOnly(path);
				$path_toolsGrab = path;
			}
			signal_rebuild_fromHere();
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
		width={$dot_size}px;
		height={$dot_size}px;
		top: {$dot_size / 2 - 2 - (thing.isGrabbed ? 0 : 1)}px;
		left: {$dot_size + thing.titleWidth - 5}px;
	'>
	{#key path}
		<SVGD3
			path={path}
			fill={debug.lines ? 'transparent' : fillColor}
			stroke={strokeColor}
			zIndex={ZIndex.dots}
			size={Size.square($dot_size)}
		/>
	{/key}
	{#if thing.isBulkAlias}
		<div style='left:-1px; width:14px; height:14px; position:absolute;'>
			<SVGD3
				path={insidePath}
				stroke={strokeColor}
				zIndex={ZIndex.dots}
				size={Size.square($dot_size)}
				fill={bulkAliasFillColor}
			/>
		</div>
	{/if}
</button>