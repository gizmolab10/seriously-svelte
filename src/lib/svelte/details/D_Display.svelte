<script lang='ts'>
	import { w_show_countDots_ofType, w_background_color, w_depth_limit } from '../../ts/common/Stores';
	import { k, u, Point, T_Kinship } from '../../ts/common/Global_Imports';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../kit/Separator.svelte';
	import Slider from '../mouse/Slider.svelte';
	import Color from '../kit/Color.svelte';
	export let top = 0;
	const color_left = 60
	const picker_offset = `-117px`;
	const font_size = k.font_size.smaller;
	const info_width = k.width_details - 30;
	const color_origin = new Point(color_left, 84);
	const separator_font_size = k.font_size.smallest;
	const titles = [T_Kinship[T_Kinship.child], T_Kinship[T_Kinship.parent], T_Kinship[T_Kinship.related]];
	const heights = [5, 9, 25, 9, 0];
	const tops = u.cumulativeSum(heights);
	let color = $w_background_color;

	function handle_colors(result: string) {
		$w_background_color = color = result;
	}

	function handle_count_dots(types: string[]) {
		$w_show_countDots_ofType = types as Array<T_Kinship>;
	}

</script>

<div class='display'
	style='
		left:0px;
		color:black;
		width: 100%;
		top:{top}px;
		position:relative;
		font-size:{k.font_size.small}px;'>
	<Separator
		isHorizontal={true}
		has_thin_divider={true}
		length={k.width_details}
		margin={k.details_margin}
		origin={Point.y(tops[0])}
		title='show tiny dots for'
		title_left={k.separator_title_left}
		title_font_size={separator_font_size}
		thickness={k.thickness.separator.ultra_thin}/>
	<Segmented
		left={9}
		name='counts'
		top={tops[1]}
		titles={titles}
		allow_none={true}
		allow_multiple={true}
		width={k.width_details}
		height={k.height.button}
		origin={new Point(0, tops[1])}
		selected={$w_show_countDots_ofType}
		handle_selection={handle_count_dots}/>
	<Separator
		title='color'
		isHorizontal={true}
		has_thin_divider={true}
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
			position: absolute;;
			border: 1.5px solid black;
			left: {color_origin.x + 70}px;
			background-color: {$w_background_color}'>
		<Color
			color={color}
			origin={Point.square(-3.5)}
			color_closure={handle_colors}
			picker_offset={picker_offset}/>
	</div>
	<div 
		class= 'background'
		style='
			top: {tops[4]}px;
			position: absolute;;
			left: {color_origin.x}px;'>
		background:
	</div>
</div>
