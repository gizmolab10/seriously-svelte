<script lang='ts'>
	import { c, k, p, u, ux, w, show, Point, layouts, svgPaths, signals, S_Element } from '../../ts/common/Global_Imports';
	import { T_Layer, T_Graph, T_Banner, T_Element, T_Control, T_Hierarchy, T_Preference } from '../../ts/common/Global_Imports';
	import { w_show_details, w_show_related, w_device_isMobile, w_thing_fontFamily } from '../../ts/common/Stores';
	import { w_t_graph, w_t_tree, w_count_resize, w_hierarchy, w_id_popupView } from '../../ts/common/Stores';
	import Identifiable from '../../ts/data/runtime/Identifiable';
	import { w_background_color } from '../../ts/common/Stores';
	import Segmented from '../mouse/Segmented.svelte';
	import Button from '../mouse/Button.svelte';
	import SVGD3 from '../kit/SVGD3.svelte';
	import { onMount } from 'svelte';
	const size_small = k.default_buttonSize;
	const details_top = k.dot_size / 2;
	const y_center = details_top + 3.5;
	const size_big = size_small + 4;
	const lefts = [10, 55, 117, 278];
	const resize_viewBox = `0, 0, ${size_big}, ${size_big}`;
	let elementShown_byControlType: {[t_control: string]: boolean} = {};
	let es_control_byType: { [t_control: string]: S_Element } = {};
	let related_prefix = $w_show_related ? 'hide' : 'show'
	let width = w.windowSize.width - 20;
	let displayName = k.empty;
	let displayName_width = 0;
	let displayName_x = 220;

	const t_controls = [	// in order of importance on mobile
		T_Control.details,
		T_Control.related,
		T_Control.smaller,
		T_Control.bigger,
		T_Control.help,
		T_Control.builds,
	];

	onMount(() => { setup_forIDs(); });
	function togglePopupID(id) { $w_id_popupView = ($w_id_popupView == id) ? null : id; }

	$: {
		const _ = $w_count_resize;
		width = w.windowSize.width - 20;
	}

	$: {
		const show_related = $w_show_related;
		related_prefix = show_related ? 'hide' : 'show'
		const es_related = es_control_byType[T_Control.related];
		if (es_related) {
			es_related.isSelected = show_related;
		}
	}

	$: {
		const _ = $w_t_graph;
		const h = $w_hierarchy;
		const needsExtra = layouts.inTreeMode;
		const extra = needsExtra ? 110 : 0;
		displayName = h.db.displayName;
		displayName_width = u.getWidthOf(displayName);
		displayName_x = extra + (width - displayName_width) / 2;
	}

	function selection_closure(name: string, types: Array<string>) {
		layouts.handle_mode_selection
	}

	function setup_forIDs() {
		let total = w.windowSize.width + 50;
		for (const t_control of t_controls) {
			total -= u.getWidthOf(t_control);
			const es_control = ux.s_element_for(new Identifiable(t_control), T_Element.control, t_control);
			es_control.hoverIgnore = [T_Control.details, T_Control.related].includes(t_control);
			es_control.isSelected = (t_control == T_Control.related) && $w_show_related;
			es_control.set_forHovering(k.color_default, 'pointer');
			elementShown_byControlType[t_control] = total > 0;
			es_control_byType[t_control] = es_control;
		}
	}

	function handle_mouse_state_forControl_Type(s_mouse, t_control) {
		if (s_mouse.isHover) {
			es_control_byType[t_control].isOut = s_mouse.isOut;
		} else if (s_mouse.isUp) {
			switch (t_control) {
				case T_Control.help: c.showHelp(); break;
				case T_Control.details: $w_show_details = !$w_show_details; break;
				case T_Control.related: $w_show_related = !$w_show_related; break;
				case T_Control.bigger: width = w.zoomBy(k.zoom_in_ratio) - 20; break;	// mobile only
				case T_Control.smaller: width = w.zoomBy(k.zoom_out_ratio) - 20; break;	//   "     "
				default: togglePopupID(t_control); break;
			}
		}
	}

</script>

{#if Object.values(es_control_byType).length > 0}
	<div id='controls'
		style='
			top: 0px;
			left: 0px;
			position: absolute;
			z-index: {T_Layer.frontmost};
			height: `${layouts.height_ofBannerAt(T_Banner.controls) - 2}px`;'>
		{#if !$w_id_popupView}
			{#key $w_background_color}
				<Button
					name='details-toggle'
					border_thickness=0
					color='transparent'
					center={new Point(lefts[0], details_top + 3)}
					es_button={es_control_byType[T_Control.details]}
					closure={(s_mouse) => handle_mouse_state_forControl_Type(s_mouse, T_Control.details)}>
					<img src='settings.svg' alt='circular button' width={size_small}px height={size_small}px/>
				</Button>
			{/key}
			{#key $w_t_graph}
				<Segmented
					name='graph-type-selector'
					origin={Point.x(30)}
					selected={[$w_t_graph]}
					titles={[T_Graph.tree, T_Graph.radial]}
					selection_closure={(titles) => layouts.handle_mode_selection('graph', titles)}/>
				{#if layouts.inTreeMode}
					{#key $w_t_tree}
						<Segmented
							name='tree'
							origin={Point.x(114)}
							selected={[$w_t_tree]}
							titles={[T_Hierarchy.children, T_Hierarchy.parents]}
							selection_closure={(titles) => layouts.handle_mode_selection('tree', titles)}/>
						{#key $w_show_related}
							<Button
								width=82
								isToggle={true}
								height={size_big}
								name='show-related'
								color='transparent'
								border_thickness=0.5
								center={new Point(lefts[3], details_top + 3.5)}
								es_button={es_control_byType[T_Control.related]}
								closure={(s_mouse) => handle_mouse_state_forControl_Type(s_mouse, T_Control.related)}>
								<span style='font-family: {$w_thing_fontFamily};'>
									{related_prefix} related
								</span>
							</Button>
						{/key}
					{/key}
				{/if}
			{/key}
			{#key displayName}
				<div style='
					width:{displayName_width + 20}px;
					left:{displayName_x}px;
					position:absolute;'>
					{displayName}
				</div>
			{/key}
		{/if}
		{#key $w_device_isMobile}
			{#if $w_device_isMobile}
				{#if elementShown_byControlType[T_Control.smaller]}
					<Button
						width={size_big}
						height={size_big}
						border_thickness=0.5
						name={T_Control.smaller}
						center={new Point(width - 110, y_center)}
						es_button={es_control_byType[T_Control.smaller]}
						closure={(s_mouse) => handle_mouse_state_forControl_Type(s_mouse, T_Control.smaller)}>
						<svg
							id='shrink-svg'>
							<path
								stroke=k.color_default
								fill=transparent
								id='shrink-path'
								d={svgPaths.dash(size_big, 2)}/>
						</svg>
					</Button>
				{/if}
				{#if elementShown_byControlType[T_Control.bigger]}
					<Button
						width={size_big}
						height={size_big}
						border_thickness=0.5
						name={T_Control.bigger}
						center={new Point(width - 140, y_center)}
						es_button={es_control_byType[T_Control.bigger]}
						closure={(s_mouse) => handle_mouse_state_forControl_Type(s_mouse, T_Control.bigger)}>
						<svg
							id='enlarge-svg'>
							<path
								stroke=k.color_default
								fill=transparent
								id='enlarge-path'
								d={svgPaths.t_cross(size_big, 2)}/>
						</svg>
					</Button>
				{/if}
			{/if}
		{/key}
		{#key $w_background_color}
			{#if elementShown_byControlType[T_Control.builds]}
				<Button name={T_Control.builds}
					width=75
					height={size_big}
					border_thickness=0.5
					center={new Point(width - 55, y_center)}
					es_button={es_control_byType[T_Control.builds]}
					closure={(s_mouse) => handle_mouse_state_forControl_Type(s_mouse, T_Control.builds)}>
					<span style='font-family: {$w_thing_fontFamily};'>
						{'build ' + k.build_number}
					</span>
				</Button>
			{/if}
			{#if elementShown_byControlType[T_Control.help]}
				<Button name={T_Control.help}
					width={size_big}
					height={size_big}
					border_thickness=0.5
					center={new Point(width, y_center)}
					es_button={es_control_byType[T_Control.help]}
					closure={(s_mouse) => handle_mouse_state_forControl_Type(s_mouse, T_Control.help)}>
					<span
						style='top:2px;
							left:5.5px;
							position:absolute;'>
						?
					</span>
				</Button>
			{/if}
		{/key}
	</div>
{/if}