<svelte:options immutable = {true} />

<script>
  import { things, onMount, onDestroy, signal, handleSignal, SignalKinds, relationships, Thing } from '../common/GlobalImports.ts';
  import Widget from './Widget.svelte';
  export let parent = Thing | null;

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
