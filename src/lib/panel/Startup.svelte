<script>
  import { onMount, DBTypes, BulkIDs,  hierarchy, cloudEditor, persistence } from '../common/GlobalImports'
  import { build, fireBulk, dbType } from '../managers/State';
  import Button from './Button.svelte';
  import Panel from './Panel.svelte';
  let isLoading = true;

  onMount(async () => {
    $dbType = DBTypes.firebase;
    $build = 20;  // prepare for details, firebase writable store
    $fireBulk = BulkIDs.public;
    await hierarchy.setup(() => {
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
