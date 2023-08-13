<script>
  import { onMount, DBTypes, hierarchy, cloudEditor } from '../common/GlobalImports'
  import { build, viewID, bulk, dbType } from '../managers/State';
  import Button from './Button.svelte';
  import Panel from './Panel.svelte';
  let isLoading = true;
  let things = [];

  onMount(async () => {
    $dbType = DBTypes.crud;
    $build = 20;  // details, firebase writable store
    $bulk = 'Jonathan Sand';
    hierarchy.setup($dbType = DBTypes.crud, () => {
      things = hierarchy.things;
      isLoading = false;
    })
  })
</script>

{#if isLoading}
  <p>Welcome to Seriously</p>
{:else if hierarchy.hasNothing}
  <p>Nothing is available.</p>
{:else}
  <Panel/>
{/if}

<style>
  p {
    text-align: center;
    font-size: 3em;
  }
</style>
