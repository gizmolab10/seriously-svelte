import { k, get, Rect, Point, Angle, svgPaths } from '../common/Global_Imports';
import { s_rotation_ring_radius } from '../state/Reactive_State';

// create svg paths for generic arcs
//
// given:
//	start, end & fork angles
//	s_rotation_ring_radius

export default class Arc_Map {
	clusters_center = Point.zero;
	outside_arc_radius = 0;
	inside_arc_radius = 0;
	arc_rect = Rect.zero;
	fork_backoff = 0;
	fork_radius = 0;
	start_angle = 0;
	fork_angle = 0;
	cap_radius = 0;
	end_angle = 0;

	constructor() {
		const thickness = k.paging_arc_thickness;
		const radius = get(s_rotation_ring_radius);
		this.clusters_center = Point.square(radius);
		this.inside_arc_radius = radius - thickness;
		this.cap_radius = k.ring_thickness / 6;
		this.outside_arc_radius = radius;
	}

	static readonly $_PRIMITIVES_$: unique symbol;

	get fork_slantsForward(): boolean { return new Angle(this.fork_angle).angle_slantsForward; }
	get straddles_zero(): boolean { return this.end_angle.straddles_zero(this.start_angle); }
	get fork_orientsDown(): boolean { return new Angle(this.fork_angle).angle_orientsDown; }
	get fork_pointsRight(): boolean { return new Angle(this.fork_angle).angle_pointsRight; }
	get center_angle(): number { return (this.end_angle + this.start_angle) / 2; }
	get angles(): [number, number] { return [this.start_angle, this.end_angle]; }
	get spread_angle(): number { return this.end_angle - this.start_angle; }
	get arc_origin(): Point { return this.arc_rect.origin; }
	get arc_center(): Point { return this.arc_rect.center; }

	get computed_arc_rect(): Rect {
		let origin = Point.zero;
		let extent = Point.zero;
		const end_radial = this.radial_forAngle(this.end_angle);								// for each of start and end radials,
		const start_radial = this.radial_forAngle(this.start_angle);
		const start_x_isSmaller = start_radial.x < end_radial.x;								// for x and then for y
		const start_y_isSmaller = start_radial.y < end_radial.y;
		origin.x = (start_x_isSmaller ? start_radial.x : end_radial.x) - this.cap_radius;		// which radial's coordinate is smaller?
		origin.y = (start_y_isSmaller ? start_radial.y : end_radial.y) - this.cap_radius;		// subtract cap_radius
		extent.x = (start_x_isSmaller ? end_radial.x : start_radial.x) + this.cap_radius;		// vice-versa for larger
		extent.y = (start_y_isSmaller ? end_radial.y : start_radial.y) + this.cap_radius;
		return Rect.createExtentRect(origin, extent);
	}

	arc_straddles(angle: number): boolean { return (this.start_angle.normalized_angle() > angle && this.end_angle.normalized_angle() < angle); }

	radial_forAngle(angle: number): Point {
		const middle_radius = this.inside_arc_radius + this.cap_radius;
		return Point.fromPolar(middle_radius, angle);
	}

	update(fork_angle: number) {
		const fork_raw_radius = k.ring_thickness * 0.6;
		this.fork_backoff = this.fork_adjustment(fork_raw_radius, this.inside_arc_radius);
		this.fork_radius = fork_raw_radius - this.fork_backoff;
		this.fork_angle = fork_angle;
	}

	fork_adjustment(fork_radius: number, inside_arc_radius: number): number {
		const ratio = fork_radius / inside_arc_radius / 2;
		const fork_angle = Math.asin(ratio) * 2;
		const delta = inside_arc_radius * (1 - Math.cos(fork_angle));
		return delta / Math.sqrt(1.5);
	}

	finalize_angles() {
		if (!this.fork_pointsRight) {
			const saved = this.start_angle;
			this.start_angle = this.end_angle;
			this.end_angle = saved;
		}
		this.arc_rect = this.computed_arc_rect;
		this.fork_angle = this.center_angle;
	}

	static readonly $_SVG_PATHS_$: unique symbol;

	get arc_svgPath(): string {
		const [start, end] = this.angles;
		const paths = [
			this.startOf_svgPath(start, this.outside_arc_radius),
			this.swing_svgPath(end, this.outside_arc_radius, false),
			this.cap_svgPath(end, false),
			this.swing_svgPath(start, this.inside_arc_radius, true),
			this.cap_svgPath(start, true),
		];
		return paths.join(k.space);
	}

	get fork_svgPath(): string {
		const forward = this.fork_slantsForward;
		const fork_radius = this.fork_radius;
		const angle = -this.fork_angle;
		const y = fork_radius * (forward ? -1 : 1);
		const x = this.inside_arc_radius - fork_radius - this.fork_backoff;
		const origin = new Point(x, y).rotate_by(angle);
		return svgPaths.arc(origin.offsetBy(this.clusters_center), fork_radius, 1,
			angle + (forward ? Angle.quarter : 0),
			angle - (forward ? 0 : Angle.quarter));
	}

	get debug_svgPath(): string {
		const small = this.outside_arc_radius;
		const big = small + k.ring_thickness;
		const paths = [
			// this.tinyDot_svgPath(this.outside_arc_radius, this.start_angle),
			svgPaths.line_atAngle(this.clusters_center, big, this.fork_angle),
		];
		return paths.join(k.space);
	}

	startOf_svgPath(start_angle: number, radius: number) {
		return svgPaths.startOutAt(this.clusters_center, radius, start_angle);
	}

	swing_svgPath(end_angle: number, radius: number, clockwise: boolean) {
		const sweep_flag = clockwise ? 0 : 1;
		return svgPaths.arc_partial(this.clusters_center, radius, 0, sweep_flag, end_angle);
	}

	cap_svgPath(arc_angle: number, clockwise: boolean) {
		const radial = this.radial_forAngle(arc_angle);
		const center = this.clusters_center.offsetBy(radial);
		const end_angle = clockwise ? arc_angle : (arc_angle + Math.PI).normalized_angle();
		return svgPaths.arc_partial(center, this.cap_radius, 0, 1, end_angle);
	
	}

	tinyDot_svgPath(radius: number, basis_angle: number) {
		const start = this.clusters_center.offsetBy(Point.fromPolar(radius, basis_angle));
		return svgPaths.circle(start, 5);
	}

}