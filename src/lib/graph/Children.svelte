<script>
  import { Thing } from '../common/GlobalImports';
  import Widget from './Widget.svelte';
  export let children = [];
</script>

{#if children.length != 0}
  <ul>
    {#each children as child}
      <li><Widget thing={child}/></li>
    {/each}
  </ul>
{/if}

<style>
  ul { list-style: none; }
  li { line-height: 1.5; }
</style>
