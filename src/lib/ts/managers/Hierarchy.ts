import { T_Tool, T_Info, T_Graph, T_Thing, T_Trait, T_Create, T_Control, T_Predicate, T_Alteration } from '../common/Global_Imports';
import { g, k, p, u, show, User, Thing, Trait, debug, files, signals, Access, Ancestry } from '../common/Global_Imports';
import { w_t_graph, w_id_popupView, w_ancestry_focus, w_s_title_edit, w_s_alteration } from '../state/S_Stores';
import { w_storage_update_trigger, w_ancestry_showing_tools, w_ancestries_grabbed } from '../state/S_Stores';
import { S_Mouse, Predicate, Relationship, S_Alteration } from '../common/Global_Imports';
import type { Integer, Dictionary } from '../common/Types';
import Identifiable from '../data/basis/Identifiable';
import { T_Datum } from '../../ts/data/dbs/DBCommon';
import DBCommon from '../data/dbs/DBCommon';
import { get } from 'svelte/store';

export type Relationships_ByHID = { [hid: Integer]: Array<Relationship> }

export class Hierarchy {
	private ancestry_byType_andHash:{ [kind: string]: { [hash: Integer]: Ancestry } } = {};
	private predicate_byDirection: { [direction: number]: Array<Predicate> } = {};
	private traits_byOwnerHID: { [ownerHID: Integer]: Array<Trait> } = {};
	private relationship_byHID: { [hid: Integer]: Relationship } = {};
	private predicate_byKind: { [kind: string]: Predicate } = {};
	private things_byType: { [type: string]: Array<Thing> } = {};
	private traits_byType: { [type: string]: Array<Trait> } = {};
	private relationships_byParentHID: Relationships_ByHID = {};
	private relationships_byChildHID: Relationships_ByHID = {};
	private ancestry_byHID:{ [hid: Integer]: Ancestry } = {};
	private access_byKind: { [kind: string]: Access } = {};
	private access_byHID: { [hid: Integer]: Access } = {};
	private thing_byHID: { [hid: Integer]: Thing } = {};
	private trait_byHID: { [hid: Integer]: Trait } = {};
	private user_byHID: { [hid: Integer]: User } = {};
	ids_translated: { [prior: string]: string } = {};
	relationships: Array<Relationship> = [];
	predicates: Array<Predicate> = [];
	things: Array<Thing> = [];
	traits: Array<Trait> = [];
	externalsAncestry!: Ancestry;
	rootAncestry!: Ancestry;

	persistent_dataTypes = [T_Datum.predicates, T_Datum.relationships, T_Datum.traits, T_Datum.things];
	replace_rootID: string | null = k.empty;		// required for DBLocal at launch
	isAssembled = false;
	root!: Thing;
	db: DBCommon;

	constructor(db: DBCommon) {
		this.db = db;
		signals.handle_rebuildGraph(0, (ancestry) => {
			ancestry?.thing?.oneAncestries_rebuild_forSubtree();
		});
	}

	static readonly ROOT: unique symbol;

	get hasRoot(): boolean { return !!this.root; }
	get idRoot(): string | null { return this.root?.id ?? null; };

	assure_root_andAncestry() {
		if (!this.rootAncestry) {
			const rootAncestry = this.ancestry_remember_createUnique();
			const root = rootAncestry.thing;
			this.rootAncestry = rootAncestry;
			if (!!root) {
				this.root = root;
			}
		}
	}

	static readonly EVENTS: unique symbol;

	async handle_tool_clicked(idControl: string, s_mouse: S_Mouse) {
		const event: MouseEvent | null = s_mouse.event as MouseEvent;
        const ancestry = get(w_ancestry_showing_tools);
		if (!!ancestry) {
			switch (idControl) {
				case T_Tool.more: debug.log_tools('needs more'); break;
				case T_Tool.create: await this.ancestry_edit_persistentCreateChildOf(ancestry); break;
				case T_Tool.next: this.ancestry_relayout_toolCluster_nextParent(event?.altKey ?? false); return;
				case T_Tool.add_parent: this.toggleAlteration(T_Alteration.adding, s_mouse.isLong); return;
				case T_Tool.delete_confirm: await this.ancestries_rebuild_traverse_persistentDelete([ancestry]); break;
				case T_Tool.delete_parent: this.toggleAlteration(T_Alteration.deleting, s_mouse.isLong); return;
				default: break;
			}
			w_ancestry_showing_tools.set(null);
			signals.signal_relayoutWidgets_fromFocus();
		}
	}

	async handle_key_down(event: KeyboardEvent) {

		///////////////////////
		// main key dispatch //
		///////////////////////

		let ancestryGrab = this.grabs_latest_ancestry_upward(true);
		if (event.type == 'keydown' && !g.isEditing_text) {
			const OPTION = event.altKey;
			const SHIFT = event.shiftKey;
			const COMMAND = event.metaKey;
			const rootAncestry = this.rootAncestry;
			const EXTREME = SHIFT && OPTION;
			const key = event.key.toLowerCase();
			const modifiers = ['alt', 'meta', 'shift', 'control']
			const time = new Date().getTime();
			let graph_needsRebuild = false;
			if (!modifiers.includes(key)) {		// ignore modifier-key-only events
				if (g.allow_GraphEditing) {
					if (!!ancestryGrab && g.allow_TitleEditing) {
						switch (key) {
							case k.space:	await this.ancestry_edit_persistentCreateChildOf(ancestryGrab); break;
							case 'd':		await this.thing_edit_persistentDuplicate(ancestryGrab); break;
							case '-':		if (!COMMAND) { await this.thing_edit_persistentAddLine(ancestryGrab); } break;
							case 'tab':		await this.ancestry_edit_persistentCreateChildOf(ancestryGrab.parentAncestry); break; // S_Title_Edit editor also makes this call
							case 'enter':	ancestryGrab.startEdit(); break;
						}
					}
					switch (key) {
						case 'delete':
						case 'backspace':	await this.ancestries_rebuild_traverse_persistentDelete(get(w_ancestries_grabbed)); w_ancestries_grabbed.set([]); break;
					}
				}
				if (!!ancestryGrab) {
					switch (key) {
						case '/':			graph_needsRebuild = ancestryGrab.becomeFocus(); break;
						case 'arrowright':	event.preventDefault(); await this.ancestry_rebuild_persistentMoveRight(ancestryGrab,  ancestryGrab.thing_isChild, SHIFT, OPTION, EXTREME, false); break;
						case 'arrowleft':	event.preventDefault(); await this.ancestry_rebuild_persistentMoveRight(ancestryGrab, !ancestryGrab.thing_isChild, SHIFT, OPTION, EXTREME, false); break;
					}
				}
				switch (key) {
					case '!':				graph_needsRebuild = this.rootAncestry?.becomeFocus(); break;
					case '`':               event.preventDefault(); this.grabs_latest_toggleEditingTools(); break;
					case 'arrowup':			await this.grabs_latest_rebuild_persistentMoveUp_maybe(true, SHIFT, OPTION, EXTREME); break;
					case 'arrowdown':		await this.grabs_latest_rebuild_persistentMoveUp_maybe(false, SHIFT, OPTION, EXTREME); break;
					case 'escape':			if (!!get(w_ancestry_showing_tools)) { this.clear_editingTools(); }
				}
				if (graph_needsRebuild) {
					signals.signal_rebuildGraph_fromFocus();
				}
				const duration = ((new Date().getTime()) - time).toFixed(1);
				debug.log_key(`H  (${duration}) ${key}`);
				setTimeout( async () => {
					await this.db.persist_all();
				}, 1);
			}
		}
	}

	static readonly GRABS: unique symbol;

	get grabs_latest_thing(): Thing | null { return this.grabs_latest_ancestry?.thing || null; }

	get grabs_areInvisible(): boolean {
		const ancestries = get(w_ancestries_grabbed) ?? [];
		for (const ancestry of ancestries) {
			if (!ancestry.isVisible) {
				return true;
			}
		}
		return false;
	}

	get grabs_latest_ancestry(): Ancestry | null {
		const ancestry = this.grabs_latest_ancestry_upward(false);
		const relationshipHID = ancestry?.relationship?.hid;
		if (!!relationshipHID && !!this.relationship_forHID(relationshipHID)) {
			return ancestry;
		}
		return null;
	}

	grabs_latest_ancestry_upward(up: boolean): Ancestry {	// does not alter array
		const ancestries = get(w_ancestries_grabbed) ?? [];
		if (ancestries.length > 0) {
			if (up) {
				return ancestries[0];
			} else {
				return ancestries.slice(-1)[0];
			}
		}
		return this.rootAncestry;
	}

	async grabs_latest_rebuild_persistentMoveUp_maybe(up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean) {
		const ancestry = this.grabs_latest_ancestry_upward(up);
		this.ancestry_rebuild_persistentMoveUp_maybe(ancestry, up, SHIFT, OPTION, EXTREME);
	}

	grabs_latest_toggleEditingTools(up: boolean = true) {
		const ancestry = this.grabs_latest_ancestry_upward(up);
		if (!ancestry.isRoot) {
			w_ancestry_showing_tools.set(ancestry.toolsGrabbed ? null : ancestry);
			signals.signal_rebuildGraph_fromFocus();
		}
	}
	
	static readonly THINGS: unique symbol;

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
		const isContains = ancestry.kindPredicate == T_Predicate.contains;
		let things: Array<Thing> = isContains ? [this.root] : [];
		const hids = ancestry.ids_hashed;
		if (!isContains || hids.length != 0) {
			for (const hid of hids) {
				const relationship = this.relationship_forHID(hid);
				if (!!relationship) {
					if (!!relationship.parent && things.length == 0 && !isContains) {
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

	static readonly THING: unique symbol;

	thing_forHID(hid: Integer): Thing | null { return this.thing_byHID[hid ?? undefined]; }

	async thing_lost_and_found_persistentCreateUnique(): Promise<Thing> {
		const founds = this.things_byType[T_Thing.found];
		if (!!founds && founds.length > 0) {
			return founds[0];
		}
		const lost_and_found = this.thing_remember_runtimeCreateUnique(this.db.idBase, Identifiable.newID(), 'lost and found', k.color_default, T_Thing.found);
		await this.ancestry_extended_byAddingThing_toAncestry_remember_persistentCreate_relationship(lost_and_found, this.rootAncestry);
		return lost_and_found;
	}

	thing_forget(thing: Thing) {
		const type = thing.type;
		if (type != T_Thing.root) {		// do NOT forget root
			const thingsOfType = this.things_byType[type];
			delete this.thing_byHID[thing.hid];
			this.things = u.remove_byHID<Thing>(this.things, thing);
			if (!!thingsOfType) {
				const validated = u.strip_invalid(thingsOfType);
				if (validated.length == 0) {
					delete this.things_byType[type];
				} else {
					this.things_byType[type] = validated;
				}
			}
		}
	}

	thing_remember_updateID_to(thing: Thing, idTo: string) {
		const idFrom = thing.id;
		this.thing_forget(thing);
		thing.setID(idTo);
		this.thing_remember(thing);
		this.relationships_translate_idsFromTo_forParents(idFrom, idTo, true);
		this.relationships_translate_idsFromTo_forParents(idFrom, idTo, false);
	}

	thing_remember_runtimeCreateUnique(idBase: string, id: string, title: string, color: string, type: T_Thing = T_Thing.generic,
		already_persisted: boolean = false): Thing {
		let thing = this.thing_forHID(id?.hash() ?? null);
		if (!thing) {
			thing = this.thing_remember_runtimeCreate(idBase, id, title, color, type, already_persisted);
		}
		return thing;
	}

	thing_remember_runtimeCreate(idBase: string, id: string, title: string, color: string, type: T_Thing = T_Thing.generic,
		already_persisted: boolean = false, needs_upgrade: boolean = false): Thing {
		const thing = this.thing_runtimeCreate(idBase, id, title, color, type, already_persisted);
		this.thing_remember(thing);
		if (needs_upgrade) {
			thing.set_isDirty();	// add type and remove trait fields
		}
		return thing;
	}

	async thing_remember_runtimeCopy(idBase: string, original: Thing) {
		const copiedThing = new Thing(idBase, Identifiable.newID(), original.title, original.color, original.type);
		const prohibitedTraits: Array<string> = [T_Thing.externals, T_Thing.root, T_Thing.bulk];
		if (prohibitedTraits.includes(original.type)) {
			copiedThing.type = T_Thing.generic;
		}
		this.thing_remember(copiedThing);
		return copiedThing;
	}

	async thing_remember_persistentRelocateChild(child: Thing, fromParent: Thing, toParent: Thing): Promise<any> {
		let relationship = this.relationship_whereHID_isChild(child.hid);
		if (!!relationship && relationship.idParent == fromParent.id) {
			this.relationship_forget(relationship);
			relationship.idParent = toParent.id;
			if (relationship.isValid) {
				this.relationship_remember(relationship);
				await relationship.persist();
			}
		}
	}

	thing_child_forRelationshipHID(hid: Integer | null): Thing | null {
		if (!!hid || hid == 0) {
			const relationship = this.relationship_forHID(hid);
			if (!!relationship) {
				return this.thing_forHID(relationship.idChild.hash());
			}
		}
		return this.root;
	}

	async thing_edit_persistentAddLine(ancestry: Ancestry, below: boolean = true) {
		const parentAncestry = ancestry.parentAncestry;
		const parent = parentAncestry?.thing;
		const thing = ancestry.thing;
		if (!!thing && parent && parentAncestry) {
			const order = ancestry.order + (below ? k.halfIncrement : -k.halfIncrement);
			const child = this.thing_runtimeCreate(thing.idBase, Identifiable.newID(), k.title_line, parent.color, T_Thing.generic);
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

	thing_remember(thing: Thing) {
		if (!!thing && !this.thing_forHID(thing.hid)) {
			this.thing_byHID[thing.hid] = thing;
			let things = this.things_byType[thing.type] ?? [];
			if (!things.map(t => t.id).includes(thing.id)) {
				things.push(thing);
				this.things_byType[thing.type] = things;
			}
			if (!this.things.map(t => t.id).includes(thing.id)) {
				this.things.push(thing);
			}
			if (thing.isRoot && (!thing.idBase || [k.empty, this.db.idBase].includes(this.db.idBase))) {
				this.root = thing;
			}
		}
	}

	thing_runtimeCreate(idBase: string, id: string, title: string, color: string, type: T_Thing,
		already_persisted: boolean = false): Thing {
		let thing: Thing | null = null;
		if (id && type == T_Thing.root && idBase != this.db.idBase) {			// other bulks have their own root & id
			thing = this.bulkAlias_remember_forRootID_create(idBase, id, color);		// which our thing needs to adopt
		} else {
			thing = new Thing(idBase, id, title, color, type, already_persisted);
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
		let type = dict.type;
		const root = this.root;
		const isRootDict = type == T_Thing.root;
		if ((!root && isRootDict) || (this.replace_rootID != dict.id)) {
			if (!!root && isRootDict) {
				type = k.empty;			// prevent multiple roots
			}
			this.thing_remember_runtimeCreateUnique(this.db.idBase, dict.id, dict.title, dict.color, type);
		} else if (!!root && isRootDict && !this.db.isRemote) {
			root.title = dict.title;	// new title for root (only in local or test)
		}
	}

	async thing_forget_persistentDelete(thing: Thing) {
		const relationships = u.uniquely_concatenateArrays(
			this.relationships_byChildHID[thing.hid] ?? [],
			this.relationships_byParentHID[thing.hid] ?? []
		)
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

	static readonly BULKS: unique symbol;

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
			newThingAncestry = parentAncestry.extend_withChild(newThing);
			if (!!newThingAncestry) {
				await this.ancestry_extended_byAddingThing_toAncestry_remember_persistentCreate_relationship(newThing, parentAncestry);
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

	static readonly TRAITS: unique symbol;

	traits_forOwnerHID(hid: Integer | null): Array<Trait> | null {
		const value = !!hid ? this.traits_byOwnerHID?.[hid] : null;
		return (value instanceof Array) ? value : null;
	}

	traits_refreshKnowns() {
		const saved = this.traits;
		this.traits_forget_all();
		saved.map(t => this.trait_remember(t));
	}

	traits_forget_all() {
		this.traits_byOwnerHID = {};
		this.traits_byType = {};
		this.trait_byHID = {};
		this.traits = [];
	}

	static readonly TRAIT: unique symbol;

	trait_forHID(hid: Integer): Trait | null { return this.trait_byHID[hid ?? undefined]; }

	trait_runtimeCreate(idBase: string, id: string, ownerID: string, type: T_Trait, text: string, already_persisted: boolean = false): Trait {
		return new Trait(idBase, id, ownerID, type, text, already_persisted);
	}

	trait_remember_runtimeCreateUnique(idBase: string, id: string, ownerID: string, type: T_Trait, text: string, already_persisted: boolean = false): Trait {
		return this.trait_forHID(id?.hash()) ?? this.trait_remember_runtimeCreate(idBase, id, ownerID, type, text, already_persisted);
	}

	trait_forType_ownerHID(type: T_Trait | null, ownerHID: Integer | null): Trait| null {
		const traits = this.traits_forOwnerHID(ownerHID)?.filter(t => t.type == type);
		return !traits ? null : traits[0]
	}

	trait_extract_fromDict(dict: Dictionary) {
		this.trait_remember_runtimeCreateUnique(this.db.idBase, dict.id, dict.ownerID, dict.type, dict.text);
	}

	trait_forget(trait: Trait) {
		delete this.trait_byHID[trait.hid];
		delete this.traits_byOwnerHID[trait.ownerID.hash()];
		this.traits = u.remove_byHID<Trait>(this.traits, trait);
		this.traits_byType[trait.type] = u.remove_byHID<Trait>(this.traits_byType[trait.type], trait);;
	}

	trait_remember(trait: Trait) {
		const hid = trait.ownerID.hash();
		this.trait_byHID[trait.hid] = trait;
		(this.traits_byOwnerHID[hid] = this.traits_byOwnerHID[hid] || []).push(trait);
		(this.traits_byType[trait.type] = this.traits_byType[trait.type] || []).push(trait);
		this.traits.push(trait);
	}

	trait_remember_runtimeCreate(idBase: string, id: string, ownerID: string, type: T_Trait, text: string,
		already_persisted: boolean = false): Trait {
		const trait = this.trait_runtimeCreate(idBase, id, ownerID, type, text, already_persisted);
		this.trait_remember(trait);
		return trait;
	}

	trait_setText_forType_ownerHID(text: string, type: T_Trait, ownerID: string) {
		let trait = this.trait_forType_ownerHID(type, ownerID.hash());
		if (!trait) {
			trait = this.trait_remember_runtimeCreate(this.db.idBase, Identifiable.newID(), ownerID, type, text);
		} else {
			trait.text = text;
		}
		trait.set_isDirty();
	}

	static readonly RELATIONSHIPS: unique symbol;

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

	relationships_areAllValid_forIDs(ids: Array<string>) {
		for (const id of ids) {		// ignore empty id (root placeholder)
			if (id != k.empty && !this.relationship_forHID(id.hash())) {
				return false;
			}
		}
		return true;
	}

	async relationships_lostAndFound_persistentCreate(idBase: string) {
		for (const thing of this.things) {
			if (!thing.isRoot && !this.relationship_whereHID_isChild(thing.hid) && thing.idBase == idBase && !!this.idRoot) {			// add orphaned things to root
				const lost_and_found = await this.thing_lost_and_found_persistentCreateUnique();
				await this.relationship_remember_persistentCreateUnique(idBase, Identifiable.newID(),
					T_Predicate.contains, lost_and_found.id, thing.id, 0, T_Create.getPersistentID);
			}
		}
	}

	relationships_forKindPredicate_hidThing_isChild(kindPredicate: string, hid: Integer, forParents: boolean): Array<Relationship> {
		const dict = forParents ? this.relationships_byChildHID : this.relationships_byParentHID;
		const matches = dict[hid] as Array<Relationship>; // filter out bad values (dunno what this does)
		const array: Array<Relationship> = [];
		if (Array.isArray(matches)) {
			for (const relationship of matches) {
				if (relationship.kindPredicate == kindPredicate && !array.includes(relationship)) {
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
			const relationships = this.relationships_forKindPredicate_hidThing_isChild(predicate.kind, idFrom.hash(), forParents);
			for (const relationship of relationships) {
				if (!forParents && relationship.idParent != idTo) {
					this.relationship_forget(relationship);
					relationship.hidParent = idTo.hash();
					relationship.idParent = idTo;
					relationship.set_isDirty();
					this.relationship_remember(relationship);
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

	static readonly RELATIONSHIP: unique symbol;

	relationship_forHID(hid: Integer): Relationship | null { return this.relationship_byHID[hid ?? undefined]; }

	relationship_whereHID_isChild(hidThing: Integer, isChild: boolean = true): Relationship | null {
		const matches = this.relationships_forKindPredicate_hidThing_isChild(T_Predicate.contains, hidThing, isChild);
		return matches.length == 0 ? null : matches[0];
	}

	relationship_forget(relationship: Relationship) {
		delete this.relationship_byHID[relationship.hid];
		this.relationships = u.remove_byHID<Relationship>(this.relationships, relationship);
		this.relationship_forget_forHID(this.relationships_byChildHID, relationship.hidChild, relationship);
		this.relationship_forget_forHID(this.relationships_byParentHID, relationship.hidParent, relationship);
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
		array = u.remove_byHID<Relationship>(array, relationship);
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
				this.relationship_remember_runtimeCreateUnique(this.db.idBase, dict.id, dict.kindPredicate, idParent, dict.idChild, dict.order);
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

	relationship_forPredicateKind_parent_child(kindPredicate: string, hidParent: Integer, hidChild: Integer): Relationship | null {
		const matches = this.relationships_forKindPredicate_hidThing_isChild(kindPredicate, hidParent, false);
		if (Array.isArray(matches)) {
			for (const relationship of matches) {
				if (relationship.hidChild == hidChild) {
					return relationship;
				}
			}
		}
		return null;
	}

	async relationship_remember_persistentCreateUnique(idBase: string, idRelationship: string, kindPredicate: T_Predicate, idParent: string, idChild: string,
		order: number, creationOptions: T_Create = T_Create.isFromPersistent): Promise<any> {
		let relationship = this.relationship_forPredicateKind_parent_child(kindPredicate, idParent.hash(), idChild.hash());
		if (!!relationship) {
			relationship.order_setTo_persistentMaybe(order, true);
		} else {
			relationship = new Relationship(idBase, idRelationship, kindPredicate, idParent, idChild, order, creationOptions == T_Create.isFromPersistent);
			await this.db.relationship_remember_persistentCreate(relationship);
		}
		return relationship;
	}
	
	relationship_remember(relationship: Relationship) {
		if (!this.relationship_byHID[relationship.hid]) {
			if (!this.relationships.map(r => r.id).includes(relationship.id)) {
				this.relationships.push(relationship);
			}
			this.relationship_byHID[relationship.hid] = relationship;
			this.relationship_remember_byKnown(relationship, relationship.hidChild, this.relationships_byChildHID);
			this.relationship_remember_byKnown(relationship, relationship.hidParent, this.relationships_byParentHID);
			
			if (relationship.idBase != this.db.idBase) {
				debug.log_error(`relationship crossing dbs: ${relationship.description}`);
			}
		}
	}

	relationship_replace_idsFromTo_inDict(idFrom: string | null, idTo: string | null, dict: Dictionary) {
		if (!!idFrom && !!idTo) {
			let idChild = dict.idChild;
			let idParent = dict.idParent;
			const isBidirectional = this.predicate_forKind(dict.kindPredicate)?.isBidirectional ?? false
			if (idParent == idFrom) {
				dict.idParent = idTo;
			}
			if (idChild == idFrom && isBidirectional) {
				dict.idChild = idTo;
			}
		}
	}

	async relationship_forget_persistentDelete(ancestry: Ancestry, otherAncestry: Ancestry, kindPredicate: T_Predicate) {
		const thing = ancestry.thing;
		const parentAncestry = ancestry.parentAncestry;
		const relationship = this.relationship_forPredicateKind_parent_child(kindPredicate, otherAncestry.idThing.hash(), ancestry.idThing.hash());
		if (!!parentAncestry && !!relationship && (thing?.hasParents ?? false)) {
			this.relationship_forget(relationship);
			if (otherAncestry.hasChildRelationships) {
				parentAncestry.order_normalizeRecursive_persistentMaybe(true);
			} else {
				otherAncestry.collapse();
			}
			await this.db.relationship_persistentDelete(relationship);
		}
	}

	relationship_remember_runtimeCreateUnique(idBase: string, id: string, kindPredicate: T_Predicate, idParent: string, idChild: string,
		order: number, creationOptions: T_Create = T_Create.none): Relationship {
		let reversed = this.relationship_forPredicateKind_parent_child(kindPredicate, idChild.hash(), idParent.hash());
		let relationship = this.relationship_forPredicateKind_parent_child(kindPredicate, idParent.hash(), idChild.hash());
		const isBidirectional = this.predicate_forKind(kindPredicate)?.isBidirectional ?? false;
		const already_persisted = creationOptions == T_Create.isFromPersistent;
		if (!relationship) {
			relationship = new Relationship(idBase, id, kindPredicate, idParent, idChild, order, already_persisted);
			this.relationship_remember(relationship);
		}
		if (isBidirectional && !reversed) {
			reversed = new Relationship(idBase, Identifiable.newID(), kindPredicate, idChild, idParent, order, already_persisted);
			this.relationship_remember(reversed);
		}
		relationship?.order_setTo_persistentMaybe(order);
		reversed?.order_setTo_persistentMaybe(order);
		return relationship;
	}

	static readonly ANCESTRIES: unique symbol;

	ancestries_forget_all() {
		this.ancestry_byType_andHash = {};
		this.ancestry_byHID = {};
	}

	ancestries_fullRebuild() {
		const rootAncestry = this.rootAncestry;
		this.ancestries_forget_all();
		this.ancestry_remember(rootAncestry);
		this.root?.oneAncestries_rebuild_forSubtree();		// recreate ancestries
		signals.signal_rebuildGraph_from(rootAncestry);
	}

	async ancestries_rebuild_traverse_persistentDelete(ancestries: Array<Ancestry>) {
		if (get(w_ancestry_focus)) {
			for (const ancestry of ancestries) {
				const thing = ancestry.thing;
				const parentAncestry = ancestry.parentAncestry;
				if (!!parentAncestry) {
					const grandParentAncestry = parentAncestry.parentAncestry;
					if (!!thing && !!grandParentAncestry && !ancestry.isEditing && !thing.isBulkAlias) {
						const siblings = parentAncestry.children;
						let index = siblings.indexOf(thing);
						siblings.splice(index, 1);
						parentAncestry.grabOnly();
						if (siblings.length == 0) {
							parentAncestry.collapse();
							if (!grandParentAncestry.isVisible) {
								grandParentAncestry.becomeFocus();	// call become focus before applying
							}
						}
						await ancestry.traverse_async(async (progenyAncestry: Ancestry): Promise<boolean> => {
							await this.ancestry_forget_persistentUpdate(progenyAncestry);
							return false; // continue the traversal
						});
					}
				}
			}
			signals.signal_rebuildGraph_fromFocus();
		}
	}

	static readonly ANCESTRY: unique symbol;

	ancestry_forHID(hid: Integer): Ancestry | null { return this.ancestry_byHID[hid] ?? null; }

	get ancestry_forBreadcrumbs(): Ancestry {
		const focus = get(w_ancestry_focus);
		const grab = this.grabs_latest_ancestry;
		const grab_containsFocus = !!grab && focus.isAProgenyOf(grab)
		return (!!grab && grab.isVisible && !grab_containsFocus) ? grab : focus;
	}

	ancestry_valid_forID(idAncestry: string): Ancestry | null {
		const ids = idAncestry.split(k.generic_separator);					// ancestor id is multiple relationship ids separated by generic_separator
		const id = ids.slice(-1)[0];										// grab last relationship id
		const kindPredicate = this.predicate_kindFor_idRelationship(id);		// grab its predicate kind
		const notValid = !this.relationships_areAllValid_forIDs(ids) || !kindPredicate;
		return notValid ? null : this.ancestry_remember_createUnique(idAncestry, kindPredicate);
	}

	async ancestry_forget_persistentUpdate(ancestry: Ancestry) {
		const thing = ancestry.thing;
		ancestry.childAncestries.map(c => this.ancestry_forget_persistentUpdate(c));
		this.ancestry_forget(ancestry);
		if (!!thing) {
			await this.thing_forget_persistentDelete(thing);
		}
	}

	ancestry_forget(ancestry: Ancestry | null) {
		if (!!ancestry) {
			const hid = ancestry.hid;
			let dict = this.ancestry_byType_andHash[ancestry.kindPredicate] ?? {};
			delete this.ancestry_byHID[hid];
			delete dict[hid];
			this.ancestry_byType_andHash[ancestry.kindPredicate] = dict;
		}
	}

	ancestry_remember(ancestry: Ancestry) {
		const hid = ancestry.hid;
		let dict = this.ancestry_byType_andHash[ancestry.kindPredicate] ?? {};
		this.ancestry_byHID[hid] = ancestry;
		dict[hid] = ancestry;
		this.ancestry_byType_andHash[ancestry.kindPredicate] = dict;
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

	ancestry_relayout_toolCluster_nextParent(force: boolean = false) {
		const toolsAncestry = get(w_ancestry_showing_tools);
		if (!!toolsAncestry) {
			let ancestry = toolsAncestry;
			ancestry.grabOnly();
			signals.signal_relayoutWidgets_fromFocus();
			w_ancestry_showing_tools.set(ancestry);
		}
	}

	async ancestry_remember_bulk_persistentRelocateRight(ancestry: Ancestry, parentAncestry: Ancestry) {
		const newThingAncestry = await this.bulkAlias_remember_recursive_persistentRelocateRight(ancestry, parentAncestry);
		if (!!newThingAncestry) {
			parentAncestry.signal_relayoutWidgets_fromThis();
			if (parentAncestry.isExpanded) {
				newThingAncestry.grabOnly();
			} else {
				parentAncestry.grabOnly();
			}
		}
	}

	ancestry_remember_createUnique(id: string = k.empty, kindPredicate: string = T_Predicate.contains): Ancestry {
		const hid = id.hash();
		let dict = this.ancestry_byType_andHash[kindPredicate] ?? {};
		let ancestry = dict[hid];
		if (!ancestry) {
			ancestry = new Ancestry(this.db.t_database, id, kindPredicate);
			this.ancestry_remember(ancestry);
		}
		return ancestry;
	}

	async ancestry_edit_persistentAddAsChild(parentAncestry: Ancestry, child: Thing, order: number, shouldStartEdit: boolean = true) {
		await this.ancestry_extended_byAddingThing_toAncestry_remember_persistentCreate_relationship(child, parentAncestry)
		.then((childAncestry) => {
			if (!!childAncestry) {
				childAncestry.grabOnly();
				childAncestry.relationship?.order_setTo_persistentMaybe(order);
				signals.signal_rebuildGraph_fromFocus();
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
				if (!length) {				// might have zero or more than one ==
					console.log(`externals does not exist`)
				} else {
					for (const externalsThing of externalsArray) {				// add to the root ancestry
						if  (externalsThing.title == 'externals') {
							return rootAncestry.extend_withChild(externalsThing) ?? null;
						}
					}
				}
				const externalsThing = this.thing_remember_runtimeCreateUnique(this.db.idBase, Identifiable.newID(), 'externals', 'red', T_Thing.externals);

				// VITAL: the following code has problems

				await externalsThing.persist();
				await this.ancestry_extended_byAddingThing_toAncestry_remember_persistentCreate_relationship(externalsThing, rootAncestry)
				.then((ancestry) => {
					console.log(`externalsAncestry is wrong type: "${ancestry?.thing?.type ?? 'unknown'}" (should be "^")`)
					// externalsAncestry = ancestry;
				});
			}
			return externalsAncestry;
		})();
	}

	async ancestry_extended_byAddingThing_toAncestry_remember_persistentCreate_relationship(child: Thing | null, ancestry: Ancestry, kindPredicate: T_Predicate = T_Predicate.contains): Promise<Ancestry | null | undefined> {
		const parent = ancestry.thing;
		if (!!child && !!parent) {
			const changingBulk = parent.isBulkAlias || child.idBase != this.db.idBase;
			const idBase = changingBulk ? child.idBase : parent.idBase;
			if (!child.persistence.already_persisted) {
				await this.db.thing_remember_persistentCreate(child);					// for everything below, need to await child.id fetched from databases
			}
			const relationship = await this.relationship_remember_persistentCreateUnique(idBase, Identifiable.newID(), kindPredicate, parent.idBridging, child.id, 0, T_Create.getPersistentID);
			const childAncestry = ancestry.uniquelyAppendID(relationship.id);
			u.ancestries_orders_normalize_persistentMaybe(ancestry.childAncestries);		// write new order values for relationships
			return childAncestry;
		}
	}

	async ancestry_redraw_persistentFetchBulk_browseRight(thing: Thing, ancestry: Ancestry | null = null, grab: boolean = false) {
		if (!!this.externalsAncestry && thing && thing.title != 'roots') {	// not create roots bulk
			await this.db.hierarchy_fetch_forID(thing.title)
			this.relationships_refreshKnowns();
			const childAncestries = ancestry?.childAncestries;
			if (!!childAncestries && childAncestries.length > 0) {
				if (!!grab) {
					childAncestries[0].grabOnly()
				}
				ancestry?.expand()
				signals.signal_rebuildGraph_fromFocus();
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
		} else if (g.allow_GraphEditing) {
			const grab = this.grabs_latest_ancestry_upward(true);
			this.ancestry_rebuild_persistentRelocateRight(grab, RIGHT, EXTREME);
		}
	}

	ancestry_rebuild_persistentMoveUp_maybe(ancestry: Ancestry, up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean) {
		const parentAncestry = ancestry.parentAncestry;
		if (!!parentAncestry) {
			let graph_needsRebuild = false;
			let graph_needsRelayout = false;
			const siblings = parentAncestry.children;
			const length = siblings.length;
			const thing = ancestry?.thing;
			if (!siblings || length == 0) {		// friendly for first-time users
				this.ancestry_rebuild_runtimeBrowseRight(ancestry, true, EXTREME, up, true);
			} else if (!!thing) {
				const is_radial_mode = g.inRadialMode;
				const isBidirectional = ancestry.predicate?.isBidirectional ?? false;
				if ((!isBidirectional && ancestry.thing_isChild) || !is_radial_mode) {
					const index = siblings.indexOf(thing);
					const newIndex = index.increment(!up, length);
					if (!!parentAncestry && !OPTION) {
						const grabAncestry = parentAncestry.extend_withChild(siblings[newIndex]);
						if (!!grabAncestry) {
							if (!grabAncestry.isVisible) {
								if (!parentAncestry.isFocus) {
									graph_needsRebuild = parentAncestry.becomeFocus();
								} else if (is_radial_mode) {
									graph_needsRebuild = grabAncestry.assureIsVisible_inClusters();	// change paging
								} else {
									alert('PROGRAMMING ERROR: child of focus is not visible');
								}
							}
							if (SHIFT) {
								grabAncestry.toggleGrab();
							} else {
								grabAncestry.grabOnly();
							}
							graph_needsRelayout = true;
						}
					} else if (g.allow_GraphEditing && OPTION) {
						graph_needsRebuild = true;
						u.ancestries_orders_normalize_persistentMaybe(parentAncestry.childAncestries, false);
						const wrapped = up ? (index == 0) : (index + 1 == length);
						const goose = ((wrapped == up) ? 1 : -1) * k.halfIncrement;
						const newOrder = newIndex + goose;
						ancestry.relationship?.order_setTo_persistentMaybe(newOrder);
						u.ancestries_orders_normalize_persistentMaybe(parentAncestry.childAncestries);
					}
				}
				if (graph_needsRebuild) {
					signals.signal_rebuildGraph_fromFocus();
				} else if (graph_needsRelayout) {
					signals.signal_relayoutWidgets_fromFocus();
				}
			}
		}
	}

	ancestry_rebuild_persistentRelocateRight(ancestry: Ancestry, RIGHT: boolean, EXTREME: boolean) {
		const thing = ancestry.thing;
		const parentAncestry = RIGHT ? ancestry.ancestry_ofNextSibling(false) : ancestry.stripBack(2);
		const parent = parentAncestry?.thing;
		if (!!thing && parent && parentAncestry) {
			if (thing.isInDifferentBulkThan(parent)) {		// should move across bulks
				this.ancestry_remember_bulk_persistentRelocateRight(ancestry, parentAncestry);
			} else {
				const relationship = ancestry.relationship;
				if (!!relationship) {
					const order = RIGHT ? relationship.order : 0;
					relationship.idParent = parent.id;
					relationship.order_setTo_persistentMaybe(order + k.halfIncrement, true);
				}
				this.relationships_refreshKnowns();
				parentAncestry.extend_withChild(thing)?.grabOnly();
				this.rootAncestry.order_normalizeRecursive_persistentMaybe(true);
				if (!parentAncestry.isExpanded) {
					parentAncestry.expand();
				}
				if (!parentAncestry.isVisible) {
					parentAncestry.becomeFocus();
				}
			}
			signals.signal_rebuildGraph_fromFocus();			// so Tree_Children component will update
		}
	}

	ancestry_rebuild_runtimeBrowseRight(ancestry: Ancestry, RIGHT: boolean, SHIFT: boolean, EXTREME: boolean, fromReveal: boolean) {
		const newFocusAncestry = ancestry.parentAncestry;
		const childAncestry = ancestry.extend_withChild(ancestry.firstChild);
		let newGrabAncestry: Ancestry | null = RIGHT ? childAncestry : newFocusAncestry;
		const newGrabIsNotFocus = !newGrabAncestry?.isFocus;
		let graph_needsRebuild = false;
		if (RIGHT) {
			if (ancestry.hasRelevantRelationships) {
				if (SHIFT) {
					newGrabAncestry = null;
				}
				graph_needsRebuild = ancestry.expand();
				if (get(w_t_graph) == T_Graph.radial) {
					graph_needsRebuild = ancestry.becomeFocus() || graph_needsRebuild;
				}
			} else {
				return;
			}
		} else {
			const rootAncestry = this.rootAncestry;
			if (EXTREME) {
				graph_needsRebuild = rootAncestry?.becomeFocus();	// tells graph to update line rects
			} else {
				if (!SHIFT) {
					if (fromReveal) {
						graph_needsRebuild = ancestry.toggleExpanded();
					} else if (newGrabIsNotFocus && newGrabAncestry && !newGrabAncestry.isExpanded) {
						graph_needsRebuild = newGrabAncestry.expand();
					}
				} else if (newGrabAncestry) { 
					if (ancestry.isExpanded) {
						graph_needsRebuild = ancestry.collapse();
						newGrabAncestry = this.grabs_areInvisible ? ancestry : null;
					} else if (newGrabAncestry.isExpanded || (!!rootAncestry && !rootAncestry.ancestry_hasEqualID(newGrabAncestry))) {
						graph_needsRebuild = newGrabAncestry.collapse();
					}
				}
			}
		}
		w_s_title_edit.set(null);
		if (!!newGrabAncestry) {
			newGrabAncestry.grabOnly();
			if (!RIGHT && !!newFocusAncestry) {
				const newFocusIsGrabbed = newFocusAncestry && newFocusAncestry.ancestry_hasEqualID(newGrabAncestry);
				const canBecomeFocus = (!SHIFT || newFocusIsGrabbed) && newGrabIsNotFocus;
				const shouldBecomeFocus = newFocusAncestry.isRoot || !newFocusAncestry.isVisible;
				const becomeFocus = canBecomeFocus && shouldBecomeFocus;
				if (becomeFocus && newFocusAncestry.becomeFocus()) {
					graph_needsRebuild = true;
				}
			}
		}
		if (graph_needsRebuild) {
			signals.signal_rebuildGraph_fromFocus();
		} else {
			signals.signal_relayoutWidgets_fromFocus();
		}
	}

	static readonly PREDICATES: unique symbol;

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

	static readonly PREDICATE: unique symbol;

	predicate_forKind(kind: string | null): Predicate | null { return !kind ? null : this.predicate_byKind[kind]; }

	predicate_kindFor_idRelationship(idRelationship: string): string | null {
		const relationship = this.relationship_forHID(idRelationship.hash());
		return relationship?.kindPredicate ?? null;			// grab its predicate kind
	}

	predicate_extract_fromDict(dict: Dictionary) {
		const predicate = this.predicate_remember_runtimeCreateUnique(dict.id, dict.kind, dict.isBidirectional, false);
	}

	predicate_forget(predicate: Predicate) {
		let predicates = this.predicates_byDirection(predicate.isBidirectional) ?? [];
		predicates = u.remove_byHID<Predicate>(predicates, predicate);
		if (predicates.length == 0) {
			delete this.predicate_byDirection[predicate.isBidirectional ? 1 : 0];
		} else {
			this.predicate_byDirection[predicate.isBidirectional ? 1 : 0] = predicates;
		}
		this.predicates = u.remove_byHID<Predicate>(this.predicates, predicate);
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

	static readonly ANCILLARY: unique symbol;

	access_runtimeCreate(idAccess: string, kind: string) {
		const access = new Access(this.db.t_database, T_Datum.access, idAccess, kind);
		this.access_byHID[idAccess.hash()] = access;
		this.access_byKind[kind] = access;
	}

	user_runtimeCreate(id: string, name: string, email: string, phone: string) {
		const user = new User(this.db.t_database, T_Datum.users, id, name, email, phone);
		this.user_byHID[id.hash()] = user;
	}

	static readonly FILES: unique symbol;

	select_file_toUpload(SHIFT: boolean) {
		w_id_popupView.set(T_Control.import);				// extract_fromDict
		this.replace_rootID = SHIFT ? k.empty : null;	// prime it to be updated from file (after user choses it)
	}

	get data_toSave(): Dictionary {
		const ancestry = this.user_selected_ancestry;
		return ancestry.isRoot ? this.all_data : this.progeny_dataFor(ancestry);
	}

	persist_toFile() {
		const data = this.data_toSave;
		const filename = `${data.title.toLowerCase()}.json`;
		files.persist_json_object_toFile(data, filename);
	}

	async fetch_fromFile(file: File) {
		await files.extract_json_object_fromFile(file, async (result) => {
			const dict = result as Dictionary;
			if (!!dict) {
				await this.extract_fromDict(dict);
				this.db.persist_all(true);
			}
		});
	}

	get user_selected_ancestry(): Ancestry {
		const focus = get(w_ancestry_focus);
		let grabbed = this.grabs_latest_ancestry;
		if (!!focus && show.t_info == T_Info.focus) {
			return focus;
		} else if (!!grabbed) {
			return grabbed;
		} else if (!!focus) {
			return focus;
		} else {
			return this.rootAncestry;
		}
	}

	get all_data(): Dictionary {
		const root = this.root;
		let data: Dictionary = { 
			'title' : root.title,
			'idRoot' : root.id};
		for (const type of this.persistent_dataTypes) {
			switch(type) {
				case T_Datum.things:		data[type] = this.things; break;
				case T_Datum.traits:		data[type] = this.traits; break;
				case T_Datum.predicates:	data[type] = this.predicates; break;
				case T_Datum.relationships: data[type] = this.relationships; break;
			}
		}
		return data;
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
		data[T_Datum.predicates] = this.predicates;
		ancestry.traverse((ancestry: Ancestry) => {
			const thing = ancestry.thing;
			const thingTraits = thing?.traits;
			const relationship = ancestry.relationship;
			if (!!thingTraits) {
				traits = u.uniquely_concatenateArrays(traits, thingTraits);
			}
			if (!!thing && things.filter(t => t.id == thing.id).length == 0) {
				things.push(thing);
			}
			if (!isFirst && !!relationship && relationships.filter(r => r.id == relationship.id).length == 0) {
				relationships.push(relationship);
			}
			isFirst = false;
			return false;
		});
		data[T_Datum.relationships] = relationships;
		data[T_Datum.things] = things;
		data[T_Datum.traits] = traits;
		return data;
	}

	static readonly BUILD: unique symbol;

	restore_fromPersistLocal() {
		w_ancestry_showing_tools.set(null);
		w_s_title_edit.set(null);
		p.restore_focus();
		p.restore_grabbed_andExpanded();
		p.restore_paging();
		this.isAssembled = true;
	}

	async wrapUp_data_forUX() {
		this.assure_root_andAncestry();
		// await this.relationships_lostAndFound_persistentCreate(this.db.idBase);
		// await this.relationships_removeHavingNullReferences();
		this.restore_fromPersistLocal();
		this.signal_storage_redraw();
	}

	async extract_fromDict(dict: Dictionary) {
		const idRoot = dict.id ?? dict.hid ?? dict.idRoot;			// cheapo backwards compatibility
		if (this.replace_rootID == null) {
			this.objects_ofAllTypes_extract_fromDict(dict);			// extract
			const child = this.thing_forHID(idRoot.hash());			// relationship: adds it as child to the grab or focus
			await this.ancestry_extended_byAddingThing_toAncestry_remember_persistentCreate_relationship(child, this.user_selected_ancestry);
		} else {													// on launch or import with SHIFT-O
			this.forget_all();										// retain predicates: same across all dbs
			await this.db.remove_all();								// firebase deletes document (called dbid/name)
			this.thing_remember(this.root);							// retain root (note: only db local replaces it's title)
			this.replace_rootID = idRoot;
			this.objects_ofAllTypes_extract_fromDict(dict);
			await this.wrapUp_data_forUX();
			await this.db.persist_all(true);						// true means force (overrides isDirty) persists all of what was retained
		}
		signals.signal_rebuildGraph_fromFocus();
	}

	objects_ofAllTypes_extract_fromDict(dict: Dictionary) {
		for (const type of this.persistent_dataTypes) {
			const subdicts = dict[type] as Array<Dictionary>;
			for (const subdict of subdicts) {
				switch(type) {
					case T_Datum.predicates:	this.predicate_extract_fromDict(subdict); break;
					case T_Datum.relationships: this.relationship_extract_fromDict(subdict); break;
					case T_Datum.traits:		this.trait_extract_fromDict(subdict); break;
					case T_Datum.things:		this.thing_extract_fromDict(subdict); break;
				}
			}
		}
	}

	static readonly REMEMBER: unique symbol;

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

	static readonly OTHER: unique symbol;

	get data_count(): number { return this.things.length + this.relationships.length }

	get focus(): Thing | null {
		const ancestry = get(w_ancestry_focus);
		return !ancestry ? this.root : ancestry.thing;
	}

	clear_editingTools() {
		w_s_alteration.set(null);
		w_ancestry_showing_tools.set(null);
	}

	signal_storage_redraw(after: number = 100) {
		setTimeout(() => {			// depth is not immediately updated
			const trigger = this.data_count * 100 + this.depth;
			w_storage_update_trigger.set(trigger);
		}, after);
	}

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

	toggleAlteration(wantsAlteration: T_Alteration, isRelated: boolean) {
		const isAltering = get(w_s_alteration)?.type;
		const predicate = isRelated ? Predicate.isRelated : Predicate.contains;
		const nextAltering = wantsAlteration == isAltering ? null : new S_Alteration(wantsAlteration, predicate);
		if (!!nextAltering) {
			debug.log_tools(`needs ${wantsAlteration} ${predicate?.kind} alteration`)
		} else {
			debug.log_tools(`end ${wantsAlteration} alteration`)
		}
		w_s_alteration.set(nextAltering);
	}

}
