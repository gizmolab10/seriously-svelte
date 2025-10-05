<script lang='ts'>
	import { c, e, ex, h, k, p, u, ux, x, show, grabs, search, colors, layout } from '../../ts/common/Global_Imports';
	import { w_search_preferences, w_search_state, w_search_show_controls } from '../../ts/managers/Stores';
	import { w_background_color, w_device_isMobile, w_thing_fontFamily } from '../../ts/managers/Stores';
	import { w_show_details, w_show_graph_ofType, w_show_tree_ofType } from '../../ts/managers/Stores';
	import { T_Layer, T_Graph, T_Search, T_Element, T_Control } from '../../ts/common/Global_Imports';
	import { w_graph_rect, w_count_window_resized, w_popupView_id } from '../../ts/managers/Stores';
	import { T_Kinship, T_Request, T_Search_Preference } from '../../ts/common/Global_Imports';
	import { Point, svgPaths, signals, S_Element } from '../../ts/common/Global_Imports';
	import Search_Toggle from '../search/Search_Toggle.svelte';
	import Next_Previous from '../mouse/Next_Previous.svelte';
	import Identifiable from '../../ts/runtime/Identifiable';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../draw/Separator.svelte';
	import Breadcrumbs from './Breadcrumbs.svelte';
	import Button from '../mouse/Button.svelte';
	const y_center = 10.5;
	const scaling_stroke_width = 1.5;
	const size_big = k.height.button + 4;
	const hamburger_size = k.height.button;
	const hamburger_path = svgPaths.hamburgerPath(hamburger_size);
	const svg_style = 'top: -0.5px; left: -0.5px; position: absolute; width: 100%; height: 100%;';
	let width = layout.windowSize.width - 20;
	let lefts: number[] = [];
	layout_controls();

	// two states
	// 1. show OR hide the details button
	// 2. shows normal OR search controls
	// always shows a separator and the breadcrumbs

	function togglePopupID(id) { $w_popupView_id = ($w_popupView_id == id) ? null : id; }
	function handle_recents_mouseClick(column: number) { x.ancestry_next_focusOn(column == 1); }

	$: {
		const _ = `${$w_graph_rect.description}:::${$w_count_window_resized}`;
		width = layout.windowSize.width - 20;
	}

	$: {
		const _ = $w_search_state;
		layout_controls();
	}

	function layout_controls() {
		const left_widths = {
			0: c.show_details_button ? 18 : -7,			// details
			1: !$w_search_show_controls ? 11 : c.show_details_button ? 11 : 11,	// recents / search
			2: 57,	// graph type
			3: 100,	// plus
			4: 26,	// minus
			5: c.allow_search ? 24 : 6,
			6: 25,	// easter egg, separator
			7: 43,	// search
			8: 0,	// breadcrumbs
		};
		lefts = u.cumulativeSum(Object.values(left_widths));
	}
	
</script>

{#key width, $w_background_color}
	<div class='primary-controls'
		style='
			left: 6px;
			top: 10.5px;
			width: {width}px;
			position: absolute;
			height: {size_big}px;
			z-index: {T_Layer.frontmost};'>
		<Next_Previous name='recents'
			size={28}
			has_title={false}
			origin={Point.x(lefts[1])}
			closure={handle_recents_mouseClick}/>
		{#if !$w_popupView_id}
			{#if c.show_details_button}
				<Button name='details-toggle'
					border_thickness=0
					color='transparent'
					center={new Point(lefts[0], y_center)}
					s_button={ex.s_control_forType(T_Control.details)}
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
							fill={ex.s_control_forType(T_Control.details).isOut ? 'black' : 'white'}
							stroke={ex.s_control_forType(T_Control.details).isOut ? 'transparent' : 'darkgray'}/>
					</svg>
				</Button>
			{/if}
			{#if c.allow_search}
				<Search_Toggle
					top={-0.5}
					left={-54 - (c.show_details_button ? 0 : 26)}
					width={lefts[7] + (c.show_details_button ? 0 : 26)}/>
			{/if}
			{#key $w_show_graph_ofType}
				<Segmented name='graph-type'
					width={80}
					origin={Point.x(lefts[2])}
					selected={[$w_show_graph_ofType]}
					titles={[T_Graph.tree, T_Graph.radial]}
					handle_selection={(titles) => ux.handle_choiceOf_t_graph('graph', titles)}/>
			{/key}
			<div class='scaling-controls'>
				<Button name={T_Control.grow}
					width={size_big}
					height={size_big}
					center={new Point(lefts[3], y_center)}
					s_button={ex.s_control_forType(T_Control.grow)}
					closure={(s_mouse) => e.handle_s_mouseFor_t_control(s_mouse, T_Control.grow)}>
					<svg id='grow-svg' style={svg_style}>
						<path
							id='grow-path'
							fill=transparent
							d={svgPaths.t_cross(size_big, 2)}
							stroke-width={scaling_stroke_width}
							stroke={ex.s_control_forType(T_Control.grow).svg_hover_color}/>
					</svg>
				</Button>
				<Button name={T_Control.shrink}
					width={size_big}
					height={size_big}
					center={new Point(lefts[4], y_center)}
					s_button={ex.s_control_forType(T_Control.shrink)}
					closure={(s_mouse) => e.handle_s_mouseFor_t_control(s_mouse, T_Control.shrink)}>
					<svg id='shrink-svg'
						style={svg_style}>
						<path id='shrink-path'
							fill=transparent
							d={svgPaths.dash(size_big, 4)}
							stroke-width={scaling_stroke_width}
							stroke={ex.s_control_forType(T_Control.shrink).svg_hover_color}/>
					</svg>
				</Button>
			</div>
			{#if !c.show_details_button}
				<Button name='easter-egg'
					width={20}
					height={30}
					color='transparent'
					zindex={T_Layer.frontmost}
					center={new Point(lefts[6], 10)}
					style='border: none; background: none;'
					s_button={ex.s_control_forType(T_Control.details)}
					closure={(s_mouse) => e.handle_s_mouseFor_t_control(s_mouse, T_Control.details)}/>
			{/if}
			<Separator name='before-breadcrumbs'
				isHorizontal={false}
				origin={new Point(lefts[6], -9)}
				length={layout.controls_boxHeight + 1}
				thickness={k.thickness.separator.main}
				corner_radius={k.radius.gull_wings.thick}/>
			<Breadcrumbs
				left={lefts[6]}
				centered={true}
				width={layout.windowSize.width - lefts[8]}/>
		{/if}
	</div>
	<Separator name='bottom-separator'
		origin={new Point(2, layout.controls_boxHeight - 5)}
		corner_radius={k.radius.gull_wings.thick}
		thickness={k.thickness.separator.main}
		length={layout.windowSize.width + 2.5}
		zindex={T_Layer.frontmost}
		has_both_wings={true}
		isHorizontal={true}/>
{/key}
