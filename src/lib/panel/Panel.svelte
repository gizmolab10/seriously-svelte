<script>
  import { Direction, grabs } from '../common/GlobalImports'
  import HelpButton from '../help/HelpButton.svelte';
  // import GraphD3 from '../aside/GraphD3.svelte';
  import Graph from '../graph/Graph.svelte';
  import Help from '../help/Help.svelte';
  import Crumbs from './Crumbs.svelte';
  let isHelpOpen = false;
  export let build;
  let size = 15;

  function handleHelpClose() { isHelpOpen = false; }
  function handleHelpClick(event) { isHelpOpen = true; }

</script>

<div>
  <span class='left-margin'>
    build {build}
  </span>
  <span>
    <Crumbs grab={grabs.grabbedThing}/>
    <HelpButton size={size} onClick={handleHelpClick}/>
    <Graph showHelp={handleHelpClick}/>
  </span>
  {#if isHelpOpen}
    <Help size={size} onClose={handleHelpClose} />
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
