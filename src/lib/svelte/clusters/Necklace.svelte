<script lang='ts'>
	import { g, k, s, u, get, Point, ZIndex, signals, onMount, onDestroy } from '../../ts/common/GlobalImports';
	import { s_indices_cluster, s_indices_reversed, s_cluster_arc_radius } from '../../ts/state/ReactiveState';
	import { Predicate, ChildMapRect, ClustersGeometry, transparentize } from '../../ts/common/GlobalImports';
	import { s_thing_changed, s_ancestry_focus } from '../../ts/state/ReactiveState';
	import ClusterLine from './ClusterLine.svelte';
	import ClusterArc from './ClusterArc.svelte';
	import Widget from '../widget/Widget.svelte';
	import { h } from '../../ts/db/DBDispatch';
	import Advance from './Advance.svelte';
	export let center = Point.zero;
    const ancestry = $s_ancestry_focus;
	const geometry = new ClustersGeometry(center);
	const childOffset = new Point(k.dot_size / -2, k.cluster_offsetY);
	let color = ancestry.thing?.color ?? k.color_default;
	let rebuilds = 0;
	
	onDestroy(() => { geometry.destructor(); });

	onMount(() => {
		rebuilds += 1;
		const handleAny = signals.handle_anySignal((signal_ancestry) => {
			rebuilds += 1;
		});
		return () => {
			handleAny.disconnect();
		};
	});

	$: {
		if (ancestry.thing.id == $s_thing_changed.split(k.genericSeparator)[0]) {
			color = ancestry.thing?.color ?? k.color_default;
			rebuilds += 1;
		}
	}

</script>

{#key rebuilds}
	<div class='necklace-widgets'>
		{#each geometry.childMapRects as map}
			<Widget
				subtype={map.subtype}
				angle={map.childAngle}
				name={map.elementState.name}
				ancestry={map.childAncestry}
				origin={map.childOrigin.offsetBy(childOffset)}/>
		{/each}
	</div>
	<div class='lines-and-arcs'>
		{#each geometry.layouts as layout}
			{#if layout.count > 0}
				<Advance layout={layout} isForward={false}/>
				<ClusterLine layout={layout} center={center} color={color}/>
				{#if layout.count > 1}
					<ClusterArc layout={layout} center={center} color={color}/>
				{/if}
				<Advance layout={layout} isForward={true}/>
			{/if}
		{/each}
	</div>
{/key}