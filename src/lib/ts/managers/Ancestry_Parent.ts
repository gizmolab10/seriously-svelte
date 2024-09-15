import Ancestry from './Ancestry';

export default class Ancestry_Parent extends Ancestry {
	original!: Ancestry;

	constructor(ancestry: Ancestry) {
		super(ancestry.id, ancestry.idPredicate, false);
		this.original = ancestry;
	}
	
	// with isNormal = false, this fixes
	// paging state & cluster map lookups,
	// is visible & assureIsVisible_inClusters

	// what about:
	// relocate, focus
	// subscriptions
	// other mutations

	// needs:
	// invert relationship (swap parent and child)?
	// change predicate to isContainedBy?
	// onePage_from predicate and points out

}