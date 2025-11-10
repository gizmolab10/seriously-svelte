import { k, p, x, show, Rect, debug, layout, Ancestry, G_Widget, T_Kinship} from "../common/Global_Imports";
import { w_ancestry_focus, w_device_isMobile } from "../state/State";
import { get } from "svelte/store";

export default class G_TreeGraph {
	attached_branches: string[] = [];
	focus!: Ancestry;

	constructor() {
		w_ancestry_focus.subscribe((focus: Ancestry) => {
			if (!!focus) {
				this.focus = focus;
			}
		});
	}

	grand_layout_tree() {
		const rect_ofGraphView = get(layout.w_rect_ofGraphView);
		const depth_limit = get(show.w_depth_limit) ?? 1;
		if (!!rect_ofGraphView && !!this.g_focus) {
			this.layout_focus_ofTree(rect_ofGraphView); 
			this.g_focus.layout_each_generation_recursively(depth_limit);
			this.g_focus.layout_each_bidirectional_generation_recursively(depth_limit);
			this.adjust_focus_ofTree(rect_ofGraphView);
		}
	}

	get g_focus(): G_Widget | undefined { return this.focus?.g_widget; }

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

	increase_depth_limit_by(increment: number) {
		show.w_depth_limit.update(a => a + increment);
		layout.grand_layout();
	}

	reset_scanOf_attached_branches() {
		debug.log_draw('TREE', 'reset scan');
		this.attached_branches = [];
		return true;	// tell svelte to reattach the tree
	}

	branch_isAlready_attached(ancestry: Ancestry): boolean {
		const visited = this.attached_branches.includes(ancestry.id);
		if (!visited) {
			this.attached_branches.push(ancestry.id);
		}
		return visited;
	}

	set_tree_types(t_trees: Array<T_Kinship>) {
		if (t_trees.length == 0) {
			t_trees = [T_Kinship.children];
		}
		show.w_tree_ofType.set(t_trees);
		x.update_forFocus();
		show.w_related.set(t_trees.includes(T_Kinship.related));
		p.restore_expanded();
		layout.grand_build();
	}

	static readonly _____PRIVATE: unique symbol;

	private adjust_focus_ofTree(rect_ofGraphView: Rect) {
		if (!!this.g_focus) {
			const y_offset = -1 - rect_ofGraphView.origin.y;
			const subtree_size = this.focus.size_ofVisibleSubtree;
			const x_offset_ofReveal = (this.focus.thing?.width_ofTitle ?? 0) / 2 - 2;
			const x_offset_forDetails = (get(show.w_details) ? -k.width.details : 0);
			const x_offset = 15 + x_offset_forDetails - (subtree_size.width / 2) - (k.height.dot / 2.5) + x_offset_ofReveal;
			const origin_ofFocusReveal = rect_ofGraphView.center.offsetByXY(x_offset, y_offset);
			this.g_focus.origin_ofWidget = origin_ofFocusReveal.offsetByXY(-21.5 - x_offset_ofReveal, -5);
		}
	}

	private layout_focus_ofTree(rect_ofGraphView: Rect) {
		const y_offset = rect_ofGraphView.origin.y;
		const subtree_size = this.focus.size_ofVisibleSubtree;
		const x_offset_ofFirstReveal = (this.focus.thing?.width_ofTitle ?? 0) / 2 - 2;
		const y_offset_ofBranches = (k.height.dot / 2) -(subtree_size.height / 2) - 4;
		const x_offset_ofBranches = -8 - k.height.dot + x_offset_ofFirstReveal;
		const x_offset = (get(show.w_details) ? -k.width.details : 0) + 15 + x_offset_ofFirstReveal - (subtree_size.width / 2) - (k.height.dot / 2.5);
		const origin_ofFocusReveal = rect_ofGraphView.center.offsetByXY(x_offset, -y_offset);
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

export const g_tree = new G_TreeGraph();
