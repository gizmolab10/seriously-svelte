<script lang='ts'>
	import { w_show_details, w_show_graph_ofType, w_search_show_controls } from '../../ts/managers/Stores';
	import {k, layout, Point, T_Layer, T_Graph } from '../../ts/common/Global_Imports';
	import Search_Preferences from '../search/Search_Preferences.svelte';
	import Tree_Preferences from './Tree_Preferences.svelte';
	import { w_graph_rect } from '../../ts/managers/Stores';
	import Separator from '../draw/Separator.svelte';
</script>

<div class='secondary'
	style='
		position: absolute;
		top: {layout.controls_boxHeight - 2}px;
		left: {$w_graph_rect.origin.x + ($w_show_details ? 0 : 5)}px;'>
	{#if $w_search_show_controls}
		<Search_Preferences top={8} width={117} zindex={T_Layer.frontmost}/>
	{:else if $w_show_graph_ofType == T_Graph.tree}
		<Tree_Preferences width={117} zindex={T_Layer.frontmost}/>
	{/if}
	{#if $w_search_show_controls || $w_show_graph_ofType == T_Graph.tree}
		<Separator name='secondary-separator'
			origin={new Point(-($w_show_details ? 2 : 3), layout.controls_boxHeight - 6)}
			corner_radius={k.radius.gull_wings.thick}
			thickness={k.thickness.separator.main}
			length={$w_graph_rect.size.width + ($w_show_details ? 10 : 7)}
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
