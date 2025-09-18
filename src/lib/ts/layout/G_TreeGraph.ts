import { w_depth_limit, w_graph_rect, w_show_details } from "../managers/Stores";
import { w_ancestry_focus, w_device_isMobile } from "../managers/Stores";
import { k, Rect, Ancestry, G_Widget, debug} from "../common/Global_Imports";
import { get } from "svelte/store";

export default class G_TreeGraph {
	focus!: Ancestry;

	constructor() {
		w_ancestry_focus.subscribe((focus: Ancestry) => {
			if (!!focus) {
				this.focus = focus;
			}
		});
	}

	get g_focus(): G_Widget | undefined { return this.focus?.g_widget; }

	grand_layout_tree() {
		const graph_rect = get(w_graph_rect);
		const depth_limit = get(w_depth_limit) ?? 1;
		if (!!graph_rect && !!this.g_focus) {
			this.layout_focus_ofTree(graph_rect);
			this.g_focus.debug('-');
			this.g_focus.layout_each_generation_recursively(depth_limit);
			this.g_focus.layout_each_bidirectional_generation_recursively(depth_limit);
			this.adjust_focus_ofTree(graph_rect);
		}
	}

	get visible_g_widgets(): G_Widget[] {
		let array: G_Widget[] = [];
		if (!!this.focus) {
			this.focus.traverse((ancestry: Ancestry) => {
				if (ancestry.isVisible) {
					array.push(ancestry.g_widget);
				}
				return false;
			});
		}
		return array;
	}

	static readonly _____PRIVATE: unique symbol;

	private adjust_focus_ofTree(graph_rect: Rect) {
		if (!!this.g_focus) {
			const y_offset = -1 - graph_rect.origin.y;
			const subtree_size = this.focus.size_ofVisibleSubtree;
			const x_offset_ofReveal = (this.focus.thing?.width_ofTitle ?? 0) / 2 - 2;
			const x_offset_forDetails = (get(w_show_details) ? -k.width.details : 0);
			const x_offset = 15 + x_offset_forDetails - (subtree_size.width / 2) - (k.height.dot / 2.5) + x_offset_ofReveal;
			const origin_ofFocusReveal = graph_rect.center.offsetByXY(x_offset, y_offset);
			this.g_focus.origin_ofWidget = origin_ofFocusReveal.offsetByXY(-21.5 - x_offset_ofReveal, -5);
		}
	}

	private layout_focus_ofTree(graph_rect: Rect) {
		const y_offset = graph_rect.origin.y;
		const subtree_size = this.focus.size_ofVisibleSubtree;
		const x_offset_ofFirstReveal = (this.focus.thing?.width_ofTitle ?? 0) / 2 - 2;
		const y_offset_ofBranches = (k.height.dot / 2) -(subtree_size.height / 2) - 4;
		const x_offset_ofBranches = -8 - k.height.dot + x_offset_ofFirstReveal;
		const x_offset = (get(w_show_details) ? -k.width.details : 0) + 15 + x_offset_ofFirstReveal - (subtree_size.width / 2) - (k.height.dot / 2.5);
		const origin_ofFocusReveal = graph_rect.center.offsetByXY(x_offset, -y_offset);
		if (get(w_device_isMobile)) {
			origin_ofFocusReveal.x = 25;
		}
		// need this for laying out branches, but it is wrong for final positioning
		// TODO: dunno why, must fix
		if (!!this.g_focus) {
			this.g_focus.origin_ofWidget = origin_ofFocusReveal.offsetByXY(x_offset_ofBranches, y_offset_ofBranches);
		}
	}

}

export let g_tree = new G_TreeGraph();
