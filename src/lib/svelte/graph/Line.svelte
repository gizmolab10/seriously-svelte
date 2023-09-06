<script lang='ts'>

  /////////////////////////////////////////////////////
  //  draw a line in rect, curving up, down or flat  //
  /////////////////////////////////////////////////////

  import { Rect, Size, Point, LineCurveType } from '../../ts/common/GlobalImports';
  export let curveType: number = LineCurveType.up;
  export let rect = new Rect();
  let   path = '';
  $: {
    let flag = 0;
    let  start = new Point()
    let extent = new Point()
    switch (curveType) {
      case LineCurveType.down:
        start  = rect.origin;
        extent = rect.extent;
        break;
      case LineCurveType.up:
        flag = 1;
        start  = rect.lowerLeft;
        extent = rect.upperRight;
        break;
      case LineCurveType.flat: break
    }
    path   = 'M' + start.description +'A' + rect.size.description + ',0,0,' + flag + ',' + extent.description;
  }
</script>

<svg width='200' height='200'>
  <!-- Draw the upper right quadrant of an ellipse -->
  <path d={path} stroke='black' fill='none' />
</svg>


<style lang='scss'>
</style>
