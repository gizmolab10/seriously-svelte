<script lang='ts'>
	import { k, u, ux, Point, colors, layout, T_Layer, T_Kinship } from '../../ts/common/Global_Imports';
	import { w_depth_limit, w_background_color, w_show_tree_ofType } from '../../ts/common/Stores';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../mouse/Separator.svelte';
	import Slider from '../mouse/Slider.svelte';
	import { transparentize } from 'color2k';
	export let zindex = T_Layer.frontmost;
	export let width = k.width.details;
	export let top = 0;
	const back_up = -5;
	const left_width = 40;
	const heights = [ 3, 5, 18 ];
	const tops = u.cumulativeSum(heights);
	const segmented_height = k.height.button;

	function handle_depth_limit(value: number) {
		$w_depth_limit = value;
		layout.grand_layout();
	}

</script>

{#key $w_depth_limit}
	<div style='
		left: 3px;
		width: 177px;
		height: 50px;
		z-index: {zindex};
		position: absolute;
		border-radius: 20px;
		background-color: {transparentize($w_background_color, 0.15)};'>
		<div style='
			height: 36px;
			display: flex;
			font-size: 28px;
			position: absolute;
			align-items: center;
			width: {left_width}px;
			justify-content: center;'>
			{$w_depth_limit}
		</div>
		<div style='
			height: 20px;
			display: flex;
			font-size: 12px;
			top: {tops[2]}px;
			position: absolute;
			align-items: center;
			width: {left_width}px;
			justify-content: center;'>
			level{($w_depth_limit < 2) ? '' : 's'}
		</div>
		<div class='tree-preferences'
			style='
				left:27px;
				color:black;
				width: 100%;
				top:{top}px;
				position:relative;
				font-size:{k.font_size.info}px;'>
			<Slider
				max={12}
				width={width}
				show_value={false}
				isLogarithmic={true}
				value={$w_depth_limit}
				height={segmented_height}
				thumb_color={colors.separator}
				origin={new Point(10, tops[0])}
				title_left={k.separator_title_left}
				title_font_size={k.font_size.banners}
				handle_value_change={handle_depth_limit}/>
			{#key $w_show_tree_ofType}
				{#key $w_show_tree_ofType}
					<Segmented
						width={137}
						name='tree-types'
						allow_multiple={true}
						height={segmented_height}
						selected={$w_show_tree_ofType}
						origin={new Point(0, tops[1])}
						titles={[T_Kinship.children, T_Kinship.related]}
						handle_selection={(titles) => layout.handle_mode_selection('tree', titles)}/>
				{/key}
			{/key}
		</div>
</div>
{/key}