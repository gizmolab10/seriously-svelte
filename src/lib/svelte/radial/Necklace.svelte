<script lang='ts'>
import { k, u, Point, T_Layer, signals, G_Radial, Predicate } from '../../ts/common/Global_Imports';
	import { w_g_radial, w_s_paging, w_ring_rotation_radius } from '../../ts/state/S_Stores';
	import { w_graph_rect, w_ancestry_focus, w_thing_color } from '../../ts/state/S_Stores';
	import Widget from '../widget/Widget.svelte';
	import { onMount } from 'svelte';
    const ancestry = $w_ancestry_focus;
	const center = $w_graph_rect.size.asPoint.dividedInHalf;
	let color = ancestry.thing?.color ?? k.thing_color_default;
	let rebuilds = 0;

	// draw widgets, lines and arcs

	onMount(() => {
		const handleAny = signals.handle_anySignal_atPriority(0, (t_signal, signal_ancestry) => {
			rebuilds += 1;
		});
		return () => {
			handleAny.disconnect();
		};
	});

	$: {
		if (!!ancestry.thing && ancestry.thing.id == $w_thing_color?.split(k.generic_separator)[0]) {
			color = ancestry.thing?.color ?? k.thing_color_default;
			rebuilds += 1;
		}
	}

	$: {
		const s_paging = $w_s_paging;
		if (!!s_paging && !!ancestry.thing && ancestry.thing.id == s_paging.thing_id) {
			rebuilds += 1;
		}
	}

</script>

{#key rebuilds}
	{#if !!$w_g_radial}
		<div
			class = 'necklace-widgets'
			style = 'z-index : {T_Layer.backmost};'>
			{#each $w_g_radial.g_widgets as g_widget}
				<Widget g_widget = {g_widget} origin = {g_widget.origin_radial}/>
			{/each}
		</div>
	{/if}
{/key}