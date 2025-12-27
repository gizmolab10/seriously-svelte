<script lang='ts'>
	import { Point, T_Layer, T_Graph } from '../../ts/common/Global_Imports';
	import { g, k, show, features } from '../../ts/common/Global_Imports';
	import Tree_Controls from './Tree_Controls.svelte';
	import Separator from '../draw/Separator.svelte';
	import Search from '../search/Search.svelte';
	const { w_rect_ofGraphView } = g;
	const height = g.controls_boxHeight;
	const top = features.allow_tree_mode ? g.controls_boxHeight - 5 : 2;
	const { w_show_details, w_show_search_controls, w_t_graph } = show;
	const left = features.allow_tree_mode ? $w_rect_ofGraphView.origin.x - 4 : features.has_details_button ? 115 : 92;
	const width = features.allow_tree_mode ? $w_rect_ofGraphView.size.width + ($w_show_details ? 10 : 11) : features.has_details_button ? 140 : 137;
	let isVisible = false;

	// two states: search and tree preferences

	$: {
		const _ = `${$w_show_search_controls}:::${$w_t_graph}`;
		isVisible = $w_show_search_controls || $w_t_graph == T_Graph.tree;
	}

</script>

{#if isVisible}
	<div class='secondary'
		style='
			top: {top}px;
			left: {left}px;
			height: {height}px;
			position: absolute;
			z-index: {T_Layer.frontmost};'>
		{#if $w_show_search_controls}
			<Search top={8}/>
		{:else if $w_t_graph == T_Graph.tree}
			<Tree_Controls/>
		{/if}
		{#if features.allow_tree_mode}
			<Separator name='secondary-bottom-separator'
				origin={new Point(($w_show_details ? 2 : 1), top)}
				corner_radius={k.radius.gull_wings.thick}
				thickness={k.thickness.separator.main}
				has_both_wings={true}
				isHorizontal={true}
				length={width}/>
		{/if}
	</div>
{/if}

<style>
	.secondary {
		position: absolute;
		width: 100%;
		left: 0;
		top: 0;
	}
</style>
