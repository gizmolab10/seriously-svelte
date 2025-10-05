<script lang='ts'>
	import { T_Layer, T_Graph, T_Control, T_Kinship } from '../../ts/common/Global_Imports';
	import { w_show_tree_ofType, w_show_graph_ofType } from '../../ts/managers/Stores';
	import { w_depth_limit, w_separator_color } from '../../ts/managers/Stores';
	import { k, u, ux, Point, layout } from '../../ts/common/Global_Imports';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../draw/Separator.svelte';
	import Slider from '../mouse/Slider.svelte';
	import { transparentize } from 'color2k';
	export let zindex = T_Layer.graph;
	export let width = 137;
	const left_width = 40;
	const heights = [ 3, 5, 18 ];
	const tops = u.cumulativeSum(heights);
	const segmented_height = k.height.button + 3;

	function handle_depth_limit(value: number) {
		const asInteger = Math.round(value);
		if (asInteger !== $w_depth_limit) {
			$w_depth_limit = asInteger;  // Store the integer, not the raw value
			layout.grand_layout();
		}
	}

</script>

<div class='tree-preferences' style='
	top: 3px;
	left: -3px;
	width: 100%;
	height: 50px;
	z-index: {zindex};
	position: absolute;
	border-radius: 20px;
	pointer-events: auto;
	background-color: transparent;'>
	<Slider
		max={12}
		width={width}
		show_value={false}
		isLogarithmic={true}
		value={$w_depth_limit}
		origin={new Point(10, 3)}
		height={k.height.button + 4}
		thumb_color={$w_separator_color}
		title_font_size={k.font_size.banners}
		handle_value_change={handle_depth_limit}/>
	<div class='depth-value' style='
		top: 2px;
		left: 127px;
		width: 56px;
		height: 26px;
		display: flex;
		font-size: 14px;
		position: absolute;
		align-items: center;
		justify-content: center;'>
		{$w_depth_limit} level{($w_depth_limit < 2) ? '' : 's'}
	</div>
	{#key $w_show_tree_ofType}
		<Segmented name='tree-types'
			left={58}
			width={width}
			allow_multiple={true}
			origin={new Point(184, -16)}
			height={k.height.button + 2}
			selected={$w_show_tree_ofType}
			titles={[T_Kinship.children, T_Kinship.related]}
			handle_selection={(titles) => ux.handle_choiceOf_t_graph('tree', titles)}/>
	{/key}
</div>