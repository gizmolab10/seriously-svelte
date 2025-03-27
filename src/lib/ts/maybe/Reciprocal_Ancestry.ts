import { w_ancestry_focus } from '../../common/Stores';
import { c, k, u } from '../../common/Global_Imports';
import { get } from 'svelte/store';
import Ancestry from './Ancestry';

export default class Reciprocal_Ancestry extends Ancestry {
	reciprocals: Array<Ancestry> = [];
	original!: Ancestry;

	//////////////////////////////////////////
	//										//
	// only for bidirectional relationships	//
	// used in both graph modes				//
	//										//
	// computes ... ?
	//										//
	//////////////////////////////////////////

	constructor(ancestry: Ancestry) {
		super(ancestry.t_database, ancestry.pathString, ancestry.kindPredicate, false);
		this.original = ancestry;
		this.update_reciprocals();
	}

	get depth(): number { return this.original.depth; }
	becomeFocus(): boolean { return this.original.becomeFocus(); }		// to focus on non-reciprocal ancestry so tree does not crash

	update_reciprocals() {
		const id_thing = this.relationship?.idParent;
		const matches = this.hierarchy.ancestries.map(v => {return (v.id_thing == id_thing) ? v : null});
		for (const match of matches) {
			if (!!match && !match.isBidirectional) {
				this.reciprocals.push(match);
			}
		}
	}
	
	// with thing_isChild = false, this fixes
	// paging state & g_cluster lookups,
	// is visible & assureIsVisible_inClusters

	// what about:
	// relocate, grab
	// subscriptions
	// other mutations

	// needs:
	// change predicate from contains to isContainedBy?
	// invert relationship (swap parent and child)?
	// onePage_from predicate and points out

	persistentMoveUp_maybe(up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean): [boolean, boolean] {
		const focusAncestry = get(w_ancestry_focus);
		const siblingAncestries = focusAncestry?.thing?.parentAncestries;
		let graph_needsRelayout = false;
		let graph_needsRebuild = false;
		if (!!focusAncestry && siblingAncestries) {
			const siblings = siblingAncestries?.map(a => a.thing).filter(t => !!t) ?? [];
			const length = siblings.length;
			const thing = this?.thing;
			if (length == 0) {		// friendly for first-time users
				this.hierarchy.ancestry_rebuild_runtimeBrowseRight(this, up, SHIFT, EXTREME, true);
			} else if (!!thing) {
				const is_radial_mode = true;
				const isBidirectional = this.predicate?.isBidirectional ?? false;
				if (!isBidirectional) {
					const index = siblings.indexOf(thing);
					const newIndex = index.increment(!up, length);
					if (!!focusAncestry && !OPTION) {
						const grabAncestry = focusAncestry.extend_withChild(siblings[newIndex]);
						if (!!grabAncestry) {
							if (!grabAncestry.isVisible) {
								if (!focusAncestry.isFocus) {
									graph_needsRebuild = focusAncestry.becomeFocus();
								} else if (is_radial_mode) {
									graph_needsRebuild = grabAncestry.assureIsVisible_inClusters();	// change paging
								} else {
									alert('PROGRAMMING ERROR: child of focus is not visible');
								}
							}
							grabAncestry.grab_forShift(SHIFT);
							graph_needsRelayout = true;
						}
					} else if (c.allow_GraphEditing && OPTION) {
						graph_needsRebuild = true;
						u.ancestries_orders_normalize(siblingAncestries, false);
						const wrapped = up ? (index == 0) : (index + 1 == length);
						const goose = ((wrapped == up) ? 1 : -1) * k.halfIncrement;
						const newOrder = newIndex + goose;
						this.relationship?.order_setTo(newOrder);
						u.ancestries_orders_normalize(siblingAncestries);
					}
				}
			}
		}
		return [graph_needsRebuild, graph_needsRelayout];
	}

}