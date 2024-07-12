import { Predicate, ElementType, Element_State, transparentize, Widget_MapRect } from '../common/Global_Imports';
import { k, s, get, Rect, Point, Angle, IDLine, svgPaths, Ancestry, Quadrant } from '../common/Global_Imports';
import { s_graphRect, s_ring_angle, s_ancestry_focus, s_cluster_arc_radius } from '../state/Reactive_State';

// for one cluster (there are three)
//
// assumes ancestries are already paged to fit
//
// computes:
//	svg paths & positions for arc pieces & thumb
//	angle & vector for fork & thumb
//	widget map rect for each child
//	position of label

export default class Cluster_Map  {
	focus_ancestry: Ancestry = get(s_ancestry_focus);
	widget_maps: Array<Widget_MapRect> = [];	// maximum a page's worth, will be combined into geometry.widget_maps
	thumb_element_state!: Element_State;
	predicates: Array<Predicate> = [];
	ancestries: Array<Ancestry> = [];
	fork_angle_pointsRight = false;
	thumb_center = Point.zero;
	cluster_title = k.empty;
	color = k.color_default;
	clusters_center!: Point;
	outside_ring_radius = 0;
	inside_ring_radius = 0;
	outside_arc_radius = 0;
	inside_arc_radius = 0;
	predicate: Predicate;
	points_out: boolean;
	origin = Point.zero;
	center = Point.zero;
	label_tip!: Point;
	fork_tip!: Point;
	isPaging = false;
	fork_backoff = 0;
	fork_radius = 0;
	thumb_angle = 0;
	start_angle = 0;
	fork_angle = 0;
	end_angle = 0;
	shown = 0;
	total = 0;

	constructor(total: number, ancestries: Array<Ancestry>, predicate: Predicate, points_out: boolean) {
		this.ancestries = ancestries;
		this.points_out = points_out;
		this.predicate = predicate;
		this.total = total;
		this.setup();
		s_cluster_arc_radius.subscribe((radius: number) => {
			if (this.outside_ring_radius != radius) {
				this.setup();
				this.set_page_index(0);		// reset page state
			}
		})
	}

	setup() {
		this.shown = this.ancestries.length;
		this.isPaging = this.shown != this.total;
		this.outside_ring_radius = get(s_cluster_arc_radius);
		this.clusters_center = Point.square(this.outside_ring_radius);
		this.inside_arc_radius = this.outside_ring_radius - k.scroll_arc_thickness * 2;
		this.color = transparentize(this.focus_ancestry.thing?.color ?? this.color, 0.8);
		const fork_raw_radius = k.ring_thickness * this.fork_radius_multiplier(this.shown);
		this.fork_backoff = this.fork_adjustment(fork_raw_radius, this.inside_arc_radius);
		this.fork_radius = fork_raw_radius - this.fork_backoff;
		const semi_minor = this.inside_arc_radius / 2;
		const semi_major = this.inside_arc_radius - this.fork_radius - k.dot_size / 2;
		const ellipse_axes = new Point(semi_minor, semi_major);
		this.center = get(s_graphRect).size.dividedInHalf.asPoint;
		this.fork_angle = this.forkAngle_for(this.predicate, this.points_out) ?? 0;
		this.thumb_element_state = s.elementState_for(this.focus_ancestry, ElementType.advance, this.cluster_title);
		this.fork_tip = Point.fromPolar(this.inside_arc_radius - this.fork_radius, -this.fork_angle);
		this.label_tip = ellipse_axes.ellipse_coordiates_forAngle(this.fork_angle);
		this.fork_angle_pointsRight = new Angle(this.fork_angle).angle_pointsRight;
		this.outside_arc_radius = this.inside_arc_radius + k.scroll_arc_thickness;
		this.origin = this.clusters_center.negated.offsetBy(this.center)
		this.thumb_element_state.set_forHovering(this.color, 'pointer');
		this.widget_maps = [];
		if (this.shown > 0 && !!this.predicate) {
			const radius = this.outside_ring_radius;
			const rotated = new Point(radius + k.necklace_widget_padding, 0);
			const tweak = this.center.offsetByXY(2, -1.5);	// tweak so that drag dots are centered within the necklace ring
			const max = this.shown - 1;
			let index = 0;
			while (index < this.shown) {
				const child_index = this.fork_angle_pointsRight ? index : max - index;
				const ancestry = this.ancestries[child_index];
				const childAngle = this.angle_at_index(index, radius);
				const childOrigin = tweak.offsetBy(rotated.rotate_by(childAngle));
				const map = new Widget_MapRect(IDLine.flat, new Rect(), childOrigin, ancestry, this.focus_ancestry, childAngle); //, this.predicate.kind);
				this.widget_maps.push(map);
				index += 1;
			}
		}
		this.update_thumb_angle_andCenter();
		this.setup_cluster_title_forIndex();
	}

	destructor() { this.ancestries = []; }
	get thumb_radius(): number { return k.scroll_arc_thickness * 0.8; }
	get maximum_page_index(): number { return this.total - this.shown; }
	get titles(): string { return this.ancestries.map(a => a.title).join(', '); }
	get description(): string { return `${this.predicate.kind}  ${this.titles}`; }
	get fork_center(): Point { return this.center_at(this.inside_arc_radius, -this.fork_angle); }
	get spread_angle(): number { return (this.end_angle - this.start_angle).normalized_angle(); }
	get thumb_arc_radius(): number { return this.inside_arc_radius + k.scroll_arc_thickness / 2; }
	get page_index(): number { return this.focus_ancestry.thing?.page_states?.index_for(this.points_out, this.predicate) ?? 0; }
	get single_svgPath(): string { return svgPaths.circle(this.fork_center, this.fork_radius - 0.5); }
	get gap_svgPath(): string { return svgPaths.circle(this.fork_center, this.fork_radius - 0.5); }
	get fork_svgPaths(): string[] { return [this.fork_svgPath(false), this.fork_svgPath(true)]; }
	get thumb_svgPath(): string { return svgPaths.circle(this.thumb_center, this.thumb_radius); }

	center_at(radius: number, angle: number): Point { return Point.square(this.outside_ring_radius).offsetBy(Point.fromPolar(radius, angle)); }
	fork_radius_multiplier(shown: number): number { return (shown > 3) ? 0.6 : (shown > 1) ? 0.3 : 0.15; }

	set_page_index(index: number) {
		this.focus_ancestry.thing?.page_states.set_page_index_for(index, this);
		this.setup_cluster_title_forIndex();
		this.update_thumb_angle_andCenter();
	}
	
	adjust_indexFor_mouse_angle(mouse_angle: number) {
		const pointsRight = this.fork_angle_pointsRight;
		const movement_angle = (pointsRight ? this.start_angle : this.end_angle) - mouse_angle;
		const fraction = movement_angle / this.spread_angle;
		const index = fraction.bump_towards(0, 1, 0.01) * this.maximum_page_index;
		// console.log(`${index.toFixed(1)}  ${pointsRight ? 'backward' : 'normal'}  ${Math.round(fraction * 100)}%  ${movement_angle.degrees_of()}°`);
		this.set_page_index(index);
	}

	advance(isForward: boolean) {
		const sign = isForward ? 1 : -1;
		const showing = this.shown;
		const index = this.page_index.increment_by_assuring(showing * sign, this.total);
		this.set_page_index(index);
	}

	setup_cluster_title_forIndex() {
		let separator = k.space;
		let quantity = `${this.total}`;
		const index = Math.round(this.page_index);
		let shortened = this.predicate?.kind.unCamelCase().lastWord() ?? k.empty;
		if (this.isPaging) {
			separator = '<br>';
			quantity = `${index + 1} - ${index + this.shown} (of ${quantity})`;
		}
		if (!this.predicate?.isBidirectional) {
			shortened = this.points_out ? shortened : 'contained by';
			this.cluster_title = `${shortened}${separator}${quantity}`;
		} else {
			this.cluster_title = `${quantity}${separator}${shortened}`;
		}
	}
	
	static readonly $_ANGLES_$: unique symbol;

	update_thumb_angle_andCenter() {
		this.thumb_angle = this.updated_thumb_angle;
		this.thumb_center = this.center_at(this.thumb_arc_radius, this.thumb_angle).offsetByXY(15, 15);
	}

	get updated_thumb_angle(): number {
		let angle = (this.start_angle + this.end_angle) / 2;
		if (this.maximum_page_index != 0) {
			const fraction = this.page_index / this.maximum_page_index;
			if (fraction > 1) {
				angle = this.end_angle;
			} else {
				const adjusted = this.spread_angle * fraction;
				const fork_angle_pointsDown = new Angle(this.fork_angle).angle_pointsDown;
				if (this.fork_angle_pointsRight == fork_angle_pointsDown) {
					angle = (this.start_angle + adjusted).normalized_angle();
					// console.log(`${this.page_index}  ${adjusted.degrees_of()}°  ${angle.degrees_of()}°  ${this.description}`);
				} else {
					angle = (this.end_angle - adjusted).normalized_angle();
				}
			}
		}
		return angle;
	}

	detect_grab_start_end(index: number, fork_y: number, max: number, child_angle: number) {
		// detect and grab start and end
		if (index == 0) {
			if (fork_y > 0) {
				this.start_angle = child_angle;
			} else {
				this.end_angle = child_angle;
			}
		} else if (index == max) {
			if (fork_y < 0) {
				this.start_angle = child_angle;
			} else {
				this.end_angle = child_angle;
			}
		}
	}

	forkAngle_for(predicate: Predicate, points_out: boolean): number | null {
		// returns one of three angles: 1) necklace_angle 2) opposite+ 3) opposite-tweak
		const tweak = Math.PI / 10 * 3;			// 54 degrees: added or subtracted -> opposite
		const necklace_angle = get(s_ring_angle);
		const opposite = necklace_angle + Angle.half;
		const raw = predicate.isBidirectional ?
			opposite - tweak :
			points_out ? necklace_angle :	// one directional, use global
			opposite + tweak;
		return (-raw).normalized_angle();
	}

	angle_at_index(index: number, radius: number): number {

		// index:
		//	increases clockwise
		//	maximum is shown - 1
		//	constant vertical distribution
		// angle:
		//	avoids zenith and nadir
		//	increases counter-clockwise
		//	equally distributed around fork-angle

		const max = this.shown - 1;
		const row = (max / 2) - index;						// row centered around zero
		const radial = new Point(radius, 0);
		const rotated = radial.rotate_by(this.fork_angle);	// points at middle widget
		const fork_y = rotated.y;							// height of fork_angle, relative to center of clusters
		let y = fork_y + (row * k.row_height);				// distribute y around fork_y
		let y_isOutside = false;
		const absY = Math.abs(y);
		if (absY > radius) {
			y_isOutside = true;								// y is outside necklace
			y = -(y % radius) + radius * y / absY;			// swing around bottom / top --> back inside necklace
		}
		let child_angle = Math.asin(y / radius);			// arc-sin only defined (-90 to 90)
		if (y_isOutside == (rotated.x > 0)) {				// counter-clockwise for (x > 0) and (-radius < y < radius)
			child_angle = Angle.half - child_angle			// otherwise it's clockwise, so invert it
		}
		child_angle = child_angle.normalized_angle();
		this.detect_grab_start_end(index, fork_y, max, child_angle);
		return child_angle;									// angle at index
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
		const small_arc_radius = k.ring_thickness / 6;
		const clockwise = tiltsUp == advance;
		const ratio = clockwise ? -1 : 1;
		const distanceTo_small_arc_center = this.inside_arc_radius + small_arc_radius;
		const small_arc_angle_start = (arc_angle + (Math.PI * ratio)).normalized_angle();
		const small_arc_angle_end = (arc_angle + (Math.PI * (ratio - 1))).normalized_angle();
		const small_arc_center = center.offsetBy(Point.fromPolar(distanceTo_small_arc_center, arc_angle));
		return svgPaths.arc(small_arc_center, small_arc_radius, clockwise ? 0 : 1, small_arc_angle_start, small_arc_angle_end);
	}

}