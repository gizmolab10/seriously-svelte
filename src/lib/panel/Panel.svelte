<script>
  import { grabs, DBTypes, ButtonIDs, hierarchy } from '../common/GlobalImports'
  import { fireBulk, popupViewID, dbType } from '../managers/State';
  import Graph from '../graph/Graph.svelte';
  import Details from './Details.svelte';
  import Crumbs from './Crumbs.svelte';
  import Button from './Button.svelte';
  import Help from './Help.svelte';
  let size = 15;
  function handleClick(id) { $popupViewID = ($popupViewID == id) ? null : id; }
</script>

<div>
  <span class='left-margin'>
    <Button
      image='settings.png'
      size=15
      borderColor='white'
      onClick={() => {handleClick(ButtonIDs.details)}}/>
  </span>

  {#if $dbType == DBTypes.crud}
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
    <div id='firebase'>
      &nbsp; &nbsp; &nbsp; Firestore {$fireBulk}!
      <ul>
        {#each hierarchy.things as thing}
          <li>{thing.title}</li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if $popupViewID == ButtonIDs.help}
    <Help size={size}/>
  {:else if $popupViewID == ButtonIDs.details}
    <Details size={size}/>
  {/if}
</div>

<style>
  div {
     cursor: default;
  }
  .left-margin {
    position: fixed;
    margin: 1px;
    width: 75px;
  }
  .top, .firebase {
    position: fixed;
    left: 53px
  }
  .graph {
    position: fixed;
    top: 20px
  }
</style>
