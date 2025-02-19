import { k, u, debug, Persistable, Trait, Ancestry, databases } from '../../common/Global_Imports';
import { Predicate, Relationship, Seriously_Range } from '../../common/Global_Imports';
import { T_Thing, T_Trait, T_Debug, T_Predicate } from '../../common/Global_Imports';
import { w_hierarchy, w_thing_color, w_count_rebuild } from '../../state/S_Stores';
import { w_ancestry_focus, w_ancestries_expanded } from '../../state/S_Stores';
import type { Dictionary } from '../../common/Types';
import { T_Persistable } from '../dbs/DBCommon';
import { get } from 'svelte/store';

export default class Thing extends Persistable {
	selectionRange = new Seriously_Range(0, 0);
	bulkRootID: string = k.empty;
	oneAncestry!: Ancestry;			// arbitrarily chosen from more than one (if has more than one parent AND/OR one or more related)
	title: string;
	color: string;
	type: T_Thing;

	constructor(idBase: string, id: string, title = k.title_default, color = k.thing_color_default, type = T_Thing.generic, already_persisted: boolean = false) {
		super(databases.db_now.t_database, idBase, T_Persistable.things, id, already_persisted);
		this.selectionRange = new Seriously_Range(0, title.length);
		this.title = title;
		this.color = color;
		this.type = type;
	};
	
	get parents():				Array		 <Thing> { return this.parents_forKind(T_Predicate.contains); }
	get traits():				Array		 <Trait> { return get(w_hierarchy).traits_forOwnerHID(this.hid) ?? []; }
	get parentIDs():			Array		<string> { return this.parents.map(t => t.id); }
	get parentAncestries(): 	Array	  <Ancestry> { return this.parentAncestries_for(Predicate.contains); }
	get relatedRelationships(): Array <Relationship> { return this.relationships_ofKind_forParents(T_Predicate.isRelated, false); }
	get fields():		  		Dictionary  <string> { return { title: this.title, color: this.color, type: this.type }; }
	get quest():					   string | null { return get(w_hierarchy).trait_forType_ownerHID(T_Trait.quest, this.hid)?.text ?? null; }
	get consequence():				   string | null { return get(w_hierarchy).trait_forType_ownerHID(T_Trait.consequence, this.hid)?.text ?? null; }
	get idBridging():						  string { return this.isBulkAlias ? this.bulkRootID : this.id; }
	get description():						  string { return this.id + ' "' + this.title + '"'; }
	get breadcrumb_title():					  string { return this.title.clipWithEllipsisAt(15); }
	get titleWidth():						  number { return u.getWidthOf(this.title); }
	get isRoot():							 boolean { return this.type == T_Thing.root; }
	get isBulkAlias():						 boolean { return this.type == T_Thing.bulk; }
	get isExternals():						 boolean { return this.type == T_Thing.externals; }
	get isAcrossBulk():						 boolean { return this.idBase != get(w_hierarchy).db.idBase; }
	get hasMultipleParents():				 boolean { return this.parentAncestries.length > 1; }
	get hasParents():						 boolean { return this.hasParents_forKind(T_Predicate.contains); }
	get isFocus():							 boolean { return (get(w_ancestry_focus).thing?.id ?? k.empty) == this.id; }
	get hasRelated():						 boolean { return this.relatedRelationships.length > 0; }

	get ancestries(): Array<Ancestry> {
		return u.uniquely_concatenateArrays(
			this.uniqueAncestries_for(Predicate.contains),
			this.uniqueAncestries_for(Predicate.isRelated),
		);
	}

	get parents_ofAllKinds(): Array<Thing> {
		let parents: Array<Thing> = [];
		for (const predicate of get(w_hierarchy).predicates) {
			const more = this.parents_forKind(predicate.kind)
			parents = u.uniquely_concatenateArrays(parents, more);
		}
		return parents;
	}

	get thing_isBulk_expanded(): boolean {		// cross db ancestries needs special attention
		if (this.isBulkAlias) {
			const ancestries = get(w_ancestries_expanded);
			if (!!ancestries) {
				for (const ancestry of ancestries) {
					if (this.id == ancestry.thing?.id) {
						return true;
					}
				}
			}
		}
		return false;
	}

	get oneAncestry_derived(): Ancestry | null {
		let oneAncestry: Ancestry | null = null;
		if (this.isRoot) {			// if root, use root ancestry
			oneAncestry = get(w_hierarchy).rootAncestry;
		} else {					// if not, use parent.oneAncestry and append id of forParents relationship
			const relationships = this.relationships_ofKind_forParents(T_Predicate.contains, true);
			if (relationships && relationships.length > 0) {
				const relationship = relationships[0];
				const parentAncestry = relationship.parent?.oneAncestry;
				oneAncestry = parentAncestry?.uniquelyAppendID(relationship.id) ?? null;
			}
		}
		return oneAncestry;
	}
	
	debugLog(message: string) { this.log(T_Debug.things, message); }
	log(option: T_Debug, message: string) { debug.log_maybe(option, message + k.space + this.description); }
	hasParents_forKind(kindPredicate: string): boolean { return this.parents_forKind(kindPredicate).length > 0; }
	setTraitText_forType(text: string, type: T_Trait) { get(w_hierarchy).trait_setText_forType_ownerHID(text, type, this.id); }

	override isInDifferentBulkThan(other: Thing): boolean {
		return super.isInDifferentBulkThan(other) || (other.isBulkAlias && !this.isBulkAlias && this.idBase != other.title);
	}

	signal_color_change() {
		const count = get(w_count_rebuild) + 1;
		w_count_rebuild.set(count);
		w_thing_color.set(`${this.id}${k.generic_separator}${count}`);
	}

	relationships_inBothDirections_forKind(kindPredicate: string): Array<Relationship> {
		const childrenRelationships = this.relationships_ofKind_forParents(kindPredicate, false);
		const parentsRelationships = this.relationships_ofKind_forParents(kindPredicate, true);
		return u.uniquely_concatenateArrays(parentsRelationships, childrenRelationships);
	}

	async persistent_create_orUpdate(already_persisted: boolean) {
		if (already_persisted) {
			await databases.db_now.thing_persistentUpdate(this);
		} else {
			await databases.db_now.thing_remember_persistentCreate(this);
		}
	}

	relationships_ofKind_forParents(kindPredicate: string, forParents: boolean): Array<Relationship> {
		const id = forParents ? this.id : this.idBridging;		//  use idBridging for children, in case thing is a bulk alias
		if ((!!id || id == k.empty) && id != k.unknown) {
			return get(w_hierarchy).relationships_forKindPredicate_hid_thing_isChild(kindPredicate, id.hash(), forParents);
		}
		return [];
	}

	crumbWidth(numberOfParents: number): number {
		const forNone = this.titleWidth + 10;
		switch (numberOfParents) {
			case 0:	 return forNone;
			case 1:	 return forNone + 11;
			default: return forNone + 18;
		}
	}

	parentRelationships_for(predicate: Predicate): Array<Relationship> {
		let relationships: Array<Relationship> = [] 
		if (predicate.isBidirectional) {
			relationships = this.relationships_inBothDirections_forKind(predicate.kind);
		} else {
			relationships = this.relationships_ofKind_forParents(predicate.kind, true);
		}
		return relationships;
	}

	remove_fromGrabbed_andExpanded_andResolveFocus() {
		// called when this (thing) is being deleted
		for (const ancestry of this.ancestries) {		// DO NOT REMOVE ANCESTRIES ???
			if (ancestry.id_thing == this.id) {
				ancestry.remove_fromGrabbed_andExpanded();
			}
		}
		this.oneAncestry.remove_fromGrabbed_andExpanded();
		const focus = get(w_ancestry_focus);
		if (focus.thing?.hid == this.hid) {
			get(w_hierarchy).rootAncestry.becomeFocus();
		}
	}

	parents_forKind(kindPredicate: string): Array<Thing> {
		let parents: Array<Thing> = [];
		if (!this.isRoot) {
			const relationships = this.relationships_ofKind_forParents(kindPredicate, true);
			for (const relationship of relationships) {
				const thing = relationship.parent;
				if (!!thing) {
					parents.push(thing);
				}
			}
		}
		return parents;
	}

	oneAncestries_rebuild_forSubtree() {

		// set oneAncestry for this and all its progeny,
		// they are all backwards dependent,
		// so must be done top-down all at once

		const oneAncestry = this.oneAncestry_derived;
		if (!!oneAncestry) {
			const predicate = oneAncestry.predicate;
			if (!!predicate && !predicate.isBidirectional && this.oneAncestry != oneAncestry) {
				get(w_hierarchy).ancestry_forget(this.oneAncestry);
				this.oneAncestry = oneAncestry;
			}
			oneAncestry.children.map(c => c.oneAncestries_rebuild_forSubtree());
		}
	}

	uniqueAncestries_for(predicate: Predicate | null): Array<Ancestry> {
		if (!!predicate){
			let ancestries: Array<Ancestry> = [];
			if (predicate.isBidirectional) {
				ancestries = this.parentAncestries_for(predicate);
			} else {
				let parents = this.parents_forKind(predicate.kind) ?? [];
				for (const parent of parents) {
					const parentAncestries = parent.isRoot ? [get(w_hierarchy).rootAncestry] : parent.parentAncestries_for(predicate);
					ancestries = u.concatenateArrays(ancestries, parentAncestries);
				}
			}
			return u.strip_thingDuplicates_from(u.strip_falsies(ancestries));
		}
		return [];
	}

	parentAncestries_for(predicate: Predicate | null, visited: Array<string> = []): Array<Ancestry> {
		// the ancestry of each parent [of this thing]
		let ancestries: Array<Ancestry> = [];
		if (!!predicate) {
			const relationships = this.parentRelationships_for(predicate);
			for (const relationship of relationships) {
				if (predicate.isBidirectional) {
					const child = relationship.child;
					if (!!child && child.id != this.id) {
						addAncestry(get(w_hierarchy).ancestry_remember_createUnique(relationship.id, predicate.kind));
					}
				} else {
					const parent = relationship.parent;
					if (!!parent && !visited.includes(parent.id)) {
						const endID = relationship.id;		// EGADS, this is the wrong relationship; needs the next one
						const parentAncestries = parent.parentAncestries_for(predicate, u.uniquely_concatenateArrays(visited, [parent.id])) ?? [];
						if (parentAncestries.length == 0) {
							addAncestry(get(w_hierarchy).rootAncestry.uniquelyAppendID(endID));
						} else {
							parentAncestries.map((p: Ancestry) => addAncestry(p.uniquelyAppendID(endID)));
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
