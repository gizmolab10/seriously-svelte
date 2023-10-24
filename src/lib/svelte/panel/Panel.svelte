<script>
	import { k, get, noop, Rect, Point, Thing, DBType, ZIndex, onMount, PersistID, ButtonID, Hierarchy, dbDispatch } from '../../ts/common/GlobalImports'
	import { persistLocal, getBrowserType, isServerLocal, isMobileDevice, updateGraphRect } from '../../ts/common/GlobalImports'
	import { dbType, isBusy, idHere, build, graphRect, popupViewID, showDetails, thingsArrived } from '../../ts/managers/State';
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
	
	function handleHelpClick() { $popupViewID = ($popupViewID == ButtonID.help) ? null : ButtonID.help; }
	window.addEventListener('resize', (event) => { updateGraphRect(); toggleDraw = !toggleDraw; });
	function handleBuildsClick(event) { $popupViewID = ButtonID.buildNotes; }

	onMount(async () => {
		document.title = 'Seriously ('+ (isServerLocal() ? 'local' : 'remote') + ', ' + getBrowserType()  + ', α)';
		updateGraphRect();
		persistLocal.restore();
		k.setup();
	})

	$: {
		here = dbDispatch.db.hierarchy.thing_getForID($idHere);
	}
	
	function handleSettings(event) {
		$showDetails = !$showDetails;
		persistLocal.writeToKey(PersistID.details, $showDetails);
	}

</script>

<div class='left-side'
	style='
		z-index: {ZIndex.frontmost}; 
		background-color: {k.backgroundColor};
		height: {$showDetails ? '100%' : '33px'};
		'>
	<CircularButton left=15
		image='settings.svg'
		borderColor='white'
		onClick={handleSettings}/>
	&nbsp;
		<button on:click={handleBuildsClick} class='build'>notes</button>
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
<div class='horizontal-line' style='z-index: {ZIndex.frontmost}; left: -10px; top: 32px;'></div>
<div class='vertical-line' style='height: {$showDetails ? '100%' : '33px'}; z-index: {ZIndex.frontmost};'></div>
<div class='right-side' style='left: {$showDetails ? k.detailsMargin : 0}px; z-index: {ZIndex.base};'>
	{#if $isBusy}
		<p>Welcome to Seriously</p>
		{#if $dbType != DBType.local}
			<p>(loading your {$dbType} data{$dbType == DBType.firebase ? ', from ' + dbDispatch.bulkName : ''})</p>
		{/if}
	{:else if !$thingsArrived}
		<p>Nothing is available.</p>
	{:else}
		<div class='top' style='z-index: {ZIndex.frontmost}'>
			<Crumbs/>
		</div>
		<div class='title' style='color: {here?.color}; z-index: {ZIndex.frontmost}'>
			{here?.title}
		</div>
		<div class='horizontal-line' style='z-index: {ZIndex.frontmost}; left: {$showDetails ? k.detailsMargin : 0}px; top: 85px;'></div>
		{#if $popupViewID == null}
		{#key toggleDraw}
			<div class='graph'
				style='
					overflow: hidden;
					z-index: {ZIndex.base};
					top: {$graphRect.origin.y}px;
					left: {$graphRect.origin.x}px;
					width: {$graphRect.size.width}px;
					height: {$graphRect.size.height}px;'
				on:keyup={noop()}
				on:keydown={noop()}
				on:keypress={noop()}
				on:click={() => { $popupViewID = null; }}>
				<Graph/>
			</div>
		{/key}
		{:else if $popupViewID == ButtonID.help}
			<Help size={size}/>
		{:else if $popupViewID == ButtonID.buildNotes}
			<BuildNotes/>
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
	.right-side {
		position: fixed;
	}
	p {
		text-align: center;
		font-size: 3em;
	}
	.top {
		position: fixed;
		left: 110px;
		top: 6px;
	}
	.build {
		top: -2px;
		left: 26px;
		cursor: pointer;
		border: 1px solid;
		position: absolute;
		border-radius: 0.5em;
	}
	.title {
		text-align: center;
		position: fixed;
		font-size: 2em;
		width: 100%;
		left: -1px;
		top: 40px;
	}
	.left-side {
		position: fixed;
		width: 100px;
		margin: 1px;
		left: -1px;
	}
	.horizontal-line {
		position: fixed;
		height: 1px;
		width: 110%;
		background-color: lightgray;
	}
	.vertical-line {
		position: absolute;
		left: 100px;
		top: 0px;
		width: 1px;
		background-color: lightgray;
	}
</style>
