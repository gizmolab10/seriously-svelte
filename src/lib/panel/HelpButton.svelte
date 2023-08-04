<script>
  export let size = 15;
  export let color = '#f1f1f1';
  export let borderColor = '#999999';
  export let textColor = '#999999';
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
  style='width: {size}px;
    height: {size}px;
    font-size: {size}px;;
    line-height: {size}px;
    color: {textColor}
    background-color: {color};
    border: 2px solid {borderColor};
    display: inline-block;
    text-align: center;
    border-radius: 50%;
    font-weight: bold;
    cursor: pointer;
    position: relative;'>
</div>

<style>
  div::before {
    content: "?";
  }
</style>

