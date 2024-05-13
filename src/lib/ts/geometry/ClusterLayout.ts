import { k, u, Point, Angle, svgPaths, Ancestry, Predicate } from '../common/GlobalImports';
import { ArcKind } from '../common/Enumerations';

export default class ClusterLayout {
	predicate: Predicate | null;
	centerOf_necklace: Point;
	angle_ofLine: number;
	fork_radius: number;
	points_out: boolean;
	fork_center: Point;
	fork_origin: Point;
	angle_atStart = 0;
	angle_atEnd = 0;
	line_tip: Point;
	count: number;

	constructor(predicate: Predicate | null, count: number, points_out: boolean) {
		const fork_radius = k.necklace_gap * (count / 4);
		const center = Point.square(k.cluster_arc_radius);
		const offset = Point.square(k.necklace_gap * -0.7);
		const tip_radius = k.cluster_line_length - fork_radius;
		const angle = predicate?.angle_ofLine_for(points_out) ?? 0;
		const fork_fromCenter = Point.fromPolar(k.cluster_arc_radius, angle);

		this.fork_origin = center.offsetBy(fork_fromCenter).offsetBy(offset);
		this.fork_center = center.offsetBy(fork_fromCenter);
		this.line_tip = Point.fromPolar(tip_radius, angle);
		this.centerOf_necklace = center;
		this.fork_radius = fork_radius;
		this.points_out = points_out;
		this.predicate = predicate;
		this.angle_ofLine = angle;
		this.count = count;
	}

	get fork_svgPaths() { return [this.fork_svgPath(false), this.fork_svgPath(true)]; }
	get gap_svgPath() { return svgPaths.circle(this.fork_center, this.fork_radius); }

	get line_title(): string {
		const shortened = this.predicate?.kind.unCamelCase().lastWord() ?? k.empty;
		if (this.predicate?.isBidirectional) {
			return `${this.count} ${shortened}`;
		} else if (this.points_out) {
			return `${shortened} ${this.count}`;
		} else {
			return `is contained by ${this.count}`;
		}
	}

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

	fork_svgPath(forwards: boolean) {
		const angle_offset = Angle.threeQuarters / 2;
		const line_extension = this.fork_radius * 1.4;
		const fork_offset = Point.square(this.fork_radius / 2);
		const angle = u.normalized_angle(this.angle_ofLine + (forwards ? angle_offset : -angle_offset));
		const offset = Point.fromPolar(line_extension, angle).offsetBy(fork_offset);
		return svgPaths.arc(this.fork_origin.offsetBy(offset), this.fork_radius, 1,
			this.angle_ofLine + (forwards ? 0 : Angle.quarter),
			this.angle_ofLine - (forwards ? Angle.quarter : 0));
	}

	big_svgPath(x_isPositive: boolean) {
		if (x_isPositive) {
			return svgPaths.arc(this.centerOf_necklace, k.cluster_arc_radius, 1, this.angle_atStart, this.angle_atEnd);
		} else {
			return svgPaths.arc(this.centerOf_necklace, k.cluster_arc_radius, 1, this.angle_atEnd, this.angle_atStart);
		}
	}

	small_svgPath(arc_angle: number, x_isPositive: boolean, advance: boolean) {
		const arc_small_radius = k.necklace_gap;
		const center = Point.square(k.cluster_arc_radius);
		const ratio = (x_isPositive == advance) ? -1 : 1.4;
		const extended_radius = k.cluster_arc_radius + arc_small_radius;
		const center_small = center.offsetBy(Point.fromPolar(arc_angle, extended_radius));
		const angle_start = u.normalized_angle(arc_angle + (Math.PI * ratio));
		const angle_end = u.normalized_angle(angle_start - (Math.PI / 2.5));
		return svgPaths.arc(center_small, arc_small_radius, 1, angle_start, angle_end);
	}

}