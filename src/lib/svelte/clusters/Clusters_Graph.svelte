<script lang='ts'>
	import { g, k, s, u, get, Point, ZIndex, signals, onMount, Predicate, onDestroy } from '../../ts/common/Global_Imports';
	import { s_graphRect, s_page_state, s_thing_changed, s_ancestry_focus, s_rotation_ring_radius } from '../../ts/state/Reactive_State';
	import { Widget_MapRect, Clusters_Geometry } from '../../ts/common/Global_Imports';
	import Widget from '../widget/Widget.svelte';
	import { h } from '../../ts/db/DBDispatch';
    const ancestry = $s_ancestry_focus;
	const geometry = s.clusters_geometry;
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
		if (ancestry.thing.id == $s_thing_changed.split(k.generic_separator)[0]) {
			color = ancestry.thing?.color ?? k.color_default;
			rebuilds += 1;
		}
	}

	$: {
		const state = $s_page_state;
		if (!!state && !!ancestry.thing && ancestry.thing.id == state.thing_id) {
			rebuilds += 1;
		}
	}

	$: {
		if (!!geometry) {		// ignore null at startup
			geometry.layoutAll_clusters();
			rebuilds += 1;
		}
	}

</script>

{#key rebuilds}
	{#if geometry}
		<div class='rotation-ring-widgets' style='z-index:{ZIndex.panel};'>
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