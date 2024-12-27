import { ThingType, TraitType, Predicate, Relationship, Ancestry, Mouse_State, PredicateKind } from '../common/Global_Imports';
import { IDControl, persistLocal, CreationOptions, AlterationType, Alteration_State } from '../common/Global_Imports';
import { g, k, u, User, Thing, Trait, Grabs, debug, files, Access, IDTool, signals } from '../common/Global_Imports';
import { s_title_edit_state, s_id_popupView, s_focus_ancestry, s_alteration_mode } from '../state/Svelte_Stores';
import { s_number_ofThings, s_grabbed_ancestries, s_ancestry_showing_tools } from '../state/Svelte_Stores';
import { DatumType } from '../../ts/basis/PersistentIdentifiable';
import type { Dictionary } from '../common/Types';
import Identifiable from '../basis/Identifiable';
import DBCommon from '../db/DBCommon';
import { get } from 'svelte/store';

type Relationships_ByHID = { [hid: number]: Array<Relationship> }

export class Hierarchy {
	private ancestry_byKind_andHash:{ [kind: string]: { [hash: number]: Ancestry } } = {};
	private predicate_byDirection: { [direction: number]: Array<Predicate> } = {};
	private traits_byOwnerHID: { [ownerHID: number]: Array<Trait> } = {};
	private relationship_byHID: { [hid: number]: Relationship } = {};
	private predicate_byKind: { [kind: string]: Predicate } = {};
	private things_byType: { [type: string]: Array<Thing> } = {};
	private traits_byType: { [type: string]: Array<Trait> } = {};
	private relationships_byParentHID: Relationships_ByHID = {};
	private relationships_byChildHID: Relationships_ByHID = {};
	private ancestry_byHID:{ [hash: number]: Ancestry } = {};
	private access_byKind: { [kind: string]: Access } = {};
	private access_byHID: { [hid: number]: Access } = {};
	private thing_byHID: { [hid: number]: Thing } = {};
	private trait_byHID: { [hid: number]: Trait } = {};
	private user_byHID: { [hid: number]: User } = {};
	ids_translated: { [prior: string]: string } = {};
	relationships: Array<Relationship> = [];
	predicates: Array<Predicate> = [];
	things: Array<Thing> = [];
	traits: Array<Trait> = [];
	rootsAncestry!: Ancestry;
	rootAncestry!: Ancestry;

	fetching_dataTypes = [DatumType.things, DatumType.traits, DatumType.predicates, DatumType.relationships];
	saving_dataTypes = [DatumType.relationships, DatumType.things, DatumType.traits, DatumType.predicates];
	replace_rootID: string | null = k.empty;		// required for DBLocal at launch
	isAssembled = false;
	db: DBCommon;
	grabs: Grabs;
	root!: Thing;

	get hasNothing(): boolean { return !this.root; }
	get idRoot(): string | null { return this.root!.id ?? null; };

	static readonly INIT: unique symbol;

	constructor(db: DBCommon) {
		this.grabs = new Grabs();
		this.db = db;
		signals.handle_rebuildGraph(0, (ancestry) => {
			ancestry?.thing?.oneAncestries_rebuildForSubtree();
		});
	}

	setup_root_andAncestry() {
		const rootAncestry = this.ancestry_remember_createUnique();
		if (!rootAncestry) {
			alert('No root ancestry. Please, write me at sand@gizmolab.com');
		} else {
			this.rootAncestry = rootAncestry;
			const root = rootAncestry.thing;
			if (!!root) {
				this.root = root;
			}
		}
	}

	static readonly EVENTS: unique symbol;

	async handle_tool_clicked(idControl: string, mouse_state: Mouse_State) {
		const event: MouseEvent | null = mouse_state.event as MouseEvent;
        const ancestry = get(s_ancestry_showing_tools);
		if (!!ancestry) {
			switch (idControl) {
				case IDTool.more: debug.log_tools('needs more'); break;
				case IDTool.create: await this.ancestry_edit_persistentCreateChildOf(ancestry); break;
				case IDTool.next: this.ancestry_relayout_toolCluster_nextParent(event?.altKey ?? false); return;
				case IDTool.add_parent: this.toggleAlteration(AlterationType.adding, mouse_state.isLong); return;
				case IDTool.delete_confirm: await this.ancestries_rebuild_traverse_persistentDelete([ancestry]); break;
				case IDTool.delete_parent: this.toggleAlteration(AlterationType.deleting, mouse_state.isLong); return;
				default: break;
			}
			s_ancestry_showing_tools.set(null);
			signals.signal_relayoutWidgets_fromFocus();
		}
	}

	async handle_key_down(event: KeyboardEvent) {

		///////////////////////
		// main key dispatch //
		///////////////////////

		let ancestryGrab = this.grabs.latestAncestryGrabbed(true);
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
				if (!ancestryGrab) {
					ancestryGrab = rootAncestry;
					graph_needsRebuild = rootAncestry.becomeFocus();
				}
				if (g.allow_GraphEditing) {
					if (!!ancestryGrab && g.allow_TitleEditing) {
						switch (key) {
							case k.space:	await this.ancestry_edit_persistentCreateChildOf(ancestryGrab); break;
							case 'd':		await this.thing_edit_persistentDuplicate(ancestryGrab); break;
							case '-':		if (!COMMAND) { await this.thing_edit_persistentAddLine(ancestryGrab); } break;
							case 'tab':		await this.ancestry_edit_persistentCreateChildOf(ancestryGrab.parentAncestry); break; // Title_Edit_State editor also makes this call
							case 'enter':	ancestryGrab.startEdit(); break;
						}
					}
					switch (key) {
						case 'delete':
						case 'backspace':	await this.ancestries_rebuild_traverse_persistentDelete(get(s_grabbed_ancestries)); s_grabbed_ancestries.set([]); break;
					}
				}
				if (!!ancestryGrab) {
					switch (key) {
						case '/':			graph_needsRebuild = ancestryGrab.becomeFocus(); break;
						case 'arrowright':	event.preventDefault(); await this.ancestry_rebuild_persistentMoveRight(ancestryGrab,  ancestryGrab.isParental, SHIFT, OPTION, EXTREME); break;
						case 'arrowleft':	event.preventDefault(); await this.ancestry_rebuild_persistentMoveRight(ancestryGrab, !ancestryGrab.isParental, SHIFT, OPTION, EXTREME); break;
					}
				}
				switch (key) {
					case '!':				graph_needsRebuild = this.rootAncestry?.becomeFocus(); break;
					case '`':               event.preventDefault(); this.latestAncestryGrabbed_toggleEditing_Tools(); break;
					case 'arrowup':			await this.latestAncestryGrabbed_rebuild_persistentMoveUp_maybe(true, SHIFT, OPTION, EXTREME); break;
					case 'arrowdown':		await this.latestAncestryGrabbed_rebuild_persistentMoveUp_maybe(false, SHIFT, OPTION, EXTREME); break;
					case 'escape':			if (!!get(s_ancestry_showing_tools)) { this.clear_editingTools(); }
				}
				if (graph_needsRebuild) {
					signals.signal_rebuildGraph_fromFocus();
				}
				const duration = ((new Date().getTime()) - time).toFixed(1);
				debug.log_key(`H  (${duration}) ${key}`);
				setTimeout( async () => {
					await this.db.persistAll();
				}, 1);
			}
		}
	}

	clear_editingTools() {
		s_alteration_mode.set(null);
		s_ancestry_showing_tools.set(null);
	}

	static readonly FOCUS: unique symbol;

	get focus(): Thing | null {
		const ancestry = get(s_focus_ancestry);
		return !ancestry ? this.root : ancestry.thing;
	}

	static readonly GRABS: unique symbol;

	async latestAncestryGrabbed_rebuild_persistentMoveUp_maybe(up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean) {
		const ancestry = this.grabs.latestAncestryGrabbed(up);
		if (!!ancestry) {
			this.ancestry_rebuild_persistentMoveUp_maybe(ancestry, up, SHIFT, OPTION, EXTREME);
		}
	}

	latestAncestryGrabbed_toggleEditing_Tools(up: boolean = true) {
		const ancestry = this.grabs.latestAncestryGrabbed(up);
		if (!!ancestry && !ancestry.isRoot) {
			s_ancestry_showing_tools.set(ancestry.toolsGrabbed ? null : ancestry);
			signals.signal_rebuildGraph_fromFocus();
		}
	}

	thing_child_forRelationshipHID(hid: number | null): Thing | null {
		if (!!hid || hid == 0) {
			const relationship = this.relationship_forHID(hid);
			if (!!relationship) {
				return this.thing_forHID(relationship.idChild.hash());
			}
		}
		return this.root;
	}
	
	static readonly THINGS: unique symbol;

	things_refreshKnowns() {
		const saved = this.things;
		this.things_forgetAll();
		saved.map(t => this.thing_remember(t));
	}

	things_forgetAll() {
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
		const isContains = ancestry.kindPredicate == PredicateKind.contains;
		let things: Array<Thing | null> = isContains ? [this.root] : [];
		const hids = ancestry.ids_hashed;
		if (!isContains || hids.length != 0) {
			for (const hid of hids) {
				const relationship = this.relationship_forHID(hid);
				if (!!relationship) {
					if (things.length == 0 && !isContains) {
						things.push(relationship.parent);
					}
					things.push(relationship.child);
				}
			}
		}
		return u.strip_invalid(things);
	}

	static readonly THING: unique symbol;

	thing_forHID(hid: number): Thing | null { return this.thing_byHID[hid ?? undefined]; }

	thing_remember_updateID_to(thing: Thing, id: string) {
		this.relationships_translate_idsFromTo_forParents(thing.id, id, false);
		this.relationships_translate_idsFromTo_forParents(thing.id, id, true);
		this.thing_forget(thing);
		thing.setID(id);
		this.thing_remember(thing);
	}

	thing_forget(thing: Thing) {
		const typeThings = this.things_byType[thing.type];
		delete this.thing_byHID[thing.idHashed];
		this.things = u.strip_invalid(this.things);
		if (!!typeThings) {
			this.things_byType[thing.type] = u.strip_invalid(typeThings);
		}
	}

	thing_remember_runtimeCreateUnique(baseID: string, id: string, title: string, color: string, type: string,
		already_persisted: boolean = false): Thing {
		let thing = this.thing_forHID(id?.hash() ?? null);
		if (!thing) {
			thing = this.thing_remember_runtimeCreate(baseID, id, title, color, type, already_persisted);
		}
		return thing;
	}

	async thing_remember_persistentRelocateChild(child: Thing, fromParent: Thing, toParent: Thing): Promise<any> {
		let relationship = this.relationship_whereID_isChild(child.id);
		if (!!relationship && relationship.idParent == fromParent.id) {
			this.relationship_forget(relationship);
			relationship.idParent = toParent.id;
			this.relationship_remember(relationship);
			relationship.persist();
		}
	}

	async thing_edit_persistentAddLine(ancestry: Ancestry, below: boolean = true) {
		const parentAncestry = ancestry.parentAncestry;
		const parent = parentAncestry?.thing;
		const thing = ancestry.thing;
		if (!!thing && parent && parentAncestry) {
			const order = ancestry.order + (below ? 0.5 : -0.5);
			const child = this.thing_runtimeCreate(thing.baseID, Identifiable.newID(), k.title_line, parent.color, k.empty);
			await this.ancestry_edit_persistentAddAsChild(parentAncestry, child, order, false);
		}
	}

	thing_remember_runtimeCreate(baseID: string, id: string, title: string, color: string, type: string,
		already_persisted: boolean = false, needs_upgrade: boolean = false): Thing {
		const thing = this.thing_runtimeCreate(baseID, id, title, color, type, already_persisted);
		this.thing_remember(thing);
		if (needs_upgrade) {
			thing.set_isDirty();	// add type and remove trait fields
		}
		return thing;
	}

	async thing_remember_runtimeCopy(baseID: string, parent: Thing) {
		const newThing = new Thing(baseID, Identifiable.newID(), parent.title, parent.color, parent.type);
		const prohibitedTraits: Array<string> = [ThingType.roots, ThingType.root, ThingType.bulk];
		if (prohibitedTraits.includes(parent.type)) {
			newThing.type = k.empty;
		}
		this.thing_remember(newThing);
		return newThing;
	}

	async thing_edit_persistentDuplicate(ancestry: Ancestry) {
		const thing = ancestry.thing;
		const id = thing?.id;
		const parentAncestry = ancestry.parentAncestry;
		if (!!thing && id && parentAncestry) {
			const sibling = await this.thing_remember_runtimeCopy(id, thing);
			sibling.title = 'idea';
			await this.ancestry_edit_persistentAddAsChild(parentAncestry, sibling, ancestry.order + 0.5);
		}
	}

	thing_remember(thing: Thing) {
		if (!!thing && !this.thing_forHID(thing.idHashed)) {
			this.thing_byHID[thing.idHashed] = thing;
			let things = this.things_byType[thing.type] ?? [];
			if (!things.map(t => t.id).includes(thing.id)) {
				things.push(thing);
				this.things_byType[thing.type] = things;
			}
			if (!this.things.map(t => t.id).includes(thing.id)) {
				this.things.push(thing);
			}
			if (thing.isRoot && (!thing.baseID || [k.empty, this.db.baseID].includes(this.db.baseID))) {
				this.root = thing;
			}
		}
	}

	thing_runtimeCreate(baseID: string, id: string, title: string, color: string, type: string,
		already_persisted: boolean = false): Thing {
		let thing: Thing | null = null;
		if (id && type == ThingType.root && baseID != this.db.baseID) {		// other bulks have their own root & id
			thing = this.thing_remember_bulkRootID(baseID, id, color);		// which our thing needs to adopt
		} else {
			thing = new Thing(baseID, id, title, color, type, already_persisted);
			if (thing.isBulkAlias) {
				thing.needsBulkFetch = true;
				if (title.includes('@')) {
					const parts = title.split('@');
					thing.title = parts[0];
					thing.bulkRootID = parts[1];
				}
			}
		}
		return thing!;
	}

	thing_build_fromDict(dict: Dictionary) {
		const root = this.root;
		if (!root|| this.replace_rootID != dict.id) {	// leave root untouched
			let type = dict.type;
			if (!!root && !this.replace_rootID && type == ThingType.root) {
				type = k.empty;						// prevent multiple roots
			}
			this.thing_remember_runtimeCreateUnique(this.db.baseID, dict.id, dict.title, dict.color, type);
		}
	}

	async thing_forget_persistentDelete(thing: Thing) {
		const relationships = u.uniquely_concatenateArrays(
			this.relationships_byChildHID[thing.idHashed] ?? [],
			this.relationships_byParentHID[thing.idHashed] ?? []
		)
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

	relationships_translate_idsFromTo_forParents(idFrom: string, idTo: string, forParents: boolean) {
		for (const predicate of this.predicates) {
			const relationships = this.relationships_forPredicateThingIsChild(predicate.kind, idFrom, forParents);
			for (const r of relationships) {
				if (!forParents && r.idParent != idTo) {
					this.relationship_forget(r);
					r.hidParent = idTo.hash();
					r.isDirty = true;
					r.idParent = idTo;
					this.relationship_remember(r);
				}
				if (forParents && r.idChild != idTo) {
					this.relationship_forget(r);
					r.hidChild = idTo.hash();
					r.isDirty = true;
					r.idChild = idTo;
					this.relationship_remember(r);
				}
			}
		}
	}

	static readonly TRAITS: unique symbol;

	traits_forOwnerHID(hid: number | null): Array<Trait> | null {
		const value = !!hid ? this.traits_byOwnerHID?.[hid] : null;
		return (value instanceof Array) ? value : null;
	}

	traits_refreshKnowns() {
		const saved = this.traits;
		this.traits_forgetAll();
		saved.map(r => this.trait_remember(r));
	}

	traits_forgetAll() {
		this.traits_byOwnerHID = {};
		this.traits_byType = {};
		this.trait_byHID = {};
		this.traits = [];
	}

	static readonly TRAIT: unique symbol;

	trait_forHID(hid: number): Trait | null { return this.trait_byHID[hid ?? undefined]; }

	trait_runtimeCreate(baseID: string, id: string, ownerID: string, type: TraitType, text: string, already_persisted: boolean = false): Trait {
		return new Trait(baseID, id, ownerID, type, text, already_persisted);
	}

	trait_remember_runtimeCreateUnique(baseID: string, id: string, ownerID: string, type: TraitType, text: string, already_persisted: boolean = false): Trait {
		return this.trait_forHID(id?.hash()) ?? this.trait_remember_runtimeCreate(baseID, id, ownerID, type, text, already_persisted);
	}

	trait_forType_ownerHID(type: TraitType | null, ownerHID: number | null): Trait| null {
		const traits = this.traits_forOwnerHID(ownerHID)?.filter(t => t.type == type);
		return !traits ? null : traits[0]
	}

	trait_build_fromDict(dict: Dictionary) {
		this.trait_remember_runtimeCreateUnique(this.db.baseID, dict.id, dict.ownerID, dict.type, dict.text);
	}

	trait_forget(trait: Trait) {
		delete this.trait_byHID[trait.idHashed];
		delete this.traits_byOwnerHID[trait.ownerID.hash()];
		this.traits = this.traits.filter(t => t !== trait);
		this.traits_byType[trait.type] = this.traits_byType[trait.type].filter(t => t !== trait);
	}

	trait_remember(trait: Trait) {
		const hid = trait.ownerID.hash();
		this.trait_byHID[trait.idHashed] = trait;
		(this.traits_byOwnerHID[hid] = this.traits_byOwnerHID[hid] || []).push(trait);
		(this.traits_byType[trait.type] = this.traits_byType[trait.type] || []).push(trait);
		this.traits.push(trait);
	}

	trait_remember_runtimeCreate(baseID: string, id: string, ownerID: string, type: TraitType, text: string,
		already_persisted: boolean = false): Trait {
		const trait = this.trait_runtimeCreate(baseID, id, ownerID, type, text, already_persisted);
		this.trait_remember(trait);
		return trait;
	}

	setText_forType_ownerHID(text: string, type: TraitType, ownerID: string) {
		let trait = this.trait_forType_ownerHID(type, ownerID.hash());
		if (!trait) {
			trait = this.trait_remember_runtimeCreate(this.db.baseID, Identifiable.newID(), ownerID, type, text);
		} else {
			trait.text = text;
		}
		trait.set_isDirty();
	}

	static readonly BULKS: unique symbol;

	thing_remember_bulkRootID(baseID: string, id: string, color: string) {
		const thing = this.thing_bulkAlias_forTitle(baseID);
		if (!!thing) {
			// id is of the root thing from bulk fetch all
			// i.ux., it is the root id from another baseID
			// need a second thing lookup by this id
			// so children relationships will work
			this.thing_byHID[id.hash()] = thing;
			thing.needsBulkFetch = true;
			thing.bulkRootID = id;
			thing.color = color;
		}
		return thing;
	}

	thing_bulkAlias_forTitle(title: string | null) {
		if (!!title) {
			for (const thing of this.things_byType[ThingType.bulk]) {
				if  (thing.title == title) {		// special case TODO: convert to a query string
					return thing;
				}
			}
		}
		return null;
	}

	async thing_remember_bulk_recursive_persistentRelocateRight(ancestry: Ancestry, newParentAncestry: Ancestry) {
		const newParent = newParentAncestry.thing;
		let newThingAncestry: Ancestry | null = null;
		const thing = ancestry.thing;
		if (!!thing && newParent) {
			const baseID = newParent.isBulkAlias ? newParent.title : newParent.baseID;
			const newThing = await this.thing_remember_runtimeCopy(baseID, thing);
			newThingAncestry = newParentAncestry.extend_withChild(newThing);
			if (!!newThingAncestry) {
				await this.relationship_remember_persistent_addChild_toAncestry(newThing, newParentAncestry);
				for (const childAncestry of ancestry.childAncestries) {
					this.thing_remember_bulk_recursive_persistentRelocateRight(childAncestry, newThingAncestry);
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

	static readonly RELATIONSHIPS: unique symbol;

	relationships_refreshKnowns() {
		const saved = this.relationships;
		this.relationships_forgetAll();
		saved.map(r => this.relationship_remember(r));
	}

	relationships_forgetAll() {
		this.relationships_byParentHID = {};
		this.relationships_byChildHID = {};
		this.relationship_byHID = {};
		this.relationships = [];
	}

	relationships_forPredicateThingIsChild(kindPredicate: string, idThing: string, forParents: boolean): Array<Relationship> {
		const dict = forParents ? this.relationships_byChildHID : this.relationships_byParentHID;
		const hid = idThing.hash();
		const matches = dict[hid] as Array<Relationship>; // filter out bad values (dunno what this does)
		const array: Array<Relationship> = [];
		if (Array.isArray(matches)) {
			for (const relationship of matches) {
				if (relationship.kindPredicate == kindPredicate) {
					array.push(relationship);
				}
			}
		}
		return array;
	}

	relationship_forPredicateKind_parent_child(kindPredicate: string, idParent: string, idChild: string): Relationship | null {
		const matches = this.relationships_forPredicateThingIsChild(kindPredicate, idParent, false);
		if (Array.isArray(matches)) {
			for (const relationship of matches) {
				if (relationship.idChild == idChild) {
					return relationship;
				}
			}
		}
		return null;
	}

	async relationships_persistentCreateMissing(baseID: string) {
		if (!!this.idRoot){
			for (const thing of this.things) {
				const idThing = thing.id;
				if (thing.type != ThingType.root && thing.baseID == baseID) {
					let relationship = this.relationship_whereID_isChild(idThing);
					if (!relationship) {
						await this.relationship_remember_persistentCreateUnique(baseID, Identifiable.newID(), PredicateKind.contains,
							this.idRoot, idThing, 0, CreationOptions.getPersistentID)
					}
				}
			}
		}
	}

	async relationships_removeHavingNullReferences() {
		const array = Array<Relationship>();
		for (const relationship of this.relationships) {
			let parent = relationship.parent;
			const child = relationship.child;
			if (!child || !parent) {
				parent = relationship.parent;
				array.push(relationship);
			}
		}
		while (array.length > 0) {
			const relationship = array.pop();
			if (!!relationship) {
				await this.db.relationship_persistentDelete(relationship);
				this.relationship_forget(relationship);
			}
		}
	}

	static readonly RELATIONSHIP: unique symbol;

	relationship_forHID(hid: number): Relationship | null { return this.relationship_byHID[hid ?? undefined]; }
	
	relationship_remember(relationship: Relationship) {
		if (!this.relationship_byHID[relationship.idHashed]) {
			if (!this.relationships.map(r => r.id).includes(relationship.id)) {
				this.relationships.push(relationship);
			}
			this.relationship_byHID[relationship.idHashed] = relationship;
			this.relationship_rememberByKnown(relationship, relationship.idChild, this.relationships_byChildHID);
			this.relationship_rememberByKnown(relationship, relationship.idParent, this.relationships_byParentHID);
			
			if (relationship.baseID != this.db.baseID) {
				debug.log_error(`relationship crossing dbs: ${relationship.description}`);
			}
		}
	}

	relationship_rememberByKnown(relationship: Relationship, id: string, relationships: Relationships_ByHID) {
		if (!!id || id == k.empty) {
			const hid = id.hash();
			let array = relationships[hid] ?? [];
			if (!array.map(r => r.id).includes(relationship.id)) {
				array.push(relationship);
			}
			relationships[hid] = array;
		}
	}

	async relationship_forget_persistentDelete(ancestry: Ancestry, otherAncestry: Ancestry, kindPredicate: string) {
		const thing = ancestry.thing;
		const parentAncestry = ancestry.parentAncestry;
		const relationship = this.relationship_forPredicateKind_parent_child(kindPredicate, otherAncestry.idThing, ancestry.idThing);
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

	relationship_forget_forHID(relationships: Relationships_ByHID, hid: number, relationship: Relationship) {
		let array = relationships[hid] ?? [];
		u.remove<Relationship>(array, relationship)
		relationships[hid] = array;
	}

	relationship_forget(relationship: Relationship) {
		u.remove<Relationship>(this.relationships, relationship);
		delete this.relationship_byHID[relationship.idHashed];
		this.relationship_forget_forHID(this.relationships_byChildHID, relationship.idChild.hash(), relationship);
		this.relationship_forget_forHID(this.relationships_byParentHID, relationship.idParent.hash(), relationship);
	}

	relationship_whereID_isChild(idThing: string, isChild: boolean = true) {
		const matches = this.relationships_forPredicateThingIsChild(PredicateKind.contains, idThing, isChild);
		if (matches.length > 0) {
			const relationship = matches[0];
			return relationship;
		}
		return null;
	}

	relationship_build_fromDict(dict: Dictionary) {
		let idParent = dict.idParent;
		if (!!idParent) {
			if (idParent == dict.idChild) {
				console.log('preventing infinite recursion')
			} else {
				this.relationship_remember_runtimeCreateUnique(this.db.baseID, dict.id, dict.kindPredicate, idParent, dict.idChild, dict.order);
			}
		}
	}

	relationship_remember_runtimeCreateUnique(baseID: string, idRelationship: string, kindPredicate: string, idParent: string, idChild: string,
		order: number, creationOptions: CreationOptions = CreationOptions.none) {
		let reversedRelationship = this.relationship_forPredicateKind_parent_child(kindPredicate, idChild, idParent);
		let relationship = this.relationship_forPredicateKind_parent_child(kindPredicate, idParent, idChild);
		const isBidirectional = this.predicate_forKind(kindPredicate)?.isBidirectional ?? false;
		const already_persisted = creationOptions == CreationOptions.isFromPersistent;
		if (!relationship) {
			relationship = new Relationship(baseID, idRelationship, kindPredicate, idParent, idChild, order, already_persisted);
			this.relationship_remember(relationship);
		}
		if (isBidirectional && !reversedRelationship) {
			reversedRelationship = new Relationship(baseID, Identifiable.newID(), kindPredicate, idChild, idParent, order, already_persisted);
			this.relationship_remember(reversedRelationship);
		}
		relationship?.order_setTo_persistentMaybe(order);
		reversedRelationship?.order_setTo_persistentMaybe(order);
		return relationship;
	}

	async relationship_remember_persistentCreateUnique(baseID: string, idRelationship: string, kindPredicate: string, idParent: string, idChild: string,
		order: number, creationOptions: CreationOptions = CreationOptions.isFromPersistent): Promise<any> {
		let relationship = this.relationship_forPredicateKind_parent_child(kindPredicate, idParent, idChild);
		if (!!relationship) {
			relationship.order_setTo_persistentMaybe(order, true);
		} else {
			relationship = new Relationship(baseID, idRelationship, kindPredicate, idParent, idChild, order, creationOptions == CreationOptions.isFromPersistent);
			await this.db.relationship_remember_persistentCreate(relationship);
		}
		return relationship;
	}

	static readonly ANCESTRIES: unique symbol;

	ancestries_forgetAll() {
		this.ancestry_byKind_andHash = {};
		this.ancestry_byHID = {};
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

	async ancestries_rebuild_traverse_persistentDelete(ancestries: Array<Ancestry>) {
		if (get(s_focus_ancestry)) {
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

	ancestry_forHID(idHashed: number): Ancestry | null {
		return this.ancestry_byHID[idHashed] ?? null;
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
			const idHashed = ancestry.idHashed;
			let dict = this.ancestry_byKind_andHash[ancestry.kindPredicate] ?? {};
			delete this.ancestry_byHID[idHashed];
			delete dict[idHashed];
			this.ancestry_byKind_andHash[ancestry.kindPredicate] = dict;
		}
	}

	ancestry_remember(ancestry: Ancestry) {
		const idHashed = ancestry.idHashed;
		let dict = this.ancestry_byKind_andHash[ancestry.kindPredicate] ?? {};
		this.ancestry_byHID[idHashed] = ancestry;
		dict[idHashed] = ancestry;
		this.ancestry_byKind_andHash[ancestry.kindPredicate] = dict;
	}

	get ancestry_forBreadcrumbs(): Ancestry {
		const grab = this.grabs.ancestry_lastGrabbed;
		const focus = get(s_focus_ancestry);
		const grab_containsFocus = !!grab && focus.isAProgenyOf(grab)
		return (!!grab && grab.isVisible && !grab_containsFocus) ? grab : focus;
	}

	async ancestry_edit_persistentCreateChildOf(parentAncestry: Ancestry | null) {
		const thing = parentAncestry?.thing;
		if (!!thing && !!parentAncestry) {
			const child = await this.thing_remember_runtimeCopy(thing.baseID, thing);
			child.title = 'idea';
			parentAncestry.expand();
			await this.ancestry_edit_persistentAddAsChild(parentAncestry, child, 0);
		}
	}

	async ancestry_edit_persistentAddAsChild(parentAncestry: Ancestry, child: Thing, order: number, shouldStartEdit: boolean = true) {
		const childAncestry = await this.relationship_remember_persistent_addChild_toAncestry(child, parentAncestry);
		childAncestry.grabOnly();
		childAncestry.relationship?.order_setTo_persistentMaybe(order);
		signals.signal_rebuildGraph_fromFocus();
		if (shouldStartEdit) {
			setTimeout(() => {
				childAncestry.startEdit();
			}, 20);
		}
	}

	async ancestry_remember_bulk_persistentRelocateRight(ancestry: Ancestry, newParentAncestry: Ancestry) {
		const newThingAncestry = await this.thing_remember_bulk_recursive_persistentRelocateRight(ancestry, newParentAncestry);
		if (!!newThingAncestry) {
			newParentAncestry.signal_relayoutWidgets();
			if (newParentAncestry.isExpanded) {
				newThingAncestry.grabOnly();
			} else {
				newParentAncestry.grabOnly();
			}
		}
	}

	ancestry_remember_createUnique(id: string = k.empty, kindPredicate: string = PredicateKind.contains): Ancestry {
		const idHashed = id.hash();
		let dict = this.ancestry_byKind_andHash[kindPredicate] ?? {};
		let ancestry = dict[idHashed];
		if (!ancestry) {
			ancestry = new Ancestry(this.db.dbType, id, kindPredicate);
			this.ancestry_remember(ancestry);
		}
		return ancestry;
	}

	async ancestry_roots() {		// TODO: assumes all ancestries created
		let rootsAncestry: Ancestry | null = null;
		const rootAncestry = this.rootAncestry;
		if (!!rootAncestry) {
			for (const rootsMaybe of this.things_byType[ThingType.roots]) {	// should only be one
				if  (rootsMaybe.title == 'roots') {		// special case TODO: convert to a query string
					return rootAncestry.extend_withChild(rootsMaybe) ?? null;
				}
			}
			const roots = this.thing_runtimeCreate(this.db.baseID, Identifiable.newID(), 'roots', 'red', ThingType.roots);
			await this.relationship_remember_persistent_addChild_toAncestry(roots, rootAncestry).then((ancestry) => { rootsAncestry = ancestry; });
		}
		return rootsAncestry;
	}

	async ancestry_redraw_persistentFetchBulk_browseRight(thing: Thing, ancestry: Ancestry | null = null, grab: boolean = false) {
		if (!!this.rootsAncestry && thing && thing.title != 'roots') {	// not create roots bulk
			await this.db.fetch_hierarchy_from(thing.title)
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

	ancestry_relayout_toolCluster_nextParent(force: boolean = false) {
		const toolsAncestry = get(s_ancestry_showing_tools);
		if (!!toolsAncestry) {
			let ancestry = toolsAncestry;
			// do {
			// 	ancestry = ancestry.next_siblingAncestry;
			// 	if (ancestry.isVisible) {
			// 		break;
			// 	} else if (force) {
			// 		ancestry.assureIsVisible_inTree();
			// 		break;
			// 	}	
			// } while (!ancestry.ancestry_hasEqualID(toolsAncestry));
			ancestry.grabOnly();
			signals.signal_relayoutWidgets_fromFocus();
			s_ancestry_showing_tools.set(ancestry);
		}
	}

	async relationship_remember_persistent_addChild_toAncestry(child: Thing | null, parentAncestry: Ancestry, kindPredicate: string = PredicateKind.contains): Promise<any> {
		const parent = parentAncestry.thing;
		if (!!child && !!parent && !child.isBulkAlias) {
			const changingBulk = parent.isBulkAlias || child.baseID != this.db.baseID;
			const baseID = changingBulk ? child.baseID : parent.baseID;
			if (!child.already_persisted) {
				await this.db.thing_remember_persistentCreate(child);					// for everything below, need to await child.id fetched from dbDispatch
			}
			const relationship = await this.relationship_remember_persistentCreateUnique(baseID, Identifiable.newID(), kindPredicate, parent.idBridging, child.id, 0, CreationOptions.getPersistentID);
			const childAncestry = parentAncestry.uniquelyAppendID(relationship.id);
			u.ancestries_orders_normalize_persistentMaybe(parentAncestry.childAncestries);		// write new order values for relationships
			return childAncestry;
		}
	}

	async ancestry_rebuild_persistentMoveRight(ancestry: Ancestry, RIGHT: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean, fromReveal: boolean = false) {
		if (!OPTION) {
			const thing = ancestry.thing;
			if (!!thing) {
				if (RIGHT && thing.needsBulkFetch) {
					await this.ancestry_redraw_persistentFetchBulk_browseRight(thing, ancestry, true);
				} else {
					this.ancestry_rebuild_runtimeBrowseRight(ancestry, RIGHT, SHIFT, EXTREME, fromReveal);
				}
			}
		} else if (g.allow_GraphEditing) {
			const grab = this.grabs.latestAncestryGrabbed(true);
			if (!!grab) {
				this.ancestry_rebuild_persistentRelocateRight(grab, RIGHT, EXTREME);
			}
		}
	}

	ancestry_rebuild_persistentMoveUp_maybe(ancestry: Ancestry, up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean) {
		const parentAncestry = ancestry.parentAncestry;
		if (!!parentAncestry) {
			let graph_needsRebuild = false;
			const siblings = parentAncestry.children;
			const length = siblings.length;
			const thing = ancestry?.thing;
			if (!siblings || length == 0) {		// friendly for first-time users
				this.ancestry_rebuild_runtimeBrowseRight(ancestry, true, EXTREME, up);
			} else if (!!thing) {
				const is_rings_mode = g.showing_rings;
				const isBidirectional = ancestry.predicate?.isBidirectional ?? false;
				if ((!isBidirectional && ancestry.isParental) || !is_rings_mode) {
					const index = siblings.indexOf(thing);
					const newIndex = index.increment(!up, length);
					if (!!parentAncestry && !OPTION) {
						const grabAncestry = parentAncestry.extend_withChild(siblings[newIndex]);
						if (!!grabAncestry) {
							if (!grabAncestry.isVisible) {
								if (!parentAncestry.isFocus) {
									graph_needsRebuild = parentAncestry.becomeFocus();
								} else if (is_rings_mode) {
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
				}
			}
		}
	}

	ancestry_rebuild_persistentRelocateRight(ancestry: Ancestry, RIGHT: boolean, EXTREME: boolean) {
		const thing = ancestry.thing;
		const newParentAncestry = RIGHT ? ancestry.ancestry_ofNextSibling(false) : ancestry.stripBack(2);
		const newParent = newParentAncestry?.thing;
		if (!!thing && newParent && newParentAncestry) {
			if (thing.isInDifferentBulkThan(newParent)) {		// should move across bulks
				this.ancestry_remember_bulk_persistentRelocateRight(ancestry, newParentAncestry);
			} else {
				const relationship = ancestry.relationship;
				if (!!relationship) {
					const order = RIGHT ? relationship.order : 0;
					relationship.idParent = newParent.id;
					relationship.order_setTo_persistentMaybe(order + 0.5, true);
				}
				this.relationships_refreshKnowns();
				newParentAncestry.extend_withChild(thing)?.grabOnly();
				this.rootAncestry.order_normalizeRecursive_persistentMaybe(true);
				if (!newParentAncestry.isExpanded) {
					newParentAncestry.expand();
				}
				if (!newParentAncestry.isVisible) {
					newParentAncestry.becomeFocus();
				}
			}
			signals.signal_rebuildGraph_fromFocus();			// so Tree_Children component will update
		}
	}

	ancestry_rebuild_runtimeBrowseRight(ancestry: Ancestry, RIGHT: boolean, SHIFT: boolean, EXTREME: boolean, fromReveal: boolean = false) {
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
						if (!ancestry.isExpanded) {
							graph_needsRebuild = ancestry.expand();
						}
					} else {
						if (newGrabIsNotFocus && newGrabAncestry && !newGrabAncestry.isExpanded) {
							graph_needsRebuild = newGrabAncestry.expand();
						}
					}
				} else if (newGrabAncestry) { 
					if (ancestry.isExpanded) {
						graph_needsRebuild = ancestry.collapse();
						newGrabAncestry = this.grabs.areInvisible ? ancestry : null;
					} else if (newGrabAncestry.isExpanded || (!!rootAncestry && !rootAncestry.ancestry_hasEqualID(newGrabAncestry))) {
						graph_needsRebuild = newGrabAncestry.collapse();
					}
				}
			}
		}
		s_title_edit_state.set(null);
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

	predicate_forKind(kind: string | null): Predicate | null { return !kind ? null : this.predicate_byKind[kind]; }
	predicates_byDirection(isBidirectional: boolean) { return this.predicate_byDirection[isBidirectional ? 1 : 0]; }

	predicates_forgetAll() {
		this.relationship_byHID = {};
		this.predicates = [];
	}

	predicates_refreshKnowns() {
		const saved = this.predicates;
		this.predicates_forgetAll();
		saved.map(p => this.predicate_remember(p));
	}

	predicate_defaults_remember_runtimeCreate() {
		this.predicate_remember_runtimeCreateUnique(Predicate.newID(), PredicateKind.explains, false, false);
		this.predicate_remember_runtimeCreateUnique(Predicate.newID(), PredicateKind.contains, false, false);
		this.predicate_remember_runtimeCreateUnique(Predicate.newID(), PredicateKind.requires, false, false);
		this.predicate_remember_runtimeCreateUnique(Predicate.newID(), PredicateKind.supports, false, false);
		this.predicate_remember_runtimeCreateUnique(Predicate.newID(), PredicateKind.isRelated, true, false);
		this.predicate_remember_runtimeCreateUnique(Predicate.newID(), PredicateKind.appreciates, false, false);
	}

	static readonly PREDICATE: unique symbol;

	kindPredicateFor_idRelationship(idRelationship: string): string {
		const relationship = this.relationship_forHID(idRelationship.hash());
		return relationship?.kindPredicate ?? 'bad kind: missing relationship';			// grab its predicate kind
	}

	predicate_build_fromDict(dict: Dictionary) {
		const predicate = this.predicate_remember_runtimeCreateUnique(dict.id, dict.kind, dict.isBidirectional, false);
		predicate.stateIndex = dict.stateIndex;		
	}

	predicate_forget(predicate: Predicate) {
		let predicates = this.predicates_byDirection(predicate.isBidirectional) ?? [];
		u.remove<Predicate>(predicates, predicate);
		this.predicate_byDirection[predicate.isBidirectional ? 1 : 0] = predicates;
		u.remove<Predicate>(this.predicates, predicate);
		delete this.predicate_byKind[predicate.kind];
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

	predicate_remember_runtimeCreateUnique(id: string, kind: string, isBidirectional: boolean, already_persisted: boolean = true) {
		let predicate = this.predicate_forKind(kind);
		if (!predicate) {
			predicate = this.predicate_remember_runtimeCreate(id, kind, isBidirectional, already_persisted);
		}
		return predicate;
	}

	predicate_remember_runtimeCreate(id: string, kind: string, isBidirectional: boolean, already_persisted: boolean = true) {
		let predicate = new Predicate(id, kind, isBidirectional, already_persisted);
		this.predicate_remember(predicate);
		return predicate;
	}

	static readonly ANCILLARY: unique symbol;

	access_runtimeCreate(idAccess: string, kind: string) {
		const access = new Access(this.db.dbType, idAccess, kind);
		this.access_byHID[idAccess.hash()] = access;
		this.access_byKind[kind] = access;
	}

	user_runtimeCreate(id: string, name: string, email: string, phone: string) {
		const user = new User(this.db.dbType, id, name, email, phone);
		this.user_byHID[id.hash()] = user;
	}

	static readonly FILES: unique symbol;

	select_file_toUpload(SHIFT: boolean) {
		s_id_popupView.set(IDControl.open);
		this.replace_rootID = SHIFT ? k.empty : null;	// prime it to be updated from file (after user choses it)
	}

	get data_toSave(): Dictionary {
		const ancestry = this.user_selected_ancestry;
		return ancestry.isRoot ? this.all_data : this.progeny_dataFor(ancestry);
	}

	save_toFile() {
		const data = this.data_toSave;
		const filename = `${data.title.toLowerCase()}.json`;
		files.persist_json_object_toFile(data, filename);
	}

	async fetch_fromFile(file: File) {
		await files.extract_json_object_fromFile(file, async (result) => {
			const dict = result as Dictionary;
			if (!!dict) {
				await this.extract_hierarchy_from(dict);
			}
		});
	}

	get user_selected_ancestry(): Ancestry {
		const focus = get(s_focus_ancestry);
		let grabbed = this.grabs.ancestry_lastGrabbed;
		if (!!grabbed && !grabbed.isRoot && !grabbed.isFocus) {
			return grabbed;
		} else if (!!focus && !focus.isRoot) {
			return focus;
		} else {
			return this.rootAncestry;
		}
	}

	get all_data(): Dictionary {
		const root = this.root;
		let data: Dictionary = { 
			'title' : root.title,
			'id' : root.id};
		for (const type of this.saving_dataTypes) {
			switch(type) {
				case DatumType.things:		  data[type] = this.things; break;
				case DatumType.traits:		  data[type] = this.traits; break;
				case DatumType.predicates:	  data[type] = this.predicates; break;
				case DatumType.relationships: data[type] = this.relationships; break;
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
		data[DatumType.predicates] = this.predicates;
		ancestry.traverse((ancestry: Ancestry) => {
			const thing = ancestry.thing;
			const thingTraits = thing?.traits;
			const relationship = ancestry.relationship;
			if (!!thingTraits) {
				traits = u.uniquely_concatenateArrays(traits, thingTraits);
			}
			if (!!thing && things.filter(r => r.id == thing.id).length == 0) {
				things.push(thing);
			}
			if (!isFirst && !!relationship && relationships.filter(r => r.id == relationship.id).length == 0) {
				relationships.push(relationship);
			}
			isFirst = false;
			return false;
		});
		data[DatumType.relationships] = relationships;
		data[DatumType.things] = things;
		data[DatumType.traits] = traits;
		return data;
	}

	static readonly BUILD: unique symbol;

	restore_hierarchy() {
		persistLocal.restore_focus();
		persistLocal.restore_grabbed_andExpanded(true);
		// persistLocal.restore_page_states();
	}

	reset_hierarchy() {
		s_title_edit_state.set(null);
		s_ancestry_showing_tools.set(null);
		this.restore_hierarchy();
		this.isAssembled = true;
		this.db.hasData = true;
	}

	async conclude_fetch_andPersist() {
		// await this.relationships_persistentCreateMissing(this.db.baseID);
		// await this.relationships_removeHavingNullReferences();
		this.reset_hierarchy();
		await this.db.persistAll();
		s_number_ofThings.set(this.things.length);			// signal Storage.svelte
	}

	async rebuild_hierarchy_with(dict: Dictionary) {
		this.replace_rootID = dict.id;
		this.hierarchy_forgetAll_exceptPredicates();		// predicates are consistent across all dbs
		this.thing_remember(this.root);						// retain root
		for (const type of this.fetching_dataTypes) {
			this.build_objects_fromArray_ofType(dict[type], type);
		}
		this.relationships_translate_idsFromTo_forParents(dict.id, this.idRoot!, false);
		await this.conclude_fetch_andPersist();
	}

	async extract_hierarchy_from(dict: Dictionary) {
		if (this.replace_rootID != null) {
			await this.rebuild_hierarchy_with(dict);
		} else {
			await this.build_andAdd_progeny_with(dict);
		}
		signals.signal_rebuildGraph_fromFocus();
	}

	async build_andAdd_progeny_with(dict: Dictionary) {
		for (const type of this.fetching_dataTypes) {
			this.build_objects_fromArray_ofType(dict[type], type);
		}
		const child = this.thing_forHID(dict.hid);
		const ancestry = this.user_selected_ancestry;
		await this.relationship_remember_persistent_addChild_toAncestry(child, ancestry);
		await this.db.persistAll();
	}

	build_objects_fromArray_ofType(array: Array<Dictionary>, type: string) {
		for (const dict of array) {
			switch(type) {
				case DatumType.things:		  this.thing_build_fromDict(dict); break;
				case DatumType.traits:		  this.trait_build_fromDict(dict); break;
				case DatumType.predicates:	  this.predicate_build_fromDict(dict); break;
				case DatumType.relationships: this.relationship_build_fromDict(dict); break;
			}
		}
	}

	static readonly REMEMBER: unique symbol;

	hierarchy_forgetAll_exceptPredicates() {
		this.things_forgetAll();
		this.traits_forgetAll();
		this.ancestries_forgetAll();
		this.relationships_forgetAll();
	}

	hierarchy_forgetAll() {
		this.things_forgetAll();
		this.traits_forgetAll();
		this.predicates_forgetAll();
		this.ancestries_forgetAll();
		this.relationships_forgetAll();
	}

	hierarchy_refreshKnowns() {
		this.ancestries_forgetAll();
		this.things_refreshKnowns();
		this.traits_refreshKnowns();
		this.predicates_refreshKnowns();
		this.relationships_refreshKnowns();
	}

	static readonly OTHER: unique symbol;

	toggleAlteration(wantsAlteration: AlterationType, isRelated: boolean) {
		const isAltering = get(s_alteration_mode)?.type;
		const predicate = isRelated ? Predicate.isRelated : Predicate.contains;
		const nextAltering = wantsAlteration == isAltering ? null : new Alteration_State(wantsAlteration, predicate);
		if (!!nextAltering) {
			debug.log_tools(`needs ${wantsAlteration} ${predicate?.kind} alteration`)
		} else {
			debug.log_tools(`end ${wantsAlteration} alteration`)
		}
		s_alteration_mode.set(nextAltering);
	}

}
