<script lang="ts">
  let sectionCContent = 'Section C has some basic content.';
  let showExtraContentC = false;
  
  function toggleContentC() {
    showExtraContentC = !showExtraContentC;
  }
</script>

<div class="stack-section section-c">
  <h3>Section C</h3>
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
  
  .section-c {
    border-left: 4px solid #ffc107;
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
</style> 