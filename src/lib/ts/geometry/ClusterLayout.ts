import { k, u, Point, svgPaths, Predicate } from '../common/GlobalImports';
import { h } from '../db/DBDispatch';

export default class ClusterLayout {
	predicate: Predicate | null;
	idPredicate: string;
	line_angle: number;
	pointsTo: boolean;
	start_angle = 0;
	count: number;
	end_angle = 0;

	constructor(idPredicate: string, count: number, pointsTo: boolean) {
		this.predicate = h.predicate_forID(idPredicate);
		this.line_angle = this.predicate?.clusterAngle_for(pointsTo) ?? 0;
		this.idPredicate = idPredicate;
		this.pointsTo = pointsTo;
		this.count = count;
	}

	get title(): string {
		const reversed = !this.pointsTo && this.predicate?.id == Predicate.idContains;
		const shortened = this.predicate?.kind.unCamelCase().lastWord() ?? k.empty;
		const other = this.pointsTo ? `${shortened} ${this.count}` : `${this.count} ${shortened}`
		return reversed ? `is contained by ${this.count}` : other;
	}

	get arcPaths(): Array<string> {
		const hasPositiveX = u.hasPositiveX(this.line_angle);
		const bigArc_path = this.bigArc_path(hasPositiveX);
		const end_smallArc_path = this.smallArc_path(this.end_angle, hasPositiveX, false);
		const start_smallArc_path = this.smallArc_path(this.start_angle, hasPositiveX, true);
		const paths = [start_smallArc_path, bigArc_path, end_smallArc_path];
		return paths;
	}

	bigArc_path(hasPositiveX: boolean) {
		const radius = k.necklace_radius;
		const arc_center = Point.square(radius);
		if (hasPositiveX) {
			return svgPaths.arc(arc_center, radius, this.start_angle, this.end_angle, 1);
		} else {
			return svgPaths.arc(arc_center, radius, this.end_angle, this.start_angle, 1);
		}
	}

	smallArc_path(arc_angle: number, hasPositiveX: boolean, advance: boolean) {
		const smallArc_radius = k.necklace_gap;
		const necklace_radius = k.necklace_radius;
		const same = hasPositiveX == advance;
		const necklace_center = Point.square(necklace_radius);
		const extended_radius = necklace_radius + smallArc_radius;
		const smallArc_center = necklace_center.offsetBy(new Point(extended_radius, 0).rotate_by(arc_angle));
		const ratio = same ? -1 : 1.4;
		const startAngle = u.normalized_angle(arc_angle + (Math.PI * ratio));
		const endAngle = u.normalized_angle(startAngle - (Math.PI / 2.5));
		return svgPaths.arc(smallArc_center, smallArc_radius, startAngle, endAngle, 1);
	}

}