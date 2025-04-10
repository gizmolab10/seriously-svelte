<script lang='ts'>
  import { run } from 'svelte/legacy';

  import { k, Point, debug, colors, T_Layer } from '../ts/common/Global_Imports'
	import { w_background_color } from '../ts/common/Stores';
  interface Props {
    color_background?: any;
    zindex?: any;
    opacity?: number;
    thickness: any;
    radius: any;
    center: any;
    color: any;
  }

  let {
    color_background = debug.lines ? 'transparent' : $w_background_color,
    zindex = T_Layer.dots,
    opacity = 0,
    thickness,
    radius,
    center,
    color
  }: Props = $props();
  let transparentColor = $state('transparent');
  let diameter = $state(0);

  run(() => {
    diameter = radius * 2;
    transparentColor = colors.opacitize(color_background, opacity);
  });

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
