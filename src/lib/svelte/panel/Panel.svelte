<script>
  import { get, grabs, DBType, onMount, LocalID, ButtonID, DataKind, Hierarchy, persistLocal } from '../../ts/common/GlobalImports'
  import { dbType, isBusy, bulkName, popupViewID, showDetails, thingsArrived } from '../../ts/managers/State';
  import CircularButton from '../kit/CircularButton.svelte';
  import BuildNotes from './BuildNotes.svelte';
  import Graph from '../graph/Graph.svelte';
  import Details from './Details.svelte';
  import Help from '../help/Help.svelte';
  import Crumbs from './Crumbs.svelte';
  let size = 15;

  function handleClick(id) {
    $popupViewID = ($popupViewID == id) ? null : id;
  }
  
  function handleSettings(event) {
    $showDetails = !$showDetails;
    persistLocal.writeToKey(LocalID.details, $showDetails);
  }

  onMount(async () => {
    persistLocal.setup();
  })
</script>

<span class='left-side'>
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
</span>
<span class='vertical-line'></span>
<span class='horizontal-line'></span>
<span class='right-side'>
  {#if $isBusy}
    <p>Welcome to Seriously</p>
    {#if $dbType != DBType.local}
      <p>(loading your data from {$dbType})</p>
    {/if}
  {:else if !$thingsArrived}
    <p>Nothing is available.</p>
  {:else}
    <span class='top'>
      <Crumbs grab={grabs.grabbedThing}/>
    </span>
    <span class='graph'>
      <Graph/>
    </span>
  {/if}
  {#if $popupViewID == ButtonID.help}
    <Help size={size}/>
  {:else if $popupViewID == ButtonID.buildNotes}
    <BuildNotes/>
  {/if}
</span>

<style>
  p {
    text-align: center;
    font-size: 3em;
  }
  span {
     cursor: default;
  }
  .right-side {
    position: fixed;
    right: 100px;
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
    left: 70px;
    top: 20px;
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
