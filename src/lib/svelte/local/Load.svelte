<script lang="ts">
  import Open from './Open.svelte';

  let selectedFiles: FileList | null = null;

  /**
   * Handle the 'filesSelected' event from Open
   */
  function handleFilesSelected(event: CustomEvent<FileList>) {
    selectedFiles = event.detail;
    console.log('Selected files:', selectedFiles);
  }

  /**
   * Handle the 'cancel' event from Open
   */
  function handleCancel() {
    selectedFiles = null;
    console.log('File selection was canceled.');
  }
</script>

<style>
  .file-info {
    margin-top: 20px;
  }

  .file-info ul {
    list-style-type: none;
    padding: 0;
  }

  .file-info li {
    margin-bottom: 5px;
  }
</style>

<!-- Use the Open component -->
<Open
  multiple={true}
  accept=".png,.jpg,.jpeg,.seriously"
  on:filesSelected={handleFilesSelected}
  on:cancel={handleCancel}
/>

<!-- Display selected file information -->
{#if selectedFiles}
  <div class="file-info">
    <h3>Selected Files:</h3>
    <ul>
      {#each Array.from(selectedFiles) as file}
        <li>{file.name} ({file.type}, {file.size} bytes)</li>
      {/each}
    </ul>
  </div>
{:else}
  <p>No files selected.</p>
{/if}
