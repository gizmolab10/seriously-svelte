<script lang='ts'>
	import { k, u, ZIndex } from '../../ts/common/Global_Imports';
	export let title: string | null = null;
	export let width = k.width_details;
	export let left = 0;
	export let top = 71;
	const font_ratio = 0.5;
	const title_left = (width - 12 - u.getWidth_ofString_withSize(title ?? k.empty, `${k.font_size * font_ratio}px`)) / 2;

</script>

<div class='horizontal-line'
	style='
		height:1px;
		top:{top}px;
		left:{left}px;
		width:{width}px;
		position:absolute;
		z-index:{ZIndex.details};
		background-color:lightgray;'>
</div>
{#if !!title}
	<div
		style='
			padding: 0px 5px;
			position:absolute;
			top:{top - 5.3}px;
			left:{title_left}px;
			font-size:{font_ratio}em;
			z-index:{ZIndex.frontmost};
			background-color:{k.color_background};'>
		{title}
	</div>
{/if}