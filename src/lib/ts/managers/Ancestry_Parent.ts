import Ancestry from './Ancestry';

export default class Ancestry_Parent extends Ancestry {
	original!: Ancestry;

	constructor(ancestry: Ancestry) {
		super(ancestry.id, ancestry.idPredicate, false);
		this.original = ancestry;
	}

	becomeFocus(): boolean {
		return this.original.becomeFocus()
	}
	
	// with isNormal = false, this fixes
	// paging state & cluster map lookups,
	// is visible & assureIsVisible_inClusters
	// needed becomeFocus

	// what about:
	// relocate, grab
	// subscriptions
	// other mutations

	// needs:
	// invert relationship (swap parent and child)?
	// change predicate to isContainedBy?
	// onePage_from predicate and points out

}