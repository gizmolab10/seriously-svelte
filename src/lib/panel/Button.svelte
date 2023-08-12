<script>
  import { ViewIDs, onMount } from "../common/GlobalImports";
  import { viewID } from "../managers/State";
  export let borderColor = '#333';
  export let textColor = '#400';
  export let color = '#ccc';
  export let openID = '';
  export let size = 20;
  let hasNoImage = false;
  function handleClick() { $viewID = openID; }

  onMount(() => {
    switch (openID) {
      case ViewIDs.help:
        hasNoImage = true;
        break;
    }
  })

</script>

<div
  on:click={handleClick}
  style='
    width: {size}px;
    height: {size}px;
    font-size: {size - 1}px;;
    line-height: {size}px;
    color: {textColor}
    background-color: {color};
    border: 1px solid {borderColor};
    border-radius: 50%;
    display: inline-block;
    text-align: center;
    font-weight: bold;
    cursor: pointer;'>
    {#if hasNoImage}
      {openID}
    {:else}
      <img src="settings.png" alt="Image" width={size}px height={size}px/>
    {/if}
</div>
