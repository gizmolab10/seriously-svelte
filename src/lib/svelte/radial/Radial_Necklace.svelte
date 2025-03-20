<script lang='ts'>
	import { k, u, ux, Point, debug, signals, Predicate } from '../../ts/common/Global_Imports';
	import { w_graph_rect, w_ancestry_focus, w_color_trigger } from '../../ts/common/Stores';
	import { T_Layer, T_Widget, T_Signal } from '../../ts/common/Global_Imports';
	import { w_s_paging, w_ring_rotation_radius } from '../../ts/common/Stores';
	import Widget from '../widget/Widget.svelte';
	import { onMount } from 'svelte';
    const ancestry = $w_ancestry_focus;
	const center = $w_graph_rect.size.asPoint.dividedInHalf;
	let color = ancestry.thing?.color ?? k.thing_color_default;
	let necklace_rebuilds = 0;

	
	//////////////////////////////////////////
	//										//
	//	draw widgets, lines and arcs		//
	//										//
	//	REBUILDS components on/changes to:	//
	//										//
	//		handle_anySignal				//
	//		w_ancestry_focus				//
	//		w_s_paging						//
	//										//
	//	SHOULD only reposition for:			//
	//										//
	//		w_color_trigger					//
	//		w_graph_rect					//
	//										//
	//////////////////////////////////////////
	
	debug.log_build(`NECKLACE  ${ancestry.title}`);

	onMount(() => {
		const handleAny = signals.handle_anySignal_atPriority(0, (t_signal, signal_ancestry) => {
			necklace_rebuilds += 1;
			// switch (t_signal) {
			// 	case T_Signal.recreate: necklace_rebuilds += 1; break;
			// 	case T_Signal.reposition: break;
			// }
		});
		return () => {
			handleAny.disconnect();
		};
	});

	$: {
		if (!!ancestry.thing && ancestry.thing.id == $w_color_trigger?.split(k.generic_separator)[0]) {
			color = ancestry.thing?.color ?? k.thing_color_default;
			necklace_rebuilds += 1;
		}
	}

	$: {
		const s_paging = $w_s_paging;
		if (!!s_paging && !!ancestry.thing && ancestry.thing.id == s_paging.thing_id) {
			necklace_rebuilds += 1;
		}
	}

</script>

{#key necklace_rebuilds}
	{#if !!ux.g_radialGraph}
		<div
			class = 'necklace-widgets'
			style = 'z-index : {T_Layer.backmost};'>
			{#each ux.g_radialGraph.g_necklace_widgets as g_necklace_widget}
				<Widget ancestry = {g_necklace_widget.ancestry}/>
			{/each}
		</div>
	{/if}
{/key}