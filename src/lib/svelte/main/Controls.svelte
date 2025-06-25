<script lang='ts'>
	import { c, h, k, p, u, ux, show, grabs, Point, colors, layout, svgPaths, signals, S_Element } from '../../ts/common/Global_Imports';
	import { T_Layer, T_Graph, T_Element, T_Control, T_Kinship, T_Request } from '../../ts/common/Global_Imports';
	import { w_background_color, w_device_isMobile, w_thing_fontFamily } from '../../ts/common/Stores';
	import { w_show_details, w_show_graph_ofType, w_show_tree_ofType } from '../../ts/common/Stores';
	import { w_graph_rect, w_count_resize, w_popupView_id } from '../../ts/common/Stores';
	import Identifiable from '../../ts/runtime/Identifiable';
	import Next_Previous from '../kit/Next_Previous.svelte';
	import Segmented from '../mouse/Segmented.svelte';
	import Button from '../buttons/Button.svelte';
	import SVG_D3 from '../kit/SVG_D3.svelte';
	import Box from '../kit/Box.svelte';
	import { onMount } from 'svelte';
	const widths = [18, 14, 56, 27, 64];
	const lefts = u.cumulativeSum(widths);
	const size_big = k.height.button + 4;
	const y_center = 10.5;
	const rights = [12, 67, 110, 140];
	const hamburger_size = k.height.button;
	const hamburger_path = svgPaths.hamburgerPath(hamburger_size);
	let es_control_byType: { [t_control: string]: S_Element } = {};
	let isVisible_forType: {[t_control: string]: boolean} = {};
	let width = layout.windowSize.width - 20;
	let displayName = k.empty;
	let displayName_width = 0;
	let displayName_x = 230;

	const t_controls = [	// in order of importance on mobile
		T_Control.details,
		T_Control.smaller,
		T_Control.bigger,
		T_Control.help,
		T_Control.builds,
	];

	onMount(() => { setup_forIDs(); });
	$: $w_count_resize, $w_graph_rect, width = layout.windowSize.width - 20;
	function togglePopupID(id) { $w_popupView_id = ($w_popupView_id == id) ? null : id; }
	function handle_recents_mouseClick(column: number) { grabs.focus_onNext(column == 1); }

	$: {
		const _ = $w_show_graph_ofType;
		const db = h.db;
		if (!!db) {
			const extra = ux.inTreeMode ? lefts[3] : 0;
			displayName = db.displayName;
			displayName_width = u.getWidthOf(displayName);
			displayName_x = extra + (width - displayName_width) / 2 + 11;
		}
	}

	function setup_forIDs() {
		let total = layout.windowSize.width + 50;
		for (const t_control of t_controls) {
			total -= u.getWidthOf(t_control);
			const hover_color = t_control == T_Control.details ? 'white' : colors.default;
			const es_control = ux.s_element_for(new Identifiable(t_control), T_Element.control, t_control);
			es_control.ignore_hover = t_control == T_Control.details;
			es_control.isDisabled = T_Control.details == t_control;
			es_control.set_forHovering(hover_color, 'pointer');
			es_control_byType[t_control] = es_control;
			isVisible_forType[t_control] = total > 0;
		}
	}

	function handle_s_mouse_forControl_Type(s_mouse, t_control) {
		if (s_mouse.isHover) {
			es_control_byType[t_control].isOut = s_mouse.isOut;
		} else if (s_mouse.isUp) {
			switch (t_control) {
				case T_Control.help: c.showHelp(); break;
				case T_Control.details: $w_show_details = !$w_show_details; break;
				case T_Control.bigger: width = layout.scaleBy(k.ratio.zoom_in) - 20; break;	// mobile only
				case T_Control.smaller: width = layout.scaleBy(k.ratio.zoom_out) - 20; break;	//   '     '
				default: togglePopupID(t_control); break;
			}
		}
	}
	
	function handle_mode_selection(name: string, types: string[]) {
		switch (name) {
			case 'graph': w_show_graph_ofType.set(types[0] as T_Graph); break;
			case 'tree': layout.set_tree_types(types as Array<T_Kinship>); break;
		}
	}
							// <img src='settings.svg' alt='circular button' width={hamburger_size}px height={hamburger_size}px/>

</script>

{#if Object.values(es_control_byType).length > 0}
	{#key width}
		<Box
			name='controls-box'
			color={colors.separator}
			width={layout.windowSize.width}
			height={layout.panel_boxHeight + 2}
			thickness={k.thickness.separator.thick}
			corner_radius={k.radius.gull_wings.thick}>
			<div
				class='controls'
				style='
					left: 6px;
					top: 9.5px;
					position: absolute;
					height: {size_big}px;
					z-index: {T_Layer.frontmost};
					width: {layout.windowSize.width - 20}px;'>
				{#if !$w_popupView_id}
					{#key $w_background_color}
						<Button
							border_thickness=0
							color='transparent'
							name='details-toggle'
							center={new Point(lefts[0], y_center)}
							es_button={es_control_byType[T_Control.details]}
							closure={(s_mouse) => handle_s_mouse_forControl_Type(s_mouse, T_Control.details)}>
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
									fill={es_control_byType[T_Control.details].isOut ? 'black' : 'white'}
									stroke={es_control_byType[T_Control.details].isOut ? 'transparent' : 'darkgray'}/>
							</svg>
						</Button>
					{/key}
					{#if true}
					<Next_Previous
						size={28}
						name='recents'
						height={size_big}
						has_title={false}
						has_seperator={false}
						has_gull_wings={false}
						origin={Point.x(lefts[1])}
						closure={handle_recents_mouseClick}/>
					{/if}
					{#key $w_show_graph_ofType}
						<Segmented
							width={80}
							name='graph'
							origin={Point.x(lefts[2])}
							selected={[$w_show_graph_ofType]}
							titles={[T_Graph.tree, T_Graph.radial]}
							handle_selection={(titles) => handle_mode_selection('graph', titles)}/>
						{#if ux.inTreeMode}
							{#key $w_show_tree_ofType}
								<Segmented
									width={180}
									name='tree'
									allow_multiple={true}
									origin={Point.x(lefts[4])}
									selected={$w_show_tree_ofType}
									titles={[T_Kinship.child, T_Kinship.parent, T_Kinship.related, T_Kinship.tags]}
									handle_selection={(titles) => layout.handle_mode_selection('tree', titles)}/>
							{/key}
						{/if}
					{/key}
					{#key displayName}
						<div style='
							width:{displayName_width + 20}px;
							left:{displayName_x}px;
							position:absolute;
							top:1px;'>
							{displayName}
						</div>
					{/key}
					<Button name={T_Control.help}
						width={size_big}
						height={size_big}
						center={new Point(width - rights[0], y_center)}
						es_button={es_control_byType[T_Control.help]}
						closure={(s_mouse) => handle_s_mouse_forControl_Type(s_mouse, T_Control.help)}>
						<span
							style='top:2px;
								left:5.5px;
								position:absolute;'>
							?
						</span>
					</Button>
				{/if}
				{#key $w_device_isMobile}
					{#if $w_device_isMobile}
						{#if isVisible_forType[T_Control.smaller]}
							<Button
								width={size_big}
								height={size_big}
								name={T_Control.smaller}
								center={new Point(width - rights[2], y_center)}
								es_button={es_control_byType[T_Control.smaller]}
								closure={(s_mouse) => handle_s_mouse_forControl_Type(s_mouse, T_Control.smaller)}>
								<svg
									id='shrink-svg'>
									<path
										stroke=colors.default
										fill=transparent
										id='shrink-path'
										d={svgPaths.dash(size_big, 2)}/>
								</svg>
							</Button>
						{/if}
						{#if isVisible_forType[T_Control.bigger]}
							<Button
								width={size_big}
								height={size_big}
								name={T_Control.bigger}
								center={new Point(width - rights[3], y_center)}
								es_button={es_control_byType[T_Control.bigger]}
								closure={(s_mouse) => handle_s_mouse_forControl_Type(s_mouse, T_Control.bigger)}>
								<svg
									id='enlarge-svg'>
									<path
										stroke=colors.default
										fill=transparent
										id='enlarge-path'
										d={svgPaths.t_cross(size_big, 2)}/>
								</svg>
							</Button>
						{/if}
					{/if}
				{/key}
				{#key $w_background_color}
					<Button name={T_Control.builds}
						width=75
						height={size_big}
						center={new Point(width - rights[1], y_center)}
						es_button={es_control_byType[T_Control.builds]}
						closure={(s_mouse) => handle_s_mouse_forControl_Type(s_mouse, T_Control.builds)}>
						<span style='font-family: {$w_thing_fontFamily};'>
							{'build ' + k.build_number}
						</span>
					</Button>
				{/key}
			</div>
		</Box>
	{/key}
{/if}