import { g, k, u, ux, get, Rect, Point, Angle, debug, IDLine, Arc_Map, Quadrant } from '../common/Global_Imports';
import { Ancestry, Predicate, Paging_State, Widget_MapRect, Rotation_State } from '../common/Global_Imports';
import { s_graphRect, s_paging_state, s_focus_ancestry } from '../state/Reactive_State';
import { s_rotation_ring_angle, s_ring_rotation_radius } from '../state/Reactive_State';

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
	focus_ancestry: Ancestry = get(s_focus_ancestry);
	widget_maps: Array<Widget_MapRect> = [];	// one page of widgets, will be combined into geometry.widget_maps
	ancestries: Array<Ancestry> = [];
	arc_straddles_nadir = false;
	arc_straddles_zero = false;
	arc_in_lower_half = false;
	label_center = Point.zero;
	thumb_map = new Arc_Map();
	label_position_angle = 0;
	cluster_title = k.empty;
	arc_map = new Arc_Map();
	color = k.color_default;
	label_text_angle = 0;
	predicate: Predicate;
	points_out: boolean;
	center = Point.zero;
	isPaging = false;
	shown = 0;
	total = 0;

	destructor() { this.ancestries = []; }
	constructor(total: number, ancestries: Array<Ancestry>, predicate: Predicate, points_out: boolean) {
		this.ancestries = ancestries;
		this.points_out = points_out;
		this.predicate = predicate;
		this.total = total;
		debug.log_build(` C MAP (ts)  ${total}  ${this.direction_kind}`);
		this.update_all();
		s_ring_rotation_radius.subscribe((radius: number) => {
			if (this.arc_map.outside_arc_radius != radius) {
				this.update_all();		// do not set_paging_index (else expand will hang)
			}
		})
	}

	update_all() {
		// debug.log_layout(`C MAP (ts)  ${this.direction_kind}`);
		this.shown = this.ancestries.length;
		this.isPaging = this.shown < this.total;
		this.center = get(s_graphRect).size.dividedInHalf.asPoint;
		this.color = u.opacitize(this.focus_ancestry.thing?.color ?? this.color, 0.2);
		this.update_fork_angle();
		this.update_widget_angles();
		this.update_label_geometry();
		this.update_label_forIndex();
		this.update_thumb_angles();
	}

	get paging_radius(): number { return k.paging_arc_thickness * 0.8; }
	get maximum_paging_index(): number { return this.total - this.shown; }
	get titles(): string { return this.ancestries.map(a => a.title).join(', '); }
	get description(): string { return `(${this.cluster_title}) ${this.titles}`; }
	get paging_index_ofFocus(): number { return this.paging_state_ofFocus?.index ?? 0; }
	get paging_rotation(): Rotation_State { return ux.rotationState_forName(this.name); }
	get direction_kind(): string { return this.isParental ? 'contained by' : this.kind; }
	get kind(): string { return this.predicate?.kind.unCamelCase().lastWord() ?? k.empty; }
	get isParental(): boolean { return !this.points_out && !this.predicate?.isBidirectional; }
	get name(): string { return `${this.focus_ancestry.title}-cluster-${this.direction_kind}`; }
	get fork_radial(): Point { return Point.fromPolar(get(s_ring_rotation_radius), this.arc_map.fork_angle); }
	get paging_state_ofFocus(): Paging_State | null { return this.paging_state_ofAncestry(this.focus_ancestry); }

	get thumb_isHit(): boolean {
		if (this.isPaging) {
			const ring_origin = g.graph_center.offsetBy(Point.square(-get(s_ring_rotation_radius)));
			const vector = u.vector_ofOffset_fromGraphCenter_toMouseLocation(ring_origin);
			return vector?.isContainedBy_path(this.thumb_map.svg_arc_path) ?? false;
		}
		return false;
	}
	static readonly $_LABEL_$: unique symbol;

	update_label_geometry() {		// rotate text tangent to arc, at center of arc
		const nadir_offset = (this.arc_straddles_nadir && !this.arc_straddles_zero) ? Angle.half : 0;
		const radius = get(s_ring_rotation_radius) - k.ring_rotation_thickness + (this.arc_in_lower_half ? 5 : 0) + 15;
		const ortho = this.arc_in_lower_half ? Angle.quarter : Angle.three_quarters;
		const angle = this.arc_map.center_angle - nadir_offset;
		const radial = Point.fromPolar(radius, angle);
		this.label_center = this.center.offsetBy(radial);
		this.label_text_angle = ortho - angle;
		this.label_position_angle = angle;
	}

	update_label_forIndex() {
		let showing = k.empty;
		const total = `${this.total}`;
		const kind = this.direction_kind;
		const index = Math.round(this.paging_index_ofFocus);
		if (this.isPaging) {
			const middle = (this.shown < 2) ? k.empty : `-${index + this.shown}`;
			showing = ` (${index + 1}${middle})`;
		}
		if (!this.predicate?.isBidirectional) {
			this.cluster_title = `${kind} ${total}${showing}`;
		} else {
			this.cluster_title = `${total} ${kind}${showing}`;
		}
	}
	
	static readonly $_INDEX_$: unique symbol;
	
	paging_state_ofAncestry(ancestry: Ancestry): Paging_State | null {
		return ancestry.thing?.page_states?.paging_state_for(this) ?? null;
	}
	
	adjust_paging_index_byAdding_angle(delta_angle: number) {
		const paging = this.paging_state_ofFocus;
		if (!!paging) {
			// const inverter = (delta_angle > 0) ? 1 : -1;
			const spread_angle = (-this.arc_map.spread_angle).angle_normalized();
			const delta_fraction = (delta_angle / spread_angle);
			const delta_index = delta_fraction * this.maximum_paging_index;			// convert rotation delta to index delta
			const adjusted = paging.addTo_paging_index_for(delta_index) ?? false;	// add index delta to index
			this.update_thumb_angles();
			if (adjusted) {
				this.update_label_forIndex();
			}
			return adjusted || delta_index != 0;
		}
		return false;
	}
	
	compute_paging_fraction(delta_angle: number): number {
		let angle = delta_angle.angle_normalized();
		let end = this.arc_map.end_angle.angle_normalized();
		let start = this.arc_map.start_angle.angle_normalized();
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
			const moved_angle = (start - angle).angle_normalized();
			const spread_angle = (-this.arc_map.spread_angle).angle_normalized();
			return (moved_angle / spread_angle).force_between(0, 1);
		}
	}

	static readonly $_ANGLES_$: unique symbol;

	update_arc_angles(index: number, max: number, child_angle: number) {
		// index increases & angle decreases clockwise
		if (index == max) {
			this.arc_map.start_angle = child_angle;
		}
		if (index == 0) {
			this.arc_map.end_angle = child_angle;
		}
	}

	update_fork_angle() {
		// returns one of three angles: 1) rotation_angle 2) opposite+tweak 3) opposite-tweak
		const tweak = Math.PI / 3;					// equilateral distribution
		const rotation_angle = get(s_rotation_ring_angle);
		const opposite = rotation_angle + Angle.half;
		const raw = this.predicate.isBidirectional ?
			opposite - tweak :
			this.points_out ? rotation_angle :		// one directional, use global
			opposite + tweak;
		const fork_angle = raw.angle_normalized() ?? 0;
		this.arc_map.update(fork_angle);
	}

	update_widget_angles() {
		this.widget_maps = [];
		if (this.shown > 0 && !!this.predicate) {
			const radius = get(s_ring_rotation_radius);
			const radial = new Point(radius + k.ring_widget_padding, 0);
			const fork_pointsRight = new Angle(this.arc_map.fork_angle).angle_pointsRight;
			const tweak = this.center.offsetByXY(2, -1.5);	// tweak so that drag dots are centered within the rotation ring
			const max = this.shown - 1;
			let index = 0;
			while (index < this.shown) {
				const child_index = !fork_pointsRight ? index : max - index;
				const child_ancestry = this.ancestries[child_index];
				const childAngle = this.angle_at_index(index);
				const childOrigin = tweak.offsetBy(radial.rotate_by(childAngle));
				const map = new Widget_MapRect(IDLine.flat, new Rect(), childOrigin, child_ancestry, this.focus_ancestry, childAngle);
				this.widget_maps.push(map);
				index += 1;
			}
			this.arc_map.finalize_angles();
			this.arc_in_lower_half = this.fork_radial.y < 0;
			this.arc_straddles_zero = this.arc_map.arc_straddles(0);
			this.arc_straddles_nadir = this.arc_map.arc_straddles(Angle.three_quarters);
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
		const radius = get(s_ring_rotation_radius);
		const radial = this.fork_radial;					// points at middle widget
		let y = radial.y + (row * (k.row_height - 2));		// distribute y equally around fork_y
		let y_isOutside = false;
		const absY = Math.abs(y);
		if (absY > radius) {
			y_isOutside = true;								// y is outside rotation ring
			y = radius * (y / absY) - (y % radius);			// swing around (bottom | top) --> back inside rotation
		}
		let child_angle = -Math.asin(y / radius);			// arc-sin only defined (-90 to 90) [ALSO: negate angles so things advance clockwise]
		if (y_isOutside == (radial.x > 0)) {				// counter-clockwise if (x is positive AND y is outside) OR (x is negative AND y is inside)
			child_angle = Angle.half - child_angle			// otherwise it's clockwise, so invert it
		}
		this.update_arc_angles(index, max, child_angle);
		return child_angle									// angle at index
	}

	update_thumb_angles() {

		// very complex, because:
		// 1. start & end are sometimes reversed (hasNegative_spread)
		// 2. arc can straddle nadir when fork y is outside of ring

		const spread_angle = this.arc_map.spread_angle;
		const hasNegative_spread = spread_angle < 0
		const inverter = hasNegative_spread ? 1 : -1;
		const otherInverter = (hasNegative_spread == this.arc_straddles_nadir) ? -1 : 1;
		const arc_spread = this.arc_straddles_nadir ? (-spread_angle).angle_normalized() : spread_angle;
		const increment = arc_spread / this.total * inverter;
		const arc_start = this.arc_map.start_angle * otherInverter;
		const start = arc_start + (increment * this.paging_index_ofFocus);
		const end = start + (increment * this.shown);
		this.thumb_map.update((start + end) / 2);
		this.thumb_map.start_angle = start;
		this.thumb_map.end_angle = end;
	}

}
