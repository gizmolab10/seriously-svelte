import { k, u, Point, Angle, svgPaths, Ancestry, Predicate } from '../common/GlobalImports';
import { ArcKind } from '../common/Enumerations';

export default class ClusterLayout {
	predicate: Predicate | null;
	necklace_center: Point;
	angle_ofLine: number;
	fork_backoff: number;
	fork_radius: number;
	points_out: boolean;
	fork_center: Point;
	angle_atStart = 0;
	angle_atEnd = 0;
	line_tip: Point;
	arc_radius = 0;
	count: number;

	constructor(predicate: Predicate | null, count: number, points_out: boolean) {
		const arc_radius = k.cluster_arc_radius;
		const center = Point.square(arc_radius);
		const tiny_radius = k.necklace_gap * (0.5 + count / 6);
		const angle = predicate?.angle_ofLine_for(points_out) ?? 0;
		const fork_backoff = this.fork_adjustment(tiny_radius, arc_radius);
		const fork_fromCenter = Point.fromPolar(arc_radius, angle);
		const fork_center = center.offsetBy(fork_fromCenter);
		const fork_radius = tiny_radius - fork_backoff;
		const line_radius = k.cluster_line_length - fork_radius;

		this.line_tip = Point.fromPolar(line_radius, angle);
		this.fork_backoff = fork_backoff;
		this.fork_radius = fork_radius;
		this.fork_center = fork_center;
		this.necklace_center = center;
		this.arc_radius = arc_radius;
		this.points_out = points_out;
		this.predicate = predicate;
		this.angle_ofLine = angle;
		this.count = count;
	}

	get gap_svgPath() { return svgPaths.circle(this.fork_center, this.fork_radius - 0.5); }
	get fork_svgPaths() { return [this.fork_svgPath(false), this.fork_svgPath(true)]; }

	get arc_keyed_svgPaths(): { [key: string]: Array<string>} {
		let dict: { [key: string]: Array<string>} = {};
		dict[ArcKind.main] = this.main_svgPaths;
		dict[ArcKind.fork] = this.fork_svgPaths;
		dict[ArcKind.gap] = [this.gap_svgPath];
		return dict;
	}

	get main_svgPaths(): Array<string> {
		const x_isPositive = u.angle_hasPositiveX(this.angle_ofLine);
		const big_svgPath = this.big_svgPath(x_isPositive);
		const end_small_svgPath = this.small_svgPath(this.angle_atEnd, x_isPositive, false);
		const start_small_svgPath = this.small_svgPath(this.angle_atStart, x_isPositive, true);
		return [start_small_svgPath, big_svgPath, end_small_svgPath];
	}

	get line_title(): string {
		let shortened = this.predicate?.kind.unCamelCase().lastWord() ?? k.empty;
		if (!this.predicate?.isBidirectional) {
			shortened = this.points_out ? shortened : 'is contained by';
			return `${shortened} ${this.count}`;
		}
		return `${this.count} ${shortened}`;
	}

	big_svgPath(x_isPositive: boolean) {
		return svgPaths.arc(this.necklace_center, this.arc_radius, 1, 
			x_isPositive ? this.angle_atStart : this.angle_atEnd,
			x_isPositive ? this.angle_atEnd : this.angle_atStart);
	}

	fork_adjustment(fork_radius: number, arc_radius: number): number {
		const ratio = fork_radius / arc_radius / 2;
		const angle = Math.asin(ratio) * 2;
		const delta = arc_radius * (1 - Math.cos(angle));
		return delta / Math.sqrt(1.5);
	}

	fork_svgPath(forwards: boolean) {
		const radius = this.fork_radius;
		const y = radius * (forwards ? -1 : 1);
		const x = this.arc_radius - radius - this.fork_backoff;
		const origin = new Point(x, y).rotate_by(this.angle_ofLine);
		return svgPaths.arc(origin.offsetBy(this.necklace_center), radius, 1,
			this.angle_ofLine + (forwards ? 0 : Angle.quarter),
			this.angle_ofLine - (forwards ? Angle.quarter : 0));
	}

	small_svgPath(arc_angle: number, x_isPositive: boolean, advance: boolean) {
		const arc_small_radius = k.necklace_gap;
		const center = Point.square(this.arc_radius);
		const ratio = (x_isPositive == advance) ? -1 : Math.sqrt(2);
		const angle_start = u.normalized_angle(arc_angle + (Math.PI * ratio));
		const angle_end = u.normalized_angle(arc_angle + (Math.PI * (ratio - .4)));
		const distanceTo_arc_small_center = this.arc_radius + arc_small_radius;
		const center_small = center.offsetBy(Point.fromPolar(distanceTo_arc_small_center, arc_angle));
		return svgPaths.arc(center_small, arc_small_radius, 1, angle_start, angle_end);
	}

}