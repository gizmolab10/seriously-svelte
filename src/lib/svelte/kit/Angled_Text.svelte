<script lang="ts">
	import { k, u, Point, debug, T_Layer } from '../ts/common/Global_Imports';
	import { w_thing_fontFamily } from '../ts/common/Stores';
	import { onMount } from 'svelte';
	interface Props {
		background_color?: any;
		font_family?: any;
		zindex?: any;
		center?: any;
		font_size?: string;
		text?: any;
		color?: string;
		angle?: number;
	}

	let {
		background_color = colors.background,
		font_family = $w_thing_fontFamily,
		zindex = T_Layer.paging,
		center = Point.zero,
		font_size = '0.7em',
		text = k.space,
		color = 'red',
		angle = 0
	}: Props = $props();

	// Calculate degrees from radians for CSS rotation
	let angleDeg = $derived(angle * 180 / Math.PI);
</script>

<div class='angled-text'
	style='
		z-index: {zindex};
		top: {center.y}px;
		left: {center.x}px;
		position: absolute;
		transform: translate(-50%, -50%) rotate({angleDeg}deg);'>
	<span class='text'
		style='
			background-color: {background_color};
			font-family: {font_family};
			font-size: {font_size};
			color: {color};'>
		{text}
	</span>
</div>
