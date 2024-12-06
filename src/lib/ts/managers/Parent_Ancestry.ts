import Ancestry from './Ancestry';

export default class Parent_Ancestry extends Ancestry {
	original!: Ancestry;

	constructor(ancestry: Ancestry) {
		super(ancestry.dbType, ancestry.id, ancestry.idPredicate, false);	// isParental = false
		this.original = ancestry;
	}

	becomeFocus(): boolean {
		return this.original.becomeFocus()
	}
	
	// with isParental = false, this fixes
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