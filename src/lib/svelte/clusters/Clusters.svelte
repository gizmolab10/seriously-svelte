<script lang='ts'>
	import { s_clusters, s_graphRect, s_thing_changed, s_ancestry_focus, s_cluster_arc_radius } from '../../ts/state/ReactiveState';
	import { g, k, s, u, get, Point, ZIndex, signals, onMount, Predicate, onDestroy } from '../../ts/common/GlobalImports';
	import { Widget_MapRect, Clusters_Geometry, transparentize } from '../../ts/common/GlobalImports';
	import Cluster_Line from './Cluster_Line.svelte';
	import Cluster_Arc from './Cluster_Arc.svelte';
	import Widget from '../widget/Widget.svelte';
	import { h } from '../../ts/db/DBDispatch';
	export let geometry!: Clusters_Geometry;
    const ancestry = $s_ancestry_focus;
	const center = $s_graphRect.size.dividedInHalf.asPoint;
	const childOffset = new Point(k.dot_size / -2, k.cluster_offsetY);
	let color = ancestry.thing?.color ?? k.color_default;
	let rebuilds = 0;

	// draw widgets, lines and arcs

	onMount(() => {
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

	$: {
		const state = $s_clusters;
		if (!!state && !!geometry) {		// ignore null at startup
			geometry.layout();
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
			{#each geometry.cluster_maps as cluster_maps}
				{#if cluster_maps.count > 0}
					<Cluster_Line cluster_maps={cluster_maps} center={center} color={color}/>
					{#if cluster_maps.count > 1}
						<Cluster_Arc cluster_maps={cluster_maps} center={center} color={color}/>
					{/if}
				{/if}
			{/each}
		</div>
	{/if}
{/key}