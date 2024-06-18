<script lang='ts'>
	import { g, k, s, u, get, Point, ZIndex, signals, onMount, Predicate, onDestroy } from '../../ts/common/GlobalImports';
	import { s_graphRect, s_thing_changed, s_ancestry_focus, s_cluster_arc_radius } from '../../ts/state/ReactiveState';
	import { WidgetMapRect, ClustersGeometry, transparentize } from '../../ts/common/GlobalImports';
	import ClusterLine from './ClusterLine.svelte';
	import ClusterArc from './ClusterArc.svelte';
	import Widget from '../widget/Widget.svelte';
	import { h } from '../../ts/db/DBDispatch';
	import Advance from './Advance.svelte';
    const ancestry = $s_ancestry_focus;
	const center = $s_graphRect.size.dividedInHalf.asPoint;
	const childOffset = new Point(k.dot_size / -2, k.cluster_offsetY);
	let color = ancestry.thing?.color ?? k.color_default;
	let geometry!: ClustersGeometry;
	let rebuilds = 0;

	onMount(() => {
		geometry = new ClustersGeometry();
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
	{#if geometry}
		<div class='necklace-widgets'>
			{#each geometry.widget_maps as widget_map}
				<Widget
					subtype={widget_map.subtype}
					angle={widget_map.childAngle}
					name={widget_map.elementState.name}
					ancestry={widget_map.childAncestry}
					origin={widget_map.childOrigin.offsetBy(childOffset)}/>
			{/each}
		</div>
		<div class='lines-and-arcs'>
			{#each geometry.cluster_maps as cluster_map}
				{#if cluster_map.count > 0}
					<Advance cluster_map={cluster_map} isForward={false}/>
					<ClusterLine cluster_map={cluster_map} center={center} color={color}/>
					{#if cluster_map.count > 1}
						<ClusterArc cluster_map={cluster_map} center={center} color={color}/>
					{/if}
					<Advance cluster_map={cluster_map} isForward={true}/>
				{/if}
			{/each}
		</div>
	{/if}
{/key}