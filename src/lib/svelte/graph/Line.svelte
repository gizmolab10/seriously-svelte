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
    let origin = new Point();
    let extent = new Point();
    switch (curveType) {
      case LineCurveType.down:
        origin = rect.origin;
        extent = rect.extent;
        break;
      case LineCurveType.up:
        flag = 1;
        origin = rect.bottomLeft;
        extent = rect.topRight;
        break;
      case LineCurveType.flat:
        origin = rect.centerLeft;
        extent = rect.centerRight;
        break
    }
    path   = 'M' + origin.description +'A' + rect.size.description + ',0,0,' + flag + ',' + extent.description;
		console.log('origin:', origin.verbose, 'extent:', extent.verbose, 'path:', path);
  }
</script>

<svg width='200' height='200' style='position: absolute'>
  <path d={path} stroke='black' fill='none' />
</svg>


<style lang='scss'>
</style>
