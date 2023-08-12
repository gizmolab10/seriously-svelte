<script>
  import { Direction, grabs, viewID } from '../common/GlobalImports'
  import Graph from '../graph/Graph.svelte';
  import Crumbs from './Crumbs.svelte';
  import Button from './Button.svelte';
  import Help from './Help.svelte';
  export let build;
  let size = 15;

  function handleHelpClose() { isHelpOpen = false; }

</script>

<div>
  <span class='left-margin'>
    build {build}
  </span>
  <span>
    <Crumbs grab={grabs.grabbedThing}/>
    <Button size={size} onClick={'?'}/>
    <Graph/>
  </span>
  {#if $viewID == '?'}
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
