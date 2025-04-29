<script lang='ts'>
	import { w_t_countDots, w_background_color } from '../../ts/common/Stores';
	import { k, Point, T_Kinship } from '../../ts/common/Global_Imports';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../kit/Separator.svelte';
	import Color from '../kit/Color.svelte';
	export let top = 0;
	const color_left = 10
	const picker_offset = `-88px`;
	const info_width = k.width_details - 30;
	const font_size = `${k.size.smaller_font}px`;
	const color_origin = new Point(color_left, 41);
	const separator_font_size = `${k.size.smallest_font}px`;
	const titles = [T_Kinship[T_Kinship.child], T_Kinship[T_Kinship.parent], T_Kinship[T_Kinship.related]];
	let color = $w_background_color;
	
	function selection_closure(t_counts: Array<string>) {
		$w_t_countDots = t_counts as Array<T_Kinship>;
	}

	function handle_colors(result: string) {
		$w_background_color = color = result;
	}

	</script>

<div class='display'
	style='
		left:10px;
		color:black;
		top:{top + 3}px;
		position:absolute;
		width:{k.width_details}px;
		font-size:{k.size.small_font}px;'>
	<Separator title='show tiny dots for' top=2 left=5 width={info_width} title_font_size={separator_font_size} thickness={k.thickness.thin}/>
	<Segmented
		titles={titles}
		allow_multiple={true}
		font_size={font_size}
		name='counts-selector'
		height={k.height.small}
		origin={new Point(19, 9)}
		selected={$w_t_countDots}
		selection_closure={selection_closure}/>
	<Separator title='color' top=32 left=5 width={info_width} title_font_size={separator_font_size} thickness={k.thickness.thin}/>
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