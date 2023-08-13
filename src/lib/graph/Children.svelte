<script>
  import { Thing } from '../common/GlobalImports';
  import Widget from './Widget.svelte';
  export let parent = Thing | null;
</script>

<ul>
  {#each parent.children as thing}
    <li><Widget thing={thing}/></li>
  {/each}
</ul>

<style>
  ul { list-style: none; }
  li { line-height: 1.5; }
</style>
