<script lang='ts'>
	import { noop, Thing, Point, onMount, ZIndex, constants } from '../../ts/common/GlobalImports';
	import { idEditing, idsGrabbed } from '../../ts/managers/State';
	import TitleEditor from './TitleEditor.svelte';
	import Dot from './Dot.svelte';
	export let origin = Point;
	export let thing = Thing;
	let isGrabbed = false;
	let isEditing = false;
	let background = '';
	let padding = '';
	let border = '';
	let delta = 0;
	let widget;
	let hover;

	onMount(async () => {
		updateBorderStyle();
	});

	function updateBorderStyle() {
		thing.updateColorAttributes();
		hover = (isEditing || isGrabbed) ? thing.grabAttributes : thing.hoverAttributes;
		background =  isGrabbed ? 'background-color: ' + constants.backgroundColor : '';
		border = isGrabbed ? 'border: ' + thing.grabAttributes : '';
		delta = isGrabbed ? 0 : 1;
	}

	$: {
		const editing = (thing.id == $idEditing);
		const grabbed = $idsGrabbed?.includes(thing.id);
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
		position: absolute;
		{background};
		{border};'
	on:blur={noop()}
	on:focus={noop()}
	on:mouseover={widget.style.border=hover}
	on:mouseout={widget.style.border=border}>
	<Dot thing={thing} size=15/>&nbsp;
	<TitleEditor thing={thing}/>
	{#if thing.hasChildren}
		<Dot thing={thing} size=15 isReveal={true}/>
	{/if}
</div>

<style>
	div {
		height: 24px;
		white-space: nowrap;
		padding: 1px 10px 2px 1px;
		border-radius: 16px;
	}
</style>