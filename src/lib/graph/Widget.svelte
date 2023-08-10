<script lang='ts'>
  import { Thing, editingID, grabbedIDs, onMount } from '../common/GlobalImports';
	import Title from './Title.svelte';
	import Dot from './Dot.svelte';
	export let thing = Thing;
	let isGrabbed = false;
	let isEditing = false;
	let border;

  onMount(async () => {
		updateBorderStyle();
	});

	function updateBorderStyle() {
		thing.updateColorAttributes();
		border = thing.grabAttributes;
		const element = document.getElementById(thing.id);
		var style = element?.style;
		style?.setProperty( '--border', border);
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

<span id={thing.id}>
	<Dot thing={thing} size=15/>
	<Title thing={thing}/>
	{#if thing.hasChildren}
		<Dot thing={thing} size=15 isReveal={true}/>
	{/if}
</span>

<style>
	span {
		padding: 1px 8px 2px 1px;
		border: var(--border);
		border-radius: 16px;
	}
</style>