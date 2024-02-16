<script>
	import { s_paths_expanded, s_dot_size, s_altering_parent, s_paths_grabbed, s_path_toolsCluster } from '../../ts/managers/State';
	import { k, u, get, Size, Thing, Point, debug, ZIndex, svgPath, signals } from "../../ts/common/GlobalImports";
	import { onMount, Wrapper, Direction, onDestroy, dbDispatch, IDWrapper } from "../../ts/common/GlobalImports";
	import SVGD3 from '../svg/SVGD3.svelte';
	export let center;
	export let thing;
	export let path;
	let bulkAliasFillColor = k.backgroundColor;
	let insidePath = svgPath.circle(16, 6);
	let fillColor = k.backgroundColor;
	let strokeColor = thing.color;
	let revealWrapper = Wrapper;
	let isHovering = false;
	let scalablePath = '';
	let revealDot = null;
	let clickCount = 0;
	let clickTimer;
	
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
		if (revealDot &&!path.matchesPath($s_path_toolsCluster)) {
			revealWrapper = new Wrapper(revealDot, path, IDWrapper.reveal);
		}
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
		thing.updateColorAttributes(path);
		const collapsedGrabbed = !path.isExpanded || path.isGrabbed;
		fillColor = thing.revealColor(collapsedGrabbed != isHovering, path);
		bulkAliasFillColor = thing.revealColor(collapsedGrabbed == isHovering, path);
	}

	function updatePath() {
		if ((!path.hasChildren && !thing.isBulkAlias) || $s_path_toolsCluster?.matchesPath(path)) {
			scalablePath = svgPath.circle($s_dot_size, $s_dot_size / 2);
		} else {
			const goLeft = path.isExpanded && path.hasChildren;
			const direction = goLeft ? Direction.left : Direction.right;
			scalablePath = svgPath.triangle($s_dot_size, direction);
			if (thing.isBulkAlias) {
				insidePath = svgPath.circle($s_dot_size, $s_dot_size / 3);
			}
		}
	}

	function handleClick(event) {
		setIsHovering_updateColors(false);
		if (!path.isRoot) {
			if (path.toolsGrabbed) {
				$s_path_toolsCluster = null;
				$s_altering_parent = null;
			} else if (!path.hasChildren) {
				path.grabOnly();
				$s_path_toolsCluster = path;
			} else {
				k.hierarchy.path_rebuild_remoteMoveRight(path, !path.isExpanded, true, false);
				return;
			}
			signals.signal_rebuild_fromHere();
		}
	}

	function handleDoubleClick(event) {
		clearClicks();
		// do nothing
    }
 
	function handleLongClick(event) {
		clearClicks();
		clickTimer = setTimeout(() => {
			clearClicks();
			if (!path.isRoot) {
				if ($s_path_toolsCluster == path) {
					$s_path_toolsCluster = null;
				} else  {
					path.grabOnly();
					$s_path_toolsCluster = path;
				}
				signals.signal_rebuild_fromHere();
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

<div class='revealDot' style='z-index:{ZIndex.dots}'>
	<button class='dot'
		on:blur={u.ignore}
		on:focus={u.ignore}
		on:keyup={u.ignore}
		bind:this={revealDot}
		on:keydown={u.ignore}
		on:keypress={u.ignore}
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
			top: {$s_dot_size / 2 + center.y - 2}px;
			left: {$s_dot_size + center.x + thing.titleWidth - 7}px;
		'>
		{#key scalablePath}
			<SVGD3
				size={$s_dot_size}
				stroke={strokeColor}
				scalablePath={scalablePath}
				fill={debug.lines ? 'transparent' : fillColor}
			/>
		{/key}
		{#if thing.isBulkAlias}
			<div style='left:-1px; width:14px; height:14px; position:absolute;'>
				<SVGD3
					size={$s_dot_size}
					stroke={strokeColor}
					fill={bulkAliasFillColor}
					scalablePath={insidePath}
				/>
			</div>
		{/if}
	</button>
</div>