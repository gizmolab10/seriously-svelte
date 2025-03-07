import { k, u, ux, w, Rect, Point, Angle, debug, T_Line, T_Widget, G_ArcSlider, T_Quadrant } from '../common/Global_Imports';
import { Ancestry, Predicate, S_Paging, G_Widget, S_Rotation } from '../common/Global_Imports';
import { w_ring_rotation_angle, w_ring_rotation_radius } from '../common/Stores';
import { w_graph_rect, w_ancestry_focus } from '../common/Stores';
import { get } from 'svelte/store';

//////////////////////////////////////////
//										//
//	for ONE cluster (there are three)	//
//										//
//	assumes ancestries are				//
//		already paged to fit			//
//										//
//	computes:							//
//		positions of arc, thumb & label	//
//		svg paths for arc & thumb		//
//		map rect for each widget		//
//		angle for fork & label			//
//										//
//////////////////////////////////////////

export default class G_Cluster {
	g_cluster_widgets: Array<G_Widget> = [];
	g_thumbSlider = new G_ArcSlider();
	ancestries: Array<Ancestry> = [];
	g_arcSlider = new G_ArcSlider();
	color = k.thing_color_default;
	arc_straddles_nadir = false;
	points_toChildren: boolean;
	arc_straddles_zero = false;
	arc_in_lower_half = false;
	label_center = Point.zero;
	label_position_angle = 0;
	cluster_title = k.empty;
	predicate: Predicate;
	center = Point.zero;
	widgets_shown = 0;
	total_widgets = 0;
	isPaging = false;

	destructor() { this.ancestries = []; }
	constructor(total_widgets: number, ancestries: Array<Ancestry>, predicate: Predicate, points_toChildren: boolean) {
		this.points_toChildren = points_toChildren;
		this.total_widgets = total_widgets;
		this.ancestries = ancestries;
		this.predicate = predicate;
		debug.log_build(` C MAP (ts)  ${total_widgets}  ${this.direction_kind}`);
		this.update_all();
		w_ring_rotation_radius.subscribe((radius: number) => {
			if (this.g_arcSlider.outside_arc_radius != radius) {
				this.update_all();		// do not set_paging_index (else expand will hang)
			}
		})
	}

	update_all() {
		this.widgets_shown = this.ancestries.length;
		this.isPaging = this.widgets_shown < this.total_widgets;
		this.center = get(w_graph_rect).size.asPoint.dividedInHalf;
		this.color = u.opacitize(get(w_ancestry_focus).thing?.color ?? this.color, 0.2);
		this.update_fork_angle();
		this.update_widget_angles();
		this.update_label_geometry();
		this.update_label_forIndex();
		this.update_thumb_angles();
	}

	get paging_radius(): number { return k.paging_arc_thickness * 0.8; }
	get titles(): string { return this.ancestries.map(a => a.title).join(', '); }
	get description(): string { return `(${this.cluster_title}) ${this.titles}`; }
	get paging_index_ofFocus(): number { return this.s_focusPaging?.index ?? 0; }
	get paging_rotation(): S_Rotation { return ux.s_rotation_forName(this.name); }
	get maximum_paging_index(): number { return this.total_widgets - this.widgets_shown; }
	get kind(): string { return this.predicate?.kind.unCamelCase().lastWord() ?? k.empty; }
	get name(): string { return `${get(w_ancestry_focus).title}-cluster-${this.direction_kind}`; }
	get fork_radial(): Point { return Point.fromPolar(get(w_ring_rotation_radius), this.g_arcSlider.fork_angle); }
	get s_focusPaging(): S_Paging | null { return this.s_ancestryPaging(get(w_ancestry_focus)); }

	get thumb_isHit(): boolean {
		const offset = Point.square(-get(w_ring_rotation_radius));
		const mouse_vector = w.mouse_vector_ofOffset_fromGraphCenter(offset);
		return this.isPaging && !!mouse_vector && mouse_vector.isContainedBy_path(this.g_thumbSlider.svgPathFor_arcSlider);
	}

	get direction_kind(): string {
		const isSingular = this.total_widgets == 1;
		const isParental = !this.points_toChildren && !this.predicate?.isBidirectional;
		return isParental ? isSingular ? 'parent' : 'parents' : this.points_toChildren ? isSingular ? 'child' : 'children' : this.kind;
	}

	static readonly LABEL: unique symbol;

	update_label_geometry() {		// rotate text tangent to arc, at center of arc
		const angle = this.g_arcSlider.center_angle;
		const ortho = this.arc_in_lower_half ? Angle.quarter : Angle.three_quarters;
		const radius = get(w_ring_rotation_radius) - k.ring_rotation_thickness + (this.arc_in_lower_half ? 5 : 0) + 10;
		this.label_center = this.center.offsetBy(Point.fromPolar(radius, angle));
		this.g_arcSlider.label_text_angle = ortho - angle;
		this.label_position_angle = angle;
	}
	
	update_label_forIndex() {
		let cluster_title =  `${this.total_widgets} ${this.direction_kind}`;
		if (this.isPaging) {
			const index = Math.round(this.paging_index_ofFocus);
			const middle = (this.widgets_shown < 2) ? k.empty : `-${index + this.widgets_shown}`;
			cluster_title += ` (${index + 1}${middle})`
		}
		this.cluster_title = cluster_title;
	}
	
	static readonly PAGING: unique symbol;
	
	s_ancestryPaging(ancestry: Ancestry): S_Paging | null {
		const s_thing_pages = ux.s_thing_pages_forThingID(ancestry.thing?.id);
		return s_thing_pages?.s_paging_for(this) ?? null;
	}
	
	adjust_paging_index_byAdding_angle(delta_angle: number) {
		const paging = this.s_focusPaging;
		if (!!paging) {
			const spread_angle = (-this.g_arcSlider.spread_angle).angle_normalized();
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
		let end = this.g_arcSlider.end_angle.angle_normalized();
		let start = this.g_arcSlider.start_angle.angle_normalized();
		const quadrant = u.quadrant_ofAngle(end);
		if (quadrant != T_Quadrant.upperRight) {
			let delta = u.basis_angle_ofType_Quadrant(quadrant) + Angle.quarter;

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
			const spread_angle = (-this.g_arcSlider.spread_angle).angle_normalized();
			return (moved_angle / spread_angle).force_between(0, 1);
		}
	}

	static readonly ANGLES: unique symbol;

	update_arc_angles(index: number, max: number, angle_ofChild: number) {
		// index increases & angle decreases clockwise
		if (index == max) {
			this.g_arcSlider.start_angle = angle_ofChild;
		}
		if (index == 0) {
			this.g_arcSlider.end_angle = angle_ofChild;
		}
	}

	update_fork_angle() {
		// returns one of three angles: 1) children_angle 2) opposite+tweak 3) opposite-tweak
		const tweak = 2 * Math.PI / 3;					// equilateral distribution
		const children_angle = get(w_ring_rotation_angle);
		const raw = this.predicate.isBidirectional ?
			children_angle + tweak :
			this.points_toChildren ? children_angle :		// one directional, use global
			children_angle - tweak;
		const fork_angle = raw.angle_normalized() ?? 0;
		this.g_arcSlider.update_fork_angle(fork_angle);
	}

	update_widget_angles() {
		this.g_cluster_widgets = [];
		if (this.widgets_shown > 0 && !!this.predicate) {
			const tweak = this.center.offsetByXY(2, -1.5);	// tweak so that drag dots are centered within the rotation ring
			const radial = new Point(get(w_ring_rotation_radius) + k.radial_widget_inset, 0);
			const fork_pointsRight = new Angle(this.g_arcSlider.fork_angle).angle_pointsRight;
			const max = this.widgets_shown - 1;
			let index = 0;
			while (index < this.widgets_shown) {
				const child_index = !fork_pointsRight ? index : max - index;
				const child_ancestry = this.ancestries[child_index];
				const angle_ofChild = this.angle_at_index(index);
				const origin_ofChild = radial.rotate_by(angle_ofChild).offsetBy(tweak);
				const g_widget = new G_Widget(Rect.zero, T_Widget.radial, T_Line.flat, origin_ofChild, child_ancestry, get(w_ancestry_focus), this.points_toChildren, angle_ofChild);
				this.g_cluster_widgets.push(g_widget);
				index += 1;
			}
			this.g_arcSlider.finalize_angles();
			this.arc_in_lower_half = this.fork_radial.y < 0;
			this.arc_straddles_zero = this.g_arcSlider.arc_straddles(0);
			this.arc_straddles_nadir = this.g_arcSlider.arc_straddles(Angle.three_quarters);
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

		const max = this.widgets_shown - 1;
		const row = (max / 2) - index;						// row centered around zero
		const radius = get(w_ring_rotation_radius);
		const radial = this.fork_radial;					// points at middle widget
		let y = radial.y + (row * (k.row_height - 2));		// distribute y equally around fork_y
		let y_isOutside = false;
		const absY = Math.abs(y);
		if (absY > radius) {
			y_isOutside = true;								// y is outside rotation ring
			y = radius * (y / absY) - (y % radius);			// swing around (bottom | top) --> back inside rotation
		}
		let angle_ofChild = -Math.asin(y / radius);			// arc-sin only defined (-90 to 90) [ALSO: negate angles so things advance clockwise]
		if (y_isOutside == (radial.x > 0)) {				// counter-clockwise if (x is positive AND y is outside) OR (x is negative AND y is inside)
			angle_ofChild = Angle.half - angle_ofChild			// otherwise it's clockwise, so invert it
		}
		this.update_arc_angles(index, max, angle_ofChild);
		return angle_ofChild									// angle at index
	}

	update_thumb_angles() {

		// very complex, because:
		// 1. start & end are sometimes reversed (hasNegative_spread)
		// 2. arc can straddle nadir when fork y is outside of ring

		if (this.total_widgets > 0) {	// avoid division by zero
			const spread_angle = this.g_arcSlider.spread_angle;
			const hasNegative_spread = spread_angle < 0
			const inverter = hasNegative_spread ? 1 : -1;
			const otherInverter = (hasNegative_spread == this.arc_straddles_nadir) ? -1 : 1;
			const arc_spread = this.arc_straddles_nadir ? (-spread_angle).angle_normalized() : spread_angle;
			const increment = arc_spread / this.total_widgets * inverter;
			const arc_start = this.g_arcSlider.start_angle * otherInverter;
			const start = arc_start + (increment * this.paging_index_ofFocus);
			const end = start + (increment * this.widgets_shown);
			this.g_thumbSlider.update_fork_angle((start + end) / 2);
			this.g_thumbSlider.start_angle = start;
			this.g_thumbSlider.end_angle = end;
		}
	}

}
