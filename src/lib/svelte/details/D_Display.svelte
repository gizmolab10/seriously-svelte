<script lang='ts'>
	import { w_show_countDots_ofType, w_background_color, w_depth_limit } from '../../ts/common/Stores';
	import { k, u, ux, colors, Point, T_Layer, T_Kinship, layout } from '../../ts/common/Global_Imports';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../kit/Separator.svelte';
	import Slider from '../mouse/Slider.svelte';
	import Color from '../kit/Color.svelte';
	export let top = 0;
	const position = 'relative';
	const picker_offset = `-124px`;
	const font_size = k.font_size.smaller;
	const info_width = k.width_details - 30;
	const color_left = info_width / 2 + 2;
	const separator_font_size = k.font_size.smallest;
	const titles = [T_Kinship[T_Kinship.child], T_Kinship[T_Kinship.parent], T_Kinship[T_Kinship.related]];
	const heights = [10, -3, 27, -1, 54, -38];
	const tops = u.cumulativeSum(heights);
	let color = $w_background_color;

	function handle_colors(result: string) {
		$w_background_color = color = result;
	}

	function handle_count_dots(types: string[]) {
		$w_show_countDots_ofType = types as Array<T_Kinship>;
	}
	
	function handle_depth_limit(value: number) {
		$w_depth_limit = value;
		layout.grand_layout();
	}

</script>

<div class='display'
	style='
		left:0px;
		color:black;
		width: 100%;
		top:{top}px;
		position:{position};
		padding-bottom:51px;
		font-size:{k.font_size.small}px;'>
	<Separator
		isHorizontal={true}
		position={position}
		has_thin_divider={false}
		length={k.width_details}
		margin={k.details_margin}
		origin={Point.y(tops[0])}
		title='show tiny dots for'
		title_left={k.separator_title_left}
		title_font_size={separator_font_size}
		thickness={k.thickness.separator.ultra_thin}/>
	<Segmented
		name='counts'
		titles={titles}
		allow_none={true}
		allow_multiple={true}
		width={k.width_details}
		height={k.height.button}
		origin={new Point(0, tops[1])}
		selected={$w_show_countDots_ofType}
		handle_selection={handle_count_dots}/>
	<Separator
		position={position}
		isHorizontal={true}
		title='background color'
		has_thin_divider={false}
		length={k.width_details}
		margin={k.details_margin}
		origin={Point.y(tops[2])}
		title_left={k.separator_title_left}
		title_font_size={separator_font_size}
		thickness={k.thickness.separator.ultra_thin}/>
	<div 
		class= 'background-color'
		style='
			width: 15px;
			height: 15px;
			top: {tops[3]}px;
			left: {color_left}px;
			position: {position};
			border: 1.5px solid black;
			z-index: {T_Layer.detailsPlus_3};
			background-color: {$w_background_color}'>
		<Color
			color={color}
			origin={Point.square(-3.5)}
			color_closure={handle_colors}
			picker_offset={picker_offset}/>
	</div>
	<Separator
		isHorizontal={true}
		has_thin_divider={false}
		length={k.width_details}
		margin={k.details_margin}
		origin={Point.y(tops[4])}
		title_left={k.separator_title_left}
		title_font_size={separator_font_size}
		thickness={k.thickness.separator.ultra_thin}
		title={'visible levels'}/>
	{#if ux.inTreeMode}
		<Slider
			max={12}
			isLogarithmic={true}
			value={$w_depth_limit}
			width={k.width_details - 26}
			thumb_color={colors.separator}
			origin={new Point(10, tops[5])}
			title_left={k.separator_title_left}
			title_font_size={k.font_size.small}
			handle_value_change={handle_depth_limit}/>
	{:else}
		<div style='
			height:22px;
			display:flex;
			font-size:12px;
			position:relative;
			align-items:center;
			top:{tops[5] - 2}px;
			justify-content:center;'>
			radial graph only shows one level
		</div>
	{/if}
</div>
