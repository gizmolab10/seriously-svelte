<script lang="ts">
  import Stack from './Stack.svelte';
  import Dynamic from './Dynamic.svelte';
  
  let sectionAContent = 'This is the initial content for section A.';
  let sectionBContent = 'Section B starts with this content.';
  let sectionCContent = 'Section C has some basic content.';
  
  let showExtraContentA = false;
  let showExtraContentB = false;
  let showExtraContentC = false;
  
  function toggleContentA() {
    showExtraContentA = !showExtraContentA;
  }
  
  function toggleContentB() {
    showExtraContentB = !showExtraContentB;
  }
  
  function toggleContentC() {
    showExtraContentC = !showExtraContentC;
  }
</script>

<div class="demo-container" style="position:absolute; top:10; left:0; width:100%; height:100%;">
  <h2>Dynamic Stack Demo</h2>
  <p>Click the buttons below to toggle content and see how the stack adjusts automatically:</p>
  
  <Stack>
    <svelte:fragment slot="a">
      <div class="content-section">
        <p>{sectionAContent}</p>
        {#if showExtraContentA}
          <div class="extra-content">
            <p>This is additional content that appears when you click the button. It will make this section taller and the stack will automatically adjust to accommodate the new height.</p>
            <ul>
              <li>List item 1</li>
              <li>List item 2</li>
              <li>List item 3</li>
            </ul>
          </div>
        {/if}
        <button on:click={toggleContentA} class="toggle-btn">
          {showExtraContentA ? 'Hide' : 'Show'} Extra Content A
        </button>
      </div>
    </svelte:fragment>
    
    <svelte:fragment slot="b">
      <div class="content-section">
        <p>{sectionBContent}</p>
        {#if showExtraContentB}
          <div class="extra-content">
            <p>More content for section B! This demonstrates how the Dynamic component automatically adjusts its height when content changes.</p>
            <div class="highlight-box">
              <strong>Important:</strong> The stack layout automatically adjusts to accommodate height changes in any section.
            </div>
          </div>
        {/if}
        <button on:click={toggleContentB} class="toggle-btn">
          {showExtraContentB ? 'Hide' : 'Show'} Extra Content B
        </button>
      </div>
    </svelte:fragment>
    
    <svelte:fragment slot="c">
      <div class="content-section">
        <p>{sectionCContent}</p>
        {#if showExtraContentC}
          <div class="extra-content">
            <p>Section C can also expand with additional content. Notice how smoothly the transition happens!</p>
            <table class="demo-table">
              <thead>
                <tr>
                  <th>Column 1</th>
                  <th>Column 2</th>
                  <th>Column 3</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Data 1</td>
                  <td>Data 2</td>
                  <td>Data 3</td>
                </tr>
                <tr>
                  <td>Data 4</td>
                  <td>Data 5</td>
                  <td>Data 6</td>
                </tr>
              </tbody>
            </table>
          </div>
        {/if}
        <button on:click={toggleContentC} class="toggle-btn">
          {showExtraContentC ? 'Hide' : 'Show'} Extra Content C
        </button>
      </div>
    </svelte:fragment>
  </Stack>
  
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
  
  .content-section {
    width: 100%;
  }
  
  .extra-content {
    margin: 1rem 0;
    padding: 1rem;
    background-color: #f8f9fa;
    border-radius: 0.25rem;
    border-left: 3px solid #007bff;
  }
  
  .highlight-box {
    background-color: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 0.25rem;
    padding: 0.75rem;
    margin: 0.5rem 0;
  }
  
  .toggle-btn {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 0.9rem;
    margin-top: 0.5rem;
  }
  
  .toggle-btn:hover {
    background-color: #0056b3;
  }
  
  .demo-table {
    width: 100%;
    border-collapse: collapse;
    margin: 0.5rem 0;
  }
  
  .demo-table th,
  .demo-table td {
    border: 1px solid #dee2e6;
    padding: 0.5rem;
    text-align: left;
  }
  
  .demo-table th {
    background-color: #f8f9fa;
    font-weight: 600;
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