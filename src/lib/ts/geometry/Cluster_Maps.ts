import { s_clusters, s_graphRect, s_ring_angle, s_ancestry_focus, s_cluster_arc_radius } from '../state/ReactiveState';
import { k, u, get, Rect, Point, Angle, IDLine, svgPaths } from '../common/GlobalImports';
import { Ancestry, Predicate, Widget_MapRect } from '../common/GlobalImports';
import { ArcPart } from '../common/Enumerations';

// for one cluster (there are three)
//
// assumes ancestries are already reduced to fit
//
// computes: angle and vector for line,
// svg paths and positions for the arc pieces,
// and Widget_MapRect for each child

export default class Cluster_Maps  {
	widget_maps: Array<Widget_MapRect> = [];	// maximum a page's worth, will be combined into geometry.widget_maps
	predicates: Array<Predicate> = [];			// ditto
	ancestries: Array<Ancestry> = [];			// ditto
	cluster_ancestry!: Ancestry;
	clusters_center: Point;
	predicate: Predicate;
	angle_ofLine: number;
	fork_backoff: number;
	fork_radius: number;
	points_out: boolean;
	center = Point.zero;
	fork_center: Point;
	angle_atStart = 0;
	inner_radius = 0;
	angle_atEnd = 0;
	line_tip: Point;
	arc_radius = 0;
	count: number;
	total: number;

	constructor(total: number, ancestries: Array<Ancestry>, predicate: Predicate, points_out: boolean) {
		const arc_radius = get(s_cluster_arc_radius)
		const inner_radius = arc_radius - k.ring_thickness;
		const center = Point.square(arc_radius);
		const tiny_radius = k.necklace_gap / 1.3;
		const line_angle = this.lineAngle_for(predicate, points_out) ?? 0;
		const fork_backoff = this.fork_adjustment(tiny_radius, inner_radius);
		const fork_fromCenter = Point.fromPolar(inner_radius, -line_angle);
		const fork_center = center.offsetBy(fork_fromCenter);
		const fork_radius = tiny_radius - fork_backoff;
		const line_radius = inner_radius - k.cluster_inside_radius - fork_radius;

		this.center = get(s_graphRect).size.dividedInHalf.asPoint;
		this.line_tip = Point.fromPolar(line_radius, -line_angle);
		this.cluster_ancestry = get(s_ancestry_focus);
		this.inner_radius = inner_radius;
		this.fork_backoff = fork_backoff;
		this.fork_radius = fork_radius;
		this.fork_center = fork_center;
		this.angle_ofLine = line_angle;
		this.count = ancestries.length;
		this.clusters_center = center;
		this.ancestries = ancestries;
		this.arc_radius = arc_radius;
		this.points_out = points_out;
		this.predicate = predicate;
		this.total = total;
		this.setup()
	}

	destructor() { this.ancestries = []; }
	get cluster_index(): number { return get(s_clusters).index_for(this.points_out, this.predicate); }
	set_cluster_index(index: number) { s_clusters.set(get(s_clusters).setIndex_for(index, this.points_out, this.predicate)); }

	setup() {
		const radius = this.arc_radius;
		const count = this.ancestries.length;
		const center = this.center.offsetByXY(2, -1.5);
		const radial = new Point(radius + k.necklace_gap, 0);

		this.widget_maps = [];
		if (count > 0 && !!this.predicate) {
			let index = 0;
			while (index < count) {
				const ancestry = this.ancestries[index];
				const childAngle = this.angle_ofChild_for(index, count, radius);
				const childOrigin = center.offsetBy(radial.rotate_by(childAngle));
				const map = new Widget_MapRect(IDLine.flat, new Rect(), childOrigin, ancestry, this.cluster_ancestry, childAngle); //, this.predicate.kind);
				this.widget_maps.push(map);
				index += 1;
			}
		}
	}

	advance(isForward: boolean) {
		const sign = isForward ? 1 : -1;
		const showing = this.ancestries.length;
		const index = this.cluster_index.increment_by_assuring(showing * sign, this.total);
		this.set_cluster_index(index);
	}
	
	static readonly $_ANGLES_$: unique symbol;

	angle_ofChild_for(index: number, count: number, radius: number): number {
		const max = count - 1;
		const row = (max / 2) - index;					// row centered around zero
		const radial = new Point(radius, 0);
		const angle_ofLine = this.angle_ofLine;			// points at middle widget
		const rotated = radial.rotate_by(angle_ofLine);
		const startY = rotated.y;						// height of angle_ofLine
		let y = startY + (row * k.row_height);			// height of row
		let unfit = false;
		if (Math.abs(y) > radius) {
			unfit = true;
			if (y > 0) {
				y = radius - (y % radius);				// swing around bottom
			} else {
				y = (-y % radius) - radius;				// swing around top
			}
		}
		let child_angle = Math.asin(y / radius);		// negate arc sign for clockwise
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
		} else if (index == max) {
			if (startY > 0) {
				this.angle_atEnd = child_angle;
			} else {
				this.angle_atStart = child_angle;
			}
		}
		return child_angle;
	}

	lineAngle_for(predicate: Predicate, points_out: boolean): number | null {
		// returns one of three angles: 1) necklace_angle 2) opposite+ 3) opposite-tweak
		const tweak = Math.PI / 4;		// 45 degrees: added or subtracted -> opposite
		const necklace_angle = get(s_ring_angle);
		const opposite = necklace_angle + Angle.half;
		const raw = predicate.isBidirectional ?
			opposite - tweak :
			points_out ? necklace_angle :	// one directional, use global
			opposite + tweak;
		return u.normalized_angle(-raw);
	}
	
	static readonly $_SVGS_$: unique symbol;

	get gap_svgPath() { return svgPaths.circle(this.fork_center, this.fork_radius - 0.5); }
	get fork_svgPaths() { return [this.fork_svgPath(false), this.fork_svgPath(true)]; }

	get arc_parts_svgPaths(): { [arc_part: string]: Array<string>} {
		let dict: { [arc_part: string]: Array<string>} = {};
		dict[ArcPart.main] = this.main_svgPaths;
		dict[ArcPart.fork] = this.fork_svgPaths;
		dict[ArcPart.gap] = [this.gap_svgPath];
		return dict;
	}

	get main_svgPaths(): Array<string> {
		const angle_tiltsUp = u.angle_tiltsUp(this.angle_ofLine);
		const big_arc_svgPath = this.big_svgPath(this.arc_radius, angle_tiltsUp);
		const big_inner_svgPath = this.big_svgPath(this.inner_radius, angle_tiltsUp);
		const end_small_svgPath = this.small_svgPath(this.angle_atEnd, angle_tiltsUp, false);
		const start_small_svgPath = this.small_svgPath(this.angle_atStart, angle_tiltsUp, true);
		return [start_small_svgPath, big_inner_svgPath, big_arc_svgPath, end_small_svgPath];
	}

	get line_title(): string {
		let shortened = this.predicate?.kind.unCamelCase().lastWord() ?? k.empty;
		const quantity = `${this.total}`;
		if (!this.predicate?.isBidirectional) {
			shortened = this.points_out ? shortened : 'is contained by';
			return `${shortened} ${quantity}`;
		}
		return `${quantity} ${shortened}`;
	}

	big_svgPath(radius: number, angle_tiltsUp: boolean) {
		return svgPaths.arc(this.clusters_center, radius, 1, 
			angle_tiltsUp ? this.angle_atEnd : this.angle_atStart,
			angle_tiltsUp ? this.angle_atStart : this.angle_atEnd);
	}

	fork_adjustment(fork_radius: number, inner_radius: number): number {
		const ratio = fork_radius / inner_radius / 2;
		const fork_angle = Math.asin(ratio) * 2;
		const delta = inner_radius * (1 - Math.cos(fork_angle));
		return delta / Math.sqrt(1.5);
	}

	fork_svgPath(forwards: boolean) {
		const fork_radius = this.fork_radius;
		const angle = -this.angle_ofLine;
		const y = fork_radius * (forwards ? -1 : 1);
		const x = this.inner_radius - fork_radius - this.fork_backoff;
		const origin = new Point(x, y).rotate_by(angle);
		return svgPaths.arc(origin.offsetBy(this.clusters_center), fork_radius, 1,
			angle + (forwards ? Angle.quarter : 0),
			angle - (forwards ? 0 : Angle.quarter));
	}

	small_svgPath(arc_angle: number, x_isPositive: boolean, advance: boolean) {
		const arc_small_radius = k.ring_thickness / 2;
		const center = this.center.offsetByXY(-144, -83);
		// const ratio = (x_isPositive != advance) ? -1 : Math.sqrt(2);
		// const angle_start = u.normalized_angle(arc_angle + (Math.PI * ratio));
		// const angle_end = u.normalized_angle(arc_angle + (Math.PI * (ratio - .4)));
		const distanceTo_arc_small_center = this.inner_radius + arc_small_radius;
		const center_small = center.offsetBy(Point.fromPolar(distanceTo_arc_small_center, arc_angle));
		return svgPaths.circle(center_small, arc_small_radius);
		// return svgPaths.arc(center_small, arc_small_radius, 1, angle_start, angle_end);
	}

}