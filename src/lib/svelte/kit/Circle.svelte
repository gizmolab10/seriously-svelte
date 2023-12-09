<script>
  import { k, Point, debug, ZIndex, Size } from '../../ts/common/GlobalImports'
  export let thickness;
  export let radius;
  export let center;
  export let color;
  let origin = new Point();
  let diameter = 0;

  $: {
    diameter = radius * 2;
    origin = center.offsetBy(Point.square(radius).negated)
  }

</script>

<div
  class='circle'
  style='
    top: {origin.y}px;
    left: {origin.x}px;
    width: {diameter}px;
    height: {diameter}px;
    z-index: {ZIndex.dots};
    border: {thickness}px solid {color};
    background-color: {debug.lines ? 'transparent' : k.backgroundColor};'>
</div>

<style>
  .circle {
    position: absolute;
    border-radius: 50%;
  }
</style>
