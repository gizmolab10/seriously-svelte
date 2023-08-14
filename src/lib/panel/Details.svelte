<script>
  import { DBTypes, hierarchy, onMount, persistence } from '../common/GlobalImports';
  import { build, dbType, isBusy, fireBulk, popupViewID } from '../managers/State';
  import RadioButtons from './RadioButtons.svelte'
  export let size = 20;

  const menuItems = [
    { id: DBTypes.firebase, label: 'firebase', func: () => { handleDBType(0); } },
    { id: DBTypes.airtable, label: 'airtable', func: () => { handleDBType(1); } }
  ];

  function handleDBType(index) {
    const type = menuItems[index].id;
    persistence.writeToKey('db', type);
    if (type != DBTypes.airtable) {
      $dbType = type; // do this last so components will see the resulting data
    } else {
      // TODO: really should restart startup so user sees 'waiting...' or some such
      $isBusy = true;
      hierarchy.setup(type, () => {
        $dbType = type;
        $isBusy = false;
      });
    }
  }
  
  function handleKeyDown(event) {
    const key = event.key.toLowerCase();
    switch (key) {
      case 'escape': $popupViewID = null; break;
    }
  }

  </script>

<svelte:document on:keydown={handleKeyDown} />
<div class="modal-overlay">
  <div class="modal-content">
      <p>build: {$build}</p>
      <RadioButtons
        menuItems={menuItems}
        selectedID={$dbType}/>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    left: 0;
    height: 100%;
    justify-content: center;
  }
  .modal-content {
    background-color: #fff;
    padding: 20px;
    max-width: 500px;
    position: relative;
    font-size: 0.8em;
  }
</style>
