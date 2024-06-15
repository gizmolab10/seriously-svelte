<script lang='ts'>
	import { g, k, s, u, get, Rect, Size, Point, Thing, debug, ZIndex, signals, onMount, Ancestry } from '../../ts/common/GlobalImports';
	import { IDButton, Hierarchy, IDPersistant, dbDispatch, debugReact, setContext, persistLocal } from '../../ts/common/GlobalImports';
	import { s_isBusy, s_db_type, s_graphRect, s_id_popupView, s_title_editing, s_show_details } from '../../ts/state/ReactiveState';
	import { s_things_arrived, s_ancestry_focus, s_user_graphOffset, s_layout_asClusters } from '../../ts/state/ReactiveState';
	import MouseResponder from '../mouse buttons/MouseResponder.svelte';
	import ClusterGraph from '../clusters/ClusterGraph.svelte';
	import TitleEditor from '../widget/TitleEditor.svelte';
	import Breadcrumbs from '../panel/Breadcrumbs.svelte';
	import TreeGraph from '../tree/TreeGraph.svelte';
	import { DBType } from '../../ts/db/DBInterface';
	import Details from '../details/Details.svelte';
	import BuildNotes from './BuildNotes.svelte';
	import { h } from '../../ts/db/DBDispatch';
	import Controls from './Controls.svelte';
	let chain = ['Panel'];
	let rebuilds = 0;
	
	onMount(() => {
		g.setup();
		$s_isBusy = true;
		const handler = signals.handle_rebuildGraph(1, (ancestry) => {
			debugReact.log_mount(`PANEL ${rebuilds} rebuilds`);
			rebuilds += 1;
		});
		return () => { handler.disconnect() };
	});

	function handle_wheel(event) {
		const userOffset = $s_user_graphOffset;
		const delta = new Point(-event.deltaX, -event.deltaY);
		if (!!userOffset && k.allow_HorizontalScrolling && delta.magnitude > 1) {
			persistLocal.graphOffset_setTo(userOffset.offsetBy(delta));
			rebuilds += 1;
		}
	}

	async function handle_key_down(event) {
		if ($s_title_editing)		{ return; } // let TitleState component consume the events
		if (event.key == undefined)	{ alert('no key for ' + event.type); return; }
		if (event.type == 'keydown') {
			const key = event.key;
			switch (key) {
				case 'c': persistLocal.graphOffset_setTo(Point.zero); break;
				case '?': g.open_tabFor(k.help_url); break;
				case ']':
				case '[': dbDispatch.db_change_toNext(key == ']'); break;
				default:  await h.handle_key_down(event); break;
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
<div style='{k.prevent_selection_style};'>
	{#if $s_isBusy}
		<p>Welcome to Seriously</p>
		{#if $s_db_type != DBType.local}
			<p>(loading your {$s_db_type} data{$s_db_type == DBType.firebase ? ', from ' + h?.db.baseID : k.empty})</p>
		{/if}
	{:else if !$s_things_arrived}
		<p>Nothing is available.</p>
	{:else}
		<Controls/>
		{#if $s_id_popupView == null}
			{#if $s_show_details}
				<Details/>
				<div class='vertical-line' style='
					left: {k.width_details}px;
					z-index: {ZIndex.lines};
					top: {$s_graphRect.origin.y}px;
					height: {$s_graphRect.size.height}px;'>
				</div>
			{/if}
			<div class='horizontal-line' style='
				z-index: {ZIndex.lines};
				top: {k.height_banner}px;'>
			</div>
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
			{#if k.show_titleAtTop}
				<div class='top-title'
					style='
						top: 70px;
						z-index: {ZIndex.frontmost};
						color: {$s_ancestry_focus.thing?.color};
						left: 0px;'>
					{$s_ancestry_focus.title}
				</div>
				<div class='horizontal-line'
					style='
						z-index: {ZIndex.lines};
						top: {k.height_banner + k.height_titleAtTop}px;'>
				</div>
			{/if}
		{/if}
		<div class='right-side'
			style='
				height: 100%;
				position: fixed;
				z-index: {ZIndex.panel};
				left: {$s_show_details ? k.width_details : 0}px;'>
			{#if $s_id_popupView == IDButton.builds}
				<BuildNotes/>
			{:else if $s_id_popupView == null}
				{#key `${$s_ancestry_focus} ${rebuilds}`}
					<div class='clipper' on:wheel={handle_wheel}
						style='
							top:{$s_graphRect.origin.y}px;
							left: {$s_graphRect.origin.x}px;
							width: {$s_graphRect.size.width}px;
							height: {$s_graphRect.size.height}px;
							z-index: {ZIndex.panel};'>
						{#if $s_layout_asClusters}
							<ClusterGraph/>
						{:else}
							<TreeGraph/>
						{/if}
					</div>
				{/key}
			{/if}
		</div>
	{/if}
</div>