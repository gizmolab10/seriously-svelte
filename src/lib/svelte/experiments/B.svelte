<script lang="ts">
  let sectionBContent = 'Section B starts with this content.';
  let showExtraContentB = false;
  
  function toggleContentB() {
    showExtraContentB = !showExtraContentB;
  }
</script>

<div class="stack-section section-b">
  <h3>Section B</h3>
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
  
  .section-b {
    border-left: 4px solid #28a745;
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
</style> 