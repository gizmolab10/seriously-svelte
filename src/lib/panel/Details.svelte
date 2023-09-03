<script>
  import { DBType, LocalID, onMount, ButtonID, Hierarchy, dbDispatch, persistLocal } from '../common/GlobalImports';
  import { build, debug, dbType, isBusy, popupViewID } from '../managers/State';
  import RadioButtons from '../kit/RadioButtons.svelte'
  import LabelButton from '../kit/LabelButton.svelte';
  import Label from '../kit/Label.svelte';

  const menuItems = [
    { id: DBType.local,    label: 'built in', action: () => { handleDBTypeAt(0); } },
    { id: DBType.firebase, label: 'firebase', action: () => { handleDBTypeAt(1); } },
    { id: DBType.airtable, label: 'airtable', action: () => { handleDBTypeAt(2); } }
  ];

  function handleBuildsClick(event) {
    $popupViewID = ButtonID.buildNotes;
  }

  function handleDBTypeAt(index) {
    const type = menuItems[index].id;
    persistLocal.writeToKey(LocalID.db, type);
    if (type != DBType.local && !dbDispatch.db.hasData) {
      $isBusy = true;    // show 'loading ...'
    }
    $dbType = type;      // tell components to render the [possibly previously] fetched data
  }

</script>

<div class="modal-overlay">
  <div class="modal-content">
    <LabelButton
      title='build {$build}'
      onClick={handleBuildsClick}/>
      <br><br>
    {#if $debug}
      <RadioButtons menuItems={menuItems} selectedID={$dbType}/>
    {:else}
      <Label title={$dbType}/>
    {/if}
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
    padding: 15px;
    max-width: 500px;
    position: relative;
    font-size: 0.8em;
  }
</style>
