<script>
  import { onMount, BulkIDs,  hierarchy, persistence } from '../common/GlobalImports'
  import { build, dbType, isBusy, bulkName, showDetails } from '../managers/State';
  import Panel from './Panel.svelte';
  let isLoading = true;

  onMount(async () => {
    $isBusy = true;
    $build = 24;  // predicates, too
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
{:else if hierarchy.hasNothing}
  <p>Nothing is available ($showDetails, $dbType).</p>
{:else}
  <Panel/>
{/if}

<style>
  p {
    text-align: center;
    font-size: 3em;
  }
</style>
