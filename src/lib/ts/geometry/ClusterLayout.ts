import { k, u, Point, Angle, svgPaths, Predicate } from '../common/GlobalImports';
import { ArcKind } from '../common/Enumerations';
import { h } from '../db/DBDispatch';

export default class ClusterLayout {
	predicate: Predicate | null;
	radius = k.necklace_radius;
	arc_line_intersect: Point;
	necklace_center: Point;
	line_rotated: Point;
	idPredicate: string;
	line_angle: number;
	pointsTo: boolean;
	start_angle = 0;
	count: number;
	end_angle = 0;

	constructor(idPredicate: string, count: number, pointsTo: boolean) {
		this.predicate = h.predicate_forID(idPredicate);
		this.line_angle = this.predicate?.clusterAngle_for(pointsTo) ?? 0;
		this.line_rotated = Point.polarVector(this.line_length, this.line_angle);
		this.necklace_center = Point.square(this.radius)
		this.idPredicate = idPredicate;
		this.pointsTo = pointsTo;
		this.count = count;
		const mysteryOffset = Point.square(-7);
		const distance_toGap = k.cluster_line_length + 35;
		const line_rotated = Point.polarVector(distance_toGap, this.line_angle);
		this.arc_line_intersect = this.necklace_center.offsetBy(mysteryOffset).offsetBy(line_rotated);
	}

	get line_length(): number { return k.cluster_line_length - k.necklace_gap / 2; }

	get arcGapPath() {
		const breadth = k.necklace_gap;
		return svgPaths.circle(breadth, breadth, this.arc_line_intersect);
	}

	get title(): string {
		const reversed = !this.pointsTo && this.predicate?.id == Predicate.idContains;
		const shortened = this.predicate?.kind.unCamelCase().lastWord() ?? k.empty;
		const other = this.pointsTo ? `${shortened} ${this.count}` : `${this.count} ${shortened}`
		return reversed ? `is contained by ${this.count}` : other;
	}

	get keyedArcPaths(): { [key: string]: Array<string>} {
		let dict: { [key: string]: Array<string>} = {};
		dict[ArcKind.start] = this.arcStartAncestries;
		dict[ArcKind.main] = this.arcMainPaths;
		dict[ArcKind.gap] = [this.arcGapPath];
		return dict;
	}

	get arcStartAncestries() {
		const radius = k.necklace_gap / 2;
		const origin = this.arc_line_intersect;
		const offset = Point.square(radius - 0.4);
		const angle_a = this.line_angle - Angle.threeQuarters / 2;
		const angle_b = this.line_angle + Angle.threeQuarters / 2;
		const offset_a = Point.polarVector(radius + 3.6, angle_a).offsetBy(offset);
		const offset_b = Point.polarVector(radius + 3.6, angle_b).offsetBy(offset);
		const first = svgPaths.arc(origin.offsetBy(offset_a), radius, this.line_angle + Angle.quarter, this.line_angle, 1);
		const second = svgPaths.arc(origin.offsetBy(offset_b), radius, this.line_angle, this.line_angle - Angle.quarter, 1);
		return [first, second];
	}

	get arcMainPaths(): Array<string> {
		const hasPositiveX = u.hasPositiveX(this.line_angle);
		const bigArc_path = this.bigArc_path(hasPositiveX);
		const end_smallArc_path = this.smallArc_path(this.end_angle, hasPositiveX, false);
		const start_smallArc_path = this.smallArc_path(this.start_angle, hasPositiveX, true);
		return [start_smallArc_path, bigArc_path, end_smallArc_path];
	}

	bigArc_path(hasPositiveX: boolean) {
		if (hasPositiveX) {
			return svgPaths.arc(this.necklace_center, this.radius, this.start_angle, this.end_angle, 1);
		} else {
			return svgPaths.arc(this.necklace_center, this.radius, this.end_angle, this.start_angle, 1);
		}
	}

	smallArc_path(arc_angle: number, hasPositiveX: boolean, advance: boolean) {
		const smallArc_radius = k.necklace_gap;
		const necklace_center = Point.square(this.radius);
		const ratio = (hasPositiveX == advance) ? -1 : 1.4;
		const extended_radius = this.radius + smallArc_radius;
		const smallArc_center = necklace_center.offsetBy(Point.polarVector(extended_radius, arc_angle));
		const startAngle = u.normalized_angle(arc_angle + (Math.PI * ratio));
		const endAngle = u.normalized_angle(startAngle - (Math.PI / 2.5));
		return svgPaths.arc(smallArc_center, smallArc_radius, startAngle, endAngle, 1);
	}

}