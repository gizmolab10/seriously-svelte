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
	const separator_thickness = k.thickness.separator;
	let separator_color = colors.separator;
	let tops = layout.tops_ofBanners;
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

<svelte:document on:keydown={e.handle_key_down}/>
{#key panel_reattachments}
	<Debug/>
	<div style='
		touch-action: none;
		pointer-events: auto;
		{k.prevent_selection_style};'
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
			{#if !$w_popupView_id}
				<div class='breadcrumbs'
					style='left:0px;
						position: absolute;
						z-index: {T_Layer.frontmost};
						width:{w.windowSize.width}px;
						top:{tops[T_Banner.crumbs] - 2}px;
						height:{layout.height_ofBannerAt(T_Banner.crumbs)}px;'>
					<Breadcrumbs/>
					<div class='separator-above-crumbs' style='
						top: {tops[T_Banner.crumbs] - 3}px;
						background-color:{separator_color};
						height: {separator_thickness}px;
						z-index: {T_Layer.lines};'>
					</div>
				</div>
				<div class='separator-below-crumbs' style='
					background-color: {separator_color};
					height: {separator_thickness}px;
					width: {w.windowSize.width}px;
					top: {tops[T_Banner.graph]}px;
					z-index: {T_Layer.lines};
					position: absolute;
					left: 0px;'>
				</div>
				{#if $w_show_details}
					<Details/>
					<Separator
						add_wings={true}
						isHorizontal={false}
						left={k.width_details}
						margin={k.details_margin}
						top={tops[T_Banner.graph] + 1}
						thickness={k.thickness.normal}
						height={$w_graph_rect.size.height + 7}
						corner_radius={k.radius.gull_wings.common}/>
				{/if}
			{/if}
			<div class='right-side'
				style='
					height: 100%;
					position: fixed;
					z-index: {T_Layer.common};
					top: 0px;
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
		{/if}
	</div>
{/key}

<style>
	p {
		text-align: center;
		font-size: 3em;
	}
	.horizontal-line {
		position: fixed;
		width: 110%;
		left: 0px;
	}
</style>
