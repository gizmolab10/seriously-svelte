<script lang='ts'>
	import { w_s_ancestry_edit, w_show_details, w_device_isMobile, } from '../../ts/state/S_Stores';
	import { g, k, u, ux, w, show, Rect, Size, Point, Thing } from '../../ts/common/Global_Imports';
	import { debug, T_Layer, Ancestry, T_Startup } from '../../ts/common/Global_Imports';
	import { w_t_database, w_graph_rect, w_hierarchy } from '../../ts/state/S_Stores';
	import { T_Control, Hierarchy, databases } from '../../ts/common/Global_Imports';
	import { w_id_popupView, w_ancestry_focus } from '../../ts/state/S_Stores';
	import { w_count_resize, w_t_startup } from '../../ts/state/S_Stores';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import { T_Database } from '../../ts/data/dbs/DBCommon';
	import Details from '../details/Details.svelte';
	import Breadcrumbs from './Breadcrumbs.svelte';
	import BuildNotes from './BuildNotes.svelte';
	import Debug from '../debug/Debug.svelte';
	import Controls from './Controls.svelte';
	import Box from '../debug/Box.svelte';
	import Import from './Import.svelte';
	import Graph from './Graph.svelte';
	import { onMount } from 'svelte';
	let chain = ['Panel'];
	let rebuilds = 0;

	function ignore_wheel(event) { event.preventDefault(); }

	$: {
		const _ = $w_t_database + $w_t_startup + $w_id_popupView;
		rebuilds += 1;
	}
	
	async function handle_key_down(event) {
		if (event.type == 'keydown') {
			const key = event.key.toLowerCase();
			if (key == undefined) {
				alert('No key for ' + event.type);
			} else if (!$w_s_ancestry_edit && !g.isEditing_text) {			// let title editor (when active) consume the events
				const h = $w_hierarchy;
				switch (key) {
					case 'o': h.select_file_toUpload(event.shiftKey); break;
					case 'c': w.user_graph_offset_setTo(Point.zero); break;
					case 's': h.persist_toFile(); break;
					case '?': g.showHelp(); break;
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
{#key rebuilds}
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
			{#if !$w_id_popupView}
				<div class='breadcrumbs'
					style='left:0px;
						position: absolute;
						top:{k.height_banner - 1}px;
						z-index: {T_Layer.frontmost};
						width:{w.windowSize.width}px;
						height:{k.height_breadcrumbs}px;'>
					<Breadcrumbs/>
					<div class='horizontal-line' style='
						top: {k.height_banner + k.height_breadcrumbs}px;
						z-index: {T_Layer.lines};'>
					</div>
				</div>
				<div class='horizontal-line' style='
					top: {k.height_banner}px;
					z-index: {T_Layer.lines};'>
				</div>
				{#if $w_show_details}
					<Details/>
					<div class='vertical-line'
						style='
							width: 1px;
							position: absolute;
							z-index: {T_Layer.lines};
							left: {k.width_details}px;
							background-color: lightgray;
							top: {$w_graph_rect.origin.y}px;
							height: {$w_graph_rect.size.height}px;'>
					</div>
				{/if}
			{/if}
			<div class='right-side'
				style='
					height: 100%;
					position: fixed;
					z-index: {T_Layer.backmost};
					left: {$w_show_details ? k.width_details : 0}px;'>
				{#key $w_id_popupView}
					{#if $w_id_popupView == T_Control.builds}
						<BuildNotes/>
					{:else if $w_id_popupView == T_Control.import}
						<Import accept='.json'/>
					{:else if !$w_id_popupView}
						<Graph/>
					{/if}
				{/key}
			</div>
		{/if}
	</div>
{/key}
