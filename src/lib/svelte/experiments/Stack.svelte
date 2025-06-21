<script lang="ts">
  import Dynamic from './Dynamic.svelte';
  
  // Props for customizing the stack
  export let gap = '1rem';
  export let padding = '1rem';
  export let backgroundColor = '#f8f9fa';
  export let borderColor = '#e9ecef';
  export let borderRadius = '0.5rem';
</script>

<div 
  class="stack-container"
  style="
    display: flex;
    flex-direction: column;
    gap: {gap};
    padding: {padding};
    background-color: {backgroundColor};
    border: 1px solid {borderColor};
    border-radius: {borderRadius};
    width: 100%;
    box-sizing: border-box;
  "
>
  <!-- Section A -->
  <Dynamic>
    <div class="stack-section section-a">
      <h3>Section A</h3>
      <slot name="a">
        <p>Default content for section A</p>
      </slot>
    </div>
  </Dynamic>
  
  <!-- Section B -->
  <Dynamic>
    <div class="stack-section section-b">
      <h3>Section B</h3>
      <slot name="b">
        <p>Default content for section B</p>
      </slot>
    </div>
  </Dynamic>
  
  <!-- Section C -->
  <Dynamic>
    <div class="stack-section section-c">
      <h3>Section C</h3>
      <slot name="c">
        <p>Default content for section C</p>
      </slot>
    </div>
  </Dynamic>
  
  <!-- Additional sections can be added dynamically -->
  <slot />
</div>

<style>
  .stack-section {
    padding: 1rem;
    background-color: white;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .stack-section h3 {
    margin: 0 0 0.5rem 0;
    color: #495057;
    font-size: 1.1rem;
    font-weight: 600;
  }
  
  .stack-section p {
    margin: 0;
    color: #6c757d;
  }
  
  .section-a {
    border-left: 4px solid #007bff;
  }
  
  .section-b {
    border-left: 4px solid #28a745;
  }
  
  .section-c {
    border-left: 4px solid #ffc107;
  }
</style> 