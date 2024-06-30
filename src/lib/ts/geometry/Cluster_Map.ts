import { s_clusters_page_indices, s_graphRect, s_ring_angle, s_ancestry_focus, s_cluster_arc_radius } from '../state/Reactive_State';
import { k, s, get, Rect, Point, Angle, IDLine, svgPaths, Ancestry } from '../common/Global_Imports';
import { Predicate, ElementType, Element_State, Widget_MapRect } from '../common/Global_Imports';

// for one cluster (there are three)
//
// assumes ancestries are already paged to fit
//
// computes: angle and vector for fork and thumb,
// svg paths and positions for the arc pieces and thumb,
// and Widget_MapRect for each child

export default class Cluster_Map  {
	focus_ancestry: Ancestry = get(s_ancestry_focus);
	widget_maps: Array<Widget_MapRect> = [];	// maximum a page's worth, will be combined into geometry.widget_maps
	predicates: Array<Predicate> = [];
	ancestries: Array<Ancestry> = [];
	thumb_state: Element_State;
	outside_ring_radius = 0;
	inside_ring_radius = 0;
	clusters_center: Point;
	outside_arc_radius = 0;
	inside_arc_radius = 0;
	predicate: Predicate;
	fork_backoff: number;
	fork_radius: number;
	points_out: boolean;
	origin = Point.zero;
	center = Point.zero;
	fork_angle: number;
	label_tip: Point;
	fork_tip: Point;
	thumb_angle = 0;
	start_angle = 0;
	end_angle = 0;
	shown: number;
	total: number;

	constructor(total: number, ancestries: Array<Ancestry>, predicate: Predicate, points_out: boolean) {
		const shown = ancestries.length;
		const outside_ring_radius = get(s_cluster_arc_radius)
		const center = Point.square(outside_ring_radius);
		const fork_raw_radius = k.ring_thickness * this.fork_radius_multiplier(shown);
		const inside_arc_radius = outside_ring_radius - this.scroll_arc_thickness * 2;
		const fork_backoff = this.fork_adjustment(fork_raw_radius, inside_arc_radius);
		const fork_angle = this.lineAngle_for(predicate, points_out) ?? 0;
		const fork_radius = fork_raw_radius - fork_backoff;
		const semi_minor = inside_arc_radius / 2;
		const semi_major = inside_arc_radius - fork_radius - k.dot_size / 2;
		const ellipse_axes = new Point(semi_minor, semi_major);

		this.thumb_state = s.elementState_for(this.focus_ancestry, ElementType.advance, this.cluster_title);
		this.fork_tip = Point.fromPolar(inside_arc_radius - fork_radius, -fork_angle);
		this.outside_arc_radius = inside_arc_radius + this.scroll_arc_thickness;
		this.label_tip = ellipse_axes.ellipse_coordiates_forAngle(fork_angle);
		this.center = get(s_graphRect).size.dividedInHalf.asPoint;
		this.origin = center.negated.offsetBy(this.center)
		this.outside_ring_radius = outside_ring_radius;
		this.inside_arc_radius = inside_arc_radius;
		this.fork_backoff = fork_backoff;
		this.fork_radius = fork_radius;
		this.clusters_center = center;
		this.fork_angle = fork_angle;
		this.ancestries = ancestries;
		this.points_out = points_out;
		this.predicate = predicate;
		this.shown = shown;
		this.total = total;
		this.setup()
	}

	destructor() { this.ancestries = []; }
	get scroll_arc_thickness(): number { return k.ring_thickness / 3; };
	get thumb_radius(): number { return this.scroll_arc_thickness * 0.9; };
	get fork_center(): Point { return this.center_at(this.inside_arc_radius, -this.fork_angle); }
	get thumb_arc_radius(): number { return this.inside_arc_radius + this.scroll_arc_thickness / 2; };
	get page_index(): number { return get(s_clusters_page_indices).index_for(this.points_out, this.predicate); }
	get thumb_center(): Point { return this.center_at(this.thumb_arc_radius, this.thumb_angle).offsetByXY(15, 15); }
	set_page_index(index: number) { s_clusters_page_indices.set(get(s_clusters_page_indices).setIndex_for(index, this.points_out, this.predicate)); }
	fork_radius_multiplier(shown: number): number { return (shown > 3) ? 0.6 : (shown > 1) ? 0.3 : 0.15; }
	get single_svgPath(): string { return svgPaths.circle(this.fork_center, this.fork_radius - 0.5); };
	get thumb_svgPath(): string { return svgPaths.circle(this.thumb_center, this.thumb_radius); };
	get gap_svgPath() { return svgPaths.circle(this.fork_center, this.fork_radius - 0.5); }
	get fork_svgPaths() { return [this.fork_svgPath(false), this.fork_svgPath(true)]; }

	setup() {
		const shown = this.shown;
		const radius = this.outside_ring_radius;
		const center = this.center.offsetByXY(2, -1.5);	// tweak so that drag dots are centered within the necklace ring
		const radial = new Point(radius + k.necklace_widget_padding, 0);
		this.thumb_state.set_forHovering('black', 'pointer');
		this.widget_maps = [];
		if (shown > 0 && !!this.predicate) {
			let index = 0;
			while (index < shown) {
				const ancestry = this.ancestries[index];
				const childAngle = this.angle_ofChild_for(index, radius);
				const childOrigin = center.offsetBy(radial.rotate_by(childAngle));
				const map = new Widget_MapRect(IDLine.flat, new Rect(), childOrigin, ancestry, this.focus_ancestry, childAngle); //, this.predicate.kind);
				this.widget_maps.push(map);
				index += 1;
			}
		}
		setTimeout(() => {	// delay until page indices are set up
			this.setup_thumb_angle();
		}, 1);
	}

	normalize_andSet_thumb_angle(angle: number) {
		this.thumb_angle = angle;
	}

	setup_thumb_angle() {
		const max = this.total - this.shown;
		const fraction = this.page_index / max;
		const spread = this.end_angle - this.start_angle;
		this.thumb_angle = this.start_angle + (spread * fraction);
	}

	adjust_index_forThumb_angle(angle: number) {
		const max = this.total - this.shown;
		const delta = angle - this.start_angle;
		const spread = this.end_angle - this.start_angle;
		const index = max.normalize(Math.round(max * delta / spread));
		this.set_page_index(index);
		this.setup_thumb_angle();
	}

	advance(isForward: boolean) {
		const sign = isForward ? 1 : -1;
		const showing = this.shown;
		const index = this.page_index.increment_by_assuring(showing * sign, this.total);
		this.set_page_index(index);
	}
	
	static readonly $_ANGLES_$: unique symbol;

	angle_ofChild_for(index: number, radius: number): number {
		const max = this.shown - 1;
		const row = (max / 2) - index;						// row centered around zero
		const radial = new Point(radius, 0);
		const rotated = radial.rotate_by(this.fork_angle);	// points at middle widget
		const startY = rotated.y;							// height of fork_angle
		let y = startY + (row * k.row_height);				// height of row
		let unfit = false;
		if (Math.abs(y) > radius) {
			unfit = true;
			if (y > 0) {
				y = radius - (y % radius);					// swing around bottom
			} else {
				y = (-y % radius) - radius;					// swing around top
			}
		}
		let child_angle = Math.asin(y / radius);			// negate arc sign for clockwise
		if (unfit != rotated.x < 0) {
			child_angle = Angle.half - child_angle			// compensate for arc sin limitations
		}
		child_angle = new Angle(child_angle).normalized_angle;
		if (index == 0) {
			if (startY < 0) {
				this.end_angle = child_angle;
			} else {
				this.start_angle = child_angle;
			}
		} else if (index == max) {
			if (startY > 0) {
				this.end_angle = child_angle;
			} else {
				this.start_angle = child_angle;
			}
		}
		return child_angle;
	}

	lineAngle_for(predicate: Predicate, points_out: boolean): number | null {
		// returns one of three angles: 1) necklace_angle 2) opposite+ 3) opposite-tweak
		const tweak = Math.PI / 4;			// 45 degrees: added or subtracted -> opposite
		const necklace_angle = get(s_ring_angle);
		const opposite = necklace_angle + Angle.half;
		const raw = predicate.isBidirectional ?
			opposite - tweak :
			points_out ? necklace_angle :	// one directional, use global
			opposite + tweak;
		return new Angle(-raw).normalized_angle;
	}

	center_at(radius: number, angle: number): Point {
		return Point.square(this.outside_ring_radius).offsetBy(Point.fromPolar(radius, angle));
	}
	
	static readonly $_SVGS_$: unique symbol;

	get main_svgPaths(): Array<string> {
		const angle_tiltsUp = new Angle(this.fork_angle).angle_tiltsUp;
		const big_inner_svgPath = this.big_svgPath(this.inside_arc_radius, angle_tiltsUp);
		return [big_inner_svgPath];
	}

	get outer_svgPaths(): Array<string> {
		const angle_tiltsUp = new Angle(this.fork_angle).angle_tiltsUp;
		const big_outer_svgPath = this.big_svgPath(this.outside_arc_radius, angle_tiltsUp);
		const end_small_svgPath = this.small_svgPath(this.end_angle, angle_tiltsUp, false);
		const start_small_svgPath = this.small_svgPath(this.start_angle, angle_tiltsUp, true);
		return [start_small_svgPath, big_outer_svgPath, end_small_svgPath];
	}

	get cluster_title(): string {
		let shortened = this.predicate?.kind.unCamelCase().lastWord() ?? k.empty;
		const quantity = `${this.total}`;
		if (!this.predicate?.isBidirectional) {
			shortened = this.points_out ? shortened : 'contained by';
			return `${shortened} ${quantity}`;
		}
		return `${quantity} ${shortened}`;
	}

	big_svgPath(radius: number, angle_tiltsUp: boolean) {
		return svgPaths.arc(this.clusters_center, radius, 1, 
			angle_tiltsUp ? this.end_angle : this.start_angle,
			angle_tiltsUp ? this.start_angle : this.end_angle);
	}

	fork_adjustment(fork_radius: number, inside_arc_radius: number): number {
		const ratio = fork_radius / inside_arc_radius / 2;
		const fork_angle = Math.asin(ratio) * 2;
		const delta = inside_arc_radius * (1 - Math.cos(fork_angle));
		return delta / Math.sqrt(1.5);
	}

	fork_svgPath(forwards: boolean) {
		const fork_radius = this.fork_radius;
		const angle = -this.fork_angle;
		const y = fork_radius * (forwards ? -1 : 1);
		const x = this.inside_arc_radius - fork_radius - this.fork_backoff;
		const origin = new Point(x, y).rotate_by(angle);
		return svgPaths.arc(origin.offsetBy(this.clusters_center), fork_radius, 1,
			angle + (forwards ? Angle.quarter : 0),
			angle - (forwards ? 0 : Angle.quarter));
	}

	small_svgPath(arc_angle: number, tiltsUp: boolean, advance: boolean) {
		const center = Point.square(this.outside_ring_radius);
		const arc_small_radius = k.ring_thickness / 6;
		const clockwise = tiltsUp == advance;
		const ratio = clockwise ? -1 : 1;
		const angle_start = new Angle(arc_angle + (Math.PI * ratio)).normalized_angle;
		const angle_end = new Angle(arc_angle + (Math.PI * (ratio - 1))).normalized_angle;
		const distanceTo_arc_small_center = this.inside_arc_radius + arc_small_radius;
		const center_small = center.offsetBy(Point.fromPolar(distanceTo_arc_small_center, arc_angle));
		return svgPaths.arc(center_small, arc_small_radius, clockwise ? 0 : 1, angle_start, angle_end);
	}

}