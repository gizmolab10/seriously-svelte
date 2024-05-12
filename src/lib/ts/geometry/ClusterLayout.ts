import { k, u, Point, Angle, svgPaths, Predicate } from '../common/GlobalImports';
import { ArcKind } from '../common/Enumerations';
import { h } from '../db/DBDispatch';

export default class ClusterLayout {
	line_length = k.cluster_line_length - k.necklace_gap / 2;
	predicate: Predicate | null;
	necklace_center: Point;
	line_rotated: Point;
	idPredicate: string;
	points_out: boolean;
	fork_origin: Point;
	line_angle: number;
	start_angle = 0;
	count: number;
	end_angle = 0;

	constructor(idPredicate: string, count: number, points_out: boolean) {
		const predicate = h.predicate_forID(idPredicate);
		const angle = predicate?.clusterAngle_for(points_out) ?? 0;
		const fork_offset = Point.fromPolar(k.necklace_radius, angle);
		this.line_rotated = Point.fromPolar(this.line_length, angle);
		this.necklace_center = Point.square(k.necklace_radius)
		this.idPredicate = idPredicate;
		this.points_out = points_out;
		this.predicate = predicate;
		this.line_angle = angle
		this.count = count;
		this.fork_origin = this.necklace_center.offsetBy(fork_offset).offsetBy(Point.square(-7));
	}

	get gap_svgPath() {
		const breadth = k.necklace_gap;
		return svgPaths.circle(breadth, breadth, this.fork_origin);
	}

	get line_title(): string {
		const reversed = !this.points_out && this.predicate?.id == Predicate.idContains;
		const shortened = this.predicate?.kind.unCamelCase().lastWord() ?? k.empty;
		const other = this.points_out ? `${shortened} ${this.count}` : `${this.count} ${shortened}`
		return reversed ? `is contained by ${this.count}` : other;
	}

	get arc_keyed_svgPaths(): { [key: string]: Array<string>} {
		let dict: { [key: string]: Array<string>} = {};
		dict[ArcKind.main] = this.main_svgPaths;
		dict[ArcKind.fork] = this.fork_svgPaths;
		dict[ArcKind.gap] = [this.gap_svgPath];
		return dict;
	}

	get fork_svgPaths() {
		const fork_radius = k.necklace_gap / 2;
		const fork_offset = Point.square(fork_radius - 0.4);
		const angle_a = this.line_angle - Angle.threeQuarters / 2;
		const angle_b = this.line_angle + Angle.threeQuarters / 2;
		const offset_a = Point.fromPolar(fork_radius + 3.6, angle_a).offsetBy(fork_offset);
		const offset_b = Point.fromPolar(fork_radius + 3.6, angle_b).offsetBy(fork_offset);
		const first = svgPaths.arc(this.fork_origin.offsetBy(offset_a), fork_radius, this.line_angle + Angle.quarter, this.line_angle, 1);
		const second = svgPaths.arc(this.fork_origin.offsetBy(offset_b), fork_radius, this.line_angle, this.line_angle - Angle.quarter, 1);
		return [first, second];
	}

	get main_svgPaths(): Array<string> {
		const x_isPositive = u.angle_hasPositiveX(this.line_angle);
		const big_svgPath = this.big_svgPath(x_isPositive);
		const end_small_svgPath = this.small_svgPath(this.end_angle, x_isPositive, false);
		const start_small_svgPath = this.small_svgPath(this.start_angle, x_isPositive, true);
		return [start_small_svgPath, big_svgPath, end_small_svgPath];
	}

	big_svgPath(x_isPositive: boolean) {
		if (x_isPositive) {
			return svgPaths.arc(this.necklace_center, k.necklace_radius, this.start_angle, this.end_angle, 1);
		} else {
			return svgPaths.arc(this.necklace_center, k.necklace_radius, this.end_angle, this.start_angle, 1);
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
		return svgPaths.arc(smallArc_center, arc_small_radius, startAngle, endAngle, 1);
	}

}