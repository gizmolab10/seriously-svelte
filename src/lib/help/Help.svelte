<script>
  import { popupViewID } from '../managers/State';
  import HelpButtons from './HelpButtons.svelte';
  import Widget from '../graph/Widget.svelte';
  import { exemplar } from '../data/Exemplar';
  import { onMount } from 'svelte';
  let showComponentC = false;
  export let size = 20;
  
  function handleKeyDown(event) {
    const key = event.key.toLowerCase();
    switch (key) {
      case 'escape': $popupViewID = null; break;
    }
  }

  const toggleComponentC = () => {
    showComponentC = !showComponentC;
  };

  let componentC;

  onMount(() => {
    import('./Dots.svelte').then(module => {
      componentC = module.default;
    });
  });
</script>

<svelte:document on:keydown={handleKeyDown} />
<div class="help-modal-overlay">
  <div class="help-modal-content">
    <span class="close-button" style='
      width: {size}px;
      height: {size}px;
      font-size: {size - 1}px;;
      line-height: {size}px;'
      on:click={() => { $popupViewID = null; }}>
        ×
      </span>
    <h2>Welcome to Seriously</h2>
    <p>Seriously is essentially a hierarchal menu system, to which you can add new items.</p>
    <div class='centered-container'>
      <Widget thing={exemplar}/>
    </div>
    <br><HelpButtons/>
    <p><b>Please,</b> bear in mind that the menu items are my test data. So, when you finish editing things, try to return everything to something close to its original state. <b>Thanks!</b></p>
  </div>
</div>

<style>
  @import './Help.css';
</style>
