<script lang='ts'>
	import { k, u, ux, Point, Thing, T_Layer, signals } from '../../ts/common/Global_Imports';
	import { w_color_trigger } from '../../ts/common/Stores';
	import ColorPicker from 'svelte-awesome-color-picker';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';
	export let origin = Point.zero;
	export let picker_offset = '-77px';
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
		left: var(--picker_offset);
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
				z-index: {T_Layer.frontmost};
				--picker_offset: {picker_offset};'>
			<ColorPicker
				label=''
				hex={colorAsHEX}
				on:input={handleColorChange}
				--input-size='{selectorSize}px'
				--picker-width='{pickerSize}px'
				--picker-height='{pickerSize}px'
				--slider-width='{selectorSize}px'
				--picker-z-index='{T_Layer.frontmost}'
				--picker-indicator-size='{selectorSize}px'/>
		</div>
	{/key}
{/if}
