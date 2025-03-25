<script lang='ts'>
	import { k, ux, Point, Thing, T_Layer, colors, signals } from '../../ts/common/Global_Imports';
	// import type { Handle_Result } from '../../ts/common/Types';
	import { w_color_trigger } from '../../ts/signals/Stores';
	import ColorPicker from 'svelte-awesome-color-picker';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';
	export let color_closure = (color: string | null): string | null => {};
	export let picker_offset = k.empty;
	export let origin = Point.zero;
	const pickerSize = 122;
	const selectorSize = k.dot_size + 1;
	let color = color_closure(null);
	let colorAsHEX = colors.colorToRGB(color);

	async function handleColorChange(event) {
		event.preventDefault();
		const hex_color = event.detail.hex;
		if (color != hex_color) {
			color = hex_color;
			colorAsHEX = colors.colorToRGB(color);
			color_closure(color)
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
		--cp-border-color=black;
		on:input={handleColorChange}
		--input-size='{selectorSize}px'
		--picker-width='{pickerSize}px'
		--picker-height='{pickerSize}px'
		--slider-width='{selectorSize}px'
		--picker-z-index='{T_Layer.frontmost}'
		--picker-indicator-size='{selectorSize}px'/>
</div>
