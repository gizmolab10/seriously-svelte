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
	
	// {#each ancestry.g_widget.g_reciprocalLines as g_line}
	// 	<Tree_Line g_line = {g_line}/>
	//	<Box rect={g_line.rect} color='purple'/>
	// {/each}
	
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
		<Tree_Line g_line = {childAncestry.g_widget.g_line}/>
		<Widget ancestry = {childAncestry}/>
		{#if childAncestry.showsChildRelationships}
			<Tree_Children ancestry = {childAncestry}/>
		{/if}
	{/each}
{/if}
