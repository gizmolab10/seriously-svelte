<script lang='ts'>
	import type { Point } from '../../ts/common/Global_Imports';
	export let handle_value_change: (value: number) => void = () => {};
	export let thumb_color: string = '#007aff';
	export let isLogarithmic: boolean = false;
	export let title_font_size: number = 18;
	export let origin: Point = Point.zero;
	export let isVisible: boolean = true;
	export let divisions: number = 100;
	export let title_left: number = 0;
	export let height: number = 22;
	export let width: number = 200;
	export let value: number = 1;
	export let max: number = 20;
	const border = '1px solid darkgray';
	const x = isLogarithmic ? Math.log10(max) / divisions : max / divisions;
	let slider_value = value <= 1 ? 0 : (isLogarithmic ? Math.log10(value) / x : value / x);
	let prior_value = value;

	$: slider_value, compute_andPush();

	function compute_andPush() {
		const newValue = isLogarithmic ? Math.round(Math.pow(10, slider_value * x)) : Math.round(slider_value * x);
		if (newValue !== prior_value) {
			value = newValue;
			prior_value = value;
			handle_value_change(value);
		}
	}
	
</script>

<div style='position: relative; height: {height}px; top: {origin.y}px; left: {origin.x}px;'>
<div style='
	width: {width}px;
	position: relative;
	--border: {border};
	align-items: center;
	--thumb-color: {thumb_color};
	display: {isVisible ? "flex" : "none"};'>
	<input
		min='0'
		step='1'
		type='range'
		max={divisions}
		bind:value={slider_value}
		style='flex: 1 1 auto; position: relative; min-width: 0;'
	/>
	<span style='font-size: {title_font_size}px; margin-left: -26px; display: inline-block; width: 3.5em; text-align: right;'>
		{value}
	</span>
</div>
</div>

<style>
	input[type="range"] {
		height: 14px;
		appearance: none;
		background: transparent;
		-webkit-appearance: none;
	}
	input[type="range"]::-webkit-slider-runnable-track {
		height: 14px;
		background: white;
		border-radius: 16px;
		border: var(--border);
	}
	input[type="range"]::-webkit-slider-thumb {
		width: 14px;
		height: 14px;
		margin-top: -0.75px;
		border-radius: 50%;
		border: var(--border);
		-webkit-appearance: none;
		background: var(--thumb-color);
	}
	input[type="range"]::-moz-range-thumb {
		height: 14px;
		width: 14px;
		border-radius: 50%;
		border: var(--border);
		background: var(--thumb-color);
	}
	input[type="range"]::-moz-range-track {
		height: 14px;
		background: white;
		border-radius: 50%;
		border: var(--border);
	}
	input[type="range"]::-ms-fill-lower,
	input[type="range"]::-ms-fill-upper {
		background: white;
		border-radius: 50%;
		border: var(--border);
	}
	input[type="range"]::-ms-thumb {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		border: var(--border);
		background: var(--thumb-color);
	}
	input[type="range"]:focus {
		outline: none;
	}
</style>
