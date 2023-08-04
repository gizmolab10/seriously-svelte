<!-- Help.svelte -->
<script>
  export let onClose;
</script>

<style>
  /* Styles for the modal overlay */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  /* Styles for the modal content */
  .modal-content {
    background-color: #fff;
    padding: 20px;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    max-width: 400px;
    position: relative; /* Added to make sure the close button respects the container */
  }

  /* Close button style */
  .close-button {
    cursor: pointer;
    font-size: 20px;
    color: #000;
    position: absolute;
    top: 10px;
    right: 10px;
  }
</style>

<div class="modal-overlay">
  <div class="modal-content">
    <span class="close-button" on:click={() => onClose()}>×</span>
    <h2>Help</h2>
    <p>Seriously is like a menu system, to which you can add new items.</p>
    <p>Tap the arrow keys to browse around.</p>
    <p>To copy an existing item, tap the 'D' key.</p>
    <p>To edit an existing item, tap the 'Enter' key.</p>
    <p>When you finish editing, tap the 'Enter' key again to save your changes.</p>
  </div>
</div>
