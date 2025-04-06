import { debug, Point, layouts, Ancestry, T_Graph } from '../../common/Global_Imports';

export default class G_TreeChildren {
	origin_ofLine = Point.zero;
	ancestry: Ancestry;

	// scratchpad for widgets, progeny_height and center

	constructor(ancestry: Ancestry) {
		this.ancestry = ancestry;
	}
		
	layout_children() {
		const ancestry = this.ancestry;
		if (!!ancestry && (ancestry.isExpanded || ancestry.isRoot) && layouts.inTreeMode) {
			debug.log_layout(`children ${ancestry.g_widget.origin_ofWidget.x} ${ancestry.id}`);
			const childAncestries = ancestry.childAncestries;
			const halfHeight = ancestry.visibleProgeny_halfHeight;
			const origin_ofWidget = ancestry.g_widget.origin_ofWidget.offsetByXY(4.5, halfHeight + 1);
			let height = -halfHeight;		// start out negative and grow positive
			for (const childAncestry of childAncestries) {
				const g_widget = childAncestry.g_widget;
				g_widget.layout_widget(height, origin_ofWidget, T_Graph.tree)
				height += g_widget.progeny_height;
			}
			this.origin_ofLine = origin_ofWidget.offsetByXY(20, 2);
		}
	}

}