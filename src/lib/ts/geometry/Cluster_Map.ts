import { k, s, get, Rect, Point, Angle, IDLine, svgPaths, Ancestry, Quadrant, SVG_Arc } from '../common/Global_Imports';
import { Predicate, ElementType, Element_State, transparentize, Widget_MapRect } from '../common/Global_Imports';
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
	ancestries: Array<Ancestry> = [];
	fork_angle_leansForward = false;
	fork_angle_pointsRight = false;
	thumb_center = Point.zero;
	svg_thumb = new SVG_Arc();
	svg_arc = new SVG_Arc();
	cluster_title = k.empty;
	color = k.color_default;
	straddles_zero = false;
	label_tip = Point.zero;
	predicate: Predicate;
	points_out: boolean;
	center = Point.zero;
	isPaging = false;
	thumb_angle = 0;
	fork_angle = 0;
	shown = 0;
	total = 0;

	constructor(total: number, ancestries: Array<Ancestry>, predicate: Predicate, points_out: boolean) {
		this.ancestries = ancestries;
		this.points_out = points_out;
		this.predicate = predicate;
		this.total = total;
		this.setup();
		s_cluster_arc_radius.subscribe((radius: number) => {
			if (this.svg_arc.outside_ring_radius != radius) {
				this.setup();
				this.set_page_index(0);		// reset page state
			}
		})
	}

	setup() {
		this.shown = this.ancestries.length;
		this.isPaging = this.shown != this.total;
		this.color = transparentize(this.focus_ancestry.thing?.color ?? this.color, 0.8);
		this.center = get(s_graphRect).size.dividedInHalf.asPoint;
		this.fork_angle = this.forkAngle_for(this.predicate, this.points_out) ?? 0;
		this.fork_angle_leansForward = new Angle(this.fork_angle).angle_leansForward;
		this.fork_angle_pointsRight = new Angle(this.fork_angle).angle_pointsRight;
		this.widget_maps = [];
		if (this.shown > 0 && !!this.predicate) {
			const radius = this.svg_arc.outside_ring_radius;
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
		this.svg_arc.setup(this.fork_angle, this.shown);
		const semi_major = this.svg_arc.inside_arc_radius - this.svg_arc.fork_radius - k.dot_size / 2;
		const semi_minor = this.svg_arc.inside_arc_radius / 2;
		const ellipse_axes = new Point(semi_minor, semi_major);
		this.label_tip = ellipse_axes.ellipse_coordiates_forAngle(this.fork_angle);
		this.straddles_zero = this.svg_arc.start_angle.straddles_zero(this.svg_arc.end_angle);
		this.setup_cluster_title_forIndex();
	}

	destructor() { this.ancestries = []; }
	get thumb_radius(): number { return k.scroll_arc_thickness * 0.8; }
	get maximum_page_index(): number { return this.total - this.shown; }
	get titles(): string { return this.ancestries.map(a => a.title).join(', '); }
	get description(): string { return `${this.predicate.kind}  ${this.titles}`; }
	get thumb_arc_radius(): number { return this.svg_arc.inside_arc_radius + k.scroll_arc_thickness / 2; }
	get page_index(): number { return this.focus_ancestry.thing?.page_states?.index_for(this.points_out, this.predicate) ?? 0; }

	fork_radius_multiplier(shown: number): number { return (shown > 3) ? 0.6 : (shown > 1) ? 0.3 : 0.15; }

	set_page_index(index: number) {
		this.focus_ancestry.thing?.page_states.set_page_index_for(index, this);
		this.setup_cluster_title_forIndex();
		this.update_thumb_angle_andCenter();
		this.update_thumb_start_andEnd();
	}
	
	adjust_indexFor_mouse_angle(mouse_angle: number) {
		const fork_Angle = new Angle(this.fork_angle);
		const quadrant = fork_Angle.quadrant_ofAngle;
		let movement_angle = this.svg_arc.start_angle - mouse_angle;
		let spread_angle = this.svg_arc.spread_angle;
		if (this.straddles_zero) {
			if (quadrant == Quadrant.upperRight) {
				movement_angle = movement_angle.normalized_angle();
				spread_angle = (-spread_angle).normalized_angle();
			} else {
				movement_angle = mouse_angle - this.svg_arc.end_angle;
			}
		} else {
			switch (quadrant) {
				case Quadrant.lowerRight:
				case Quadrant.upperLeft: movement_angle = this.svg_arc.end_angle - mouse_angle; break;
				case Quadrant.upperRight: movement_angle = -movement_angle; break;
				case Quadrant.lowerLeft: spread_angle = -spread_angle; break;
			}
		}
		const fraction = this.adjust_fraction(movement_angle / spread_angle);
		const index = fraction * this.maximum_page_index;
		this.set_page_index(index);
	}

	adjust_fraction(fraction: number): number {
		if (this.straddles_zero && fraction > 3) {
			return 0;
		} else if (fraction >= 1) {
			return 1;
		} else if (fraction <= 0) {
			if (fraction < -3) {
				return 1;
			}
			return 0;
		} else {
			const near = 1 / (this.total * 2);				// within half an increment
			return fraction.bump_towards(0, 1, near);	// if near 0 make it 0, same with 1
		}
	}

	get updated_thumb_angle(): number {
		const fork_Angle = new Angle(this.fork_angle);
		const quadrant = fork_Angle.quadrant_ofAngle;
		let angle = (this.svg_arc.start_angle + this.svg_arc.end_angle) / 2;
		if (this.maximum_page_index > 0) {
			const fraction = this.page_index / this.maximum_page_index;
			if (fraction > 1) {
				angle = this.svg_arc.end_angle;
			} else {
				if (this.straddles_zero) {
					let spread_angle = (this.svg_arc.start_angle - this.svg_arc.end_angle).normalized_angle();
					angle = angle = this.svg_arc.start_angle - (spread_angle * fraction);
				} else {
					let adjusted = this.svg_arc.spread_angle * fraction;
					angle = this.svg_arc.start_angle + adjusted;
					switch (quadrant) {
						case Quadrant.upperLeft:
						case Quadrant.lowerRight: angle = this.svg_arc.end_angle - adjusted; break;
					}
				}
				angle = angle.normalized_angle();
			}
		}
		return angle;
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
		const clusters_center = Point.square(get(s_cluster_arc_radius));
		const thumb_radial = Point.fromPolar(this.thumb_arc_radius, this.thumb_angle);
		this.thumb_center = clusters_center.offsetBy(thumb_radial).offsetEquallyBy(15);
		this.svg_thumb.setup(this.thumb_angle, 1);
	}
	
	update_thumb_start_andEnd() {
		const index = Math.floor(this.page_index);
		const arc_start = Math.min(this.svg_arc.start_angle, this.svg_arc.end_angle);
		const increment = Math.abs(this.svg_arc.spread_angle) / this.shown;
		const start = arc_start + increment * index;
		const end = start + increment;
		this.svg_thumb.end_angle = end;
		this.svg_thumb.start_angle = start;
	}

	detect_grab_start_end(index: number, fork_y: number, max: number, child_angle: number) {
		// detect and grab start and end
		if (index == 0) {
			if (fork_y > 0) {
				this.svg_arc.start_angle = child_angle;
			} else {
				this.svg_arc.end_angle = child_angle;
			}
		} else if (index == max) {
			if (fork_y < 0) {
				this.svg_arc.start_angle = child_angle;
			} else {
				this.svg_arc.end_angle = child_angle;
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

}
