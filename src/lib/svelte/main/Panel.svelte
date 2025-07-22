<script lang='ts'>
	import { c, e, h, k, u, ux, show, Rect, Size, Point, Thing, colors, layout } from '../../ts/common/Global_Imports';
	import { w_t_database, w_graph_rect, w_hierarchy, w_background_color } from '../../ts/common/Stores';
	import { debug, T_Layer, T_Banner, Ancestry, T_Startup } from '../../ts/common/Global_Imports';
	import { T_Control, Hierarchy, databases, Direction } from '../../ts/common/Global_Imports';
	import { w_s_text_edit, w_show_details, w_device_isMobile, } from '../../ts/common/Stores';
	import { w_t_startup, w_popupView_id, w_ancestry_focus } from '../../ts/common/Stores';
	import { T_Database } from '../../ts/database/DB_Common';
	import Separator from '../mouse/Separator.svelte';
	import Details from '../details/Details.svelte';
	import Breadcrumbs from './Breadcrumbs.svelte';
	import BuildNotes from './BuildNotes.svelte';
	import Graph from '../graph/Graph.svelte';
	import Controls from './Controls.svelte';
	import Box from '../mouse/Box.svelte';
	import Import from './Import.svelte';
	import { onMount } from 'svelte';
	const offset_toIntersection = new Point(-4, 8);
    const half_thickness: number = k.thickness.separator.main / 2;
	let separator_color = colors.separator;
	let panel_reattachments = 0;

	function ignore_wheel(event) { event.preventDefault(); }

	$: {
		const _ = $w_t_database + $w_t_startup + $w_graph_rect.description;
		update_panel();
	}

	$: {
		const _ = $w_background_color;
		separator_color = colors.separator;
	}

	function update_panel() {
		setTimeout(() => {
			if (!!h && h.isAssembled) {
				panel_reattachments += 1;
			}
		}, 0);
	}

</script>

{#key panel_reattachments}
	<div
		class='panel'
		style='
			touch-action: none;
			pointer-events: auto;
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
			<div class='graph-container'
				style='
					top: 0px;
					height: 100%;
					position: fixed;
					z-index: {T_Layer.common};
					left: {$w_graph_rect.origin.x}px;'>
				<Graph/>
			</div>
			<Separator
				name='panel-left'
				isHorizontal={false}
				has_both_wings={true}
				margin={k.details_margin}
				zindex={T_Layer.frontmost}
				thickness={k.thickness.separator.main}
				length={$w_graph_rect.size.height + 11}
				corner_radius={k.radius.gull_wings.thick}
				origin={new Point(2, layout.controls_boxHeight - 0.5)}/>
			<Separator
				name='panel-right'
				isHorizontal={false}
				has_both_wings={true}
				margin={k.details_margin}
				zindex={T_Layer.frontmost}
				thickness={k.thickness.separator.main}
				length={$w_graph_rect.size.height + 11}
				corner_radius={k.radius.gull_wings.thick}
				origin={new Point(layout.windowSize.width + 1 - half_thickness, layout.controls_boxHeight - 0.5)}/>
		{/if}
		{#if c.has_full_UI}
			<div class='breadcrumbs'
				style='left:0px;
					width:100%;
					position: absolute;
					top:{layout.breadcrumbs_top}px;
					height:{layout.controls_boxHeight}px;'>
				<Box
					top={0}
					left={0}
					name='breadcrumbs-box'
					color={separator_color}
					width={layout.windowSize.width}
					height={layout.controls_boxHeight}
					thickness={k.thickness.separator.main}
					corner_radius={k.radius.gull_wings.thick}>
					<Breadcrumbs/>
				</Box>
			</div>
		{:else}
			<Separator
				name='panel-bottom'
				isHorizontal={true}
				has_both_wings={true}
				margin={k.details_margin}
				zindex={T_Layer.frontmost}
				length={layout.windowSize.width + 3}
				thickness={k.thickness.separator.main}
				corner_radius={k.radius.gull_wings.thick}
				origin={new Point(2, layout.windowSize.height - 4)}/>
		{/if}
	</div>
{/key}
