<script lang=ts>
	import { k, u, Rect, Size, Point, Thing, debug, signals } from '../../ts/common/Global_Imports';
	import { T_Line, T_Debug, G_Widget, G_TreeChild } from '../../ts/common/Global_Imports';
	import { w_graph_rect } from '../../ts/state/S_Stores';
	import Tree_Children from './Tree_Children.svelte';
	import Widget from '../widget/Widget.svelte';
	import { onMount, onDestroy } from 'svelte';
	import Tree_Line from './Tree_Line.svelte';
	import Circle from '../kit/Circle.svelte';
	export let origin = Point.zero;
    export let ancestry;
	const widgetOffset = new Point(17, (k.dot_size / -15) - 7);
	let priorTime = new Date().getTime();
	let g_widgets: Array<G_Widget> = [];
	let center = Point.zero;
	
	onDestroy(() => { g_widgets = []; });

	onMount(() => {
		layoutAll_children();
		const handler = signals.handle_relayoutAndRecreate_widgets(1, (signal_ancestry) => {
			const now = new Date().getTime();
			if (((now - priorTime) > 100) &&	// no more often than ten times per second
				(!signal_ancestry || (ancestry.isExpanded &&
				signal_ancestry.hasMatchingID(ancestry)))) {
				priorTime = now;
				debug.log_origins(origin.x + ' before timeout');
				layoutAll_children();
			}
		});
		return () => { handler.disconnect() };
	});
	
	$: {
		if (!!$w_graph_rect) {
			layoutAll_children()
		}
	}
	
	function layoutAll_children() {
		g_widgets = [];
		if (ancestry.isExpanded || ancestry.isRoot) {
			debug.log_origins(origin.x + ' children layout');
			const childAncestries = ancestry.childAncestries;
			const height = ancestry.visibleProgeny_halfHeight + 1;
			const childrenOrigin = origin.offsetByXY(2.5, height);
			let sum = -ancestry.visibleProgeny_height() / 2; // start out negative and grow positive
			for (const childAncestry of childAncestries) {
				const g_child = new G_TreeChild(sum, ancestry, childAncestry, childrenOrigin);
				g_widgets = u.concatenateArrays(g_widgets, [g_child.g_widget]);
				sum += g_child.progeny_height + 1;
			}
			center = childrenOrigin.offsetByXY(20, 2);
		} else {
			console.log(`not expanded, cannot layout ${ancestry.description}`);
		}
	}
</script>

{#if debug.lines}
	<Circle
		radius = 1
		thickness = 1
		color = black
		center = {center}/>
{/if}
{#if ancestry.isExpanded}
	<div class = 'tree-children'>
		{#each g_widgets as g_widget}
			<Widget
				g_widget = {g_widget}
				origin = {g_widget.extent.offsetBy(widgetOffset)}/>
			<Tree_Line g_widget = {g_widget}/>
			{#if g_widget.widget_ancestry.showsChildRelationships}
				<Tree_Children
					origin = {g_widget.child_origin}
					ancestry = {g_widget.widget_ancestry}/>
			{/if}
		{/each}
	</div>
{/if}
