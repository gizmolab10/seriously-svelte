import { k, u, get, Point, Angle, svgPaths } from '../common/Global_Imports';
import { s_cluster_arc_radius } from '../state/Reactive_State';

// create svg paths for generic arcs
//
// given:
//	start, end & fork angles
//	s_cluster_arc_radius
//	number shown

export default class SVG_Arc {
	clusters_center = Point.zero;
	outside_ring_radius = 0;
	outside_arc_radius = 0;
	inside_arc_radius = 0;
	fork_backoff = 0;
	fork_radius = 0;
	start_angle = 0;
	fork_angle = 0;
	end_angle = 0;
	shown = 0;

	constructor() {
		this.outside_ring_radius = get(s_cluster_arc_radius);
		this.clusters_center = Point.square(this.outside_ring_radius);
		this.inside_arc_radius = this.outside_ring_radius - k.scroll_arc_thickness * 2;
		this.outside_arc_radius = this.inside_arc_radius + k.scroll_arc_thickness;
	}

	setup(fork_angle: number, shown: number) {
		const multiplier = (shown > 3) ? 0.6 : (shown > 1) ? 0.3 : 0.15;
		const fork_raw_radius = k.ring_thickness * multiplier;
		this.fork_backoff = this.fork_adjustment(fork_raw_radius, this.inside_arc_radius);
		this.fork_radius = fork_raw_radius - this.fork_backoff;
		this.fork_angle = fork_angle;
		this.shown = shown;
	}

	get adjust_for_leaningForward(): boolean { return new Angle(this.fork_angle).angle_leansForward; }
	get straddles_zero(): boolean { return this.start_angle.straddles_zero(this.end_angle); }
	get spread_angle(): number { return this.end_angle - this.start_angle; }

	get arc_svgPath(): string {
		const paths = [
			this.big_svgPath(this.outside_arc_radius),
			this.small_svgPath(this.end_angle, false),
			this.big_svgPath(this.inside_arc_radius),
			this.small_svgPath(this.start_angle, true)];
		return paths.join(k.space);
	}

	big_svgPath(radius: number) {
		const forward = this.adjust_for_leaningForward;
		return svgPaths.arc(this.clusters_center, radius, 1, 
			forward ? this.end_angle : this.start_angle,
			forward ? this.start_angle : this.end_angle);
	}

	small_svgPath(arc_angle: number, advance: boolean) {
		const forward = this.adjust_for_leaningForward;
		const center = Point.square(this.outside_ring_radius);
		const small_arc_radius = k.ring_thickness / 6;
		const clockwise = forward == advance;
		const ratio = clockwise ? -1 : 1;
		const distanceTo_small_arc_center = this.inside_arc_radius + small_arc_radius;
		const small_arc_angle_start = (arc_angle + (Math.PI * ratio)).normalized_angle();
		const small_arc_angle_end = (arc_angle + (Math.PI * (ratio - 1))).normalized_angle();
		const small_arc_center = center.offsetBy(Point.fromPolar(distanceTo_small_arc_center, arc_angle));
		return svgPaths.arc(small_arc_center, small_arc_radius, clockwise ? 0 : 1, small_arc_angle_start, small_arc_angle_end);
	}

	fork_adjustment(fork_radius: number, inside_arc_radius: number): number {
		const ratio = fork_radius / inside_arc_radius / 2;
		const fork_angle = Math.asin(ratio) * 2;
		const delta = inside_arc_radius * (1 - Math.cos(fork_angle));
		return delta / Math.sqrt(1.5);
	}

	fork_svgPath() {
		const forward = this.adjust_for_leaningForward;
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