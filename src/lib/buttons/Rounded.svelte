<script>
  import { onMount } from 'svelte';
  import Rounded from '../geometry/Rounded';

  export let size = 18;
  export let width = size;
  export let height = size;
  let up = Math.PI/2;
  let left = 0;
  let right = Math.PI;
  let down = Math.PI/6;
  const rounded = new Rounded(50, down);
  const path = rounded.path;

  function handleClick() {
    alert('Button clicked!');
  }
</script>

<svg {width} {height} viewBox="0 0 {width} {height}" on:click={handleClick}>
  <path class="button-triangle" d={path} />
</svg>

<style>
  svg {
    display: block;
    cursor: pointer;
  }

  .button-triangle {
    fill: white;
    stroke: blue;
    stroke-width: 0.5;
    transition: fill 0.2s;
  }

  .button-triangle:hover {
    fill: red;
  }

  .button-triangle:active {
    fill: orange;
  }

</style>
