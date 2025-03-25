<script lang=ts>
	import { k, u, Rect, Size, Point, Thing, debug, signals, Ancestry } from '../../ts/common/Global_Imports';
	import { T_Debug, T_Widget, G_Widget, G_TreeChildren } from '../../ts/common/Global_Imports';
	import { w_graph_rect, w_ancestry_focus } from '../../ts/common/Stores';
	import Tree_Children from './Tree_Children.svelte';
	import Widget from '../widget/Widget.svelte';
	import Tree_Line from './Tree_Line.svelte';
	import Circle from '../kit/Circle.svelte';
	export let ancestry: Ancestry;
	const g_treeChildren = ancestry.g_widget.g_treeChildren;	// so percolate happens in the right order

	g_treeChildren.layout_allChildren();
	
	$: {
		if (!!$w_graph_rect) {
			g_treeChildren.layout_allChildren()
		}
	}
	
</script>

{#if debug.lines}
	<Circle
		radius = 1
		thickness = 1
		color = black
		center = {g_treeChildren.center}/>
{/if}
{#if !!ancestry}
{/if}
