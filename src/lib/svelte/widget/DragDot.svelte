<script>
	import { Wrapper, Direction, onDestroy, dbDispatch, SvelteType, AlteringParent } from "../../ts/common/GlobalImports";
	import { k, u, Size, Point, Thing, debug, ZIndex, onMount, signals, svgPath } from "../../ts/common/GlobalImports";
	import { s_dot_size, s_paths_grabbed, s_path_toolsCluster, s_tools_inWidgets } from '../../ts/managers/State';
	import SVGD3 from '../svg/SVGD3.svelte';
	export let center;
	export let path;
	let thing = path.thing();
	let tinyDotColor = thing.color;
	let strokeColor = thing.color;
	let fillColor = thing.color;
	let scalablePath = '';
	let isHovering = true;
	let isGrabbed = false;
	let altering = false;
	let clickCount = 0;
	let handler = null;
	let button = null;
	let extra = null;
	let clickTimer;
	let size = 0;
	let left = 0;
	let top = 0;
	
    onDestroy(() => { handler.disconnect(); })
	function handleMouseIn(event) { updateColorsForHover(true); }
	function handleMouseUp() { clearTimeout(clickTimer); }
	function handleMouseOut(event) { updateColorsForHover(false); }
	function handleContextMenu(event) { event.preventDefault(); } 		// Prevent the default context menu on right-

    onMount(() => {
		updatePathAndPosition();
		updateColorsForHover(false);
        handler = signals.handle_alteringParent((alteration) => {
			const applyFlag = $s_path_toolsCluster && path.things_canAlter_asParentOf_toolsGrab;
			extra = (thing.parents.length < 2) ? null : svgPath.circle(size, size / 5);
			altering = applyFlag ? (alteration != null) : false;
			updateColors();
        })
    })

	$: {
		const grabbed = $s_paths_grabbed?.filter(p => p.matchesPath(path)).length > 0;
		if (isGrabbed != grabbed) {
			isGrabbed = grabbed;
			updateColors();
		}
	}

	$: {
		if (thing != null) {
			updateColors();
		}
	}

	$: {
		if ($s_dot_size > 0) {
			updatePathAndPosition();
		}
	}

	function updateColors() {
		const asReveal = isHovering == altering;
		thing.updateColorAttributes(path);	// for revealColor
		tinyDotColor = thing.revealColor(asReveal, path);
		fillColor = debug.lines ? 'transparent' : thing.revealColor(!asReveal, path);
		strokeColor = thing.color;
	}

	function updateColorsForHover(flag) {
		if (isHovering != flag) {
			isHovering = flag;
			updateColors();
		}
	}

	function clearClicks() {
		clickCount = 0;
		clearTimeout(clickTimer);	// clear all previous timers
	}

	function handleLongClick(event) {
		clearClicks();
		clickTimer = setTimeout(() => {
			handleDoubleClick(event);
		}, k.longClickThreshold);
	}

	function handleDoubleClick(event) {
		clearClicks();
		path.becomeHere();
    }

	function handleSingleClick(event) {
		clickCount++;
		clickTimer = setTimeout(() => {
			if (clickCount === 1) {
				path.clicked_dragDot(event.shiftKey);
				clearClicks();
			}
		}, k.doubleClickThreshold);
	}

	function updatePathAndPosition() {
		size = $s_dot_size;
		left = center.x + 1 - (size / 2);
		top = path.toolsGrabbed ? $s_tools_inWidgets ? size + 1 : 2 - size : -size / 2 - 5;
		scalablePath = svgPath.oval(size, false);	// TODO: change it & position when altering state changes
		if (thing.parents.length > 1) {
			extra = svgPath.circle(size, size / 5);
		}
	}

</script>

<div class='dragDot'
	style='top: {top}px;
		left: {left}px;
		position: absolute;'>
	<button class='dot'
		bind:this={button}
		on:blur={u.ignore}
		on:focus={u.ignore}
		on:keyup={u.ignore}
		on:keydown={u.ignore}
		on:keypress={u.ignore}
		on:mouseup={handleMouseUp}
		on:click={handleSingleClick}
		on:mouseout={handleMouseOut}
		on:mouseover={handleMouseIn}
		on:mousedown={handleLongClick}
		on:dblclick={handleDoubleClick}
		on:contextmenu={handleContextMenu}
		style='
			border: none;
			cursor: pointer;
			width: {size}px;
			height: {size}px;
			background: none;
		'>
		<SVGD3
			size={size}
			fill={fillColor}
			stroke={strokeColor}
			zIndex={ZIndex.dots}
			scalablePath={scalablePath}
		/>
		{#if extra}
			<SVGD3
				size={size}
				fill={tinyDotColor}
				zIndex={ZIndex.dots}
				scalablePath={extra}
				stroke={tinyDotColor}
			/>
		{/if}
	</button>
</div>
