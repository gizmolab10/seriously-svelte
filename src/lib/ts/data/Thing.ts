import { DebugFlag, dbDispatch, Relationship, SeriouslyRange } from '../common/GlobalImports';
import { k, u, get, Ancestry, Datum, debug, IDTrait, Predicate } from '../common/GlobalImports';
import { s_ancestry_focus, s_ancestries_expanded } from '../state/State';
import { h } from '../db/DBDispatch';
import Airtable from 'airtable';

export default class Thing extends Datum {
	selectionRange = new SeriouslyRange(0, 0);
	bulkRootID: string = k.empty;
	hoverAttributes = k.empty;
	borderAttribute = k.empty;
	grabAttributes = k.empty;
	oneAncestry!: Ancestry;
	needsBulkFetch = false;
	isExemplar = false;
	isEditing = false;
	isGrabbed = false;
	title: string;
	color: string;
	trait: string;

	constructor(baseID: string, id: string | null, title = k.title_default, color = k.color_default, trait = 's', isRemotelyStored: boolean) {
		super(dbDispatch.db.dbType, baseID, id, isRemotelyStored);
		this.selectionRange = new SeriouslyRange(0, title.length);
		this.title = title;
		this.color = color;
		this.trait = trait;
	};
	
	get parentIDs():		  Array<string> { return this.parents.map(t => t.id); }
	get parentAncestries(): Array<Ancestry> { return this.parentAncestries_for(Predicate.contains); }
	get parents():			   Array<Thing> { return this.parents_forID(Predicate.idContains); }
	get fields():		  Airtable.FieldSet { return { title: this.title, color: this.color, trait: this.trait }; }
	get idBridging():				 string { return this.isBulkAlias ? this.bulkRootID : this.id; }
	get description():				 string { return this.id + ' \"' + this.title + '\"'; }
	get titleWidth():				 number { return u.getWidthOf(this.title) + 6; }
	get isRoot():					boolean { return this.trait == IDTrait.root; }
	get isBulkAlias():				boolean { return this.trait == IDTrait.bulk; }
	get hasMultipleParents():		boolean { return this.parentAncestries.length > 1; }
	get isAcrossBulk():				boolean { return this.baseID != h.db.baseID; }
	get hasParents():				boolean { return this.hasParentsFor(Predicate.idContains); }
	get isFocus():					boolean { return (get(s_ancestry_focus).thing?.id ?? k.empty) == this.id; }
	get hasRelated():				boolean { return this.relationships_bidirectional_for(Predicate.idIsRelated).length > 0; }

	get parents_ofAllKinds(): Array<Thing> {
		let parents: Array<Thing> = [];
		for (const predicate of h.predicates) {
			const more = this.parents_forID(predicate.id)
			parents = u.uniquely_concatenateArrays(parents, more);
		}
		return parents;
	}

	get thing_isBulk_expanded(): boolean {		// cross db ancestries needs special attention
		if (this.isBulkAlias) {
			const ancestries = get(s_ancestries_expanded);
			for (const ancestry of ancestries) {
				if (this.id == ancestry.thing?.id) {
					return true;
				}
			}
		}
		return false;
	}

	get oneAncestry_derived(): Ancestry | null {
		let oneAncestry: Ancestry | null = null;
		if (this.isRoot) {			// if root, use root ancestry
			oneAncestry = h.rootAncestry;
		} else {					// if not, use parent.oneAncestry and append id of isChildOf relationship
			const relationships = this.relationships_for_isChildOf(Predicate.idContains, true);
			if (relationships && relationships.length > 0) {
				const relationship = relationships[0];
				const aParentAncestry = relationship.parent?.oneAncestry;
				oneAncestry = aParentAncestry?.uniquelyAppendID(relationship.id) ?? null;
			}
		}
		return oneAncestry;
	}
	
	debugLog(message: string) { this.log(DebugFlag.things, message); }
	log(option: DebugFlag, message: string) { debug.log_maybe(option, message + k.space + this.description); }

	hasParentsFor(idPredicate: string): boolean {
		return this.parents_forID(idPredicate).length > 0;
	}

	override isInDifferentBulkThan(other: Thing): boolean {
		return super.isInDifferentBulkThan(other) || (other.isBulkAlias && !this.isBulkAlias && this.baseID != other.title);
	}

	async remoteWrite() {
		if (!this.awaitingCreation) {
			if (this.isRemotelyStored) {
				await dbDispatch.db.thing_remoteUpdate(this);
			} else if (dbDispatch.db.isRemote) {
				await dbDispatch.db.thing_remember_remoteCreate(this);
			}
		}
	}

	relationships_grandParentsFor(idPredicate: string): Array<Relationship> {
		const relationships = this.relationships_for_isChildOf(idPredicate, true);
		let grandParents: Array<Relationship> = [];
		for (const relationship of relationships) {
			const more = relationship.parent?.relationships_for_isChildOf(idPredicate, true);
			if (more) {
				grandParents = u.uniquely_concatenateArrays(grandParents, more);
			}
		}
		return grandParents;
	}

	things_bidirectional_for(idPredicate: string): Array<Thing> {
		const parents = this.relationships_for_isChildOf(idPredicate, true).map(r => r.parent);
		const children = this.relationships_for_isChildOf(idPredicate, false).map(r => r.child);
		return u.uniquely_concatenateArrays(parents, children);
	}

	relationships_bidirectional_for(idPredicate: string): Array<Relationship> {
		const children = this.relationships_for_isChildOf(idPredicate, true);
		const parents = this.relationships_for_isChildOf(idPredicate, false);
		return u.uniquely_concatenateArrays(parents, children);
	}

	relationships_for_isChildOf(idPredicate: string, isChildOf: boolean): Array<Relationship> {
		return h.relationships_forPredicateThingIsChild(idPredicate, this.id, isChildOf);
	}

	updateColorAttributes(ancestry: Ancestry) {
		const border = (ancestry.isEditing ? 'dashed' : 'solid') + ' 1px ';
		const hover = border + ancestry.dotColor(true);
		const grab = border + ancestry.dotColor(false);
		this.borderAttribute = border;
		this.hoverAttributes = hover;
		this.grabAttributes = grab;
	}

	crumbWidth(numberOfParents: number): number {
		const none = this.titleWidth + 10;
		const one = none + 11;
		const multiple = one + 7;
		switch (numberOfParents) {
			case 0: return none;
			case 1: return one;
			default: return multiple;
		}
	}

	parents_forID(idPredicate: string): Array<Thing> {
		let parents: Array<Thing> = [];
		if (!this.isRoot) {
			const relationships = this.relationships_for_isChildOf(idPredicate, true);
			for (const relationship of relationships) {
				const thing = relationship.parent;
				if (!!thing) {
					parents.push(thing);
				}
			}
		}
		return parents;
	}

	oneAncestries_rebuildForSubtree() {		// set oneAncestry for this and all its progeny
		const oneAncestry = this.oneAncestry_derived;
		if (oneAncestry) {
			if (this.oneAncestry != oneAncestry) {
				h.ancestry_forget(this.oneAncestry);
				this.oneAncestry = oneAncestry;
			}
			for (const child of oneAncestry.children) {
				child.oneAncestries_rebuildForSubtree();
			}
		}
	}

	oneAncestries_for(predicate: Predicate): Array<Ancestry> {
		if (predicate) {
			const id = predicate.id;
			if (predicate.isBidirectional) {
				return this.things_bidirectional_for(id).map(t => t.oneAncestry);
			} else {;
				return this.uniqueParentAncestries_for(predicate);
			}
		}
		return [];
	}

	uniqueParentAncestries_for(predicate: Predicate): Array<Ancestry> {
		let parentAncestries: Array<Ancestry> = [];
		const parents = this.parents_forID(predicate.id) ?? [];
		for (const parent of parents) {
			const moreAncestries = parent.isRoot ? [h.rootAncestry] : parent.parentAncestries_for(predicate);
			parentAncestries = u.concatenateArrays(parentAncestries, moreAncestries);
		}
		return u.strip_thingDuplicates(u.strip_falsies(parentAncestries));
	}

	parentAncestries_for(predicate: Predicate | null, visited: Array<string> = []): Array<Ancestry> {
		// the ancestry of each parent [of this thing]
		let ancestries: Array<Ancestry> = [];
		if (!this.isRoot && predicate) {
			const isBidirectional = predicate.isBidirectional;
			const relationships = this.relationships_for_isChildOf(predicate.id, true);
			for (const relationship of relationships) {
				if (isBidirectional) {
					addAncestry(relationship.child?.oneAncestry ?? null);
				} else {
					const parent = relationship.parent;
					if (parent && !visited.includes(parent.id)) {
						const endID = relationship.id;		// EGADS, this is the wrong relationship; needs the next one
						const parentAncestries = parent.parentAncestries_for(predicate, u.uniquely_concatenateArrays(visited, [parent.id])) ?? [];
						if (parentAncestries.length == 0) {
							addAncestry(h.rootAncestry.uniquelyAppendID(endID));
						} else {
							for (const parentAncestry of parentAncestries) {
								addAncestry(parentAncestry.uniquelyAppendID(endID));
							}
						}
					}
				}
			}
			ancestries = u.strip_hidDuplicates(ancestries);
			function addAncestry(ancestry: Ancestry | null) {
				if (!!ancestry) {
					ancestries.push(ancestry);
				}
			}
		}
		return u.sort_byTitleTop(ancestries).reverse();
	}
	
}
