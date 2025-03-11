<script lang=ts>
	import { k, u, Rect, Size, Point, Thing, debug, signals, Ancestry } from '../../ts/common/Global_Imports';
	import { T_Debug, T_Widget, G_Widget, G_TreeChildren } from '../../ts/common/Global_Imports';
	import { w_graph_rect } from '../../ts/common/Stores';
	import Tree_Children from './Tree_Children.svelte';
	import Widget from '../widget/Widget.svelte';
	import Circle from '../kit/Circle.svelte';
	import Tree_Line from './Tree_Line.svelte';
	export let ancestry: Ancestry;
	const g_tree_children = new G_TreeChildren(ancestry);

	ancestry.g_widget.g_tree_children = g_tree_children;	// so percolate happens in the right order
	g_tree_children.layout_allChildren();
	
	$: {
		if (!!$w_graph_rect) {
			g_tree_children.layout_allChildren()
		}
	}
	
</script>

{#if debug.lines}
	<Circle
		radius = 1
		thickness = 1
		color = black
		center = {g_tree_children.center}/>
{/if}
{#if !!ancestry}
	{#each ancestry.childAncestries as childAncestry}
		<Tree_Line ancestry = {childAncestry}/>
		<Widget ancestry = {childAncestry}/>
		{#if childAncestry.showsChildRelationships}
			<Tree_Children ancestry = {childAncestry}/>
		{/if}
	{/each}
{/if}
