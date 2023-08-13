<script>
  import { cloudEditor, hierarchy, ButtonIDs, onMount } from '../common/GlobalImports'
  import { build, bulk } from '../managers/State';
  import Button from './Button.svelte';
  import Panel from './Panel.svelte';
  const useCRUD = false;
  let isLoading = true;
  let things = [];

  onMount(async () => {
    $build = 20;  // details, firebase writable store
    $bulk = 'Jonathan Sand';
    hierarchy.setup(useCRUD, () => {
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
  <Panel/>
{:else}
  <span>
    <Button openID={ButtonIDs.details} size=15 borderColor='white'/>
  </span>
  <div>
    Firestore {$bulk}!
    <ul>
      {#each things as thing}
        <li>{thing.title}</li>
      {/each}
    </ul>
  </div>
{/if}

<style>
  p {
    text-align: center;
    font-size: 3em;
  }
  div {
    position: fixed;
    left: 53px
  }
 span {
    position: fixed;
    margin: 1px;
    width: 75px;
  }
</style>
