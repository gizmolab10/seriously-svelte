<script lang=ts>
	import { k, u, Rect, Size, Point, Thing, debug, signals } from '../../ts/common/Global_Imports';
	import { T_Debug, T_Widget, G_Widget, G_TreeChild } from '../../ts/common/Global_Imports';
	import { w_graph_rect } from '../../ts/common/Stores';
	import Tree_Children from './Tree_Children.svelte';
	import Widget from '../widget/Widget.svelte';
	import { onMount, onDestroy } from 'svelte';
	import Tree_Line from './Tree_Line.svelte';
	import Circle from '../kit/Circle.svelte';
	export let g_widget!: G_Widget;
    const ancestry = g_widget.ancestry_ofWidget;
	const origin = g_widget.origin_ofChild;
	let priorTime = new Date().getTime();
	let g_widgets: Array<G_Widget> = [];
	let center = Point.zero;
	
	onDestroy(() => { g_widgets = []; });

	onMount(() => {
		layout_allChildren();
		const handler = signals.handle_relayout_widgets(1, (received_ancestry) => {
			const now = new Date().getTime();
			if (((now - priorTime) > 100) &&	// no more often than ten times per second
				(!received_ancestry || (ancestry.isExpanded &&
				received_ancestry.hasMatchingID(ancestry)))) {
				priorTime = now;
				debug.log_origins(origin.x + ' before timeout');
				debug.log_layout(`TRIGGER [. .] tree children on "${ancestry.title}"`);
				layout_allChildren();
			}
		});
		return () => { handler.disconnect() };
	});
	
	$: {
		if (!!$w_graph_rect) {
			layout_allChildren()
		}
	}
	
	function layout_allChildren() {
		g_widgets = [];
		if (ancestry.isExpanded || ancestry.isRoot) {
			debug.log_origins(origin.x + ' children layout');
			const childAncestries = ancestry.childAncestries;
			const height = ancestry.visibleProgeny_halfHeight + 1;
			const childrenOrigin = origin.offsetByXY(4.5, height);
			let sum = -ancestry.visibleProgeny_height() / 2; // start out negative and grow positive
			for (const childAncestry of childAncestries) {
				const temp_g_treeChild = new G_TreeChild(sum, ancestry, childAncestry, childrenOrigin);
				g_widgets = u.concatenateArrays(g_widgets, [temp_g_treeChild.g_widget]);
				sum += temp_g_treeChild.progeny_height + 1;
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
		{#each g_widgets as g_child_widget}
			<Widget g_widget = {g_child_widget}/>
			<Tree_Line g_widget = {g_child_widget}/>
			{#if g_widget.ancestry_ofWidget.showsChildRelationships}
				<Tree_Children g_widget = {g_child_widget}/>
			{/if}
		{/each}
	</div>
{/if}
