<script>
  import { onMount } from 'svelte';
  let showItems = true;
  let showBrowse = false;
  let showDots = false;
  let dots;
  let items;
  let browse;

  const toggleItems = () => {
    showItems = !showItems;
    showBrowse = false;
    showDots = false;
  };

  const toggleBrowse = () => {
    showItems = false;
    showBrowse = !showBrowse;
    showDots = false;
  };

  const toggleDots = () => {
    showItems = false;
    showBrowse = false;
    showDots = !showDots;
  };

  onMount(() => {
    import('./HelpItems.svelte').then(module => {
      items = module.default;
    });
    import('./HelpBrowse.svelte').then(module => {
      browse = module.default;
    });
    import('./HelpDots.svelte').then(module => {
      dots = module.default;
    });
  });
</script>

<div class='buttons-container'>
  <button class:selected={showItems} on:click={toggleItems}>Items</button>
  <button class:selected={showBrowse} on:click={toggleBrowse}>Browse</button>
  <button class:selected={showDots} on:click={toggleDots}>Dots</button>
</div>
{#if showItems && items}
  <svelte:component this={items} />
{/if}
{#if showBrowse && browse}
  <svelte:component this={browse} />
{/if}
{#if showDots && dots}
  <svelte:component this={dots} />
{/if}

<style>
  button {
    border: 1px solid;
    border-radius: 0.5em;
  }
  .selected {
    background-color: #007bff;
    color: white;
  }
  .buttons-container {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    justify-content: center;
  }
</style>
