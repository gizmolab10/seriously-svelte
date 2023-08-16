<script>
  import { DBTypes, hierarchy, onMount, persistence, PersistenceIDs } from '../common/GlobalImports';
  import { build, dbType, isBusy, popupViewID } from '../managers/State';
  import RadioButtons from '../buttons/RadioButtons.svelte'
  export let size = 20;

  const menuItems = [
    { id: DBTypes.firebase, label: 'firebase', func: () => { handleDBTypeAt(0); } },
    { id: DBTypes.airtable, label: 'airtable', func: () => { handleDBTypeAt(1); } }
  ];

  function handleDBTypeAt(index) {
    const type = menuItems[index].id;
    persistence.writeToKey(PersistenceIDs.db, type);
    if (type == DBTypes.airtable) {
      $isBusy = true;    // show 'loading ...'
    }
    hierarchy.setup(type, () => {
      $dbType = type;    // tell components to render the [possibly previously] fetched data
      $isBusy = false;
    });
  }

</script>

<div class="modal-overlay">
  <div class="modal-content">
      <p>build: {$build}</p>
      <RadioButtons menuItems={menuItems} selectedID={$dbType}/>
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
