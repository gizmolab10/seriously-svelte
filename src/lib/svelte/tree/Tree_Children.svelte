<script lang=ts>
	import { k, u, Rect, Size, Point, Thing, debug, signals, Ancestry } from '../../ts/common/Global_Imports';
	import { T_Debug, T_Widget, G_Widget, G_TreeChildren } from '../../ts/common/Global_Imports';
	import { w_graph_rect } from '../../ts/common/Stores';
	import Tree_Children from './Tree_Children.svelte';
	import Widget from '../widget/Widget.svelte';
	import { onMount, onDestroy } from 'svelte';
	import Tree_Line from './Tree_Line.svelte';
	import Circle from '../kit/Circle.svelte';
	export let ancestry: Ancestry;
    const g_tree_children = new G_TreeChildren(ancestry);
	let lastLayoutTime = new Date().getTime();

	onMount(() => {
		g_tree_children.layout_allChildren();
		const handler = signals.handle_reposition_widgets(1, (received_ancestry) => {
			const now = new Date().getTime();
			if (((now - lastLayoutTime) > 100) &&	// no more often than ten times per second
				(!received_ancestry || (ancestry.isExpanded &&
				received_ancestry.hasMatchingID(ancestry)))) {
				lastLayoutTime = now;
				debug.log_origins(ancestry.g_widget.origin_ofChild.x + ' before timeout');
				debug.log_reposition(`tree children [. .] on "${ancestry.title}"`);
				g_tree_children.layout_allChildren();
			}
		});
		return () => { handler.disconnect() };
	});
	
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
	<div class = 'tree-children'>
		{#each ancestry.childAncestries as childAncestry}
			<Tree_Line ancestry = {childAncestry}/>
			<Widget ancestry = {childAncestry}/>
			{#if childAncestry.showsChildRelationships}
				<Tree_Children ancestry = {childAncestry}/>
			{/if}
		{/each}
	</div>
{/if}
