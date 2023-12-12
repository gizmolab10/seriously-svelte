<script>
	import { Rect, Size, Point, Thing } from '../../../ts/common/GlobalImports';
	import { dot_size, graphRect } from '../../../ts/managers/State';
	import Box from '../../kit/Box.svelte';
	export let center = new Point();
	export let size = new Size();
	let greenRect = new Rect();
	let blueRect = new Rect();
	let redRect = new Rect();
	
	$: {
		if ($dot_size > 0) {
			blueRect = $graphRect.dividedInHalf;
			redRect = Rect.createExtentRect($graphRect.origin, center);
			greenRect = Rect.createRightCenterRect(center, size);
		}
	}
	
</script>

<div class='debug'>
	<Box rect={redRect} color=red/>
	<Box rect={blueRect} color=blue/>
	<Box rect={greenRect} color=green half={true}/>
</div>