<script>
  import { grabs, DBTypes, ButtonIDs, hierarchy, persistence } from '../common/GlobalImports'
  import { dbType, fireBulk, popupViewID, showDetails } from '../managers/State';
  import Graph from '../graph/Graph.svelte';
  import Details from './Details.svelte';
  import Crumbs from './Crumbs.svelte';
  import Button from './Button.svelte';
  import Help from './Help.svelte';
  let size = 15;
  
  function handleClick(id) {
    $popupViewID = ($popupViewID == id) ? null : id;
  }
  
  function handleSettings(event) {
    $showDetails = !$showDetails;
    persistence.writeToKey('details', $showDetails);
  }
</script>

<div>
  <div class="horizontal-line"></div>
  {#if $dbType == DBTypes.airtable}
    <span class='top'>
      <Crumbs grab={grabs.grabbedThing}/>
      <Button
        onClick={() => {handleClick(ButtonIDs.help)}}
        label='?'
        size={size}/>
    </span>
    <div class='graph'>
      <Graph/>
    </div>
  {:else}
    <div class='firebase'>
      &nbsp; &nbsp; &nbsp; Firestore {$fireBulk}!
      <ul>
        {#each hierarchy.things as thing}
          <li>{thing.title}</li>
        {/each}
      </ul>
    </div>
  {/if}

  <span class='left-margin'>
    <Button
      image='settings.png'
      size=15
      borderColor='white'
      onClick={handleSettings}/>
    {#if $showDetails}
      <Details size={size}/>
    {/if}
  </span>
  <div class="vertical-line"></div>

  {#if $popupViewID == ButtonIDs.help}
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
