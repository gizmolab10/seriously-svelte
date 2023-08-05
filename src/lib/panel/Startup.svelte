<script>
  import { cloud, hierarchy, onMount } from '../common/GlobalImports'
  import Panel from './Panel.svelte';
  let isLoading = true;
  const build = 15; // better title look and feel

  onMount(async () => {
    cloud.readAll(async () => {
      isLoading = false;
      hierarchy.root?.becomeHere()
      setTimeout(() => { // give crumbs time to be created after launch
        hierarchy.root?.grabOnly()
      }, 1);
    });
  })

</script>

{#if isLoading}
  <p>Welcome to Seriously</p>
{:else if !(hierarchy.root?.hasChildren ?? false)}
  <p>Nothing is available.</p>
{:else}
  <Panel build={build}/>
{/if}

<style>
  p {
    text-align: center;
    font-size: 5em;
  }
</style>
