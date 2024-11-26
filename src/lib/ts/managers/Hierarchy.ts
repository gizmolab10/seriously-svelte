import { g, k, u, User, Thing, Trait, Grabs, debug, Access, IDTool, signals } from '../common/Global_Imports';
import { s_alteration_mode, s_grabbed_ancestries, s_ancestry_showing_tools } from '../state/Svelte_Stores';
import { Relationship, CreationOptions, AlterationType, Alteration_State } from '../common/Global_Imports';
import { ThingType, TraitType, Predicate, Ancestry, Mouse_State } from '../common/Global_Imports';
import { s_edit_state, s_focus_ancestry } from '../state/Svelte_Stores';
import RemoteIdentifiable from '../basis/RemoteIdentifiable';
import Identifiable from '../basis/Identifiable';
import DBInterface from '../db/DBInterface';
import { get } from 'svelte/store';

type Relationships_ByHID = { [hid: number]: Array<Relationship> }

export class Hierarchy {
	private ancestry_byKind_andHash:{ [kind: string]: { [hash: number]: Ancestry } } = {};
	private predicate_byDirection: { [direction: number]: Array<Predicate> } = {};
	private traits_byOwnerHID: { [ownerHID: number]: Array<Trait> } = {};
	private relationship_byHID: { [hid: number]: Relationship } = {};
	private relationships_byPredicateHID: Relationships_ByHID = {};
	private predicate_byKind: { [kind: string]: Predicate } = {};
	private things_byType: { [type: string]: Array<Thing> } = {};
	private traits_byType: { [type: string]: Array<Trait> } = {};
	private relationships_byParentHID: Relationships_ByHID = {};
	private relationships_byChildHID: Relationships_ByHID = {};
	private predicate_byHID: { [hid: number]: Predicate } = {};
	private ancestry_byHID:{ [hash: number]: Ancestry } = {};
	private access_byKind: { [kind: string]: Access } = {};
	private access_byHID: { [hid: number]: Access } = {};
	private thing_byHID: { [hid: number]: Thing } = {};
	private trait_byHID: { [hid: number]: Trait } = {};
	private user_byHID: { [hid: number]: User } = {};
	private things: Array<Thing> = [];
	private traits: Array<Trait> = [];
	relationships: Array<Relationship> = [];
	predicates: Array<Predicate> = [];
	rootsAncestry!: Ancestry;
	rootAncestry!: Ancestry;
	isAssembled = false;
	db: DBInterface;
	grabs: Grabs;
	root!: Thing;

	get hasNothing(): boolean { return !this.root; }
	get idRoot(): string | null { return this.root?.id ?? null; };
	ancestries_rebuildAll() { this.root?.oneAncestries_rebuildForSubtree(); }

	static readonly $_INIT_$: unique symbol;

	constructor(db: DBInterface) {
		this.grabs = new Grabs();
		this.db = db;
		signals.handle_rebuildGraph(0, (ancestry) => {
			ancestry.thing?.oneAncestries_rebuildForSubtree();
		});
	}

	rootAncestry_setup() {
		const ancestry = this.ancestry_remember_createUnique();
		if (!!ancestry) {
			this.rootAncestry = ancestry;
			const root = ancestry.thing;
			if (!this.root && !!root) {
				this.root = root;
			}
		}
	}

	static readonly $_EVENTS_$: unique symbol;

	async handle_tool_clicked(idControl: string, mouse_state: Mouse_State) {
		const event: MouseEvent | null = mouse_state.event as MouseEvent;
        const ancestry = get(s_ancestry_showing_tools);
		if (!!ancestry) {
			switch (idControl) {
				case IDTool.more: debug.log_tools('needs more'); break;
				case IDTool.create: await this.ancestry_edit_remoteCreateChildOf(ancestry); break;
				case IDTool.next: this.ancestry_relayout_toolCluster_nextParent(event?.altKey ?? false); return;
				case IDTool.add_parent: this.toggleAlteration(AlterationType.adding, mouse_state.isLong); return;
				case IDTool.delete_confirm: await this.ancestries_rebuild_traverse_remoteDelete([ancestry]); break;
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
							case 'd':		await this.thing_edit_remoteDuplicate(ancestryGrab); break;
							case k.space:	await this.ancestry_edit_remoteCreateChildOf(ancestryGrab); break;
							case '-':		if (!COMMAND) { await this.thing_edit_remoteAddLine(ancestryGrab); } break;
							case 'tab':		await this.ancestry_edit_remoteCreateChildOf(ancestryGrab.parentAncestry); break; // Title_State editor also makes this call
							case 'enter':	ancestryGrab.startEdit(); break;
						}
					}
					switch (key) {
						case 'delete':
						case 'backspace':	await this.ancestries_rebuild_traverse_remoteDelete(get(s_grabbed_ancestries)); s_grabbed_ancestries.set([]); break;
					}
				}
				if (!!ancestryGrab) {
					switch (key) {
						case '/':			graph_needsRebuild = ancestryGrab.becomeFocus(); break;
						case 'arrowright':	event.preventDefault(); await this.ancestry_rebuild_remoteMoveRight(ancestryGrab,  ancestryGrab.isParental, SHIFT, OPTION, EXTREME); break;
						case 'arrowleft':	event.preventDefault(); await this.ancestry_rebuild_remoteMoveRight(ancestryGrab, !ancestryGrab.isParental, SHIFT, OPTION, EXTREME); break;
					}
				}
				switch (key) {
					case '!':				graph_needsRebuild = this.rootAncestry?.becomeFocus(); break;
					case '`':               event.preventDefault(); this.latestAncestryGrabbed_toggleEditing_Tools(); break;
					case 'arrowup':			await this.latestAncestryGrabbed_rebuild_remoteMoveUp_maybe(true, SHIFT, OPTION, EXTREME); break;
					case 'arrowdown':		await this.latestAncestryGrabbed_rebuild_remoteMoveUp_maybe(false, SHIFT, OPTION, EXTREME); break;
					case 'escape':			if (!!get(s_ancestry_showing_tools)) { this.clear_editingTools(); }
				}
				if (graph_needsRebuild) {
					signals.signal_rebuildGraph_fromFocus();
				}
				const duration = ((new Date().getTime()) - time).toFixed(1);
				debug.log_key(`H  (${duration}) ${key}`);
				setTimeout(() => {
					this.deferredWriteAll();
				}, 1);
			}
		}
	}

	async deferredWriteAllData(array: Array<RemoteIdentifiable>) {
		array.forEach(async (identifiable) => {
			if (identifiable.needsWrite) {
				identifiable.needsWrite = false;
				await identifiable.remoteWrite();
			}
		});
	}

	async deferredWriteAll() {
		await this.deferredWriteAllData(this.things);
		await this.deferredWriteAllData(this.traits);
		await this.deferredWriteAllData(this.relationships);
	}

	clear_editingTools() {
		s_alteration_mode.set(null);
		s_ancestry_showing_tools.set(null);
	}

	static readonly $_GRABS_$: unique symbol;

	async latestAncestryGrabbed_rebuild_remoteMoveUp_maybe(up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean) {
		const ancestry = this.grabs.latestAncestryGrabbed(up);
		if (!!ancestry) {
			this.ancestry_rebuild_remoteMoveUp_maybe(ancestry, up, SHIFT, OPTION, EXTREME);
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
		if (!!hid) {
			const relationship = this.relationship_forHID(hid);
			if (!!relationship) {
				return this.thing_forHID(relationship.idChild.hash());
			}
		}
		return this.root;
	}
	
	static readonly $_THINGS_$: unique symbol;

	things_forAncestry(ancestry: Ancestry): Array<Thing> {
		const isContains = ancestry.idPredicate == Predicate.idContains;
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

	things_forAncestries(ancestries: Array<Ancestry>): Array<Thing> {
		const things = Array<Thing>();
		for (const ancestry of ancestries) {
			const thing = this.thing_forAncestry(ancestry);
			if (!!!!thing) {
				things.push(thing);
			}
		}
		return things;
	}

	things_forgetAll() {
		this.things = []; // clear
		this.thing_byHID = {};
		this.things_byType = {};
	}

	static readonly $_THING_$: unique symbol;

	thing_forAncestry(ancestry: Ancestry | null): Thing | null { return ancestry?.thing ?? null; }
	thing_forHID(hid: number | null): Thing | null { return !hid ? null : this.thing_byHID[hid]; }

	thing_forget(thing: Thing) {
		delete this.thing_byHID[thing.idHashed];
		this.things = u.strip_invalid(this.things);
		this.things_byType[thing.type] = u.strip_invalid(this.things_byType[thing.type]);
	}

	thing_remember_runtimeCreateUnique(baseID: string, id: string, title: string, color: string, type: string,
		hasBeen_remotely_saved: boolean = false): Thing {
		let thing = this.thing_forHID(id?.hash() ?? null);
		if (!thing) {
			thing = this.thing_remember_runtimeCreate(baseID, id, title, color, type, hasBeen_remotely_saved);
		}
		return thing;
	}

	async thing_remember_remoteRelocateChild(child: Thing, fromParent: Thing, toParent: Thing): Promise<any> {
		let relationship = this.relationship_whereID_isChild(child.id);
		if (!!relationship && relationship.idParent == fromParent.id) {
			this.relationship_forget(relationship);
			relationship.idParent = toParent.id;
			this.relationship_remember(relationship);
			relationship.remoteWrite();
		}
	}

	async thing_edit_remoteAddLine(ancestry: Ancestry, below: boolean = true) {
		const parentAncestry = ancestry.parentAncestry;
		const parent = parentAncestry?.thing;
		const thing = ancestry.thing;
		if (!!thing && parent && parentAncestry) {
			const order = ancestry.order + (below ? 0.5 : -0.5);
			const child = this.thing_runtimeCreate(thing.baseID, Identifiable.newID(), k.title_line, parent.color, k.empty);
			await this.ancestry_edit_remoteAddAsChild(parentAncestry, child, order, false);
		}
	}

	thing_remember_runtimeCreate(baseID: string, id: string, title: string, color: string, type: string,
		hasBeen_remotely_saved: boolean = false, needs_upgrade: boolean = false): Thing {
		const thing = this.thing_runtimeCreate(baseID, id, title, color, type, hasBeen_remotely_saved);
		this.thing_remember(thing);
		if (needs_upgrade) {
			thing.needsWrite = true;	// add type and remove trait fields
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

	async thing_edit_remoteDuplicate(ancestry: Ancestry) {
		const thing = ancestry.thing;
		const id = thing?.id;
		const parentAncestry = ancestry.parentAncestry;
		if (!!thing && id && parentAncestry) {
			const sibling = await this.thing_remember_runtimeCopy(id, thing);
			sibling.title = 'idea';
			await this.ancestry_edit_remoteAddAsChild(parentAncestry, sibling, ancestry.order + 0.5);
		}
	}

	thing_remember(thing: Thing) {
		if (!this.thing_forHID(thing.idHashed)) {
			this.thing_byHID[thing.idHashed] = thing;
			let things = this.things_byType[thing.type] ?? [];
			things.push(thing);
			this.things_byType[thing.type] = things;
			this.things.push(thing);
			if (thing.type == ThingType.root && (thing.baseID == k.empty || thing.baseID == this.db.baseID)) {
				this.root = thing;
			}
		}
	}

	thing_runtimeCreate(baseID: string, id: string, title: string, color: string, type: string,
		hasBeen_remotely_saved: boolean = false): Thing {
		let thing: Thing | null = null;
		if (id && type == ThingType.root && baseID != this.db.baseID) {		// other bulks have their own root & id
			thing = this.thing_remember_bulkRootID(baseID, id, color);		// which our thing needs to adopt
		} else {
			thing = new Thing(baseID, id, title, color, type, hasBeen_remotely_saved);
			if (thing.isBulkAlias) {
				thing.needsBulkFetch = true;
				if (title.includes('@')) {
					const dual = title.split('@');
					thing.title = dual[0];
					thing.bulkRootID = dual[1];
				}
			}
		}
		return thing!;
	}

	async thing_forget_remoteDelete(thing: Thing) {
		const relationships = u.uniquely_concatenateArrays(
			this.relationships_byChildHID[thing.idHashed] ?? [],
			this.relationships_byParentHID[thing.idHashed] ?? []
		)
		this.thing_forget(thing);				// forget so onSnapshot logic will not signal children, do first so UX updates quickly
		await this.db.thing_remoteDelete(thing);
		for (const ancestry of thing.ancestries) {
			this.ancestry_forget(ancestry);
		}
		for (const trait of thing.traits) {
			this.trait_forget(trait)
			await this.db.trait_remoteDelete(trait);
		}
		for (const relationship of relationships) {
			this.relationship_forget(relationship);		// forget so onSnapshot logic will not signal children
			await this.db.relationship_remoteDelete(relationship);
		}
	}

	static readonly $_TRAITS_$: unique symbol;

	traits_forOwnerHID(hid: number | null): Array<Trait> | null {
		const value = !!hid ? this.traits_byOwnerHID?.[hid] : null;
		return (value instanceof Array) ? value : null;
	}

	traits_refreshKnowns() {
		const saved = this.traits;
		this.traits_clearKnowns();
		saved.map(r => this.trait_remember(r));
	}

	traits_clearKnowns() {
		this.traits_byOwnerHID = {};
		this.traits_byType = {};
		this.trait_byHID = {};
		this.traits = [];
	}

	static readonly $_TRAIT_$: unique symbol;

	trait_forHID(hid: number | null): Trait | null { return !hid ? null : this.trait_byHID[hid]; }

	trait_runtimeCreate(baseID: string, id: string, ownerID: string, type: TraitType, text: string, hasBeen_remotely_saved: boolean = false): Trait {
		return new Trait(baseID, id, ownerID, type, text, hasBeen_remotely_saved);
	}

	trait_remember_runtimeCreateUnique(baseID: string, id: string, ownerID: string, type: TraitType, text: string, hasBeen_remotely_saved: boolean = false): Trait {
		return this.trait_forHID(id?.hash()) ?? this.trait_remember_runtimeCreate(baseID, id, ownerID, type, text, hasBeen_remotely_saved);
	}

	trait_forType_ownerHID(type: TraitType | null, ownerHID: number | null): Trait| null {
		const traits = this.traits_forOwnerHID(ownerHID)?.filter(t => t.type == type);
		return !traits ? null : traits[0]
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
		hasBeen_remotely_saved: boolean = false): Trait {
		const trait = this.trait_runtimeCreate(baseID, id, ownerID, type, text, hasBeen_remotely_saved);
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
		trait.needsWrite = true;
	}

	static readonly $_BULKS_$: unique symbol;

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

	async thing_remember_bulk_recursive_remoteRelocateRight(ancestry: Ancestry, newParentAncestry: Ancestry) {
		const newParent = newParentAncestry.thing;
		let newThingAncestry: Ancestry | null = null;
		const thing = ancestry.thing;
		if (!!thing && newParent) {
			const baseID = newParent.isBulkAlias ? newParent.title : newParent.baseID;
			const newThing = await this.thing_remember_runtimeCopy(baseID, thing);
			newThingAncestry = newParentAncestry.extend_withChild(newThing);
			if (!!newThingAncestry) {
				await this.ancestry_remember_remoteAddAsChild(newParentAncestry, newThing);
				for (const childAncestry of ancestry.childAncestries) {
					this.thing_remember_bulk_recursive_remoteRelocateRight(childAncestry, newThingAncestry);
				}
				if (!newThingAncestry.isExpanded) {
					setTimeout(() => {
						if (!!newThingAncestry) {
							newThingAncestry.expand();	
							ancestry.collapse()
						};
					}, 2);
				}
				await this.ancestry_forget_remoteUpdate(ancestry);
			}
		}
		return newThingAncestry;
	}

	static readonly $_RELATIONSHIPS_$: unique symbol;

	relationships_refreshKnowns() {
		const saved = this.relationships;
		this.relationships_clearKnowns();
		saved.map(r => this.relationship_remember(r));
	}

	relationships_clearKnowns() {
		this.relationships_byPredicateHID = {};
		this.relationships_byParentHID = {};
		this.relationships_byChildHID = {};
		this.relationship_byHID = {};
		this.relationships = [];
	}

	relationships_forPredicateThingIsChild(idPredicate: string, idThing: string, isChildOf: boolean): Array<Relationship> {
		const dict = isChildOf ? this.relationships_byChildHID : this.relationships_byParentHID;
		const hid = idThing.hash();
		const matches = dict[hid] as Array<Relationship>; // filter out bad values (dunno what this does)
		const array: Array<Relationship> = [];
		if (Array.isArray(matches)) {
			for (const relationship of matches) {
				if (relationship.idPredicate == idPredicate) {
					array.push(relationship);
				}
			}
		}
		return array;
	}

	relationship_forPredicate_parent_child(idPredicate: string, idParent: string, idChild: string): Relationship | null {
		const matches = this.relationships_forPredicateThingIsChild(idPredicate, idParent, false);
		if (Array.isArray(matches)) {
			for (const relationship of matches) {
				if (relationship.idChild == idChild) {
					return relationship;
				}
			}
		}
		return null;
	}

	async relationships_remoteCreateMissing(baseID: string) {
		const idRoot = this.idRoot;
		if (!!idRoot || idRoot == k.empty){
			for (const thing of this.things) {
				const idThing = thing.id;
				if (thing.type != ThingType.root && thing.baseID == baseID) {
					let relationship = this.relationship_whereID_isChild(idThing);
					if (!relationship) {
						const idPredicateContains = Predicate.idContains;
						await this.relationship_remember_remoteCreateUnique(baseID, Identifiable.newID(), idPredicateContains,
							idRoot, idThing, 0, CreationOptions.getRemoteID)
					}
				}
			}
		}
	}

	async relationships_removeHavingNullReferences() {
		const array = Array<Relationship>();
		for (const relationship of this.relationships) {
			const thingTo = relationship.child;
			const thingFrom = relationship.parent;
			if (!thingTo || !thingFrom) {
				array.push(relationship);
				await this.db.relationship_remoteDelete(relationship);
			}
		}
		while (array.length > 0) {
			const relationship = array.pop();
			if (!!relationship) {
				this.relationship_forget(relationship);
			}
		}
	}

	static readonly $_RELATIONSHIP_$: unique symbol;

	relationship_forHID(hid: number): Relationship | null { return this.relationship_byHID[hid]; }
	relationships_forPredicateHID(hid: number): Array<Relationship> { return this.relationships_byPredicateHID[hid] ?? []; }

	relationship_rememberByKnown(relationships: Relationships_ByHID, relationship: Relationship, id: string) {
		if (!!id) {
			const hid = id.hash();
			let array = relationships[hid] ?? [];
			array.push(relationship);
			if (!relationship.child) {
				console.log('missing CHILD thing');
			}
			relationships[hid] = array;
		}
	}
	
	relationship_remember(relationship: Relationship) {
		if (!this.relationship_byHID[relationship.idHashed]) {
			if (relationship.baseID != this.db.baseID) {
				debug.log_error(`RELATIONSHIP off base: ${relationship.baseID} ${relationship.parent?.description} => ${relationship.child?.description}`);
			}
			this.relationships.push(relationship);
			this.relationship_byHID[relationship.idHashed] = relationship;
			this.relationship_rememberByKnown(this.relationships_byChildHID, relationship, relationship.idChild);
			this.relationship_rememberByKnown(this.relationships_byParentHID, relationship, relationship.idParent);
			this.relationship_rememberByKnown(this.relationships_byPredicateHID, relationship, relationship.idPredicate);
		}
	}

	async relationship_forget_remoteDelete(ancestry: Ancestry, otherAncestry: Ancestry, idPredicate: string) {
		const thing = ancestry.thing;
		const parentAncestry = ancestry.parentAncestry;
		const relationship = this.relationship_forPredicate_parent_child(idPredicate, otherAncestry.idThing, ancestry.idThing);
		if (!!parentAncestry && !!relationship && (thing?.hasParents ?? false)) {
			this.relationship_forget(relationship);
			if (otherAncestry.hasChildRelationships) {
				parentAncestry.order_normalizeRecursive_remoteMaybe(true);
			} else {
				otherAncestry.collapse();
			}
			await this.db.relationship_remoteDelete(relationship);
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
		this.relationship_forget_forHID(this.relationships_byPredicateHID, relationship.idPredicate.hash(), relationship);
	}

	relationship_whereID_isChild(idThing: string, isChild: boolean = true) {
		const idPredicateContains = Predicate.idContains;
		const matches = this.relationships_forPredicateThingIsChild(idPredicateContains, idThing, isChild);
		if (matches.length > 0) {
			const relationship = matches[0];
			return relationship;
		}
		return null;
	} 

	relationship_remember_runtimeCreateUnique(baseID: string, idRelationship: string, idPredicate: string, idParent: string, idChild: string,
		order: number, creationOptions: CreationOptions = CreationOptions.none) {
		let reversedRelationship = this.relationship_forPredicate_parent_child(idPredicate, idChild, idParent);
		let relationship = this.relationship_forPredicate_parent_child(idPredicate, idParent, idChild);
		const isBidirectional = this.predicate_forID(idPredicate)?.isBidirectional ?? false;
		const hasBeen_remotely_saved = creationOptions != CreationOptions.none;
		if (!relationship) {
			relationship = new Relationship(baseID, idRelationship, idPredicate, idParent, idChild, order, hasBeen_remotely_saved);
			this.relationship_remember(relationship);
		}
		if (isBidirectional && !reversedRelationship) {
			reversedRelationship = new Relationship(baseID, Identifiable.newID(), idPredicate, idChild, idParent, order, hasBeen_remotely_saved);
			this.relationship_remember(reversedRelationship);
		}
		relationship?.order_setTo_remoteMaybe(order);
		reversedRelationship?.order_setTo_remoteMaybe(order);
		return relationship;
	}

	async relationship_remember_remoteCreateUnique(baseID: string, idRelationship: string, idPredicate: string, idParent: string, idChild: string,
		order: number, creationOptions: CreationOptions = CreationOptions.isFromRemote): Promise<any> {
		let relationship = this.relationship_forPredicate_parent_child(idPredicate, idParent, idChild);
		if (!!relationship) {
			relationship.order_setTo_remoteMaybe(order, true);
		} else {
			relationship = new Relationship(baseID, idRelationship, idPredicate, idParent, idChild, order, creationOptions != CreationOptions.none);
			await this.db.relationship_remember_remoteCreate(relationship);
			this.relationship_remember(relationship);
		}
		return relationship;
	}

	static readonly $_ANCESTRIES_$: unique symbol;

	async ancestries_rebuild_traverse_remoteDelete(ancestries: Array<Ancestry>) {
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
							await this.ancestry_forget_remoteUpdate(progenyAncestry);
							return false; // continue the traversal
						});
					}
				}
			}
			signals.signal_rebuildGraph_fromFocus();
		}
	}

	static readonly $_ANCESTRY_$: unique symbol;

	ancestry_forHID(idHashed: number): Ancestry | null {
		return this.ancestry_byHID[idHashed] ?? null;
	}

	async ancestry_forget_remoteUpdate(ancestry: Ancestry) {
		const thing = ancestry.thing;
		ancestry.childAncestries.map(c => this.ancestry_forget_remoteUpdate(c));
		this.ancestry_forget(ancestry);
		if (!!thing) {
			await this.thing_forget_remoteDelete(thing);
		}
	}

	ancestry_forget(ancestry: Ancestry | null) {
		if (!!ancestry) {
			const idHashed = ancestry.idHashed;
			let dict = this.ancestry_byKind_andHash[ancestry.idPredicate] ?? {};
			delete this.ancestry_byHID[idHashed];
			delete dict[idHashed];
			this.ancestry_byKind_andHash[ancestry.idPredicate] = dict;
		}
	}

	async ancestry_edit_remoteCreateChildOf(parentAncestry: Ancestry | null) {
		const thing = parentAncestry?.thing;
		if (!!thing && !!parentAncestry) {
			const child = await this.thing_remember_runtimeCopy(thing.baseID, thing);
			child.title = 'idea';
			parentAncestry.expand();
			await this.ancestry_edit_remoteAddAsChild(parentAncestry, child, 0);
		}
	}

	async ancestry_edit_remoteAddAsChild(parentAncestry: Ancestry, child: Thing, order: number, shouldStartEdit: boolean = true) {
		const childAncestry = await this.ancestry_remember_remoteAddAsChild(parentAncestry, child);
		childAncestry.grabOnly();
		childAncestry.relationship?.order_setTo_remoteMaybe(order);
		signals.signal_rebuildGraph_fromFocus();
		if (shouldStartEdit) {
			setTimeout(() => {
				childAncestry.startEdit();
			}, 20);
		}
	}

	async ancestry_remember_bulk_remoteRelocateRight(ancestry: Ancestry, newParentAncestry: Ancestry) {
		const newThingAncestry = await this.thing_remember_bulk_recursive_remoteRelocateRight(ancestry, newParentAncestry);
		if (!!newThingAncestry) {
			newParentAncestry.signal_relayoutWidgets();
			if (newParentAncestry.isExpanded) {
				newThingAncestry.grabOnly();
			} else {
				newParentAncestry.grabOnly();
			}
		}
	}

	ancestry_remember_createUnique(id: string = k.empty, idPredicate: string = Predicate.idContains): Ancestry {
		const idHashed = id.hash();
		let dict = this.ancestry_byKind_andHash[idPredicate] ?? {};
		let ancestry = dict[idHashed];
		if (!ancestry) {
			ancestry = new Ancestry(id, idPredicate);
			this.ancestry_byHID[idHashed] = ancestry;
			dict[idHashed] = ancestry;
			this.ancestry_byKind_andHash[idPredicate] = dict;
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
			await this.ancestry_remember_remoteAddAsChild(rootAncestry, roots).then((ancestry) => { rootsAncestry = ancestry; });
		}
		return rootsAncestry;
	}

	async ancestry_redraw_remoteFetchBulk_browseRight(thing: Thing, ancestry: Ancestry | null = null, grab: boolean = false) {
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
			// } while (!ancestry.matchesAncestry(toolsAncestry));
			ancestry.grabOnly();
			signals.signal_relayoutWidgets_fromFocus();
			s_ancestry_showing_tools.set(ancestry);
		}
	}

	async ancestry_remember_remoteAddAsChild(parentAncestry: Ancestry, child: Thing, idPredicate: string = Predicate.idContains): Promise<any> {
		const parent = parentAncestry.thing;
		if (!!parent && !child.isBulkAlias) {
			const changingBulk = parent.isBulkAlias || child.baseID != this.db.baseID;
			const baseID = changingBulk ? child.baseID : parent.baseID;
			if (changingBulk) {
				console.log('changingBulk');
			}
			if (!child.hasBeen_remotely_saved) {
				await this.db.thing_remember_remoteCreate(child);					// for everything below, need to await child.id fetched from dbDispatch
			}
			const relationship = await this.relationship_remember_remoteCreateUnique(baseID, Identifiable.newID(), idPredicate, parent.idBridging, child.id, 0, CreationOptions.getRemoteID);
			const childAncestry = parentAncestry.uniquelyAppendID(relationship.id);
			await u.ancestries_orders_normalize_remoteMaybe(parentAncestry.childAncestries);		// write new order values for relationships
			return childAncestry;
		}
	}

	async ancestry_rebuild_remoteMoveRight(ancestry: Ancestry, RIGHT: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean, fromReveal: boolean = false) {
		if (!OPTION) {
			const thing = ancestry.thing;
			if (!!thing) {
				if (RIGHT && thing.needsBulkFetch) {
					await this.ancestry_redraw_remoteFetchBulk_browseRight(thing, ancestry, true);
				} else {
					this.ancestry_rebuild_runtimeBrowseRight(ancestry, RIGHT, SHIFT, EXTREME, fromReveal);
				}
			}
		} else if (g.allow_GraphEditing) {
			const grab = this.grabs.latestAncestryGrabbed(true);
			if (!!grab) {
				await this.ancestry_rebuild_remoteRelocateRight(grab, RIGHT, EXTREME);
			}
		}
	}

	async ancestry_rebuild_remoteMoveUp_maybe(ancestry: Ancestry, up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean) {
		const parentAncestry = ancestry.parentAncestry;
		if (!!parentAncestry) {
			let graph_needsRebuild = false;
			const siblings = parentAncestry.children;
			const length = siblings.length;
			const thing = this.thing_forAncestry(ancestry);
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
						await u.ancestries_orders_normalize_remoteMaybe(parentAncestry.childAncestries, false);
						const wrapped = up ? (index == 0) : (index + 1 == length);
						const goose = ((wrapped == up) ? 1 : -1) * k.halfIncrement;
						const newOrder = newIndex + goose;
						ancestry.relationship?.order_setTo_remoteMaybe(newOrder);
						await u.ancestries_orders_normalize_remoteMaybe(parentAncestry.childAncestries);
					}
				}
				if (graph_needsRebuild) {
					signals.signal_rebuildGraph_fromFocus();
				}
			}
		}
	}

	async ancestry_rebuild_remoteRelocateRight(ancestry: Ancestry, RIGHT: boolean, EXTREME: boolean) {
		const thing = ancestry.thing;
		const newParentAncestry = RIGHT ? ancestry.ancestry_ofNextSibling(false) : ancestry.stripBack(2);
		const newParent = newParentAncestry?.thing;
		if (!!thing && newParent && newParentAncestry) {
			if (thing.isInDifferentBulkThan(newParent)) {		// should move across bulks
				this.ancestry_remember_bulk_remoteRelocateRight(ancestry, newParentAncestry);
			} else {
				const relationship = ancestry.relationship;
				if (!!relationship) {
					const order = RIGHT ? relationship.order : 0;
					relationship.idParent = newParent.id;
					await relationship.order_setTo_remoteMaybe(order + 0.5, true);
				}
				this.relationships_refreshKnowns();
				newParentAncestry.extend_withChild(thing)?.grabOnly();
				this.rootAncestry.order_normalizeRecursive_remoteMaybe(true);
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
			if (ancestry.hasChildRelationships) {
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
					} else if (newGrabAncestry.isExpanded || (!!rootAncestry && !rootAncestry.matchesAncestry(newGrabAncestry))) {
						graph_needsRebuild = newGrabAncestry.collapse();
					}
				}
			}
		}
		s_edit_state.set(null);
		if (!!newGrabAncestry) {
			newGrabAncestry.grabOnly();
			if (!RIGHT && !!newFocusAncestry) {
				const newFocusIsGrabbed = newFocusAncestry && newFocusAncestry.matchesAncestry(newGrabAncestry);
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

	static readonly $_ANCILLARY_$: unique symbol;

	predicate_forKind(kind: string | null): Predicate | null { return !kind ? null : this.predicate_byKind[kind]; }
	predicates_byDirection(isBidirectional: boolean) { return this.predicate_byDirection[isBidirectional ? 1 : 0]; }
	predicate_forID(idPredicate: string): Predicate | null { return !idPredicate ? null : this.predicate_byHID[idPredicate.hash()]; }

	idPredicate_for(id: string): string {
		const hid = id.split(k.generic_separator)[0].hash();			// grab first relationship's hid
		const relationship = this.relationship_forHID(hid);			// locate corresponding relationship
		return relationship?.idPredicate ?? '';						// grab its predicate id
	}

	predicate_remember(predicate: Predicate) {
		this.predicate_byHID[predicate.idHashed] = predicate;
		this.predicate_byKind[predicate.kind] = predicate;
		this.predicates.push(predicate);
		let predicates = this.predicates_byDirection(predicate.isBidirectional) ?? [];
		if (!predicates.includes(predicate)) {
			predicates.push(predicate);
			this.predicate_byDirection[predicate.isBidirectional ? 1 : 0] = predicates;
		}
	}

	predicate_remember_runtimeCreateUnique(id: string, kind: string, isBidirectional: boolean, hasBeen_remotely_saved: boolean = true) {
		if (!this.predicate_forID(id)) {
			this.predicate_remember_runtimeCreate(id, kind, isBidirectional, hasBeen_remotely_saved);
		}
	}

	predicate_remember_runtimeCreate(id: string, kind: string, isBidirectional: boolean, hasBeen_remotely_saved: boolean = true) {
		this.predicate_remember(new Predicate(id, kind, isBidirectional, hasBeen_remotely_saved));
	}

	access_runtimeCreate(idAccess: string, kind: string) {
		const access = new Access(this.db.dbType, idAccess, kind);
		this.access_byHID[idAccess.hash()] = access;
		this.access_byKind[kind] = access;
	}

	user_runtimeCreate(id: string, name: string, email: string, phone: string) {
		const user = new User(this.db.dbType, id, name, email, phone);
		this.user_byHID[id.hash()] = user;
	}

	static readonly $_OTHER_$: unique symbol;

	conclude_fetch() {
		this.deferredWriteAll();
		this.isAssembled = true;
	}

	async add_missing_removeNulls(baseID: string) {
		await this.relationships_remoteCreateMissing(baseID);
		await this.relationships_removeHavingNullReferences();
	}

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
