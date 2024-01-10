<script>
	import { k, Size, Point, debug, Thing, ZIndex, onMount, svgPath, onDestroy, AlteringParent } from "../../ts/common/GlobalImports";
	import { Direction, dbDispatch, graphEditor, Relationship, handle_alteringParent } from "../../ts/common/GlobalImports";
	import { dot_size, ids_grabbed, id_showTools } from '../../ts/managers/State';
	import SVGD3 from '../svg/SVGD3.svelte';
	export let relationship;
	let tinyDotColor = relationship.toThing?.color;
	let strokeColor = relationship.toThing?.color;
	let fillColor = relationship.toThing?.color;
	let canAlterParent = false;
	let isHovering = true;
	let isGrabbed = false;
	let extraPath = null;
	let handler = null;
	let clickCount = 0;
	let button = null;
	let clickTimer;
	let path = '';
	let size = 0;
	let left = 0;
	let top = 0;
	
	function ignore(event) {}
    onDestroy(() => { handler.disconnect(); })
	function handleMouseIn(event) { updateColorsForHover(true); }
	function handleMouseUp() { clearTimeout(clickTimer); }
	function handleMouseOut(event) { updateColorsForHover(false); }
	function handleContextMenu(event) { event.preventDefault(); } 		// Prevent the default context menu on right-

    onMount(() => {
		updateColorsForHover(false);
        handler = handle_alteringParent((alteration) => {
			const applyAlteration = $id_showTools && relationship.canAlterParentOf_showTools != null;
			canAlterParent = applyAlteration ? (alteration != null) : false;
			extraPath = (relationship.parentRelationships?.length < 2) ? null : svgPath.circle(size, size / 5);
			updateColors();
		})
    })

	$: {
		const grabbed = $ids_grabbed?.includes(relationship.id);
		if (isGrabbed != grabbed) {
			isGrabbed = grabbed;
			updateColors();
		}
	}

	$: {
		if (relationship.toThing != null) {
			updateColors();
		}
	}

	function updateColors() {
		const thing = relationship.toThing;
		if (thing) {
			thing.updateColorAttributes(relationship);	// needed for revealColor, below
			fillColor = debug.lines ? 'transparent' : relationship.revealColor(isHovering != canAlterParent);
			tinyDotColor = relationship.revealColor(isHovering == canAlterParent);
			strokeColor = thing.color;
		}
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
		relationship.becomeHere();
    }

	function handleSingleClick(event) {
		clickCount++;
		clickTimer = setTimeout(() => {
			if (clickCount === 1) {
				relationship?.clicked_dragDot(event.shiftKey);
				clearClicks();
			}
		}, k.doubleClickThreshold);
	}

	$: {
		if ($dot_size > 0) {
			size = $dot_size;
			top = $id_showTools == relationship.id ? 23 : -size / 2 + 2;
			left = 1.5 - (size / 2); // offset from center?
			path = svgPath.oval(size, false);
			if (relationship.parentRelationships?.length > 1) {
				extraPath = svgPath.circle(size, size / 5);
			}
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
	on:mouseover={handleMouseIn}
	on:mousedown={handleLongClick}
	on:dblclick={handleDoubleClick}
	on:contextmenu={handleContextMenu}
	style='
		top: {top}px;
		left: {left}px;
		width: {size}px;
		height: {size}px;
	'>
	<SVGD3
		path={path}
		fill={fillColor}
		stroke={strokeColor}
		zIndex={ZIndex.dots}
		size={Size.square(size)}
	/>
	{#if extraPath}
		<SVGD3
			path={extraPath}
			fill={tinyDotColor}
			zIndex={ZIndex.dots}
			stroke={tinyDotColor}
			size={Size.square(size)}
		/>
	{/if}
</button>
