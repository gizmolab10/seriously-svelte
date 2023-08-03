<script>
  import { hierarchy } from '../common/GlobalImports'
  import Graph from '../graph/Graph.svelte';
  import Crumbs from './Crumbs.svelte';
  // import GraphD3 from '../aside/GraphD3.svelte';
  export let build;

</script>

<span>build {build} &nbsp;&nbsp;</span>
<Crumbs grab={hierarchy.grabbedThing}/>
<Graph/>

<style>
  span {
    font-size: .625em;
    color: green;
  }
</style>
