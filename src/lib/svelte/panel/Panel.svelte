<script>
	import { k, get, Path, Rect, Size, Point, Thing, launch, TypeDB, ZIndex, signals, onMount, IDButton } from '../../ts/common/GlobalImports';
	import { Hierarchy, PersistID, dbDispatch, debugReact, persistLocal, graphRect_update } from '../../ts/common/GlobalImports';
	import { s_build, s_isBusy, s_path_here, s_db_type, s_graphRect, s_title_atTop } from '../../ts/managers/State';
	import { s_id_popupView, s_showDetails, s_things_arrived, s_thing_fontSize } from '../../ts/managers/State';
	import CircularButton from '../kit/CircularButton.svelte';
	import TitleEditor from '../widget/TitleEditor.svelte';
	import LabelButton from '../kit/LabelButton.svelte';
	import BuildNotes from './BuildNotes.svelte';
	import Graph from '../graph/Graph.svelte';
	import PanelTop from './PanelTop.svelte';
	import Help from '../help/Help.svelte';
	import Details from './Details.svelte';
	import Crumbs from './Crumbs.svelte';
	const bottomOfTitle = k.bandHeightAtTop + k.titleHeightAtTop;
	const topBandHeight = k.bandHeightAtTop - 2;
	let herePath = Path;
	let toggle = false;
	let left = 14;

	$: { updateHerePath($s_path_here); }
	window.addEventListener('resize', (event) => { graphRect_update(); });
	const rebuild_signalHandler = signals.handle_rebuild(() => { updateHerePath($s_path_here); });

	onMount(() => {
		launch.setup();
		updateHerePath($s_path_here);
	});

	function updateHerePath(newHerePath, forced = true) {
		let changed = false;
		if (newHerePath && !newHerePath.matchesPath(herePath)) {
			herePath = newHerePath;
			changed = true;
		}
		if (changed || forced) {
			graph_fullRebuild();
		}
	}

	function graph_fullRebuild() {
		graphRect_update();
		if ($s_graphRect) {
			left = $s_graphRect.origin.x;
			// debugReact.log_rebuild(`PANEL ${$s_path_here.thing.description}`);
			toggle = !toggle;	// remount graph component
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
		left: 110px;
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
	.topTitle {
		text-align: center;
		position: fixed;
		font-size: 2em;
		right: 0px;
		top: 40px;
	}
	.leftSide {
		background-color: transparent;
		position: fixed;
		width: 100px;
		margin: 1px;
		left: -1px;
		top: 8px;
	}
	.horizontalLine {
		background-color: lightgray;
		position: fixed;
		height: 1px;
		width: 110%;
	}
	.verticalLine {
		background-color: lightgray;
		position: absolute;
		left: 100px;
		width: 1px;
		top: 0px;
	}
</style>

{#if $s_isBusy}
	<p>Welcome to Seriously</p>
	{#if $s_db_type != TypeDB.local}
		<p>(loading your {$s_db_type} data{$s_db_type == TypeDB.firebase ? ', from ' + dbDispatch.db.baseID : ''})</p>
	{/if}
{:else if !$s_things_arrived}
	<p>Nothing is available.</p>
{:else}
	<PanelTop/>
	{#if $s_showDetails && $s_id_popupView == null}
		<Details/>
		<div class='verticalLine' style='height: calc(100vh - {topBandHeight}px); top: {topBandHeight}px; z-index: {ZIndex.frontmost};'></div>
	{/if}
	<div class='horizontalLine' style='z-index: {ZIndex.frontmost}; left: -10px; top: {topBandHeight}px; width: 110%;'></div>
	<div class='rightSide' style='
		left: {$s_showDetails ? 100 : 0}px;
		z-index: {ZIndex.panel};
		position: fixed;
		height: 100%;'>
		{#if $s_id_popupView == IDButton.help}
			<Help/>
		{:else if $s_id_popupView == IDButton.buildNotes}
			<BuildNotes/>
		{:else if $s_id_popupView == null}
			<div class='crumbs' style='z-index: {ZIndex.frontmost}; top: 40px;'>
				<Crumbs/>
				<div class='horizontalLine'
					style='
						z-index: {ZIndex.frontmost};
						left: {$s_showDetails ? k.detailsMargin : 0}px;
						top: 68px;'>
				</div>
			</div>
			{#if $s_title_atTop}
				<div class='topTitle'
					style='
						top: 68px;
						z-index: {ZIndex.frontmost};
						color: {$s_path_here.thing?.color};
						left: {$s_showDetails ? '100px' : '-1px'};'>
					{$s_path_here.thingTitle}
				</div>
				<div class='horizontalLine'
					style='
						z-index: {ZIndex.frontmost};
						top: {bottomOfTitle + 28}px;
						left: {$s_showDetails ? k.detailsMargin : 0}px;'>
				</div>
			{/if}
			{#key toggle}
				<Graph/>
			{/key}
		{/if}
	</div>
{/if}
