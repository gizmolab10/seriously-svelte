import { k, get, Point, Angle, svgPaths } from '../common/Global_Imports';
import { s_rotation_ring_radius } from '../state/Reactive_State';

// create svg paths for generic arcs
//
// given:
//	start, end & fork angles
//	s_rotation_ring_radius

export default class SVG_Arc {
	clusters_center = Point.zero;
	outside_ring_radius = 0;		// need for ring expansion
	outside_arc_radius = 0;
	inside_arc_radius = 0;
	fork_backoff = 0;
	fork_radius = 0;
	start_angle = 0;
	fork_angle = 0;
	end_angle = 0;

	constructor() {
		const radius = get(s_rotation_ring_radius);
		const thickness = k.paging_arc_thickness;
		this.inside_arc_radius = radius - thickness;
		this.outside_arc_radius = radius;
		this.clusters_center = Point.square(radius);
		this.outside_ring_radius = radius;
	}

	update(fork_angle: number) {
		const fork_raw_radius = k.ring_thickness * 0.6;
		this.fork_backoff = this.fork_adjustment(fork_raw_radius, this.inside_arc_radius);
		this.fork_radius = fork_raw_radius - this.fork_backoff;
		this.fork_angle = fork_angle;
	}

	put_angles_inOrder() {
		if (!this.fork_pointsRight) {
			const saved = this.start_angle;
			this.start_angle = this.end_angle;
			this.end_angle = saved;
		}
	}

	get fork_slantsForward(): boolean { return new Angle(this.fork_angle).angle_slantsForward; }
	get straddles_zero(): boolean { return this.start_angle.straddles_zero(this.end_angle); }
	get fork_orientsDown(): boolean { return new Angle(this.fork_angle).angle_orientsDown; }
	get fork_pointsRight(): boolean { return new Angle(this.fork_angle).angle_pointsRight; }
	get angles(): [number, number] { return [this.start_angle, this.end_angle]; }
	get spread_angle(): number { return this.end_angle - this.start_angle; }

	get arc_svgPath(): string {
		const [start, end] = this.angles;
		const paths = [
			this.startOf_svgPath(start, this.outside_arc_radius),
			this.big_svgPath(end, this.outside_arc_radius, false),
			this.small_svgPath(end, false),
			this.big_svgPath(start, this.inside_arc_radius, true),
			this.small_svgPath(start, true),
		];
		return paths.join(k.space);
	}

	startOf_svgPath(start_angle: number, radius: number) {
		return svgPaths.startOutAt(this.clusters_center, radius, start_angle);
	}

	big_svgPath(end_angle: number, radius: number, clockwise: boolean) {
		const sweep_flag = clockwise ? 0 : 1;
		return svgPaths.arc_partial(this.clusters_center, radius, 0, sweep_flag, end_angle);
	}

	small_svgPath(arc_angle: number, clockwise: boolean) {
		const delta = clockwise ? 0 : Math.PI;
		const tiny_radius = k.ring_thickness / 6;
		const end = (arc_angle + delta).normalized_angle();
		const middle_radius = this.inside_arc_radius + tiny_radius;
		const vectorTo_middleOf_arc = Point.fromPolar(middle_radius, arc_angle);
		const center = this.clusters_center.offsetBy(vectorTo_middleOf_arc);
		return svgPaths.arc_partial(center, tiny_radius, 0, 1, end);
	
	}

	tinyDot_svgPath(radius: number, basis_angle: number) {
		const start = this.clusters_center.offsetBy(Point.fromPolar(radius, basis_angle));
		return svgPaths.circle(start, 5);
	}

	fork_adjustment(fork_radius: number, inside_arc_radius: number): number {
		const ratio = fork_radius / inside_arc_radius / 2;
		const fork_angle = Math.asin(ratio) * 2;
		const delta = inside_arc_radius * (1 - Math.cos(fork_angle));
		return delta / Math.sqrt(1.5);
	}

	fork_svgPath() {
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

}