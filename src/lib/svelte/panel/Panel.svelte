<script>
	import { k, get, Rect, Point, Thing, launch, DBType, ZIndex, onMount, PersistID, dbDispatch } from '../../ts/common/GlobalImports'
	import { dbType, isBusy, idHere, build, graphRect, popupViewID, showDetails, thingsArrived } from '../../ts/managers/State';
	import { ButtonID, Hierarchy, persistLocal, updateGraphRect } from '../../ts/common/GlobalImports'
	import CircularButton from '../kit/CircularButton.svelte';
	import LabelButton from '../kit/LabelButton.svelte';
	import BuildNotes from './BuildNotes.svelte';
	import Graph from '../graph/Graph.svelte';
	import Help from '../help/Help.svelte';
	import Details from './Details.svelte';
	import Crumbs from './Crumbs.svelte';
	let toggleDraw = false;
	let here = Thing;
	let size = 14;
	
	function handleBuildsClick(event) { $popupViewID = ($popupViewID == ButtonID.buildNotes) ? null : ButtonID.buildNotes; }
	function handleHelpClick() { $popupViewID = ($popupViewID == ButtonID.help) ? null : ButtonID.help; }
	window.addEventListener('resize', (event) => { updateGraphRect(); toggleDraw = !toggleDraw; });
	$: { here = dbDispatch.db.hierarchy.thing_getForID($idHere); }
	function ignore(event) {}
	
	onMount(async () => {
		launch.setup();
		updateGraphRect();
	})
	
	function handleSettings(event) {
		$showDetails = !$showDetails;
		persistLocal.writeToKey(PersistID.details, $showDetails);
		updateGraphRect();
	}

</script>

<div class='leftSide'
	style='
		z-index: {ZIndex.frontmost}; 
		background-color: {k.backgroundColor};
		height: {$showDetails ? '100%' : '33px'};
		'>
	<div style='position: absolute; top: 8px;'>
		<CircularButton left=15
			image='settings.svg'
			borderColor='white'
			onClick={handleSettings}/>
			<button class='build' on:click={handleBuildsClick}>{$build}</button>
		{#if !$isBusy}
			<CircularButton left=85
				onClick={() => {handleHelpClick()}}
				label='i'
				size={size}/>
		{/if}
		{#if $showDetails}
			<Details/>
		{/if}
	</div>
</div>
<div class='horizontalLine' style='z-index: {ZIndex.frontmost}; left: -10px; top: 32px; width: {$popupViewID ? '111px' : '110%'};'></div>
<div class='verticalLine' style='height: {$showDetails ? '100%' : '33px'}; z-index: {ZIndex.frontmost};'></div>
<div class='rightSide' style='left: {$showDetails ? k.detailsMargin : 0}px; z-index: {ZIndex.panel};'>
	{#if $isBusy}
		<p>Welcome to Seriously</p>
		{#if $dbType != DBType.local}
			<p>(loading your {$dbType} data{$dbType == DBType.firebase ? ', from ' + dbDispatch.db.baseID : ''})</p>
		{/if}
	{:else if !$thingsArrived}
		<p>Nothing is available.</p>
	{:else}
		{#if $popupViewID == ButtonID.help}
			<Help size={size}/>
		{:else if $popupViewID == ButtonID.buildNotes}
			<BuildNotes/>
		{:else if $popupViewID == null}
			<div class='top' style='z-index: {ZIndex.frontmost}'>
				<Crumbs/>
			</div>
			<div class='topTitle'
				style='color: {here?.color};
					left: {$showDetails ? '100px' : '-1px'};
					z-index: {ZIndex.frontmost}
					left: 100px;'>
				{here?.title}
			</div>
			<div class='horizontalLine' style='z-index: {ZIndex.frontmost}; left: {$showDetails ? k.detailsMargin : 0}px; top: 85px;'></div>
			{#key toggleDraw}
				<div class='graph'
					style='
						overflow: hidden;
						z-index: {ZIndex.panel};
						top: {$graphRect.origin.y}px;
						left: {$graphRect.origin.x}px;
						width: {$graphRect.size.width}px;
						height: {$graphRect.size.height}px;'
					on:keyup={ignore}
					on:keydown={ignore}
					on:keypress={ignore}
					on:click={() => { $popupViewID = null; }}>
					<Graph/>
				</div>
			{/key}
		{/if}
	{/if}
</div>

<style>
	div {
		cursor: default;
	}
	.graph {
		position: fixed;
	}
	.rightSide {
		position: fixed;
	}
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
