<script lang="ts">
  let sectionAContent = 'This is the initial content for section A.';
  let showExtraContentA = false;
  
  function toggleContentA() {
    showExtraContentA = !showExtraContentA;
  }
</script>

<div class="stack-section section-a">
  <h3>Section A</h3>
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
  
  .section-a {
    border-left: 4px solid #007bff;
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