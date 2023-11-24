<script>
    import { k, Point } from '../../ts/common/GlobalImports'
    export let thickness;
    export let radius;
    export let center;
    export let color;
    const diameter = radius * 2;
</script>

<div
    class='circle'
    style='
        width: {diameter}px;
        height: {diameter}px;
        top: {center.y - radius}px;
        left: {center.x - radius}px;
        border: {thickness}px solid {color};
        background-color: {k.backgroundColor};'>
</div>

<style>
  .circle {
    position: absolute;
    border-radius: 50%;
  }
</style>
