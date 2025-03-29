<script lang=ts>
	import { k, u, Rect, Size, Point, Thing, debug, signals, Ancestry } from '../../ts/common/Global_Imports';
	import { T_Debug, T_Widget, G_Widget, G_TreeChildren } from '../../ts/common/Global_Imports';
	import { w_graph_rect } from '../../ts/common/Stores';
	import Tree_Children from './Tree_Children.svelte';
	import Widget from '../widget/Widget.svelte';
	import Tree_Line from './Tree_Line.svelte';
	import Circle from '../kit/Circle.svelte';
	import Box from '../debug/Box.svelte';
	export let ancestry: Ancestry;
	const g_treeChildren = ancestry.g_widget.g_treeChildren;	// so percolate happens in the right order

	g_treeChildren.layout_allChildren();
	
	$: {
		if (!!$w_graph_rect) {
			g_treeChildren.layout_allChildren()
		}
	}
		// {#each ancestry.g_widget.lineRects.entries() as [index, rect]}
		// 	{#if index > 0}
		// 		<Box rect = {rect} color = 'orange'/>
		// 	{/if}
		// {/each}
				// <Tree_Line
				// 	index = {index}
				// 	stroke_width = 1
				// 	svg_dasharray = '4,3'
				// 	ancestry = {ancestry}/>
	
</script>

{#if debug.lines}
	<Circle
		radius = 1
		thickness = 1
		color = black
		center = {g_treeChildren.center}/>
{/if}
{#if !!ancestry}
	{#each ancestry.childAncestries as childAncestry}
		{#if ancestry.g_widget.g_reciprocalLines.length > 0}
			<Box rect={ancestry.g_widget.g_reciprocalLines[0].rect} color='purple'/>
		{/if}
		<Tree_Line ancestry = {childAncestry}/>
		<Widget ancestry = {childAncestry}/>
		{#if childAncestry.showsChildRelationships}
			<Tree_Children ancestry = {childAncestry}/>
		{/if}
	{/each}
{/if}
