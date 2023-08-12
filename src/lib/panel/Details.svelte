<script lang='ts'>
  export let onClose;
  
  function handleKeyDown(event) {
    const key = event.key.toLowerCase();
    switch (key) {
      case 'escape': onClose(); break;
    }
  }
</script>

<button
  on:click={handleClick}
  style='
    border: 1px solid black;
    border-radius: 0.5em;
    cursor: pointer;'>
  {thing.title.injectElipsisAt()}
</button>

<style>
</style>