<script>
	import { k, u, ZIndex, signals, svgPaths, IDButton, IDPersistant, persistLocal, GraphRelations } from '../../ts/common/GlobalImports';
	import { s_build, s_show_details, s_id_popupView, s_resize_count, s_layout_asClusters, s_graph_relations } from '../../ts/state/State';
	import CircleButton from '../buttons/CircleButton.svelte';
	import SVGD3 from '../kit/SVGD3.svelte';
	let width = u.windowSize.width - 20;
	let size = 16;

	function togglePopupID(id) { $s_id_popupView = ($s_id_popupView == id) ? null : id; }
	
	$: {
		const _ = $s_resize_count;
		width = u.windowSize.width - 20;
	}

	function button_closure_forID(id) {
		switch (id) {
			case IDButton.bigger: width = g.zoomBy(1.1) - 20; break;
			case IDButton.smaller: width = g.zoomBy(0.9) - 20; break;
			case IDButton.details: $s_show_details = !$s_show_details; break;
			case IDButton.layout: $s_layout_asClusters = !$s_layout_asClusters; break;
			case IDButton.relations: $s_graph_relations = next_graph_relations(); break;
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

<style>
	.button {
		border-radius: 1em;
		position: fixed;
		border: 1px solid;
		cursor: pointer;
		top: 7px;
	}
</style>

<div class='controls'
	style='
		top: 9px;
		left: 0px;
		position: fixed;
		z-index: {ZIndex.frontmost};
		height: `${k.height_banner - 2}px`;'>
	{#if !$s_id_popupView}
		<CircleButton left=15
			color='transparent'
			borderColor='transparent'
			mouse_click_closure={() => button_closure_forID(IDButton.details)}>
			<img src='settings.svg' alt='circular button' width={size}px height={size}px/>
		</CircleButton>
		{#if k.show_controls}
			<button class='button'
				style='
					left:30px;
					background-color: {k.color_background};'
				on:click={() => button_closure_forID(IDButton.relations)}>
				{$s_graph_relations}
			</button>
			<button class='button'
				style='
					left: 97px;
					background-color: {k.color_background};'
				on:click={() => button_closure_forID(IDButton.layout)}>
				{#if $s_layout_asClusters}tree{:else}clusters{/if}
			</button>
		{/if}
	{/if}
	{#if u.device_isMobile}
		<CircleButton
			size={size}
			left={width - 130}
			color={k.color_background}
			mouse_click_closure={(event) => button_closure_forID(IDButton.smaller)}>
			<SVGD3 name='smaller'
				width={size}
				height={size}
				svg_path={svgPaths.dash(size, 2)}
			/>
		</CircleButton>
		<CircleButton
			size={size}
			left={width - 105}
			color={k.color_background}
			mouse_click_closure={(event) => button_closure_forID(IDButton.bigger)}>
			<SVGD3 name='bigger'
				width={size}
				height={size}
				svg_path={svgPaths.t_cross(size, 2)}
			/>
		</CircleButton>
	{/if}
	<button class='button'
		style='
			left: {width - 90}px;
			background-color: {k.color_background};'
		on:click={() => togglePopupID(IDButton.builds)}>
		build {$s_build}
	</button>
	<CircleButton
		size={size}
		left={width - 15}
		color={k.color_background}
		mouse_click_closure={(event) => togglePopupID(IDButton.help)}>?
	</CircleButton>
</div>