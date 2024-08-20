import { k, u, ux, get, Rect, Point, Angle, IDLine, Arc_Map, Quadrant, Ancestry, Predicate } from '../common/Global_Imports';
import { s_graphRect, s_rotation_ring_angle, s_ancestry_focus, s_rotation_ring_radius } from '../state/Reactive_State';
import { Orientation, ElementType, Paging_State, Widget_MapRect, Rotation_State } from '../common/Global_Imports';

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
	widget_maps: Array<Widget_MapRect> = [];	// one page of widgets, will be combined into geometry.widget_maps
	ancestries: Array<Ancestry> = [];
	arc_straddles_nadir = false;
	arc_straddles_zero = false;
	paging_map = new Arc_Map();
	thumb_map = new Arc_Map();
	arc_in_lower_half = false;
	label_origin = Point.zero;
	cluster_title = k.empty;
	color = k.color_default;
	predicate: Predicate;
	points_out: boolean;
	center = Point.zero;
	isPaging = false;
	fork_angle = 0;
	shown = 0;
	total = 0;

	destructor() { this.ancestries = []; }
	constructor(total: number, ancestries: Array<Ancestry>, predicate: Predicate, points_out: boolean) {
		this.ancestries = ancestries;
		this.points_out = points_out;
		this.predicate = predicate;
		this.total = total;
		this.update_all();
		s_rotation_ring_radius.subscribe((radius: number) => {
			if (this.paging_map.outside_ring_radius != radius) {
				this.update_all();		// do not set_paging_index (else expand will hang)
			}
		})
	}

	update_all() {
		this.shown = this.ancestries.length;
		this.isPaging = this.shown < this.total;
		this.color = u.opacitize(this.focus_ancestry.thing?.color ?? this.color, 0.2);
		this.update_fork_angle();
		this.update_children_angles();
		this.update_label();
	}

	get paging_radius(): number { return k.paging_arc_thickness * 0.8; }
	get maximum_paging_index(): number { return this.total - this.shown; }
	get titles(): string { return this.ancestries.map(a => a.title).join(', '); }
	get description(): string { return `${this.predicate.kind}  ${this.titles}`; }
	get paging_index_ofFocus(): number { return this.paging_state_ofFocus?.index ?? 0; }
	get paging_rotation_state(): Rotation_State { return ux.rotationState_forName(this.name); }
	get fork_radial(): Point { return Point.fromPolar(get(s_rotation_ring_radius), this.fork_angle); }
	get name(): string { return `${ElementType.arc}-${this.predicate.kind}-${this.points_out ? 'out' : 'in'}-${this.focus_ancestry.title}`; }
	get paging_state_ofFocus(): Paging_State | null { return this.focus_ancestry.thing?.page_states?.paging_state_for(this) ?? null; }
	
	static readonly $_LABEL_$: unique symbol;

	update_label() {
		this.update_label_origin();
		this.update_label_forIndex();
		this.update_thumb_angles();
	}

	update_label_origin() {
		// depending on the fork angle,
		// place label either centered in hemisphere
		// or at both sides
		const label_angle = -this.fork_angle;
		const radius = get(s_rotation_ring_radius) - (k.ring_thickness * 2);
		const label_tip = this.ellipse_coordiates_forAngle(label_angle, radius * 0.6, radius * 0.95);
		const orientation = label_tip.orientation_ofVector;
		const size = label_tip.abs.asSize;
		const center = get(s_graphRect).size.dividedInHalf.asPoint;
		const rect = new Rect(center.offsetBy(label_tip), size.dividedInHalf);
		const lines = this.cluster_title.split('<br>');
		const m = this.multiplier(orientation);
		const y = k.dot_size * m.y;
		const x = u.getWidthOf(lines[0]) * m.x;
		this.label_origin = rect.center.offsetByXY(x, y);
	}

	ellipse_coordiates_forAngle(angle: number, x: number, y: number): Point {
		// x is distance from center to ellipse along the positive x-axis
		// y				"    "				along the positive y-axis
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		return new Point(
			Math.abs(x) * cos,
			Math.abs(y) * sin);
	}

	multiplier(orientation: Orientation): Point {
		const common = -0.5;
		switch (orientation) {
			case Orientation.up:	return new Point(common, -3.5);
			case Orientation.left:	return new Point(-0.75, common);
			case Orientation.down:	return new Point(common, -3.5);
			default:				return new Point(-0.25, common);
		}
	}

	update_label_forIndex() {
		let quantity = `${this.total}`;
		const index = Math.round(this.paging_index_ofFocus);
		let shortened = this.predicate?.kind.unCamelCase().lastWord() ?? k.empty;
		if (this.isPaging) {
			quantity = `${index + 1}-${index + this.shown} of ${quantity}`;
		}
		if (!this.predicate?.isBidirectional) {
			shortened = this.points_out ? shortened : 'contained by';
			this.cluster_title = `${shortened}<br>${quantity}`;
		} else {
			this.cluster_title = `${quantity}<br>${shortened}`;
		}
	}
	
	static readonly $_INDEX_$: unique symbol;
	
	adjust_paging_index_forMouse_angle(mouse_angle: number) {
		const fraction = this.compute_paging_fraction(mouse_angle);
		const index = fraction * this.maximum_paging_index;
		const adjust = this.paging_state_ofFocus?.set_paging_index_for(index, this) ?? false;
		if (adjust) {
			this.update_label_forIndex();
			this.update_thumb_angles();
		}
		return adjust;
	}
	
	compute_paging_fraction(mouse_angle: number): number {
		let angle = mouse_angle.normalized_angle();
		let end = this.paging_map.end_angle.normalized_angle();
		let start = this.paging_map.start_angle.normalized_angle();
		const quadrant = u.quadrant_ofAngle(end);
		if (quadrant != Quadrant.upperRight) {
			let delta = u.basis_angle_ofQuadrant(quadrant) + Angle.quarter;

			// prevent peculiar thumb-flip-to-end when mouse.y > 0
			// HOW? angles increase counter-clockwise
			// however, if end angle is not in upper right
			// normalized angles do not order correctly
			// rotate all angles so end is in upper right

			angle = angle.add_angle_normalized(-delta);
			start = start.add_angle_normalized(-delta);
			end = end.add_angle_normalized(-delta);
		}
		if (start < angle) {
			return 0;
		} else if (end > angle) {
			return 1;
		} else {
			const moved_angle = (start - angle).normalized_angle();
			const spread_angle = (-this.paging_map.spread_angle).normalized_angle();
			return (moved_angle.normalized_angle() / spread_angle).force_between(0, 1);
		}
	}

	static readonly $_ANGLES_$: unique symbol;

	update_arc_angles(index: number, max: number, child_angle: number) {
		// index increases & angle decreases clockwise
		if (index == max) {
			this.paging_map.start_angle = child_angle;
		} else if (index == 0) {
			this.paging_map.end_angle = child_angle;
		}
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
			this.paging_map.finalize_angles();
			this.arc_straddles_zero = (this.paging_map.start_angle > 0 && this.paging_map.end_angle < 0);

		}
	}

	angle_at_index(index: number): number {

		// index:
		//	increases clockwise
		//	constant vertical distribution
		//	maximum is 1 subtracted from shown
		// angle:
		//	avoids zenith and nadir
		//	increases counter-clockwise
		//	widgets distributed half-and-half around fork-angle

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

	update_thumb_angles() {

		// very complex, because:
		// 1. start & end are sometimes reversed (hasNegative_spread)
		// 2. arc can straddle nadir when fork y is outside of ring

		const spread_angle = this.paging_map.spread_angle;
		const hasNegative_spread = spread_angle < 0
		const inverter = hasNegative_spread ? 1 : -1;
		const otherInverter = (hasNegative_spread == this.arc_straddles_nadir) ? -1 : 1;
		const arc_spread = this.arc_straddles_nadir ? (-spread_angle).normalized_angle() : spread_angle;
		const arc_start = this.paging_map.start_angle * otherInverter;
		const increment = arc_spread / this.total * inverter;
		const start = arc_start + (increment * this.paging_index_ofFocus);
		const end = start + (increment * this.shown);
		this.thumb_map.update((start + end) / 2);
		this.thumb_map.start_angle = start;
		this.thumb_map.end_angle = end;
	}
	
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

	update_fork_angle() {
		const fork_angle = this.fork_angleFor(this.predicate, this.points_out) ?? 0;
		this.center = get(s_graphRect).size.dividedInHalf.asPoint;
		this.fork_angle = fork_angle;
		this.paging_map.update(fork_angle);
	}

}
