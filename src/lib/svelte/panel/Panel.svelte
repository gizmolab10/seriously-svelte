<script lang='ts'>
	import { s_resize_count, s_focus_ancestry, s_user_graphOffset } from '../../ts/state/Reactive_State';
	import { g, k, u, ux, get, show, Rect, Size, Point, Thing } from '../../ts/common/Global_Imports';
	import { s_isBusy, s_db_type, s_graphRect, s_id_popupView } from '../../ts/state/Reactive_State';
	import { s_edit_state, s_show_details, s_device_isMobile, } from '../../ts/state/Reactive_State';
	import { IDButton, Hierarchy, IDPersistent } from '../../ts/common/Global_Imports';
	import { debug, ZIndex, onMount, Ancestry } from '../../ts/common/Global_Imports';
	import { dbDispatch, setContext } from '../../ts/common/Global_Imports';
	import Mouse_Responder from '../mouse buttons/Mouse_Responder.svelte';
	import Breadcrumbs from '../panel/Breadcrumbs.svelte';
	import { DBType } from '../../ts/db/DBInterface';
	import Details from '../details/Details.svelte';
	import BuildNotes from './BuildNotes.svelte';
	import { h } from '../../ts/db/DBDispatch';
	import Controls from './Controls.svelte';
	import Graph from './Graph.svelte';
	let chain = ['Panel'];
	
	async function handle_key_down(event) {
		if (event.type == 'keydown') {
			const key = event.key;
			if (key == undefined) {
				alert('no key for ' + event.type);
			} else if (!$s_edit_state && !g.isEditing_text) {	// let editor component consume the events
				switch (key) {
					case 'c': g.graphOffset_setTo(Point.zero); break;
					case '?': g.showHelp(); break;
					case ']':
					case '[': dbDispatch.db_change_toNext(key == ']'); break;
					default:  await h.handle_key_down(event); return;
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
		width: 100%;
	}
	.top-title {
		text-align: center;
		position: fixed;
		font-size: 2em;
		right: 0px;
		top: 40px;
	}
	.horizontal-line {
		background-color: lightgray;
		position: fixed;
		height: 1px;
		width: 110%;
		left: 0px;
	}
	.vertical-line {
		background-color: lightgray;
		position: absolute;
		width: 1px;
	}
	.clipper {
		overflow: hidden;
		position: fixed;
	}
</style>

<svelte:document on:keydown={handle_key_down}/>
<div 
	style='
		touch-action: none;
		pointer-events: auto;
		{k.prevent_selection_style};'>
	{#if $s_isBusy}
		<p>Welcome to Seriously</p>
		{#if $s_db_type != DBType.local}
			<p>({h?.startupExplanation})</p>
		{/if}
	{:else if !g.things_arrived}
		<p>Nothing is available.</p>
	{:else}
		<Controls/>
		{#if !$s_id_popupView}
			<div class='breadcrumbs'
				style='left:0px;
					position: absolute;
					top:{k.height_banner}px;
					z-index: {ZIndex.frontmost};
					width:{g.windowSize.width}px;
					height:{k.height_breadcrumbs}px;'>
				<Breadcrumbs/>
				<div class='horizontal-line'
					style='
						top: {k.height_banner + k.height_breadcrumbs}px;
						z-index: {ZIndex.lines};'>
				</div>
			</div>
			<div class='horizontal-line' style='
				z-index: {ZIndex.lines};
				top: {k.height_banner}px;'>
			</div>
			{#if show.titleAtTop}
				<div class='top-title'
					style='
						top: 70px;
						z-index: {ZIndex.frontmost};
						color: {$s_focus_ancestry.thing?.color};
						left: 0px;'>
					{$s_focus_ancestry.title}
				</div>
				<div class='horizontal-line'
					style='
						z-index: {ZIndex.lines};
						top: {k.height_banner + k.height_titleAtTop}px;'>
				</div>
			{/if}
			{#if $s_show_details}
				<Details/>
				<div class='vertical-line'
					style='
						z-index: {ZIndex.lines};
						left: {k.width_details}px;
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
			{#if $s_id_popupView == IDButton.builds}
				<BuildNotes/>
			{:else if !$s_id_popupView}
				<Graph/>
			{/if}
		</div>
	{/if}
</div>
