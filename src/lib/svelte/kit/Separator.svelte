<script lang='ts'>
	import { w_show_details_ofType, w_background_color } from '../../ts/common/Stores';
	import { T_Layer, Direction,  } from '../../ts/common/Global_Imports';
	import { k, u, Point, colors } from '../../ts/common/Global_Imports';
	import Gull_Wings from '../kit/Gull_Wings.svelte';
	export let title_font_size = k.font_size.smaller;;
	export let thickness = k.thickness.separator;
	export let title_left: number | null= null;
	export let title: string | null = null;
	export let zindex = T_Layer.details;
	export let width = k.width_details;
	export let add_wings = true;
	export let margin = 0;
	export let radius = 7;
	export let left = 0;
	export let top = 0;
	const line_left = left + margin;
	const title_width = u.getWidth_ofString_withSize(title ?? k.empty, `${title_font_size}px`);
	let separator_color = colors.separator;
	let title_top = 0;

	$: $w_show_details_ofType, title_top = top - 4 + thickness * 0.2 - title_font_size * 0.1;

	if (!title_left) {
		title_left = (width + (left * 2.1) - title_width - 12) / 2;
	}

	$: $w_background_color, separator_color = colors.separator;

</script>

<div class='separator-line'
	style='
		top:{top}px;
		z-index:{zindex};
		position:absolute;
		left:{line_left}px;
		height:{thickness}px;
		width:{width - margin * 2}px;
		background-color:{separator_color};'>
	{#if add_wings && !margin}
		<Gull_Wings
			center={new Point(width, 0.3).offsetEquallyBy(thickness / 2)}
			direction={Direction.left}
			color={separator_color}
			radius={radius}
			thickness={1}/>
	{/if}
</div>
{#if !!title}
	<div
		style='
			z-index:{zindex};
			padding: 0px 5px;
			position:absolute;
			top:{title_top}px;
			left:{title_left}px;
			white-space: nowrap;
			font-size:{title_font_size}px;
			background-color:{$w_background_color};'>
		{title}
	</div>
{/if}