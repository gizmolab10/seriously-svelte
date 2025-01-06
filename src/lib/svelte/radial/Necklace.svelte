<script lang='ts'>
	import { s_clusters_geometry, s_ring_rotation_radius, s_ancestry_showing_tools } from '../../ts/state/Svelte_Stores';
	import { s_graphRect, s_paging_state, s_focus_ancestry, s_thing_color } from '../../ts/state/Svelte_Stores';
	import { Predicate, Widget_MapRect, Radial_Geometry } from '../../ts/common/Global_Imports';
	import { k, u, Point, ZIndex, signals } from '../../ts/common/Global_Imports';
	import Widget from '../widget/Widget.svelte';
	import { onMount } from 'svelte';
    const ancestry = $s_focus_ancestry;
	const center = $s_graphRect.size.asPoint.dividedInHalf;
	const childOffset = new Point(k.dot_size / -2, 4 - k.dot_size);
	let color = ancestry.thing?.color ?? k.thing_color_default;
	let tools_widget_map: Widget_MapRect | null = null;
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
		const _ = $s_ancestry_showing_tools;
		tools_widget_map = null;
		setTimeout(() => {
			tools_widget_map = $s_clusters_geometry?.tools_widget_map ?? null;
		}, 1);
	}

	$: {
		if (!!ancestry.thing && ancestry.thing.id == $s_thing_color?.split(k.generic_separator)[0]) {
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
	{#if !!$s_clusters_geometry}
		<div class='necklace-widgets' style='z-index:{ZIndex.backmost};'>
			{#each $s_clusters_geometry.widget_maps as widget_map}
				<Widget
					subtype={widget_map.subtype}
					forward={widget_map.points_right}
					name={widget_map.element_state.name}
					ancestry={widget_map.widget_ancestry}
					origin={widget_map.childOrigin.offsetBy(childOffset)}/>
			{/each}
			{#if tools_widget_map}
				<Widget
					subtype={tools_widget_map.subtype}
					forward={tools_widget_map.points_right}
					name={tools_widget_map.element_state.name}
					ancestry={tools_widget_map.widget_ancestry}
					origin={tools_widget_map.childOrigin.offsetBy(childOffset)}/>
			{/if}
		</div>
	{/if}
{/key}