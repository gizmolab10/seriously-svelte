<script lang='ts'>
	import { w_t_countDots, w_background_color } from '../../ts/common/Stores';
	import { k, Point, T_Hierarchy } from '../../ts/common/Global_Imports';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../kit/Separator.svelte';
	import Color from '../kit/Color.svelte';
	export let top = 0;
	const color_left = 10
	const font_ratio = 0.8;
	const info_width = k.width_details - 30;
	const picker_offset = `-88px`;
	const color_origin = new Point(color_left, 41);
	const separator_font_size = `${k.tiny_font_size}px`;
	const titles = [T_Hierarchy[T_Hierarchy.children], T_Hierarchy[T_Hierarchy.parents], T_Hierarchy[T_Hierarchy.related]];
	let display_rebuilds = 0;
	
	function selection_closure(t_counts: Array<string>) {
		$w_t_countDots = t_counts as Array<T_Hierarchy>;
		display_rebuilds += 1;
	}

	function handle_colors(result: string | null): string | null {
		if (!result) {
			return $w_background_color;
		} else {
			$w_background_color = result;
			return null;
		}
	}

	</script>

{#key display_rebuilds}
	<div class='display'
		style='
			left:10px;
			color:black;
			top:{top + 3}px;
			position:absolute;
			font-size:{font_ratio}em;
			width:{k.width_details}px;'>
		<Separator title='show tiny dots for' top=2 left=5 width={info_width} title_font_size={separator_font_size}/>
		<Segmented
			titles={titles}
			allow_multiple={true}
			name='counts-selector'
			origin={new Point(4, 9)}
			selected={$w_t_countDots}
			height={k.row_height * font_ratio}
			selection_closure={selection_closure}/>
		<Separator title='colors' top=32 left=5 width={info_width} title_font_size={separator_font_size}/>

		<div 
			class= 'background'
			style='
				position: absolute;;
				top: {color_origin.y}px;
				left: {color_origin.x}px;'>
			background:
		</div>
		<div 
			class= 'background'
			style='
				width: 15px;
				height: 15px;
				position: absolute;;
				top: {color_origin.y - 1}px;
				border: 1.5px solid black;
				left: {color_origin.x + 70}px;
				background-color: {$w_background_color}'>
			<Color
				label={'background'}
				origin={Point.square(-3.5)}
				color_closure={handle_colors}
				picker_offset={picker_offset}/>
			</div>
	</div>
{/key}