<script lang='ts'>
	import { w_show_countDots_ofType, w_background_color } from '../../ts/common/Stores';
	import { k, Point, T_Kinship } from '../../ts/common/Global_Imports';
	import Separator from '../kit/Separator.svelte';
	import Color from '../kit/Color.svelte';
	import Foo from '../mouse/Foo.svelte';
	export let top = 0;
	const color_left = 60
	const picker_offset = `-117px`;
	const font_size = k.font_size.smaller;
	const info_width = k.width_details - 30;
	const color_origin = new Point(color_left, 45);
	const separator_font_size = k.font_size.smallest;
	const titles = [T_Kinship[T_Kinship.child], T_Kinship[T_Kinship.parent], T_Kinship[T_Kinship.related]];
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
		top:{top + 3}px;
		position:absolute;
		font-size:{k.font_size.small}px;'>
	<Separator
		origin={Point.y(2)}
		has_thin_divider={false}
		length={k.width_details}
		margin={k.details_margin}
		title='show tiny dots for'
		title_left={k.separator_title_left}
		title_font_size={separator_font_size}
		thickness={k.thickness.separator.ultra_thin}/>
	<Foo
		top={11}
		left={9}
		titles={titles}
		allow_none={true}
		allow_multiple={true}
		font_size={font_size}
		name='counts-selector'
		width={k.width_details}
		height={k.height.button}
		origin={new Point(47, 12)}
		selected={$w_show_countDots_ofType}
		handle_selection={handle_count_dots}/>

	<Separator
		title='color'
		origin={Point.y(36)}
		has_thin_divider={false}
		length={k.width_details}
		margin={k.details_margin}
		title_left={k.separator_title_left}
		title_font_size={separator_font_size}
		thickness={k.thickness.separator.ultra_thin}/>
	<div 
		class= 'background'
		style='
			position: absolute;;
			top: {color_origin.y}px;
			left: {color_origin.x}px;'>
		background:
	</div>
	<div 
		class= 'background-color'
		style='
			width: 15px;
			height: 15px;
			position: absolute;;
			border: 1.5px solid black;
			top: {color_origin.y - 1}px;
			left: {color_origin.x + 70}px;
			background-color: {$w_background_color}'>
		<Color
			color={color}
			origin={Point.square(-3.5)}
			color_closure={handle_colors}
			picker_offset={picker_offset}/>
	</div>
</div>
