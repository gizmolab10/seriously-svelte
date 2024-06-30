<script lang='ts'>
	import { s_clusters_page_states, s_graphRect, s_thing_changed, s_ancestry_focus, s_cluster_arc_radius } from '../../ts/state/Reactive_State';
	import { g, k, s, u, get, Point, ZIndex, signals, onMount, Predicate, onDestroy } from '../../ts/common/Global_Imports';
	import { Widget_MapRect, Clusters_Geometry, transparentize } from '../../ts/common/Global_Imports';
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
		if (!!$s_clusters_page_states && !!geometry) {		// ignore null at startup
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
					name={widget_map.element_state.name}
					ancestry={widget_map.childAncestry}
					origin={widget_map.childOrigin.offsetBy(childOffset)}/>
			{/each}
		</div>
	{/if}
{/key}