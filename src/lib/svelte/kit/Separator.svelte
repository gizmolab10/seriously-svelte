<script lang='ts'>
	import { run } from 'svelte/legacy';

	import { k, u, colors, T_Layer } from '../ts/common/Global_Imports';
	import { w_background_color } from '../ts/common/Stores';
	interface Props {
		title_font_size?: any;
		thickness?: any;
		title?: string | null;
		width?: any;
		left?: number;
		top?: number;
	}

	let {
		title_font_size = `${k.small_font_size}px`,
		thickness = k.fat_separator_thickness,
		title = null,
		width = k.width_details,
		left = 0,
		top = 0
	}: Props = $props();
	const title_width = u.getWidth_ofString_withSize(title ?? k.empty, title_font_size);
	const title_left = (width + (left * 2.1) - title_width - 12) / 2;
	let separator_rebuilds = $state(0);

	run(() => {
		const _ = $w_background_color;
		separator_rebuilds += 1;
	});

</script>

{#key separator_rebuilds}
	<div class='separator-line'
		style='
			top:{top}px;
			left:{left}px;
			width:{width}px;
			position:absolute;
			height:{thickness}px;
			z-index:{T_Layer.details};
			background-color:{colors.separator};'>
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
{/key}