<script>
  import { get, grabs, DBType, ButtonID, hierarchy, persistence, LocalID, DataKind } from '../common/GlobalImports'
  import { dbType, bulkName, popupViewID, showDetails, thingsArrived } from '../managers/State';
  import CircularButton from '../kit/CircularButton.svelte';
  import Graph from '../graph/Graph.svelte';
  import Details from './Details.svelte';
  import Crumbs from './Crumbs.svelte';
  import Help from './Help.svelte';
  let size = 15;

  function handleClick(id) {
    $popupViewID = ($popupViewID == id) ? null : id;
  }
  
  function handleSettings(event) {
    $showDetails = !$showDetails;
    persistence.writeToKey(LocalID.details, $showDetails);
  }
</script>

<div>
  <span class='left-margin'>
    <CircularButton
      image='settings.png'
      size=15
      borderColor='white'
      onClick={handleSettings}/>
    {#if $showDetails}
      <Details size={size}/>
    {/if}
  </span>
  <div class="vertical-line"></div>

  {#if $thingsArrived}
    <div class="horizontal-line"></div>
      <span class='top'>
        <Crumbs grab={grabs.grabbedThing}/>
        <CircularButton
          onClick={() => {handleClick(ButtonID.help)}}
          label='?'
          size={size}/>
      </span>
      <div class='graph'>
        <Graph/>
      </div>
  {/if}

  {#if $popupViewID == ButtonID.help}
    <Help size={size}/>
  {/if}
</div>

<style>
  div {
     cursor: default;
  }
  .left-margin {
    position: fixed;
    width: 100px;
    margin: 1px;
  }
  .top {
    position: fixed;
    left: 110px;
  }
  .graph {
    position: fixed;
    left: 70px;
    top: 20px;
  }
  .firebase {
    position: fixed;
    left: 90px;
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
