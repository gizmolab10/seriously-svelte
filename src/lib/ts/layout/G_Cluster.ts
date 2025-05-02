import { k, w, Point, Angle, debug, colors, radial, Ancestry, Predicate } from '../common/Global_Imports';
import { G_Widget, G_ArcSlider, G_Paging, S_Rotation } from '../common/Global_Imports';
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
//		geometry for each widget		//
//		angle for fork & label			//
//										//
//////////////////////////////////////////

export default class G_Cluster {
	g_cluster_widgets: Array<G_Widget> = [];
	ancestries_shown: Array<Ancestry> = [];
	g_thumbArc = new G_ArcSlider(true);
	ancestries: Array<Ancestry> = [];
	color = colors.default_forThings;
	g_arcSlider = new G_ArcSlider();
	arc_straddles_nadir = false;
	points_toChildren: boolean;
	arc_straddles_zero = false;
	arc_in_lower_half = false;
	label_center = Point.zero;
	cluster_title = k.empty;
	predicate: Predicate;
	center = Point.zero;
	angle_ofCluster = 0;
	widgets_shown = 0;
	total_widgets = 0;
	isPaging = false;

	// heavy lifting for positioning 
	// everything in one cluster of the radial view

	destructor() { this.ancestries = []; }
	constructor(predicate: Predicate, points_toChildren: boolean) {
		this.points_toChildren = points_toChildren;
		this.predicate = predicate;
		w_ring_rotation_radius.subscribe((radius: number) => {
			if (this.g_arcSlider.outside_arc_radius != radius) {
				this.layout_cluster();		// do not set_paging_index (else expand will hang)
			}
		})
	}

	setAncestries(ancestries: Array<Ancestry>) {
		this.total_widgets = this.widgets_shown = ancestries.length;
		this.ancestries = ancestries;
	}

	layout_forPaging(angle_ofCluster: number) {
		const g_paging = this.g_paging_forPredicate_toChildren(this.predicate, this.points_toChildren);
		if (!!g_paging) {
			this.angle_ofCluster = angle_ofCluster;
			const points_right = new Angle(angle_ofCluster).angle_pointsRight;
			const onePage_ofAncestries = g_paging.onePage_from(this.widgets_shown, this.ancestries);
			this.ancestries_shown = points_right ? onePage_ofAncestries.reverse() : onePage_ofAncestries;	
			this.layout_cluster();
			let angle = this.g_arcSlider.spread_angle;
			if (angle < 0) {
				angle = -angle;
			}
			return angle;// - Math.PI / 3;
		}
		return 0;
	}

	layout_cluster() {
		if (this.ancestries_shown.length > 0) {
			debug.log_build(`layout_cluster (${this.ancestries_shown.length} shown)  ${this.direction_kind}`);
			this.widgets_shown = this.ancestries_shown.length;
			this.isPaging = this.widgets_shown < this.total_widgets;
			this.center = get(w_graph_rect).size.asPoint.dividedInHalf;
			this.color = colors.opacitize(get(w_ancestry_focus).thing?.color ?? this.color, 0.2);
			this.g_arcSlider.layout_fork(this.angle_ofCluster);
			this.layout_widgets_inCluster();
			this.g_arcSlider.layout_forkTip(this.center);
			this.layout_label();
			this.layout_thumb_angles();
			this.update_label_forIndex();
		}
	}

	get titles(): string { return this.ancestries.map(a => a.title).join(', '); }
	get description(): string { return `(${this.cluster_title}) ${this.titles}`; }
	get kind(): string { return this.predicate?.kind.unCamelCase().lastWord() ?? k.empty; }
	get name(): string { return `${get(w_ancestry_focus).title}-cluster-${this.direction_kind}`; }

	get isMouse_insideThumb(): boolean {
		const offset = Point.square(-get(w_ring_rotation_radius));
		const mouse_vector = w.mouse_vector_ofOffset_fromGraphCenter(offset);
		return this.isPaging && !!mouse_vector && mouse_vector.isContainedBy_path(this.g_thumbArc.svgPathFor_arcSlider);
	}

	get direction_kind(): string {
		const isSingular = this.total_widgets == 1;
		const isParental = !this.points_toChildren && !this.predicate?.isBidirectional;
		return isParental ? isSingular ? 'parent' : 'parents' : this.points_toChildren ? isSingular ? 'child' : 'children' : this.kind;
	}

	static readonly LABEL: unique symbol;

	private layout_label() {		// rotate text tangent to arc, at center of arc
		const angle = this.g_arcSlider.angle_ofFork;
		const ortho = this.arc_in_lower_half ? Angle.three_quarters : Angle.quarter;
		const label_radius = get(w_ring_rotation_radius) + (this.arc_in_lower_half ? 0 : 5) - 22.4;
		this.label_center = this.center.offsetBy(Point.fromPolar(label_radius, angle));
		this.g_arcSlider.label_text_angle = ortho - angle;
	}
	
	private update_label_forIndex() {
		let cluster_title =  `${this.total_widgets} ${this.direction_kind}`;
		if (this.isPaging) {
			const index = this.paging_index_ofFocus;
			const middle = (this.widgets_shown < 2) ? k.empty : `-${index + this.widgets_shown}`;
			cluster_title += ` (${index + 1}${middle})`
		}
		this.cluster_title = cluster_title;
	}
	
	static readonly PAGING: unique symbol;

	get g_paging_rotation():  S_Rotation { return radial.g_paging_rotation_forName(this.name); }
	get maximum_paging_index()	: number { return this.total_widgets - this.widgets_shown; }	
	get paging_index_ofFocus()	: number { return Math.round(this.g_focusPaging?.index ?? 0); }
	get g_focusPaging(): G_Paging | null { return this.g_paging_forAncestry(get(w_ancestry_focus)); }
	get radial_ofFork():		   Point { return Point.fromPolar(get(w_ring_rotation_radius), this.angle_ofCluster); }

	g_paging_forPredicate_toChildren(predicate: Predicate, points_toChildren: boolean): G_Paging | null {
		const s_thing_pages = radial.s_thing_pages_forThingID(get(w_ancestry_focus)?.thing?.id);
		return s_thing_pages?.g_paging_forPredicate_toChildren(predicate, points_toChildren) ?? null;
	}

	g_paging_forAncestry(ancestry: Ancestry): G_Paging | null {
		const s_thing_pages = radial.s_thing_pages_forThingID(ancestry.thing?.id);
		return s_thing_pages?.g_paging_for(this) ?? null;
	}
	
	adjust_paging_index_byAdding_angle(delta_angle: number) {
		const paging = this.g_focusPaging;
		if (!!paging) {
			const spread_angle = (-this.g_arcSlider.spread_angle).angle_normalized();
			const delta_fraction = (delta_angle / spread_angle);
			const delta_index = delta_fraction * this.maximum_paging_index;			// convert rotation delta to index delta
			const adjusted = paging.addTo_paging_index_for(delta_index) ?? false;	// add index delta to index
			this.layout_thumb_angles();
			if (adjusted) {
				this.update_label_forIndex();
			}
			return adjusted || delta_index != 0;
		}
		return false;
	}

	static readonly ANGLES: unique symbol;
	
	get xangle_ofCluster(): number { return this.predicate.angle_ofCluster_when(this.points_toChildren); }

	private update_arc_angles(index: number, max: number, child_angle: number) {
		// index increases & angle decreases clockwise
		if (index == max) {
			this.g_arcSlider.start_angle = child_angle;
		}
		if (index == 0) {
			this.g_arcSlider.end_angle = child_angle;
		}
	}

	layout_widgets_inCluster() {
		this.g_cluster_widgets = [];
		if (this.widgets_shown > 0 && !!this.predicate) {
			const center = this.center.offsetByXY(2, -1.5);			// tweak so that drag dots are centered within the rotation ring
			const radial = Point.x(get(w_ring_rotation_radius) + k.radial_widget_inset);
			const radial_ofFork = this.radial_ofFork;	// points at middle widget
			const fork_pointsRight = radial_ofFork.x > 0;
			const fork_pointsDown = radial_ofFork.y < 0;
			let index = 0;
			while (index < this.widgets_shown) {
				const adjusted_index = fork_pointsRight ? (this.widgets_shown - index - 1) : index;
				const angle = this.angle_at_index(adjusted_index);
				const ancestry = this.ancestries_shown[adjusted_index];
				const pointsRight = new Angle(angle).angle_pointsRight;
				const rotated_origin = center.offsetBy(radial.rotate_by(angle));
				ancestry.g_widget.layout_necklaceWidget(rotated_origin, pointsRight);
				ancestry.g_widget.g_cluster = this;
				this.g_cluster_widgets.push(ancestry.g_widget);
				index += 1;
			}
			this.g_arcSlider.finalize_angles();
			this.arc_in_lower_half = fork_pointsDown;
			this.arc_straddles_zero = this.g_arcSlider.arc_straddles(0);
			this.arc_straddles_nadir = this.g_arcSlider.arc_straddles(Angle.three_quarters);
		}
	}

	private angle_at_index(index: number): number {

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
		const radial = this.radial_ofFork;					// points at middle widget
		const radius = get(w_ring_rotation_radius);
		let y = radial.y + (row * (k.size.dot + 1.3));		// distribute y equally around fork_y
		let y_isOutside = false;
		const absY = Math.abs(y);
		if (absY > radius) {
			y_isOutside = true;								// y is outside rotation ring
			y = radius * (y / absY) - (y % radius);			// swing around (bottom | top) --> back inside rotation
		}
		let child_angle = Math.asin(y / radius);			// arc-sin only defined (-90 to 90) [ALSO: negate angles so things advance clockwise]
		if (y_isOutside != (radial.x > 0)) {				// counter-clockwise if (x is positive AND y is outside) OR (x is negative AND y is inside)
			child_angle = Angle.half - child_angle			// otherwise it's clockwise, so invert it
		}
		this.update_arc_angles(index, max, child_angle);
		return child_angle;									// angle at index
	}

	private layout_thumb_angles() {

		// a tad complex, because:
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
			this.g_thumbArc.layout_fork((start + end) / 2);
			this.g_thumbArc.start_angle = start;
			this.g_thumbArc.end_angle = end;
		}
	}

}
