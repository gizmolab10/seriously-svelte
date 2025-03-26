import { debug, Point, Ancestry, G_TreeChild } from '../common/Global_Imports';

export default class G_TreeChildren {
	center = Point.zero;
	ancestry: Ancestry;

	// scratchpad for widgets, progeny_height and center

	constructor(ancestry: Ancestry) {
		this.ancestry = ancestry;
	}
		
	layout_allChildren() {
		const ancestry = this.ancestry;
		if (!!ancestry) {
			if (!ancestry.isExpanded && !ancestry.isRoot) {
				console.log(`not expanded, cannot layout ${ancestry.titles}`);
			} else {
				debug.log_origins(ancestry.g_widget.origin_ofWidget.x + ' children layout');
				const childAncestries = ancestry.childAncestries;
				const halfHeight = ancestry.visibleProgeny_halfHeight;
				const origin_ofWidget = ancestry.g_widget.origin_ofWidget.offsetByXY(4.5, halfHeight + 1);
				let height = -halfHeight;		// start out negative and grow positive
				for (const childAncestry of childAncestries) {
					const scratchpad = new G_TreeChild(height, origin_ofWidget, childAncestry);
					height += scratchpad.progeny_height;
				}
				this.center = origin_ofWidget.offsetByXY(20, 2);
			}
		}
	}

}