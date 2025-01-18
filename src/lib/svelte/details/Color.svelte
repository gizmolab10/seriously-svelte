<script lang='ts'>
	import { k, u, ux, Point, Thing, ZIndex, signals } from '../../ts/common/Global_Imports';
	import { s_thing_color } from '../../ts/state/S_Stores';
	import ColorPicker from 'svelte-awesome-color-picker';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';
	export let origin = Point.zero;
	export let thing: Thing;
	const pickerSize = 122;
	const selectorSize = k.dot_size + 1;
	let colorAsHEX = k.empty;

    onMount(() => {
		if (!!thing) {
			colorAsHEX = u.colorToHex(thing.color);
		}
	});

	async function handleColorChange(event) {
		event.preventDefault();
		const color = event.detail.hex;
		if (thing.color != color) {
			thing.color = color;
			thing.signal_color_change();
			await thing.persist();
		}
	}
	
</script>

<style>
	div :global(.wrapper) {
		left: -77px;
		top: 24px;
	}

	div :global(.picker-indicator) {
		border-radius: 50%;
	}
</style>


{#if !!thing}
	{#key thing.id}
		<div class='color'
			style='
				top: {origin.y}px;
				left: {origin.x}px;
				position: absolute;
				z-index: {ZIndex.frontmost};'>
			<ColorPicker
				label=''
				hex={colorAsHEX}
				on:input={handleColorChange}
				--input-size='{selectorSize}px'
				--picker-width='{pickerSize}px'
				--picker-height='{pickerSize}px'
				--slider-width='{selectorSize}px'
				--picker-z-index='{ZIndex.frontmost}'
				--picker-indicator-size='{selectorSize}px'/>
		</div>
	{/key}
{/if}
