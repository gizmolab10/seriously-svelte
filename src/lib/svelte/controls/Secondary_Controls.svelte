<script lang='ts'>
	import { Point, T_Layer, T_Graph } from '../../ts/common/Global_Imports';
	import { g, k, show, features } from '../../ts/common/Global_Imports';
	import Tree_Controls from './Tree_Controls.svelte';
	import Separator from '../draw/Separator.svelte';
	import Search from '../search/Search.svelte';
	const height = g.controls_boxHeight;
	const top = g.controls_boxHeight - 5;
	const { w_show_search_controls, w_t_graph } = show;
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
			left: 0px;
			height: {height}px;
			width: {g.windowSize.width}px;
			position: absolute;
			z-index: {T_Layer.frontmost};'>
		{#if $w_show_search_controls}
			<Search top={8}/>
		{:else if $w_t_graph == T_Graph.tree}
			<Tree_Controls/>
		{/if}
		{#if features.allow_tree_mode}
			<Separator name='secondary-bottom-separator'
				corner_radius={k.radius.gull_wings.thick}
				thickness={k.thickness.separator.main}
				length={g.windowSize.width + 2.5}
				origin={new Point(2, top)}
				has_both_wings={true}
				isHorizontal={true}/>
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
