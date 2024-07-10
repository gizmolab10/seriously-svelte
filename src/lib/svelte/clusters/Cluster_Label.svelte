<script lang='ts'>
	import { k, u, Rect, Size, Point, Angle } from '../../ts/common/Global_Imports';
	import { Cluster_Map, Orientation } from '../../ts/common/Global_Imports';
    export let cluster_map: Cluster_Map;
	export let color = k.color_default;
	export let center = Point.zero;
	let title_origin = Point.zero;
	let size = Size.zero;
	let angle = 0;

	// given angle & center, draw a label

	$: {
		angle = cluster_map?.fork_angle;
		size = cluster_map?.label_tip.abs.asSize;
		const titleRect = new Rect(center.offsetBy(cluster_map?.label_tip), size.multipliedBy(1/2));
		title_origin = title_origin_for(titleRect);
	}

	function title_origin_for(rect: Rect): Point {
		const m = multiplier();
		const y = k.dot_size * m.y;
		const title = cluster_map?.cluster_title;
		const lines = title.split('<br>');
		const x = u.getWidthOf(lines[0]) * m.x;
		return rect.center.offsetByXY(x, y);
	}

	function multiplier(): Point {
		const orientation = cluster_map?.label_tip.orientation_ofVector;
		const common = -0.5;
		switch (orientation) {
			case Orientation.up:	return new Point(common, -1.5);
			case Orientation.left:	return new Point(-0.75, common);
			case Orientation.down:	return new Point(common, -1.5);
			default:				return new Point(-0.25, common);
		}
		
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
	{@html cluster_map?.cluster_title}
</div>