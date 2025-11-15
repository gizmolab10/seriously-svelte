<script lang='ts'>
	import { c, k, show, layout, Point, T_Layer, T_Graph } from '../../ts/common/Global_Imports';
	import Tree_Preferences from './Tree_Preferences.svelte';
	import Separator from '../draw/Separator.svelte';
	import Search from '../search/Search.svelte';
	const { w_rect_ofGraphView } = layout;
	const { w_details, w_search_controls, w_graph_ofType } = show;
	const top = c.has_standalone_UI ? layout.controls_boxHeight - 2 : 2;
	const left = c.has_standalone_UI ? $w_rect_ofGraphView.origin.x : 116;
	const width = c.has_standalone_UI ? $w_rect_ofGraphView.size.width + ($w_details ? 10 : 11) : 117;

	// two states: search and tree preferences

</script>

<div class='secondary'
	style='
		top: {top}px;
		left: {left}px;
		position: absolute;
		z-index: {T_Layer.frontmost};'>
	{#if $w_search_controls}
		<Search top={8} width={width}/>
	{:else if $w_graph_ofType == T_Graph.tree}
		<Tree_Preferences width={width}/>
	{/if}
	{#if ($w_search_controls || $w_graph_ofType == T_Graph.tree)}
		{#if c.has_standalone_UI}
			<Separator name='secondary-bottom-separator'
				origin={new Point(-($w_details ? 2 : 3), top - 4)}
				corner_radius={k.radius.gull_wings.thick}
				thickness={k.thickness.separator.main}
				has_both_wings={true}
				isHorizontal={true}
				length={width}/>
		{:else}
			<Separator name='secondary-right-separator'
				corner_radius={k.radius.gull_wings.thick}
				thickness={k.thickness.separator.main}
				length={layout.controls_boxHeight + 1}
				origin={new Point(2, top - 1.5)}
				isHorizontal={false}/>
		{/if}
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
