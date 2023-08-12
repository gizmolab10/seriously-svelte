<script>
  import { grabs, ViewIDs } from '../common/GlobalImports'
  import { viewID } from '../managers/State';
  import Graph from '../graph/Graph.svelte';
  import Crumbs from './Crumbs.svelte';
  import Button from './Button.svelte';
  import Help from './Help.svelte';
  let size = 15;

  function handleHelpClose() { $viewID = null; }

</script>

<div>
  <span class='left-margin'>
    <Button openID={ViewIDs.details} size={size} borderColor='white'/>
  </span>
  <span class='main'>
    <Crumbs grab={grabs.grabbedThing}/>
    <Button openID={ViewIDs.help} size={size}/>
  </span>
  <div class='graph'>
    <Graph/>
  </div>
  {#if $viewID == ViewIDs.help}
    <Help onClose={handleHelpClose} size={size}/>
  {:else if $viewID == ViewIDs.details}
    wlkenal alkdnlnal alwlkeekrk
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
  .main {
    position: fixed;
    left: 32px
  }
  .graph {
    position: fixed;
    top: 20px
  }
</style>
