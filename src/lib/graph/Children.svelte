<script>
  import { Thing } from '../common/GlobalImports';
  import Widget from './Widget.svelte';
  export let thing = Thing | null;
</script>

{#if thing.children}
  <ul>
    {#each thing.children as child}
      <li><Widget thing={child}/></li>
    {/each}
  </ul>
{/if}

<style>
  ul { list-style: none; }
  li { line-height: 1.5; }
</style>
