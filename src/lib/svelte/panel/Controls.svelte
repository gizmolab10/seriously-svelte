<script>
	import { g, k, s, u, Point, ZIndex, signals, svgPaths, IDButton, ButtonAppearance, IDPersistant, persistLocal, GraphRelations } from '../../ts/common/GlobalImports';
	import { s_show_details, s_id_popupView, s_resize_count, s_layout_asClusters, s_graph_relations } from '../../ts/state/ReactiveState';
	import Button from '../mouse buttons/Button.svelte';
	import SVGD3 from '../kit/SVGD3.svelte';
	const details_top = k.dot_size / 2;
	const top = (k.dot_size + 3) / 2;
	const lefts = [10, 65, 137];
	let size = k.default_buttonSize;
	let width = u.windowSize.width - 20;

	function togglePopupID(id) { $s_id_popupView = ($s_id_popupView == id) ? null : id; }
	
	$: {
		const _ = $s_resize_count;
		width = u.windowSize.width - 20;
	}

	function next_graph_relations() {
		switch ($s_graph_relations) {
			case GraphRelations.children: return GraphRelations.parents;
			case GraphRelations.parents:  return GraphRelations.related;
			default:					  return GraphRelations.children;
		}
	}

	function button_closure_forID(mouseData, id) {
		if (mouseData.isHover) {
			s.appearance_forName(id).update(mouseData.isOut, 'black', 'pointer');
		} else if (mouseData.isUp) {
			switch (id) {
				case IDButton.help: g.open_tabFor(k.help_url); break;
				case IDButton.bigger: width = g.zoomBy(1.1) - 20; break;
				case IDButton.smaller: width = g.zoomBy(0.9) - 20; break;
				case IDButton.details: $s_show_details = !$s_show_details; break;
				case IDButton.layout: $s_layout_asClusters = !$s_layout_asClusters; break;
				case IDButton.relations: $s_graph_relations = next_graph_relations(); break;
				default: togglePopupID(id); break;
			}
		}
	}

</script>

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
			closure={(mouseData) => button_closure_forID(mouseData, IDButton.details)}>
			<img src='settings.svg' alt='circular button' width={size}px height={size}px/>
		</Button>
		{#if k.show_controls}
			<Button name={IDButton.relations}
				width=65
				height={size + 4}
				center={new Point(lefts[1], top)}
				closure={(mouseData) => button_closure_forID(mouseData, IDButton.relations)}>
				{$s_graph_relations}
			</Button>
			<Button name={IDButton.layout}
				width=65
				height={size + 4}
				center={new Point(lefts[2], top)}
				closure={(mouseData) => button_closure_forID(mouseData, IDButton.layout)}>
				{#if $s_layout_asClusters}tree{:else}clusters{/if}
			</Button>
		{/if}
	{/if}
	{#if u.device_isMobile}
		<Button name={IDButton.smaller}
			center={new Point(width - 130, top)}
			closure={(mouseData) => button_closure_forID(mouseData. IDButton.smaller)}>
			<SVGD3 name='smaller'
				width={size}
				height={size}
				svg_path={svgPaths.dash(size, 2)}
			/>
		</Button>
		<Button name={IDButton.bigger}
			center={new Point(width - 105, top)}
			closure={(mouseData) => button_closure_forID(mouseData, IDButton.bigger)}>
			<SVGD3 name='bigger'
				width={size}
				height={size}
				svg_path={svgPaths.t_cross(size, 2)}
			/>
		</Button>
	{/if}
	<Button name={IDButton.builds}
		width=65
		height={size + 4}
		center={new Point(width - 50, top)}
		closure={(mouseData) => button_closure_forID(mouseData, IDButton.builds)}>
		{'build ' + k.build_number}
	</Button>
	<Button name={IDButton.help}
		width={size + 4}
		height={size + 4}
		center={new Point(width, top)}
		closure={(mouseData) => button_closure_forID(mouseData, IDButton.help)}>
		<span
			style='top:2px;
				left:5.5px;
				position:absolute;'>
			?
		</span>
	</Button>
</div>