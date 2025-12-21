<script lang='ts'>
	import { T_Layer, T_Graph, T_Control, T_Kinship } from '../../ts/common/Global_Imports';
	import { g, k, u, show, Point, colors, controls } from '../../ts/common/Global_Imports';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../draw/Separator.svelte';
	import Slider from '../mouse/Slider.svelte';
	import { transparentize } from 'color2k';
	export let zindex = T_Layer.graph;
	export let width = 137;
	const left_width = 40;
	const { w_depth_limit } = g;
	const heights = [ 3, 5, 18 ];
	const { w_separator_color } = colors;
	const tops = u.cumulativeSum(heights);
	const segmented_height = k.height.button + 3;
	const { w_t_trees } = show;
	let layout_throttle_timer: number | null = null;
	let pending_depth_limit: number | null = null;

	function handle_depth_limit(value: number) {
		const asInteger = Math.round(value);
		if (asInteger !== $w_depth_limit) {
			$w_depth_limit = asInteger;  // Store the integer, not the raw value
			pending_depth_limit = asInteger;
			throttled_layout();
		}
	}

	function throttled_layout() {
		if (!layout_throttle_timer) {
			g.layout();
			layout_throttle_timer = setTimeout(() => {
				layout_throttle_timer = null;
				if (pending_depth_limit !== null && pending_depth_limit !== $w_depth_limit) {
					throttled_layout();
				}
				pending_depth_limit = null;
			}, 50);
		}
	}

</script>

<div class='tree-preferences' style='
	top: 3px;
	left: -3px;
	width: 100%;
	height: 35px;
	z-index: {zindex};
	position: absolute;
	border-radius: 20px;
	pointer-events: auto;
	background-color: transparent;'>
	<Slider
		max={12}
		width={117}
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
		position: absolute;
		align-items: center;
		justify-content: center;
		font-size: {k.font_size.common}px;'>
		{$w_depth_limit} level{($w_depth_limit < 2) ? '' : 's'}
	</div>
	{#key $w_t_trees}
		<Segmented name='tree-types'
			left={58}
			width={width}
			allow_multiple={true}
			origin={new Point(184, -16)}
			height={k.height.button + 2}
			selected={$w_t_trees}
			titles={[T_Kinship.children, T_Kinship.related]}
			handle_selection={(titles) => controls.handle_segmented_choices('tree', titles)}/>
	{/key}
</div>