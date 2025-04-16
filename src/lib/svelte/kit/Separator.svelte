<script lang='ts'>
	import { k, u, colors, T_Layer } from '../../ts/common/Global_Imports';
	import { w_background_color } from '../../ts/common/Stores';
	export let title_font_size = `${k.small_font_size}px`;
	export let thickness = k.fat_separator_thickness;
	export let title: string | null = null;
	export let width = k.width_details;
	export let left = 0;
	export let top = 0;
	const title_width = u.getWidth_ofString_withSize(title ?? k.empty, title_font_size);
	const title_left = (width + (left * 2.1) - title_width - 12) / 2;
	let separator_color = colors.separator;

	$: {
		const _ = $w_background_color;
		separator_color = colors.separator;
	}

</script>

<div class='separator-line'
	style='
		top:{top}px;
		left:{left}px;
		width:{width}px;
		position:absolute;
		height:{thickness}px;
		z-index:{T_Layer.details};
		background-color:{separator_color};'>
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
