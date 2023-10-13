<script lang='ts'>
	import { noop, Thing, Point, ZIndex, onMount, onDestroy, constants } from '../../ts/common/GlobalImports';
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

	onMount(() => {
		const id = thing.id;
		isGrabbed = $idsGrabbed?.includes(id) || thing.isExemplar;
		isEditing = (thing.id == $idEditing);
		updateBorderStyle();
	});

	function updateBorderStyle() {
		const showBorder = isEditing || isGrabbed;
		thing.updateColorAttributes();
		delta = showBorder ? 0 : 1;
		border = showBorder ? 'border: ' + thing.grabAttributes : '';
		background = showBorder ? 'background-color: ' + constants.backgroundColor : '';
	}

	$: {
		const id = thing.id;
		const editing = (id == $idEditing);
		const grabbed = $idsGrabbed?.includes(id) || thing.isExemplar;
		const change = (isEditing != editing || isGrabbed != grabbed);
		if (change) {
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
		left: {origin.x + delta}px;
		padding: {thing.isExemplar ? 1 : 0}px 12px {thing.isExemplar ? 0 : 1}px 1px;
		{background};
		{border};'>
	<Dot thing={thing}/>
	<TitleEditor thing={thing}/>
	{#if thing.hasChildren || thing.isBulkAlias}
		<Dot thing={thing} isReveal={true}/>
	{/if}
</div>

<style>
	div {
		height: 25px;
		position: absolute;
		white-space: nowrap;
		border-radius: 16px;
	}
</style>