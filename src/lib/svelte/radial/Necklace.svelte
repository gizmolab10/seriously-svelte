<script lang='ts'>
	import { s_graphRect, s_paging_state, s_ancestry_focus, s_thing_color } from '../../ts/state/S_Stores';
	import { Predicate, G_Widget, Radial_Geometry } from '../../ts/common/Global_Imports';
	import { s_radial_geometry, s_ring_rotation_radius } from '../../ts/state/S_Stores';
	import { k, u, Point, T_Layer, signals } from '../../ts/common/Global_Imports';
	import Widget from '../widget/Widget.svelte';
	import { onMount } from 'svelte';
    const ancestry = $s_ancestry_focus;
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
	{#if !!$s_radial_geometry}
		<div class='necklace-widgets' style='z-index:{T_Layer.backmost};'>
			{#each $s_radial_geometry.g_widgets as g_widget}
				<Widget
					name={g_widget.element_state.name}
					ancestry={g_widget.widget_ancestry}
					points_right={g_widget.points_right}
					points_toChild={g_widget.points_toChild}
					origin={g_widget.child_origin.offsetBy(childOffset)}/>
			{/each}
		</div>
	{/if}
{/key}