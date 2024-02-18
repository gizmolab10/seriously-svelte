<script>
	import { IDButton, Hierarchy, IDPersistant, dbDispatch, debugReact, persistLocal, graphRect_update } from '../../ts/common/GlobalImports';
	import { g, k, get, Path, Rect, Size, Point, Thing, launch, TypeDB, ZIndex, signals, onMount } from '../../ts/common/GlobalImports';
	import { s_build, s_isBusy, s_path_here, s_db_type, s_graphRect, s_crumbs_width } from '../../ts/managers/State';
	import { s_show_details, s_id_popupView, s_things_arrived, s_thing_fontSize } from '../../ts/managers/State';
	import CircularButton from '../kit/CircularButton.svelte';
	import TitleEditor from '../widget/TitleEditor.svelte';
	import LabelButton from '../kit/LabelButton.svelte';
	import BuildNotes from './BuildNotes.svelte';
	import Controls from './Controls.svelte';
	import Help from '../help/Help.svelte';
	import Details from './Details.svelte';
	import Crumbs from './Crumbs.svelte';
	import Graph from './Graph.svelte';
	const bottomOfTitle = k.bandHeightAtTop + k.titleHeightAtTop;
	const topBandHeight = k.bandHeightAtTop - 2;
	let toggle = false;

	$: { updateHerePath($s_path_here); }
	window.addEventListener('resize', (event) => { graphRect_update(); });
	const rebuild_signalHandler = signals.handle_rebuild(() => { updateHerePath($s_path_here); });

	onMount(() => {
		(async () => {
			await launch.setup();
			updateHerePath($s_path_here);
		})()
	});

	function updateHerePath(newHerePath) {
		if (newHerePath && !newHerePath.matchesPath(g.herePath)) {
			g.herePath = newHerePath;
		}
		graphRect_update();
		toggle = !toggle;	// remount graph component
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
	}
	.vertical-line {
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
	<Controls/>
	{#if $s_show_details && $s_id_popupView == null}
		<Details/>
		<div class='vertical-line' style='height: calc(100vh - {topBandHeight}px); top: {topBandHeight}px; z-index: {ZIndex.frontmost};'></div>
	{/if}
	<div class='horizontal-line' style='z-index: {ZIndex.frontmost}; left: -10px; top: {topBandHeight}px; width: 110%;'></div>
	<div class='right-side' style='
		left: {$s_show_details ? 100 : 0}px;
		z-index: {ZIndex.panel};
		position: fixed;
		height: 100%;'>
		{#if $s_id_popupView == IDButton.help}
			<Help/>
		{:else if $s_id_popupView == IDButton.buildNotes}
			<BuildNotes/>
		{:else if $s_id_popupView == null}
			{#key toggle}
				{#key $s_crumbs_width}
					<div class='crumbs' style='z-index: {ZIndex.frontmost};'>
						<Crumbs/>
						<div class='horizontal-line'
							style='
								z-index: {ZIndex.frontmost};
								left: {$s_show_details ? k.detailsMargin : 0}px;
								top: 68px;'>
						</div>
					</div>
				{/key}
				{#if g.titleIsAtTop}
					<div class='top-title'
						style='
							top: 68px;
							z-index: {ZIndex.frontmost};
							color: {$s_path_here.thing?.color};
							left: {$s_show_details ? k.detailsMargin : 0}px;'>
						{$s_path_here.thingTitle}
					</div>
					<div class='horizontal-line'
						style='
							z-index: {ZIndex.frontmost};
							top: {bottomOfTitle + 28}px;
							left: {$s_show_details ? k.detailsMargin : 0}px;'>
					</div>
				{/if}
				<Graph/>
			{/key}
		{/if}
	</div>
{/if}
