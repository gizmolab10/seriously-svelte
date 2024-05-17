<script>
	import { IDButton, Hierarchy, IDPersistant, dbDispatch, debugReact, setContext, persistLocal } from '../../ts/common/GlobalImports';
	import { s_build, s_isBusy, s_ancestry_focus, s_db_type, s_graphRect, s_id_popupView, s_title_editing } from '../../ts/state/State';
	import { g, k, u, get, Rect, Size, Point, Thing, debug, ZIndex, signals, onMount, Ancestry } from '../../ts/common/GlobalImports';
	import { s_show_details, s_things_arrived, s_user_graphOffset, s_layout_asClusters } from '../../ts/state/State';
	import CircleButton from '../buttons/CircleButton.svelte';
	import TitleEditor from '../widget/TitleEditor.svelte';
	import Breadcrumbs from '../panel/Breadcrumbs.svelte';
	import Clusters from '../clusters/Clusters.svelte';
	import { DBType } from '../../ts/db/DBInterface';
	import Details from '../details/Details.svelte';
	import BuildNotes from './BuildNotes.svelte';
	import { h } from '../../ts/db/DBDispatch';
	import Controls from './Controls.svelte';
	import Tree from '../tree/Tree.svelte';
	import Help from '../help/Help.svelte';
	let chain = ['Panel'];
	let rebuilds = 0;
	
	onMount( () => {
		g.setup();
		$s_isBusy = true;
		const handler = signals.handle_rebuildGraph(1, (ancestry) => {
			debugReact.log_mount(`PANEL ${rebuilds} rebuilds`);
			rebuilds += 1;
		});
		return () => { handler.disconnect() };
	});

	function handle_wheel(event) {
		const canScroll = k.allow_HorizontalScrolling;
		const offsetX = canScroll ? -event.deltaX : 0;
		const offsetY = -event.deltaY;
		if (Math.abs(offsetX) > 1 || Math.abs(offsetY) > 1) {
			const offset = $s_user_graphOffset;
			const newOffset = new Point(offset.x + offsetX, offset.y + offsetY);
			g.graphOffset_setTo(newOffset);
			rebuilds += 1;
		}
	};

	async function handle_key_down(event) {
		if ($s_title_editing)		{ return; } // let Title component consume the events
		if (event.key == undefined)	{ alert('no key for ' + event.type); return; }
		if (event.type == 'keydown') {
			const key = event.key;
			switch (key) {
				case 'c': g.graphOffset_setTo(new Point()); break;
				case '?': $s_id_popupView = IDButton.help; break;
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
	.crumbs {
		position: fixed;
		top: 41px;
	}
	.build {
		border-radius: 1em;
		position: absolute;
		border: 1px solid;
		cursor: pointer;
		left: 35px;
		top: -2px;
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
				top: {k.height_banner - 2}px;'>
			</div>
			<div class='breadcrumbs' style='z-index: {ZIndex.frontmost};'>
				<Breadcrumbs/>
				<div class='horizontal-line'
					style='
						top: 68px;
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
						top: {k.height_banner + k.height_titleAtTop + 28}px;'>
				</div>
			{/if}
		{/if}
		<div class='right-side'
			style='
				height: 100%;
				position: fixed;
				z-index: {ZIndex.panel};
				left: {$s_show_details ? k.width_details : 0}px;'>
			{#if $s_id_popupView == IDButton.help}
				<Help/>
			{:else if $s_id_popupView == IDButton.builds}
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
							<Clusters ancestry={$s_ancestry_focus}/>
						{:else}
							<Tree/>
						{/if}
					</div>
				{/key}
			{/if}
		</div>
	{/if}
</div>