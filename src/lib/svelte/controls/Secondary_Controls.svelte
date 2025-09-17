<script lang='ts'>
	import { w_graph_rect, w_show_graph_ofType, w_show_search_controls } from '../../ts/managers/Stores';
	import {k, layout, Point, T_Layer, T_Graph } from '../../ts/common/Global_Imports';
	import Tree_Preferences from './Tree_Preferences.svelte';
	import Search_Filters from './Search_Filters.svelte';
	import Separator from '../draw/Separator.svelte';
</script>

<div class='secondary'>
	{#if $w_show_search_controls}
		<Search_Filters top={8} width={117} zindex={T_Layer.frontmost}/>
	{:else if $w_show_graph_ofType == T_Graph.tree}
		<Tree_Preferences top={0} width={117} zindex={T_Layer.frontmost}/>
	{/if}
	{#if $w_show_search_controls || $w_show_graph_ofType == T_Graph.tree}
		<Separator name='secondary-separator'
			corner_radius={k.radius.gull_wings.thick}
			thickness={k.thickness.separator.main}
			length={$w_graph_rect.size.width + 7}
			origin={new Point(-2, 50)}
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
