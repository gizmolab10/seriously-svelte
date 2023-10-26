<script>
  let detect;
  const threshold = 1000;

  function handleMouseDown() {
    detect = new Date().getTime() + threshold;
  }

  function handleMouseUp() {
    if (detect <= new Date().getTime()) {
      alert('Long-held  detected!');
    }
  }

  function handleContextMenu(event) {      // Prevent the default context menu on right-
    event.preventDefault();
  }
</script>

<button
    on:mouseup={handleMouseUp}
    on:mousedown={handleMouseDown}
    on:contextmenu={handleContextMenu}>
    </button>
