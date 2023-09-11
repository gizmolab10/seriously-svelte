<script>
  import { noop } from "../../ts/common/GlobalImports";
  export let borderColor = '#333';
  export let textColor = '#400';
  export let color = '#ccc';
  export let onClick = null;
  export let label = null;
  export let image = null;
  export let size = 14;
  export let x = 7;
  export let y = 7;
</script>

<div
  on:click={onClick}
  on:keypress={noop()}
  style='
    position: absolute;
    left: {x}px;
    top: {y}px;
    transform: translate(-50%, -50%);

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
    cursor: pointer;
  '>
  {#if image}
    <img src="{image}" alt="circular button" width={size}px height={size}px/>
  {:else if label}
    {label}
  {/if}
</div>
