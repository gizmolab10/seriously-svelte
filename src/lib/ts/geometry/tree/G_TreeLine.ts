import { Rect, T_Curve, Ancestry } from '../../common/Global_Imports';

export default class G_TreeLine {
	curveType: string = T_Curve.flat;
	parent_ancestry: Ancestry;
	child_ancestry: Ancestry;
	rect = Rect.zero;

	// scratchpad for lines drawn between widgets and their {children OR reciprocal} widgets

	constructor(child_ancestry: Ancestry, parent_ancestry: Ancestry) {
		this.parent_ancestry = parent_ancestry;
		this.child_ancestry = child_ancestry;
	}
		
	layout() {
		const ancestry = this.child_ancestry;
		if (!!ancestry) {
		}
	}

}