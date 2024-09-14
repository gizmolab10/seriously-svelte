import { Ancestry } from '../common/Global_Imports';

export default class Ancestry_Parent extends Ancestry {
	original!: Ancestry;

	constructor(ancestry: Ancestry) {
		super(ancestry.id, ancestry.idPredicate, false);
		this.original = ancestry;
	}
	
	// with points_out = false, this fixes
	// paging state & cluster map lookups,
	// is visible & assureIsVisible_inClusters

	// what about:
	// relocate, focus
	// subscriptions
	// other mutations

}