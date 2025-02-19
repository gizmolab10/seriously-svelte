<script lang=ts>
	import { k, u, Rect, Size, Point, Thing, debug, signals } from '../../ts/common/Global_Imports';
	import { T_Line, T_Debug, G_Widget, G_Children } from '../../ts/common/Global_Imports';
	import { w_graph_rect } from '../../ts/state/S_Stores';
	import Tree_Children from './Tree_Children.svelte';
	import Widget from '../widget/Widget.svelte';
	import { onMount, onDestroy } from 'svelte';
	import Tree_Line from './Tree_Line.svelte';
	import Circle from '../kit/Circle.svelte';
	export let origin = Point.zero;
    export let ancestry;
	const widgetOffset = new Point(17, (k.dot_size / -15) - 7);
	const lineOffset = new Point(-122.5, 2.5);
	let g_widgets: Array<G_Widget> = [];
	let priorTime = new Date().getTime();
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
			const height = ancestry.visibleProgeny_halfHeight;
			const childAncestries = ancestry.childAncestries;
			const childrenOrigin = origin.offsetByXY(5.5, height + 1);
			let sum = -ancestry.visibleProgeny_height() / 2; // start out negative and grow positive
			for (const childAncestry of childAncestries) {
				const g_children = new G_Children(sum, ancestry, childAncestry, childrenOrigin);
				g_widgets = u.concatenateArrays(g_widgets, g_children.g_widgets);
				sum += g_children.childHeight + 1;
			}
			center = childrenOrigin.offsetByXY(20, 2);
		} else {
			console.log(`not expanded, cannot layout ${ancestry.description}`);
		}
	}
</script>

{#if debug.lines}
	<Circle radius=1 center={center} color=black thickness=1/>
{/if}
{#if ancestry.isExpanded}
	<div class='tree-children'>
		{#each g_widgets as g_widget}
			<Widget name={g_widget.es_widget.name} ancestry={g_widget.widget_ancestry} origin={g_widget.extent.offsetBy(widgetOffset)}/>
			<Tree_Line ancestry={g_widget.widget_ancestry} curveType={g_widget.curveType} rect={g_widget.offsetBy(lineOffset)}/>
			{#if g_widget.widget_ancestry.showsChildRelationships}
				<Tree_Children ancestry={g_widget.widget_ancestry} origin={g_widget.children_origin}/>
			{/if}
		{/each}
	</div>
{/if}
