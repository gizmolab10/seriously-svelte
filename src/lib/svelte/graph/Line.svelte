<script lang='ts'>

	/////////////////////////////////////////////////////
	//	draw a line in rect, curving up, down or flat	//
	/////////////////////////////////////////////////////

	import { Rect, Size, Point, LineCurveType } from '../../ts/common/GlobalImports';
	export let curveType: string = LineCurveType.up;
	export let rect = new Rect();
	export let color = 'black';
	let origin = rect.origin;
	let extent = rect.extent;
	let viewBox = new Rect();
	let size = new Size();
	let path = '';

	$: {
		let flag = 0;
		switch (curveType) {
			case LineCurveType.up:
				flag = 1;
				break;
			case LineCurveType.flat:
				origin = rect.centerLeft;
				extent = rect.centerRight;
				break
		}
		size = extent.distanceTo(origin).asSize;
		viewBox = new Rect(origin, size);
		path = 'M' + origin.description +'A' + rect.size.description + ',0,0,' + flag + ',' + extent.description;
	}

</script>

<svg width='40' height='200' viewbox='0 0 40 200' style='position: absolute; left: 25px;'>
	<path d={path} stroke={color} fill='none'/>
</svg>

<style lang='scss'>
</style>
