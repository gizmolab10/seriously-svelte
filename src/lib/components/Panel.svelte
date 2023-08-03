<script>
  import { hierarchy } from '../common/GlobalImports'
  import Crumbs from './Crumbs.svelte';
  import Graph from './Graph.svelte';
  // import GraphD3 from '../aside/GraphD3.svelte';

</script>

<Crumbs grab={hierarchy.grabbedThing}/>
<Graph/>
