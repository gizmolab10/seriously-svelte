import { k, u, Point, Angle, svgPaths, Ancestry, Predicate } from '../common/GlobalImports';
import { ArcKind } from '../common/Enumerations';

export default class ClusterLayout {
	line_length = k.cluster_line_length - k.necklace_gap;
	predicate: Predicate | null;
	necklace_center: Point;
	line_rotated: Point;
	points_out: boolean;
	fork_origin: Point;
	line_angle: number;
	start_angle = 0;
	count: number;
	end_angle = 0;

	constructor(predicate: Predicate | null, count: number, points_out: boolean) {
		const fork_offset = Point.square(k.necklace_gap * -1.4);
		const angle = predicate?.cluster_angle_for(points_out) ?? 0;
		const fork_rotated = Point.fromPolar(k.necklace_radius, angle);
		this.line_rotated = Point.fromPolar(this.line_length, angle);
		this.necklace_center = Point.square(k.necklace_radius);
		this.points_out = points_out;
		this.predicate = predicate;
		this.line_angle = angle
		this.count = count;
		this.fork_origin = this.necklace_center.offsetBy(fork_rotated).offsetBy(fork_offset);
	}

	get fork_svgPaths() { return [this.fork_svgPath(false), this.fork_svgPath(true)]; }

	get gap_svgPath() {
		const multiples = 1 + this.count / 4;
		const breadth = k.necklace_gap * multiples;
		return svgPaths.circle(breadth, breadth, this.fork_origin);
	}

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
		const x_isPositive = u.angle_hasPositiveX(this.line_angle);
		const big_svgPath = this.big_svgPath(x_isPositive);
		const end_small_svgPath = this.small_svgPath(this.end_angle, x_isPositive, false);
		const start_small_svgPath = this.small_svgPath(this.start_angle, x_isPositive, true);
		return [start_small_svgPath, big_svgPath, end_small_svgPath];
	}

	fork_svgPath(forwards: boolean) {
		const fork_radius = k.necklace_gap * 2;
		const line_extension = fork_radius * 1.4;
		const angle_offset = Angle.threeQuarters / 2;
		const fork_offset = Point.square(fork_radius / 2);
		const angle = this.line_angle + (forwards ? angle_offset : -angle_offset);
		const offset = Point.fromPolar(line_extension, angle).offsetBy(fork_offset);
		return svgPaths.arc(this.fork_origin.offsetBy(offset), fork_radius, 1,
			this.line_angle + (forwards ? 0 : Angle.quarter),
			this.line_angle - (forwards ? Angle.quarter : 0));
	}

	big_svgPath(x_isPositive: boolean) {
		if (x_isPositive) {
			return svgPaths.arc(this.necklace_center, k.necklace_radius, 1, this.start_angle, this.end_angle);
		} else {
			return svgPaths.arc(this.necklace_center, k.necklace_radius, 1, this.end_angle, this.start_angle);
		}
	}

	small_svgPath(arc_angle: number, x_isPositive: boolean, advance: boolean) {
		const arc_small_radius = k.necklace_gap;
		const center = Point.square(k.necklace_radius);
		const ratio = (x_isPositive == advance) ? -1 : 1.4;
		const extended_radius = k.necklace_radius + arc_small_radius;
		const smallArc_center = center.offsetBy(Point.fromPolar(extended_radius, arc_angle));
		const startAngle = u.normalized_angle(arc_angle + (Math.PI * ratio));
		const endAngle = u.normalized_angle(startAngle - (Math.PI / 2.5));
		return svgPaths.arc(smallArc_center, arc_small_radius, 1, startAngle, endAngle);
	}

}