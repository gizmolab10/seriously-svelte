<svelte:options immutable = {true} />

<script>
  import { hereID, things, onMount, onDestroy, signal, handleSignal, SignalKinds, relationships } from '../common/GlobalImports.ts';
  import Widget from './Widget.svelte';
  export let here = Thing;

  $: {
    const newHere = things.thingFor($hereID); // executes whenever hereID changes
    if (newHere != null) {
      here = newHere;
    }
  }

</script>

{#key here}
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
{/key}

<style>
  li {
    line-height: 1.5;
  }
  ul {
    list-style: none;
  }
</style>
