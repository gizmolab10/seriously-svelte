<script lang='ts'>
	import type { Point } from '../../ts/common/Global_Imports';
	export let handle_value_change: (value: number) => void = () => {};
	export let origin: Point = { x: 0, y: 0 };
	export let title_font_size: number = 18;
	export let inital_log_value: number = 0;
	export let title_left: number = 0;
	export let length: number = 100;
	let sliderValue = inital_log_value > 0 ? (Math.log10(inital_log_value) / 2) * 100 : 0; // Linear value (0-100) based on initial_log_value
	$: logValue = Math.round(Math.pow(10, sliderValue / 100 * 2)); // 10^0 to 10^2

	function onSliderInput(event: Event) {
		handle_value_change(logValue);
	}
	
</script>

<div style='position: relative; left: {origin.x}px; top: {origin.y}px; width: {length}px; display: flex; align-items: center;'>
	<input
		min='0'
		step='1'
		max='100'
		type='range'
		bind:value={sliderValue}
		on:input={onSliderInput}
		style='flex: 1 1 auto; position: relative; min-width: 0;'
	/>
	<span style='font-size: {title_font_size}px; margin-left: -20px; display: inline-block; width: 3.5em; text-align: right;'>
		{logValue}
	</span>
</div>

<style>
	input[type="range"] {
		height: 14px; /* match thumb diameter */
		appearance: none;
		-webkit-appearance: none;
		background: transparent;
	}
	input[type="range"]::-webkit-slider-runnable-track {
		height: 14px;
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
		border: 2px solid #aaa;
		margin-top: 0px;
	}
	input[type="range"]::-moz-range-thumb {
		height: 14px;
		width: 14px;
		border-radius: 50%;
		background: #007aff;
		border: 2px solid #aaa;
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
		border: 2px solid #aaa;
	}
	input[type="range"]:focus {
		outline: none;
	}
</style>
