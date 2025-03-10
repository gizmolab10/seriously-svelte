import { k, ux, Rect, Size, Point, Angle, T_Line, Ancestry, S_Element, T_Element } from '../common/Global_Imports'
import { w_hierarchy, w_graph_rect, w_show_details, w_ancestry_focus } from '../common/Stores';
import { get } from 'svelte/store';

export default class G_Widget {
	origin_ofChildrenTree = Point.zero;
	origin_ofFirstReveal = Point.zero;
	angle_ofChild: number | null;
	offset_ofWidget = Point.zero;
	center_ofReveal = Point.zero;
	origin_ofRadial = Point.zero;
	origin_ofChild = Point.zero;
	origin_ofFocus = Point.zero;
	origin_ofTitle = Point.zero;
	center_ofDrag = Point.zero;
	ancestry: Ancestry | null;
	points_toChild = true;
	es_widget: S_Element;
	points_right = true;
	width_ofWidget = 0;
	curveType: string;
	rect: Rect;

	get responder(): HTMLElement | null { return this.es_widget.responder; }

	// single source of truth for widget's
	//
	// width (computed here)
	// UX state (fill, border) 
	// relevant ancestries (children, thing, shows reveal)
	// location of dots, title
	//  child tree
	//  radial origin, angles and orientations (in/out, right/left)

	constructor(
		rect: Rect,
		curveType: string,
		ancestry: Ancestry,
		origin_ofChild: Point,
		points_toChild: boolean = true,
		angle_ofChild: number | null = null) {
			this.rect = rect;
			this.points_right = !angle_ofChild ? true : new Angle(angle_ofChild).angle_pointsRight;
			this.es_widget = ux.s_element_for(ancestry, T_Element.widget, k.empty);
			this.points_toChild = points_toChild;
			this.origin_ofChild = origin_ofChild;
			this.angle_ofChild = angle_ofChild;
			this.curveType = curveType;
			this.ancestry = ancestry;
			if (!ancestry?.thing) {
				console.log(`geometry G_Widget ... relationship has no child ${ancestry?.relationship?.description}`);
			}
			this.layout();
	}

	destroy() { this.ancestry = null; }
	static empty(ancestry: Ancestry) { return new G_Widget(Rect.zero, T_Line.flat, ancestry, Point.zero); }
	get showingReveal(): boolean { return this.ancestry?.showsReveal_forPointingToChild(this.points_toChild) ?? false; }

	get width_ofBothDots(): number {
		const adjustment_forReveal = k.dot_size * (this.showingReveal ? 2 : 1);
		const adjustment_forRadial = ux.inTreeMode ? -13.5 : (this.points_right ? 11 : -0.5);
		return adjustment_forReveal + adjustment_forRadial;
	}

	relayout_recursively() {
		this.layout();
		if (ux.inTreeMode) {
			const ancestry = this.ancestry;
			if (!!ancestry && ancestry.showsChildRelationships) {
				for (const childAncestry of ancestry.childAncestries) {
					childAncestry.g_widget.relayout_recursively();
				}
			}
		}
	}

	layout() {
		const ancestry = this.ancestry;
		if (!!ancestry?.thing) {
			const showingReveal = this.showingReveal;
			const showingBorder = !ancestry ? false : (ancestry.isGrabbed || ancestry.isEditing);
			const x_radial = this.points_right ? 4 : k.dot_size * 3.5;
			const offset_ofChildrenTree = new Point(k.dot_size * 1.3, -(7 + k.dot_size / 15));
			const offset_ofTitle_forRadial = (this.points_right ? 15 : (showingReveal ? 16 : 3));
			const adjustment_forBorder = showingBorder ? 0 : 1;
			const width = ancestry.thing.titleWidth + this.width_ofBothDots;
			const adjustment_forDirection = this.points_right ? 7 : width - 34.5;
			const adjustment_x = adjustment_forBorder - adjustment_forDirection;
			const x_drag = this.points_right ? (!ux.inTreeMode ? 3 : 2) : (width - (showingReveal ? 2.5 : 2));
			const y_drag = !ux.inTreeMode ? 2.8 : 2.7;
			this.origin_ofTitle = new Point(!ux.inTreeMode ? offset_ofTitle_forRadial : 12.5, 0);
			this.origin_ofRadial = this.origin_ofChild.offsetByXY(-x_radial, 4 - k.dot_size);
			this.origin_ofChildrenTree = this.rect.extent.offsetBy(offset_ofChildrenTree);
			this.center_ofDrag = new Point(x_drag, y_drag).offsetEquallyBy(k.dot_size / 2);
			this.offset_ofWidget = new Point(adjustment_x, adjustment_forBorder);
			this.width_ofWidget = width;
			if (showingReveal) {
				const y_reveal = k.dot_size * 0.72;
				const x_reveal = k.dot_size - (!this.points_right ? 3 : (!ux.inTreeMode ? 21 : -1) - this.width_ofWidget);
				this.center_ofReveal = new Point(x_reveal, y_reveal);
			}
			if (ux.inTreeMode && ancestry.isFocus) {
				const graphRect = get(w_graph_rect);
				const childrenSize = ancestry.visibleProgeny_size;
				const focus = ancestry.thing ?? get(w_hierarchy).root;
				const offsetX_ofFirstReveal = focus?.titleWidth / 2 - 2;
				const offsetY = -1 - graphRect.origin.y;
				const offsetX = 15 + (get(w_show_details) ? -k.width_details : 0) - (childrenSize.width / 2) - (k.dot_size / 2.5) + offsetX_ofFirstReveal;
				this.origin_ofFirstReveal = graphRect.center.offsetByXY(offsetX, offsetY);
				this.origin_ofFocus = this.origin_ofFirstReveal.offsetByXY(-21.5 - offsetX_ofFirstReveal, -5);
			}
		}
	}
	
}
