<script>
  import { onMount } from 'svelte';
  let dotsTitle = '';
  let browseTitle = '';
  let itemsTitle = '';
  let showItems = true;
  let showBrowse = false;
  let showDots = false;
  let dots;
  let items;
  let browse;

  const updateTitles = () => {
    dotsTitle = showDots ? 'How the <b>Dots</b> work' : 'Dots';
    browseTitle = showBrowse ? '<b>Browsing</b> (changing which item is selected)' : 'Browsing';
    itemsTitle = showItems ? 'When an item is <b>selected</b>' : 'Selection';
  }  

  const toggleItems = () => {
    showItems = !showItems;
    showBrowse = false;
    showDots = false;
    updateTitles();
  };

  const toggleBrowse = () => {
    showItems = false;
    showBrowse = !showBrowse;
    showDots = false;
    updateTitles();
  };

  const toggleDots = () => {
    showItems = false;
    showBrowse = false;
    showDots = !showDots;
    updateTitles();
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
    updateTitles();
  });
</script>

<div class='buttons-container'>
  <button class:selected={showItems} on:click={toggleItems}>{@html itemsTitle}</button>
  <button class:selected={showBrowse} on:click={toggleBrowse}>{@html browseTitle}</button>
  <button class:selected={showDots} on:click={toggleDots}>{@html dotsTitle}</button>
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
    height: 20px;
    border: 1px solid;
    border-radius: 0.5em;
    color: #b64b1d;
  }
  .selected {
    background-color: #def;
    color: black;
  }
  .buttons-container {
    display: flex;
    gap: 10px;
    margin-top: 20px;
    margin-bottom: 20px;
    justify-content: center;
  }
</style>
