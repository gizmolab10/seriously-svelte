<svelte:options immutable = {true} />

<script>
  import { Entity, entities, grabbing, graphEditor, onMount, onDestroy, signal, handleSignal, SignalKinds, relationships } from '../common/imports.ts';
  import Widget from './Widget.svelte';

  </script>

<div>
  <ul>
    {#each entities.all as entity}
      <li>
        <Widget entity={entity}/>
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
