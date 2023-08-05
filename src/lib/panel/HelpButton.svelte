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
    cursor: pointer;
    position: relative;'>
</div>

<style>
  div::before {
    content: "?";
  }
</style>

