<script lang='ts'>
	import { w_background_color } from '../../ts/managers/Stores';
	import { T_Layer } from '../../ts/common/Enumerations';
	import { k } from '../../ts/common/Global_Imports';
	export let handle_click: (event: Event) => {} | null = null;
	export let font_size = k.font_size.details;
	export let zindex = T_Layer.details + 2;
	export let label_underline = false;
	export let label_color = 'black';
	export let label = k.empty;
</script>

<div
	on:click={handle_click}
	style='
		top: -7px;
		z-index: {zindex};
		position: absolute;
		color: {label_color};
		font-size: {font_size}px;
		background-color: {$w_background_color};
		cursor: {!!handle_click ? 'pointer' : 'default'};
		text-decoration: {label_underline ? 'underline' : 'none'};'>
	{label}
</div> 