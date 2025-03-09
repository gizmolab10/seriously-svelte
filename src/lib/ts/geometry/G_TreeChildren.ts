import { debug, Point, Ancestry, G_Widget, G_TreeChild } from '../common/Global_Imports';

export default class G_TreeChildren {
	g_children_widgets: Array<G_Widget> = [];
	ancestry: Ancestry | null;
	g_tree_widget!: G_Widget;
	center = Point.zero;

	// scratchpad for ...

	constructor(g_tree_widget: G_Widget) {
		this.g_tree_widget = g_tree_widget;
		this.ancestry = g_tree_widget.ancestry;
	}
		
	layout_allChildren() {
		this.g_children_widgets = [];
		if (!!this.ancestry) {
			if (!this.ancestry.isExpanded && !this.ancestry.isRoot) {
				console.log(`not expanded, cannot layout ${this.ancestry.description}`);
			} else {
				debug.log_origins(this.g_tree_widget.origin_ofChild.x + ' children layout');
				const childAncestries = this.ancestry.childAncestries;
				const height = this.ancestry.visibleProgeny_halfHeight + 1;
				const childrenOrigin = this.g_tree_widget.origin_ofChild.offsetByXY(4.5, height);
				let sum = -this.ancestry.visibleProgeny_height() / 2; // start out negative and grow positive
				for (const childAncestry of childAncestries) {
					const scratchpad = new G_TreeChild(sum, childrenOrigin, childAncestry);
					this.g_children_widgets.push(scratchpad.g_child_widget);
					sum += scratchpad.progeny_height;
				}
				this.center = childrenOrigin.offsetByXY(20, 2);
			}
		}
	}

}