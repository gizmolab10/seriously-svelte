<script>
	import { s_paths_expanded, s_dot_size, s_altering_parent, s_paths_grabbed, s_path_toolsGrab } from '../../ts/managers/State';
	import { svgPath, onMount, Direction, onDestroy, dbDispatch, graphEditor } from "../../ts/common/GlobalImports";
	import { k, get, Size, Thing, Point, debug, ZIndex, Widget, signals } from "../../ts/common/GlobalImports";
	import SVGD3 from '../svg/SVGD3.svelte';
	export let widget;
	export let thing;
	let bulkAliasFillColor = k.backgroundColor;
	let insidePath = svgPath.circle(16, 6);
	let fillColor = k.backgroundColor;
	let strokeColor = thing.color;
	let isHovering = false;
	let scalablePath = '';
	let clickCount = 0;
	let button = null;
	let clickTimer;
	
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
		const _ = $s_paths_expanded;
		updatePath();
	}

	$: {
		if (strokeColor != thing.color) {
			strokeColor = thing.color
			updateColors();
		}
	}

	$: {
		if ($s_dot_size > 0) {
			updatePath();
		}
	}

	$: {
		if ($s_paths_grabbed != null || thing != null) {
			updateColors();
			updatePath();
		}

	}

	function setIsHovering_updateColors(hovering) {
		isHovering = hovering;
		updateColors();
	}

	function updateColors() {
		thing.updateColorAttributes(widget.path);
		const collapsedGrabbed = !widget.path.isExpanded || widget.path.isGrabbed;
		fillColor = thing.revealColor(collapsedGrabbed != isHovering, widget.path);
		bulkAliasFillColor = thing.revealColor(collapsedGrabbed == isHovering, widget.path);
	}

	function updatePath() {
		if ((!thing.hasChildren && !thing.isBulkAlias) || $s_path_toolsGrab?.endsWithID(thing.id)) {
			scalablePath = svgPath.circle($s_dot_size, $s_dot_size / 2);
		} else {
			const goLeft = widget.path.isExpanded && widget.thing.hasChildren;
			const direction = goLeft ? Direction.left : Direction.right;
			scalablePath = svgPath.triangle($s_dot_size, direction);
			if (thing.isBulkAlias) {
				insidePath = svgPath.circle($s_dot_size, $s_dot_size / 3);
			}
		}
	}

	function handleClick(event) {
		setIsHovering_updateColors(false);
		const path = widget.path;
		if (path.toolsGrabbed) {
			$s_path_toolsGrab = null;
			$s_altering_parent = null;
		} else if (!thing.hasChildren) {
			widget.grabOnly();
			$s_path_toolsGrab = path;
		} else {
			dbDispatch.db.hierarchy.path_redraw_remoteMoveRight(path, !path.isExpanded, true, false);
			return;
		}
		signals.signal_rebuild_fromHere();
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
			if ($s_path_toolsGrab == path) {
				$s_path_toolsGrab = null;
			} else {
				path.grabOnly();
				$s_path_toolsGrab = path;
			}
			signals.signal_rebuild_fromHere();
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
		width={$s_dot_size}px;
		height={$s_dot_size}px;
		top: {$s_dot_size / 2 - 3}px;
		left: {$s_dot_size + thing.titleWidth - 7}px;
	'>
	{#key scalablePath}
		<SVGD3
			size={$s_dot_size}
			stroke={strokeColor}
			zIndex={ZIndex.dots}
			scalablePath={scalablePath}
			fill={debug.lines ? 'transparent' : fillColor}
		/>
	{/key}
	{#if thing.isBulkAlias}
		<div style='left:-1px; width:14px; height:14px; position:absolute;'>
			<SVGD3
				size={$s_dot_size}
				stroke={strokeColor}
				zIndex={ZIndex.dots}
				fill={bulkAliasFillColor}
				scalablePath={insidePath}
			/>
		</div>
	{/if}
</button>