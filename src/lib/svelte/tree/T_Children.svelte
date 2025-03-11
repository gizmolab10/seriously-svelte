<script lang=ts>
	import { k, u, Rect, Size, Point, Thing, debug, signals, Ancestry } from '../../ts/common/Global_Imports';
	import { T_Debug, T_Widget, G_Widget, G_TreeChildren } from '../../ts/common/Global_Imports';
	import { w_graph_rect } from '../../ts/common/Stores';
	import T_Children from './T_Children.svelte';
	import Widget from '../widget/Widget.svelte';
	import { onMount, onDestroy } from 'svelte';
	import T_Line from './T_Line.svelte';
	import Circle from '../kit/Circle.svelte';
	export let ancestry: Ancestry;
    const g_t_children = new G_TreeChildren(ancestry);
	let lastLayoutTime = new Date().getTime();

	onMount(() => {
		g_t_children.layout_allChildren();
		const handle_reposition = signals.handle_reposition_widgets(1, (received_ancestry) => {
			const now = new Date().getTime();
			if (((now - lastLayoutTime) > 100) &&	// no more often than ten times per second
				ancestry.isExpanded) {
				lastLayoutTime = now;
				debug.log_origins(ancestry.g_widget.origin_ofChild.x + ' before timeout');
				debug.log_reposition(`tree children [. .] on "${ancestry.title}"`);
				g_t_children.layout_allChildren();
			}
		});
		return () => { handle_reposition.disconnect() };
	});
	
	$: {
		if (!!$w_graph_rect) {
			g_t_children.layout_allChildren()
		}
	}
	
</script>

{#if debug.lines}
	<Circle
		radius = 1
		thickness = 1
		color = black
		center = {g_t_children.center}/>
{/if}
{#if !!ancestry}
	<div class = 'tree-children'>
		{#each ancestry.childAncestries as childAncestry}
			<T_Line ancestry = {childAncestry}/>
			<Widget ancestry = {childAncestry}/>
			{#if childAncestry.showsChildRelationships}
				<T_Children ancestry = {childAncestry}/>
			{/if}
		{/each}
	</div>
{/if}
