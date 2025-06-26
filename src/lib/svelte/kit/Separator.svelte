<script lang='ts'>
	import { k, u, Point, colors, T_Layer, Direction } from '../../ts/common/Global_Imports';
	import { w_show_details_ofType, w_background_color } from '../../ts/common/Stores';
	import Gull_Wings from '../kit/Gull_Wings.svelte';
	export let corner_radius = k.radius.gull_wings.ultra_thin;
	export let thickness = k.thickness.separator.thick;
	export let title_font_size = k.font_size.separator;
	export let title_left: number | null= null;
	export let title: string | null = null;
	export let zindex = T_Layer.details;
	export let length = k.width_details;
	export let has_thin_divider = false;
	export let has_gull_wings = true;
	export let position = 'absolute';
	export let has_both_ends = true;
	export let origin = Point.zero;
	export let isHorizontal = true;
	export let margin = 0;
	export let name = 'separator';
	const title_top = origin.y - 1 - title_font_size / 1.5 + (position == 'relative' ? 0 : 1);
	const thin_line_color = colors.ofSeparatorFor('#aaaaaa');
	const class_name = `${name}-line-${isHorizontal ? 'horizontal' : 'vertical'}`;
	const line_left = isHorizontal ? origin.x + margin : origin.x - thickness / 2;
	const title_width = u.getWidth_ofString_withSize(title ?? k.empty, `${title_font_size}px`);
	let separator_color = colors.separator;

	// origin is the center at the start of the separator
	// length
	// isHorizontal	true starts at origin.x, false starts at top
	// has_gull_wings	has gull wings at either one or both ends
	// has_both_ends	if has_gull_wings is true, then has gull wings at both ends
	// margin		
	// zindex

	$: separatorStyle = style_for(isHorizontal, line_left, zindex, top, origin.y, margin, thickness, length, separator_color);
	$: wingsCenter_single = wingsCenter_for(isHorizontal, length, thickness, false);
	$: wingsCenter_dual = wingsCenter_for(isHorizontal, length, thickness, true);
	$: wingsDirection_single = isHorizontal ? Direction.right : Direction.down;
	$: wingsDirection_dual = isHorizontal ? Direction.left : Direction.up;
	$: title_left = (length + (origin.x * 2.1) - title_width - 12) / 2;
	$: $w_background_color, separator_color = colors.separator;

	function style_for(isHorizontal: boolean, line_left: number, zindex: number, top: number, origin_y: number, margin: number, thickness: number, length: number, separator_color: string): string {
		return isHorizontal
			? `top:${origin_y}px; z-index:${zindex}; position:${position}; left:${line_left}px; height:${thickness}px; width:${length - margin * 2}px; background-color:${separator_color};`
			: `left:${line_left}px; z-index:${zindex}; position:${position}; top:${origin_y + margin}px; width:${thickness}px; height:${length - 6 - margin * 2}px; background-color:${separator_color};`;
	}

	function wingsCenter_for(isHorizontal: boolean, length: number, thickness: number, forOtherEnd: boolean): Point {
		return isHorizontal
			? new Point(forOtherEnd ? length - 6 : 0, thickness / 2)
			: new Point(thickness / 2, forOtherEnd ? length - 6 : 0);
	}

</script>

<div class={class_name} style={separatorStyle}>
	{#if has_gull_wings && !margin}
		<Gull_Wings
			thickness={thickness}
			radius={corner_radius}
			color={separator_color}
			center={wingsCenter_single}
			direction={wingsDirection_single}/>
		{#if has_both_ends}
			<Gull_Wings
				thickness={thickness}
				radius={corner_radius}
				color={separator_color}
				center={wingsCenter_dual}
				direction={wingsDirection_dual}/>
		{/if}
	{/if}
</div>
{#if has_thin_divider}
	{#if isHorizontal}
		<div class='thin-horizontal-divider'
			style='
				height:{0.05}px;
				position:{position};
				z-index:{zindex + 1};
				width:{length - 21}px;
				left:{line_left + 8}px;
				top:{origin.y + thickness / 2}px;
				background-color:{thin_line_color};'>
		</div>
	{:else}
		<div class='thin-vertical-divider'
			style='
				width:{0.05}px;
				top:{origin.y}px;
				position:{position};
				z-index:{zindex + 1};
				height:{length - 6}px;
				left:{origin.x - 0.05}px;
				background-color:{thin_line_color};'>
		</div>
	{/if}
{/if}
{#if !!title}
	<div
		style='
			z-index:{zindex};
			padding: 0px 5px;
			top:{title_top}px;
			left:{title_left}px;
			position:{position};
			white-space: nowrap;
			z-index:{zindex + 2};
			width:{title_width}px;
			font-size:{title_font_size}px;
			background-color:{$w_background_color};'>
		{title}
	</div>
{/if}