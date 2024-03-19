<script>
	import { s_paths_expanded, s_altering_parent, s_paths_grabbed, s_path_toolsCluster } from '../../ts/common/State';
	import { g, k, u, get, Size, Thing, Point, debug, ZIndex, svgPath, signals } from "../../ts/common/GlobalImports";
	import { onMount, Wrapper, Direction, onDestroy, dbDispatch, IDWrapper } from "../../ts/common/GlobalImports";
	import SVGD3 from '../svg/SVGD3.svelte';
	export let center;
	export let thing;
	export let path;
	let size = k.dot_size;
	let hasInsidePath = path.toolsGrabbed || thing.isBulkAlias;
	let insideOffset = hasInsidePath ? 0 : -1;
	let childrenCount = path.children.length;
	let insideFillColor = k.color_background;
	let tinyDotsOffset = size * -0.4 + 0.01;
	let insidePath = svgPath.circle(16, 6);
	let fillColor = k.color_background;
	let tinyDotsDiameter = size * 1.8;
	let strokeColor = thing.color;
	let revealWrapper = Wrapper;
	let isHovering = false;
	let scalablePath = '';
	let revealDot = null;
	let toggle = false;
	
	onMount( () => { setIsHovering_updateColors(false); updateScalablePaths(); });
	function handleContextMenu(event) { event.preventDefault(); } 		// Prevent the default context menu on right
	function mouseOut(event) { setIsHovering_updateColors(false); }
	function handleMouseOver(event) { setIsHovering_updateColors(true); }

	$: {
		if (revealDot &&!path.matchesPath($s_path_toolsCluster)) {
			revealWrapper = new Wrapper(revealDot, path, IDWrapper.reveal);
		}
	}

	$: {
		const _ = $s_paths_expanded;
		updateScalablePaths();
	}

	$: {
		if (strokeColor != thing.color) {
			strokeColor = thing.color
			updateColors();
		}
	}

	$: {
		if ($s_paths_grabbed != null || thing != null) {
			updateColors();
			updateScalablePaths();
		}
	}

	function setIsHovering_updateColors(hovering) {
		if (isHovering != hovering) {
			isHovering = hovering;
			updateColors();
			// console.log('toggle');
			toggle = !toggle;
		}
	}

	function updateColors() {
		thing.updateColorAttributes(path);
		const collapsedOrGrabbed = !path.isExpanded || path.isGrabbed;
		fillColor = path.dotColor(collapsedOrGrabbed != isHovering, path);
		insideFillColor = path.dotColor(collapsedOrGrabbed == isHovering, path);
	}

	function updateScalablePaths() {
		if (!path.showsReveal || path.toolsGrabbed) {
			scalablePath = svgPath.circle(size, size - 1);
		} else {
			const goLeft = path.showsChildren;
			const direction = goLeft ? Direction.left : Direction.right;
			scalablePath = svgPath.fatPolygon(size, direction);
		}
		if (thing.isBulkAlias) {
			insidePath = svgPath.circle(size, 3);
		} else if (path.toolsGrabbed) {
			insidePath = svgPath.xCross(size, 1.5);
		}
	}

	function handleClick(event) {
		setIsHovering_updateColors(false);
		if (path.toolsGrabbed) {
			$s_path_toolsCluster = null;
			$s_altering_parent = null;
			signals.signal_relayoutWidgets_fromHere();
		} else if (path.hasChildren || thing.isBulkAlias) {
			g.hierarchy.path_rebuild_remoteMoveRight(path, !path.isExpanded, true, false);
		}
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

{#key toggle}
	<div class='revealDot' style='
		top: {center.y}px;
		left: {center.x}px;
		position: absolute;
		width: {size}px;
		z-index: {ZIndex.dots};
		height: {size}px;'>
		<button class='dot'
			on:blur={u.ignore}
			on:focus={u.ignore}
			on:keyup={u.ignore}
			bind:this={revealDot}
			on:keydown={u.ignore}
			on:keypress={u.ignore}
			on:mouseout={mouseOut}
			on:click={handleClick}
			on:mouseover={handleMouseOver}
			on:contextmenu={handleContextMenu}
			style='
				width: {size}px;
				height: {size}px;
			'>
			{#key scalablePath}
				<SVGD3 name='revealDot'
					width={size}
					height={size}
					stroke={strokeColor}
					scalablePath={scalablePath}
					fill={debug.lines ? 'transparent' : fillColor}
				/>
			{/key}
			{#if hasInsidePath}
				<div class='revealInside' style='
					left:{insideOffset}px;
					height:{size}px;
					top:{insideOffset}px;
					width:{size}px;
					position:absolute;'>
					<SVGD3 name='revealInside'
						width={size}
						height={size}
						fill={insideFillColor}
						stroke={insideFillColor}
						scalablePath={insidePath}
					/>
				</div>
			{/if}
			{#if !path.isExpanded && path.hasChildren}
				<div class='revealTinyDots' style='
					left:{tinyDotsOffset + 0.65}px;
					top:{tinyDotsOffset - 0.28}px;
					height:{tinyDotsDiameter}px;
					width:{tinyDotsDiameter}px;
					position:absolute;'>
					<SVGD3 name='revealTinyDots'
						fill={strokeColor}
						stroke={strokeColor}
						width={tinyDotsDiameter}
						height={tinyDotsDiameter}
						scalablePath={svgPath.tinyDots_circular(tinyDotsDiameter, childrenCount)}
					/>
				</div>
			{/if}
		</button>
	</div>
{/key}