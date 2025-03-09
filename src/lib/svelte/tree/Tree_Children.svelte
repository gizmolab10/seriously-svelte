<script lang=ts>
	import { k, u, Rect, Size, Point, Thing, debug, signals } from '../../ts/common/Global_Imports';
	import { T_Debug, T_Widget, G_Widget, G_TreeChildren } from '../../ts/common/Global_Imports';
	import { w_graph_rect } from '../../ts/common/Stores';
	import Tree_Children from './Tree_Children.svelte';
	import Widget from '../widget/Widget.svelte';
	import { onMount, onDestroy } from 'svelte';
	import Tree_Line from './Tree_Line.svelte';
	import Circle from '../kit/Circle.svelte';
	export let g_tree_widget!: G_Widget;
    const g_tree_children = new G_TreeChildren(g_tree_widget);
	let priorTime = new Date().getTime();

	onMount(() => {
		g_tree_children.layout_allChildren();
		const handler = signals.handle_reposition_widgets(1, (received_ancestry) => {
			const now = new Date().getTime();
			if (((now - priorTime) > 100) &&	// no more often than ten times per second
				(!received_ancestry || (ancestry.isExpanded &&
				received_ancestry.hasMatchingID(ancestry)))) {
				priorTime = now;
				debug.log_origins(g_tree_widget.origin_ofChild.x + ' before timeout');
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
{#if g_tree_children.ancestry.isExpanded}
	<div class = 'tree-children'>
		{#each g_tree_children.g_children_widgets as g_child_widget}
			<Widget g_widget = {g_child_widget}/>
			<Tree_Line g_widget = {g_child_widget}/>
			{#if g_child_widget.ancestry.showsChildRelationships}
				<Tree_Children g_tree_widget = {g_child_widget}/>
			{/if}
		{/each}
	</div>
{/if}
