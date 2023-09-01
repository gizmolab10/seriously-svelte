<script>
  import { popupViewID } from '../managers/State';
  import { noop } from '../common/GlobalImports';
  import HelpButtons from './HelpButtons.svelte';
  export let size = 20;
  
  function handleKeyDown(event) {
    const key = event.key.toLowerCase();
    switch (key) {
      case 'escape': $popupViewID = null; break;
    }
  }
</script>

<svelte:document on:keydown={handleKeyDown} />
<div class="help-modal-overlay">
  <div class="help-modal-content">
    <span class="close-button" style='
      width: {size}px;
      height: {size}px;
      font-size: {size - 1}px;;
      line-height: {size}px;'
      on:keypress={noop()}
      on:click={() => { $popupViewID = null; }}>
        ×
      </span>
    <h2>Welcome to Seriously</h2>
    <p>Seriously is essentially a hierarchal menu system, to which you can add new items.</p>
    <br><HelpButtons/>
    <p><b>Please</b> bear in mind that the menu items are my test data. So, when you finish editing things, try to return everything to something close to its original state. <b>Thanks!</b></p>
  </div>
</div>

<style>
  @import './Help.css';
</style>
