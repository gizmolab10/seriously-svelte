import { k, u, Point, svgPaths, Predicate } from '../common/GlobalImports';
import { h } from '../db/DBDispatch';

export default class ClusterLayout {
	predicate: Predicate | null;
	idPredicate: string;
	pointsTo: boolean;
	startAngle = 0;
	count: number;
	angle: number;
	endAngle = 0;

	constructor(idPredicate: string, count: number, pointsTo: boolean) {
		this.predicate = h.predicate_forID(idPredicate);
		this.angle = this.predicate?.clusterAngle_for(pointsTo) ?? 0;
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

	get arcPath(): string {
		const radius = k.necklace_radius;
		let arcCenter = Point.square(radius);
		if (u.hasPositiveX(this.angle)) {
			return svgPaths.arc(arcCenter, k.necklace_radius, this.startAngle, this.endAngle, 1)
		} else {
			return svgPaths.arc(arcCenter, k.necklace_radius, this.endAngle, this.startAngle, 1)
		}
	}

}