<script lang='ts'>
	import { T_Layer, T_Signal, T_Radial_Zone, T_Component, S_Component } from '../../ts/common/Global_Imports';
	import { k, u, ux, Rect, Point, layout, g_radial, signals } from '../../ts/common/Global_Imports';
	import { w_g_paging, w_ancestry_focus, w_thing_fontFamily } from '../../ts/managers/Stores';
	import { w_graph_rect, w_user_graph_offset } from '../../ts/managers/Stores';
	import { w_search_show_controls } from '../../ts/managers/Stores';
	import Radial_Rings from './Radial_Rings.svelte';
	import Radial_Focus from './Radial_Focus.svelte';
	import Widget from '../widget/Widget.svelte';
	import { onMount } from 'svelte';
	let s_component: S_Component;
	let reattachments = 0;

	//////////////////////////////////////////////
	//											//
	//	reattaches components on/changes to:	//
	//											//
	//		rebuild_needed_forType radial		//
	//		handle_reattach_widgets				//
	//		w_ancestry_focus					//
	//											//
	//	SHOULD only reposition for:				//
	//											//
	//		w_user_graph_offset					//
	//		w_graph_rect						//
	//											//
	//////////////////////////////////////////////

	// draw center title, arcs, radial and widget necklace
	//	also selection & hover for arcs & radial

	// needs:
	//	handle keys
	//	edit titles (keydown terminates edit) BROKEN
	//	displays editing go when asked by user
	
	layout.grand_layout();

	s_component = signals.handle_signals_atPriority([T_Signal.reattach], 0, null, T_Component.radial, (ancestry) => {
		reattachments += 1;
	});

	signals.handle_signals_atPriority([T_Signal.reposition], 2, null, T_Component.radial, (received_ancestry) => {
		reattachments += 1;
	});

	onMount(() => { return () => s_component.disconnect(); });

	$: {
		const g_paging = $w_g_paging;
		if (!!g_paging && !!$w_ancestry_focus.thing && $w_ancestry_focus.thing.id == g_paging.thing_id) {
			reattachments += 1;
		}
	}

</script>

<div class = 'radial-graph'
	id = {s_component.id}
	style = '
		position: absolute;
		z-index : {T_Layer.graph};
		width : {$w_graph_rect.size.width}px;
		height : {$w_graph_rect.size.height}px;
		transform : translate({$w_user_graph_offset.x}px, {$w_user_graph_offset.y}px);'>
	<Radial_Rings/>
	<Radial_Focus/>
	{#key reattachments}
		<div class = 'necklace-of-widgets'
			style = 'z-index : {T_Layer.necklace};'>
			{#each g_radial.g_necklace_widgets as g_necklace_widget}
				<Widget g_widget = {g_necklace_widget}/>
			{/each}
		</div>
	{/key}
</div>
