<script lang='ts'>
	import { k, u, T_Layer } from '../../ts/common/Global_Imports';
	import { w_background_color } from '../../ts/common/Stores';
	export let title_font_size = `${k.small_font_size}px`;
	export let title: string | null = null;
	export let width = k.width_details;
	export let left = 0;
	export let top = 71;
	const title_width = u.getWidth_ofString_withSize(title ?? k.empty, title_font_size);
	const title_left = (width + (left * 2.1) - title_width - 12) / 2;

</script>

<div class='horizontal-line'
	style='
		height:1px;
		top:{top}px;
		left:{left}px;
		width:{width}px;
		position:absolute;
		z-index:{T_Layer.details};
		background-color:lightgray;'>
</div>
{#if !!title}
	<div
		style='
			padding: 0px 5px;
			position:absolute;
			top:{top - 5.3}px;
			left:{title_left}px;
			z-index:{T_Layer.frontmost};
			font-size:{title_font_size};
			background-color:{$w_background_color};'>
		{title}
	</div>
{/if}