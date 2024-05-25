<script>
	import { k, u, Point, ZIndex, signals, svgPaths, IDButton, IDPersistant, persistLocal, GraphRelations } from '../../ts/common/GlobalImports';
	import { s_build, s_show_details, s_id_popupView, s_resize_count, s_layout_asClusters, s_graph_relations } from '../../ts/state/Stores';
	import Button from '../buttons/Button.svelte';
	import SVGD3 from '../kit/SVGD3.svelte';
	const top = k.dot_size / 2 + 2;
	let width = u.windowSize.width - 20;
	let size = 16;

	function togglePopupID(id) {
		$s_id_popupView = ($s_id_popupView == id) ? null : id;
	}
	
	$: {
		const _ = $s_resize_count;
		width = u.windowSize.width - 20;
	}

	function button_closure_forID(mouseData, id) {
		if (mouseData.isHover) {

		} else if (mouseData.isUp) {
			switch (id) {
				case IDButton.bigger: width = g.zoomBy(1.1) - 20; break;
				case IDButton.smaller: width = g.zoomBy(0.9) - 20; break;
				case IDButton.details: $s_show_details = !$s_show_details; break;
				case IDButton.layout: $s_layout_asClusters = !$s_layout_asClusters; break;
				case IDButton.relations: $s_graph_relations = next_graph_relations(); break;
				default: togglePopupID(id); break;
			}
		}
	}

	function next_graph_relations() {
		switch ($s_graph_relations) {
			case GraphRelations.children: return GraphRelations.parents;
			case GraphRelations.parents:  return GraphRelations.related;
			default:					  return GraphRelations.children;
		}
	}

</script>

<div class='controls'
	style='
		top: 9px;
		left: 0px;
		position: fixed;
		z-index: {ZIndex.frontmost};
		height: `${k.height_banner - 2}px`;'>
	{#if !$s_id_popupView}
		<Button name='details'
			color='transparent'
			center={new Point(10, top - 2)}
			closure={(mouseData) => button_closure_forID(mouseData, IDButton.details)}>
			<img src='settings.svg' alt='circular button' width={size}px height={size}px/>
		</Button>
		{#if k.show_controls}
			<Button name='relations-button'
				width=65
				height={size + 4}
				border='solid 1px'
				center={new Point(65, 8)}
				background_color={k.color_background}
				closure={(mouseData) => button_closure_forID(mouseData, IDButton.relations)}>
				{$s_graph_relations}
			</Button>
			<Button name='layout-button'
				width=65
				height={size + 4}
				border='solid 1px'
				center={new Point(140, 8)}
				background_color={k.color_background}
				closure={(mouseData) => button_closure_forID(mouseData, IDButton.layout)}>
				{#if $s_layout_asClusters}tree{:else}clusters{/if}
			</Button>
		{/if}
	{/if}
	{#if u.device_isMobile}
		<Button
			color={k.color_background}
			center={new Point(width - 130, top)}
			closure={(mouseData) => button_closure_forID(mouseData. IDButton.smaller)}>
			<SVGD3 name='smaller'
				width={size}
				height={size}
				svg_path={svgPaths.dash(size, 2)}
			/>
		</Button>
		<Button
			color={k.color_background}
			center={new Point(width - 105, top)}
			closure={(mouseData) => button_closure_forID(mouseData, IDButton.bigger)}>
			<SVGD3 name='bigger'
				width={size}
				height={size}
				svg_path={svgPaths.t_cross(size, 2)}
			/>
		</Button>
	{/if}
	<Button name='builds'
		width=65
		height={size + 4}
		border='solid 1px'
		center={new Point(width - 50, 8)}
		background_color={k.color_background}
		closure={(mouseData) => button_closure_forID(mouseData, IDButton.builds)}>
		build {$s_build}
	</Button>
	<Button name='help'
		color='black'
		width={size + 4}
		height={size + 4}
		border='solid 1px'
		center={new Point(width, top)}
		background_color={k.color_background}
		closure={(mouseData) => button_closure_forID(mouseData, IDButton.help)}>
		<div style='top:2px; left:5.5px; position:absolute;'>?</div>
	</Button>
</div>