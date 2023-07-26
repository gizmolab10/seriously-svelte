<svelte:options immutable = {true} />

<script>
  import { Thing, normalizeOrderOf } from '../common/GlobalImports.ts';
  import Widget from './Widget.svelte';
  export let parent = Thing | null;

  $: {
    normalizeOrderOf(parent.children);
  }

</script>

<ul>
  {#each parent.children as thing}
    <li><Widget thing={thing}/></li>
  {/each}
</ul>

<style>
  li {
    line-height: 1.5;
  }
  ul {
    list-style: none;
  }
</style>
