<script>
  import { cloudEditor, hierarchy, persistence, build, onMount } from '../common/GlobalImports'
  import Panel from './Panel.svelte';
  const useCRUD = true;
  let isLoading = true;
  let things = [];

  onMount(async () => {
    $build = 19;  // firebase writable store
    hierarchy.setup(() => {
      things = hierarchy.things;
      isLoading = false;
    })
    persistence.test();
  })
</script>

{#if isLoading}
  <p>Welcome to Seriously</p>
{:else if hierarchy.hasNothing}
  <p>Nothing is available.</p>
{:else if useCRUD}
  <Panel/>
{:else}
  Firestore!
  <ul>
    {#each things as thing}
      <li>{thing.title}</li>
    {/each}
  </ul>
{/if}

<style>
  p {
    text-align: center;
    font-size: 3em;
  }
</style>
