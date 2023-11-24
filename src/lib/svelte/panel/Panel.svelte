<script>
	import { k, get, Rect, Size, Point, Thing, launch, DBType, ZIndex, onMount, PersistID, dbDispatch } from '../../ts/common/GlobalImports'
	import { dbType, isBusy, idHere, build, graphRect, popupViewID, showDetails, thingsArrived } from '../../ts/managers/State';
	import { signal, Signals, ButtonID, Hierarchy, persistLocal, updateGraphRect } from '../../ts/common/GlobalImports'
	import CircularButton from '../kit/CircularButton.svelte';
	import LabelButton from '../kit/LabelButton.svelte';
	import BuildNotes from './BuildNotes.svelte';
	import Graph from '../graph/Graph.svelte';
	import Help from '../help/Help.svelte';
	import Details from './Details.svelte';
	import Crumbs from './Crumbs.svelte';
	let size_graphRect = Size;
	let toggleDraw = false;
	let here = Thing;
	let size = 14;
	
	function handleBuildsClick(event) { $popupViewID = ($popupViewID == ButtonID.buildNotes) ? null : ButtonID.buildNotes; }
	function handleHelpClick() { $popupViewID = ($popupViewID == ButtonID.help) ? null : ButtonID.help; }
	window.addEventListener('resize', (event) => { updateGraphRect(); toggleDraw = !toggleDraw; });
	function ignore(event) {}

	$: {
		here = dbDispatch.db.hierarchy.thing_getForID($idHere);
		if ($graphRect) {
			size_graphRect = $graphRect.size;
		}
	}
	
	onMount(async () => {
		launch.setup();
		signal(Signals.childrenOf);
	})
	
	function handleSettings(event) {
		$showDetails = !$showDetails;
		signal(Signals.childrenOf);
		persistLocal.writeToKey(PersistID.details, $showDetails);
	}

</script>

<div class='leftSide'
	style='top: 8px;
		position: fixed;
		z-index: {ZIndex.frontmost}; 
		background-color: transparent;
		height: {$showDetails ? '100%' : '33px'};'>
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
<div class='horizontalLine' style='z-index: {ZIndex.frontmost}; left: -10px; top: 32px; width: {$popupViewID ? '111px' : '110%'};'></div>
<div class='verticalLine' style='height: {$showDetails ? '100%' : '33px'}; z-index: {ZIndex.frontmost};'></div>
<div class='rightSide' style='
	left: {$showDetails ? 100 : 0}px;
	height: 100%;
	position: fixed;
	overflow: hidden;
	z-index: {ZIndex.panel};
	width: {size_graphRect.width}px;'>
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
				style='color: {here?.color};;
					z-index: {ZIndex.frontmost};
					left: {$showDetails ? '100px' : '-1px'}'>
				{here?.title}
			</div>
			<div class='horizontalLine' style='z-index: {ZIndex.frontmost}; left: {$showDetails ? k.detailsMargin : 0}px; top: 85px;'></div>
			{#key toggleDraw}
				<div class='graph'
					style='
						position: fixed;
						z-index: {ZIndex.panel};
						top: {$graphRect.origin.y + 8}px;
						left: {$graphRect.origin.x - ($showDetails ? k.detailsMargin : 0)}px;
						width: {size_graphRect.width}px;
						height: {size_graphRect.height}px;'
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
