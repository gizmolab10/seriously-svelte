import { w_hierarchy, w_graph_rect, w_t_graphMode, w_show_details } from '../../common/Stores';
import { S_Element, G_TreeLine, G_TreeChildren } from '../../common/Global_Imports'
import { T_Curve, T_Element, T_GraphMode } from '../../common/Global_Imports';
import { k, ux, Rect, Point, debug, Ancestry } from '../../common/Global_Imports'
import { get } from 'svelte/store';

export default class G_Widget {
	g_treeChildren: G_TreeChildren | null = null;
	g_reciprocalLines: Array<G_TreeLine> = [];
	origin_ofChildrenTree = Point.zero;
	offset_ofWidget = Point.zero;
	center_ofReveal = Point.zero;
	origin_ofRadial = Point.zero;
	origin_ofWidget = Point.zero;
	origin_ofFocus = Point.zero;
	origin_ofTitle = Point.zero;
	center_ofDrag = Point.zero;
	widget_pointsRight = true;
	forGraphMode: T_GraphMode;
	points_toChild = true;
	es_widget!: S_Element;
	g_line!: G_TreeLine;
	ancestry!: Ancestry;
	width_ofWidget = 0;

	// create a G_TreeLine as normal
	// and one for each bidirectional

	get responder(): HTMLElement | null { return this.es_widget.responder; }

	// single source of truth for widget's
	//
	// widget_width (computed here)
	// UX state (fill, border) 
	// relevant ancestries (children, thing, shows reveal)
	// locations of:
	//	 rects for lines from: parent and bidirectionals
	//	 dots and title for:
	//		child tree
	//		radial origin, angles and orientations (in/out, right/left)

	constructor(ancestry: Ancestry) {
		this.es_widget = ux.s_element_for(ancestry, T_Element.widget, k.empty);
		this.g_line = new G_TreeLine(ancestry, ancestry);
		this.forGraphMode = get(w_t_graphMode);
		this.ancestry = ancestry;
		if (!ancestry.thing) {
			console.log(`G_Widget ... ancestry has no thing ${ancestry.relationship?.description}`);
		}
	}

	static empty(ancestry: Ancestry) { return new G_Widget(ancestry); }
	get showingReveal(): boolean { return this.ancestry.showsReveal_forPointingToChild(this.points_toChild) ?? false; }

	get width_ofBothDots(): number {
		const reveal_width = this.showingReveal ? k.dot_size : 0;
		const radial_extra = this.widget_pointsRight ? 11 : -0.5;
		const drag_width = ux.inTreeMode ? 0 : k.dot_size + radial_extra;
		return drag_width + reveal_width;
	}

	update(
		forGraphMode: T_GraphMode,
		origin_ofWidget: Point = Point.zero,
		points_toChild: boolean = true,
		widget_pointsRight: boolean = true,
		rect: Rect = Rect.zero,
		curveType: string = T_Curve.flat) {
		if (forGraphMode == get(w_t_graphMode)) {		// modes must match, else widgets get misplaced
			this.g_line.rect = rect;
			this.forGraphMode = forGraphMode;
			this.g_line.curveType = curveType;
			this.points_toChild = points_toChild;
			this.origin_ofWidget = origin_ofWidget;
			this.widget_pointsRight = widget_pointsRight;
			this.layout();
		}
	}

	layout() {				// assumes all child trees are laid out (needed for progeny size)
		if (this.forGraphMode == get(w_t_graphMode)) {
			this.g_treeChildren?.layout_allChildren();	// evoke only for [tree] thing expanded with children
			this.layout_widget_andLine();
			this.layout_bidirectional_lines();
		}
	}

	recursively_relayout_tree() {
		const ancestry = this.ancestry;
		if (ancestry.showsChildRelationships && ancestry.thing_isChild) {
			for (const childAncestry of ancestry.childAncestries) {
				childAncestry.g_widget.recursively_relayout_tree();
			}
		}
		this.layout();
	}

	private layout_widget_andLine() {
		const ancestry = this.ancestry;
		if (!!ancestry.thing && this.forGraphMode == get(w_t_graphMode)) {		// short-circuit mismatched graph mode
			const showingReveal = this.showingReveal;
			const showingBorder = !ancestry ? false : (ancestry.isGrabbed || ancestry.isEditing);
			const radial_x = this.widget_pointsRight ? 4 : k.dot_size * 3.5;
			const offset_ofChildrenTree = new Point(k.dot_size * 1.3, -(7 + k.dot_size / 15));
			const offset_ofTitle_forRadial = (this.widget_pointsRight ? 15 : (showingReveal ? 16 : 3));
			const widget_width = ancestry.thing.titleWidth + this.width_ofBothDots;
			const offset_forDirection = this.widget_pointsRight ? -7 : 34.5 - widget_width;
			const offset_forBorder = showingBorder ? 0 : 1;
			const drag_x = this.widget_pointsRight ? (ux.inRadialMode ? 3 : 2) : (widget_width - (showingReveal ? 2.5 : 2));
			const drag_y = ux.inRadialMode ? 2.8 : 2.7;
			this.origin_ofTitle = new Point(ux.inRadialMode ? offset_ofTitle_forRadial : 12.5, 0);
			this.origin_ofRadial = this.origin_ofWidget.offsetByXY(-radial_x, 4 - k.dot_size);
			this.center_ofDrag = new Point(drag_x, drag_y).offsetEquallyBy(k.dot_size / 2);
			this.origin_ofChildrenTree = this.g_line.rect.extent.offsetBy(offset_ofChildrenTree);
			this.offset_ofWidget = Point.x(offset_forDirection).offsetEquallyBy(offset_forBorder);
			this.width_ofWidget = widget_width;
			this.g_line.layout();
			if (showingReveal) {
				const reveal_y = k.dot_size * 0.72;
				const offset_forPointsRight = widget_width - (ux.inRadialMode ? 21 : -1);
				const reveal_x = k.dot_size - (this.widget_pointsRight ? -offset_forPointsRight : 3);
				this.center_ofReveal = new Point(reveal_x, reveal_y);
			}
			if (ux.inTreeMode && ancestry.isFocus) {
				const graph_rect = get(w_graph_rect);
				const children_size = ancestry.visibleProgeny_size;
				const focus = ancestry.thing ?? get(w_hierarchy).root;
				const offset_x_ofReveal = focus?.titleWidth / 2 - 2;
				const offset_y = -1 - graph_rect.origin.y;
				const offset_x = 15 + (get(w_show_details) ? -k.width_details : 0) - (children_size.width / 2) - (k.dot_size / 2.5) + offset_x_ofReveal;
				const origin_ofReveal = graph_rect.center.offsetByXY(offset_x, offset_y);
				this.origin_ofFocus = origin_ofReveal.offsetByXY(-21.5 - offset_x_ofReveal, -5);
			}
		}
	}

	private layout_bidirectional_lines() {
		this.g_reciprocalLines = [];
		const extent = this.center_ofDrag;
		const bidirectionals = this.ancestry.shallower_bidirectionals;
		for (const [index, bidirectional] of bidirectionals.entries()) {
			const origin = bidirectional.g_widget.center_ofReveal;
			const rect = Rect.createExtentRect(origin, extent).normalized;
			const g_line = new G_TreeLine(this.ancestry, bidirectional);
			this.g_reciprocalLines[index] = g_line;
			g_line.rect = rect;
			g_line.layout();
			// console.log(`bidi lines ${rect.size.verbose} ${bidirectional.titles} <--> ${this.ancestry.titles}`)
		}
	}
	
}
