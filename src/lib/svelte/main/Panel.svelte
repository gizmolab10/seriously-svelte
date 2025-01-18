<script lang='ts'>
	import { s_title_edit_state, s_show_details, s_device_isMobile, } from '../../ts/state/S_Stores';
	import { g, k, u, ux, w, show, Rect, Size, Point, Thing } from '../../ts/common/Global_Imports';
	import { debug, ZIndex, Ancestry, T_Startup } from '../../ts/common/Global_Imports';
	import { s_type_db, s_graphRect, s_hierarchy } from '../../ts/state/S_Stores';
	import { T_Control, Hierarchy, databases } from '../../ts/common/Global_Imports';
	import { s_id_popupView, s_focus_ancestry } from '../../ts/state/S_Stores';
	import { s_resize_count, s_startup_state } from '../../ts/state/S_Stores';
	import { T_Database } from '../../ts/data/basis/Persistence_State';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import Details from '../details/Details.svelte';
	import Breadcrumbs from './Breadcrumbs.svelte';
	import BuildNotes from './BuildNotes.svelte';
	import Debug from '../debug/Debug.svelte';
	import Controls from './Controls.svelte';
	import Load from '../file/Load.svelte';
	import Box from '../debug/Box.svelte';
	import Graph from './Graph.svelte';
	import { onMount } from 'svelte';
	let chain = ['Panel'];
	let rebuilds = 0;

	function ignore_wheel(event) { event.preventDefault(); }

	$: {
		const _ = $s_type_db + $s_startup_state + $s_id_popupView;
		rebuilds += 1;
	}
	
	async function handle_key_down(event) {
		if (event.type == 'keydown') {
			const key = event.key.toLowerCase();
			if (key == undefined) {
				alert('No key for ' + event.type);
			} else if (!$s_title_edit_state && !g.isEditing_text) {			// let title editor (when active) consume the events
				const h = $s_hierarchy;
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
		{#if [T_Startup.start, T_Startup.fetch].includes($s_startup_state) && databases.db.isPersistent}
			<p>Welcome to Seriously</p>
			{#if $s_startup_state == T_Startup.fetch}
				<p>{databases.startupExplanation}</p>
			{/if}
		{:else if $s_startup_state == T_Startup.empty}
			<p>Nothing is available.</p>
		{:else if $s_startup_state == T_Startup.ready}
			<Controls/>
			{#if !$s_id_popupView}
				<div class='breadcrumbs'
					style='left:0px;
						position: absolute;
						top:{k.height_banner - 1}px;
						z-index: {ZIndex.frontmost};
						width:{w.windowSize.width}px;
						height:{k.height_breadcrumbs}px;'>
					<Breadcrumbs/>
					<div class='horizontal-line' style='
						top: {k.height_banner + k.height_breadcrumbs}px;
						z-index: {ZIndex.lines};'>
					</div>
				</div>
				<div class='horizontal-line' style='
					top: {k.height_banner}px;
					z-index: {ZIndex.lines};'>
				</div>
				{#if $s_show_details}
					<Details/>
					<div class='vertical-line'
						style='
							width: 1px;
							position: absolute;
							z-index: {ZIndex.lines};
							left: {k.width_details}px;
							background-color: lightgray;
							top: {$s_graphRect.origin.y}px;
							height: {$s_graphRect.size.height}px;'>
					</div>
				{/if}
			{/if}
			<div class='right-side'
				style='
					height: 100%;
					position: fixed;
					z-index: {ZIndex.backmost};
					left: {$s_show_details ? k.width_details : 0}px;'>
				{#key $s_id_popupView}
					{#if $s_id_popupView == T_Control.builds}
						<BuildNotes/>
					{:else if $s_id_popupView == T_Control.open}
						<Load/>
					{:else if !$s_id_popupView}
						<Graph/>
					{/if}
				{/key}
			</div>
		{/if}
	</div>
{/key}
