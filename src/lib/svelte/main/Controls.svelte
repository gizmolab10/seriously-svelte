<script lang='ts'>
	import { s_t_graph, s_t_tree, s_count_resize, s_device_isMobile } from '../../ts/state/S_Stores';
	import { T_Control, preferences, S_Element, T_Preference } from '../../ts/common/Global_Imports';
	import { s_details_show, s_id_popupView, s_thing_fontFamily } from '../../ts/state/S_Stores';
	import { g, k, u, ux, w, show, Point, T_Layer, signals } from '../../ts/common/Global_Imports';
	import { svgPaths, T_Tree, T_Graph, T_Element } from '../../ts/common/Global_Imports';
	import Identifiable from '../../ts/data/basis/Identifiable';
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
	let s_elements_byID: { [id: string]: S_Element } = {};
	let elementShown_byID: {[key: string]: boolean} = {};
	let width = w.windowSize.width - 20;

	const ids = [	// in order of importance on mobile
		T_Control.details,
		T_Control.smaller,
		T_Control.bigger,
		T_Control.help,
		T_Control.builds,
	];

	onMount(() => { setup_forIDs(); });
	function togglePopupID(id) { $s_id_popupView = ($s_id_popupView == id) ? null : id; }

	$: {
		const _ = $s_count_resize;
		width = w.windowSize.width - 20;
	}

	function setup_forIDs() {
		let total = w.windowSize.width + 50;
		for (const id of ids) {
			total -= u.getWidthOf(id);
			const s_element = ux.s_element_for(new Identifiable(id), T_Element.control, id);
			s_element.set_forHovering(k.color_default, 'pointer');
			s_element.hoverIgnore = id == T_Control.details;
			s_elements_byID[id] = s_element;
			elementShown_byID[id] = total > 0;
		}
	}

	function next_graph_relations() {
		switch ($s_t_tree) {
			case T_Tree.parents:  return T_Tree.related;
			case T_Tree.children: return T_Tree.parents;
			default:				 return T_Tree.children;
		}
	}

	function button_closure_forID(mouse_state, idControl) {
		if (mouse_state.isHover) {
			s_elements_byID[idControl].isOut = mouse_state.isOut;
		} else if (mouse_state.isUp) {
			switch (idControl) {
				case T_Control.help: g.showHelp(); break;
				case T_Control.details: $s_details_show = !$s_details_show; break;
				case T_Control.bigger: width = w.zoomBy(k.zoom_in_ratio) - 20; break;	// mobile only
				case T_Control.smaller: width = w.zoomBy(k.zoom_out_ratio) - 20; break;	//   "     "
				default: togglePopupID(idControl); break;
			}
		}
	}

	function selection_closure(name: string, types: Array<string>) {
		const type = types[0];	// only ever has one element
		switch (name) {
			case 'graph':	  $s_t_graph = type as T_Graph;	break;
			case 'relations': $s_t_tree	 = type as T_Tree;	break;
		}
	}

</script>

{#if Object.values(s_elements_byID).length > 0}
	<div id='controls'
		style='
			top: 7px;
			left: 0px;
			position: absolute;
			z-index: {T_Layer.frontmost};
			height: `${k.height_banner - 2}px`;'>
		{#if !$s_id_popupView}
			<Button
				name='hamburger'
				border_thickness=0
				color='transparent'
				center={new Point(lefts[0], details_top + 3)}
				s_element={s_elements_byID[T_Control.details]}
				closure={(mouse_state) => button_closure_forID(mouse_state, T_Control.details)}>
				<img src='settings.svg' alt='circular button' width={size_small}px height={size_small}px/>
			</Button>
			{#key $s_t_graph}
				<Segmented
					name='graph'
					origin={Point.x(30)}
					selected={[$s_t_graph]}
					titles={[T_Graph.tree, T_Graph.radial]}
					selection_closure={(titles) => selection_closure('graph', titles)}/>
				{#if !g.inRadialMode && show.t_trees}
					{#key $s_t_tree}
						<Segmented
							name='tree'
							origin={Point.x(114)}
							selected={[$s_t_tree]}
							titles={[T_Tree.children, T_Tree.parents, T_Tree.related]}
							selection_closure={(titles) => selection_closure('relations', titles)}/>
					{/key}
				{/if}
			{/key}
		{/if}
		{#key $s_device_isMobile}
			{#if $s_device_isMobile}
				{#if elementShown_byID[T_Control.smaller]}
					<Button
						width={size_big}
						height={size_big}
						name={T_Control.smaller}
						center={new Point(width - 110, y_center)}
						s_element={s_elements_byID[T_Control.smaller]}
						closure={(mouse_state) => button_closure_forID(mouse_state, T_Control.smaller)}>
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
				{#if elementShown_byID[T_Control.bigger]}
					<Button
						width={size_big}
						height={size_big}
						name={T_Control.bigger}
						center={new Point(width - 140, y_center)}
						s_element={s_elements_byID[T_Control.bigger]}
						closure={(mouse_state) => button_closure_forID(mouse_state, T_Control.bigger)}>
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
		{#if elementShown_byID[T_Control.builds]}
			<Button name={T_Control.builds}
				width=75
				height={size_big}
				center={new Point(width - 55, y_center)}
				s_element={s_elements_byID[T_Control.builds]}
				closure={(mouse_state) => button_closure_forID(mouse_state, T_Control.builds)}>
				<span style='font-family: {$s_thing_fontFamily};'>
					{'build ' + k.build_number}
				</span>
			</Button>
		{/if}
		{#if elementShown_byID[T_Control.help]}
			<Button name={T_Control.help}
				width={size_big}
				height={size_big}
				center={new Point(width, y_center)}
				s_element={s_elements_byID[T_Control.help]}
				closure={(mouse_state) => button_closure_forID(mouse_state, T_Control.help)}>
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