import { k, u, get, Datum, debug, IDTrait, Ancestry, Predicate, Page_States } from '../common/Global_Imports';
import { DebugFlag, dbDispatch, Relationship, Seriously_Range } from '../common/Global_Imports';
import { s_focus_ancestry, s_expanded_ancestries } from '../state/Reactive_State';
import { s_rebuild_count, s_color_thing } from '../state/Reactive_State';
import { h } from '../db/DBDispatch';
import Airtable from 'airtable';

export default class Thing extends Datum {
	selectionRange = new Seriously_Range(0, 0);
	bulkRootID: string = k.empty;
	page_states!: Page_States;
	oneAncestry!: Ancestry;
	needsBulkFetch = false;
	consequence: string;
	isEditing = false;
	isGrabbed = false;
	quest: string;
	title: string;
	color: string;
	trait: string;

	constructor(baseID: string, id: string, title = k.title_default, color = k.color_default, trait = 's', consequence = k.empty, quest = k.empty, hasBeen_remotely_saved: boolean = false) {
		super(dbDispatch.db.dbType, baseID, id, hasBeen_remotely_saved);
		this.selectionRange = new Seriously_Range(0, title.length);
		this.page_states = new Page_States(this.id);
		this.consequence = consequence;
		this.title = title;
		this.quest = quest;
		this.color = color;
		this.trait = trait;
	};
	
	get parentIDs():		  Array<string> { return this.parents.map(t => t.id); }
	get parentAncestries(): Array<Ancestry> { return this.parentAncestries_for(Predicate.contains); }
	get parents():			   Array<Thing> { return this.parents_forID(Predicate.idContains); }
	get fields():		  Airtable.FieldSet { return { title: this.title, color: this.color, trait: this.trait }; }
	get idBridging():				 string { return this.isBulkAlias ? this.bulkRootID : this.id; }
	get description():				 string { return this.id + ' \"' + this.title + '\"'; }
	get titleWidth():				 number { return u.getWidthOf(this.title); }
	get isRoot():					boolean { return this.trait == IDTrait.root; }
	get isBulkAlias():				boolean { return this.trait == IDTrait.bulk; }
	get isAcrossBulk():				boolean { return this.baseID != h.db.baseID; }
	get hasMultipleParents():		boolean { return this.parentAncestries.length > 1; }
	get hasParents():				boolean { return this.hasParentsFor(Predicate.idContains); }
	get isFocus():					boolean { return (get(s_focus_ancestry).thing?.id ?? k.empty) == this.id; }
	get hasRelated():				boolean { return this.relationships_inBothDirections_for(Predicate.idIsRelated).length > 0; }

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
			const ancestries = get(s_expanded_ancestries);
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
	hasParentsFor(idPredicate: string): boolean { return this.parents_forID(idPredicate).length > 0; }
	log(option: DebugFlag, message: string) { debug.log_maybe(option, message + k.space + this.description); }

	override isInDifferentBulkThan(other: Thing): boolean {
		return super.isInDifferentBulkThan(other) || (other.isBulkAlias && !this.isBulkAlias && this.baseID != other.title);
	}

	async remoteWrite() {
		if (!this.awaitingCreation) {
			if (this.hasBeen_remotely_saved) {
				await dbDispatch.db.thing_remoteUpdate(this);
			} else if (dbDispatch.db.isRemote) {
				await dbDispatch.db.thing_remember_remoteCreate(this);
			}
		}
	}

	signal_color_change() {
		const count = get(s_rebuild_count) + 1;
		s_rebuild_count.set(count);
		s_color_thing.set(`${this.id}${k.generic_separator}${count}`);
	}

	crumbWidth(numberOfParents: number): number {
		const forNone = this.titleWidth + 10;
		switch (numberOfParents) {
			case 0:	 return forNone;
			case 1:	 return forNone + 11;
			default: return forNone + 18;
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
		if (!!oneAncestry) {
			const predicate = oneAncestry.predicate;
			if (!!predicate && !predicate.isBidirectional && this.oneAncestry != oneAncestry) {
				h.ancestry_forget(this.oneAncestry);
				this.oneAncestry = oneAncestry;
			}
			oneAncestry.children.map(c => c.oneAncestries_rebuildForSubtree());
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

	relationships_inBothDirections_for(idPredicate: string): Array<Relationship> {
		const children = this.relationships_for_isChildOf(idPredicate, true);
		const parents = this.relationships_for_isChildOf(idPredicate, false);
		return u.uniquely_concatenateArrays(parents, children);
	}

	relationships_for_isChildOf(idPredicate: string, isChildOf: boolean): Array<Relationship> {
		const id = this.idBridging;				//  use idBridging in case thing is a bulk alias
		if (!!id && ![k.empty, k.unknown].includes(id)) {
			return h.relationships_forPredicateThingIsChild(idPredicate, id, isChildOf);
		}
		return [];
	}

	parentRelationships_for(predicate: Predicate): Array<Relationship> {
		let relationships: Array<Relationship> = [] 
		if (predicate.isBidirectional) {
			relationships = this.relationships_inBothDirections_for(predicate.id);
		} else {
			relationships = this.relationships_for_isChildOf(predicate.id, true);
		}
		return relationships;
	}

	uniqueAncestries_for(predicate: Predicate): Array<Ancestry> {
		let ancestries: Array<Ancestry> = [];
		if (predicate.isBidirectional) {
			ancestries = this.parentAncestries_for(predicate);
		} else {
			let parents = this.parents_forID(predicate.id) ?? [];
			for (const parent of parents) {
				const parentAncestries = parent.isRoot ? [h.rootAncestry] : parent.parentAncestries_for(predicate);
				ancestries = u.concatenateArrays(ancestries, parentAncestries);
			}
		}
		return u.strip_thingDuplicates_from(u.strip_falsies(ancestries));
	}

	parentAncestries_for(predicate: Predicate | null, visited: Array<string> = []): Array<Ancestry> {
		// the ancestry of each parent [of this thing]
		let ancestries: Array<Ancestry> = [];
		if (!this.isRoot && predicate) {
			const relationships = this.parentRelationships_for(predicate);
			for (const relationship of relationships) {
				if (predicate.isBidirectional) {
					const child = relationship.child;
					if (!!child && child.id != this.id) {
						addAncestry(h.ancestry_remember_createUnique(relationship.id, predicate.id));
					}
				} else {
					const parent = relationship.parent;
					if (!!parent && !visited.includes(parent.id)) {
						const endID = relationship.id;		// EGADS, this is the wrong relationship; needs the next one
						const parentAncestries = parent.parentAncestries_for(predicate, u.uniquely_concatenateArrays(visited, [parent.id])) ?? [];
						if (parentAncestries.length == 0) {
							addAncestry(h.rootAncestry.uniquelyAppendID(endID));
						} else {
							parentAncestries.map(p => addAncestry(p.uniquelyAppendID(endID)));
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
