import { S_Element, G_TreeLine, G_TreeBranches } from '../common/Global_Imports';
import { k, ux, Rect, Size, Point, layout, Ancestry } from '../common/Global_Imports';
import { w_graph_rect, w_t_graph, w_device_isMobile} from '../common/Stores';
import { T_Widget, T_Element, T_Graph } from '../common/Global_Imports';
import { w_show_details, w_show_related } from '../common/Stores';
import { get } from 'svelte/store';

export default class G_Widget {
	g_bidirectionalLines: Array<G_TreeLine> = [];
	g_treeBranches: G_TreeBranches;
	origin_ofSubtree = Point.zero;
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
	subtree_height = 0;
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
		this.g_treeBranches = new G_TreeBranches(ancestry);
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
		const drag_width = layout.inTreeMode ? 0 : k.dot_size + radial_extra;
		return drag_width + reveal_width;
	}
	
	get origin(): Point {
		const isFocus = this.ancestry?.isFocus ?? false;
		const t_widget = layout.inTreeMode ? isFocus ? T_Widget.focus : T_Widget.tree : T_Widget.radial;
		switch (t_widget) {
			case T_Widget.radial: return this.origin_ofRadial;
			case T_Widget.focus:  return this.origin_ofWidget;
			default:			  return this.origin_ofSubtree;
		}
	}

	static readonly LAYOUT: unique symbol;

	layout_entireTree() {
		this.layout_focus_ofTree()
		this.recursively_layout_subtree();
		this.recursively_layout_bidirectionals();
	}

	layout_necklaceWidget(
		origin_ofWidget: Point,
		widget_pointsRight: boolean) {
			if (layout.inRadialMode) {
				this.forGraphMode = T_Graph.radial;
				this.origin_ofWidget = origin_ofWidget;
				this.widget_pointsRight = widget_pointsRight;
				this.layout_widget();
			}
	}

	layout_widget_forBranches(
		height: number = 0,
		origin: Point = Point.zero,
		forGraphMode = T_Graph.radial,
		points_toChild: boolean = true,
		widget_pointsRight: boolean = true) {
			if (forGraphMode == get(w_t_graph)) {	// assure modes match
				const subtree_height = this.ancestry.visibleSubtree_height();
				const branches_height = height + subtree_height / 2;
				const branches_rect = new Rect(origin, new Size(k.line_stretch, branches_height - 1));
				const branches_widget_origin = this.origin_forAncestry_inRect(this.ancestry, branches_rect);
				this.g_line.rect = branches_rect;
				this.forGraphMode = forGraphMode;
				this.subtree_height = subtree_height;
				this.points_toChild = points_toChild;
				this.origin_ofWidget = branches_widget_origin;
				this.widget_pointsRight = widget_pointsRight;
				this.g_line.set_t_curve_forHeight(branches_height);
				this.layout_widget_andChildren();
			}
	}

	static readonly INTERNAL: unique symbol;

	private layout_widget_andChildren() {
		this.g_treeBranches.layout_branches();		// noop if radial, childless or collapsed
		this.layout_widget();						// assumes all children's subtrees are laid out (needed for progeny size)
		this.layout_line();
		this.layout_focus();
	}

	private origin_forAncestry_inRect(ancestry: Ancestry, rect: Rect): Point {
		const branch = ancestry.thing;
		let x, y = 0;
		if (!!branch) {
			y = rect.extent.y - ancestry.visibleSubtree_halfHeight;
			x = rect.origin.x + branch.titleWidth + k.dot_size + k.line_stretch;
		}
		return new Point(x, y);
	}

	private recursively_layout_subtree(visited: Array<number> = []) {
		const ancestry = this.ancestry;	
		if (!visited.includes(ancestry.hid) && ancestry.show_branch_relationships) {
			const branchAncestries = ancestry.branchAncestries;
			for (const branchAncestry of branchAncestries) {
				branchAncestry.g_widget.recursively_layout_subtree([...visited, branchAncestry.hid]);		// layout progeny first
			}
		}
		this.layout_widget_andChildren();
	}

	private recursively_layout_bidirectionals(visited: Array<number> = []) {
		if (layout.inTreeMode && get(w_show_related)) {
			this.layout_bidirectional_lines();
			const ancestry = this.ancestry;	
			if (!visited.includes(ancestry.hid) && ancestry.show_branch_relationships) {
				const childAncestries = ancestry.childAncestries;
				for (const childAncestry of childAncestries) {
					childAncestry.g_widget.recursively_layout_bidirectionals([...visited, childAncestry.hid]);		// layout progeny first
				}
			}
		}
	}

	private layout_focus() {
		const ancestry = this.ancestry;
		const focus = ancestry.thing;
		if (!!focus && layout.inTreeMode && ancestry.isFocus) {
			const graph_rect = get(w_graph_rect);
			const offset_y = -1 - graph_rect.origin.y;
			const subtree_size = ancestry.visibleSubtree_size;
			const offset_x_ofReveal = focus?.titleWidth / 2 - 2;
			const offset_x_forDetails = (get(w_show_details) ? -k.width_details : 0);
			const offset_x = 15 + offset_x_forDetails - (subtree_size.width / 2) - (k.dot_size / 2.5) + offset_x_ofReveal;
			const origin_ofReveal = graph_rect.center.offsetByXY(offset_x, offset_y);
			this.origin_ofWidget = origin_ofReveal.offsetByXY(-21.5 - offset_x_ofReveal, -5);
		}
	}

	private layout_focus_ofTree() {
		const graphRect = get(w_graph_rect);
		if (!!graphRect && layout.inTreeMode) {
			const offsetY = graphRect.origin.y + 1;
			const subtree_size = this.ancestry.visibleSubtree_size;
			const offsetX_ofFirstReveal = (this.ancestry.thing?.titleWidth ?? 0) / 2 - 2;
			const branches_offsetY = (k.dot_size / 2) -(subtree_size.height / 2) - 4;
			const branches_offsetX = -37 + k.line_stretch - (k.dot_size / 2) + offsetX_ofFirstReveal;
			const offsetX = (get(w_show_details) ? -k.width_details : 0) + 15 + offsetX_ofFirstReveal - (subtree_size.width / 2) - (k.dot_size / 2.5);
			const origin_ofFocusReveal = graphRect.center.offsetByXY(offsetX, -offsetY);
			if (get(w_device_isMobile)) {
				origin_ofFocusReveal.x = 25;
			}
			const origin_ofChildren = origin_ofFocusReveal.offsetByXY(branches_offsetX, branches_offsetY);
			this.origin_ofWidget = origin_ofChildren;
		}
	}

	private layout_bidirectional_lines() {
		if (layout.inTreeMode) {
			this.g_bidirectionalLines = [];
			if (get(w_show_related)) {
				const g_lines = this.ancestry.g_lines_forBidirectionals;
				for (const [index, g_line] of g_lines.entries()) {
					this.g_bidirectionalLines[index] = g_line;
					g_line.layout_line();
				}
			}
		}
	}

	private layout_line() {
		const ancestry = this.ancestry;
		if (!!ancestry.thing && layout.inTreeMode) {
			const offset_ofChildrenTree = new Point(k.dot_size * 1.3, -(7 + k.dot_size / 15));
			this.origin_ofSubtree = this.g_line.rect.extent.offsetBy(offset_ofChildrenTree);
			this.g_line.layout_line();
		}
	}

	private layout_widget() {
		const ancestry = this.ancestry;
		if (!!ancestry.thing) {		// short-circuit mismatched graph mode
			const showingReveal = this.showingReveal;
			const showingBorder = !ancestry ? false : (ancestry.isGrabbed || ancestry.isEditing);
			const radial_x = this.widget_pointsRight ? 4 : k.dot_size * 3.5;
			const offset_ofTitle_forRadial = (this.widget_pointsRight ? 20 : (showingReveal ? 20 : 6));
			const widget_width = ancestry.thing.titleWidth + this.width_ofBothDots;
			const offset_forDirection = this.widget_pointsRight ? -7 : 34.5 - widget_width;
			const offset_forBorder = showingBorder ? 0 : 1;
			const drag_x_forLeft = (widget_width - (showingReveal ? 2.5 : 2));
			const drag_x = this.widget_pointsRight ? (layout.inRadialMode ? 3 : 2) : drag_x_forLeft;
			const drag_y = layout.inRadialMode ? 2.8 : 2.7;
			this.origin_ofTitle = Point.x(layout.inRadialMode ? offset_ofTitle_forRadial : k.dot_size + 5);
			this.origin_ofRadial = this.origin_ofWidget.offsetByXY(-radial_x, 4 - k.dot_size);
			this.center_ofDrag = new Point(drag_x, drag_y).offsetEquallyBy(k.dot_size / 2);
			this.offset_ofWidget = Point.x(offset_forDirection).offsetEquallyBy(offset_forBorder);
			this.width_ofWidget = widget_width;
			if (showingReveal) {
				const reveal_y = k.dot_size * 0.70;
				const offset_x_forPointsRight = widget_width - (layout.inRadialMode ? 21 : -1);
				const reveal_x = k.dot_size - (this.widget_pointsRight ? -offset_x_forPointsRight : 3);
				this.center_ofReveal = new Point(reveal_x, reveal_y);
			}
		}
	}
	
}
