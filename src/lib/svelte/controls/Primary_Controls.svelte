<script lang='ts'>
	import { c, e, g, k, s, u, x, show, colors, search } from '../../ts/common/Global_Imports';
	import { features, elements, controls, svgPaths } from '../../ts/common/Global_Imports';
	import { Point, T_Layer, T_Graph, T_Control } from '../../ts/common/Global_Imports';
	import Search_Toggle from '../search/Search_Toggle.svelte';
	import Next_Previous from '../mouse/Next_Previous.svelte';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../draw/Separator.svelte';
	import Breadcrumbs from './Breadcrumbs.svelte';
	import Button from '../mouse/Button.svelte';
	const y_center = 10.5;
	const { w_popupView_id } = s;
	const scaling_stroke_width = 1.5;
	const { w_rect_ofGraphView } = g;
	const { w_search_state } = search;
	const { w_count_window_resized } = e;
	const size_big = k.height.button + 4;
	const { w_background_color } = colors;
	const hamburger_size = k.height.button;
	const { w_show_search_controls, w_show_graph_ofType } = show;
	const hamburger_path = svgPaths.hamburgerPath(hamburger_size);
	const search_left = -38 - (features.has_details_button ? 0 : 26) + (features.allow_tree_mode ? 0 : 0);
	const svg_style = 'top: -0.5px; left: -0.5px; position: absolute; width: 100%; height: 100%;';
	let width = g.windowSize.width - 16;
	let lefts: Array<number> = [];
	layout_controls();

	// always show controls and breadcrumbs

	function togglePopupID(id) { $w_popupView_id = ($w_popupView_id == id) ? null : id; }
	function handle_recents_mouseClick(column: number) { x.ancestry_next_focusOn(column == 1); }

	$: {
		const _ = `${$w_rect_ofGraphView.description}:::${$w_count_window_resized}`;
		width = g.windowSize.width - 16;
	}

	$: {
		const _ = $w_search_state;
		layout_controls();
	}

	function layout_controls() {
		const left_widths = {
			0: features.has_details_button ? 18  : -7,									// details
			1: 11,																		// recents
			2: features.allow_tree_mode	   ? 54  : 0,									// graph type
			3: features.has_zoom_controls  ? 100 : features.allow_tree_mode ? 66 : 34,	// plus
			4: features.has_zoom_controls  ? 26  : 0,									// minus
			5: features.allow_search	   ? 22  : 6,									// easter egg
			6: 23,																		// separator
			7: 42,																		// search toggle
			8: -40,																		// breadcrumbs
		};
		lefts = u.cumulativeSum(Object.values(left_widths));
	}
	
</script>

{#key width, $w_background_color}
	<div class='primary-controls'
		style='
			left: 2px;
			top: 8.8px;
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
			{#if features.has_details_button}
				<Button name='details-toggle'
					border_thickness=0
					color='transparent'
					center={new Point(lefts[0], y_center)}
					s_button={elements.s_control_forType(T_Control.details)}
					handle_s_mouse={(s_mouse) => e.handle_s_mouseFor_t_control(s_mouse, T_Control.details)}>
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
			{#if features.allow_search}
				<Search_Toggle
					top={-0.5}
					left={search_left}
					width={lefts[7] + (features.has_details_button ? 0 : 26)}/>
			{/if}
			{#if features.allow_tree_mode}
				{#key $w_show_graph_ofType}
					<Segmented name='graph-type'
						width={80}
						origin={Point.x(lefts[2])}
						selected={[$w_show_graph_ofType]}
						titles={[T_Graph.tree, T_Graph.radial]}
						handle_selection={(titles) => controls.handle_segmented_choices('graph', titles)}/>
				{/key}
			{/if}
			{#if features.has_zoom_controls}
				<div class='scaling-controls'>
					<Button name={T_Control.grow}
						width={size_big}
						height={size_big}
						center={new Point(lefts[3], y_center)}
						s_button={elements.s_control_forType(T_Control.grow)}
						handle_s_mouse={(s_mouse) => e.handle_s_mouseFor_t_control(s_mouse, T_Control.grow)}>
						<svg name='grow-svg' style={svg_style}>
							<path
								name='grow-path'
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
						handle_s_mouse={(s_mouse) => e.handle_s_mouseFor_t_control(s_mouse, T_Control.shrink)}>
						<svg name='shrink-svg'
							style={svg_style}>
							<path name='shrink-path'
								fill=transparent
								d={svgPaths.dash(size_big, 4)}
								stroke-width={scaling_stroke_width}
								stroke={elements.s_control_forType(T_Control.shrink).svg_hover_color}/>
						</svg>
					</Button>
				</div>
			{/if}
			{#if !features.has_details_button}
				<Button name='easter-egg'
					width={20}
					height={30}
					color='transparent'
					zindex={T_Layer.frontmost}
					center={new Point(lefts[5], 10)}
					style='border: none; background: none;'
					s_button={elements.s_control_forType(T_Control.details)}
					handle_s_mouse={(s_mouse) => e.handle_s_mouseFor_t_control(s_mouse, T_Control.details)}/>
			{/if}
			{#if features.allow_tree_mode}
				<Separator name='before-search'
					isHorizontal={false}
					origin={new Point(lefts[5], -6)}
					length={g.controls_boxHeight + 0}
					thickness={k.thickness.separator.main}
					corner_radius={k.radius.gull_wings.thick}/>
				<Breadcrumbs
					left={lefts[6]}
					centered={true}
					width={g.windowSize.width - lefts[8]}/>
			{:else}
				<Separator name='before-search'
					isHorizontal={false}
					origin={new Point(lefts[5], -8)}
					length={g.controls_boxHeight + 1}
					thickness={k.thickness.separator.main}
					corner_radius={k.radius.gull_wings.thick}/>
			{/if}
		{/if}
	</div>
	<Separator name='bottom-separator'
		origin={new Point(2, g.controls_boxHeight - 5)}
		corner_radius={k.radius.gull_wings.thick}
		thickness={k.thickness.separator.main}
		length={g.windowSize.width + 2.5}
		zindex={T_Layer.frontmost}
		has_both_wings={true}
		isHorizontal={true}/>
{/key}
