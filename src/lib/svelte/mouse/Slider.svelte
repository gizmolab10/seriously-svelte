<script lang='ts'>
	import type { Point } from '../../ts/common/Global_Imports';
	export let handle_value_change: (value: number) => void = () => {};
	export let title_font_size: number = 18;
	export let origin: Point = Point.zero;
	export let divisions: number = 100;
	export let title_left: number = 0;
	export let width: number = 200;
	export let value: number = 1;
	export let max: number = 20;
	const x = Math.log10(max) / divisions;
	let slider_value = value <= 1 ? 0 : (Math.log10(value) / x);
	$: value = Math.round(Math.pow(10, slider_value * x));

	function handle_input(event: Event) {
		if (!!value && value > 0) {
			handle_value_change(value);
		}
	}
	
</script>

<div style='position: relative; left: {origin.x}px; top: {origin.y}px; width: {width}px; display: flex; align-items: center;'>
	<input
		min='0'
		step='1'
		type='range'
		max={divisions}
		on:input={handle_input}
		bind:value={slider_value}
		style='flex: 1 1 auto; position: relative; min-width: 0;'
	/>
	<span style='font-size: {title_font_size}px; margin-left: -26px; display: inline-block; width: 3.5em; text-align: right;'>
		{value}
	</span>
</div>

<style>
	input[type="range"] {
		height: 14.5px; /* match thumb diameter */
		appearance: none;
		-webkit-appearance: none;
		background: transparent;
	}
	input[type="range"]::-webkit-slider-runnable-track {
		height: 14.5px;
		background: white;
		border-radius: 16px;
		border: 0.5px solid black;
	}
	input[type="range"]::-webkit-slider-thumb {
		-webkit-appearance: none;
		height: 14px;
		width: 14px;
		border-radius: 50%;
		background: #007aff;
		border: 2px solid #007aff;
		margin-top: 0px;
	}
	input[type="range"]::-moz-range-thumb {
		height: 14px;
		width: 14px;
		border-radius: 50%;
		background: #007aff;
		border: 2px solid #007aff;
	}
	input[type="range"]::-moz-range-track {
		height: 14px;
		background: white;
		border-radius: 16px;
		border: 0.5px solid black;
	}
	input[type="range"]::-ms-fill-lower,
	input[type="range"]::-ms-fill-upper {
		background: white;
		border-radius: 16px;
		border: 0.5px solid black;
	}
	input[type="range"]::-ms-thumb {
		height: 14px;
		width: 14px;
		border-radius: 50%;
		background: #007aff;
		border: 2px solid #007aff;
	}
	input[type="range"]:focus {
		outline: none;
	}
</style>
