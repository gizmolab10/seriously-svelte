<script>
  import { grabs } from '../common/GlobalImports'
  import HelpButton from './HelpButton.svelte';
  import Graph from '../graph/Graph.svelte';
  import Crumbs from './Crumbs.svelte';
  import Help from './Help.svelte';
  // import GraphD3 from '../aside/GraphD3.svelte';
  export let build;
  let isHelpOpen = false;
  let size = 15;

  function handleClose() {
    isHelpOpen = false;
  }

  function handleClick(event) {
    isHelpOpen = true;
  }
</script>

<div>
  <span class='left-margin'>
    build {build}
  </span>
  <span>
    <Crumbs grab={grabs.grabbedThing}/>
    <Graph/>
    <HelpButton class='help-button' size={size} onClick={handleClick}/>
  </span>
  {#if isHelpOpen}
    <Help size={size} onClose={handleClose} />
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
  .help-button {
    position: fixed;
    bottom: 10px;
    right: 10px; 
  }
</style>
