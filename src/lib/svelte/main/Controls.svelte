<script lang='ts'>
	import { c, h, k, p, u, ux, show, grabs, Point, colors, layout, svgPaths, signals, S_Element } from '../../ts/common/Global_Imports';
	import { T_Layer, T_Graph, T_Element, T_Control, T_Kinship, T_Request } from '../../ts/common/Global_Imports';
	import { w_background_color, w_device_isMobile, w_thing_fontFamily } from '../../ts/common/Stores';
	import { w_show_details, w_show_graph_ofType, w_show_tree_ofType } from '../../ts/common/Stores';
	import { w_graph_rect, w_count_resize, w_popupView_id } from '../../ts/common/Stores';
	import Next_Previous from '../mouse/Next_Previous.svelte';
	import Identifiable from '../../ts/runtime/Identifiable';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../mouse/Separator.svelte';
	import Breadcrumbs from './Breadcrumbs.svelte';
	import Button from '../buttons/Button.svelte';
	import Box from '../mouse/Box.svelte';
	const widths = [c.has_full_UI ? 18 : -11, 17, 57, 90, 11, 26, 22];
	const lefts = u.cumulativeSum(widths);
	const size_big = k.height.button + 4;
	const y_center = 10.5;
	const hamburger_size = k.height.button;
	const hamburger_path = svgPaths.hamburgerPath(hamburger_size);
	const svg_style = 'top: -0.5px; left: -0.5px; position: absolute; width: 100%; height: 100%;';
	let width = layout.windowSize.width - 20;

	function togglePopupID(id) { $w_popupView_id = ($w_popupView_id == id) ? null : id; }
	function handle_recents_mouseClick(column: number) { grabs.focus_onNext(column == 1); }

	$: {
		const _ = $w_graph_rect + $w_count_resize;
		width = layout.windowSize.width - 20;
	}
	
</script>

{#key width, $w_background_color}
	<Box
		name='controls-box'
		color={colors.separator}
		width={layout.windowSize.width}
		height={layout.controls_boxHeight + 2}
		thickness={k.thickness.separator.main}
		corner_radius={k.radius.gull_wings.thick}>
		<div
			class='controls'
			style='
				left: 6px;
				top: 11.5px;
				position: absolute;
				height: {size_big}px;
				z-index: {T_Layer.frontmost};
				width: {layout.windowSize.width - 20}px;'>
			{#if !$w_popupView_id}
				<Separator
					isHorizontal={false}
					name='before-breadcrumbs'
					origin={new Point(lefts[6], -9)}
					length={layout.controls_boxHeight + 3}
					thickness={k.thickness.separator.main}
					corner_radius={k.radius.gull_wings.thick}/>
				<Breadcrumbs
					left={lefts[6]}
					centered={true}
					width={layout.windowSize.width - lefts[6] - 10}/>
				{#if !c.has_full_UI}
					<Button
						width={20}
						height={30}
						color='transparent'
						name='invisible-button'
						zindex={T_Layer.frontmost}
						center={new Point(lefts[6], 10)}
						style='border: none; background: none;'
						es_button={ux.s_control_forType(T_Control.details)}
						closure={(s_mouse) => ux.handle_s_mouse_forControl_Type(s_mouse, T_Control.details)}/>
				{:else}
					<Button
						border_thickness=0
						color='transparent'
						name='details-toggle'
						center={new Point(lefts[0], y_center)}
						es_button={ux.s_control_forType(T_Control.details)}
						closure={(s_mouse) => ux.handle_s_mouse_forControl_Type(s_mouse, T_Control.details)}>
						<svg
							class='hamburger-svg'
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
				<Next_Previous
					size={28}
					name='recents'
					height={size_big}
					has_title={false}
					has_seperator={false}
					has_gull_wings={false}
					origin={Point.x(lefts[1])}
					closure={handle_recents_mouseClick}/>
				{#key $w_show_graph_ofType}
					<Segmented
						width={80}
						name='graph'
						origin={Point.x(lefts[2])}
						selected={[$w_show_graph_ofType]}
						titles={[T_Graph.tree, T_Graph.radial]}
						handle_selection={(titles) => layout.handle_mode_selection('graph', titles)}/>
				{/key}
				<div class='size-controls'>
					<Button
						width={size_big}
						height={size_big}
						name={T_Control.grow}
						center={new Point(lefts[4], y_center)}
						es_button={ux.s_control_forType(T_Control.grow)}
						closure={(s_mouse) => ux.handle_s_mouse_forControl_Type(s_mouse, T_Control.grow)}>
						<svg id='grow-svg' style={svg_style}>
							<path
								id='grow-path'
								fill=transparent
								stroke-width='1'
								d={svgPaths.t_cross(size_big, 2)}
								stroke={ux.s_control_forType(T_Control.grow).svg_hover_color}/>
						</svg>
					</Button>
					<Button
						width={size_big}
						height={size_big}
						name={T_Control.shrink}
						center={new Point(lefts[5], y_center)}
						es_button={ux.s_control_forType(T_Control.shrink)}
						closure={(s_mouse) => ux.handle_s_mouse_forControl_Type(s_mouse, T_Control.shrink)}>
						<svg id='shrink-svg' style={svg_style}>
							<path
								id='shrink-path'
								fill=transparent
								stroke-width='1'
								d={svgPaths.dash(size_big, 4)}
								stroke={ux.s_control_forType(T_Control.shrink).svg_hover_color}/>
						</svg>
					</Button>
				</div>
			{/if}
		</div>
	</Box>
{/key}
