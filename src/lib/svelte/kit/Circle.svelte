<!-- @migration-task Error while migrating Svelte code: Identifier 'diameter' has already been declared
https://svelte.dev/e/js_parse_error -->
<script lang='ts'>
	import { k, u, Point, debug, T_Layer } from '../ts/common/Global_Imports'
	import { w_background_color } from '../ts/common/Stores';
	import { onMount } from 'svelte';
	interface Props {
		color_background?: any;
		zindex?: any;
		center?: any;
		name?: any;
		thickness?: number;
		radius?: number;
		color: any;
	}

	let {
		color_background = debug.lines ? 'transparent' : $w_background_color,
		zindex = T_Layer.dots,
		center = Point.zero,
		name = k.empty,
		thickness = 1,
		radius = 2,
		color
	}: Props = $props();
	let diameter = $state(0);

	let diameter = $derived(radius * 2);

</script>

<div
	class= 'circle' id={name} style='
		z-index: {zindex};
		position: absolute;
		border-radius: 50%;
		width: {diameter}px;
		height: {diameter}px;
		border: {thickness}px solid {color};
		top: {center.y - radius - thickness}px;
		left: {center.x - radius - thickness}px;'>
</div>
