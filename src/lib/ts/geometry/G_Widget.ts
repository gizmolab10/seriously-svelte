import { k, ux, Rect, Point, Angle, T_Line, Ancestry, S_Element, T_Element } from '../common/Global_Imports'
import { w_hierarchy, w_graph_rect, w_show_details } from '../common/Stores';
import { get } from 'svelte/store';

export default class G_Widget {
	angle_ofChild: number | null = null;
	origin_ofChildrenTree = Point.zero;
	curveType: string = T_Line.flat;
	offset_ofWidget = Point.zero;
	center_ofReveal = Point.zero;
	origin_ofRadial = Point.zero;
	origin_ofChild = Point.zero;
	origin_ofFocus = Point.zero;
	origin_ofTitle = Point.zero;
	center_ofDrag = Point.zero;
	ancestry: Ancestry | null;
	points_toChild = true;
	es_widget!: S_Element;
	points_right = true;
	width_ofWidget = 0;
	rect = Rect.zero;

	get responder(): HTMLElement | null { return this.es_widget.responder; }

	// single source of truth for widget's
	//
	// width (computed here)
	// UX state (fill, border) 
	// relevant ancestries (children, thing, shows reveal)
	// location of dots, title
	//  child tree
	//  radial origin, angles and orientations (in/out, right/left)

	constructor( ancestry: Ancestry) {
		this.es_widget = ux.s_element_for(ancestry, T_Element.widget, k.empty);
		this.ancestry = ancestry;
		if (!ancestry?.thing) {
			console.log(`G_Widget ... ancestry has no thing ${ancestry?.relationship?.description}`);
		}
		this.layout();
	}

	destroy() { this.ancestry = null; }
	static empty(ancestry: Ancestry) { return new G_Widget(ancestry); }
	get showingReveal(): boolean { return this.ancestry?.showsReveal_forPointingToChild(this.points_toChild) ?? false; }

	get width_ofBothDots(): number {
		const adjustment_forReveal = k.dot_size * (this.showingReveal ? 2 : 1);
		const adjustment_forRadial = ux.inTreeMode ? -13.5 : (this.points_right ? 11 : -0.5);
		return adjustment_forReveal + adjustment_forRadial;
	}

	update(
		rect: Rect = Rect.zero,
		points_toChild: boolean = true,
		curveType: string = T_Line.flat,
		origin_ofChild: Point = Point.zero,
		angle_ofChild: number | null = null) {
			this.rect = rect;
			this.points_right = !angle_ofChild ? true : new Angle(angle_ofChild).angle_pointsRight;
			this.points_toChild = points_toChild;
			this.origin_ofChild = origin_ofChild;
			this.angle_ofChild = angle_ofChild;
			this.curveType = curveType;
			this.layout();
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
	
}
