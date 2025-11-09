<script lang='ts'>
	import { k, colors } from '../../ts/common/Global_Imports';
	import { T_Layer } from '../../ts/common/Enumerations';
	export let handle_click: (event: Event) => {} | null = null;
	export let font_size = k.font_size.separator;
	export let zindex = T_Layer.details + 2;
	export let label_underline = false;
	export let label_color = 'black';
	export let label = k.empty;
	const { w_background_color } = colors;
</script>

<a
	on:click={handle_click}
	style='
		top: -6px;
		z-index: {zindex};
		position: absolute;
		color: {label_color};
		font-size: {font_size}px;
		background-color: {$w_background_color};
		cursor: {!!handle_click ? 'pointer' : 'default'};
		text-decoration: {label_underline ? 'underline' : 'none'};'>
	{label}
</a> 