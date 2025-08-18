<script lang='ts'>
	import { T_Layer, T_Graph, T_Filter, T_Search, S_Element, T_Element, T_Control, T_Kinship, T_Request } from '../../ts/common/Global_Imports';
	import { c, e, h, k, p, u, ux, show, grabs, Point, colors, layout, svgPaths, signals } from '../../ts/common/Global_Imports';
	import { w_background_color, w_device_isMobile, w_thing_fontFamily } from '../../ts/managers/Stores';
	import { w_show_details, w_show_graph_ofType, w_show_tree_ofType } from '../../ts/managers/Stores';
	import { w_graph_rect, w_count_resize, w_popupView_id } from '../../ts/managers/Stores';
	import { w_t_filter, w_t_search } from '../../ts/managers/Stores';
	import Close_Button from '../buttons/Close_Button.svelte';
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
	const right_widths = [9, 11.5];
	const hamburger_size = k.height.button;
	const hamburger_path = svgPaths.hamburgerPath(hamburger_size);
	const svg_style = 'top: -0.5px; left: -0.5px; position: absolute; width: 100%; height: 100%;';
	let width = layout.windowSize.width - 20;
	let rights: number[] = [];
	let lefts: number[] = [];
	layout_controls();

	// two states
	// 1. show OR hide the details button
	// 2. shows normal OR search controls
	// normal shows a separator and the breadcrumbs

	function togglePopupID(id) { $w_popupView_id = ($w_popupView_id == id) ? null : id; }
	function handle_recents_mouseClick(column: number) { grabs.focus_onNext(column == 1); }

	$: {
		const _ = $w_graph_rect + $w_count_resize;
		width = layout.windowSize.width - 20;
	}

	$: {
		const _ = $w_t_search;
		layout_controls();
	}

	function layout_controls() {
		const right_widths = [9, 11.5];
		const left_widths = {
			0: c.has_details_button ? 18 : -11,			// details
			1: $w_t_search == T_Search.clear ? 17 : c.has_details_button ? 11 : 14,	// recents / search
			2: 57,	// graph type
			3: 100,	// grow
			4: 26,	// shrink
			5: 20,	// easter egg
			6: 2,	// separator
			7: c.allow_Search ? 34 : 6,	// breadcrumbs
		};
		rights = u.cumulativeSum(right_widths);
		lefts = u.cumulativeSum(Object.values(left_widths));
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
				{#if $w_t_search != T_Search.clear && c.allow_Search}
					<Search
						left={lefts[1]}
						y_center={y_center}
						width={layout.windowSize.width - lefts[1] - 178}/>
					<Close_Button
						name='end-search'
						align_left={true}
						size={size_big + 1}
						stroke_width={0.25}
						origin={new Point(width - rights[1], -0.5)}
						closure={() => $w_t_search = T_Search.clear}/>
				{:else}
					<Next_Previous name='recents'
						size={28}
						height={size_big}
						has_title={false}
						has_seperator={false}
						has_gull_wings={false}
						origin={Point.x(lefts[1])}
						closure={handle_recents_mouseClick}/>
					{#key $w_show_graph_ofType}
						<Segmented name='graph-type'
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
					<Breadcrumbs
						left={lefts[6]}
						centered={true}
						width={layout.windowSize.width - lefts[7]}/>
					{#if c.allow_Search}
						<Button
							width={size_big}
							height={size_big}
							name={T_Control.search}
							center={new Point(width - rights[0], y_center)}
							s_button={ux.s_control_forType(T_Control.search)}
							closure={(s_mouse) => e.handle_s_mouseFor_t_control(s_mouse, T_Control.search)}>
							s
						</Button>
					{/if}
				{/if}
			{/if}
		</div>
	</Box>
{/key}
