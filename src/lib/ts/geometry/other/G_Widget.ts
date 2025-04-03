import { S_Element, G_TreeLine, G_TreeChildren } from '../../common/Global_Imports';
import { k, ux, Rect, Size, Point, Ancestry } from '../../common/Global_Imports';
import { w_graph_rect, w_t_graph, w_device_isMobile} from '../../common/Stores';
import { T_Widget, T_Element, T_Graph } from '../../common/Global_Imports';
import { w_show_details, w_show_related } from '../../common/Stores';
import { get } from 'svelte/store';

export default class G_Widget {
	g_bidirectionalLines: Array<G_TreeLine> = [];
	origin_ofChildrenTree = Point.zero;
	g_treeChildren: G_TreeChildren;
	offset_ofWidget = Point.zero;
	center_ofReveal = Point.zero;
	origin_ofRadial = Point.zero;
	origin_ofWidget = Point.zero;
	origin_ofTitle = Point.zero;
	center_ofDrag = Point.zero;
	widget_pointsRight = true;
	forGraphMode: T_Graph;
	points_toChild = true;
	es_widget!: S_Element;
	g_line!: G_TreeLine;
	ancestry!: Ancestry;
	progeny_height = 0;
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
		this.g_line = new G_TreeLine(ancestry.parentAncestry, ancestry);
		this.g_treeChildren = new G_TreeChildren(ancestry);
		this.forGraphMode = get(w_t_graph);
		this.ancestry = ancestry;
		if (!ancestry.thing) {
			console.log(`G_Widget ... ancestry has no thing ${ancestry.relationship?.description}`);
		}
	}

	static empty(ancestry: Ancestry) { return new G_Widget(ancestry); }
	get absolute_center_ofDrag(): Point { return this.center_ofDrag.offsetBy(this.origin); }
	get absolute_origin_ofTitle(): Point { return this.origin_ofTitle.offsetBy(this.origin); }
	get absolute_center_ofReveal(): Point { return this.center_ofReveal.offsetBy(this.origin); }
	get showingReveal(): boolean { return this.ancestry.showsReveal_forPointingToChild(this.points_toChild) ?? false; }

	get width_ofBothDots(): number {
		const reveal_width = this.showingReveal ? k.dot_size : 0;
		const radial_extra = this.widget_pointsRight ? 11 : -0.5;
		const drag_width = ux.inTreeMode ? 0 : k.dot_size + radial_extra;
		return drag_width + reveal_width;
	}
	
	get origin(): Point {
		const isFocus = this.ancestry?.isFocus ?? false;
		const t_widget = ux.inTreeMode ? isFocus ? T_Widget.focus : T_Widget.tree : T_Widget.radial;
		switch (t_widget) {
			case T_Widget.radial: return this.origin_ofRadial;
			case T_Widget.focus:  return this.origin_ofWidget;
			default:			  return this.origin_ofChildrenTree;
		}
	}

	origin_forAncestry_inRect(ancestry: Ancestry, rect: Rect): Point {
		const child = ancestry.thing;
		let x, y = 0;
		if (!!child) {
			y = rect.extent.y - ancestry.visibleProgeny_halfHeight;
			x = rect.origin.x + child.titleWidth + k.dot_size + k.line_stretch;
		}
		return new Point(x, y);
	}

	layout_tree_fromFocus() {
		const graphRect = get(w_graph_rect);
		if (!!graphRect && ux.inTreeMode) {
			const offsetY = graphRect.origin.y + 1;
			const childrenSize = this.ancestry.visibleProgeny_size;
			const offsetX_ofFirstReveal = (this.ancestry.thing?.titleWidth ?? 0) / 2 - 2;
			const child_offsetY = (k.dot_size / 2) -(childrenSize.height / 2) - 4;
			const child_offsetX = -37 + k.line_stretch - (k.dot_size / 2) + offsetX_ofFirstReveal;
			const offsetX = (get(w_show_details) ? -k.width_details : 0) + 15 + offsetX_ofFirstReveal - (childrenSize.width / 2) - (k.dot_size / 2.5);
			const origin_ofFocusReveal = graphRect.center.offsetByXY(offsetX, -offsetY);
			if (get(w_device_isMobile)) {
				origin_ofFocusReveal.x = 25;
			}
			const origin_ofChildren = origin_ofFocusReveal.offsetByXY(child_offsetX, child_offsetY);
			this.origin_ofWidget = origin_ofChildren;
			this.recursively_layout_subtree();
		}
	}

	layout_widget(
		height: number = 0,
		origin: Point = Point.zero,
		forGraphMode = T_Graph.radial,
		points_toChild: boolean = true,
		widget_pointsRight: boolean = true) {
			if (forGraphMode == get(w_t_graph)) {	// assure modes match
				const progeny_height = this.ancestry.visibleProgeny_height();
				const child_height = height + progeny_height / 2;
				const child_rect = new Rect(origin, new Size(k.line_stretch, child_height - 1));
				const child_widget_origin = this.origin_forAncestry_inRect(this.ancestry, child_rect);
				this.g_line.rect = child_rect;
				this.forGraphMode = forGraphMode;
				this.progeny_height = progeny_height;
				this.points_toChild = points_toChild;
				this.origin_ofWidget = child_widget_origin;
				this.widget_pointsRight = widget_pointsRight;
				this.g_line.set_t_curve_forHeight(child_height);
				this.layout();
			}
	}

	get description(): string {
		return `toRight: ${this.widget_pointsRight} origin: ${this.origin_ofTitle.x.toFixed(1)}`;
	}

	layout_necklaceWidget(
		origin_ofWidget: Point,
		widget_pointsRight: boolean) {
			if (ux.inRadialMode) {
				this.forGraphMode = T_Graph.radial;
				this.origin_ofWidget = origin_ofWidget;
				this.widget_pointsRight = widget_pointsRight;
				this.layout();
			}
	}

	layout() {
		this.g_treeChildren.layout_children();		// noop if radial, childless or collapsed
		this.layout_widget_andLine();				// assumes all children's subtrees are laid out (needed for progeny size)
		this.layout_bidirectional_lines();
	}

	private recursively_layout_subtree() {
		const ancestry = this.ancestry;	
		if (ancestry.showsChildRelationships && ancestry.thing_isChild) {
			const childAncestries = ancestry.childAncestries;
			for (const childAncestry of childAncestries) {
				childAncestry.g_widget.recursively_layout_subtree();		// layout progeny first
			}
		}
		this.layout();
	}

	private layout_widget_andLine() {
		const ancestry = this.ancestry;
		if (!!ancestry.thing) {		// short-circuit mismatched graph mode
			const showingReveal = this.showingReveal;
			const showingBorder = !ancestry ? false : (ancestry.isGrabbed || ancestry.isEditing);
			const radial_x = this.widget_pointsRight ? 4 : k.dot_size * 3.5;
			const offset_ofChildrenTree = new Point(k.dot_size * 1.3, -(7 + k.dot_size / 15));
			const offset_ofTitle_forRadial = (this.widget_pointsRight ? 20 : (showingReveal ? 20 : 6));
			const widget_width = ancestry.thing.titleWidth + this.width_ofBothDots;
			const offset_forDirection = this.widget_pointsRight ? -7 : 34.5 - widget_width;
			const offset_forBorder = showingBorder ? 0 : 1;
			const drag_x_forLeft = (widget_width - (showingReveal ? 2.5 : 2));
			const drag_x = this.widget_pointsRight ? (ux.inRadialMode ? 3 : 2) : drag_x_forLeft;
			const drag_y = ux.inRadialMode ? 2.8 : 2.7;
			this.origin_ofTitle = Point.x(ux.inRadialMode ? offset_ofTitle_forRadial : k.dot_size + 5);
			this.origin_ofRadial = this.origin_ofWidget.offsetByXY(-radial_x, 4 - k.dot_size);
			this.center_ofDrag = new Point(drag_x, drag_y).offsetEquallyBy(k.dot_size / 2);
			this.offset_ofWidget = Point.x(offset_forDirection).offsetEquallyBy(offset_forBorder);
			this.width_ofWidget = widget_width;
			if (showingReveal) {
				const reveal_y = k.dot_size * 0.70;
				const offset_x_forPointsRight = widget_width - (ux.inRadialMode ? 21 : -1);
				const reveal_x = k.dot_size - (this.widget_pointsRight ? -offset_x_forPointsRight : 3);
				this.center_ofReveal = new Point(reveal_x, reveal_y);
			}
			if (ux.inTreeMode) {
				this.origin_ofChildrenTree = this.g_line.rect.extent.offsetBy(offset_ofChildrenTree);
				this.g_line.layout();
				if (ancestry.isFocus) {
					const focus = ancestry.thing;
					const graph_rect = get(w_graph_rect);
					const offset_y = -1 - graph_rect.origin.y;
					const children_size = ancestry.visibleProgeny_size;
					const offset_x_ofReveal = focus?.titleWidth / 2 - 2;
					const offset_forDetails = (get(w_show_details) ? -k.width_details : 0);
					const offset_x = 15 + offset_forDetails - (children_size.width / 2) - (k.dot_size / 2.5) + offset_x_ofReveal;
					const origin_ofReveal = graph_rect.center.offsetByXY(offset_x, offset_y);
					this.origin_ofWidget = origin_ofReveal.offsetByXY(-21.5 - offset_x_ofReveal, -5);
				}
			}
		}
	}

	private layout_bidirectional_lines() {
		if (ux.inTreeMode) {
			this.g_bidirectionalLines = [];
			if (get(w_show_related)) {
				const g_lines = this.ancestry.g_lines_forBidirectionals;
				for (const [index, g_line] of g_lines.entries()) {
					this.g_bidirectionalLines[index] = g_line;
					g_line.layout();
				}
			}
		}
	}
	
}
