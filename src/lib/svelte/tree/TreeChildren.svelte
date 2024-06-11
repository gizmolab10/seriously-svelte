<script lang=ts>
	import { k, u, Rect, Size, Point, Thing, debug, IDLine, onMount } from '../../ts/common/GlobalImports';
	import { signals, onDestroy, DebugFlag, debugReact, TreeLayout } from '../../ts/common/GlobalImports';
	import { s_graphRect } from '../../ts/state/ReactiveState';
	import TreeChildren from './TreeChildren.svelte';
	import Widget from '../widget/Widget.svelte';
	import Circle from '../kit/Circle.svelte';
	import TreeLine from './TreeLine.svelte';
	export let origin = Point.zero;
    export let ancestry;
	const widgetOffset = new Point(12, (k.dot_size / -15) - 7);
	const lineOffset = new Point(-122.5, 2.5);
	let childMapRects: Array<ChildMapRect> = [];
	let priorTime = new Date().getTime();
	let center = Point.zero;
	
	onDestroy(() => { childMapRects = []; });

	onMount(() => {
		layout();
		const handler = signals.handle_relayoutWidgets(1, (signal_ancestry) => {
			const now = new Date().getTime();
			if (ancestry.isExpanded &&
				((now - priorTime) > 100) &&
				(!signal_ancestry || signal_ancestry.matchesAncestry(ancestry))) {
				priorTime = now;
				debugReact.log_origins(origin.x + ' before timeout');
				layout();
			}
		});
		return () => { handler.disconnect() };
	});
	
	$: {
		if ($s_graphRect) {
			layout()
		}
	}
	
	function layout() {
		childMapRects = [];
		if (ancestry.isExpanded) {
			debugReact.log_origins(origin.x + ' children layout');
			const height = ancestry.visibleProgeny_halfHeight;
			const childAncestries = ancestry.childAncestries;
			const childrenOrigin = origin.offsetByY(height);
			let sum = -ancestry.visibleProgeny_height() / 2; // start out negative and grow positive
			for (const childAncestry of childAncestries) {
				const tree_layout = new TreeLayout(sum, ancestry, childAncestry, childrenOrigin);
				childMapRects = u.concatenateArrays(childMapRects, tree_layout.childMapRects);
				sum += tree_layout.childHeight;
			}
			center = childrenOrigin.offsetByXY(17.9, -1.4);
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
		{#each childMapRects as map}
			<Widget ancestry={map.childAncestry} origin={map.extent.offsetBy(widgetOffset)}/>
			<TreeLine ancestry={map.childAncestry} curveType={map.curveType} rect={map.offsetBy(lineOffset)}/>
			{#if map.childAncestry.showsChildRelationships}
				<TreeChildren ancestry={map.childAncestry} origin={map.childOrigin}/>
			{/if}
		{/each}
	</div>
{/if}
