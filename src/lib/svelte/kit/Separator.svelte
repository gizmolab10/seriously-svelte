<script lang='ts'>
	import { w_show_details_ofType, w_background_color } from '../../ts/common/Stores';
	import { T_Layer, Direction,  } from '../../ts/common/Global_Imports';
	import { k, u, Point, colors } from '../../ts/common/Global_Imports';
	import Gull_Wings from '../kit/Gull_Wings.svelte';
	export let corner_radius = k.radius.gull_wings.tiny;
	export let thickness = k.thickness.separator.thick;
	export let title_font_size = k.font_size.smaller;
	export let title_left: number | null= null;
	export let title: string | null = null;
	export let zindex = T_Layer.details;
	export let length = k.width_details;
	export let origin = Point.zero;
	export let isHorizontal = true;
	export let hasBothEnds = true;
	export let add_wings = true;
	export let margin = 0;
	const line_left = isHorizontal ? origin.x + margin : origin.x - thickness / 2;
	const title_width = u.getWidth_ofString_withSize(title ?? k.empty, `${title_font_size}px`);
	let separator_color = colors.separator;
	let title_top = 0;

	// origin is the center at the start of the separator
	// length
	// isHorizontal	true starts at origin.x, false starts at top
	// add_wings	has gull wings at either one or both ends
	// hasBothEnds	if add_wings is true, then has gull wings at both ends
	// margin		
	// zindex

	$: separatorStyle = style_for(isHorizontal, line_left, zindex, top, origin.y, margin, thickness, length, separator_color);
	$: $w_show_details_ofType, title_top = origin.y - 4 + thickness * 0.2 - title_font_size * 0.1;
	$: wingsCenter_single = wingsCenter_for(isHorizontal, length, thickness, false);
	$: wingsCenter_dual = wingsCenter_for(isHorizontal, length, thickness, true);
	$: wingsDirection_single = isHorizontal ? Direction.right : Direction.down;
	$: wingsDirection_dual = isHorizontal ? Direction.left : Direction.up;
	$: title_left = (length + (origin.x * 2.1) - title_width - 12) / 2;
	$: $w_background_color, separator_color = colors.separator;

	function style_for(isHorizontal: boolean, line_left: number, zindex: number, top: number, origin_y: number, margin: number, thickness: number, length: number, separator_color: string): string {
		return isHorizontal
			? `top:${origin.y}px; z-index:${zindex}; position:absolute; left:${line_left}px; height:${thickness}px; width:${length - margin * 2}px; background-color:${separator_color};`
			: `left:${line_left}px; z-index:${zindex}; position:absolute; top:${origin.y + margin}px; width:${thickness}px; height:${length ? length : length - margin * 2}px; background-color:${separator_color};`;
	}

	function wingsCenter_for(isHorizontal: boolean, length: number, thickness: number, forOtherEnd: boolean): Point {
		return isHorizontal
			? new Point(forOtherEnd ? length - 6 : 0, thickness / 2)
			: new Point(thickness / 2, forOtherEnd ? length - 6 : 0);
	}

</script>

<div class='separator-line' style={separatorStyle}>
	{#if add_wings && !margin}
		<Gull_Wings
			thickness={k.thickness.separator.ultra_thin}
			direction={wingsDirection_single}
			center={wingsCenter_single}
			color={separator_color}
			radius={corner_radius}/>
		{#if hasBothEnds}
			<Gull_Wings
				thickness={k.thickness.separator.ultra_thin}
				direction={wingsDirection_dual}
				center={wingsCenter_dual}
				color={separator_color}
				radius={corner_radius}/>
		{/if}
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