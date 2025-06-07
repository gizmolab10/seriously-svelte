<script lang='ts'>
	import type { Point } from '../../ts/common/Global_Imports';
	export let origin: Point = { x: 0, y: 0 };
	export let title_font_size: number = 14;
	export let title_left: number = 0;
	export let length: number = 100;
	let sliderValue = 0; // Linear value (0-100)
	$: logValue = Math.round(Math.pow(10, sliderValue / 100 * 3)); // 10^0 to 10^3
</script>

<div style='position: relative; left: {origin.x}px; top: {origin.y}px; width: {length}px;'>
	<label>
		Slider Value: {sliderValue}
		<input
			min='0'
			step='1'
			max='100'
			type='range'
			style='width: 100%;'
			bind:value={sliderValue}
		/>
	</label>
	<div>Logarithmic Value: {logValue}</div>
</div>
