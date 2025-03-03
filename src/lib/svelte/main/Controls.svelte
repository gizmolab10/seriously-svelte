<script lang='ts'>
	import { T_Layer, T_Graph, T_Element, T_Control, T_Hierarchy, T_Preference } from '../../ts/common/Global_Imports';
	import { g, k, p, u, ux, w, show, Point, svgPaths, signals, S_Element } from '../../ts/common/Global_Imports';
	import { w_t_graph, w_t_tree, w_count_resize, w_hierarchy, w_id_popupView } from '../../ts/managers/Stores';
	import { w_show_details, w_device_isMobile, w_thing_fontFamily } from '../../ts/managers/Stores';
	import Identifiable from '../../ts/data/runtime/Identifiable';
	import Segmented from '../mouse/Segmented.svelte';
	import Button from '../mouse/Button.svelte';
	import SVGD3 from '../kit/SVGD3.svelte';
	import { onMount } from 'svelte';
	const size_small = k.default_buttonSize;
	const details_top = k.dot_size / 2;
	const y_center = details_top + 3.5;
	const size_big = size_small + 4;
	const lefts = [10, 55, 117];
	const resize_viewBox = `0, 0, ${size_big}, ${size_big}`;
	let s_elements_byControlType: { [t_control: string]: S_Element } = {};
	let elementShown_byControlType: {[t_control: string]: boolean} = {};
	let width = w.windowSize.width - 20;
	let displayName = k.empty;
	let displayName_width = 0;
	let displayName_x = 200;

	const t_controls = [	// in order of importance on mobile
		T_Control.details,
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
		const h = $w_hierarchy;
		displayName = h.db.displayName
		displayName_width = u.getWidthOf(displayName);
		displayName_x = (width - displayName_width) / 2;
	}

	function setup_forIDs() {
		let total = w.windowSize.width + 50;
		for (const t_control of t_controls) {
			total -= u.getWidthOf(t_control);
			const s_element = ux.s_element_for(new Identifiable(t_control), T_Element.control, t_control);
			s_element.set_forHovering(k.color_default, 'pointer');
			s_element.hoverIgnore = (t_control == T_Control.details);
			s_elements_byControlType[t_control] = s_element;
			elementShown_byControlType[t_control] = total > 0;
		}
	}

	function next_graph_relations() {
		switch ($w_t_tree) {
			case T_Hierarchy.parents:  return T_Hierarchy.related;
			case T_Hierarchy.children: return T_Hierarchy.parents;
			default:				 return T_Hierarchy.children;
		}
	}

	function handle_mouse_state_forControl_Type(s_mouse, t_control) {
		if (s_mouse.isHover) {
			s_elements_byControlType[t_control].isOut = s_mouse.isOut;
		} else if (s_mouse.isUp) {
			switch (t_control) {
				case T_Control.help: g.showHelp(); break;
				case T_Control.details: $w_show_details = !$w_show_details; break;
				case T_Control.bigger: width = w.zoomBy(k.zoom_in_ratio) - 20; break;	// mobile only
				case T_Control.smaller: width = w.zoomBy(k.zoom_out_ratio) - 20; break;	//   "     "
				default: togglePopupID(t_control); break;
			}
		}
	}

	function selection_closure(name: string, types: Array<string>) {
		const type = types[0];	// only ever has one element
		switch (name) {
			case 'graph':	  $w_t_graph = type as T_Graph;	break;
			case 'relations': $w_t_tree	 = type as T_Hierarchy;	break;
		}
	}

</script>

{#if Object.values(s_elements_byControlType).length > 0}
	<div id='controls'
		style='
			top: 7px;
			left: 0px;
			position: absolute;
			z-index: {T_Layer.frontmost};
			height: `${k.height_banner - 2}px`;'>
		{#if !$w_id_popupView}
			<Button
				name='details-toggle'
				border_thickness=0
				color='transparent'
				center={new Point(lefts[0], details_top + 3)}
				s_element={s_elements_byControlType[T_Control.details]}
				closure={(s_mouse) => handle_mouse_state_forControl_Type(s_mouse, T_Control.details)}>
				<img src='settings.svg' alt='circular button' width={size_small}px height={size_small}px/>
			</Button>
			{#key $w_t_graph}
				<Segmented
					name='graph-type-selector'
					origin={Point.x(30)}
					selected={[$w_t_graph]}
					titles={[T_Graph.tree, T_Graph.radial]}
					selection_closure={(titles) => selection_closure('graph', titles)}/>
				{#if !g.inRadialMode && show.t_trees}
					{#key $w_t_tree}
						<Segmented
							name='tree'
							origin={Point.x(114)}
							selected={[$w_t_tree]}
							titles={[T_Hierarchy.children, T_Hierarchy.parents, T_Hierarchy.related]}
							selection_closure={(titles) => selection_closure('relations', titles)}/>
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
						name={T_Control.smaller}
						center={new Point(width - 110, y_center)}
						s_element={s_elements_byControlType[T_Control.smaller]}
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
						name={T_Control.bigger}
						center={new Point(width - 140, y_center)}
						s_element={s_elements_byControlType[T_Control.bigger]}
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
		{#if elementShown_byControlType[T_Control.builds]}
			<Button name={T_Control.builds}
				width=75
				height={size_big}
				center={new Point(width - 55, y_center)}
				s_element={s_elements_byControlType[T_Control.builds]}
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
				center={new Point(width, y_center)}
				s_element={s_elements_byControlType[T_Control.help]}
				closure={(s_mouse) => handle_mouse_state_forControl_Type(s_mouse, T_Control.help)}>
				<span
					style='top:2px;
						left:5.5px;
						position:absolute;'>
					?
				</span>
			</Button>
		{/if}
	</div>
{/if}