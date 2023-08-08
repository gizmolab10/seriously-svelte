<script>
  import { onMount, FatTriangle, Direction } from '../common/GlobalImports';

  export let size = 18;
  export let width = size;
  export let height = size;
  export let direction = Direction.left;
  const fatTriangle = new FatTriangle(size, direction);
  const path = fatTriangle.path;

  // function handleClick() {
  //   alert('Button clicked!');
  // }
  
  // on:click={handleClick}
  // .button-triangle:hover {
  //   fill: red;
  // }

  // .button-triangle:active {
  //   fill: orange;
  // }

</script>

<svg {width} {height} viewBox="0 0 {width} {height}">
  <path class="button-triangle" d={path} />
</svg>

<style>
  svg {
    display: block;
  }

  .button-triangle {
    fill: white;
    stroke: blue;
    stroke-width: 0.5;
    transition: fill 0.2s;
  }

</style>