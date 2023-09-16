<script lang='ts'>
  import { debug, widgetGap, idEditing, idsGrabbed } from '../../ts/managers/State';
  import { noop, Thing, Point, onMount } from '../../ts/common/GlobalImports';
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
		// console.log('WIDGET:', origin.verbose);
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
	// {#if !$debug}
	// 	&nbsp; {thing.order + 1}
	// {/if}
	// {#if thing.isGrabbed}
	// 	&nbsp; {thing.order + 1}
	// {/if}

</script>

<div
	bind:this={widget}
	style='position: absolute; top: {origin.y}px; left: {origin.x}px; height: 23px; border: {border};'
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
		white-space: nowrap;
		padding: 1px 8px 2px 1px;
		border-radius: 16px;
	}
</style>