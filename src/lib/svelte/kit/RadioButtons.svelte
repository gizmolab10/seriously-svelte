<script>
  import { onMount } from '../../typescript/common/GlobalImports';
  export let selectedID = null;
  export let menuItems;


  onMount( () => {
    if (!selectedID && menuItems.length > 0) {
      selectedID = menuItems[0].id;   // Initialize selectedID to the id of the first menuItem
    }
  });

  function handleSelect(id) {
    selectedID = id;
    const selectedMenuItem = menuItems.find(menuItem => menuItem.id === selectedID);
    if (selectedMenuItem) {
      selectedMenuItem.action();
    }
  }
</script>

<div class="popup">
  {#each menuItems as menuItem}
    <label class="menu-item">
      <input class='radio'
        type="radio"
        name="menu"
        value={menuItem.id}
        on:change={ () => handleSelect(menuItem.id) }
        bind:group={selectedID}/>
      <span class="label-text">{menuItem.label}</span>
    </label>
  {/each}
</div>

<style>
  .radio {
    cursor: pointer;
  }
  .menu-item {
    position: relative;
    left: -3px;
    display: flex;
    align-items: center;
    padding: 1px;
    cursor: pointer;
  }
  .label-text {
    position: relative;
    margin-top: 1px;
  }
</style>
