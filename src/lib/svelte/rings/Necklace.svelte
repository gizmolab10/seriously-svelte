<script lang='ts'>
	import { s_graphRect, s_paging_state, s_ancestry_focus, s_thing_changed } from '../../ts/state/Reactive_State';
	import { s_clusters_geometry, s_rotation_ring_radius } from '../../ts/state/Reactive_State';
	import { k, u, get, Point, ZIndex, signals, onMount } from '../../ts/common/Global_Imports';
	import { onDestroy, Predicate, Clusters_Geometry } from '../../ts/common/Global_Imports';
	import Widget from '../widget/Widget.svelte';
	import { h } from '../../ts/db/DBDispatch';
    const ancestry = $s_ancestry_focus;
	const center = $s_graphRect.size.dividedInHalf.asPoint;
	const childOffset = new Point(k.dot_size / -2, 4 - k.dot_size);
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
		if (!!ancestry.thing && ancestry.thing.id == $s_thing_changed?.split(k.generic_separator)[0]) {
			color = ancestry.thing?.color ?? k.color_default;
			rebuilds += 1;
		}
	}

	$: {
		const state = $s_paging_state;
		if (!!state && !!ancestry.thing && ancestry.thing.id == state.thing_id) {
			rebuilds += 1;
		}
	}

</script>

{#key rebuilds}
	{#if $s_clusters_geometry}
		<div class='necklace-widgets' style='z-index:{ZIndex.panel};'>
			{#each $s_clusters_geometry.widget_maps as widget_map}
				<Widget
					subtype={widget_map.subtype}
					forward={widget_map.points_right}
					ancestry={widget_map.childAncestry}
					name={widget_map.element_state.name}
					origin={widget_map.childOrigin.offsetBy(childOffset)}/>
			{/each}
		</div>
	{/if}
{/key}