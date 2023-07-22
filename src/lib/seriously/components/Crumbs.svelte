<script lang='ts'>
  import { things, Thing, relationships, grabbedIDs } from '../common/GlobalImports';
  import Crumb from './Crumb.svelte';
  let ancestors = [things.root];

  $: {
    if ($grabbedIDs.length > 0) {
      const id = $grabbedIDs[0];
      let thing = things.thingFor(id);
      ancestors = [];
      while (thing != null) {
        ancestors.push(thing);
        thing = thing.firstParent;
      }
      ancestors;
    }
  }
</script>

{#each ancestors as thing}
  <Crumb thing={thing}/>
{/each}