<script>
	import { build, isBusy, path_here, db_type, graphRect, id_popupView, showDetails, things_arrived, thing_fontSize } from '../../ts/managers/State';
	import { k, get, Path, Rect, Size, Point, Thing, launch, DBType, ZIndex, signals, onMount, ButtonID } from '../../ts/common/GlobalImports';
	import { Hierarchy, PersistID, dbDispatch, debugReact, persistLocal, graphRect_update } from '../../ts/common/GlobalImports';
	import TitleEditor from '../widget/TitleEditor.svelte';
	import CircularButton from '../kit/CircularButton.svelte';
	import LabelButton from '../kit/LabelButton.svelte';
	import Graph from '../graph/Graph.svelte';
	import BuildNotes from './BuildNotes.svelte';
	import Help from '../help/Help.svelte';
	import Details from './Details.svelte';
	import Crumbs from './Crumbs.svelte';
	let herePath = Path;
	let toggle = false;
	let left = 14;
	let size = 14;
	
	function builds_buttonClicked(event) { $id_popupView = ($id_popupView == ButtonID.buildNotes) ? null : ButtonID.buildNotes; }
	function help_buttonClicked() { $id_popupView = ($id_popupView == ButtonID.help) ? null : ButtonID.help; }
	const rebuild_signalHandler = signals.handle_rebuild(() => { graph_fullRebuild(); });
	window.addEventListener('resize', (event) => { graphRect_update(); });
	
	onMount(async () => {
		launch.setup();
		graph_fullRebuild();
	});

	$: {
		if (herePath.pathString != $path_here?.pathString) {
			herePath = $path_here;
			graph_fullRebuild();
		}
	}

	function graph_fullRebuild() {
		graphRect_update();
		left = $graphRect.origin.x;
		debugReact.log_rebuild(`PANEL ${$path_here?.thing()?.description}`)
		toggle = !toggle;	// remount graph component
	}
	
	function details_buttonClicked(event) {
		$showDetails = !$showDetails;
		signals.signal_relayout_fromHere();
		persistLocal.writeToKey(PersistID.details, $showDetails);
	}

</script>

<style>
	p {
		text-align: center;
		font-size: 3em;
		width: 100%;
	}
	.top {
		position: fixed;
		left: 110px;
		top: 6px;
	}
	.build {
		border-radius: 16px;
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

{#if $isBusy}
	<p>Welcome to Seriously</p>
	{#if $db_type != DBType.local}
		<p>(loading your {$db_type} data{$db_type == DBType.firebase ? ', from ' + dbDispatch.db.baseID : ''})</p>
	{/if}
{:else if !$things_arrived}
	<p>Nothing is available.</p>
{:else}
	<div class='leftSide'
		style='
			z-index: {ZIndex.frontmost};
			height: {$showDetails ? '100%' : '33px'};'>
		<CircularButton left=15
			borderColor='white'
			onClick={details_buttonClicked}>
			<img src='settings.svg' alt='circular button' width={size}px height={size}px/>
		</CircularButton>
		<button class='build' on:click={builds_buttonClicked}>{$build}</button>
		{#if !$isBusy}
			<CircularButton left=85
				onClick={() => {help_buttonClicked()}}
				size={size}>i
			</CircularButton>
		{/if}
		{#if $showDetails && $id_popupView == null}
			<Details/>
		{/if}
	</div>
	<div class='horizontalLine' style='z-index: {ZIndex.frontmost}; left: -10px; top: 32px; width: {$id_popupView ? '111px' : '110%'};'></div>
	<div class='verticalLine' style='height: {$showDetails && $id_popupView == null ? '100%' : '33px'}; z-index: {ZIndex.frontmost};'></div>
	<div class='rightSide' style='
		left: {$showDetails ? 100 : 0}px;
		z-index: {ZIndex.panel};
		position: fixed;
		height: 100%;'>
		{#if $id_popupView == ButtonID.help}
			<Help size={size}/>
		{:else if $id_popupView == ButtonID.buildNotes}
			<BuildNotes/>
		{:else if $id_popupView == null}
			<div class='top' style='z-index: {ZIndex.frontmost}'>
				<Crumbs/>
			</div>
			<div class='topTitle'
				style='color: {$path_here?.thing()?.color};
					z-index: {ZIndex.frontmost};
					left: {$showDetails ? '100px' : '-1px'};'>
				{$path_here?.thing()?.title}
			</div>
			<div class='horizontalLine' style='z-index: {ZIndex.frontmost}; left: {$showDetails ? k.detailsMargin : 0}px; top: 85px;'></div>
			{#key toggle}
				<Graph/>
			{/key}
		{/if}
	</div>
{/if}
