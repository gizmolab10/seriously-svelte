<script>
	import { get, noop, Rect, Point, DBType, ZIndex, onMount, PersistID, ButtonID, constants, Hierarchy } from '../../ts/common/GlobalImports'
	import { dbDispatch, persistLocal, getBrowserType, isMobileDevice, isServerLocal, updateGraphRect } from '../../ts/common/GlobalImports'
	import { build, dbType, isBusy, idHere, graphRect, popupViewID, thingsArrived } from '../../ts/managers/State';
	import CircularButton from '../kit/CircularButton.svelte';
	import LabelButton from '../kit/LabelButton.svelte';
	import BuildNotes from './BuildNotes.svelte';
	import Graph from '../graph/Graph.svelte';
	import Help from '../help/Help.svelte';
	import Crumbs from './Crumbs.svelte';
	let toggleDraw = false;
	let size = 14;
	
	function handleBuildsClick(event) { $popupViewID = ButtonID.buildNotes; }
	function handleClick(id) { $popupViewID = ($popupViewID == id) ? null : id; }
	window.addEventListener('resize', (event) => { updateGraphRect(); toggleDraw = !toggleDraw; });

	onMount(async () => {
		document.title = 'Seriously ('+ (isServerLocal() ? 'local' : 'remote') + ', ' + getBrowserType()  + ', α)';
		updateGraphRect();
		persistLocal.restore();
		constants.setup();
	})

</script>

<div class='vertical-line'></div>
<div class='horizontal-line' style='z-index: {ZIndex.top}'></div>
<div class='right-side'>
	{#if $isBusy}
		<p>Welcome to Seriously</p>
		{#if $dbType != DBType.local}
			<p>(loading your data from {$dbType})</p>
		{/if}
	{:else if !$thingsArrived}
		<p>Nothing is available.</p>
	{:else}
		<div class='left-side'>
			<div class='build'>
				<LabelButton
					title='build {$build}'
					onClick={handleBuildsClick}/>
			</div>
			<CircularButton left=85
				onClick={() => {handleClick(ButtonID.help)}}
				label='i'
				size={size}/>
		</div>
		<div class='top'>
			<Crumbs here={dbDispatch.db.hierarchy.getThing_forID($idHere)}/>
		</div>
		{#key toggleDraw}
			<div class='graph'
				style='
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
	.build {
		position: fixed;
		top: 6.5px;
		left: 10px
	}
	.right-side {
		position: fixed;
		left: 101px;
	}
	.left-side {
		position: fixed;
		height: 100%;
		width: 100px;
		margin: 1px;
		left: -1px;
	}
	.top {
		position: fixed;
		left: 110px;
		top: 6px;
	}
	.graph {
		position: fixed;
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
		top: 0px;
		height: 35px;
		width: 1px;
		background-color: lightgray;
	}
</style>
