<script>
  import { DBType, local, LocalID, onMount, ButtonID, hierarchy } from '../common/GlobalImports';
  import { build, debug, dbType, isBusy, popupViewID } from '../managers/State';
  import RadioButtons from '../kit/RadioButtons.svelte'
  import LabelButton from '../kit/LabelButton.svelte';
  import Label from '../kit/Label.svelte';
  export let size = 20;

  const menuItems = [
    { id: DBType.firebase, label: 'firebase', func: () => { handleDBTypeAt(0); } },
    { id: DBType.airtable, label: 'airtable', func: () => { handleDBTypeAt(1); } }
  ];

  function handleReleasesClick(event) {
    $popupViewID = ButtonID.releaseNotes;
  }

  function handleDBTypeAt(index) {
    const type = menuItems[index].id;
    local.writeToKey(LocalID.db, type);
    if (type == DBType.airtable) {
      $isBusy = true;    // show 'loading ...'
    }
    $dbType = type;    // tell components to render the [possibly previously] fetched data
  }

</script>

<div class="modal-overlay">
  <div class="modal-content">
    <LabelButton
      title='build {$build}'
      onClick={handleReleasesClick}/>
      <p></p>
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
    padding: 20px;
    max-width: 500px;
    position: relative;
    font-size: 0.8em;
  }
</style>
