<script>
	import { build, isBusy, id_here, db_type, expanded, graphRect, id_popupView, showDetails, things_arrived } from '../../ts/managers/State';
	import { k, get, Rect, Size, Point, Thing, launch, DBType, ZIndex, onMount, PersistID, dbDispatch, debugReact } from '../../ts/common/GlobalImports';
	import { ButtonID, Hierarchy, persistLocal, handle_rebuild, signal_relayout, graphRect_update } from '../../ts/common/GlobalImports';
	import CircularButton from '../kit/CircularButton.svelte';
	import LabelButton from '../kit/LabelButton.svelte';
	import BuildNotes from './BuildNotes.svelte';
	import Graph from '../vanilla/graph/Graph.svelte';
	import Help from '../help/Help.svelte';
	import Details from './Details.svelte';
	import Crumbs from './Crumbs.svelte';
	let graph_toggle = false;
	let here = Thing;
	let size = 14;
	
	function builds_buttonClicked(event) { $id_popupView = ($id_popupView == ButtonID.buildNotes) ? null : ButtonID.buildNotes; }
	function help_buttonClicked() { $id_popupView = ($id_popupView == ButtonID.help) ? null : ButtonID.help; }
	window.addEventListener('resize', (event) => { graph_fullRebuild(); });
	
	onMount(async () => {
		launch.setup();
		graph_fullRebuild();
	});

	const rebuild_signalHandler = handle_rebuild((idThing) => {
		graph_fullRebuild();
	});

	$: {
		if (here.id != $id_here) {
			here = dbDispatch.db.hierarchy.thing_getForID($id_here);
			graph_fullRebuild();
		}
	}

	function graph_fullRebuild() {
		graphRect_update();
		debugReact.log_rebuild(`PANEL ${here.description}`)
		graph_toggle = !graph_toggle;	// remount graph component
	}
	
	function details_buttonClicked(event) {
		$showDetails = !$showDetails;
		signal_relayout();
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
		top: -2px;
		left: 35px;
		cursor: pointer;
		border: 1px solid;
		position: absolute;
		border-radius: 16px;
	}
	.topTitle {
		text-align: center;
		position: fixed;
		font-size: 2em;
		right: 0px;
		top: 40px;
	}
	.leftSide {
		position: fixed;
		width: 100px;
		margin: 1px;
		left: -1px;
		top: -1px;
	}
	.horizontalLine {
		position: fixed;
		height: 1px;
		width: 110%;
		background-color: lightgray;
	}
	.verticalLine {
		position: absolute;
		left: 100px;
		top: 0px;
		width: 1px;
		background-color: lightgray;
	}
</style>

<div class='leftSide'
	style='top: 8px;
		position: fixed;
		z-index: {ZIndex.frontmost}; 
		background-color: transparent;
		height: {$showDetails ? '100%' : '33px'};'>
	<CircularButton left=15
		image='settings.svg'
		borderColor='white'
		onClick={details_buttonClicked}/>
	<button class='build' on:click={builds_buttonClicked}>{$build}</button>
	{#if !$isBusy}
		<CircularButton left=85
			onClick={() => {help_buttonClicked()}}
			label='i'
			size={size}/>
	{/if}
	{#if $showDetails}
		<Details/>
	{/if}
</div>
<div class='horizontalLine' style='z-index: {ZIndex.frontmost}; left: -10px; top: 32px; width: {$id_popupView ? '111px' : '110%'};'></div>
<div class='verticalLine' style='height: {$showDetails ? '100%' : '33px'}; z-index: {ZIndex.frontmost};'></div>
<div class='rightSide' style='
	left: {$showDetails ? 100 : 0}px;
	height: 100%;
	position: fixed;
	overflow: hidden;
	z-index: {ZIndex.panel};'>
	{#if $isBusy}
		<p>Welcome to Seriously</p>
		{#if $db_type != DBType.local}
			<p>(loading your {$db_type} data{$db_type == DBType.firebase ? ', from ' + dbDispatch.db.baseID : ''})</p>
		{/if}
	{:else if !$things_arrived}
		<p>Nothing is available.</p>
	{:else}
		{#if $id_popupView == ButtonID.help}
			<Help size={size}/>
		{:else if $id_popupView == ButtonID.buildNotes}
			<BuildNotes/>
		{:else if $id_popupView == null}
			<div class='top' style='z-index: {ZIndex.frontmost}'>
				<Crumbs/>
			</div>
			<div class='topTitle'
				style='color: {here?.color};;
					z-index: {ZIndex.frontmost};
					left: {$showDetails ? '100px' : '-1px'}'>
				{here?.title}
			</div>
			<div class='horizontalLine' style='z-index: {ZIndex.frontmost}; left: {$showDetails ? k.detailsMargin : 0}px; top: 85px;'></div>
			{#key graph_toggle}
				<Graph/>
			{/key}
		{/if}
	{/if}
</div>
