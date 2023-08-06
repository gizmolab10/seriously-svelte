<script>
  // import GraphD3 from '../aside/GraphD3.svelte';
  import { grabs } from '../common/GlobalImports'
  import HelpButton from '../buttons/HelpButton.svelte';
  import Graph from '../graph/Graph.svelte';
  import Crumbs from './Crumbs.svelte';
  import Help from './Help.svelte';
  let isHelpOpen = false;
  export let build;
  let size = 15;

  function handleClose() { isHelpOpen = false; }
  function handleHelpClick(event) { isHelpOpen = true; }
  function handleSVGClick(event) { alert('hah'); }
</script>

<div style='cursor: default'> <!-- override vertical bar hovering over text -->
  <span class='left-margin'>
    build {build}
    <!-- button on:click={handleSVGClick}>
      <object type="image/svg+xml" data="/triangle.rounded.svg"/>
    </button -->
  </span>
  <span>
    <Crumbs grab={grabs.grabbedThing}/>
    <HelpButton size={size} onClick={handleHelpClick}/>
    <Graph/>
  </span>
  {#if isHelpOpen}
    <Help size={size} onClose={handleClose} />
  {/if}
</div>

<style>
  .left-margin {
    font-size: .625em;
    color: green;
    width: 75px;
    margin-right: 10px;
  }
  
  object {
    width: 18px;
    height: 18px;
    margin-right: 8px;
  }

  button {
    fill: none;
    border: none;
    position: relative;
    right: 30px;
    top: 50px;
  }
</style>
