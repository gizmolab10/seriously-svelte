<script>
  import { Direction, grabs } from '../common/GlobalImports'
  import { viewID } from '../managers/State';
  import Graph from '../graph/Graph.svelte';
  import Crumbs from './Crumbs.svelte';
  import Button from './Button.svelte';
  import Help from './Help.svelte';
  let size = 15;

  function handleHelpClose() { $viewID = null; }

</script>

<div>
  <span class='left-margin'> </span>
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
