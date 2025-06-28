import { c, k, p, u, ux, busy, debug, grabs, files, Tag, User, Thing, Trait } from '../common/Global_Imports';
import { T_Thing, T_Trait, T_Order, T_Control, T_Predicate, T_Startup } from '../common/Global_Imports';
import { Access, Ancestry, Predicate, Relationship, Persistable } from '../common/Global_Imports';
import { w_t_startup, w_depth_limit, w_storage_updated, w_s_alteration } from '../common/Stores';
import { w_popupView_id, w_ancestry_focus, w_s_text_edit, w_hierarchy } from '../common/Stores';
import { T_Create, T_Alteration, T_File_Format, T_Persistable } from '../common/Global_Imports';
import { colors, signals, layout, databases } from '../common/Global_Imports';
import type { Integer, Dictionary } from '../common/Types';
import Identifiable from '../runtime/Identifiable';
import DBCommon from '../database/DBCommon';
import { pivot } from '../files/Pivot';
import { get } from 'svelte/store';

export let h!: Hierarchy;
w_hierarchy.subscribe(value => h = value);
export type Ancestries_ByHID = { [hid: Integer]: Ancestry }
export type Relationships_ByHID = { [hid: Integer]: Array<Relationship> }

export class Hierarchy {
	private predicate_byDirection: { [direction: number]: Array<Predicate> } = {};
	private relationships_byKind: { [kind: string]: Array<Relationship> } = {};
	private ancestry_byKind_andHID: { [kind: string]: Ancestries_ByHID } = {};					// for uniqueness
	private ancestries_byThingHID: { [hid: Integer]: Array<Ancestry> } = {};
	private traits_byOwnerHID: { [ownerHID: Integer]: Array<Trait> } = {};
	private things_byT_Trait: { [t_trait: string]: Array<Thing> } = {};
	private relationship_byHID: { [hid: Integer]: Relationship } = {};
	private traits_byType: { [t_trait: string]: Array<Trait> } = {};
	private things_byType: { [t_thing: string]: Array<Thing> } = {};
	private things_byTitle: { [title: string]: Array<Thing> } = {};
	private predicate_byKind: { [kind: string]: Predicate } = {};
	private thing_byAncestryHID: { [hid: Integer]: Thing } = {};
	private tags_byThingHID: { [hid: Integer]: Array<Tag> } = {};
	private relationships_byParentHID: Relationships_ByHID = {};
	private relationships_byChildHID: Relationships_ByHID = {};
	private ancestry_byHID: { [hid: Integer]: Ancestry } = {};
	private access_byKind: { [kind: string]: Access } = {};
	private access_byHID: { [hid: Integer]: Access } = {};
	private thing_byHID: { [hid: Integer]: Thing } = {};
	private trait_byHID: { [hid: Integer]: Trait } = {};
	private user_byHID: { [hid: Integer]: User } = {};
	private tag_byType: { [type: string]: Tag } = {};
	private tag_byHID: { [hid: Integer]: Tag } = {};
	ids_translated: { [prior: string]: string } = {};
	replace_rootID: string | null = k.empty;		// required for DBLocal at launch
	relationships: Array<Relationship> = [];
	predicates: Array<Predicate> = [];
	externalsAncestry!: Ancestry;
	things: Array<Thing> = [];
	traits: Array<Trait> = [];
	rootAncestry!: Ancestry;
	tags: Array<Tag> = [];
	isAssembled = false;
	root!: Thing;
	db: DBCommon;

	constructor(db: DBCommon) {
		this.db = db;
	}

	persistables_forKey(t_persistable: T_Persistable): Array<Persistable> {
		switch (t_persistable) {
			case T_Persistable.relationships: return this.relationships;
			case T_Persistable.predicates:	  return this.predicates;
			case T_Persistable.things:		  return this.things;
			case T_Persistable.traits:		  return this.traits;
			case T_Persistable.tags:		  return this.tags;
			default: return [];
		}
	}

	static readonly _____ROOT: unique symbol;

	get hasRoot(): boolean { return !!this.root; }
	get idRoot(): string | null { return this.root?.id ?? null; };

	assure_root_andAncestry() {
		let rootAncestry = this.rootAncestry;
		if (!rootAncestry) {
			rootAncestry = this.ancestry_remember_createUnique();
			this.rootAncestry = rootAncestry;
		}
		const root = rootAncestry.thing;
		if (!!root) {
			this.root = root;
		}
	}
	
	static readonly _____THINGS: unique symbol;

	things_forTitle(title: string): Array<Thing> | null { return this.things_byTitle[title] ?? null; }
	things_forT_Trait(t_trait: T_Trait): Array<Thing> { return this.things_byT_Trait[t_trait] ?? []; }
	things_unique_havingTraits() { return u.strip_duplicates(Object.values(this.things_byT_Trait).flat()); }

	things_refreshKnowns() {
		const saved = this.things;
		this.things_forget_all();
		saved.map(t => this.thing_remember(t));
	}

	things_forget_all() {
		this.things = []; // clear
		this.thing_byHID = {};
		this.things_byType = {};
	}

	things_forAncestries(ancestries: Array<Ancestry>): Array<Thing> {
		const things = Array<Thing>();
		for (const ancestry of ancestries) {
			const thing = ancestry?.thing;
			if (!!thing) {
				things.push(thing);
			}
		}
		return things;
	}

	things_forAncestry(ancestry: Ancestry): Array<Thing> {
		const isContains = ancestry.kind == T_Predicate.contains;
		const relationship_hids = ancestry.relationship_hids;
		let things: Array<Thing> = isContains ? [this.root] : [];
		if (!isContains || relationship_hids.length != 0) {
			for (const relationship_hid of relationship_hids) {
				const relationship = this.relationship_forHID(relationship_hid);
				if (!!relationship) {
					if (!!relationship.parent && things.length == 0) {
						things.push(relationship.parent);
					}
					if (!!relationship.child) {
						things.push(relationship.child);
					}
				}
			}
		}
		return things;
	}

	static readonly _____THING: unique symbol;
	
	thing_forHID(hid: Integer): Thing | null { return this.thing_byHID[hid ?? undefined]; }

	thing_remember_updateID_to(thing: Thing, idTo: string) {
		const idFrom = thing.id;
		this.thing_forget(thing);
		thing.setID(idTo);
		this.thing_remember(thing);
		this.relationships_translate_idsFromTo_forParents(idFrom, idTo, false);
		this.relationships_translate_idsFromTo_forParents(idFrom, idTo, true);
		this.traits_translate_idsFromTo_forThings(idFrom, idTo);
		this.tags_translate_idsFromTo_forThings(idFrom, idTo);
	}

	thing_remember_runtimeCreateUnique(idBase: string, id: string, title: string, color: string, t_thing: T_Thing = T_Thing.generic,
		already_persisted: boolean = false): Thing {
		let thing = this.thing_forHID(id?.hash() ?? null);
		if (!thing) {
			thing = this.thing_remember_runtimeCreate(idBase, id, title, color, t_thing, already_persisted);
		}
		return thing;
	}

	thing_remember_runtimeCreate(idBase: string, id: string, title: string, color: string, t_thing: T_Thing = T_Thing.generic,
		already_persisted: boolean = false, needs_upgrade: boolean = false): Thing {
		const thing = this.thing_runtimeCreate(idBase, id, title, color, t_thing, already_persisted);
		this.thing_remember(thing);
		if (needs_upgrade) {
			thing.set_isDirty();	// add type and remove trait fields
		}
		return thing;
	}

	async thing_remember_runtimeCopy(idBase: string, original: Thing) {
		const copiedThing = new Thing(idBase, Identifiable.newID(), original.title, original.color, original.t_thing);
		const prohibitedTraits: string[] = [T_Thing.externals, T_Thing.root, T_Thing.bulk];
		if (prohibitedTraits.includes(original.t_thing)) {
			copiedThing.t_thing = T_Thing.generic;
		}
		this.thing_remember(copiedThing);
		return copiedThing;
	}

	async thing_edit_persistentAddLine(ancestry: Ancestry, below: boolean = true) {
		const parentAncestry = ancestry.parentAncestry;
		const parent = parentAncestry?.thing;
		const thing = ancestry.thing;
		if (!!thing && parent && parentAncestry) {
			const order = ancestry.order + (below ? k.halfIncrement : -k.halfIncrement);
			const child = this.thing_runtimeCreate(thing.idBase, Identifiable.newID(), k.title.line, parent.color, T_Thing.generic);
			await this.ancestry_edit_persistentAddAsChild(parentAncestry, child, order, false);
		}
	}

	async thing_edit_persistentDuplicate(ancestry: Ancestry) {
		const thing = ancestry.thing;
		const id = thing?.id;
		const parentAncestry = ancestry.parentAncestry;
		if (!!thing && id && parentAncestry) {
			const sibling = await this.thing_remember_runtimeCopy(id, thing);
			sibling.title = 'idea';
			await this.ancestry_edit_persistentAddAsChild(parentAncestry, sibling, ancestry.order + k.halfIncrement);
		}
	}

	async thing_remember_persistentRelocateChild(child: Thing, fromParent: Thing, toParent: Thing): Promise<any> {
		let relationship = this.relationship_whereHID_isChild(child.hid);
		if (!!relationship && relationship.idParent == fromParent.id) {
			relationship.assign_idParent(toParent.id);
			if (relationship.isValid) {
				await relationship.persist();
			}
		}
	}

	thing_forAncestry(ancestry: Ancestry): Thing | null {
		let thing: Thing | null = this.thing_byAncestryHID[ancestry.hid];
		if (!thing) {
			if (ancestry.isRoot) {
				thing = this.root;
			} else {
				thing = ancestry.thingAt(1) ?? null;	// always recompute
			}
			if (!!thing) {
				this.thing_byAncestryHID[ancestry.hid] = thing;
			}
		}
		return thing;
	}

	thing_forget(thing: Thing) {
		const t_thing = thing.t_thing;
		if (t_thing != T_Thing.root) {		// must NOT forget root
			const typed_things = this.things_byType[t_thing];
			const titled_things = this.things_byTitle[thing.title];
			delete this.thing_byHID[thing.hid];
			this.things = Identifiable.remove_byHID<Thing>(this.things, thing);
			if (!!typed_things) {
				delete this.things_byType[t_thing];
			}
			if (!!titled_things) {
				delete this.things_byTitle[thing.title];
			}
		}
	}

	thing_remember(thing: Thing) {
		if (!!thing && !this.thing_forHID(thing.hid)) {
			const typed_things = this.things_byType[thing.t_thing] ?? [];
			const titled_things = this.things_byTitle[thing.title] ?? [];
			this.thing_byHID[thing.hid] = thing;
			if (!this.things.map(t => t.id).includes(thing.id)) {
				this.things.push(thing);
			}
			if (thing.isRoot && (!thing.idBase || [k.empty, this.db.idBase].includes(this.db.idBase))) {
				this.root = thing;
			}
			if (!typed_things.map(t => t.id).includes(thing.id)) {
				typed_things.push(thing);
				this.things_byType[thing.t_thing] = typed_things;
			}
			if (!titled_things?.includes(thing)) {
				titled_things.push(thing);
				this.things_byTitle[thing.title] = titled_things;
			}
		}
	}

	thing_runtimeCreate(idBase: string, id: string, title: string, color: string, t_thing: T_Thing,
		already_persisted: boolean = false): Thing {
		let thing: Thing | null = null;
		if (id && t_thing == T_Thing.root && idBase != this.db.idBase) {			// other bulks have their own root & id
			thing = this.bulkAlias_remember_forRootID_create(idBase, id, color);		// which our thing needs to adopt
		} else {
			thing = new Thing(idBase, id, title, color, t_thing, already_persisted);
			if (thing.isBulkAlias) {
				thing.persistence.needsBulkFetch = true;
				if (title.includes('@')) {
					const parts = title.split('@');
					thing.title = parts[0];
					thing.bulkRootID = parts[1];
				}
			}
		}
		return thing!;
	}

	thing_extract_fromDict(dict: Dictionary) {
		let t_thing = dict.t_thing;
		const root = this.root;
		const isRootDict = t_thing == T_Thing.root;
		if ((!root && isRootDict) || (this.replace_rootID != dict.id)) {
			if (!!root && isRootDict) {
				t_thing = k.empty;			// prevent multiple roots
			}
			this.thing_remember_runtimeCreateUnique(this.db.idBase, dict.id, dict.title, dict.color, t_thing);
		} else if (!!root && isRootDict && !this.db.isRemote) {
			root.title = dict.title;	// new title for root (only in local or test)
		}
	}

	async thing_forget_persistentDelete(thing: Thing) {
		const relationships = u.uniquely_concatenateArrays_ofIdentifiables(
			this.relationships_byChildHID[thing.hid] ?? [],
			this.relationships_byParentHID[thing.hid] ?? []
		) as Array<Relationship>;
		thing.remove_fromGrabbed_andExpanded_andResolveFocus();
		this.thing_forget(thing);				// forget so onSnapshot logic will not signal children, do first so UX updates quickly
		await this.db.thing_persistentDelete(thing);
		for (const ancestry of thing.ancestries) {
			this.ancestry_forget(ancestry);
		}
		for (const trait of thing.traits) {
			this.trait_forget(trait)
			await this.db.trait_persistentDelete(trait);
		}
		for (const relationship of relationships) {
			this.relationship_forget(relationship);		// forget so onSnapshot logic will not signal children
			await this.db.relationship_persistentDelete(relationship);
		}
	}

	static readonly _____BULKS: unique symbol;

	bulkAlias_forTitle(title: string | null) {
		if (!!title) {
			const bulkAliases = this.things_byType[T_Thing.bulk] ?? [];
			for (const bulkAlias of bulkAliases) {
				if  (bulkAlias.title == title) {		// special case TODO: convert to a query string
					return bulkAlias;
				}
			}
		}
		return null;
	}

	bulkAlias_remember_forRootID_create(title: string, rootID: string, color: string) {
		const bulkAlias = this.bulkAlias_forTitle(title);
		if (!!bulkAlias) {
			// rootID is of the root thing from bulk fetch all
			// i.e., it is the root id from another idBase (title)
			// need a second thing remembered by this root id
			// so children relationships will work
			this.thing_byHID[rootID.hash()] = bulkAlias;
			bulkAlias.persistence.needsBulkFetch = true;
			bulkAlias.bulkRootID = rootID;
			bulkAlias.color = color;
		}
		return bulkAlias;
	}

	async bulkAlias_remember_recursive_persistentRelocateRight(ancestry: Ancestry, parentAncestry: Ancestry) {
		const parent = parentAncestry.thing;
		let newThingAncestry: Ancestry | null = null;
		const thing = ancestry.thing;
		if (!!thing && parent) {
			const idBase = parent.isBulkAlias ? parent.title : parent.idBase;
			const newThing = await this.thing_remember_runtimeCopy(idBase, thing);
			newThingAncestry = parentAncestry.ancestry_createUnique_byAddingThing(newThing);
			if (!!newThingAncestry) {
				await parentAncestry.ancestry_persistentCreateUnique_byAddingThing(newThing);
				for (const childAncestry of ancestry.childAncestries) {
					this.bulkAlias_remember_recursive_persistentRelocateRight(childAncestry, newThingAncestry);
				}
				if (!newThingAncestry.isExpanded) {
					setTimeout(() => {
						if (!!newThingAncestry) {
							newThingAncestry.expand();	
							ancestry.collapse()
						};
					}, 2);
				}
				await this.ancestry_forget_persistentUpdate(ancestry);
			}
		}
		return newThingAncestry;
	}

	static readonly _____RELATIONSHIPS: unique symbol;

	relationships_forKind(kind: T_Predicate): Array<Relationship> { return this.relationships_byKind[kind] ?? [];; }

	relationships_refreshKnowns() {
		const saved = this.relationships;
		this.relationships_forget_all();
		saved.map(r => this.relationship_remember(r));
	}

	relationships_forget_all() {
		this.relationships_byParentHID = {};
		this.relationships_byChildHID = {};
		this.relationship_byHID = {};
		this.relationships = [];
	}

	relationships_areAllValid_forIDs(ids: string[]) {
		for (const id of ids) {		// ignore empty id (root placeholder)
			if (id != k.empty && !this.relationship_forHID(id.hash())) {
				return false;
			}
		}
		return true;
	}

	relationships_forKindPredicate_hid_thing_isChild(kind: string, hid: Integer, forParents: boolean): Array<Relationship> {
		const dict = forParents ? this.relationships_byChildHID : this.relationships_byParentHID;
		const matches = dict[hid] as Array<Relationship>; // filter out bad values (dunno what this does)
		const array: Array<Relationship> = [];
		if (Array.isArray(matches)) {
			for (const relationship of matches) {
				if (relationship.kind == kind && !array.includes(relationship)) {
					array.push(relationship);
				}
			}
		}
		return array;
	}

	async relationships_removeHavingNullReferences() {
		// const array = Array<Relationship>();
		for (const relationship of this.relationships) {
			if (!relationship.child || !relationship.parent) {
				console.log(`has null reference ${relationship.description}`);
				// array.push(relationship);
			}
		}
		// for (const relationship of array) {
		// 	console.log(`has null reference ${relationship.description}`);
		// 	this.relationship_forget(relationship);
		// 	await this.db.relationship_persistentDelete(relationship);
		// }
	}

	relationships_translate_idsFromTo_forParents(idFrom: string, idTo: string, forParents: boolean) {
		for (const predicate of this.predicates) {
			const relationships = this.relationships_forKindPredicate_hid_thing_isChild(predicate.kind, idFrom.hash(), forParents);
			for (const relationship of relationships) {
				if (!forParents && relationship.idParent != idTo) {
					relationship.assign_idParent(idTo);
				}
				if (forParents && relationship.idChild != idTo) {
					this.relationship_forget(relationship);
					relationship.hidChild = idTo.hash();
					relationship.idChild = idTo;
					relationship.set_isDirty();
					this.relationship_remember(relationship);
				}
			}
		}
	}

	static readonly _____RELATIONSHIP: unique symbol;

	relationship_forHID(hid: Integer): Relationship | null { return this.relationship_byHID[hid ?? undefined]; }

	relationship_whereHID_isChild(hid_thing: Integer, isChild: boolean = true): Relationship | null {
		const matches = this.relationships_forKindPredicate_hid_thing_isChild(T_Predicate.contains, hid_thing, isChild);
		return matches.length == 0 ? null : matches[0];
	}

	relationship_remember_ifValid(relationship: Relationship) {
		if (relationship.isValid) {
			this.relationship_remember(relationship);
		} else {
			console.log(`invalid relationship ${relationship.description}`);
		}
	}
	
	relationship_forget_forHID(relationships: Relationships_ByHID, hid: Integer, relationship: Relationship) {
		let array = relationships[hid] ?? [];
		array = Identifiable.remove_byHID<Relationship>(array, relationship);
		if (array.length == 0) {
			delete relationships[hid];
		} else {
			relationships[hid] = array;
		}
	}

	relationship_extract_fromDict(dict: Dictionary) {
		this.relationship_replace_idsFromTo_inDict(this.replace_rootID, this.idRoot, dict);
		let idParent = dict.idParent;
		if (!!idParent) {
			if (idParent == dict.idChild) {
				console.log('preventing infinite recursion')
			} else {
				this.relationship_remember_runtimeCreateUnique(this.db.idBase, dict.id, dict.kind, idParent, dict.idChild, dict.orders);
			}
		}
	}

	relationship_remember_byKnown(relationship: Relationship, hid: Integer, relationships: Relationships_ByHID) {
		let array = relationships[hid] ?? [];
		if (!array.map(r => r.id).includes(relationship.id)) {
			array.push(relationship);
		}
		relationships[hid] = array;
	}

	relationship_forPredicateKind_parent_child(kind: string, hidParent: Integer, hidChild: Integer): Relationship | null {
		const matches = this.relationships_forKindPredicate_hid_thing_isChild(kind, hidParent, false);
		if (Array.isArray(matches)) {
			for (const relationship of matches) {
				if (relationship.hidChild == hidChild) {
					return relationship;
				}
			}
		}
		return null;
	}

	async relationship_remember_persistentCreateUnique(idBase: string, idRelationship: string, kind: T_Predicate, idParent: string, idChild: string,
		order: number, parentOrder: number = 0, creationOptions: T_Create = T_Create.isFromPersistent): Promise<any> {
		const relationship = this.relationship_remember_createUnique(idBase, idRelationship, kind, idParent, idChild, order, parentOrder, creationOptions);
		await this.db.relationship_remember_persistentCreate(relationship);
		return relationship;
	}

	relationship_remember_createUnique(idBase: string, idRelationship: string, kind: T_Predicate, idParent: string, idChild: string,
		order: number, parentOrder: number = 0, creationOptions: T_Create = T_Create.isFromPersistent): Relationship {
		let relationship = this.relationship_forPredicateKind_parent_child(kind, idParent.hash(), idChild.hash());
		if (!!relationship) {
			relationship.order_setTo(order, T_Order.child);
		} else {
			relationship = new Relationship(idBase, idRelationship, kind, idParent, idChild, [order, parentOrder], creationOptions == T_Create.isFromPersistent);
			
		}
		return relationship;
	}

	relationship_forget(relationship: Relationship) {
		delete this.relationship_byHID[relationship.hid];
		const relationships = this.relationships_forKind(relationship.kind);
		this.relationships = Identifiable.remove_byHID<Relationship>(this.relationships, relationship);
		this.relationship_forget_forHID(this.relationships_byChildHID, relationship.hidChild, relationship);
		this.relationship_forget_forHID(this.relationships_byParentHID, relationship.hidParent, relationship);
		relationship.remove_from(relationships);
	}
	
	relationship_remember(relationship: Relationship) {
		if (!this.relationship_byHID[relationship.hid]) {
			let relationships = this.relationships_forKind(relationship.kind)
			if (!this.relationships.map(r => r.id).includes(relationship.id)) {
				this.relationships.push(relationship);
			}
			if (!relationships.map(r => r.id).includes(relationship.id)) {
				relationships.push(relationship);
				this.relationships_byKind[relationship.kind] = relationships;
			}
			this.relationship_byHID[relationship.hid] = relationship;
			this.relationship_remember_byKnown(relationship, relationship.hidChild, this.relationships_byChildHID);
			this.relationship_remember_byKnown(relationship, relationship.hidParent, this.relationships_byParentHID);
			if (relationship.idBase != this.db.idBase) {
				alert(`relationship crossing dbs: ${relationship.description}`);
			}
		}
	}

	relationship_replace_idsFromTo_inDict(idFrom: string | null, idTo: string | null, dict: Dictionary) {
		if (!!idFrom && !!idTo) {
			let idChild = dict.idChild;
			let idParent = dict.idParent;
			const isBidirectional = Predicate.isBidirectional_for(dict.kind);
			if (idParent == idFrom) {
				dict.idParent = idTo;
			}
			if (idChild == idFrom && isBidirectional) {
				dict.idChild = idTo;
			}
		}
	}

	async relationship_xforget_persistentDelete(ancestry: Ancestry) {
		const relationship = ancestry.relationship;
		if (!!relationship) {
			this.relationship_forget(ancestry.relationship);
			if (ancestry.hasChildren) {
				ancestry.parentAncestry?.order_normalizeRecursive();
			} else {
				ancestry.collapse();
			}
			await this.db.relationship_persistentDelete(relationship);
		}
	}

	async relationship_forget_persistentDelete(ancestry: Ancestry, otherAncestry: Ancestry, predicate: Predicate) {
		const thing = ancestry.thing;
		const parentAncestry = ancestry.parentAncestry;
		const relationship = this.relationship_forPredicateKind_parent_child(predicate.kind, otherAncestry.id_thing.hash(), ancestry.id_thing.hash());
		if (!!parentAncestry && !!relationship && (thing?.hasParents ?? false)) {
			this.relationship_forget(relationship);
			if (otherAncestry.hasChildren) {
				parentAncestry.order_normalizeRecursive();
			} else {
				otherAncestry.collapse();
			}
			await this.db.relationship_persistentDelete(relationship);
			if (!!predicate && predicate.isBidirectional) {
				const reversed = relationship?.reversed;
				if (!!reversed) {
					this.relationship_forget(reversed);
					await this.db.relationship_persistentDelete(reversed);
				}
			}
		}
	}

	relationship_remember_runtimeCreateUnique(idBase: string, id: string, kind: T_Predicate, idParent: string, idChild: string,
		orders: number[], creationOptions: T_Create = T_Create.none): Relationship {
		let relationship = this.relationship_forPredicateKind_parent_child(kind, idParent.hash(), idChild.hash());
		const already_persisted = creationOptions == T_Create.isFromPersistent;
		if (!relationship) {
			relationship = new Relationship(idBase, id, kind, idParent, idChild, orders, already_persisted);
			this.relationship_remember(relationship);
		}
		let reversed = relationship?.reversed;
		if (Predicate.isBidirectional_for(kind) && !reversed) {
			reversed = relationship.reversed_remember_createUnique;
		}
		relationship?.order_setTo(orders[T_Order.other], T_Order.other);
		reversed?.order_setTo(orders[T_Order.other]);
		relationship?.order_setTo(orders[T_Order.child]);
		return relationship;
	}

	static readonly _____ANCESTRIES: unique symbol;

	get ancestries(): Array<Ancestry> { return Object.values(this.ancestry_byHID); }
	ancestries_byHID_forKind(kind: string) { return this.ancestry_byKind_andHID[kind] ?? {}; }
	get ancestries_thatAreVisible(): Array<Ancestry> { return this.rootAncestry.visibleSubtree_ancestries(); }

	ancestries_forget_all() {
		this.ancestry_byHID = {};
		this.ancestries_byThingHID = {};
		this.ancestry_byKind_andHID = {};
	}

	ancestries_fullRebuild() {		// for Firebase only
		const rootAncestry = this.rootAncestry;
		this.ancestries_forget_all();
		this.ancestry_remember(rootAncestry);
		signals.signal_rebuildGraph_from(rootAncestry);
	}

	async ancestries_rebuild_traverse_persistentDelete(ancestries: Array<Ancestry>) {
		if (get(w_ancestry_focus)) {
			for (const ancestry of ancestries) {
				const thing = ancestry.thing;
				const parentAncestry = ancestry.parentAncestry;
				if (!!parentAncestry && !!thing && !thing.isBulkAlias) {
					const grandParentAncestry = parentAncestry?.parentAncestry;
					const siblings = parentAncestry.children;
					let index = siblings.indexOf(thing);
					siblings.splice(index, 1);
					parentAncestry.grabOnly();
					if (siblings.length == 0) {
						parentAncestry.collapse();
						if (!!grandParentAncestry && !grandParentAncestry.isVisible) {
							grandParentAncestry.becomeFocus();	// call become focus before applying
						}
					}
					await ancestry.async_traverse(async (progenyAncestry: Ancestry): Promise<boolean> => {
						await this.ancestry_forget_persistentUpdate(progenyAncestry);
						return false; // continue the traversal
					});
				}
			}
			debug.log_grab(`  DELETE, FOCUS grabbed: "${get(w_ancestry_focus).isGrabbed}"`);
			layout.grand_build();
		}
	}

	static readonly _____ALTERATION: unique symbol;

	async ancestry_alter_connectionTo_maybe(ancestry: Ancestry) {
		if (ancestry.alteration_isAllowed) {
			const alteration = get(w_s_alteration);
			const from_ancestry = alteration?.ancestry;
			const predicate = alteration?.predicate;
			if (!!alteration && !!from_ancestry && !!predicate) {
				switch (alteration.t_alteration) {
					case T_Alteration.delete:
						await this.relationship_forget_persistentDelete(from_ancestry, ancestry, predicate);
						break;
					case T_Alteration.add:
						const from_thing = from_ancestry.thing;
						if (!!from_thing) {
							await ancestry.ancestry_persistentCreateUnique_byAddingThing(from_thing, predicate.kind);
						}
						break;
				}
				this.stop_alteration();
				layout.grand_build();
			}
		}
	}

	static readonly _____ANCESTRY: unique symbol;
	
	ancestry_forHID(hid: Integer): Ancestry | null { return this.ancestry_byHID[hid] ?? null; }
	ancestries_forThing(thing: Thing): Array<Ancestry> { return this.ancestries_byThingHID[thing.hid] ?? []; }

	async ancestry_persistentCreateUnique(name: string, parent: Ancestry, t_thing: T_Thing): Promise<Ancestry | null> {
		const thing = this.thing_remember_runtimeCreateUnique(this.db.idBase, name, name, colors.default, t_thing);
		const ancestry = await parent.ancestry_persistentCreateUnique_byAddingThing(thing);
		return ancestry ?? null;
	}

	ancestry_remember(ancestry: Ancestry) {
		const hid = ancestry.hid;
		let dict = this.ancestries_byHID_forKind(ancestry.kind);
		this.ancestry_byHID[hid] = ancestry;
		dict[hid] = ancestry;
		this.ancestry_byKind_andHID[ancestry.kind] = dict;
		this.ancestry_remember_forThingOfAncestry(ancestry);
	}
	
	ancestry_forget(ancestry: Ancestry | null) {
		if (!!ancestry) {
			const hid = ancestry.hid;
			let dict = this.ancestries_byHID_forKind(ancestry.kind);
			delete this.ancestry_byHID[hid];
			delete dict[hid];
			this.ancestry_byKind_andHID[ancestry.kind] = dict;
			this.ancestry_forget_forThingOfAncestry(ancestry);
		}
	}

	ancestry_remember_forThingOfAncestry(ancestry: Ancestry) {
		const thing = ancestry.thing;
		if (!!thing) {
			let ancestries = this.ancestries_byThingHID[thing.hid] ?? [];
			if (!ancestries.includes(ancestry)) {
				ancestries.push(ancestry);
				this.ancestries_byThingHID[thing.hid] = ancestries;
			}
		}
	}

	ancestry_forget_forThingOfAncestry(ancestry: Ancestry) {
		const thing = ancestry.thing;
		if (!!thing) {
			let ancestries = this.ancestries_byThingHID[thing.hid];
			if (!!ancestries) {
				const index = ancestries.indexOf(ancestry);
				if (index !== -1) {
					ancestries.splice(index, 1);
					this.ancestries_byThingHID[thing.hid] = ancestries;
				}
			}
		}
	}

	get ancestry_forBreadcrumbs(): Ancestry {
		const focus = get(w_ancestry_focus);
		const grab = grabs.latest;
		const grab_containsFocus = !!grab && focus.isAProgenyOf(grab)
		return (!!grab && !grab_containsFocus) ? grab : focus;
	}

	ancestry_isAssured_valid_forPath(path: string): Ancestry | null {
		if (path == k.root_path) {
			return this.rootAncestry;
		} else {
			const ids = path.split(k.separator.generic);						// path is multiple relationship ids separated by separator.generic
			const id = ids.slice(-1)[0];										// grab last relationship id
			const kind = this.predicate_kindFor_idRelationship(id);	// grab its predicate kind
			const notValid = !this.relationships_areAllValid_forIDs(ids) || !kind;
			return notValid ? null : this.ancestry_remember_createUnique(path, kind);
		}
	}

	async ancestry_forget_persistentUpdate(ancestry: Ancestry) {
		const thing = ancestry.thing;
		this.ancestry_forget(ancestry);
		if (!!thing) {
			await this.thing_forget_persistentDelete(thing);
		}
	}

	async ancestry_remember_bulk_persistentRelocateRight(ancestry: Ancestry, parentAncestry: Ancestry) {
		const newThingAncestry = await this.bulkAlias_remember_recursive_persistentRelocateRight(ancestry, parentAncestry);
		if (!!newThingAncestry) {
			signals.signal_reattach_widgets_from(parentAncestry);
			if (parentAncestry.isExpanded) {
				newThingAncestry.grabOnly();
			} else {
				parentAncestry.grabOnly();
			}
		}
	}

	ancestry_remember_createUnique(path: string = k.root_path, kind: string = T_Predicate.contains): Ancestry {
		const hid = path.hash();
		let dict = this.ancestries_byHID_forKind(kind);
		let ancestry = dict[hid];
		if (!ancestry) {
			ancestry = new Ancestry(this.db.t_database, path, kind);
			this.ancestry_remember(ancestry);
		}
		return ancestry;
	}

	async ancestry_toggle_expansion(ancestry: Ancestry) {
		if (ux.inRadialMode) {
			// kludge for now? in radial mode we need to do a bit extra for our user
			await this.ancestry_rebuild_persistentMoveRight(ancestry, !ancestry.isExpanded, false, false, false, false);
			layout.grand_build();
		} else if (ancestry.toggleExpanded()) {
			layout.grand_build();
		}
	}

	async ancestry_edit_persistentCreateChildOf(parentAncestry: Ancestry | null) {
		const thing = parentAncestry?.thing;
		if (!!thing && !!parentAncestry) {
			const child = await this.thing_remember_runtimeCopy(thing.idBase, thing);
			child.title = 'idea';
			parentAncestry.expand();
			await this.ancestry_edit_persistentAddAsChild(parentAncestry, child, 0);
		}
	}

	// called in three places
	async ancestry_edit_persistentAddAsChild(parentAncestry: Ancestry, child: Thing, order: number, shouldStartEdit: boolean = true) {
		w_s_text_edit?.set(null);
		await parentAncestry.ancestry_persistentCreateUnique_byAddingThing(child)
		.then((childAncestry) => {
			if (!!childAncestry) {
				childAncestry.grabOnly();
				childAncestry.order_setTo(order);
				if (!parentAncestry.isRoot && ux.inRadialMode) {
					parentAncestry.becomeFocus();
				}
				layout.grand_build();
				if (shouldStartEdit) {
					setTimeout(() => {
						childAncestry.startEdit();
					}, 20);
				}
			}
		})
	}

	get ancestry_externals(): Promise<Ancestry | null> {
		return (async () => {
			const externalsAncestry = await this.ancestry_assure_externals;		// TODO: assumes all ancestries created
			if (!!externalsAncestry) {
				this.externalsAncestry = externalsAncestry;
			}
			return externalsAncestry;
		})();
	}

	// create the externals ancestry
	// still can be null, but only if root ancestry is null
	
	get ancestry_assure_externals(): Promise<Ancestry | null> {		// TODO: requires all ancestries created and externals thing too
		return (async () => {
			this.assure_root_andAncestry();
			let externalsAncestry: Ancestry | null = null;
			const rootAncestry = this.rootAncestry;
			if (!!rootAncestry) {
				const externalsArray = this.things_byType[T_Thing.externals] ?? [];		// there should only be one
				const length = externalsArray.length;
				if (!!length) {
					for (const externalsThing of externalsArray) {				// add to the root ancestry
						if  (externalsThing.title == 'externals') {
							return rootAncestry.ancestry_createUnique_byAddingThing(externalsThing) ?? null;
						}
					}
				}
				const externalsThing = this.thing_remember_runtimeCreateUnique(this.db.idBase, Identifiable.newID(), 'externals', 'red', T_Thing.externals);

				// VITAL: the following code has problems

				await externalsThing.persist();
				await rootAncestry.ancestry_persistentCreateUnique_byAddingThing(externalsThing)
				.then((ancestry) => {
					console.log(`externalsAncestry is wrong type: "${ancestry?.thing?.t_thing ?? 'unknown'}" (should be "^")`)
					// externalsAncestry = ancestry;
				});
			}
			return externalsAncestry;
		})();
	}

	async ancestry_redraw_persistentFetchBulk_browseRight(thing: Thing, ancestry: Ancestry | null = null, grab: boolean = false) {
		if (!!thing && !!this.externalsAncestry && thing.title != 'externals') {	// not create externals bulk
			await this.db.hierarchy_fetch_forID(thing.title)
			this.relationships_refreshKnowns();
			const childAncestries = ancestry?.childAncestries;
			const isRadialMode = ux.inRadialMode;
			if (!!childAncestries && childAncestries.length > 0) {
				if (!!grab) {
					childAncestries[0].grabOnly()
				}
				ancestry?.expand()
				if (!isRadialMode) {
					layout.grand_build();	// not rebuild until focus changes
				}
			}
			if (isRadialMode) {
				ancestry?.becomeFocus();
				layout.grand_build();
			}
		}
	}

	async ancestry_rebuild_persistentMoveRight(ancestry: Ancestry, RIGHT: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean, fromReveal: boolean) {
		if (!OPTION) {
			const thing = ancestry.thing;
			if (!!thing) {
				if (RIGHT && thing.persistence.needsBulkFetch) {
					await this.ancestry_redraw_persistentFetchBulk_browseRight(thing, ancestry, true);
				} else {
					this.ancestry_rebuild_runtimeBrowseRight(ancestry, RIGHT, SHIFT, EXTREME, fromReveal);
				}
			}
		} else if (c.allow_GraphEditing) {
			const grab = grabs.latest_upward(true);
			if (!!grab) {
				this.ancestry_rebuild_persistentRelocateRight(grab, RIGHT, EXTREME);
			}
		}
	}

	ancestry_rebuild_persistentMoveUp_maybe(ancestry: Ancestry, up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean) {
		const [graph_needsRebuild, graph_needsRelayout] = ancestry.persistentMoveUp_maybe(up, SHIFT, OPTION, EXTREME);
		if (graph_needsRebuild) {
			layout.grand_build();
		} else if (graph_needsRelayout) {
			signals.signal_reattach_widgets_fromFocus();
		}
	}

	// won't work for relateds
	ancestry_rebuild_persistentRelocateRight(ancestry: Ancestry, RIGHT: boolean, EXTREME: boolean) {
		let parentAncestry = RIGHT ? ancestry.ancestry_ofNextSibling(false) : ancestry.ancestry_createUnique_byStrippingBack(2);
		let relocatedAncestry: Ancestry | null = null;
		const parentThing = parentAncestry?.thing;
		const thing = ancestry.thing;
		if (!!thing && !!parentThing && !!parentAncestry) {
			if (thing.isInDifferentBulkThan(parentThing)) {		// should move across bulks
				this.ancestry_remember_bulk_persistentRelocateRight(ancestry, parentAncestry);
			} else {
				const depth_limit = get(w_depth_limit);
				const relationship = ancestry.relationship;
				if (!!relationship) {
					// move ancestry to a different parent
					const order = !RIGHT ? 0 : relationship.orders[T_Order.child] ?? 0;
					relationship.assign_idParent(parentThing.id);
					relationship.order_setTo(order + k.halfIncrement, T_Order.child);
					debug.log_move(`relocate ${relationship.description}`)
					relocatedAncestry = parentAncestry.ancestry_createUnique_byAppending_relationshipID(relationship!.id);
					relocatedAncestry?.grabOnly();
				}
				this.rootAncestry.order_normalizeRecursive();
				if (!parentAncestry.isExpanded) {
					parentAncestry.expand();
				}
				const needsRefocus = RIGHT && !!relocatedAncestry && relocatedAncestry.depth_ofFocus >= depth_limit;
				if (!parentAncestry.isVisible || needsRefocus) {
					if (needsRefocus && !!relocatedAncestry) {
						parentAncestry = relocatedAncestry.ancestry_createUnique_byStrippingBack(depth_limit);
					}
					parentAncestry?.becomeFocus();
				}
			}
			layout.grand_build();			// so Tree_Branches component will update
		}
	}

	ancestry_rebuild_runtimeBrowseRight(ancestry: Ancestry, RIGHT: boolean, SHIFT: boolean, EXTREME: boolean, fromReveal: boolean) {
		let newFocusAncestry = ancestry.parentAncestry;
		const childAncestry = ancestry.ancestry_ofFirst_visibleChild;
		let newGrabAncestry: Ancestry | null = RIGHT ? childAncestry : newFocusAncestry;
		const newGrabIsNotFocus = !newGrabAncestry?.isFocus;
		let graph_needsRebuild = false;
		if (RIGHT) {
			if (!ancestry.hasRelevantRelationships && ux.inTreeMode) {
				return;
			} else {
				if (SHIFT) {
					newGrabAncestry = null;
				}
				if (ux.inTreeMode) {
					const depth_limit = get(w_depth_limit);
					graph_needsRebuild = ancestry.expand();
					if (!!newGrabAncestry && newGrabAncestry.depth_ofFocus >= depth_limit) {
						newFocusAncestry = newGrabAncestry.ancestry_createUnique_byStrippingBack(depth_limit);
					} else {
						newFocusAncestry = null;
					}
				} else {
					newFocusAncestry = ancestry;
					if (!!childAncestry && !childAncestry.isVisible) {
						const g_paging = ancestry.g_paging
						g_paging?.ancestry_atIndex(ancestry.childAncestries).grab()
						graph_needsRebuild = true;
					}
				}
			}
		} else {
			const rootAncestry = this.rootAncestry;
			if (EXTREME) {
				graph_needsRebuild = rootAncestry?.becomeFocus();	// tells graph to update line rects
			} else if (!SHIFT) {
				if (fromReveal) {
					graph_needsRebuild = ancestry.toggleExpanded();
				} else if (newGrabIsNotFocus && !!newGrabAncestry && !newGrabAncestry.isExpanded) {
					graph_needsRebuild = newGrabAncestry.expand();
				}
			} else if (!!newGrabAncestry) { 
				if (ancestry.isExpanded) {
					graph_needsRebuild = ancestry.collapse();
					newGrabAncestry = !ancestry.isVisible ? ancestry : null;
				} else if (newGrabAncestry.isExpanded || (!!rootAncestry && !rootAncestry.equals(newGrabAncestry))) {
					graph_needsRebuild = newGrabAncestry.collapse();
				}
			}
		}
		w_s_text_edit?.set(null);
		if (!!newGrabAncestry) {
			newGrabAncestry.grabOnly();
			if (!!newFocusAncestry) {
				const newFocusIsGrabbed = newFocusAncestry.equals(newGrabAncestry);
				const becomeFocus = newGrabIsNotFocus && (!SHIFT || newFocusIsGrabbed) && (RIGHT || !newFocusAncestry.isVisible);
				if (becomeFocus && newFocusAncestry.becomeFocus()) {
					graph_needsRebuild = true;
				}
			}
		}
		if (graph_needsRebuild) {
			layout.grand_build();
		} else {
			layout.grand_layout();
		}
	}

	static readonly _____PREDICATES: unique symbol;

	predicates_byDirection(isBidirectional: boolean) { return this.predicate_byDirection[isBidirectional ? 1 : 0]; }

	predicates_forget_all() {
		this.relationship_byHID = {};
		this.predicates = [];
	}

	predicates_refreshKnowns() {
		const saved = this.predicates;
		this.predicates_forget_all();
		saved.map(p => this.predicate_remember(p));
	}

	static readonly _____PREDICATE: unique symbol;

	predicate_forKind(kind: string | null): Predicate | null { return !kind ? null : this.predicate_byKind[kind]; }

	predicate_kindFor_idRelationship(idRelationship: string): string | null {
		const relationship = this.relationship_forHID(idRelationship.hash());
		return relationship?.kind ?? null;			// grab its predicate kind
	}

	predicate_extract_fromDict(dict: Dictionary) {
		const predicate = this.predicate_remember_runtimeCreateUnique(dict.id, dict.kind, dict.isBidirectional, false);
	}

	predicate_forget(predicate: Predicate) {
		let predicates = this.predicates_byDirection(predicate.isBidirectional) ?? [];
		predicates = Identifiable.remove_byHID<Predicate>(predicates, predicate);
		if (predicates.length == 0) {
			delete this.predicate_byDirection[predicate.isBidirectional ? 1 : 0];
		} else {
			this.predicate_byDirection[predicate.isBidirectional ? 1 : 0] = predicates;
		}
		this.predicates = Identifiable.remove_byHID<Predicate>(this.predicates, predicate);
		delete this.predicate_byKind[predicate.kind];
	}

	predicate_defaults_remember_runtimeCreate() {
		this.predicate_remember_runtimeCreateUnique(Predicate.newID(), T_Predicate.contains, false, false);
		this.predicate_remember_runtimeCreateUnique(Predicate.newID(), T_Predicate.isRelated, true, false);
		this.predicate_remember_runtimeCreateUnique(Predicate.newID(), T_Predicate.explains, false, false);
		this.predicate_remember_runtimeCreateUnique(Predicate.newID(), T_Predicate.requires, false, false);
		this.predicate_remember_runtimeCreateUnique(Predicate.newID(), T_Predicate.supports, false, false);
		this.predicate_remember_runtimeCreateUnique(Predicate.newID(), T_Predicate.appreciates, false, false);
	}

	predicate_remember(predicate: Predicate) {
		this.predicate_byKind[predicate.kind] = predicate;
		let predicates = this.predicates_byDirection(predicate.isBidirectional) ?? [];
		if (!this.predicates.map(p => p.id).includes(predicate.id)) {
			this.predicates.push(predicate);
		}
		if (!predicates.map(p => p.id).includes(predicate.id)) {
			predicates.push(predicate);
			this.predicate_byDirection[predicate.isBidirectional ? 1 : 0] = predicates;
		}
	}

	predicate_remember_runtimeCreateUnique(id: string, kind: T_Predicate, isBidirectional: boolean, already_persisted: boolean = true) {
		let predicate = this.predicate_forKind(kind);
		if (!predicate) {
			predicate = this.predicate_remember_runtimeCreate(id, kind, isBidirectional, already_persisted);
		}
		return predicate;
	}

	predicate_remember_runtimeCreate(id: string, kind: T_Predicate, isBidirectional: boolean, already_persisted: boolean = true) {
		let predicate = new Predicate(id, kind, isBidirectional, already_persisted);
		this.predicate_remember(predicate);
		return predicate;
	}

	static readonly _____TRAITS: unique symbol;

	traits_forType(t_trait: T_Trait): Array<Trait> | null { return this.traits_byType[t_trait]; }

	traits_forOwnerHID(hid: Integer | null): Array<Trait> | null {
		const value = !!hid ? this.traits_byOwnerHID?.[hid] : null;
		return (value instanceof Array) ? value : null;
	}

	traits_refreshKnowns() {
		const traits = this.traits;
		this.traits_forget_all();
		traits.map(t => this.trait_remember(t));
		this.traits = traits;
	}

	traits_forget_all() {
		this.traits_byOwnerHID = {};
		this.traits_byType = {};
		this.trait_byHID = {};
		this.traits = [];
	}

	traits_translate_idsFromTo_forThings(idFrom: string, idTo: string) {
		for (const trait of this.traits) {
			if (trait.ownerID == idFrom) {
				trait.ownerID = idTo;	// fuck! cannot reverse from hash to id
				trait.set_isDirty();
				this.trait_remember(trait);
			}
		}
	}

	static readonly _____TRAIT: unique symbol;

	trait_forHID(hid: Integer): Trait | null { return this.trait_byHID[hid ?? undefined]; }

	trait_runtimeCreate(idBase: string, id: string, ownerID: string, t_trait: T_Trait, text: string, dict: Dictionary = {}, already_persisted: boolean = false): Trait {
		return new Trait(idBase, id, ownerID, t_trait, text, dict, already_persisted);
	}

	trait_remember_runtimeCreateUnique(idBase: string, id: string, ownerID: string, t_trait: T_Trait, text: string, dict: Dictionary = {}, already_persisted: boolean = false): Trait {
		return this.trait_forHID(id?.hash()) ?? this.trait_remember_runtimeCreate(idBase, id, ownerID, t_trait, text, dict, already_persisted);
	}

	trait_forType_ownerHID(t_trait: T_Trait | null, ownerHID: Integer | null): Trait| null {
		const traits = this.traits_forOwnerHID(ownerHID)?.filter(t => t.t_trait == t_trait);
		return !traits ? null : traits[0]
	}

	trait_extract_fromDict(dict: Dictionary) {
		this.trait_remember_runtimeCreateUnique(this.db.idBase, dict.id, dict.ownerID, dict.t_trait, dict.text, dict.dict);
	}

	trait_forget(trait: Trait) {
		delete this.trait_byHID[trait.hid];
		delete this.traits_byOwnerHID[trait.ownerID.hash()];
		this.traits = Identifiable.remove_byHID<Trait>(this.traits, trait);
		this.traits_byType[trait.t_trait] = Identifiable.remove_byHID<Trait>(this.traits_byType[trait.t_trait], trait);
		if (!!trait.owner) {
			this.things_byT_Trait[trait.t_trait] = Identifiable.remove_byHID<Thing>(this.things_byT_Trait[trait.t_trait], trait.owner);
		}
	}

	trait_remember(trait: Trait) {
		const hid = trait.ownerID.hash();
		this.trait_byHID[trait.hid] = trait;
		if (!!trait.owner) {
			let things = this.things_byT_Trait[trait.t_trait] ?? [];
			things.push(trait.owner);
			this.things_byT_Trait[trait.t_trait] = things;
		}
		(this.traits_byOwnerHID[hid] = this.traits_byOwnerHID[hid] || []).push(trait);
		(this.traits_byType[trait.t_trait] = this.traits_byType[trait.t_trait] || []).push(trait);
		this.traits.push(trait);
	}

	trait_remember_runtimeCreate(idBase: string, id: string, ownerID: string, t_trait: T_Trait, text: string, dict: Dictionary = {}, already_persisted: boolean = false): Trait {
		const trait = this.trait_runtimeCreate(idBase, id, ownerID, t_trait, text, dict, already_persisted);
		this.trait_remember(trait);
		return trait;
	}

	async trait_setText_forTrait(text: string | null, trait: Trait) {
		if (text == null) {
			await this.db.persist_all(true);
		} else {
			trait.text = text;
			trait.set_isDirty();
		}
	}

	static readonly _____TAGS: unique symbol;

	tags_forThingHID(hid: Integer): Array<Tag> { return this.tags_byThingHID[hid]; }

	tags_forget_all() {
		this.tags_byThingHID = {};
		this.tag_byType = {};
		this.tags = [];
	}

	tags_refreshKnowns() {
		const tags = this.tags;
		this.tags_forget_all();
		tags.map(t => this.tag_remember(t));
		this.tags = tags;
	}

	tags_translate_idsFromTo_forThings(idFrom: string, idTo: string) {
		for (const tag of this.tags) {
			for (const hid of tag.thingHIDs) {
				if (hid == idFrom.hash()) {
					const replacementHID = idTo.hash();
					const index = tag.thingHIDs.indexOf(hid);
					tag.thingHIDs[index] = replacementHID;
					this.tag_remember(tag);
				}
			}
		}
	}

	static readonly _____TAG: unique symbol;

	tag_forType(type: string): Tag | null { return this.tag_byType[type] ?? null; }
	tag_forHID(hid: Integer): Tag | null { return this.tag_byHID[hid ?? undefined]; }

	tag_extract_fromDict(dict: Dictionary) {
		this.tag_remember_runtimeCreateUnique(this.db.idBase, dict.id, dict.type, dict.thingHIDs, busy.isFetching);
	}

	tag_forget(tag: Tag) {
		delete this.tag_byHID[tag.hid];
		delete this.tag_byType[tag.type];
		for (const hid of tag.thingHIDs) {
			const tags: Array<Tag> = this.tags_byThingHID[hid] ?? [];
			this.tags_byThingHID[hid] = tags.filter(t => t != tag);
		}
	}

	tag_remember(tag: Tag) {
		this.tags.push(tag);
		this.tag_byHID[tag.hid] = tag;
		this.tag_byType[tag.type] = tag;
		for (const hid of tag.thingHIDs) {
			const tags: Array<Tag> = this.tags_byThingHID[hid] ?? [];
			if (!tags.includes(tag)) {
				tags.push(tag)
				this.tags_byThingHID[hid] = tags;
			}
		}
	}

	tag_remember_runtimeCreateUnique_byType(idBase: string, type: string, thingHIDs: Array<Integer>, already_persisted: boolean = false): Tag {
		let tag = this.tag_forType(type);
		if (!tag) {
			tag = this.tag_remember_runtimeCreate(idBase, Identifiable.newID(), type, thingHIDs, already_persisted);
		} else {
			tag.thingHIDs = u.uniquely_concatenateArrays(tag.thingHIDs, thingHIDs);
			if (!already_persisted) {
				tag.set_isDirty();
			}
		}
		return tag;
	}

	tag_remember_runtimeCreateUnique(idBase: string, id: string, type: string, thingHIDs: Array<Integer>, already_persisted: boolean = false): Tag {
		let tag = this.tag_forHID(id?.hash());
		if (!tag) {
			tag = this.tag_remember_runtimeCreate(idBase, id, type, thingHIDs, already_persisted);
		} else {
			tag.thingHIDs = u.uniquely_concatenateArrays(tag.thingHIDs, thingHIDs);
			if (!already_persisted) {
				tag.set_isDirty();
			}
		}
		return tag;
	}

	tag_remember_runtimeCreate(idBase: string, id: string, type: string, thingHIDs: Array<Integer>, already_persisted: boolean = false): Tag {
		const tag = new Tag(idBase, id, type, thingHIDs, already_persisted);
		this.tag_remember(tag);
		if (!already_persisted) {
			tag.set_isDirty();
		}
		return tag;
	}

	static readonly _____ANCILLARY: unique symbol;

	access_runtimeCreate(idAccess: string, kind: string) {
		const access = new Access(this.db.t_database, T_Persistable.access, idAccess, kind);
		this.access_byHID[idAccess.hash()] = access;
		this.access_byKind[kind] = access;
	}

	user_runtimeCreate(id: string, name: string, email: string, phone: string) {
		const user = new User(this.db.t_database, T_Persistable.users, id, name, email, phone);
		this.user_byHID[id.hash()] = user;
	}

	static readonly _____FILES: unique symbol;

	persistRoot_toFile(format: T_File_Format) { this.persist_fromAncestry_toFile(this.rootAncestry, format); }
	persist_toFile(format: T_File_Format) { this.persist_fromAncestry_toFile(this.ancestry_forFile, format); }

	data_fromAncestry_toSave(ancestry: Ancestry): Dictionary {
		return ancestry.isRoot ? this.all_data : this.progeny_dataFor(ancestry);
	}

	select_file_toUpload(format: T_File_Format, SHIFT: boolean) {
		this.replace_rootID = SHIFT ? k.empty : null;		// to replace (or not) the root id extracted from file
		files.format_preference = format;
		w_popupView_id.set(T_Control.import);
	}

	persist_fromAncestry_toFile(ancestry: Ancestry, format: T_File_Format) {
		switch (format) {
			case T_File_Format.csv:
				alert('saving as CSV is not yet implemented');
				break;
			case T_File_Format.json:
				const data = this.data_fromAncestry_toSave(ancestry);
				const filename = `${data.title.toLowerCase()}.${format}`;
				files.persist_json_object_toFile(data, filename);
				break;
		}
	}

	private get ancestry_forFile(): Ancestry {
		const focus = get(w_ancestry_focus);
		let grabbed = grabs.latest;
		if (!!grabbed) {
			return grabbed;
		} else if (!!focus) {
			return focus;
		} else {
			return get(w_hierarchy)?.rootAncestry;
		}
	}

	get all_data(): Dictionary {
		const root = this.root;
		let data: Dictionary = { 
			'title' : root.title,
			'idRoot' : root.id};
			for (const t_persistable of Persistable.t_persistables) {
			switch(t_persistable) {
				case T_Persistable.things:		  data[t_persistable] = this.things; break;
				case T_Persistable.traits:		  data[t_persistable] = this.traits; break;
				case T_Persistable.predicates:	  data[t_persistable] = this.predicates; break;
				case T_Persistable.relationships: data[t_persistable] = this.relationships; break;
				case T_Persistable.tags:		  data[t_persistable] = this.tags; break;
			}
		}
		return data;
	}

	async fetch_andBuild_fromFile(file: File) {
		databases.defer_persistence = true;
		try {
			const format = files.format_preference;
			const result = await files.fetch_fromFile(file);
			const dict = result as Dictionary;
			switch (format) {
				case T_File_Format.csv:
					const array = result as Array<Dictionary>;
					for (const dict of array) {
						pivot.extract_fromDict(dict);
					}
					await pivot.create_relationships_fromAllTraits();
					break;
				case T_File_Format.json:
					await this.extractJSON_fromDict(dict);
					break;
				case T_File_Format.seriously:
					this.extractSeriously_fromDict(dict, grabs.latest ?? this.rootAncestry);
					break;
			}
		} finally {
			databases.defer_persistence = false;					// assure we can now write anything dirty to the db
			await this.db.persist_all(true);
		}
	}

	progeny_dataFor(ancestry: Ancestry): Dictionary {
		let isFirst = true;
		const thing = ancestry.thing;
		let data: Dictionary = {
			'id' : thing?.id ?? k.empty,
			'title' : thing?.title ?? k.unknown};
		let relationships: Array<Relationship> = [];
		let things: Array<Thing> = [];
		let traits: Array<Trait> = [];
		let tags: Array<Tag> = [];
		data[T_Persistable.predicates] = this.predicates;
		ancestry.traverse((ancestry: Ancestry) => {
			const thing = ancestry.thing;
			const thingTraits = thing?.traits;
			const thingTags = thing?.tags;
			const relationship = ancestry.relationship;
			if (!!thingTraits) {
				traits = u.uniquely_concatenateArrays_ofIdentifiables(traits, thingTraits) as Array<Trait>;
			}
			if (!!thingTags) {
				tags = u.uniquely_concatenateArrays_ofIdentifiables(tags, thingTags) as Array<Tag>;
			}
			if (!!thing && !things.some(t => t.id == thing.id)) {
				things.push(thing);
			}
			if (!isFirst && !!relationship && !relationships.some(r => r.id == relationship.id)) {
				relationships.push(relationship);
			}
			isFirst = false;
			return false;
		});
		data[T_Persistable.relationships] = relationships;
		data[T_Persistable.things] = things;
		data[T_Persistable.traits] = traits;
		data[T_Persistable.tags] = tags;
		return data;
	}

	static readonly _____LOST_AND_FOUND: unique symbol;

	async lost_and_found(): Promise<Thing | null> {
		const ancestry = await this.ancestry_lost_and_found();
		return ancestry?.thing ?? null;
	}

	async ancestry_lost_and_found(): Promise<Ancestry | null> {
		const found = this.things_byType[T_Thing.found];
		if (!!found && found.length > 0) {
			return found[0].ancestry;		// force creation
		}
		return await this.ancestry_persistentCreateUnique('lost and found', this.rootAncestry, T_Thing.found);
	}

	async relationships_lostAndFound_persistentCreate(idBase: string) {
		for (const thing of this.things) {			// add orphaned things to lost_and_found
			if (!thing.isRoot && !this.relationship_whereHID_isChild(thing.hid) && thing.idBase == idBase && !!this.idRoot) {
				const lost_and_found = await this.lost_and_found();
				if (!!lost_and_found) {
					const parentOrder = lost_and_found.ancestry?.childAncestries?.length ?? 0;
					await this.relationship_remember_persistentCreateUnique(idBase, Identifiable.newID(),
						T_Predicate.contains, lost_and_found.id, thing.id, 0, parentOrder, T_Create.getPersistentID);
				}
			}
		}
	}

	static readonly _____REMEMBER: unique symbol;

	forget_all() {
		this.things_forget_all();
		this.traits_forget_all();
		// this.predicates_forget_all();
		this.ancestries_forget_all();
		this.relationships_forget_all();
	}

	refreshKnowns() {
		this.ancestries_forget_all();
		this.things_refreshKnowns();
		this.traits_refreshKnowns();
		this.predicates_refreshKnowns();
		this.relationships_refreshKnowns();
	}

	static readonly _____OTHER: unique symbol;

	get data_count(): number {
		return this.relationships.length + 
			   this.predicates.length + 
			   this.traits.length + 
			   this.things.length +
			   this.tags.length;
	}

	get focus(): Thing | null {
		const ancestry = get(w_ancestry_focus);
		return !ancestry ? this.root : ancestry.thing;
	}

	stop_alteration() { w_s_alteration.set(null); }

	get depth(): number {
		let maximum = 1;
		const ancestries = Object.values(this.ancestry_byHID);
		for (const ancestry of ancestries) {
			const depth = ancestry.depth;
			if (maximum < depth) {
				maximum = depth;
			}
		}
		return maximum;
	}

	static readonly _____BUILD: unique symbol;

	get total_dirty_count(): number {
		let sum = 0;
		for (const t_persistable of Persistable.t_persistables) {
			const identifiables = this.persistables_forKey(t_persistable);
			const count = Persistable.dirty_count(identifiables);
			if (count > 0) {
				sum += count;
			}
		}
		return sum;
	}

	async extractSeriously_fromDict(dict: Dictionary, into: Ancestry) {
		const name = dict.name;
		const date = dict.date;
		const order	 = dict.order;
		const id = dict.recordName;
		const color = colors.color_fromSeriously(dict.color);
		const thing = this.thing_remember_runtimeCreate(this.db.idBase, id, name, color, T_Thing.generic);
		const thingAncestry = await into.ancestry_persistentCreateUnique_byAddingThing(thing);
		thing.persistence.setDate_fromSeriously(date);
		if (!!thingAncestry) {
			const traits = dict.traits as Array<Dictionary>;
			const children = dict.children as Array<Dictionary>;
			const relationship = thingAncestry.relationship;
			if (!!relationship) {
				relationship.orders = [order];
			}
			if (!!children) {
				for (const child of children) {
					await this.extractSeriously_fromDict(child, thingAncestry);
				}
			}
			if (!!traits) {
				for (const traitDict of traits) {
					const date = traitDict.date;
					const text = traitDict.text;
					const id = traitDict.recordName;
					const type = Trait.type_fromSeriously(traitDict.type);
					const trait = this.trait_remember_runtimeCreateUnique(this.db.idBase, id, thing.id, type, text);
					trait.persistence.setDate_fromSeriously(date);
				}
			}
		}
	}

	async extractJSON_fromDict(dict: Dictionary) {
		const idRoot = dict.id ?? dict.hid ?? dict.idRoot;				// cheapo backwards compatibility
		if (this.replace_rootID == null) {	
			this.extract_allTypes_ofObjects_fromDict(dict);				// extract
			const child = this.thing_forHID(idRoot.hash());				// relationship: adds it as child to the grab or focus
			await this.ancestry_forFile.ancestry_persistentCreateUnique_byAddingThing(child);
		} else {														// on launch or import with SHIFT-O
			this.forget_all();											// retain predicates: same across all dbs
			await this.db.remove_all();									// firebase deletes document (called dbid/name)
			this.thing_remember(this.root);								// retain root (note: only db local replaces it's title)
			this.replace_rootID = idRoot;	
			this.extract_allTypes_ofObjects_fromDict(dict);	
			await this.wrapUp_data_forUX();	
			await this.db.persist_all(true);							// true means force (overrides isDirty) persists all of what was retained
		}
		layout.grand_build();
	}

	extract_allTypes_ofObjects_fromDict(dict: Dictionary) {
		for (const t_persistable of Persistable.t_persistables) {
			const subdicts = dict[t_persistable] as Array<Dictionary>;
			for (const subdict of subdicts) {
				this.extract_objects_ofType_fromDict(t_persistable, subdict);
			}
		}
	}

	extract_objects_ofType_fromDict(t_persistable: T_Persistable, dict: Dictionary) {
		switch(t_persistable) {
			case T_Persistable.relationships: this.relationship_extract_fromDict(dict); break;
			case T_Persistable.predicates:	  this.predicate_extract_fromDict(dict); break;
			case T_Persistable.traits:		  this.trait_extract_fromDict(dict); break;
			case T_Persistable.things:		  this.thing_extract_fromDict(dict); break;
			case T_Persistable.tags:		  this.tag_extract_fromDict(dict); break;
		}
	}

	restore_fromPreferences() {
		this.stop_alteration();
		p.restore_grabbed();	// must precede restore_focus (which alters grabbed and expanded)
		p.restore_paging();
		p.restore_expanded();
		p.restore_focus();
		this.isAssembled = true;
	}

	async wrapUp_data_forUX() {
		this.assure_root_andAncestry();
		// await this.relationships_lostAndFound_persistentCreate(this.db.idBase);
		// await this.relationships_removeHavingNullReferences();
		this.restore_fromPreferences();
		busy.signal_storage_redraw();
	}

}
