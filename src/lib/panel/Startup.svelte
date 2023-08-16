<script>
  import { onMount, BulkIDs,  hierarchy, persistence } from '../common/GlobalImports'
  import { dbType, isBusy, bulkName, thingsArrived } from '../managers/State';
  import Panel from './Panel.svelte';
  let isLoading = true;

  onMount(async () => {
    $isBusy = true;   // also used by Details radio buttons
    persistence.setup();
    $bulkName = BulkIDs.public;
    await hierarchy.setup($dbType, () => {
      $isBusy = false;
    })
  })
</script>

{#if $isBusy}
  <p>Welcome to Seriously</p>
  <p>(loading your data now)</p>
{:else if !$thingsArrived}
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
