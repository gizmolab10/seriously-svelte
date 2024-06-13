import { g, k, u, get, Angle, IDLine, svgPaths, Ancestry, Predicate, ChildMapRect } from '../common/GlobalImports';
import { s_ring_angle, s_cluster_arc_radius } from '../state/ReactiveState';
import { Rect, Point } from '../geometry/Geometry';
import { ArcKind } from '../common/Enumerations';

// for a cluster, compute svg paths and positions for line and children

export default class ClusterLayout {
	cluster_ancestry: Ancestry | null;
	ancestries: Array<Ancestry> = [];
	predicate: Predicate | null;
	index = 0;	// for Advance
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

	constructor(cluster_ancestry: Ancestry, ancestries: Array<Ancestry>, predicate: Predicate | null, points_out: boolean) {
		const arc_radius = get(s_cluster_arc_radius);
		const center = Point.square(arc_radius);
		const tiny_radius = k.necklace_gap / 2;
		const line_angle = this.lineAngle_for(predicate, points_out) ?? 0;
		const fork_backoff = this.fork_adjustment(tiny_radius, arc_radius);
		const fork_fromCenter = Point.fromPolar(arc_radius, line_angle);
		const fork_center = center.offsetBy(fork_fromCenter);
		const fork_radius = tiny_radius - fork_backoff;
		const line_radius = arc_radius - k.cluster_inside_radius - fork_radius;

		this.line_tip = Point.fromPolar(line_radius, line_angle);
		this.cluster_ancestry = cluster_ancestry;
		this.fork_backoff = fork_backoff;
		this.fork_radius = fork_radius;
		this.fork_center = fork_center;
		this.angle_ofLine = line_angle;
		this.count = ancestries.length;
		this.necklace_center = center;
		this.ancestries = ancestries;
		this.arc_radius = arc_radius;
		this.points_out = points_out;
		this.predicate = predicate;
	}

	destroy() {
		this.ancestries = [];
		this.cluster_ancestry = null;
	}
	
	static readonly $_ANGLES_$: unique symbol;

	childMapRects(center: Point): Array<ChildMapRect>  {
		let array: Array<ChildMapRect> = [];
		const count = this.ancestries.length;
		if (count > 0 && !!this.predicate) {
			let index = 0;
			const radius = this.arc_radius;
			const radial = new Point(radius + k.necklace_gap, 0);
			while (index < count) {
				const ancestry = this.ancestries[index];
				const childAngle = this.angle_ofChild_for(index, count, radius);
				const childOrigin = center.offsetBy(radial.rotate_by(childAngle));
				const map = new ChildMapRect(IDLine.flat, new Rect(), childOrigin, ancestry, this.cluster_ancestry, childAngle); //, this.predicate.kind);
				array.push(map);
				index += 1;
			}
		}
		return array;
	}

	angle_ofChild_for(index: number, count: number, radius: number): number {
		const row = index - ((count - 1) / 2);			// row centered around zero
		const radial = new Point(radius, 0);
		const angle_ofLine = this.angle_ofLine;			// points at middle widget
		const rotated = radial.rotate_by(angle_ofLine);
		const startY = rotated.y;						// height of angle_ofLine
		let y = startY + (row * (k.row_height - 1.5));	// height of row
		let unfit = false;
		if (Math.abs(y) > radius) {
			unfit = true;
			if (y > 0) {
				y = radius - (y % radius);				// swing around bottom
			} else {
				y = (-y % radius) - radius;				// swing around top
			}
		}
		let child_angle = -Math.asin(y / radius);		// negate arc sign for clockwise
		if (unfit != rotated.x < 0) {
			child_angle = Angle.half - child_angle		// compensate for arc sin limitations
		}
		child_angle = u.normalized_angle(child_angle);
		if (index == 0) {
			if (startY < 0) {
				this.angle_atEnd = child_angle;
			} else {
				this.angle_atStart = child_angle;
			}
		} else if (index == count - 1) {
			if (startY < 0) {
				this.angle_atStart = child_angle;
			} else {
				this.angle_atEnd = child_angle;
			}
		}
		return child_angle;
	}

	lineAngle_for(predicate: Predicate | null, points_out: boolean): number | null {
		// returns one of three angles: 1) necklace_angle 2) opposite+ 3) opposite-tweak
		if (!!predicate) {
			const tweak = Math.PI / 4;		// 45 degrees: added or subtracted -> opposite
			const necklace_angle = get(s_ring_angle);
			const opposite = necklace_angle + Angle.half;
			const raw = predicate.isBidirectional ?
				opposite - tweak :
				points_out ? necklace_angle :	// one directional, use global
				opposite + tweak;
			return u.normalized_angle(raw);
		}
		return null;
	}
	
	static readonly $_SVGS_$: unique symbol;

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
		const angle_tiltsUp = u.angle_tiltsUp(this.angle_ofLine);
		const big_svgPath = this.big_svgPath(angle_tiltsUp);
		const end_small_svgPath = this.small_svgPath(this.angle_atEnd, angle_tiltsUp, false);
		const start_small_svgPath = this.small_svgPath(this.angle_atStart, angle_tiltsUp, true);
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

	big_svgPath(angle_tiltsUp: boolean) {
		return svgPaths.arc(this.necklace_center, this.arc_radius, 1, 
			angle_tiltsUp ? this.angle_atStart : this.angle_atEnd,
			angle_tiltsUp ? this.angle_atEnd : this.angle_atStart);
	}

	fork_adjustment(fork_radius: number, arc_radius: number): number {
		const ratio = fork_radius / arc_radius / 2;
		const fork_angle = Math.asin(ratio) * 2;
		const delta = arc_radius * (1 - Math.cos(fork_angle));
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