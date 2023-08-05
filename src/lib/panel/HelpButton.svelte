<script>
  export let size = 20;
  export let color = '#ccc';
  export let borderColor = '#333';
  export let textColor = '#400';
  export let onClick;

  // Event handler for the click event of the button
  function handleClick() {
    if (onClick && typeof onClick === 'function') {
      onClick();
    }
  }
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
    cursor: help;'>
</div>

<style>
  div::before {
    content: "?";
  }
</style>

