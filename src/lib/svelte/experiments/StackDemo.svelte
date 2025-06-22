<script lang="ts">
  import Dynamic from './Dynamic.svelte';
  import A from './A.svelte';
  import B from './B.svelte';
  import C from './C.svelte';
  
  // Props for customizing the stack
  let gap = '1rem';
  let padding = '1rem';
  let backgroundColor = '#f8f9fa';
  let borderColor = '#e9ecef';
  let borderRadius = '0.5rem';
</script>

<div class="demo-container" style="position:absolute; top:10; left:0; width:100%; height:100%;">
  <h2>Dynamic Stack Demo</h2>
  <p>Click the buttons below to toggle content and see how the stack adjusts automatically:</p>
  
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
    <Dynamic>
      <A />
    </Dynamic>
    
    <Dynamic>
      <B />
    </Dynamic>
    
    <Dynamic>
      <C />
    </Dynamic>
  </div>
  
  <!-- Additional dynamic section -->
  <Dynamic>
    <div class="additional-section">
      <h3>Additional Dynamic Section</h3>
      <p>This section is wrapped in a Dynamic component outside the Stack, showing how Dynamic can be used independently.</p>
    </div>
  </Dynamic>
</div>

<style>
  .demo-container {
    max-width: 800px;
    margin: 2rem auto;
    padding: 0 1rem;
  }
  
  .demo-container h2 {
    color: #333;
    margin-bottom: 0.5rem;
  }
  
  .demo-container > p {
    color: #666;
    margin-bottom: 2rem;
  }
  
  .additional-section {
    margin-top: 2rem;
    padding: 1.5rem;
    background-color: #e9ecef;
    border-radius: 0.5rem;
    border: 1px solid #dee2e6;
  }
  
  .additional-section h3 {
    margin: 0 0 0.5rem 0;
    color: #495057;
  }
</style> 