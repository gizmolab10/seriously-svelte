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
    <Button size={23} onClick={ViewIDs.details}/>
  </span>
  <span>
    <Crumbs grab={grabs.grabbedThing}/>
    <Button size={size} onClick={ViewIDs.help}/>
    <Graph/>
  </span>
  {#if $viewID == ViewIDs.help}
    <Help size={size} onClose={handleHelpClose} />
  {:else if $viewID == ViewIDs.details}
    wlkenal alkdnlnal alwlkeekrk
  {/if}
</div>

<style>
  div {
     cursor: default;
  }
  .left-margin {
    font-size: .625em;
    color: green;
    width: 75px;
    margin-right: 10px;
  }
</style>
