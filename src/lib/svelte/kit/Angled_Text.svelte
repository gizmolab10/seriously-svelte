<script>
	import { k, u, Point, debug, T_Layer } from '../../ts/common/Global_Imports';
	import { s_thing_fontFamily } from '../../ts/state/S_Stores';
	import { onMount } from 'svelte';
	export let font_family = $s_thing_fontFamily;
	export let center = Point.zero;
	export let font_size = '0.7em';
	export let text = k.space;
	export let color = 'red';
	export let angle = 0;

	// Calculate degrees from radians for CSS rotation
	$: angleDeg = angle * 180 / Math.PI;
</script>

<div class='angled-text'
	style='
		top: {center.y}px;
		left: {center.x}px;
		position: absolute;
		z-index: {T_Layer.backmost};
		transform: translate(-50%, -50%) rotate({angleDeg}deg);'>
	<span class='text'
		style='
			font-family: {font_family};
			font-size: {font_size};
			color: {color};'>
		{text}
	</span>
</div>
