<script>
  import { k, Point, debug, ZIndex } from '../../ts/common/GlobalImports'
  export let color_background = debug.lines ? 'transparent' : k.color_background;
  export let zindex = ZIndex.dots;
  export let thickness = 1;
  export let radius;
  export let center;
  export let color;
  let diameter = 0;

  $: diameter = radius * 2;

</script>

<style>
  .circle {
    position: absolute;
    border-radius: 50%;
  }
</style>

<div
  class='circle'
  style='
    width: {diameter}px;
    height: {diameter}px;
    z-index: {zindex};
    top: {center.y - radius}px;
    left: {center.x - radius}px;
    border: {thickness}px solid {color};
    background-color: {color_background};'>
</div>
