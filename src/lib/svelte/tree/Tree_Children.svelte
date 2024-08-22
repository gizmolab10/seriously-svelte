<script lang=ts>
	import { k, u, Rect, Size, Point, Thing, debug, IDLine, onMount } from '../../ts/common/Global_Imports';
	import { signals, onDestroy, DebugFlag, debugReact, Tree_Geometry } from '../../ts/common/Global_Imports';
	import { s_graphRect } from '../../ts/state/Reactive_State';
	import Tree_Children from './Tree_Children.svelte';
	import Widget from '../widget/Widget.svelte';
	import Tree_Line from './Tree_Line.svelte';
	import Circle from '../kit/Circle.svelte';
	export let origin = Point.zero;
    export let ancestry;
	const widgetOffset = new Point(17, (k.dot_size / -15) - 7);
	const lineOffset = new Point(-122.5, 2.5);
	let widgetMapRects: Array<Widget_MapRect> = [];
	let priorTime = new Date().getTime();
	let center = Point.zero;
	
	onDestroy(() => { widgetMapRects = []; });

	onMount(() => {
		layoutAll_children();
		const handler = signals.handle_relayoutWidgets(1, (signal_ancestry) => {
			const now = new Date().getTime();
			if (ancestry.isExpanded &&
				((now - priorTime) > 100) &&
				(!signal_ancestry || signal_ancestry.matchesAncestry(ancestry))) {
				priorTime = now;
				debugReact.log_origins(origin.x + ' before timeout');
				layoutAll_children();
			}
		});
		return () => { handler.disconnect() };
	});
	
	$: {
		if ($s_graphRect) {
			layoutAll_children()
		}
	}
	
	function layoutAll_children() {
		widgetMapRects = [];
		if (ancestry.isExpanded) {
			debugReact.log_origins(origin.x + ' children layout');
			const height = ancestry.visibleProgeny_halfHeight;
			const childAncestries = ancestry.childAncestries;
			const childrenOrigin = origin.offsetByXY(3, height + 1);
			let sum = -ancestry.visibleProgeny_height() / 2; // start out negative and grow positive
			for (const childAncestry of childAncestries) {
				const tree_layout = new Tree_Geometry(sum, ancestry, childAncestry, childrenOrigin);
				widgetMapRects = u.concatenateArrays(widgetMapRects, tree_layout.widgetMapRects);
				sum += tree_layout.childHeight + 1;
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
		{#each widgetMapRects as map}
			<Widget name={map.element_state.name} ancestry={map.childAncestry} origin={map.extent.offsetBy(widgetOffset)}/>
			<Tree_Line ancestry={map.childAncestry} curveType={map.curveType} rect={map.offsetBy(lineOffset)}/>
			{#if map.childAncestry.showsChildRelationships}
				<Tree_Children ancestry={map.childAncestry} origin={map.childOrigin}/>
			{/if}
		{/each}
	</div>
{/if}
