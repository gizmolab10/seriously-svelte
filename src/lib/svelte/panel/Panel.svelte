<script>
	import { get, Grabs, DBType, onMount, PersistID, ButtonID, Hierarchy, dbDispatch, persistLocal } from '../../ts/common/GlobalImports'
	import { dbType, isBusy, bulkName, popupViewID, showDetails, thingsArrived } from '../../ts/managers/State';
	import CircularButton from '../kit/CircularButton.svelte';
	import BuildNotes from './BuildNotes.svelte';
	import Graph from '../graph/Graph.svelte';
	import Help from '../help/Help.svelte';
	import Details from './Details.svelte';
	import Crumbs from './Crumbs.svelte';
	let size = 14;

	function handleClick(id) {
		$popupViewID = ($popupViewID == id) ? null : id;
	}
	
	function handleSettings(event) {
		$showDetails = !$showDetails;
		persistLocal.writeToKey(PersistID.details, $showDetails);
	}

	onMount(async () => {
		persistLocal.setup();
	})

	// border: 1px solid yellow; /* yellow or white */

	</script>

<div class='left-side'>
	<CircularButton
		image='settings.png'
		borderColor='white'
		onClick={handleSettings}/>
	&nbsp;
	{#if !$isBusy}
		<CircularButton x=75
			onClick={() => {handleClick(ButtonID.help)}}
			label='?'
			size={size}/>
	{/if}
	{#if $showDetails}
		<Details/>
	{/if}
</div>
<div class='vertical-line'></div>
<div class='horizontal-line'></div>
<div class='right-side'>
	{#if $isBusy}
		<p>Welcome to Seriously</p>
		{#if $dbType != DBType.local}
			<p>(loading your data from {$dbType})</p>
		{/if}
	{:else if !$thingsArrived}
		<p>Nothing is available.</p>
	{:else}
		<div class='top'>
			<Crumbs grab={dbDispatch.db.hierarchy.grabs.grabbedThing}/>
		</div>
		<div class='graph'>
			<Graph/>
		</div>
	{/if}
	{#if $popupViewID == ButtonID.help}
		<Help size={size}/>
	{:else if $popupViewID == ButtonID.buildNotes}
		<BuildNotes/>
	{/if}
</div>

<style>
	p {
		text-align: center;
		font-size: 3em;
	}
	div {
		cursor: default;
	}
	.right-side {
		position: fixed;
		left: 20%;
	}
	.left-side {
		position: fixed;
		width: 100px;
		margin: 1px;
	}
	.top {
		position: fixed;
		left: 110px;
		top: 6px;
	}
	.graph {
		position: fixed;
		left: 101px;
		top: 33px;
		height: 500px;
		width: 600px;
	}
	.horizontal-line {
		position: absolute;
		left: -10px;
		top: 32px;
		height: 1px;
		width: 100%;
		background-color: lightgray;
	}
	.vertical-line {
		position: absolute;
		left: 100px;
		top: 0;
		height: 100%;
		width: 1px;
		background-color: lightgray;
	}
</style>
