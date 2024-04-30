<script>
	import { k, u, get, Size, Thing, Point, debug, ZIndex, onMount, signals, svgPaths } from "../../ts/common/GlobalImports";
	import { Wrapper, IDWrapper, Direction, onDestroy, dbDispatch, Predicate } from "../../ts/common/GlobalImports";
	import { s_paths_expanded, s_altering, s_paths_grabbed, s_path_editingTools } from '../../ts/state/State';
	import { h } from '../../ts/db/DBDispatch';
	import SVGD3 from '../kit/SVGD3.svelte';
	export let center;
    export let path;
	let size = k.dot_size;
	let tinyDotsDiameter = size * 1.8;
	let tinyDotsOffset = size * -0.4 + 0.01;
	let childrenCount = path.childRelationships.length;
	let insideFillColor = k.color_background;
	let insidePath = svgPaths.circle(16, 6);
	let fillColor = k.color_background;
	let strokeColor = path.thing.color;
	let revealWrapper = Wrapper;
	let hasInsidePath = false;
	let isHovering = false;
	let svgPath = k.empty;
	let insideOffset = 0;
	let dotReveal = null;
	let rebuilds = 0;
	
	onMount( () => { setIsHovering_updateColors(false); updateScalablePaths(); });
	function handle_context_menu(event) { event.preventDefault(); } 		// Prevent the default context menu on right
	function handle_mouse_out(event) { setIsHovering_updateColors(false); }
	function handle_mouse_over(event) { setIsHovering_updateColors(true); }

	$: {
		if (dotReveal && !($s_path_editingTools?.matchesPath(path) ?? false)) {
			revealWrapper = new Wrapper(dotReveal, path, IDWrapper.reveal);
		}
	}

	$: {
		const _ = $s_paths_expanded;
		updateScalablePaths();
	}

	$: {
		if (strokeColor != path.thing.color) {
			strokeColor = path.thing.color
			updateColors();
		}
	}

	$: {
		if (!!$s_paths_grabbed || !!path.thing) {
			updateColors();
			updateScalablePaths();
		}
	}

	function setIsHovering_updateColors(hovering) {
		if (isHovering != hovering) {
			isHovering = hovering;
			updateColors();
			rebuilds += 1;
		}
	}

	function updateColors() {
		path.thing.updateColorAttributes(path);
		const collapsedOrGrabbed = !path.isExpanded || path.isGrabbed;
		fillColor = path.dotColor(collapsedOrGrabbed != isHovering, path);
		insideFillColor = path.dotColor(collapsedOrGrabbed == isHovering, path);
	}

	function updateScalablePaths() {
		const thing = path.thing;
		hasInsidePath = thing.hasRelated || path.toolsGrabbed || thing.isBulkAlias;
		insideOffset = hasInsidePath ? 0 : -1;
		if (!path.showsReveal || path.toolsGrabbed) {
			svgPath = svgPaths.circle(size, size - 1);
		} else {
			const goLeft = path.showsChildRelationships;
			const direction = goLeft ? Direction.left : Direction.right;
			svgPath = svgPaths.fat_polygon(size, direction);
		}
		if (path.toolsGrabbed) {
			insidePath = svgPaths.x_cross(size, 1.5);
		} else if (hasInsidePath) {
			insidePath = svgPaths.circle(size, 3);
		}
		console.log(insidePath);
	}

	function handle_singleClick(event) {
		setIsHovering_updateColors(false);
		if (path.toolsGrabbed) {
			$s_altering = null;
			$s_path_editingTools = null;
			signals.signal_relayoutWidgets_fromFocus();
		} else if (path.hasChildRelationships || path.thing.isBulkAlias) {
			h.path_rebuild_remoteMoveRight(path, !path.isExpanded, true, false);
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

{#key rebuilds}
	<div class='dot-reveal' style='
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
			bind:this={dotReveal}
			on:keydown={u.ignore}
			on:keypress={u.ignore}
			on:click={handle_singleClick}
			on:mouseout={handle_mouse_out}
			on:mouseover={handle_mouse_over}
			on:contextmenu={handle_context_menu}
			style='
				width: {size}px;
				height: {size}px;
			'>
			{#key svgPath}
				<SVGD3 name='svg-reveal'
					fill={debug.lines ? 'transparent' : fillColor}
					stroke={strokeColor}
					svgPath={svgPath}
					height={size}
					width={size}
				/>
			{/key}
			{#if hasInsidePath}
				<div class='reveal-inside' style='
					left:{insideOffset}px;
					top:{insideOffset}px;
					position:absolute;
					height:{size}px;
					width:{size}px;'>
					<SVGD3 name='svg-inside'
						stroke={insideFillColor}
						fill={insideFillColor}
						svgPath={insidePath}
						height={size}
						width={size}
					/>
				</div>
			{/if}
			{#if !path.isExpanded && path.hasChildRelationships}
				<div class='outside-tiny-dots' style='
					left:{tinyDotsOffset + 0.65}px;
					top:{tinyDotsOffset - 0.28}px;
					height:{tinyDotsDiameter}px;
					width:{tinyDotsDiameter}px;
					position:absolute;'>
					<SVGD3 name='svg-tiny-dots'
						svgPath={svgPaths.tinyDots_circular(tinyDotsDiameter, childrenCount)}
						height={tinyDotsDiameter}
						width={tinyDotsDiameter}
						stroke={strokeColor}
						fill={strokeColor}
					/>
				</div>
			{/if}
		</button>
	</div>
{/key}