import { k, get, Rect, Point, svgPaths } from '../common/GlobalImports';
import { s_graphRect, s_user_graphOffset } from '../state/ReactiveState';

export default class Scrolling_Divider_MapRect extends Rect {
	dividerPath = k.empty;
	dividerBox = k.empty;
	index = 0;
	angle = 0;

	constructor(index: number, angle: number) {
		super();
		this.index = index;
		this.angle = angle;
		this.setup_line();
	}

	setup_line() {
		const graph_rect = get(s_graphRect);
		const center = graph_rect.size.dividedInHalf.asPoint;
		const radius = k.cluster_inside_radius;
		const square = Point.square(-radius);
		const mainOffset = graph_rect.origin.offsetBy(get(s_user_graphOffset));
		const ringOrigin = mainOffset.offsetBy(center).offsetBy(square);
		const radial = Point.fromPolar(k.ring_thickness, this.angle);
		this.origin = ringOrigin.offsetBy(Point.fromPolar(radius, this.angle));
		this.size = radial.abs.asSize;
		this.dividerPath = svgPaths.line(radial);
		this.dividerBox = `${this.origin.x}, ${this.origin.y}, ${this.size.width}, ${this.size.height}`;
	}

}