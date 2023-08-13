<script>
  export let menuItems;
  export let selectedID = null;

  function handleSelect(id) {
    selectedID = id;
    const selectedMenuItem = menuItems.find(menuItem => menuItem.id === selectedID);
    if (selectedMenuItem) {
      selectedMenuItem.func();
    }
  }
</script>

<div class="popup">
  {#each menuItems as menuItem}
    <label class="menu-item {selectedID === menuItem.id && 'selected'}">
      <input
        type="radio"
        name="menu"
        value={menuItem.label}
        on:change={ () => handleSelect(menuItem.id) }/>
        {menuItem.label}
    </label>
  {/each}
</div>

<style>
  .menu-item {
    display: block;
    color: #333;
  }

  .menu-item.selected {
    background-color: #ddd;
  }
</style>
