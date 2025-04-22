import { k, ux, Rect, Size, Point, layout, Ancestry } from '../common/Global_Imports';
import { S_Element, G_Cluster, G_TreeLine, G_TreeBranches } from '../common/Global_Imports';
import { w_graph_rect, w_t_graph, w_device_isMobile} from '../common/Stores';
import { T_Widget, T_Element, T_Graph } from '../common/Global_Imports';
import { w_show_details, w_show_related } from '../common/Stores';
import { get } from 'svelte/store';

export default class G_Widget {
	g_bidirectionalLines: Array<G_TreeLine> = [];
	g_parentBranches: G_TreeBranches;
	g_childBranches: G_TreeBranches;
	center_ofReveal = Point.zero;
	offset_ofWidget = Point.zero;
	origin_ofWidget = Point.zero;
	origin_ofRadial = Point.zero;
	origin_ofTrunk = Point.zero;
	origin_ofTitle = Point.zero;
	center_ofDrag = Point.zero;
	widget_pointsRight = true;
	forGraphMode: T_Graph;
	points_toChild = true;
	es_widget!: S_Element;
	g_cluster!: G_Cluster;
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
		this.g_parentBranches = new G_TreeBranches(ancestry, false);
		this.g_childBranches = new G_TreeBranches(ancestry);
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

	get t_widget(): T_Widget {
		const isFocus = this.ancestry?.isFocus ?? false;
		return layout.inTreeMode ? isFocus ? T_Widget.focus : T_Widget.tree : T_Widget.radial;
	}
	
	get origin(): Point {
		switch (this.t_widget) {
			case T_Widget.radial: return this.origin_ofRadial;
			case T_Widget.focus:  return this.origin_ofWidget;	// tree focus
			default:			  return this.origin_ofTrunk;
		}
	}

	static readonly LAYOUT: unique symbol;

	layout_entireTree() {		// misses every Widget.layout
		this.layout_focus_ofTree()
		this.recursively_layout_subtree();
		this.recursively_layout_bidirectionals();
	}

	layout_necklaceWidget(
		rotated_origin: Point,
		widget_pointsRight: boolean) {
			if (layout.inRadialMode) {
				this.forGraphMode = T_Graph.radial;
				this.origin_ofWidget = rotated_origin;
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
				const branching_widget_origin = this.origin_forAncestry_inRect(this.ancestry, branches_rect);
				this.g_line.rect = branches_rect;
				this.forGraphMode = forGraphMode;
				this.subtree_height = subtree_height;
				this.points_toChild = points_toChild;
				this.widget_pointsRight = widget_pointsRight;
				this.origin_ofWidget = branching_widget_origin;
				this.g_line.set_t_curve_forHeight(branches_height);
				this.layout_widget_andChildren();
			}
	}

	static readonly INTERNAL: unique symbol;

	private layout_widget_andChildren() {
		this.g_parentBranches.layout_branches();	// noop if radial, parentless or collapsed
		this.g_childBranches.layout_branches();		// noop if radial, childless or collapsed
		this.layout_widget();						// assumes all children's subtrees are laid out (needed for progeny size)
		this.layout_treeLine();
		this.layout_focus();
	}

	private origin_forAncestry_inRect(ancestry: Ancestry, rect: Rect): Point {
		const branch = ancestry.thing;
		let x, y = 0;
		if (!!branch) {
			y = rect.extent.y - ancestry.visibleSubtree_halfHeight;
			x = rect.origin.x + branch.width_ofTitle + k.dot_size + k.line_stretch;
		}
		return new Point(x, y);
	}

	private recursively_layout_subtree(visited: Array<number> = []) {
		const ancestry = this.ancestry;	
		if (!visited.includes(ancestry.hid) && ancestry.shows_branches) {
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
			if (!visited.includes(ancestry.hid) && ancestry.shows_branches) {
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
			const x_offset_ofReveal = focus?.width_ofTitle / 2 - 2;
			const x_offset_forDetails = (get(w_show_details) ? -k.width_details : 0);
			const x_offset = 15 + x_offset_forDetails - (subtree_size.width / 2) - (k.dot_size / 2.5) + x_offset_ofReveal;
			const origin_ofReveal = graph_rect.center.offsetByXY(x_offset, offset_y);
			this.origin_ofWidget = origin_ofReveal.offsetByXY(-21.5 - x_offset_ofReveal, -5);
		}
	}

	private layout_focus_ofTree() {
		const graphRect = get(w_graph_rect);
		if (!!graphRect && layout.inTreeMode) {
			const offsetY = graphRect.origin.y + 1;
			const subtree_size = this.ancestry.visibleSubtree_size;
			const offsetX_ofFirstReveal = (this.ancestry.thing?.width_ofTitle ?? 0) / 2 - 2;
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
					g_line.update_svg_andName();
				}
			}
		}
	}

	private layout_treeLine() {
		const ancestry = this.ancestry;
		if (!!ancestry.thing && layout.inTreeMode) {
			const dot_size = k.dot_size;
			const offset_ofBranch = new Point(dot_size * 1.3, -(7 + dot_size / 15));
			this.origin_ofTrunk = this.g_line.rect.extent.offsetBy(offset_ofBranch);
			this.g_line.update_svg_andName();
		}
	}

	private layout_widget() {
		const ancestry = this.ancestry;
		if (!!ancestry.thing) {		// short-circuit mismatched graph mode
			const dot_size = k.dot_size;
			const show_reveal = this.showingReveal;
			const widget_pointsRight = this.widget_pointsRight;
			const width_ofReveal = show_reveal ? dot_size : 0;
			const width_ofDrag = (dot_size * 2) + (layout.inTreeMode ? -4 : 2);
			const width_ofWidget = ancestry.thing.width_ofTitle + width_ofDrag + width_ofReveal;
			const x_ofDrag_forPointsLeft = width_ofWidget - dot_size - 3 + (show_reveal ? 0.5 : 0);
			const x_ofDrag = widget_pointsRight ? (layout.inRadialMode ? 3 : 2) : x_ofDrag_forPointsLeft;
			const y_ofDrag = 2.7 + (layout.inRadialMode ? 0.1 : 0);
			const origin_ofDrag = new Point(x_ofDrag, y_ofDrag);
			const x_ofRadial = widget_pointsRight ? -4 : -dot_size;
			const x_offset_ofWidget = widget_pointsRight ? -7 : 6 + dot_size - width_ofWidget;
			const x_ofRadial_title = (widget_pointsRight ? 20 : (show_reveal ? 20 : 6));
			const show_border = !ancestry ? false : (ancestry.isGrabbed || ancestry.isEditing);
			this.origin_ofTitle = Point.x(layout.inRadialMode ? x_ofRadial_title : dot_size + 5);
			this.offset_ofWidget = Point.square(show_border ? 0 : 1).offsetByX(x_offset_ofWidget);
			this.origin_ofRadial = this.origin_ofWidget.offsetByXY(x_ofRadial, 4 - dot_size);
			this.center_ofDrag = origin_ofDrag.offsetEquallyBy(dot_size / 2);
			this.width_ofWidget = width_ofWidget;
			if (show_reveal) {
				const y_ofReveal = dot_size * 0.7;
				const x_offset_forPointsRight = (layout.inRadialMode ? 0 : 1) + width_ofWidget - dot_size - 10;
				const x_ofReveal = dot_size + (widget_pointsRight ? x_offset_forPointsRight : -3);
				this.center_ofReveal = new Point(x_ofReveal, y_ofReveal);
			}
		}
	}
	
}
