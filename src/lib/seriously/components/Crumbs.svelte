<script lang='ts'>
  import { things, Thing, relationships, grabbing } from '../common/Imports';
  import Crumb from './Crumb.svelte';
  let ancestors = [things.root];
  $: {
    let thing = grabbing.firstGrabbedThing;
    ancestors = [];
    while (thing != null) {
      ancestors.push(thing);
      thing = thing.firstParent;
    }
  }
</script>
{#each ancestors as thing}
  <Crumb thing={thing}/>
{/each}