<script lang='ts'>
	import { T_Layer, T_Graph, T_Search, S_Element, T_Element, T_Control, T_Kinship, T_Request } from '../../ts/common/Global_Imports';
	import { c, e, h, k, p, u, ux, show, grabs, Point, colors, layout, svgPaths, signals } from '../../ts/common/Global_Imports';
	import { w_show_details, w_show_graph_ofType, w_t_search, w_show_tree_ofType } from '../../ts/managers/Stores';
	import { w_background_color, w_device_isMobile, w_thing_fontFamily } from '../../ts/managers/Stores';
	import { w_graph_rect, w_count_resize, w_popupView_id } from '../../ts/managers/Stores';
	import Next_Previous from '../mouse/Next_Previous.svelte';
	import Identifiable from '../../ts/runtime/Identifiable';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../mouse/Separator.svelte';
	import Breadcrumbs from './Breadcrumbs.svelte';
	import Button from '../buttons/Button.svelte';
	import Box from '../mouse/Box.svelte';
	import Search from './Search.svelte';
	const size_big = k.height.button + 4;
	const y_center = 10.5;
	const scaling_stroke_width = 1.5;
	const hamburger_size = k.height.button;
	const hamburger_path = svgPaths.hamburgerPath(hamburger_size);
	const svg_style = 'top: -0.5px; left: -0.5px; position: absolute; width: 100%; height: 100%;';
	const widths = {
		0: c.has_details_button ? 18 : -11,	// details
		1: 17,	// recents
		2: 57,	// graph
		3: 100,	// grow
		4: 26,	// shrink
		5: 6,	// invisible
		6: 16,	// easter egg
		7: 10,	// breadcrumbs
		8: 20,	// search
		9: 16,	// end
	};
	const lefts = u.cumulativeSum(Object.values(widths));
	let width = layout.windowSize.width - 20;

	function togglePopupID(id) { $w_popupView_id = ($w_popupView_id == id) ? null : id; }
	function handle_recents_mouseClick(column: number) { grabs.focus_onNext(column == 1); }

	$: {
		const _ = $w_graph_rect + $w_count_resize;
		width = layout.windowSize.width - 20;
	}
	
</script>

{#key width, $w_background_color}
	<Box name='controls-box'
		color={colors.separator}
		width={layout.windowSize.width}
		height={layout.controls_boxHeight + 2}
		thickness={k.thickness.separator.main}
		corner_radius={k.radius.gull_wings.thick}>
		<div class='controls'
			style='
				left: 6px;
				top: 11.5px;
				width: {width}px;
				position: absolute;
				height: {size_big}px;
				z-index: {T_Layer.frontmost};'>
			{#if !$w_popupView_id}
				{#if c.has_details_button}
					<Button name='details-toggle'
						border_thickness=0
						color='transparent'
						center={new Point(lefts[0], y_center)}
						s_button={ux.s_control_forType(T_Control.details)}
						closure={(s_mouse) => e.handle_s_mouseFor_t_control(s_mouse, T_Control.details)}>
						<svg class='hamburger-svg'
							style='
								height: 17px;
								width: 20.5px;
								position: absolute;'
							viewBox='-1 -1 19 19'>
							<path
								d={hamburger_path}
								stroke-width='0.75'
								class='hamburger-path'
								fill={ux.s_control_forType(T_Control.details).isOut ? 'black' : 'white'}
								stroke={ux.s_control_forType(T_Control.details).isOut ? 'transparent' : 'darkgray'}/>
						</svg>
					</Button>
				{/if}
				<Next_Previous name='recents'
					size={28}
					height={size_big}
					has_title={false}
					has_seperator={false}
					has_gull_wings={false}
					origin={Point.x(lefts[1])}
					closure={handle_recents_mouseClick}/>
				{#key $w_show_graph_ofType}
					<Segmented name='graph'
						width={80}
						origin={Point.x(lefts[2])}
						selected={[$w_show_graph_ofType]}
						titles={[T_Graph.tree, T_Graph.radial]}
						handle_selection={(titles) => layout.handle_mode_selection('graph', titles)}/>
				{/key}
				<div class='scaling-controls'>
					<Button name={T_Control.grow}
						width={size_big}
						height={size_big}
						center={new Point(lefts[3], y_center)}
						s_button={ux.s_control_forType(T_Control.grow)}
						closure={(s_mouse) => e.handle_s_mouseFor_t_control(s_mouse, T_Control.grow)}>
						<svg id='grow-svg' style={svg_style}>
							<path
								id='grow-path'
								fill=transparent
								d={svgPaths.t_cross(size_big, 2)}
								stroke-width={scaling_stroke_width}
								stroke={ux.s_control_forType(T_Control.grow).svg_hover_color}/>
						</svg>
					</Button>
					<Button name={T_Control.shrink}
						width={size_big}
						height={size_big}
						center={new Point(lefts[4], y_center)}
						s_button={ux.s_control_forType(T_Control.shrink)}
						closure={(s_mouse) => e.handle_s_mouseFor_t_control(s_mouse, T_Control.shrink)}>
						<svg id='shrink-svg'
							style={svg_style}>
							<path id='shrink-path'
								fill=transparent
								d={svgPaths.dash(size_big, 4)}
								stroke-width={scaling_stroke_width}
								stroke={ux.s_control_forType(T_Control.shrink).svg_hover_color}/>
						</svg>
					</Button>
				</div>
				{#if !c.has_details_button}
					<Button name='easter-egg'
						width={20}
						height={30}
						color='transparent'
						zindex={T_Layer.frontmost}
						center={new Point(lefts[5], 10)}
						style='border: none; background: none;'
						s_button={ux.s_control_forType(T_Control.details)}
						closure={(s_mouse) => e.handle_s_mouseFor_t_control(s_mouse, T_Control.details)}/>
				{/if}
				<Separator name='before-breadcrumbs'
					isHorizontal={false}
					origin={new Point(lefts[6], -9)}
					length={layout.controls_boxHeight + 3}
					thickness={k.thickness.separator.main}
					corner_radius={k.radius.gull_wings.thick}/>
				<div class='dynamicals'
					style='
						left: {lefts[7]}px;
						position: absolute;
						height: {size_big}px;
						z-index: {T_Layer.frontmost};
						width: {layout.windowSize.width - lefts[8]}px;'>
					<Search
						left={11}
						y_center={y_center}
						width={layout.windowSize.width - lefts[8]}/>
					{#if $w_t_search == T_Search.clear}
						<Breadcrumbs
							left={0}
							centered={true}
							width={layout.windowSize.width - lefts[9]}/>
					{/if}
				</div>
			{/if}
		</div>
	</Box>
{/key}
