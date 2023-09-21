<script lang='ts'>
	import { noop, Thing, Point, ZIndex, onMount, onDestroy, constants } from '../../ts/common/GlobalImports';
	import { idEditing, idsGrabbed } from '../../ts/managers/State';
	import TitleEditor from './TitleEditor.svelte';
	import Dot from './Dot.svelte';
	export let origin = Point;
	export let thing = Thing;
	let isHovering = false;
	let isGrabbed = false;
	let isEditing = false;
	let background = '';
	let padding = '';
	let border = '';
	let delta = 0;
	let widget;
	let hover;

	onMount(() => {
		const id = thing.id;
		isGrabbed = $idsGrabbed?.includes(id) || thing.isExemplar;
		isEditing = (thing.id == $idEditing);
		updateBorderStyle();
	});

	onDestroy(() => {
		console.log('destroy widget:', thing.title);
	});

	function mouseOver(event) {
		isHovering = true;
		updateBorderStyle();
		widget.style.border=hover;
	}

	function mouseOut(event) {
		isHovering = false; 
		updateBorderStyle();
		widget.style.border=border;
	}

	function updateBorderStyle() {
		const hasBorder = isGrabbed || isHovering || isEditing;
		thing.updateColorAttributes();
		delta = hasBorder ? 0 : 1;
		border = hasBorder ? 'border: ' + thing.grabAttributes : '';
		background =  hasBorder ? 'background-color: ' + constants.backgroundColor : '';
		hover = (isEditing || isGrabbed) ? thing.grabAttributes : thing.hoverAttributes;
	}

	$: {
		const id = thing.id;
		const editing = (id == $idEditing);
		const grabbed = $idsGrabbed?.includes(id) || thing.isExemplar;
		const change = needsChange(editing, grabbed);
		if (change) {
			isEditing = editing;
			isGrabbed = grabbed;
			updateBorderStyle();
			// setTimeout(() => {
			// 	console.log(needsChange(editing, grabbed));
			// }, 1);
		}
	}

	function needsChange(editing, grabbed) {
		if (editing == null) {
			return false
		}
		if (editing == undefined) {
			return false
		}
		if (grabbed == null) {
			return false
		}
		if (grabbed == undefined) {
			return false
		}
		if (isEditing == null) {
			return true
		}
		if (isEditing == undefined) {
			return true
		}
		if (isGrabbed == null) {
			return true
		}
		if (isGrabbed == undefined) {
			return true
		}
		if (isEditing != editing) {
			return true
		}
		if (isGrabbed != grabbed) {
			return true
		}
		return false;
	}

</script>

<div
	bind:this={widget}
	style='z-index: {ZIndex.highlights};
		top: {origin.y + delta}px;
		left: {origin.x+ delta}px;
		padding: {thing.isExemplar ? 1 : 0}px 10px {thing.isExemplar ? 0 : 1}px 1px;
		{background};
		{border};'
	on:blur={noop()}
	on:focus={noop()}
	on:mouseover={mouseOver}
	on:mouseout={mouseOut}>
	<Dot thing={thing} size=15/>&nbsp;
	<TitleEditor thing={thing}/>
	{#if thing.hasChildren}
		<Dot thing={thing} size=15 isReveal={true}/>
	{/if}
</div>

<style>
	div {
		height: 24px;
		position: absolute;
		white-space: nowrap;
		border-radius: 16px;
	}
</style>