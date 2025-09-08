<script lang='ts'>
	import { c, e, h, k, u, ux, show, Rect, Size, Point, Thing, search, layout } from '../../ts/common/Global_Imports';
	import { debug, colors, Ancestry, Hierarchy, databases, Direction } from '../../ts/common/Global_Imports';
	import { w_hierarchy, w_graph_rect, w_t_database, w_background_color } from '../../ts/managers/Stores';
	import { T_Layer, T_Search, T_Banner, T_Control, T_Startup } from '../../ts/common/Global_Imports';
	import { w_t_startup, w_popupView_id, w_device_isMobile, } from '../../ts/managers/Stores';
	import { w_s_title_edit, w_ancestry_focus } from '../../ts/managers/Stores';
	import { w_show_details, w_show_results } from '../../ts/managers/Stores';
	import { T_Database } from '../../ts/database/DB_Common';
	import Search_Results from './Search_Results.svelte';
	import Controls from '../controls/Controls.svelte';
	import Separator from '../mouse/Separator.svelte';
	import Details from '../details/Details.svelte';
	import BuildNotes from './BuildNotes.svelte';
	import Graph from '../graph/Graph.svelte';
	import Box from '../mouse/Box.svelte';
	import Import from './Import.svelte';
	import { onMount } from 'svelte';
	const offset_toIntersection = new Point(-4, 8);
    const half_thickness: number = k.thickness.separator.main / 2;
	let reattachments = 0;

	function ignore_wheel(event) { event.preventDefault(); }

	$: {
		const _ = `${$w_t_database}:::${$w_t_startup}:::${$w_graph_rect.description}`;
		if (!!h && h.isAssembled) {
			debug.log_draw(`PANEL`);
			reattachments += 1;
		}
	}

</script>

{#key reattachments}
	<div
		class='panel'
		style='
			top: 0px;
			left: 0px;
			position: fixed;
			on:wheel={ignore_wheel}
			{k.prevent_selection_style};
			width: {layout.windowSize.width}px;
			height: {layout.windowSize.height}px;'>
		{#if $w_popupView_id == T_Control.builds}
			<BuildNotes/>
		{:else if $w_popupView_id == T_Control.import}
			<Import/>
		{:else}
			<Controls/>
			{#if $w_show_details}
				<Details/>
			{/if}
			<div class='main'
				style='
					position: fixed;
					z-index: {T_Layer.graph};
					top: {$w_graph_rect.origin.y}px;
					left: {$w_graph_rect.origin.x}px;
					width: {$w_graph_rect.size.width}px;
					height: {$w_graph_rect.size.height}px;'>
				{#if $w_show_results}
					<Search_Results/>
				{:else}
					<Graph/>
				{/if}
			</div>
			<Separator name='panel-box-left'
				isHorizontal={false}
				has_both_wings={true}
				margin={k.details_margin}
				zindex={T_Layer.frontmost}
				thickness={k.thickness.separator.main}
				corner_radius={k.radius.gull_wings.thick}
				length={$w_graph_rect.size.height + k.thickness.extra}
				origin={new Point(2, layout.controls_boxHeight - 0.5)}/>
			<Separator name='panel-box-right'
				isHorizontal={false}
				has_both_wings={true}
				margin={k.details_margin}
				zindex={T_Layer.frontmost}
				thickness={k.thickness.separator.main}
				corner_radius={k.radius.gull_wings.thick}
				length={$w_graph_rect.size.height + k.thickness.extra}
				origin={new Point(layout.windowSize.width + 1 - half_thickness, layout.controls_boxHeight - 0.5)}/>
		{/if}
		<Separator name='panel-box-bottom'
			isHorizontal={true}
			has_both_wings={true}
			margin={k.details_margin}
			zindex={T_Layer.frontmost}
			length={layout.windowSize.width + 3}
			thickness={k.thickness.separator.main}
			corner_radius={k.radius.gull_wings.thick}
			origin={new Point(2, layout.windowSize.height - 4)}/>
	</div>
{/key}
	