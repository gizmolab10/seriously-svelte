<script lang="ts">
  import { Motion } from "svelte-motion";
  
  let showSlot = true;

  function handleDogClick() {
    showSlot = !showSlot;
  }
</script>

<div style="position: relative; min-height: {showSlot ? '0' : '2.5rem'};">
  <button class="dog-button" on:click={handleDogClick}>{showSlot ? 'hide' : 'show'}</button>
  
  {#if showSlot}
    <Motion
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      let:motion
    >
      <div use:motion style="overflow: hidden;">
        <slot />
      </div>
    </Motion>
  {/if}
</div>

<style>
  .dynamic-container {
    width: 100%;
    box-sizing: border-box;
    overflow: hidden;
    position: relative;
    border: 1px solid #dee2e6; /* Added for visual clarity */
    border-radius: 0.375rem;
    background-color: white;
  }
  
  .measure-content {
    width: 100%;
    box-sizing: border-box;
    padding: 1rem; /* Added padding for content */
  }
  
  .dog-button {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    z-index: 10;
    background-color: #007bff;
    color: white;
    border: none;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 1rem;
    cursor: pointer;
  }
  
  .dog-button:hover {
    background-color: #0056b3;
  }
</style> 