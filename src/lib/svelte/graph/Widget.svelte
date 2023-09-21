<script lang='ts'>
	import { noop, Thing, Point, onMount, ZIndex, constants } from '../../ts/common/GlobalImports';
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

	onMount(async () => {
		isGrabbed = thing.isGrabbed || thing.isExemplar;
		updateBorderStyle();
	});

	function mouseOver(event) {
		updateBorderStyle();
		widget.style.border=hover;
		isHovering = true; 
	}

	function mouseOut(event) {
		isHovering = false; 
		updateBorderStyle();
		widget.style.border=border;
	}

	function updateBorderStyle() {
		const hasBorder = isGrabbed || isHovering;
		thing.updateColorAttributes();
		delta = hasBorder ? 0 : 1;
		border = hasBorder ? 'border: ' + thing.grabAttributes : '';
		background =  hasBorder ? 'background-color: ' + constants.backgroundColor : '';
		hover = (isEditing || isGrabbed) ? thing.grabAttributes : thing.hoverAttributes;
	}

	$: {
		const editing = (thing.id == $idEditing);
		const grabbed = $idsGrabbed?.includes(thing.id) || thing.isExemplar;
		if (isEditing != editing || isGrabbed != grabbed) {
			isEditing = editing;
			isGrabbed = grabbed;
			updateBorderStyle();
		}
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