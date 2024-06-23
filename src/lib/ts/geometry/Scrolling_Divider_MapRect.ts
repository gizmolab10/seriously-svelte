import { k, u, get, Rect, Point, svgPaths, Quadrant } from '../common/GlobalImports';
import { s_graphRect } from '../state/ReactiveState';

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
		const radius = k.cluster_inside_radius + 12;
		const tiltsUp = u.angle_tiltsUp(this.angle);
		const radial_toLineStart = Point.fromPolar(radius, this.angle);
		const radial_ofLine = Point.fromPolar(k.ring_thickness, this.angle);
		const center = graph_rect.center.offsetByXY(-16, -84);
		this.origin = center.offsetBy(radial_toLineStart);
		this.size = radial_ofLine.abs.asSize;
		const rect = new Rect(this.origin, this.size);
		this.origin = this.origin.offsetByY(tiltsUp ? -this.size.height : 0);
		const origin_ofLine = this.origin_fromRect_forAngle(rect, this.angle);
		this.dividerPath = svgPaths.line(radial_ofLine, origin_ofLine);
		this.dividerBox = `${this.origin.x}, ${this.origin.y}, ${this.size.width}, ${this.size.height}`;
	}

	origin_fromRect_forAngle(rect: Rect, angle: number): Point {
		const quadrant = u.quadrant_ofAngle(angle);
		switch (quadrant) {
			case Quadrant.upperRight: return rect.bottomLeft;
			case Quadrant.lowerLeft:  return rect.topRight;
			case Quadrant.upperLeft:  return rect.extent;
			default:				  return rect.origin;
		}
	}

}