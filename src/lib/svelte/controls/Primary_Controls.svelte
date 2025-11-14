<script lang='ts'>
	import { c, e, k, s, u, x, show, colors, search, layout } from '../../ts/common/Global_Imports';
	import { Point, elements, controls, svgPaths } from '../../ts/common/Global_Imports';
	import { T_Layer, T_Graph, T_Control } from '../../ts/common/Global_Imports';
	import Search_Toggle from '../search/Search_Toggle.svelte';
	import Next_Previous from '../mouse/Next_Previous.svelte';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../draw/Separator.svelte';
	import Breadcrumbs from './Breadcrumbs.svelte';
	import Button from '../mouse/Button.svelte';
	const y_center = 10.5;
	const scaling_stroke_width = 1.5;
	const { w_search_state } = search;
	const size_big = k.height.button + 4;
	const { w_rect_ofGraphView } = layout;
	const { w_background_color } = colors;
	const hamburger_size = k.height.button;
	const { w_search_controls, w_graph_ofType } = show;
	const { w_count_window_resized, w_popupView_id } = s;
	const hamburger_path = svgPaths.hamburgerPath(hamburger_size);
	const svg_style = 'top: -0.5px; left: -0.5px; position: absolute; width: 100%; height: 100%;';
	let width = layout.windowSize.width - 20;
	let lefts: number[] = [];
	layout_controls();

	// always show controls and breadcrumbs

	function togglePopupID(id) { $w_popupView_id = ($w_popupView_id == id) ? null : id; }
	function handle_recents_mouseClick(column: number) { x.ancestry_next_focusOn(column == 1); }

	$: {
		const _ = `${$w_rect_ofGraphView.description}:::${$w_count_window_resized}`;
		width = layout.windowSize.width - 20;
	}

	$: {
		const _ = $w_search_state;
		layout_controls();
	}

	function layout_controls() {
		const left_widths = {
			0: c.has_details_button ? 18 : -7,			// details
			1: !$w_search_controls ? 11 : c.has_details_button ? 11 : 11,	// recents / search
			2: c.has_standalone_UI ? 57 : 0,	// graph type
			3: c.has_zoom_controls ? 100 : 34,	// plus (100, for now hidden)
			4: c.has_zoom_controls ? 26 : 0,	// minus (26, for now hidden)
			5: c.allow_search ? 24 : 6,
			6: 25,	// easter egg, separator
			7: 43,	// search
			8: -37,	// breadcrumbs
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
			{#if c.has_details_button}
				<Button name='details-toggle'
					border_thickness=0
					color='transparent'
					center={new Point(lefts[0], y_center)}
					s_button={elements.s_control_forType(T_Control.details)}
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
							fill={elements.s_control_forType(T_Control.details).isHovering ? 'white' : 'black'}
							stroke={elements.s_control_forType(T_Control.details).isHovering ? 'darkgray' : 'transparent'}/>
					</svg>
				</Button>
			{/if}
			{#if c.allow_search}
				<Search_Toggle
					top={-0.5}
					left={-54 - (c.has_details_button ? 0 : 26)}
					width={lefts[7] + (c.has_details_button ? 0 : 26)}/>
			{/if}
			{#if c.has_standalone_UI}
				{#key $w_graph_ofType}
					<Segmented name='graph-type'
						width={80}
						origin={Point.x(lefts[2])}
						selected={[$w_graph_ofType]}
						titles={[T_Graph.tree, T_Graph.radial]}
						handle_selection={(titles) => controls.handle_segmented_choices('graph', titles)}/>
				{/key}
			{/if}
			{#if c.has_zoom_controls}
				<div class='scaling-controls'>
					<Button name={T_Control.grow}
						width={size_big}
						height={size_big}
						center={new Point(lefts[3], y_center)}
						s_button={elements.s_control_forType(T_Control.grow)}
						closure={(s_mouse) => e.handle_s_mouseFor_t_control(s_mouse, T_Control.grow)}>
						<svg id='grow-svg' style={svg_style}>
							<path
								id='grow-path'
								fill=transparent
								d={svgPaths.t_cross(size_big, 2)}
								stroke-width={scaling_stroke_width}
								stroke={elements.s_control_forType(T_Control.grow).svg_hover_color}/>
						</svg>
					</Button>
					<Button name={T_Control.shrink}
						width={size_big}
						height={size_big}
						center={new Point(lefts[4], y_center)}
						s_button={elements.s_control_forType(T_Control.shrink)}
						closure={(s_mouse) => e.handle_s_mouseFor_t_control(s_mouse, T_Control.shrink)}>
						<svg id='shrink-svg'
							style={svg_style}>
							<path id='shrink-path'
								fill=transparent
								d={svgPaths.dash(size_big, 4)}
								stroke-width={scaling_stroke_width}
								stroke={elements.s_control_forType(T_Control.shrink).svg_hover_color}/>
						</svg>
					</Button>
				</div>
			{/if}
			{#if !c.has_details_button}
				<Button name='easter-egg'
					width={20}
					height={30}
					color='transparent'
					zindex={T_Layer.frontmost}
					center={new Point(lefts[6], 10)}
					style='border: none; background: none;'
					s_button={elements.s_control_forType(T_Control.details)}
					closure={(s_mouse) => e.handle_s_mouseFor_t_control(s_mouse, T_Control.details)}/>
			{/if}
			<Separator name='before-breadcrumbs'
				isHorizontal={false}
				origin={new Point(lefts[6], -8)}
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
