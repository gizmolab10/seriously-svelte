<script>
  import { cloudEditor, hierarchy, onMount } from '../common/GlobalImports'
  import Panel from './Panel.svelte';
  let isLoading = true;
  const build = 17; // access and users tables, play with svg triangles

  onMount(async () => {
    cloudEditor.readAll(async () => {
      isLoading = false;
      hierarchy.root?.becomeHere()
      setTimeout(() => { // give crumbs time to be created after launch
        hierarchy.root?.grabOnly()
      }, 1);
    });
  })

  function hasNothing() { return !(hierarchy.root?.hasChildren ?? false); }

  </script>

{#if isLoading}
  <p>Welcome to Seriously</p>
{:else if hasNothing()}
  <p>Nothing is available.</p>
{:else}
  <Panel build={build}/>
{/if}

<style>
  p {
    text-align: center;
    font-size: 3em;
  }
</style>
