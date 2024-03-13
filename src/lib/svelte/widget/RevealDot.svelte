<script>
	import { s_paths_expanded, s_altering_parent, s_paths_grabbed, s_path_toolsCluster } from '../../ts/managers/State';
	import { g, k, u, get, Size, Thing, Point, debug, ZIndex, svgPath, signals } from "../../ts/common/GlobalImports";
	import { onMount, Wrapper, Direction, onDestroy, dbDispatch, IDWrapper } from "../../ts/common/GlobalImports";
	import SVGD3 from '../svg/SVGD3.svelte';
	export let center;
	export let thing;
	export let path;
	let tinyDotsOffset = k.dot_size * -0.4 + 0.01;
	let insideFillColor = k.color_background;
	let childrenCount = path.children.length;
	let tinyDotsDiameter = k.dot_size * 1.8;
	let insidePath = svgPath.circle(16, 6);
	let fillColor = k.color_background;
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
		const size = k.dot_size;
		if ((!path.hasChildren && !thing.isBulkAlias) || path.toolsGrabbed) {
			scalablePath = svgPath.circle(size, size - 1);
		} else {
			const goLeft = path.isExpanded && path.hasChildren;
			const direction = goLeft ? Direction.left : Direction.right;
			scalablePath = svgPath.fatPolygon(size, direction);
		}
		if (path.toolsGrabbed) {
			insidePath = svgPath.xCross(size, 1.5);
		} else if (thing.isBulkAlias) {
			insidePath = svgPath.circle(size, size / 3);
		}
	}

	function handleClick(event) {
		setIsHovering_updateColors(false);
		if (path.toolsGrabbed) {
			$s_path_toolsCluster = null;
			$s_altering_parent = null;
			signals.signal_rebuild_fromHere();
		} else if (path.hasChildren) {
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
		width: {k.dot_size}px;
		z-index: {ZIndex.dots};
		height: {k.dot_size}px;'>
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
				width: {k.dot_size}px;
				height: {k.dot_size}px;
			'>
			{#key scalablePath}
				<SVGD3 name='revealDot'
					width={k.dot_size}
					height={k.dot_size}
					stroke={strokeColor}
					scalablePath={scalablePath}
					fill={debug.lines ? 'transparent' : fillColor}
				/>
			{/key}
			{#if path.toolsGrabbed || thing.isBulkAlias}
				<div class='revealInside' style='
					top:{path.toolsGrabbed ? 0 : -1}px;
					left:{path.toolsGrabbed ? 0 : -1}px;
					width:14px;
					height:14px;
					position:absolute;'>
					<SVGD3 name='revealInside'
						width={k.dot_size}
						height={k.dot_size}
						stroke={strokeColor}
						fill={insideFillColor}
						scalablePath={insidePath}
					/>
				</div>
			{/if}
			{#if !path.isExpanded && path.hasChildren}
				<div class='revealTinyDots' style='
					left:{tinyDotsOffset + 0.65}px;
					top:{tinyDotsOffset}px;
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