<script>
  import { k, Point, debug, ZIndex } from '../../ts/common/GlobalImports'
  import { transparentize } from 'color2k';
  export let backgroundColor = debug.lines ? 'transparent' : k.backgroundColor;
  export let zindex = ZIndex.dots;
  export let opacity = 1;
  export let thickness;
  export let radius;
  export let center;
  export let color;
  let transparentColor = 'transparent';
  let diameter = 0;

  $: {
    diameter = radius * 2;
    transparentColor = transparentize(backgroundColor, opacity);
  }

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
    background-color: {transparentColor};'>
</div>
