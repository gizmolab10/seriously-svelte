<script lang='ts'>
	import { g, k, s, u, get, Point, ZIndex, signals, onMount, onDestroy, Predicate } from '../../ts/common/GlobalImports';
	import { s_indices_cluster, s_indices_reversed, s_cluster_arc_radius } from '../../ts/state/ReactiveState';
	import { debugReact, ChildMapRect, ClusterLayout, transparentize } from '../../ts/common/GlobalImports';
	import { s_thing_changed, s_ancestry_focus } from '../../ts/state/ReactiveState';
	import ClusterLine from './ClusterLine.svelte';
	import ClusterArc from './ClusterArc.svelte';
	import Widget from '../widget/Widget.svelte';
	import { h } from '../../ts/db/DBDispatch';
	import Advance from './Advance.svelte';
	export let center = Point.zero;
    const ancestry = $s_ancestry_focus;
	const childOffset = new Point(k.dot_size / -2, k.cluster_offsetY);
	let color = ancestry.thing?.color ?? k.color_default;
	let clusterLayouts: Array<ClusterLayout> = [];
	let childMapRects: Array<ChildMapRect> = [];
	let rebuilds = 0;
	
	onMount(() => {
		const thing = ancestry.thing;
		let childAncestries = ancestry.childAncestries;
		layout(childAncestries, Predicate.contains, true);
		if (!!thing) {
			for (const predicate of h.predicates) {
				let ancestries = ancestry.thing?.uniqueAncestries_for(predicate) ?? [];
				layout(ancestries, predicate, false);
			}
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

	function onePage_from(ancestries: Array<Ancestry>, predicate: Predicate, points_out: boolean): Array<Ancestry> {
		const indices = points_out ? get(s_indices_cluster) : get(s_indices_reversed);
		const maxFit = Math.round($s_cluster_arc_radius * 2 / k.row_height) - 2;
		const predicateIndex = predicate.stateIndex;
		const pageIndex = indices[predicateIndex];	// make sure it exists: hierarchy
		return ancestries.slice(pageIndex, pageIndex + maxFit);
	}

	function layout(ancestries: Array<Ancestry>, predicate: Predicate | null, points_out: boolean) {
		const onePage = onePage_from(ancestries, predicate, points_out);
		const clusterLayout = new ClusterLayout(ancestry, onePage, predicate, points_out);
		childMapRects = u.concatenateArrays(childMapRects, clusterLayout.childMapRects(center));	// for necklace of widgets
		clusterLayouts.push(clusterLayout);		// for lines and arcs
	}

</script>

{#key rebuilds}
	<div class='necklace-widgets'>
		{#each childMapRects as map}
			<Widget name={map.elementState.name} ancestry={map.childAncestry} angle={map.childAngle} subtype={map.subtype} origin={map.childOrigin.offsetBy(childOffset)}/>
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