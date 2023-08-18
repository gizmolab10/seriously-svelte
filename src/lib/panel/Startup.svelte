<script>
  import { get, onMount, BulkIDs,  hierarchy, persistence } from '../common/GlobalImports'
  import { dbType, isBusy, thingsArrived } from '../managers/State';
  import Panel from './Panel.svelte';
  let isLoading = true;

  onMount(async () => {
    persistence.setup();
  })
</script>

{#if $isBusy}
  <p>Welcome to Seriously</p>
  <p>(loading your data from {get(dbType)})</p>
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
