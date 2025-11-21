<script lang='ts'>
	import { c, k, show, layout, features } from '../../ts/common/Global_Imports';
	import { Point, T_Layer, T_Graph } from '../../ts/common/Global_Imports';
	import Tree_Preferences from './Tree_Preferences.svelte';
	import Separator from '../draw/Separator.svelte';
	import Search from '../search/Search.svelte';
	const { w_rect_ofGraphView } = layout;
	const height = layout.controls_boxHeight + 4;
	const top = features.allow_tree_mode ? layout.controls_boxHeight - 5 : 2;
	const { w_show_details, w_show_search_controls, w_show_graph_ofType } = show;
	const left = features.allow_tree_mode ? $w_rect_ofGraphView.origin.x - 4 : features.has_details_button ? 115 : 92;
	const width = features.allow_tree_mode ? $w_rect_ofGraphView.size.width + ($w_show_details ? 10 : 11) : features.has_details_button ? 140 : 137;

	// two states: search and tree preferences

</script>

<div class='secondary'
	style='
		top: {top}px;
		left: {left}px;
		height: {height}px;
		position: absolute;
		z-index: {T_Layer.frontmost};'>
	{#if $w_show_search_controls}
		<Search top={8} width={width}/>
	{:else if $w_show_graph_ofType == T_Graph.tree}
		<Tree_Preferences width={width}/>
	{/if}
	{#if ($w_show_search_controls || $w_show_graph_ofType == T_Graph.tree)}
		{#if features.allow_tree_mode}
			<Separator name='secondary-bottom-separator'
				origin={new Point(($w_show_details ? 2 : 1), top)}
				corner_radius={k.radius.gull_wings.thick}
				thickness={k.thickness.separator.main}
				has_both_wings={true}
				isHorizontal={true}
				length={width}/>
		{/if}
	{/if}
</div>

<style>
	.secondary {
		position: absolute;
		width: 100%;
		left: 0;
		top: 0;
	}
</style>
