<script>
  function Aact() {
    // Action for item A
  }

  function Bact() {
    // Action for item B
  }

  function Cact() {
    // Action for item C
  }
</script>

<div class="popup">
  <div class="popup-content">
    <a href="#" class="menu-item" on:click={Aact}>A</a>
    <a href="#" class="menu-item" on:click={Bact}>B</a>
    <a href="#" class="menu-item" on:click={Cact}>C</a>
  </div>
</div>


<style>
  .popup {
    position: relative;
    display: inline-block;
  }

  .popup-content {
    position: absolute;
    background-color: #fff;
    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
    z-index: 1;
  }

  .menu-item {
    display: block;
    padding: 10px;
    text-decoration: none;
    color: #333;
  }

  .menu-item:hover {
    background-color: #f1f1f1;
  }
</style>
