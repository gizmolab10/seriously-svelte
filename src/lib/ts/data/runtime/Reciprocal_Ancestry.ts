import Ancestry from './Ancestry';

export default class Reciprocal_Ancestry extends Ancestry {
	original_ancestry!: Ancestry;

	constructor(original_ancestry: Ancestry) {
		super(original_ancestry.t_database, original_ancestry.pathString, original_ancestry.kindPredicate, false);
		this.original_ancestry = original_ancestry;
		this.thing_isChild = false;
	}

	get depth(): number { return this.original_ancestry.depth; }
	becomeFocus(): boolean { return this.original_ancestry.becomeFocus(); }
	
	// with thing_isChild = false, this fixes
	// paging state & cluster map lookups,
	// is visible & assureIsVisible_inClusters
	// needed becomeFocus

	// what about:
	// relocate, grab
	// subscriptions
	// other mutations

	// needs:
	// change predicate from contains to isContainedBy?
	// invert relationship (swap parent and child)?
	// onePage_from predicate and points out

}