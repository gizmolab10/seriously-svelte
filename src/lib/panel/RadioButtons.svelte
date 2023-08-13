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
    text-decoration: none;
    color: #333;
    background-color: #f1f1f1;
    border: 1px solid #ccc;
    border-radius: 4px;
    margin: 5px 0;
  }

  .menu-item.selected {
    background-color: #ddd;
  }
</style>
