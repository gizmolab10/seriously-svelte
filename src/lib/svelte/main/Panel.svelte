<script lang='ts'>
	import { c, e, h, k, u, ux, w, show, Rect, Size, Point, Thing, colors, layout } from '../../ts/common/Global_Imports';
	import { w_t_database, w_graph_rect, w_hierarchy, w_background_color } from '../../ts/common/Stores';
	import { debug, T_Layer, T_Banner, Ancestry, T_Startup } from '../../ts/common/Global_Imports';
	import { w_s_text_edit, w_show_details, w_device_isMobile, } from '../../ts/common/Stores';
	import { T_Control, Hierarchy, databases, Direction } from '../../ts/common/Global_Imports';
	import { w_t_startup, w_popupView_id, w_ancestry_focus } from '../../ts/common/Stores';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import { T_Database } from '../../ts/database/DBCommon';
	import Gull_Wings from '../kit/Gull_Wings.svelte';
	import Separator from '../kit/Separator.svelte';
	import Details from '../details/Details.svelte';
	import Breadcrumbs from './Breadcrumbs.svelte';
	import BuildNotes from './BuildNotes.svelte';
	import Debug from '../debug/Debug.svelte';
	import Graph from '../graph/Graph.svelte';
	import Controls from './Controls.svelte';
	import Box from '../debug/Box.svelte';
	import Import from './Import.svelte';
	import { onMount } from 'svelte';
	const offset_toIntersection = new Point(-4, 8);
	let separator_color = colors.separator;
	let panel_reattachments = 0;
	let chain = ['Panel'];

	$: $w_t_database, $w_t_startup, $w_graph_rect, update_panel();
	$: $w_background_color, separator_color = colors.separator;
	function ignore_wheel(event) { event.preventDefault(); }

	function update_panel() {
		setTimeout(() => {
			if (!!h && h.isAssembled) {
				panel_reattachments += 1;
			}
		}, 0);
	}

</script>

{#key panel_reattachments}
	<Debug/>
	<div style='
		touch-action: none;
		pointer-events: auto;
		{k.prevent_selection_style};
		width: {w.windowSize.width}px;
		height: {w.windowSize.height}px;'
		on:wheel={ignore_wheel}>
		{#if [T_Startup.start, T_Startup.fetch].includes($w_t_startup) && databases.db_now.isPersistent}
			<p>Welcome to Seriously</p>
			{#if $w_t_startup == T_Startup.fetch}
				<p>{databases.startupExplanation}</p>
			{/if}
		{:else if $w_t_startup == T_Startup.empty}
			<p>Nothing is available.</p>
		{:else if $w_t_startup == T_Startup.ready}
			<Controls/>
			<Separator
				hasBothEnds={true}
				isHorizontal={false}
				has_thin_divider={false}
				margin={k.details_margin}
				zindex={T_Layer.frontmost}
				thickness={k.thickness.separator.thick}
				length={$w_graph_rect.size.height + 10}
				corner_radius={k.radius.gull_wings.thick}
				origin={new Point(2, layout.graph_top - 4)}/>
			<Separator
				hasBothEnds={true}
				isHorizontal={false}
				has_thin_divider={false}
				margin={k.details_margin}
				zindex={T_Layer.frontmost}
				thickness={k.thickness.separator.thick}
				length={$w_graph_rect.size.height + 10}
				corner_radius={k.radius.gull_wings.thick}
				origin={new Point(w.windowSize.width - 2, layout.graph_top - 4)}/>
			{#if !$w_popupView_id && $w_show_details}
				<Details/>
			{/if}
			<div class='right-side'
				style='
					top: 0px;
					height: 100%;
					position: fixed;
					z-index: {T_Layer.common};
					left: {$w_graph_rect.origin.x}px;'>
				{#key $w_popupView_id}
					{#if $w_popupView_id == T_Control.builds}
						<BuildNotes/>
					{:else if $w_popupView_id == T_Control.import}
						<Import/>
					{:else if !$w_popupView_id}
						<Graph/>
					{/if}
				{/key}
			</div>
			{#if !$w_popupView_id}
				<Breadcrumbs/>
			{/if}
		{/if}
	</div>
{/key}

<style>
	p {
		text-align: center;
		font-size: 1.3em;
	}
	.horizontal-line {
		position: fixed;
		width: 110%;
		left: 0px;
	}
</style>
