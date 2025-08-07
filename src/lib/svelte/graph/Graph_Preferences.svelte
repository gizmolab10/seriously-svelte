<script lang='ts'>
	import { k, u, ux, Point, colors, layout, svgPaths } from '../../ts/common/Global_Imports';
	import { T_Layer, T_Graph, T_Control, T_Kinship } from '../../ts/common/Global_Imports';
	import { w_show_tree_ofType, w_show_graph_ofType } from '../../ts/common/Stores';
	import { w_depth_limit, w_background_color } from '../../ts/common/Stores';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../mouse/Separator.svelte';
	import Button from '../buttons/Button.svelte';
	import Slider from '../mouse/Slider.svelte';
	import { transparentize } from 'color2k';
	export let zindex = T_Layer.frontmost;
	export let width = 137;
	export let top = 0;
	const back_up = -5;
	const left_width = 40;
	const control_top = 14;
	const control_left = 16;
	const heights = [ 3, 5, 18 ];
	const size_big = k.height.button + 1;
	const tops = u.cumulativeSum(heights);
	const segmented_height = k.height.button;
	const svg_style = 'top: -0.5px; left: -0.5px; position: absolute; width: 100%; height: 100%;';

	function handle_depth_limit(value: number) {
		$w_depth_limit = value;
		layout.grand_layout();
	}

</script>

<div class='graph-preferences' style='
	left: 3px;
	width: 177px;
	height: 50px;
	z-index: {zindex};
	position: absolute;
	border-radius: 20px;
	background-color: {transparentize($w_background_color, 0.15)};'>
	<div class='size-controls'>
		<Button
			width={size_big}
			height={size_big}
			name={T_Control.grow}
			center={new Point(control_left, control_top)}
			es_button={ux.s_control_forType(T_Control.grow)}
			closure={(s_mouse) => ux.handle_s_mouse_forControl_Type(s_mouse, T_Control.grow)}>
			<svg id='grow-svg' style={svg_style}>
				<path
					id='grow-path'
					fill=transparent
					d={svgPaths.t_cross(size_big, 2)}
					stroke={ux.s_control_forType(T_Control.grow).svg_hover_color}/>
			</svg>
		</Button>
		<Button
			width={size_big}
			height={size_big}
			name={T_Control.shrink}
			center={new Point(control_left, control_top + 21)}
			es_button={ux.s_control_forType(T_Control.shrink)}
			closure={(s_mouse) => ux.handle_s_mouse_forControl_Type(s_mouse, T_Control.shrink)}>
			<svg id='shrink-svg' style={svg_style}>
				<path
					id='shrink-path'
					fill=transparent
					d={svgPaths.dash(size_big, 2)}
					stroke={ux.s_control_forType(T_Control.shrink).svg_hover_color}/>
			</svg>
		</Button>
	</div>
	{#if $w_show_graph_ofType == T_Graph.tree}
		{#key $w_depth_limit}
			<div style='
				left: 22px;
				width: 100%;
				height: 100%;
				position: absolute;
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
						<Segmented
							width={width}
							name='tree-types'
							allow_multiple={true}
							height={segmented_height}
							selected={$w_show_tree_ofType}
							origin={new Point(9, tops[1])}
							titles={[T_Kinship.children, T_Kinship.related]}
							handle_selection={(titles) => layout.handle_mode_selection('tree', titles)}/>
					{/key}
				</div>
			</div>
		{/key}
	{/if}
</div>