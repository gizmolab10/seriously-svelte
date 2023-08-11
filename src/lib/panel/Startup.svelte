<script>
  import { cloudEditor, hierarchy, onMount } from '../common/GlobalImports'
  const build = 19; // firebase writable store
  import Panel from './Panel.svelte';
  const useCRUD = true;
  let isLoading = true;
  let things = [];

  onMount(async () => {
    hierarchy.setup(() => {
      things = hierarchy.things;
      isLoading = false;
    })
  })
</script>

{#if isLoading}
  <p>Welcome to Seriously</p>
{:else if hierarchy.hasNothing}
  <p>Nothing is available.</p>
{:else if useCRUD}
  <Panel build={build}/>
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
