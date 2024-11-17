<script lang='ts'>
	import { g, k, u, ux, w, show, Point, ZIndex, onMount, signals, svgPaths } from '../../ts/common/Global_Imports';
	import { s_show_details, s_id_popupView, s_graph_type, s_resize_count } from '../../ts/state/Svelte_Stores';
	import { s_tree_type, s_device_isMobile, s_thing_fontFamily } from '../../ts/state/Svelte_Stores';
	import { IDButton, Graph_Type, ElementType, Element_State } from '../../ts/common/Global_Imports';
	import { persistLocal, IDPersistent, Tree_Type } from '../../ts/common/Global_Imports';
	import Identifiable from '../../ts/basis/Identifiable';
	import Segmented from '../mouse/Segmented.svelte';
	import Button from '../mouse/Button.svelte';
	import SVGD3 from '../kit/SVGD3.svelte';
	const size_small = k.default_buttonSize;
	const details_top = k.dot_size / 2;
	const y_center = details_top + 3.5;
	const size_big = size_small + 4;
	const lefts = [10, 55, 117];
	const resize_viewBox = `0, 0, ${size_big}, ${size_big}`;
	let element_states_byID: { [id: string]: Element_State } = {};
	let elementShown_byID: {[key: string]: boolean} = {};
	let width = w.windowSize.width - 20;

	const ids = [	// in order of importance on mobile
		IDButton.details,
		IDButton.smaller,
		IDButton.bigger,
		IDButton.help,
		IDButton.builds,
	];

	onMount(() => { setup_forIDs(); });
	function togglePopupID(id) { $s_id_popupView = ($s_id_popupView == id) ? null : id; }

	$: {
		const _ = $s_resize_count;
		width = w.windowSize.width - 20;
	}

	function setup_forIDs() {
		let total = w.windowSize.width + 50;
		for (const id of ids) {
			total -= u.getWidthOf(id);
			const element_state = ux.element_state_for(new Identifiable(id), ElementType.control, id);
			element_state.set_forHovering(k.color_default, 'pointer');
			element_state.hoverIgnore = id == IDButton.details;
			element_states_byID[id] = element_state;
			elementShown_byID[id] = total > 0;
		}
	}

	function next_graph_relations() {
		switch ($s_tree_type) {
			case Tree_Type.parents:  return Tree_Type.related;
			case Tree_Type.children: return Tree_Type.parents;
			default:				 return Tree_Type.children;
		}
	}

	function button_closure_forID(mouse_state, id) {
		if (mouse_state.isHover) {
			element_states_byID[id].isOut = mouse_state.isOut;
		} else if (mouse_state.isUp) {
			switch (id) {
				case IDButton.help: g.showHelp(); break;
				case IDButton.details: $s_show_details = !$s_show_details; break;
				case IDButton.bigger: width = w.zoomBy(k.zoom_in_ratio) - 20; break;	// mobile only
				case IDButton.smaller: width = w.zoomBy(k.zoom_out_ratio) - 20; break;	//   "     "
				default: togglePopupID(id); break;
			}
		}
	}

	function selection_closure(name: string, types: Array<string>) {
		const type = types[0];	// only ever has one element
		switch (name) {
			case 'relations': $s_tree_type	= type as Tree_Type; break;
			case 'graph':	  $s_graph_type = type as Graph_Type; break;
		}
	}

</script>

{#if Object.values(element_states_byID).length > 0}
	<div id='controls'
		style='
			top: 7px;
			left: 0px;
			position: absolute;
			z-index: {ZIndex.frontmost};
			height: `${k.height_banner - 2}px`;'>
		{#if !$s_id_popupView}
			<Button
				name='hamburger'
				border_thickness=0
				color='transparent'
				center={new Point(lefts[0], details_top + 3)}
				element_state={element_states_byID[IDButton.details]}
				closure={(mouse_state) => button_closure_forID(mouse_state, IDButton.details)}>
				<img src='settings.svg' alt='circular button' width={size_small}px height={size_small}px/>
			</Button>
			{#key $s_graph_type}
				<Segmented
					name='graph'
					origin={Point.x(30)}
					selected={[$s_graph_type]}
					titles={[Graph_Type.tree, Graph_Type.rings]}
					selection_closure={(titles) => selection_closure('graph', titles)}/>
				{#if $s_graph_type == Graph_Type.tree}
					{#key $s_tree_type}
						<Segmented
							name='tree'
							origin={Point.x(112)}
							selected={[$s_tree_type]}
							titles={[Tree_Type.children, Tree_Type.parents, Tree_Type.related]}
							selection_closure={(titles) => selection_closure('relations', titles)}/>
					{/key}
				{/if}
			{/key}
		{/if}
		{#key $s_device_isMobile}
			{#if $s_device_isMobile}
				{#if elementShown_byID[IDButton.smaller]}
					<Button
						width={size_big}
						height={size_big}
						name={IDButton.smaller}
						element_state={element_states_byID[IDButton.smaller]}
						center={new Point(width - 140, y_center)}
						closure={(mouse_state) => button_closure_forID(mouse_state, IDButton.smaller)}>
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
				{#if elementShown_byID[IDButton.bigger]}
					<Button
						width={size_big}
						height={size_big}
						name={IDButton.bigger}
						center={new Point(width - 110, y_center)}
						element_state={element_states_byID[IDButton.bigger]}
						closure={(mouse_state) => button_closure_forID(mouse_state, IDButton.bigger)}>
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
		{#if elementShown_byID[IDButton.builds]}
			<Button name={IDButton.builds}
				width=75
				height={size_big}
				center={new Point(width - 55, y_center)}
				element_state={element_states_byID[IDButton.builds]}
				closure={(mouse_state) => button_closure_forID(mouse_state, IDButton.builds)}>
				<span style='font-family: {$s_thing_fontFamily};'>
					{'build ' + k.build_number}
				</span>
			</Button>
		{/if}
		{#if elementShown_byID[IDButton.help]}
			<Button name={IDButton.help}
				width={size_big}
				height={size_big}
				center={new Point(width, y_center)}
				element_state={element_states_byID[IDButton.help]}
				closure={(mouse_state) => button_closure_forID(mouse_state, IDButton.help)}>
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