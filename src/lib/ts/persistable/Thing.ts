import { Predicate, Persistable, Relationship, Seriously_Range } from '../common/Global_Imports';
import { k, u, debug, colors, Trait, Ancestry, databases } from '../common/Global_Imports';
import { E_Thing, E_Trait, E_Debug, E_Predicate } from '../common/Global_Imports';
import { w_hierarchy, w_thing_color, w_count_rebuild } from '../common/Stores';
import { w_ancestry_focus, w_ancestries_expanded } from '../common/Stores';
import type { Dictionary } from '../common/Types';
import { E_Persistable } from '../database/DBCommon';
import { get } from 'svelte/store';

export default class Thing extends Persistable {
	selectionRange = new Seriously_Range(0, 0);
	bulkRootID: string = k.empty;
	e_thing: E_Thing;
	title: string;
	color: string;

	constructor(idBase: string, id: string, title = k.title.default, color = colors.default_forThings, e_thing = E_Thing.generic, already_persisted: boolean = false) {
		super(databases.db_now.e_database, idBase, E_Persistable.things, id, already_persisted);
		this.selectionRange = new Seriously_Range(0, title.length);
		this.e_thing = e_thing;
		this.title = title;
		this.color = color;
	};
	
	get parents():				Array		 <Thing> { return this.parents_ofKind(E_Predicate.contains); }
	get traits():				Array		 <Trait> { return get(w_hierarchy).traits_forOwnerHID(this.hid) ?? []; }
	get parentIDs():			Array		<string> { return this.parents.map(t => t.id); }
	get ancestries():		 	Array	  <Ancestry> { return this.ancestries_forPredicate(Predicate.contains); }
	get childRelationships():	Array <Relationship> { return this.relationships_ofKind_forParents(E_Predicate.contains, false); }
	get relatedRelationships(): Array <Relationship> { return this.relationships_ofKind_forParents(E_Predicate.isRelated, false); }
	get fields():		  		Dictionary  <string> { return { title: this.title, color: this.color, type: this.e_thing }; }
	get quest():					   string | null { return get(w_hierarchy).trait_forType_ownerHID(E_Trait.quest, this.hid)?.text ?? null; }
	get consequence():				   string | null { return get(w_hierarchy).trait_forType_ownerHID(E_Trait.consequence, this.hid)?.text ?? null; }
	get idBridging():						  string { return this.isBulkAlias ? this.bulkRootID : this.id; }
	get description():						  string { return this.id + ' "' + this.title + '"'; }
	get breadcrumb_title():					  string { return this.title.clipWithEllipsisAt(15); }
	get width_ofTitle():					  number { return u.getWidthOf(this.title); }
	get isRoot():							 boolean { return this.e_thing == E_Thing.root; }
	get isBulkAlias():						 boolean { return this.e_thing == E_Thing.bulk; }
	get isExternals():						 boolean { return this.e_thing == E_Thing.externals; }
	get isAcrossBulk():						 boolean { return this.idBase != get(w_hierarchy).db.idBase; }
	get hasParents():						 boolean { return this.hasParents_ofKind(E_Predicate.contains); }
	get isFocus():							 boolean { return (get(w_ancestry_focus).thing?.id ?? k.empty) == this.id; }
	get hasRelated():						 boolean { return this.relatedRelationships.length > 0; }

	get parents_ofAllKinds(): Array<Thing> {
		let parents: Array<Thing> = [];
		for (const predicate of get(w_hierarchy).predicates) {
			const more = this.parents_ofKind(predicate.kind)
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

	debugLog(message: string) { this.log(E_Debug.things, message); }
	hasParents_ofKind(kind: string): boolean { return this.parents_ofKind(kind).length > 0; }
	hasMultipleParents_ofKind(kind: string): boolean { return this.parents_ofKind(kind).length > 1; }
	log(option: E_Debug, message: string) { debug.log_alert(option, message + k.space + this.description); }
	setTraitText_forType(text: string, e_thing: E_Trait) { get(w_hierarchy).trait_setText_forType_ownerHID(text, e_thing, this.id); }

	override isInDifferentBulkThan(other: Thing): boolean {
		return super.isInDifferentBulkThan(other) || (other.isBulkAlias && !this.isBulkAlias && this.idBase != other.title);
	}

	signal_color_change() {
		w_count_rebuild.update(n => n + 1);
		w_thing_color.set(`${this.id}${k.separator.generic}${get(w_count_rebuild)}`);
	}

	relationships_inBothDirections_forKind(kind: string): Array<Relationship> {
		const childrenRelationships = this.relationships_ofKind_forParents(kind, false);
		const parentsRelationships = this.relationships_ofKind_forParents(kind, true);
		return u.uniquely_concatenateArrays(parentsRelationships, childrenRelationships);
	}

	async persistent_create_orUpdate(already_persisted: boolean) {
		if (already_persisted) {
			await databases.db_now.thing_persistentUpdate(this);
		} else {
			await databases.db_now.thing_remember_persistentCreate(this);
		}
	}

	relationships_ofKind_forParents(kind: string, forParents: boolean): Array<Relationship> {
		const id = forParents ? this.id : this.idBridging;		//  use idBridging for children, in case thing is a bulk alias
		if ((!!id || id == k.empty) && id != k.unknown) {
			return get(w_hierarchy).relationships_forKindPredicate_hid_thing_isChild(kind, id.hash(), forParents);
		}
		return [];
	}

	crumbWidth(numberOfParents: number): number {
		const forNone = this.width_ofTitle + 10;
		switch (numberOfParents) {
			case 0:	 return forNone;
			case 1:	 return forNone + 11;
			default: return forNone + 18;
		}
	}

	parent_relationships_ofKind(predicate: Predicate): Array<Relationship> {
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
		const focus = get(w_ancestry_focus);
		if (focus.thing?.hid == this.hid) {
			get(w_hierarchy).rootAncestry.becomeFocus();
		}
	}

	parents_ofKind(kind: string): Array<Thing> {
		let parents: Array<Thing> = [];
		if (!this.isRoot) {
			const relationships = this.relationships_ofKind_forParents(kind, true);
			for (const relationship of relationships) {
				const thing = relationship.parent;
				if (!!thing) {
					parents.push(thing);
				}
			}
		}
		return parents;
	}

	static readonly _____ANCESTRIES: unique symbol;

	get ancestry(): Ancestry { return this.ancestries[0]; }

	get ancestry_maybe(): Ancestry | null {
		const ancestries = get(w_hierarchy).ancestries_forThing(this);
		return ancestries.length > 0 ? ancestries[0] : null;
	}

	uniqueAncestries_for(predicate: Predicate | null): Array<Ancestry> {
		let ancestries: Array<Ancestry> = [];
		if (!!predicate){
			if (predicate.isBidirectional) {
				ancestries = this.ancestries_forPredicate(predicate);
			} else {
				let parents = this.parents_ofKind(predicate.kind) ?? [];
				for (const parent of parents) {
					const parentAncestries = parent.isRoot ? [get(w_hierarchy).rootAncestry] : parent.ancestries_forPredicate(predicate);
					ancestries = u.concatenateArrays(ancestries, parentAncestries);
				}
			}
			ancestries = u.strip_thingDuplicates_from(u.strip_falsies(ancestries));
		}
		return ancestries;
	}

	ancestries_forPredicate(predicate: Predicate | null, visited: Array<string> = []): Array<Ancestry> {
		// the ancestry of each parent [of this thing]
		let ancestries: Array<Ancestry> = [];
		if (!!predicate) {
			function addAncestry(ancestry: Ancestry | null) {
				if (!!ancestry) {
					ancestries.push(ancestry);
				}
			}
			const parentRelationships = this.parent_relationships_ofKind(predicate);
			for (const parentRelationship of parentRelationships) {
				if (predicate.isBidirectional) {
					const child = parentRelationship.child;
					if (!!child && child.id != this.id) {
						addAncestry(get(w_hierarchy).ancestry_remember_createUnique(parentRelationship.id, predicate.kind));
					}
				} else {
					const parent = parentRelationship.parent;
					if (!!parent && !visited.includes(parent.id)) {
						const id_parentRelationship = parentRelationship.id;		// TODO, this is the wrong relationship; needs the next one
						const parentAncestries = parent.ancestries_forPredicate(predicate, [...visited, parent.id]) ?? [];
						if (parentAncestries.length == 0) {
							addAncestry(get(w_hierarchy).rootAncestry.ancestry_createUnique_byAppending_relationshipID(id_parentRelationship));
						} else {
							parentAncestries.map((p: Ancestry) => addAncestry(p.ancestry_createUnique_byAppending_relationshipID(id_parentRelationship)));
						}
					}
				}
			}
			ancestries = u.strip_hidDuplicates(ancestries);
		}
		ancestries = u.sort_byOrder(ancestries).reverse();
		return ancestries;
	}
	
}
