import { w_hierarchy, w_graph_rect, w_t_graphMode, w_show_details } from '../../common/Stores';
import { S_Element, G_TreeLine, G_TreeChildren } from '../../common/Global_Imports'
import { T_Curve, T_Element, T_GraphMode } from '../../common/Global_Imports';
import { k, ux, Rect, Point, Ancestry } from '../../common/Global_Imports'
import { get } from 'svelte/store';

export default class G_Widget {
	g_treeChildren: G_TreeChildren | null = null;
	g_reciprocalLines: Array<G_TreeLine> = [];
	origin_ofChildrenTree = Point.zero;
	curveType: string = T_Curve.flat;
	offset_ofWidget = Point.zero;
	center_ofReveal = Point.zero;
	origin_ofRadial = Point.zero;
	origin_ofWidget = Point.zero;
	origin_ofFocus = Point.zero;
	origin_ofTitle = Point.zero;
	center_ofDrag = Point.zero;
	forGraphMode: T_GraphMode;
	g_treeLine!: G_TreeLine;
	points_toChild = true;
	es_widget!: S_Element;
	points_right = true;
	ancestry!: Ancestry;
	width_ofWidget = 0;

	// TODO:
	// create a G_TreeLine as normal
	// and one for each reciprocal

	get responder(): HTMLElement | null { return this.es_widget.responder; }

	// single source of truth for widget's
	//
	// width (computed here)
	// UX state (fill, border) 
	// relevant ancestries (children, thing, shows reveal)
	// locations of:
	//	 rects for lines from: parent and bidirectionals
	//	 dots and title for:
	//		child tree
	//		radial origin, angles and orientations (in/out, right/left)

	constructor( ancestry: Ancestry) {
		this.es_widget = ux.s_element_for(ancestry, T_Element.widget, k.empty);
		this.g_treeLine = new G_TreeLine(this.ancestry, this.ancestry);
		this.forGraphMode = get(w_t_graphMode);
		this.ancestry = ancestry;
		if (!ancestry.thing) {
			console.log(`G_Widget ... ancestry has no thing ${ancestry.relationship?.description}`);
		}
	}

	static empty(ancestry: Ancestry) { return new G_Widget(ancestry); }
	get showingReveal(): boolean { return this.ancestry.showsReveal_forPointingToChild(this.points_toChild) ?? false; }

	get width_ofBothDots(): number {
		const offset_forReveal = k.dot_size * (this.showingReveal ? 2 : 1);
		const offset_forRadial = ux.inTreeMode ? -13.5 : (this.points_right ? 11 : -0.5);
		return offset_forReveal + offset_forRadial;
	}

	update(
		forGraphMode: T_GraphMode,
		origin_ofWidget: Point = Point.zero,
		points_toChild: boolean = true,
		points_right: boolean = true,
		rect: Rect = Rect.zero,
		curveType: string = T_Curve.flat) {
		if (forGraphMode == get(w_t_graphMode)) {		// modes must match, else widgets get misplaced
			this.curveType = curveType;
			this.g_treeLine.rect = rect;
			this.forGraphMode = forGraphMode;
			this.points_right = points_right;
			this.points_toChild = points_toChild;
			this.g_treeLine.curveType = curveType;
			this.origin_ofWidget = origin_ofWidget;
		}
	}

	recursively_relayout_tree() {
		this.layout();
		if (ux.inTreeMode) {
			const ancestry = this.ancestry;
			if (ancestry.showsChildRelationships && ancestry.thing_isChild) {
				for (const childAncestry of ancestry.childAncestries) {
					childAncestry.g_widget.recursively_relayout_tree();
				}
			}
			this.layout_reciprocals();	// after entire sub tree is laid out
		}
	}

	layout() {
		const ancestry = this.ancestry;
		if (!!ancestry.thing && this.forGraphMode == get(w_t_graphMode)) {		// short-circuit mismatched graph mode
			this.g_treeChildren?.layout_allChildren();							// g_treeChildren only valid for [tree] thing expanded with children
			const showingReveal = this.showingReveal;
			const showingBorder = !ancestry ? false : (ancestry.isGrabbed || ancestry.isEditing);
			const x_radial = this.points_right ? 4 : k.dot_size * 3.5;
			const offset_ofChildrenTree = new Point(k.dot_size * 1.3, -(7 + k.dot_size / 15));
			const offset_ofTitle_forRadial = (this.points_right ? 15 : (showingReveal ? 16 : 3));
			const width = ancestry.thing.titleWidth + this.width_ofBothDots;
			const offset_forDirection = this.points_right ? -7 : 34.5 - width;
			const offset_forBorder = showingBorder ? 0 : 1;
			const x_drag = this.points_right ? (ux.inRadialMode ? 3 : 2) : (width - (showingReveal ? 2.5 : 2));
			const y_drag = ux.inRadialMode ? 2.8 : 2.7;
			this.origin_ofTitle = new Point(ux.inRadialMode ? offset_ofTitle_forRadial : 12.5, 0);
			this.origin_ofRadial = this.origin_ofWidget.offsetByXY(-x_radial, 4 - k.dot_size);
			this.center_ofDrag = new Point(x_drag, y_drag).offsetEquallyBy(k.dot_size / 2);
			this.origin_ofChildrenTree = this.g_treeLine.rect.extent.offsetBy(offset_ofChildrenTree);
			this.offset_ofWidget = Point.x(offset_forDirection).offsetEquallyBy(offset_forBorder);
			this.width_ofWidget = width;
			if (showingReveal) {
				const y_reveal = k.dot_size * 0.72;
				const x_reveal = k.dot_size - (this.points_right ? ((ux.inTreeMode ? -1 : 21) - width) : 3);
				this.center_ofReveal = new Point(x_reveal, y_reveal);
			}
			if (ux.inTreeMode && ancestry.isFocus) {
				const graphRect = get(w_graph_rect);
				const childrenSize = ancestry.visibleProgeny_size;
				const focus = ancestry.thing ?? get(w_hierarchy).root;
				const offsetX_ofReveal = focus?.titleWidth / 2 - 2;
				const offsetY = -1 - graphRect.origin.y;
				const offsetX = 15 + (get(w_show_details) ? -k.width_details : 0) - (childrenSize.width / 2) - (k.dot_size / 2.5) + offsetX_ofReveal;
				const origin_ofReveal = graphRect.center.offsetByXY(offsetX, offsetY);
				this.origin_ofFocus = origin_ofReveal.offsetByXY(-21.5 - offsetX_ofReveal, -5);
			}
		}
	}

	layout_reciprocals() {
		const extent = this.center_ofDrag;
		for (const [index, reciprocal] of this.shallower_reciprocals.entries()) {
			const origin = reciprocal.g_widget.origin_ofChildrenTree;
			const rect = Rect.createExtentRect(origin, extent).normalized;
			const g_line = new G_TreeLine(this.ancestry, this.ancestry);
			this.g_reciprocalLines[index] = g_line;
			g_line.rect = rect;
			// console.log(` ${reciprocal.titles} => ${this.ancestry.titles}   ${rect.description}`)
		}
	}

	get shallower_reciprocals(): Array<Ancestry> {
		let found: Array<Ancestry> = [];
		const ancestry = this.ancestry;
		const depth = ancestry.depth;
		for (const bidirectional of ancestry.bidirectional_ancestries) {
			for (const reciprocal of bidirectional.reciprocals) {
				if (reciprocal.depth < depth) {
					found.push(reciprocal);
					return found;
				}
			}
		}
		return found;
	}
	
}
