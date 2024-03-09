<script>
	import { s_paths_expanded, s_altering_parent, s_paths_grabbed, s_path_toolsCluster } from '../../ts/managers/State';
	import { g, k, u, get, Size, Thing, Point, debug, ZIndex, svgPath, signals } from "../../ts/common/GlobalImports";
	import { onMount, Wrapper, Direction, onDestroy, dbDispatch, IDWrapper } from "../../ts/common/GlobalImports";
	import SVGD3 from '../svg/SVGD3.svelte';
	export let center;
	export let thing;
	export let path;
	let bulkAliasFillColor = k.color_background;
	let bulkAliasPath = svgPath.circle(16, 6);
	let childrenCount = path.children.length;
	let tinyDotsDiameter = k.dot_size * 1.8;
	let tinyDotsOffset = k.dot_size * -0.4;
	let fillColor = k.color_background;
	let strokeColor = thing.color;
	let revealWrapper = Wrapper;
	let isHovering = false;
	let scalablePath = '';
	let revealDot = null;
	
	onMount( () => { setIsHovering_updateColors(false); updateScalablePaths(); });
	function mouseOut(event) { setIsHovering_updateColors(false); }
	function mouseOver(event) { setIsHovering_updateColors(true); }
	function contextMenu(event) { event.preventDefault(); }

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
		isHovering = hovering;
		updateColors();
	}

	function updateColors() {
		thing.updateColorAttributes(path);
		const collapsedGrabbed = !path.isExpanded || path.isGrabbed;
		fillColor = path.dotColor(collapsedGrabbed != isHovering);
		bulkAliasFillColor = path.dotColor(collapsedGrabbed == isHovering);
	}

	function updateScalablePaths() {
		if ((!path.hasChildren && !thing.isBulkAlias) || $s_path_toolsCluster?.matchesPath(path)) {
			scalablePath = svgPath.circle(k.dot_size, k.dot_size - 1);
		} else {
			const direction = path.showsChildren ? Direction.left : Direction.right;
			scalablePath = svgPath.fatPolygon(k.dot_size, direction);
			if (thing.isBulkAlias) {
				bulkAliasPath = svgPath.circle(k.dot_size, k.dot_size / 3);
			}
		}
	}

	function handleClick(event) {
		setIsHovering_updateColors(false);
		if (path.toolsGrabbed) {
			$s_path_toolsCluster = null;
			$s_altering_parent = null;
		} else if (path.isHere) {
			return;
		} else if (path.hasChildren) {
			g.hierarchy.path_rebuild_remoteMoveRight(path, !path.isExpanded, true, false);
			return;
		}
		signals.signal_rebuild_fromHere();
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
	on:blur={u.ignore}
	on:focus={u.ignore}
	on:keyup={u.ignore}
	bind:this={revealDot}
	on:keydown={u.ignore}
	on:keypress={u.ignore}
	on:mouseout={mouseOut}
	on:click={handleClick}
	on:mouseover={mouseOver}
	on:contextmenu={contextMenu}
	style='
		top: {center.y}px;
		left: {center.x}px;
		width: {k.dot_size}px;
		height: {k.dot_size}px;
		z-index: {ZIndex.dots};
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
	{#if thing.isBulkAlias}
		<div class='revealInside' style='
			left:-1px;
			width:14px;
			height:14px;
			position:absolute;'>
			<SVGD3 name='revealInside'
				width={k.dot_size}
				height={k.dot_size}
				stroke={strokeColor}
				fill={bulkAliasFillColor}
				scalablePath={bulkAliasPath}
			/>
		</div>
	{/if}
	{#if !path.isExpanded && path.hasChildren}
		<div class='revealTinyDots' style='
			top:{tinyDotsOffset + 0.05}px;
			height:{tinyDotsDiameter}px;
			width:{tinyDotsDiameter}px;
			left:{tinyDotsOffset}px;
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