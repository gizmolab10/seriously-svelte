import { debug, Point, Ancestry, G_Widget, G_TreeChild } from '../common/Global_Imports';

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
				console.log(`not expanded, cannot layout ${ancestry.description}`);
			} else {
				debug.log_origins(ancestry.g_widget.origin_ofChild.x + ' children layout');
				const childAncestries = ancestry.childAncestries;
				const height = ancestry.visibleProgeny_halfHeight + 1;
				const childrenOrigin = ancestry.g_widget.origin_ofChild.offsetByXY(4.5, height);
				let sum = -ancestry.visibleProgeny_height() / 2; // start out negative and grow positive
				for (const childAncestry of childAncestries) {
					const scratchpad = new G_TreeChild(sum, childrenOrigin, childAncestry);
					sum += scratchpad.progeny_height;
				}
				this.center = childrenOrigin.offsetByXY(20, 2);
			}
		}
	}

}