<script lang="ts">
  import { onMount, tick } from 'svelte';
  
  let container: HTMLElement;
  let measureDiv: HTMLElement;
  let currentHeight = 0;
  
  // Function to update height based on content
  async function updateHeight() {
    if (container && measureDiv) {
      await tick();
      
      // Measure the natural height of the content
      const newHeight = measureDiv.offsetHeight;
      
      if (newHeight !== currentHeight) {
        currentHeight = newHeight;
        container.style.height = `${currentHeight}px`;
      }
    }
  }
  
  // Watch for content changes
  onMount(() => {
    updateHeight();
    
    // Create a ResizeObserver to watch for content changes
    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });
    
    if (measureDiv) {
      resizeObserver.observe(measureDiv);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  });
  
  // Export a method to manually trigger height update
  export function refreshHeight() {
    updateHeight();
  }
</script>

<div 
  bind:this={container}
  class="dynamic-container"
  style="height: {currentHeight}px; overflow: hidden; transition: height 0.3s ease-in-out;"
>
  <div bind:this={measureDiv} class="measure-content">
    <slot />
  </div>
</div>

<style>
  .dynamic-container {
    width: 100%;
    box-sizing: border-box;
  }
  
  .measure-content {
    width: 100%;
    box-sizing: border-box;
  }
</style> 