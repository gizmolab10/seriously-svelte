import Ancestry from './Ancestry';

export default class Parent_Ancestry extends Ancestry {
	ancestry_inReverse!: Ancestry;

	constructor(ancestry: Ancestry) {
		super(ancestry.t_database, ancestry.id, ancestry.kindPredicate, false);
		this.ancestry_inReverse = ancestry;
		this.thing_isChild = false;
	}

	get depth(): number { return this.ancestry_inReverse.depth; }
	becomeFocus(): boolean { return this.ancestry_inReverse.becomeFocus(); }
	
	// with thing_isChild = false, this fixes
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