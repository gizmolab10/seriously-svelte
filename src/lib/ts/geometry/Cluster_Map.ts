import { s_graphRect, s_rotation_ring_angle, s_ancestry_focus, s_rotation_ring_radius } from '../state/Reactive_State';
import { k, u, get, Rect, Point, Angle, IDLine, SVG_Arc, Quadrant } from '../common/Global_Imports';
import { Ancestry, Predicate, transparentize, Widget_MapRect } from '../common/Global_Imports';

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
	arc_straddles_nadir = false;
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
	fork_angle = 0;
	shown = 0;
	total = 0;

	constructor(total: number, ancestries: Array<Ancestry>, predicate: Predicate, points_out: boolean) {
		this.ancestries = ancestries;
		this.points_out = points_out;
		this.predicate = predicate;
		this.total = total;
		this.update_all();
		s_rotation_ring_radius.subscribe((radius: number) => {
			if (this.svg_arc.outside_ring_radius != radius) {
				this.update_all();		// do not set_page_index (else expand will hang)
			}
		})
	}

	update_all() {
		this.shown = this.ancestries.length;
		this.isPaging = this.shown != this.total;
		this.color = transparentize(this.focus_ancestry.thing?.color ?? this.color, 0.8);
		this.update_arc();
		this.update_children_angles();
		this.update_forLabels();
	}

	update_forLabels() {
		const semi_major = this.svg_arc.inside_arc_radius - this.svg_arc.fork_radius - k.dot_size / 2;
		const semi_minor = this.svg_arc.inside_arc_radius / 2;
		const ellipse_axes = new Point(semi_minor, semi_major);
		this.label_tip = ellipse_axes.ellipse_coordiates_forAngle(-this.fork_angle);
		this.update_thumb_andTitle();
	}

	destructor() { this.ancestries = []; }
	get paging_radius(): number { return k.paging_arc_thickness * 0.8; }
	get maximum_page_index(): number { return this.total - this.shown; }
	get titles(): string { return this.ancestries.map(a => a.title).join(', '); }
	get description(): string { return `${this.predicate.kind}  ${this.titles}`; }
	get fork_radial(): Point { return Point.fromPolar(get(s_rotation_ring_radius), this.fork_angle); }
	get page_indexOf_focus(): number { return this.focus_ancestry.thing?.page_states?.index_for(this.points_out, this.predicate) ?? 0; }
	
	static readonly $_INDEX_$: unique symbol;

	set_page_index(index: number) {
		this.focus_ancestry.thing?.page_states.set_page_index_for(index, this);
		this.update_thumb_andTitle();
	}

	advance(isForward: boolean) {
		const sign = isForward ? 1 : -1;
		const showing = this.shown;
		const index = this.page_indexOf_focus.increment_by_assuring(showing * sign, this.total);
		this.set_page_index(index);
	}
	
	adjust_pagingIndex_forMouse_angle(mouse_angle: number) {
		const quadrant_ofFork_angle = u.quadrant_ofAngle(this.fork_angle);
		let movement_angle = mouse_angle - this.svg_arc.start_angle;
		let spread_angle = this.svg_arc.spread_angle;
		if (this.straddles_zero) {
			if (quadrant_ofFork_angle == Quadrant.upperRight) {
				spread_angle = (-spread_angle).normalized_angle();
				movement_angle = movement_angle.normalized_angle();
			} else {
				movement_angle = mouse_angle - this.svg_arc.end_angle;
			}
		} else {
			switch (quadrant_ofFork_angle) {
				case Quadrant.lowerRight:
				case Quadrant.upperLeft: movement_angle = mouse_angle - this.svg_arc.end_angle; break;
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
			const near = 1 / (this.total * 2);			// within half an increment
			return fraction.bump_towards(0, 1, near);	// if near 0 make it 0, same with 1
		}
	}
	
	static readonly $_TITLE_$: unique symbol;

	update_thumb_andTitle() {
		this.update_cluster_title_forIndex();
		this.update_thumb_angles();
	}

	update_cluster_title_forIndex() {
		let separator = k.space;
		let quantity = `${this.total}`;
		const index = Math.round(this.page_indexOf_focus);
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

	fork_angleFor(predicate: Predicate, points_out: boolean): number | null {
		// returns one of three angles: 1) rotation_angle 2) opposite+tweak 3) opposite-tweak
		const tweak = Math.PI * 5 / 18;			// 50 degrees: added or subtracted -> opposite
		const rotation_angle = get(s_rotation_ring_angle);
		const opposite = rotation_angle + Angle.half;
		const raw = predicate.isBidirectional ?
			opposite - tweak :
			points_out ? rotation_angle :		// one directional, use global
			opposite + tweak;
		return raw.normalized_angle();
	}

	update_arc() {
		const fork_angle = this.fork_angleFor(this.predicate, this.points_out) ?? 0;
		this.center = get(s_graphRect).size.dividedInHalf.asPoint;
		this.fork_angle = fork_angle;
		this.svg_arc.update(fork_angle);
		this.straddles_zero = this.svg_arc.start_angle.straddles_zero(this.svg_arc.end_angle);
	}

	update_children_angles() {
		this.widget_maps = [];
		if (this.shown > 0 && !!this.predicate) {
			const radius = get(s_rotation_ring_radius);
			const radial = new Point(radius + k.rotation_ring_widget_padding, 0);
			const fork_pointsRight = new Angle(this.fork_angle).angle_pointsRight;
			const tweak = this.center.offsetByXY(2, -1.5);	// tweak so that drag dots are centered within the rotation ring
			const max = this.shown - 1;
			let index = 0;
			while (index < this.shown) {
				const child_index = !fork_pointsRight ? index : max - index;
				const ancestry = this.ancestries[child_index];
				const childAngle = this.angle_at_index(index);
				const childOrigin = tweak.offsetBy(radial.rotate_by(childAngle));
				const map = new Widget_MapRect(IDLine.flat, new Rect(), childOrigin, ancestry, this.focus_ancestry, childAngle); //, this.predicate.kind);
				this.widget_maps.push(map);
				index += 1;
			}
			this.svg_arc.put_angles_inOrder();
		}
	}

	angle_at_index(index: number): number {

		// index:
		//	increases clockwise
		//	maximum is shown - 1
		//	constant vertical distribution
		// angle:
		//	avoids zenith and nadir
		//	increases counter-clockwise
		//	widgets half-and-half around fork-angle

		const max = this.shown - 1;
		const row = (max / 2) - index;						// row centered around zero
		const radius = get(s_rotation_ring_radius);
		const radial = this.fork_radial;					// points at middle widget
		const fork_y = radial.y;							// height of fork_angle, relative to center of clusters
		let y = fork_y + (row * k.row_height);				// distribute y equally around fork_y
		let y_isOutside = false;
		const absY = Math.abs(y);
		if (absY > radius) {
			y_isOutside = true;								// y is outside rotation ring
			y = radius * (y / absY) - (y % radius);			// swing around (bottom | top) --> back inside rotation
			if (y > 0) {
				this.arc_straddles_nadir = true;
			}
		}
		let child_angle = -Math.asin(y / radius);			// arc-sin only defined (-90 to 90) [ALSO: negate angles so things advance clockwise]
		if (y_isOutside == (radial.x > 0)) {				// counter-clockwise if (positive x AND y is outside) OR (negative x AND y is inside)
			child_angle = Angle.half - child_angle			// otherwise it's clockwise, so invert it
		}
		this.update_arc_angles(index, max, child_angle);
		return child_angle									// angle at index
	}

	update_arc_angles(index: number, max: number, child_angle: number) {
		// index increases & angle decreases clockwise
		if (index == max) {
			this.svg_arc.start_angle = child_angle;
		} else if (index == 0) {
			this.svg_arc.end_angle = child_angle;
		}
	}

	update_thumb_angles() {

		// very complex, because:
		// 1. start & end are sometimes reversed (hasNegative_spread)
		// 2. arc straddles nadir when fork y is outside of ring (arc_straddles_nadir)

		const spread_angle = this.svg_arc.spread_angle;
		const hasNegative_spread = spread_angle < 0
		const inverter = hasNegative_spread ? 1 : -1;
		const arc_spread = this.arc_straddles_nadir ? (-spread_angle).normalized_angle() : spread_angle;
		const otherInverter = (hasNegative_spread == this.arc_straddles_nadir) ? -1 : 1;
		const arc_start = this.svg_arc.start_angle * otherInverter;
		const increment = arc_spread / this.total * inverter;
		const index = Math.round(this.page_indexOf_focus);
		let start = arc_start + increment * index;
		const spread = increment * this.shown;
		let end = start + spread;
		const thumb_angle = (start + end) / 2;
		this.svg_thumb.update(thumb_angle);
		this.svg_thumb.start_angle = start;
		this.svg_thumb.end_angle = end;
	}

}
