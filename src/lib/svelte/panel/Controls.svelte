<script lang='ts'>
	import { s_show_details, s_id_popupView, s_resize_count, s_cluster_mode, s_shown_relations } from '../../ts/state/Reactive_State';
	import { g, k, s, u, Point, ZIndex, onMount, signals, svgPaths, IDButton, IDPersistant } from '../../ts/common/Global_Imports';
	import { ElementType, Element_State, persistLocal, GraphRelations } from '../../ts/common/Global_Imports';
	import Identifiable from '../../ts/data/Identifiable';
	import Button from '../mouse buttons/Button.svelte';
	import SVGD3 from '../kit/SVGD3.svelte';
	const details_top = k.dot_size / 2;
	const top = (k.dot_size + 3) / 2;
	const lefts = [10, 65, 137];
	let size = k.default_buttonSize;
	let width = g.windowSize.width - 20;
	let elementStates_byID: { [id: string]: Element_State } = {};

	function togglePopupID(id) { $s_id_popupView = ($s_id_popupView == id) ? null : id; }
	
	onMount(() => {
		const ids = [IDButton.details, IDButton.relations, IDButton.layout, IDButton.smaller, IDButton.bigger, IDButton.builds, IDButton.help];
		for (const id of ids) {
			const element_state = s.elementState_for(new Identifiable(id), ElementType.control, id);
			element_state.set_forHovering('black', 'pointer');
			element_state.hoverIgnore = id == IDButton.details;
			elementStates_byID[id] = element_state;
		}
	})

	$: {
		const _ = $s_resize_count;
		width = g.windowSize.width - 20;
	}

	function next_graph_relations() {
		switch ($s_shown_relations) {
			case GraphRelations.children: return GraphRelations.parents;
			case GraphRelations.parents:  return GraphRelations.related;
			default:					  return GraphRelations.children;
		}
	}

	function button_closure_forID(mouse_state, id) {
		if (mouse_state.isHover) {
			elementStates_byID[id].isOut = mouse_state.isOut;
		} else if (mouse_state.isUp) {
			switch (id) {
				case IDButton.help: g.showHelp(); break;
				case IDButton.bigger: width = g.zoomBy(1.1) - 20; break;
				case IDButton.smaller: width = g.zoomBy(0.9) - 20; break;
				case IDButton.details: $s_show_details = !$s_show_details; break;
				case IDButton.layout: $s_cluster_mode = !$s_cluster_mode; break;
				case IDButton.relations: $s_shown_relations = next_graph_relations(); break;
				default: togglePopupID(id); break;
			}
		}
	}

</script>

{#if Object.values(elementStates_byID).length > 0}
	<div class='controls'
		style='
			top: 9px;
			left: 0px;
			position: absolute;
			z-index: {ZIndex.frontmost};
			height: `${k.height_banner - 2}px`;'>
		{#if !$s_id_popupView}
			<Button name='details'
				color='transparent'
				border_thickness=0
				center={new Point(lefts[0], details_top)}
				element_state={elementStates_byID[IDButton.details]}
				closure={(mouse_state) => button_closure_forID(mouse_state, IDButton.details)}>
				<img src='settings.svg' alt='circular button' width={size}px height={size}px/>
			</Button>
			{#if k.show_controls}
				<Button name={IDButton.relations}
					width=65
					height={size + 4}
					center={new Point(lefts[1], top)}
					element_state={elementStates_byID[IDButton.relations]}
					closure={(mouse_state) => button_closure_forID(mouse_state, IDButton.relations)}>
					{$s_shown_relations}
				</Button>
				<Button name={IDButton.layout}
					width=65
					height={size + 4}
					center={new Point(lefts[2], top)}
					element_state={elementStates_byID[IDButton.layout]}
					closure={(mouse_state) => button_closure_forID(mouse_state, IDButton.layout)}>
					{#if $s_cluster_mode}tree{:else}clusters{/if}
				</Button>
			{/if}
		{/if}
		{#if g.device_isMobile}
			<Button name={IDButton.smaller}
				element_state={elementStates_byID[IDButton.smaller]}
				center={new Point(width - 130, top)}
				closure={(mouse_state) => button_closure_forID(mouse_state. IDButton.smaller)}>
				<SVGD3 name='smaller'
					width={size}
					height={size}
					svg_path={svgPaths.dash(size, 2)}
				/>
			</Button>
			<Button name={IDButton.bigger}
			center={new Point(width - 105, top)}
			element_state={elementStates_byID[IDButton.bigger]}
				closure={(mouse_state) => button_closure_forID(mouse_state, IDButton.bigger)}>
				<SVGD3 name='bigger'
					width={size}
					height={size}
					svg_path={svgPaths.t_cross(size, 2)}
				/>
			</Button>
		{/if}
		<Button name={IDButton.builds}
			width=75
			height={size + 4}
			center={new Point(width - 55, top)}
			element_state={elementStates_byID[IDButton.builds]}
			closure={(mouse_state) => button_closure_forID(mouse_state, IDButton.builds)}>
			{'build ' + k.build_number}
		</Button>
		<Button name={IDButton.help}
			width={size + 4}
			height={size + 4}
			center={new Point(width, top)}
			element_state={elementStates_byID[IDButton.help]}
			closure={(mouse_state) => button_closure_forID(mouse_state, IDButton.help)}>
			<span
				style='top:2px;
					left:5.5px;
					position:absolute;'>
				?
			</span>
		</Button>
	</div>
{/if}