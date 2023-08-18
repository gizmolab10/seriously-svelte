<script lang='ts'>
  import { editingID, grabbedIDs } from '../managers/State';
  import { Thing, onMount } from '../common/GlobalImports';
	import Title from './Title.svelte';
	import Dot from './Dot.svelte';
	export let thing = Thing;
	let isGrabbed = false;
	let isEditing = false;
	let widget;
	let border;
	let hover;

  onMount(async () => {
		updateBorderStyle();
	});

	function updateBorderStyle() {
		thing.updateColorAttributes();
		border = thing.grabAttributes;
		hover = (isEditing || isGrabbed) ? thing.grabAttributes : thing.hoverAttributes;
	}

	$: {
		const editing = (thing.id == $editingID);
		if (isEditing != editing) {
			isEditing = editing;
			updateBorderStyle();
		}
		const grabbed = $grabbedIDs?.includes(thing.id);
		if (isGrabbed != grabbed) {
			isGrabbed = grabbed;
			updateBorderStyle();
		}
	}

</script>

<span
		bind:this={widget}
		style='border: {border}'
		on:mouseover={widget.style.border=hover}
		on:mouseout={widget.style.border=border}>
	<Dot thing={thing} size=15/>
	&nbsp; {thing.order}
	<Title thing={thing}/>
	{#if thing.hasChildren}
		<Dot thing={thing} size=15 isReveal={true}/>
	{/if}
</span>

<style>
	span {
		padding: 1px 8px 2px 1px;
		border-radius: 16px;
	}
</style>