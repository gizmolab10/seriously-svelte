import { k, u, Point, Angle, svgPaths, Ancestry, Predicate } from '../common/GlobalImports';
import { ArcKind } from '../common/Enumerations';

export default class ClusterLayout {
	fork_radius_adjusted: number;
	predicate: Predicate | null;
	centerOf_necklace: Point;
	angle_ofLine: number;
	fork_radius: number;
	points_out: boolean;
	fork_center: Point;
	fork_origin: Point;
	big_arc_radius = 0;
	angle_atStart = 0;
	angle_atEnd = 0;
	line_tip: Point;
	count: number;

	constructor(predicate: Predicate | null, count: number, points_out: boolean) {
		const adjustment_ratio = 0.95 - count / 400;	// WHY?
		const big_arc_radius = k.cluster_arc_radius;
		const center = Point.square(big_arc_radius);
		const fork_radius = k.necklace_gap * count / 4;
		const angle = predicate?.angle_ofLine_for(points_out) ?? 0;
		const fork_fromCenter = Point.fromPolar(big_arc_radius, angle);
		const fork_radius_adjusted = (fork_radius - this.adjustment(fork_radius, big_arc_radius)) * adjustment_ratio;
		const fork_offset = Point.square(0.4 - (fork_radius_adjusted / adjustment_ratio));
		const tip_radius = k.cluster_line_length - fork_radius_adjusted;
		const fork_center = center.offsetBy(fork_fromCenter);

		this.fork_origin = fork_center.offsetBy(fork_offset);
		this.line_tip = Point.fromPolar(tip_radius, angle);
		this.fork_radius_adjusted = fork_radius_adjusted;
		this.big_arc_radius = big_arc_radius;
		this.centerOf_necklace = center;
		this.fork_center = fork_center;
		this.fork_radius = fork_radius;
		this.points_out = points_out;
		this.predicate = predicate;
		this.angle_ofLine = angle;
		this.count = count;
	}

	get gap_svgPath() { return svgPaths.circle(this.fork_center, this.fork_radius_adjusted - 0.5); }
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

	adjustment(fork_radius: number, big_arc_radius: number): number {
		const ratio = fork_radius / big_arc_radius / 2;
		const angle = Math.asin(ratio) * 2;
		const delta = big_arc_radius * (1 - Math.cos(angle));
		return delta * 2.2;
	}

	fork_svgPath(forwards: boolean) {
		const angle_offset = Angle.threeQuarters / 2;
		const fork_offset = Point.square(this.fork_radius_adjusted);
		const line_extension = this.fork_radius_adjusted * Math.sqrt(2);	// hypoteneuse of square
		const angle = u.normalized_angle(this.angle_ofLine + (forwards ? angle_offset : -angle_offset));
		const offset = Point.fromPolar(line_extension, angle).offsetBy(fork_offset);
		return svgPaths.arc(this.fork_origin.offsetBy(offset), this.fork_radius_adjusted, 1,
			this.angle_ofLine + (forwards ? 0 : Angle.quarter),
			this.angle_ofLine - (forwards ? Angle.quarter : 0));
	}

	big_svgPath(x_isPositive: boolean) {
		if (x_isPositive) {
			return svgPaths.arc(this.centerOf_necklace, this.big_arc_radius, 1, this.angle_atStart, this.angle_atEnd);
		} else {
			return svgPaths.arc(this.centerOf_necklace, this.big_arc_radius, 1, this.angle_atEnd, this.angle_atStart);
		}
	}

	small_svgPath(arc_angle: number, x_isPositive: boolean, advance: boolean) {
		const arc_small_radius = k.necklace_gap;
		const center = Point.square(this.big_arc_radius);
		const ratio = (x_isPositive == advance) ? -1 : Math.sqrt(2);
		const angle_start = u.normalized_angle(arc_angle + (Math.PI * ratio));
		const angle_end = u.normalized_angle(arc_angle + (Math.PI * (ratio - .4)));
		const distanceTo_arc_small_center = this.big_arc_radius + arc_small_radius;
		const center_small = center.offsetBy(Point.fromPolar(distanceTo_arc_small_center, arc_angle));
		return svgPaths.arc(center_small, arc_small_radius, 1, angle_start, angle_end);
	}

}