<svelte:options immutable = {true} />

<script>
  import { hereID, things, grabbing, graphEditor, onMount, onDestroy, signal, handleSignal, SignalKinds, relationships } from '../common/imports.ts';
  import Widget from './Widget.svelte';
  var here = things.root;

  $: {
    console.log(here?.title);
    const newHere = things.thingFor($hereID); // executes whenever hereID changes
    if (newHere != null) {
      here = newHere;
    }
  }

</script>

<div>
  <ul>
    {#each here?.children as thing}
      <li>
        <Widget thing={thing}/>
      </li>
    {/each}
  </ul>
  <p/>
</div>

<style>
  li {
    line-height: 1.5;
  }
  ul {
    list-style: none;
  }
</style>
