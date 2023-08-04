<script>
  import { grabs } from '../common/GlobalImports'
  import HelpButton from './HelpButton.svelte';
  import Graph from '../graph/Graph.svelte';
  import Crumbs from './Crumbs.svelte';
  import Help from './Help.svelte';
  // import GraphD3 from '../aside/GraphD3.svelte';
  export let build;
  let isHelpOpen = false;

  function handleClose() {
    isHelpOpen = false;
  }

  function handleClick(event) {
    isHelpOpen = true;
  }
</script>

{#if isHelpOpen}
  <Help onClose={handleClose} />
{/if}
<span class="left-margin">
  build {build}
</span>
<span>
  <Crumbs grab={grabs.grabbedThing}/>
  <HelpButton onClick={handleClick}/>
  <Graph/>
</span>

<style>
  .left-margin {
    font-size: .625em;
    color: green;
    width: 75px;
    margin-right: 10px;
  }
</style>
