<script lang='ts'>
	import { k, ux, Point, Thing, T_Layer, colors, signals } from '../../ts/common/Global_Imports';
	import ColorPicker from 'svelte-awesome-color-picker';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';
	export let origin = Point.zero;
	export let picker_offset = k.empty;
	export let color = colors.default_forThings;
	export let color_closure = (color: string) => {};
	const selectorSize = k.dot_size + 1;
	const pickerSize = 122;

	async function handleColorChange(event) {
		event.preventDefault();
		const new_color = event.detail.hex;
		if (color != new_color) {
			color_closure(new_color)
			color = new_color;
		}
	}

</script>

<div class='color'
	style='
		top: {origin.y}px;
		left: {origin.x}px;
		position: absolute;
		z-index: {T_Layer.frontmost};
		--picker_offset: {picker_offset};'>
	<ColorPicker
		label=''
		on:input={handleColorChange}
		hex={colors.color_toHex(color)}
		--picker-indicator-size='{selectorSize}px'
		--picker-z-index='{T_Layer.frontmost}'
		--slider-width='{selectorSize}px'
		--picker-height='{pickerSize}px'
		--picker-width='{pickerSize}px'
		--input-size='{selectorSize}px'
		--cp-border-color=black/>
</div>

<style>
	div :global(.wrapper) {
		left: var(--picker_offset);
		top: 24px;
	}

	div :global(.picker-indicator) {
		border-radius: 50%;
	}
</style>
