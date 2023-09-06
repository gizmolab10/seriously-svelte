<script lang='ts'>

///////////////////////////////////////////////
  //  draw a line in rect, curving up or down  //
  ///////////////////////////////////////////////

  import { Point, Size, Rect } from '../../ts/common/GlobalImports';
  export let curveUp: boolean = true;
  export let rect = new Rect();
  let  start = new Point()
  let center = new Point()
  let extent = new Point()
  let   path = '';
  $: {
    const flag = curveUp ? 1 : 0;
    start  = curveUp ? rect.lowerLeft : rect.origin;
    center = rect.center;
    extent = curveUp ? rect.upperRight : rect.extent;
    path   = 'M' + start.description +'A' + rect.size.description + ' 0 0 ' + flag + ' ' + extent.description;
  }
</script>

<svg width='200' height='200'>
  <!-- Draw the upper right quadrant of an ellipse -->
  <path d={path} stroke='black' fill='none' />
</svg>


<style lang='scss'>
</style>
