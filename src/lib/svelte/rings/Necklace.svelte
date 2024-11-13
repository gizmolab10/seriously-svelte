<script lang='ts'>
	import { s_graphRect, s_paging_state, s_focus_ancestry, s_color_thing } from '../../ts/state/Svelte_Stores';
	import { s_clusters_geometry, s_ring_rotation_radius } from '../../ts/state/Svelte_Stores';
	import { k, u, get, Point, ZIndex, signals, onMount } from '../../ts/common/Global_Imports';
	import { onDestroy, Predicate, Clusters_Geometry } from '../../ts/common/Global_Imports';
	import Widget from '../widget/Widget.svelte';
    const ancestry = $s_focus_ancestry;
	const center = $s_graphRect.size.asPoint.dividedInHalf;
	const childOffset = new Point(k.dot_size / -2, 4 - k.dot_size);
	let color = ancestry.thing?.color ?? k.thing_color_default;
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
		if (!!ancestry.thing && ancestry.thing.id == $s_color_thing?.split(k.generic_separator)[0]) {
			color = ancestry.thing?.color ?? k.thing_color_default;
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
		<div class='necklace-widgets' style='z-index:{ZIndex.backmost};'>
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