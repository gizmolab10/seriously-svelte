<script lang='ts'>
	import { g, k, s, u, Point, ZIndex, signals, onMount, onDestroy, Predicate } from '../../ts/common/GlobalImports';
	import { debugReact, ChildMapRect, ClusterLayout, transparentize } from '../../ts/common/GlobalImports';
	import { s_thing_changed, s_ancestry_focus, s_cluster_arc_radius } from '../../ts/state/ReactiveState';
	import ClusterLine from './ClusterLine.svelte';
	import ClusterArc from './ClusterArc.svelte';
	import Widget from '../widget/Widget.svelte';
	import { h } from '../../ts/db/DBDispatch';
	export let center = Point.zero;
    const ancestry = $s_ancestry_focus;
	const childOffset = new Point(k.dot_size / -3, k.cluster_offsetY);
	let color = ancestry.thing?.color ?? k.color_default;
	let clusterLayouts: Array<ClusterLayout> = [];
	let childMapRects: Array<ChildMapRect> = [];
	let rebuilds = 0;
	
	onMount(() => {
		let childAncestries = ancestry.childAncestries;
		layout(childAncestries, Predicate.contains, true);
		for (const predicate of h.predicates) {
			let oneAncestries = ancestry.thing?.oneAncestries_for(predicate) ?? [];
			layout(oneAncestries, predicate, false);
		}
		rebuilds += 1;
		const handleAny = signals.handle_anySignal((signal_ancestry) => {
			rebuilds += 1;
		});
		return () => {
			handleAny.disconnect();
		};
	});

	onDestroy(() => {
		clusterLayouts.forEach(l => l.destroy());
		clusterLayouts = [];
		childMapRects = [];
	});

	$: {
		if (ancestry.thing.id == $s_thing_changed.split(k.genericSeparator)[0]) {
			color = ancestry.thing?.color ?? k.color_default;
			rebuilds += 1;
		}
	}

	function layout(ancestries: Array<Ancestry>, predicate: Predicate | null, points_out: boolean) {
		const clusterLayout = new ClusterLayout(ancestry, ancestries, predicate, points_out);
		childMapRects = u.concatenateArrays(childMapRects, clusterLayout.childMapRects(center));	// for necklace of widgets
		clusterLayouts.push(clusterLayout);		// for lines and arcs
	}

</script>

{#key rebuilds}
	<div class='necklace-widgets'>
		{#each childMapRects as map}
			<Widget ancestry={map.childAncestry} angle={map.childAngle} subtype={map.subtype} origin={map.childOrigin.offsetBy(childOffset)}/>
		{/each}
	</div>
	<div class='lines-and-arcs'>
		{#each clusterLayouts as cluster}
			{#if cluster.count > 0}
				<ClusterLine clusterLayout={cluster} center={center} color={color}/>
				{#if cluster.count > 1}
					<ClusterArc clusterLayout={cluster} center={center} color={color}/>
				{/if}
			{/if}
		{/each}
	</div>
{/key}