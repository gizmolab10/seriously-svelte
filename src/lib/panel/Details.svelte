<script>
  import { DBType, hierarchy, onMount, persistence, LocalID } from '../common/GlobalImports';
  import { build, dbType, isBusy, popupViewID } from '../managers/State';
  import RadioButtons from '../kit/RadioButtons.svelte'
  export let size = 20;

  const menuItems = [
    { id: DBType.firebase, label: 'firebase', func: () => { handleDBTypeAt(0); } },
    { id: DBType.airtable, label: 'airtable', func: () => { handleDBTypeAt(1); } }
  ];

  // <RadioButtons menuItems={menuItems} selectedID={$dbType}/>

  function handleDBTypeAt(index) {
    const type = menuItems[index].id;
    persistence.writeToKey(LocalID.db, type);
    $dbType = type;    // tell components to render the [possibly previously] fetched data
    if (type == DBType.airtable) {
      $isBusy = true;    // show 'loading ...'
    }
    hierarchy.setup(type, () => {
      $isBusy = false;
    });
  }

</script>

<div class="modal-overlay">
  <div class="modal-content">
      <p>build: {$build}</p>
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
