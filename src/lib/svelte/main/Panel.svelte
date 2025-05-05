<script lang='ts'>
	import { c, k, u, ux, w, show, Rect, Size, Point, Thing, colors, layout } from '../../ts/common/Global_Imports';
	import { w_t_database, w_graph_rect, w_hierarchy, w_background_color } from '../../ts/common/Stores';
	import { debug, T_Layer, T_Banner, Ancestry, T_Startup } from '../../ts/common/Global_Imports';
	import { w_s_title_edit, w_show_details, w_device_isMobile, } from '../../ts/common/Stores';
	import { T_Control, Hierarchy, databases, Direction } from '../../ts/common/Global_Imports';
	import { w_t_startup, w_popupView_id, w_ancestry_focus } from '../../ts/common/Stores';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import { T_Database } from '../../ts/database/DBCommon';
	import Gull_Wings from '../kit/Gull_Wings.svelte';
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

	function ignore_wheel(event) { event.preventDefault(); }

	$: {
		const _ = $w_t_database + $w_t_startup + $w_popupView_id + $w_graph_rect;
		panel_reattachments += 1;
	}

	$: {
		const _ = $w_background_color;
		separator_color = colors.separator;
	}
	
	async function handle_key_down(event) {
		if (event.type == 'keydown') {
			const key = event.key.toLowerCase();
			if (key == undefined) {
				alert('No key for ' + event.type);
			} else if (!$w_s_title_edit && !ux.isEditing_text) {			// let title editor (when active) consume the events
				const h = $w_hierarchy;
				switch (key) {
					case 'o': h.select_file_toUpload(event.shiftKey); break;
					case 'c': w.user_graph_offset_setTo(Point.zero); break;
					case 'm': layout.toggle_t_graph(); break;
					case 's': h.persist_toFile(); break;
					case '?': c.showHelp(); break;
					default:  await h.handle_key_down(event); return;	// let hierarchy consume the events
				}
				debug.log_key(`PANEL  ${key}`);
			}
		}
	}

</script>

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

<svelte:document on:keydown={handle_key_down}/>
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
				<div class='separator-above-graph' style='
					top: {tops[T_Banner.graph]}px;
					background-color: {separator_color};
					height: {separator_thickness}px;
					width: {w.windowSize.width}px;
					z-index: {T_Layer.lines};
					position: absolute;
					left: 0px;'>
				</div>
				{#if $w_show_details}
					<Details/>
					<div class='details-separator'
						style='
							position: absolute;
							z-index: {T_Layer.lines};
							left: {k.width_details}px;
							width: {separator_thickness}px;
							top: {$w_graph_rect.origin.y}px;
							background-color: {separator_color};
							height: {$w_graph_rect.size.height}px;'>
					</div>
					<Gull_Wings
						center={$w_graph_rect.origin.offsetEquallyBy(separator_thickness / -2)}
						radius={separator_thickness * 3}
						thickness={separator_thickness}
						direction={Direction.down}
						color='{separator_color}'/>
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
						<Import accept='.json'/>
					{:else if !$w_popupView_id}
						<Graph/>
					{/if}
				{/key}
			</div>
		{/if}
	</div>
{/key}
