import { debug, Point, Ancestry, T_Graph } from '../../common/Global_Imports';

export default class G_TreeChildren {
	center = Point.zero;
	ancestry: Ancestry;

	// scratchpad for widgets, progeny_height and center

	constructor(ancestry: Ancestry) {
		this.ancestry = ancestry;
	}
		
	layout_children() {
		const ancestry = this.ancestry;
		if (!!ancestry && ancestry.isExpanded|| ancestry.isRoot) {
			debug.log_layout(`children ${ancestry.g_widget.origin_ofWidget.x} ${ancestry.id}`);
			const childAncestries = ancestry.childAncestries;
			const halfHeight = ancestry.visibleProgeny_halfHeight;
			const origin_ofWidget = ancestry.g_widget.origin_ofWidget.offsetByXY(4.5, halfHeight + 1);
			let height = -halfHeight;		// start out negative and grow positive
			for (const childAncestry of childAncestries) {
				const g_widget = childAncestry.g_widget;
				g_widget.layout_widget(height, origin_ofWidget, true, T_Graph.tree)
				height += g_widget.progeny_height;
			}
			this.center = origin_ofWidget.offsetByXY(20, 2);
		}
	}

}