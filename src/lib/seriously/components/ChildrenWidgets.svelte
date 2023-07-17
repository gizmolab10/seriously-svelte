<svelte:options immutable = {true} />

<script>
  import { things, grabbing, graphEditor, onMount, onDestroy, signal, handleSignal, SignalKinds, relationships } from '../common/imports.ts';
  import Widget from './Widget.svelte';

  </script>

<div>
  <ul>
    {#each things.all as thing}
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
