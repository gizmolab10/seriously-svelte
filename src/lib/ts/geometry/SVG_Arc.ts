import { k, u, get, Point, Angle, svgPaths } from '../common/Global_Imports';
import { s_cluster_arc_radius } from '../state/Reactive_State';

// create svg paths for generic arcs
//
// given:
//	start, end & fork angles
//	s_cluster_arc_radius

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
		const radius = get(s_cluster_arc_radius);
		const thickness = k.paging_arc_thickness;
		this.inside_arc_radius = radius - thickness * 2;
		this.outside_arc_radius = radius - thickness;
		this.clusters_center = Point.square(radius);
		this.outside_ring_radius = radius;
	}

	get adjust_for_slantingForward(): boolean { return new Angle(this.fork_angle).angle_slantsForward; }
	get adjust_for_pointsRight(): boolean { return new Angle(this.fork_angle).angle_pointsRight; }
	get straddles_zero(): boolean { return this.start_angle.straddles_zero(this.end_angle); }
	get spread_angle(): number { return this.end_angle - this.start_angle; }

	update(fork_angle: number) {
		const fork_raw_radius = k.ring_thickness * 0.6;
		this.fork_backoff = this.fork_adjustment(fork_raw_radius, this.inside_arc_radius);
		this.fork_radius = fork_raw_radius - this.fork_backoff;
		this.fork_angle = fork_angle;
	}

	get arc_svgPath(): string {
		const paths = [
			this.startOf_svgPath(this.outside_arc_radius),
			this.big_svgPath(this.outside_arc_radius, false),
			this.small_svgPath(this.end_angle, true),
			this.big_svgPath(this.inside_arc_radius, true),
			this.small_svgPath(this.start_angle, false),
		];
		return paths.join(k.space);
	}

	startOf_svgPath(radius: number) {
		return svgPaths.startOutAt(this.clusters_center, radius, this.start_angle);
	}

	big_svgPath(radius: number, backwards: boolean) {
		const sweep_flag = backwards != this.adjust_for_pointsRight ? 1 : 0;
		return svgPaths.arc_partial(this.clusters_center, radius, 0, sweep_flag, 
			backwards ? this.start_angle : this.end_angle);
	}

	small_svgPath(arc_angle: number, advance: boolean) {
		const forward = this.adjust_for_pointsRight;
		const delta = advance ? Math.PI : 0;
		const sweep_flag = forward ? 1 : 0;
		const tiny_radius = k.ring_thickness / 6;
		const end = (arc_angle + delta).normalized_angle();
		const centerTo_middleOfScrollArc = Point.fromPolar(this.inside_arc_radius + tiny_radius, arc_angle);
		const center = this.clusters_center.offsetBy(centerTo_middleOfScrollArc);
		return svgPaths.arc_partial(center, tiny_radius, 0, sweep_flag, end);
	}

	tinyDot_svgPath(radius: number, referenceAngle: number) {
		const radial = new Point(radius, 0);
		const start = this.clusters_center.offsetBy(radial.rotate_by(referenceAngle));
		return svgPaths.circle(start, 20);
	}

	fork_adjustment(fork_radius: number, inside_arc_radius: number): number {
		const ratio = fork_radius / inside_arc_radius / 2;
		const fork_angle = Math.asin(ratio) * 2;
		const delta = inside_arc_radius * (1 - Math.cos(fork_angle));
		return delta / Math.sqrt(1.5);
	}

	fork_svgPath() {
		const forward = this.adjust_for_slantingForward;
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