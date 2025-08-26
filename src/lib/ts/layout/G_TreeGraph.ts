import { w_depth_limit, w_graph_rect, w_show_details } from "../managers/Stores";
import { w_ancestry_focus, w_device_isMobile } from "../managers/Stores";
import { k, Rect} from "../common/Global_Imports";
import { get } from "svelte/store";

export default class G_TreeGraph {
	rect_ofTree = Rect.zero;

	grand_layout_tree() {
		const depth_limit = get(w_depth_limit);
		const ancestry = get(w_ancestry_focus);
		const g_widget = ancestry?.g_widget;
		if (!!g_widget) {
			this.layout_focus_ofTree();
			g_widget.recursively_layout_subtree(depth_limit);
			g_widget.recursively_layout_bidirectionals(depth_limit);
			this.adjust_focus_ofTree();
			this.update_rect_ofTree();
		}
	}

	static readonly _____PRIVATE: unique symbol;

	private update_rect_ofTree() {
		const ancestry = get(w_ancestry_focus);
		const g_widget = ancestry?.g_widget;
		const size = ancestry.size_ofVisibleSubtree.expandedByX(40);
		const origin = g_widget.origin_ofWidget.offsetByXY(3, k.height.row - size.height / 2);
		this.rect_ofTree = new Rect(origin, size);
	}

	private adjust_focus_ofTree() {
		const graph_rect = get(w_graph_rect);
		const ancestry = get(w_ancestry_focus);
		const g_widget = ancestry?.g_widget;
		if (!!graph_rect && !!ancestry && !!g_widget) {
			const y_offset = -1 - graph_rect.origin.y;
			const subtree_size = ancestry.size_ofVisibleSubtree;
			const x_offset_ofReveal = (ancestry.thing?.width_ofTitle ?? 0) / 2 - 2;
			const x_offset_forDetails = (get(w_show_details) ? -k.width.details : 0);
			const x_offset = 15 + x_offset_forDetails - (subtree_size.width / 2) - (k.height.dot / 2.5) + x_offset_ofReveal;
			const origin_ofFocusReveal = graph_rect.center.offsetByXY(x_offset, y_offset);
			g_widget.origin_ofWidget = origin_ofFocusReveal.offsetByXY(-21.5 - x_offset_ofReveal, -5);
		}
	}

	private layout_focus_ofTree() {
		const ancestry = get(w_ancestry_focus);
		const graph_rect = get(w_graph_rect);
		const g_widget = ancestry?.g_widget;
		if (!!graph_rect && !!g_widget) {
			const y_offset = graph_rect.origin.y;
			const subtree_size = ancestry.size_ofVisibleSubtree;
			const x_offset_ofFirstReveal = (ancestry.thing?.width_ofTitle ?? 0) / 2 - 2;
			const y_offset_ofBranches = (k.height.dot / 2) -(subtree_size.height / 2) - 4;
			const x_offset_ofBranches = -8 - k.height.dot + x_offset_ofFirstReveal;
			const x_offset = (get(w_show_details) ? -k.width.details : 0) + 15 + x_offset_ofFirstReveal - (subtree_size.width / 2) - (k.height.dot / 2.5);
			const origin_ofFocusReveal = graph_rect.center.offsetByXY(x_offset, -y_offset);
			if (get(w_device_isMobile)) {
				origin_ofFocusReveal.x = 25;
			}
			// need this for laying out branches, but it is wrong for final positioning
			// TODO: dunno why, must fix
			g_widget.origin_ofWidget = origin_ofFocusReveal.offsetByXY(x_offset_ofBranches, y_offset_ofBranches);
		}
	}

}

export let tree = new G_TreeGraph();
