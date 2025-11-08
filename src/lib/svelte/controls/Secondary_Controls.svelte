<script lang='ts'>
	import { k, show, layout, Point, T_Layer, T_Graph } from '../../ts/common/Global_Imports';
	import Tree_Preferences from './Tree_Preferences.svelte';
	import Separator from '../draw/Separator.svelte';
	import Search from '../search/Search.svelte';
	const { w_rect_ofGraphView } = layout;
	const { w_details, w_search_controls, w_graph_ofType } = show;

	// two states: search and tree preferences

</script>

<div class='secondary'
	style='
		position: absolute;
		top: {layout.controls_boxHeight - 2}px;
		left: {$w_rect_ofGraphView.origin.x + 2 + ($w_details ? 0 : -2)}px;'>
	{#if $w_search_controls}
		<Search top={8} width={117} zindex={T_Layer.frontmost}/>
	{:else if $w_graph_ofType == T_Graph.tree}
		<Tree_Preferences width={117} zindex={T_Layer.frontmost}/>
	{/if}
	{#if $w_search_controls || $w_graph_ofType == T_Graph.tree}
		<Separator name='secondary-separator'
			origin={new Point(-($w_details ? 4 : 3), layout.controls_boxHeight - 6)}
			corner_radius={k.radius.gull_wings.thick}
			thickness={k.thickness.separator.main}
			length={$w_rect_ofGraphView.size.width + ($w_details ? 10 : 11)}
			zindex={T_Layer.frontmost}
			has_both_wings={true}
			isHorizontal={true}/>
	{/if}
</div>

<style>
	.secondary {
		position: absolute;
		height: 100%;
		width: 100%;
		left: 0;
		top: 0;
	}
</style>
