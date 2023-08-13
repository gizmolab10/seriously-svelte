<script>
  import { build } from '../managers/State';
  import Button from './Button.svelte'
  export let size = 20;
  export let onClose;
  
  function handleKeyDown(event) {
    const key = event.key.toLowerCase();
    switch (key) {
      case 'escape': onClose(); break;
    }
  }
</script>

<svelte:document on:keydown={handleKeyDown} />
<div class="modal-overlay">
  <div class="modal-content">
    <span class="close-button" style='
      width: {size}px;
      height: {size}px;
      font-size: {size - 1}px;;
      line-height: {size}px;'
      on:click={() => onClose()}>×</span>
      <p>build: {$build}</p>
      <Button viewID=ButtonIDs.crud/>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.1);
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .modal-content {
    background-color: #fff;
    padding: 20px;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    max-width: 500px;
    position: relative;
    font-size: 0.8em;
  }
  .close-button {
    display: inline-block;
    text-align: center;
    cursor: pointer;
    color: #000;
    position: absolute;
    border: 1px solid black;
    border-radius: 50%;
    top: 10px;
    right: 10px;
  }
</style>
