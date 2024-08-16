<script lang='ts'>
	import { k, u, Rect, Size, Point, Angle } from '../../ts/common/Global_Imports';
	import { Cluster_Map, Orientation } from '../../ts/common/Global_Imports';
    export let cluster_map: Cluster_Map;
	export let color = k.color_default;
	export let center = Point.zero;
	let title_origin = Point.zero;
	let label_title = k.empty;

	// given label_angle & center, draw a label

	$: {
		if (!!cluster_map) {
			size = cluster_map.label_tip.abs.asSize;
			const titleRect = new Rect(center.offsetBy(cluster_map.label_tip), size.dividedInHalf);
			title_origin = title_origin_for(titleRect);
		}
	}

	function title_origin_for(rect: Rect): Point {
		let origin = Point.zero;
		if (!!cluster_map) {
			label_title = cluster_map.cluster_title ?? 'not named';
			const lines = label_title.split('<br>');
			const y = k.dot_size * -1.5;
			const x = u.getWidthOf(lines[0]) * -0.5;
			origin = rect.center.offsetByXY(x, y);
		}
		return origin;
	}

</script>

<div class='cluster-label'
	style='
		background-color: {k.color_background};
		left: {title_origin.x}px;
		top: {title_origin.y}px;
		white-space: nowrap;
		text-align: center;
		position: absolute;
		font-family: Arial;
		font-size: 0.5em;
		color: {color};'>
	{@html label_title}
</div>