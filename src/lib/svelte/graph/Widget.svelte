<script lang='ts'>
  import { noop, Thing, Point, onMount } from '../../ts/common/GlobalImports';
  import { debug, idEditing, idsGrabbed } from '../../ts/managers/State';
	import TitleEditor from './TitleEditor.svelte';
	import Dot from './Dot.svelte';
	export let origin = Point;
	export let thing = Thing;
	let isGrabbed = false;
	let isEditing = false;
	let widget;
	let border;
	let hover;

  onMount(async () => {
		updateBorderStyle();
		console.log('WIDGET:', origin.verbose);
	});

	function updateBorderStyle() {
		thing.updateColorAttributes();
		border = thing.grabAttributes;
		hover = (isEditing || isGrabbed) ? thing.grabAttributes : thing.hoverAttributes;
	}

	$: {
		const editing = (thing.id == $idEditing);
		if (isEditing != editing) {
			isEditing = editing;
			updateBorderStyle();
		}
		const grabbed = $idsGrabbed?.includes(thing.id);
		if (isGrabbed != grabbed) {
			isGrabbed = grabbed;
			updateBorderStyle();
		}
	}

</script>

<div
	bind:this={widget}
	style='border: {border}; left: {origin.x + 35}px; top: {origin.y + 28}px; width: 200px'
	on:blur={noop()}
	on:focus={noop()}
	on:mouseover={widget.style.border=hover}
	on:mouseout={widget.style.border=border}>
	<Dot thing={thing} size=15/>
	<TitleEditor thing={thing}/>
	{#if thing.hasChildren}
		<Dot thing={thing} size=15 isReveal={true}/>
	{/if}
</div>

<style>
	div {
		position: absolute;
		padding: 1px 8px 2px 1px;
		border-radius: 16px;
	}
</style>