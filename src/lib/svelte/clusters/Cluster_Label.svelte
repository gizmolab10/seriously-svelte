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
			const titleRect = new Rect(center.offsetBy(cluster_map.label_tip), size.multipliedBy(1/2));
			title_origin = title_origin_for(titleRect);
		}
	}

	function title_origin_for(rect: Rect): Point {
		let origin = Point.zero;
		if (!!cluster_map) {
			label_title = cluster_map.cluster_title ?? 'not named';
			const lines = label_title.split('<br>');
			const m = multiplier();
			const y = k.dot_size * m.y;
			const x = u.getWidthOf(lines[0]) * m.x;
			origin = rect.center.offsetByXY(x, y);
		}
		return origin;
	}

	function multiplier(): Point {
		if (!!cluster_map) {
			const orientation = cluster_map.label_tip.orientation_ofVector;
			const common = -0.5;
			switch (orientation) {
				case Orientation.up:	return new Point(common, -1.5);
				case Orientation.left:	return new Point(-0.75, common);
				case Orientation.down:	return new Point(common, -1.5);
				default:				return new Point(-0.25, common);
			}
		}
		return Point.zero;
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