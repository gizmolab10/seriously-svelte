
<script>
  let foo = 10; // Initial value for foo
</script>

<input
  type='range'
  min='10'
  max='20'
  width='60'
  bind:value={foo}
/>
Foo: {foo}

<style>
  input[type="range"] {
    width: 60px; /* Set the width to 60 units */
  }
  
  input[type="range"]::-webkit-slider-thumb {
    background-color: green; /* Set the thumb color to green */
  }
</style>
