<script lang='ts'>
	import { s_graph_rect, s_s_paging, s_ancestry_focus, s_thing_color } from '../../ts/state/S_Stores';
	import { Predicate, G_Widget, G_Radial } from '../../ts/common/Global_Imports';
	import { s_g_radial, s_ring_rotation_radius } from '../../ts/state/S_Stores';
	import { k, u, Point, T_Layer, signals } from '../../ts/common/Global_Imports';
	import Widget from '../widget/Widget.svelte';
	import { onMount } from 'svelte';
    const ancestry = $s_ancestry_focus;
	const center = $s_graph_rect.size.asPoint.dividedInHalf;
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
		const s_paging = $s_s_paging;
		if (!!s_paging && !!ancestry.thing && ancestry.thing.id == s_paging.thing_id) {
			rebuilds += 1;
		}
	}

</script>

{#key rebuilds}
	{#if !!$s_g_radial}
		<div class='necklace-widgets' style='z-index:{T_Layer.backmost};'>
			{#each $s_g_radial.g_widgets as g_widget}
				<Widget
					name={g_widget.s_element.name}
					ancestry={g_widget.widget_ancestry}
					points_right={g_widget.points_right}
					points_toChild={g_widget.points_toChild}
					origin={g_widget.child_origin.offsetBy(childOffset)}/>
			{/each}
		</div>
	{/if}
{/key}