<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  // Props
  export let multiple: boolean = false; // Allow multiple file selection
  export let accept: string = ''; // Accepted file types (e.g., '.png,.jpg')

  // Event Dispatcher
  const dispatch = createEventDispatcher();

  // Reference to the hidden file input
  let fileInput: HTMLInputElement;

  /**
   * Function to trigger the file input click
   */
  function openFileDialog() {
    if (fileInput) {
      fileInput.click();
    }
  }

  /**
   * Handle file selection
   */
  function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      dispatch('filesSelected', target.files);
    } else {
      dispatch('cancel');
    }

    // Reset the input value to allow re-selection of the same file if needed
    target.value = '';
  }
</script>

<style>
  /* Optional: Style the trigger button */
  .file-dialog-button {
    padding: 10px 20px;
    background-color: #007acc;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }

  .file-dialog-button:hover {
    background-color: #005fa3;
  }

  /* Hide the file input */
  .file-input {
    display: none;
  }
</style>

<!-- Trigger Button -->
<button class="file-dialog-button" on:click={openFileDialog}>
  Select File{multiple ? 's' : ''}
</button>

<!-- Hidden File Input -->
<input
  bind:this={fileInput}
  type="file"
  class="file-input"
  {multiple}
  {accept}
  on:change={handleFileChange}
/>
