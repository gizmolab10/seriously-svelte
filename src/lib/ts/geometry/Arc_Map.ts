import { k, u, get, Point, Angle, svgPaths } from '../common/Global_Imports';
import { s_cluster_arc_radius } from '../state/Reactive_State';

export default class Arc_Map {
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

	update_fork_forShown(shown: number) {
		const fork_raw_radius = k.ring_thickness * this.fork_radius_multiplier(shown);
		this.fork_backoff = this.fork_adjustment(fork_raw_radius, this.inside_arc_radius);
		this.fork_radius = fork_raw_radius - this.fork_backoff;
		this.shown = shown;
	}

	center_at(radius: number, angle: number): Point { return Point.square(this.outside_ring_radius).offsetBy(Point.fromPolar(radius, angle)); }
	fork_radius_multiplier(shown: number): number { return (shown > 3) ? 0.6 : (shown > 1) ? 0.3 : 0.15; }
	get fork_center(): Point { return this.center_at(this.inside_arc_radius, -this.fork_angle); }
	get single_svgPath(): string { return svgPaths.circle(this.fork_center, this.fork_radius - 0.5); }
	get gap_svgPath(): string { return svgPaths.circle(this.fork_center, this.fork_radius - 0.5); }
	get fork_svgPaths(): string[] { return [this.fork_svgPath(false), this.fork_svgPath(true)]; }
	get spread_angle(): number { return this.end_angle - this.start_angle; }

	get arc_svgPath(): string {
		let paths: Array<string> = u.concatenateArrays(this.main_svgPaths, this.outer_svgPaths);
		return paths.join(k.space);
	}

	get main_svgPaths(): Array<string> {
		const angle_leansForward = new Angle(this.fork_angle).angle_leansForward;
		const big_inner_svgPath = this.big_svgPath(this.inside_arc_radius, angle_leansForward);
		return [big_inner_svgPath];
	}

	get outer_svgPaths(): Array<string> {
		const angle_leansForward = new Angle(this.fork_angle).angle_leansForward;
		const big_outer_svgPath = this.big_svgPath(this.outside_arc_radius, angle_leansForward);
		const end_small_svgPath = this.small_svgPath(this.end_angle, angle_leansForward, false);
		const start_small_svgPath = this.small_svgPath(this.start_angle, angle_leansForward, true);
		return [start_small_svgPath, big_outer_svgPath, end_small_svgPath];
	}

	big_svgPath(radius: number, angle_leansForward: boolean) {
		return svgPaths.arc(this.clusters_center, radius, 1, 
			angle_leansForward ? this.end_angle : this.start_angle,
			angle_leansForward ? this.start_angle : this.end_angle);
	}

	fork_adjustment(fork_radius: number, inside_arc_radius: number): number {
		const ratio = fork_radius / inside_arc_radius / 2;
		const fork_angle = Math.asin(ratio) * 2;
		const delta = inside_arc_radius * (1 - Math.cos(fork_angle));
		return delta / Math.sqrt(1.5);
	}

	fork_svgPath(forwards: boolean) {
		const fork_radius = this.fork_radius;
		const angle = -this.fork_angle;
		const y = fork_radius * (forwards ? -1 : 1);
		const x = this.inside_arc_radius - fork_radius - this.fork_backoff;
		const origin = new Point(x, y).rotate_by(angle);
		return svgPaths.arc(origin.offsetBy(this.clusters_center), fork_radius, 1,
			angle + (forwards ? Angle.quarter : 0),
			angle - (forwards ? 0 : Angle.quarter));
	}

	small_svgPath(arc_angle: number, tiltsUp: boolean, advance: boolean) {
		const center = Point.square(this.outside_ring_radius);
		const small_arc_radius = k.ring_thickness / 6;
		const clockwise = tiltsUp == advance;
		const ratio = clockwise ? -1 : 1;
		const distanceTo_small_arc_center = this.inside_arc_radius + small_arc_radius;
		const small_arc_angle_start = (arc_angle + (Math.PI * ratio)).normalized_angle();
		const small_arc_angle_end = (arc_angle + (Math.PI * (ratio - 1))).normalized_angle();
		const small_arc_center = center.offsetBy(Point.fromPolar(distanceTo_small_arc_center, arc_angle));
		return svgPaths.arc(small_arc_center, small_arc_radius, clockwise ? 0 : 1, small_arc_angle_start, small_arc_angle_end);
	}

}