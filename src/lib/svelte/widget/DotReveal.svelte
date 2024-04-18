<script>
	import { s_paths_expanded, s_alteration_state, s_paths_grabbed, s_path_editingTools } from '../../ts/state/State';
	import { g, k, u, get, Size, Thing, Point, debug, ZIndex, svgPaths, signals } from "../../ts/common/GlobalImports";
	import { onMount, Wrapper, Direction, onDestroy, dbDispatch, IDWrapper } from "../../ts/common/GlobalImports";
	import SVGD3 from '../kit/SVGD3.svelte'
    export let path;
	export let center;
	let size = k.dot_size;
	let childrenCount = path.childRelationships.length;
	let insideFillColor = k.color_background;
	let tinyDotsOffset = size * -0.4 + 0.01;
	let insidePath = svgPaths.circle(16, 6);
	let fillColor = k.color_background;
	let tinyDotsDiameter = size * 1.8;
	let strokeColor = path.thing.color;
	let revealWrapper = Wrapper;
	let hasInsidePath = false;
	let isHovering = false;
	let svgPath = k.empty;
	let insideOffset = 0;
	let dotReveal = null;
	let toggle = false;
	
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
			// console.log('toggle');
			toggle = !toggle;
		}
	}

	function updateColors() {
		path.thing.updateColorAttributes(path);
		const collapsedOrGrabbed = !path.isExpanded || path.isGrabbed;
		fillColor = path.dotColor(collapsedOrGrabbed != isHovering, path);
		insideFillColor = path.dotColor(collapsedOrGrabbed == isHovering, path);
	}

	function updateScalablePaths() {
		hasInsidePath = path.toolsGrabbed || path.thing.isBulkAlias;
		insideOffset = hasInsidePath ? 0 : -1;
		if (!path.showsReveal || path.toolsGrabbed) {
			svgPath = svgPaths.circle(size, size - 1);
		} else {
			const goLeft = path.showsChildRelationships;
			const direction = goLeft ? Direction.left : Direction.right;
			svgPath = svgPaths.fat_polygon(size, direction);
		}
		if (path.thing.isBulkAlias) {
			insidePath = svgPaths.circle(size, 3);
		} else if (path.toolsGrabbed) {
			insidePath = svgPaths.x_cross(size, 1.5);
		}
	}

	function handle_singleClick(event) {
		setIsHovering_updateColors(false);
		if (path.toolsGrabbed) {
			$s_path_editingTools = null;
			$s_alteration_state = null;
			signals.signal_relayoutWidgets_fromFocus();
		} else if (path.hasChildRelationships || path.thing.isBulkAlias) {
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
			on:mouseout={handle_mouse_out}
			on:click={handle_singleClick}
			on:mouseover={handle_mouse_over}
			on:contextmenu={handle_context_menu}
			style='
				width: {size}px;
				height: {size}px;
			'>
			{#key svgPath}
				<SVGD3 name='svg-reveal'
					width={size}
					height={size}
					stroke={strokeColor}
					svgPath={svgPath}
					fill={debug.lines ? 'transparent' : fillColor}
				/>
			{/key}
			{#if hasInsidePath}
				<div class='reveal-inside' style='
					left:{insideOffset}px;
					height:{size}px;
					top:{insideOffset}px;
					width:{size}px;
					position:absolute;'>
					<SVGD3 name='svg-inside'
						width={size}
						height={size}
						fill={insideFillColor}
						stroke={insideFillColor}
						svgPath={insidePath}
					/>
				</div>
			{/if}
			{#if !path.isExpanded && path.hasChildRelationships}
				<div class='reveal-tiny-dots' style='
					left:{tinyDotsOffset + 0.65}px;
					top:{tinyDotsOffset - 0.28}px;
					height:{tinyDotsDiameter}px;
					width:{tinyDotsDiameter}px;
					position:absolute;'>
					<SVGD3 name='savg-tiny-dots'
						fill={strokeColor}
						stroke={strokeColor}
						width={tinyDotsDiameter}
						height={tinyDotsDiameter}
						svgPath={svgPaths.tinyDots_circular(tinyDotsDiameter, childrenCount)}
					/>
				</div>
			{/if}
		</button>
	</div>
{/key}