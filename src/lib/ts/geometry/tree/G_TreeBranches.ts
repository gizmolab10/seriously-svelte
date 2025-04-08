import { debug, Point, layout, Ancestry, T_Graph } from '../../common/Global_Imports';

export default class G_TreeBranches {
	origin_ofLine = Point.zero;
	ancestry: Ancestry;

	// scratchpad for widgets, progeny_height and center

	constructor(ancestry: Ancestry) {
		this.ancestry = ancestry;
	}
		
	layout_branches() {
		const ancestry = this.ancestry;
		if (!!ancestry && (ancestry.isExpanded || ancestry.isRoot) && layout.inTreeMode) {
			debug.log_layout(`children ${ancestry.g_widget.origin_ofWidget.x} ${ancestry.id}`);
			const branchAncestries = ancestry.branchAncestries;
			const halfHeight = ancestry.visibleSubtree_halfHeight;
			const origin_ofWidget = ancestry.g_widget.origin_ofWidget.offsetByXY(4.5, halfHeight + 1);
			let height = -halfHeight;		// start out negative and grow positive
			for (const branchAncestry of branchAncestries) {
				if (branchAncestry.depth > ancestry.depth) {
					const g_widget = branchAncestry.g_widget;
					g_widget.configure_widget(height, origin_ofWidget, T_Graph.tree)
					height += g_widget.progeny_height;
				}
			}
			this.origin_ofLine = origin_ofWidget.offsetByXY(20, 2);
		}
	}

}