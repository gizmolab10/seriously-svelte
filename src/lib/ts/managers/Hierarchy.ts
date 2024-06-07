import { k, u, get, User, Thing, Grabs, debug, MouseState, Access, IDTool, IDTrait, signals, Ancestry } from '../common/GlobalImports';
import { Predicate, SvelteWrapper, Relationship, CreationOptions, AlterationType, AlterationState } from '../common/GlobalImports';
import { s_ancestries_grabbed, s_things_arrived, s_ancestry_editingTools } from '../state/ReactiveState';
import { s_isBusy, s_altering, s_ancestry_focus, s_title_editing } from '../state/ReactiveState';
import { idDefault } from "../data/Identifiable";
import DBInterface from '../db/DBInterface';

type Relationships_ByHID = { [hid: number]: Array<Relationship> }

export class Hierarchy {
	private wrappers_byType_andHID: { [type: string]: { [hid: number]: SvelteWrapper } } = {};
	private ancestry_byKind_andHash:{ [kind: string]: { [hash: number]: Ancestry } } = {};
	private relationship_byHID: { [hid: number]: Relationship } = {};
	private things_byTrait: { [trait: string]: Array<Thing> } = {};
	private relationships_byPredicateHID: Relationships_ByHID = {};
	private predicate_byKind: { [kind: string]: Predicate } = {};
	private relationships_byParentHID: Relationships_ByHID = {};
	private relationships_byChildHID: Relationships_ByHID = {};
	private predicate_byHID: { [hid: number]: Predicate } = {};
	private access_byKind: { [kind: string]: Access } = {};
	private access_byHID: { [hid: number]: Access } = {};
	private thing_byHID: { [hid: number]: Thing } = {};
	private user_byHID: { [hid: number]: User } = {};
	private things: Array<Thing> = [];
	relationships: Array<Relationship> = [];
	predicates: Array<Predicate> = [];
	isAssembled = false;
	rootsAncestry!: Ancestry;
	rootAncestry!: Ancestry;
	db: DBInterface;
	grabs: Grabs;
	root!: Thing;

	get hasNothing(): boolean { return !this.root; }
	get idRoot(): string | null { return this.root?.id ?? null; };
	ancestries_rebuildAll() { this.root.oneAncestries_rebuildForSubtree(); }
	thing_forAncestry(ancestry: Ancestry | null): Thing | null { return ancestry?.thing ?? null; }
	thing_forHID(hid: number | null): Thing | null { return (!hid) ? null : this.thing_byHID[hid]; }

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
		}
	}

	static readonly $_EVENTS_$: unique symbol;

	async handle_tool_clicked(idButton: string, mouseState: MouseState) {
		const event: MouseEvent | null = mouseState.event as MouseEvent;
        const ancestry = get(s_ancestry_editingTools);
		if (!!ancestry && !mouseState.isUp) {
			switch (idButton) {
				case IDTool.more: console.log('needs more'); break;
				case IDTool.create: await this.ancestry_edit_remoteCreateChildOf(ancestry); break;
				case IDTool.next: this.ancestry_relayout_toolCluster_nextParent(event.altKey); return;
				case IDTool.add_parent: this.toggleAlteration(AlterationType.adding, mouseState.isLong); return;
				case IDTool.delete_confirm: await this.ancestries_rebuild_traverse_remoteDelete([ancestry]); break;
				case IDTool.delete_parent: this.toggleAlteration(AlterationType.deleting, mouseState.isLong); return;
				default: break;
			}
			s_ancestry_editingTools.set(null);
			signals.signal_relayoutWidgets_fromFocus();
		}
	}

	async handle_key_down(event: KeyboardEvent) {
		let ancestryGrab = this.grabs.latestAncestryGrabbed(true);
		if (event.type == 'keydown') {
			const OPTION = event.altKey;
			const SHIFT = event.shiftKey;
			const COMMAND = event.metaKey;
			const rootAncestry = this.rootAncestry;
			const EXTREME = SHIFT && OPTION;
			const key = event.key.toLowerCase();
			const modifiers = ['alt', 'meta', 'shift', 'control']
			let needsRebuild = false;
			if (!modifiers.includes(key)) {		// ignore modifier-key-only events
				if (!ancestryGrab) {
					ancestryGrab = rootAncestry;
					needsRebuild = rootAncestry.becomeFocus();
				}
				if (k.allow_GraphEditing) {
					if (!!ancestryGrab && k.allow_TitleEditing) {
						switch (key) {
							case 'd':		await this.thing_edit_remoteDuplicate(ancestryGrab); break;
							case k.space:	await this.ancestry_edit_remoteCreateChildOf(ancestryGrab); break;
							case '-':		if (!COMMAND) { await this.thing_edit_remoteAddLine(ancestryGrab); } break;
							case 'tab':		await this.ancestry_edit_remoteCreateChildOf(ancestryGrab.parentAncestry); break; // TitleState editor also makes this call
							case 'enter':	ancestryGrab.startEdit(); break;
						}
					}
					switch (key) {
						case 'delete':
						case 'backspace':	await this.ancestries_rebuild_traverse_remoteDelete(get(s_ancestries_grabbed)); break;
					}
				}
				if (!!ancestryGrab) {
					switch (key) {
						case '/':			needsRebuild = ancestryGrab.becomeFocus(); break;
						case 'arrowright':	event.preventDefault(); await this.ancestry_rebuild_remoteMoveRight(ancestryGrab, true, SHIFT, OPTION, EXTREME); break;
						case 'arrowleft':	event.preventDefault(); await this.ancestry_rebuild_remoteMoveRight(ancestryGrab, false, SHIFT, OPTION, EXTREME); break;
					}
				}
				switch (key) {
					case '!':				needsRebuild = this.rootAncestry?.becomeFocus(); break;
					case '`':               event.preventDefault(); this.latestAncestryGrabbed_toggleEditingTools(); break;
					case 'arrowup':			await this.latestAncestryGrabbed_rebuild_remoteMoveUp(true, SHIFT, OPTION, EXTREME); break;
					case 'arrowdown':		await this.latestAncestryGrabbed_rebuild_remoteMoveUp(false, SHIFT, OPTION, EXTREME); break;
				}
				if (needsRebuild) {
					signals.signal_rebuildGraph_fromFocus();
				}
			}
		}
	}

	static readonly $_GRABS_$: unique symbol;

	async latestAncestryGrabbed_rebuild_remoteMoveUp(up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean) {
		const ancestry = this.grabs.latestAncestryGrabbed(up);
		if (!!ancestry) {
			this.ancestry_rebuild_remoteMoveUp(ancestry, up, SHIFT, OPTION, EXTREME);
		}
	}

	latestAncestryGrabbed_toggleEditingTools(up: boolean = true) {
		const ancestry = this.grabs.latestAncestryGrabbed(up);
		if (!!ancestry && !ancestry.isRoot) {
			s_ancestry_editingTools.set(ancestry.toolsGrabbed ? null : ancestry);
			signals.signal_rebuildGraph_fromFocus();
		}
	}

	thing_child_forRelationshipHID(hid: number | null): Thing | null {
		if (hid) {
			const relationship = this.relationship_forHID(hid);
			if (relationship) {
				return this.thing_byHID[relationship.idChild.hash()];
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
				if (relationship) {
					if (things.length == 0) {
						if (!isContains) {
							things.push(relationship.parent);
						}
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
			if (!!thing) {
				things.push(thing);
			}
		}
		return things;
	}

	things_forgetAll() {
		this.things = []; // clear
		this.thing_byHID = {};
		this.things_byTrait = {};
	}

	static readonly $_THING_$: unique symbol;

	async thing_remember_remoteRelocateChild(child: Thing, fromParent: Thing, toParent: Thing): Promise<any> {
		let relationship = this.relationship_whereID_isChild(child.id);
		if (relationship && relationship.idParent == fromParent.id) {
			this.relationship_forget(relationship);
			relationship.idParent = toParent.id;
			this.relationship_remember(relationship);
			relationship.remoteWrite();
		}
	}

	thing_forget(thing: Thing) {
		delete this.thing_byHID[thing.idHashed];
		this.things = u.strip_invalid(this.things);
		this.things_byTrait[thing.trait] = u.strip_invalid(this.things_byTrait[thing.trait]);
	}

	async thing_edit_remoteAddLine(ancestry: Ancestry, below: boolean = true) {
		const parentAncestry = ancestry.parentAncestry;
		const parent = parentAncestry?.thing;
		const thing = ancestry.thing;
		if (!!thing && parent && parentAncestry) {
			const order = ancestry.order + (below ? 0.5 : -0.5);
			const child = this.thing_runtimeCreate(thing.baseID, idDefault, k.title_line, parent.color, k.empty, false);
			await this.ancestry_edit_remoteAddAsChild(parentAncestry, child, order, false);
		}
	}

	thing_remember_runtimeCreateUnique(baseID: string, id: string = idDefault, title: string, color: string, trait: string,
		isRemotelyStored: boolean): Thing {
		let thing = this.thing_forHID(id?.hash() ?? null);
		if (!thing) {
			thing = this.thing_remember_runtimeCreate(baseID, id, title, color, trait, isRemotelyStored);
		}
		return thing;
	}

	thing_remember_runtimeCreate(baseID: string, id: string = idDefault, title: string, color: string, trait: string,
		isRemotelyStored: boolean): Thing {
		const thing = this.thing_runtimeCreate(baseID, id, title, color, trait, isRemotelyStored);
		this.thing_remember(thing);
		return thing;
	}

	async thing_remember_runtimeCopy(baseID: string, parent: Thing) {
		const newThing = new Thing(baseID, idDefault, parent.title, parent.color, parent.trait, false);
		const prohibitedTraits: Array<string> = [IDTrait.roots, IDTrait.root, IDTrait.bulk];
		if (prohibitedTraits.includes(parent.trait)) {
			newThing.trait = k.empty;
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
		if (this.thing_byHID[thing.idHashed] == null) {
			this.thing_byHID[thing.idHashed] = thing;
			let things = this.things_byTrait[thing.trait] ?? [];
			things.push(thing);
			this.things_byTrait[thing.trait] = things;
			this.things.push(thing);
			if (thing.trait == IDTrait.root && (thing.baseID == k.empty || thing.baseID == this.db.baseID)) {
				this.root = thing;
			}
		}
	}

	thing_runtimeCreate(baseID: string, id: string = idDefault, title: string, color: string, trait: string,
		isRemotelyStored: boolean): Thing {
		let thing: Thing | null = null;
		if (id && trait == IDTrait.root && baseID != this.db.baseID) {		// other bulks have their own root & id
			thing = this.thing_remember_bulkRootID(baseID, id, color);		// which our thing needs to adopt
		}
		if (!thing) {
			thing = new Thing(baseID, id, title, color, trait, isRemotelyStored);
			if (thing.isBulkAlias) {
				thing.needsBulkFetch = true;
				if (title.includes('@')) {
					const dual = title.split('@');
					thing.title = dual[0];
					thing.bulkRootID = dual[1];
				}
			}
		}
		return thing;
	}

	static readonly $_BULKS_$: unique symbol;

	thing_remember_bulkRootID(baseID: string, id: string, color: string) {
		const thing = this.thing_bulkAlias_forTitle(baseID);
		if (!!thing) {
			// id is of the root thing from bulk fetch all
			// i.s., it is the root id from another baseID
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
		if (title) {
			for (const thing of this.things_byTrait[IDTrait.bulk]) {
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
			newThingAncestry = newParentAncestry.appendChild(newThing);
			if (newThingAncestry) {
				await this.ancestry_remember_remoteAddAsChild(newParentAncestry, newThing);
				for (const childAncestry of ancestry.childAncestries) {
					this.thing_remember_bulk_recursive_remoteRelocateRight(childAncestry, newThingAncestry);
				}
				if (!newThingAncestry.isExpanded) {
					setTimeout(() => {
						if (newThingAncestry) {
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
		for (const relationship of saved) {
			this.relationship_remember(relationship);
		}
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

	async relationships_remoteCreateMissing(idParent: string = idDefault, baseID: string) {
		const startingID = idParent ?? this.idRoot;
		if (startingID) {
			for (const thing of this.things) {
				const idThing = thing.id;
				if (idThing != startingID && thing.trait != IDTrait.root && thing.baseID == baseID) {
					let relationship = this.relationship_whereID_isChild(idThing);
					if (!relationship) {
						const idPredicateContains = Predicate.idContains;
						await this.relationship_remember_remoteCreateUnique(baseID, idDefault, idPredicateContains,
							startingID, idThing, 0, CreationOptions.getRemoteID)
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
			if (relationship) {
				this.relationship_forget(relationship);
			}
		}
	}

	static readonly $_RELATIONSHIP_$: unique symbol;

	relationship_forHID(hid: number): Relationship | null { return this.relationship_byHID[hid]; }
	relationships_forPredicateHID(hid: number): Array<Relationship> { return this.relationships_byPredicateHID[hid] ?? []; }

	relationship_rememberByKnown(relationships: Relationships_ByHID, relationship: Relationship, id: string) {
		if (id) {
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
		// console.log(`RELATIONSHIP ${relationship.parent?.title} => ${relationship.child?.title}`);
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

	async relationship_forget_remoteRemove(ancestry: Ancestry, otherAncestry: Ancestry, idPredicate: string) {
		const thing = ancestry.thing;
		const parentAncestry = ancestry.parentAncestry;
		const relationship = this.relationship_forPredicate_parent_child(idPredicate, otherAncestry.idThing, ancestry.idThing);
		if (parentAncestry && relationship && (thing?.hasParents ?? false)) {
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

	relationshipReversed_remember_runtimeCreate_maybe(baseID: string, idPredicate: string, idParent: string, idChild: string) {
		const predicate = this.predicate_forID(idPredicate);
		if (predicate && predicate.isBidirectional) {		// create reverse relationship because related are two directional, but not stored remotely
			const relationship = new Relationship(baseID, `R${idChild}${idParent}`, idPredicate, idChild, idParent);
			this.relationship_remember(relationship);
		}
	} 

	relationship_remember_runtimeCreateUnique(baseID: string, idRelationship: string, idPredicate: string, idParent: string,
		idChild: string, order: number, creationOptions: CreationOptions = CreationOptions.none) {
		let relationship = this.relationship_forPredicate_parent_child(idPredicate, idParent, idChild);
		relationship?.order_setTo_remoteMaybe(order);
		if (!relationship) {
			// this.relationshipReversed_remember_runtimeCreate_maybe(baseID, idPredicate, idParent, idChild);
			relationship = new Relationship(baseID, idRelationship, idPredicate, idParent, idChild, order, creationOptions != CreationOptions.none);
			this.relationship_remember(relationship);
		}
		return relationship;
	}

	async relationship_remember_remoteCreateUnique(baseID: string, idRelationship: string = idDefault, idPredicate: string, idParent: string,
		idChild: string, order: number, creationOptions: CreationOptions = CreationOptions.isFromRemote): Promise<any> {
		let relationship = this.relationship_forPredicate_parent_child(idPredicate, idParent, idChild);
		if (relationship) {
			relationship.order_setTo_remoteMaybe(order, true);
		} else {
			this.relationshipReversed_remember_runtimeCreate_maybe(baseID, idPredicate, idParent, idChild);
			relationship = new Relationship(baseID, idRelationship, idPredicate, idParent, idChild, order, creationOptions != CreationOptions.none);
			await this.db.relationship_remember_remoteCreate(relationship);
			this.relationship_remember(relationship);
		}
		return relationship;
	}

	static readonly $_ANCESTRIES_$: unique symbol;

	async ancestries_rebuild_traverse_remoteDelete(ancestries: Array<Ancestry>) {
		let needsRebuild = false;
		if (get(s_ancestry_focus)) {
			for (const ancestry of ancestries) {
				const thing = ancestry.thing;
				const parentAncestry = ancestry.parentAncestry;
				if (parentAncestry) {
					const grandParentAncestry = parentAncestry.parentAncestry;
					if (!!thing && grandParentAncestry && !ancestry.isEditing && !thing.isBulkAlias) {
						const siblings = parentAncestry.children;
						let index = siblings.indexOf(thing);
						siblings.splice(index, 1);
						parentAncestry.grabOnly();
						if (siblings.length == 0) {
							needsRebuild = parentAncestry.collapse();
							if (!grandParentAncestry.isVisible) {
								needsRebuild = grandParentAncestry.becomeFocus();	// call become focus before applying
							}
						}
						await ancestry.traverse_async(async (progenyAncestry: Ancestry): Promise<boolean> => {
							await this.ancestry_forget_remoteUpdate(progenyAncestry);
							return false; // continue the traversal
						});
					}
				}
			}
			if (needsRebuild) {
				signals.signal_rebuildGraph_fromFocus();
			}
		}
	}

	static readonly $_ANCESTRY_$: unique symbol;

	ancestry_forget(ancestry: Ancestry | null) {
		if (!!ancestry) {
			let dict = this.ancestry_byKind_andHash[ancestry.idPredicate] ?? {};
			delete dict[ancestry.ancestryHash];
			this.ancestry_byKind_andHash[ancestry.idPredicate] = dict;
		}
	}

	ancestry_remember_createUnique(ancestryString: string = k.empty, idPredicate: string = Predicate.idContains): Ancestry | null {
		const ancestryHash = ancestryString.hash();
		let dict = this.ancestry_byKind_andHash[idPredicate] ?? {};
		let ancestry = dict[ancestryHash];
		if (!ancestry) {
			ancestry = new Ancestry(ancestryString, idPredicate);
			dict[ancestryHash] = ancestry;
			this.ancestry_byKind_andHash[idPredicate] = dict;
		}
		return ancestry;
	}

	async ancestry_roots() {		// TODO: assumes all ancestries created
		let rootsAncestry: Ancestry | null = null;
		const rootAncestry = this.rootAncestry;
		for (const rootsMaybe of this.things_byTrait[IDTrait.roots]) {	// should only be one
			if  (rootsMaybe.title == 'roots') {	// special case TODO: convert to a query string
				return rootAncestry.appendChild(rootsMaybe) ?? null;
			}
		}
		const roots = this.thing_runtimeCreate(this.db.baseID, idDefault, 'roots', 'red', IDTrait.roots, false);
		await this.ancestry_remember_remoteAddAsChild(rootAncestry, roots).then((ancestry) => { rootsAncestry = ancestry; });
		return rootsAncestry;
	}

	async ancestry_relayout_toolCluster_nextParent(force: boolean = false) {
		const toolsAncestry = get(s_ancestry_editingTools);
		if (toolsAncestry) {
			let ancestry = toolsAncestry;
			// do {
			// 	ancestry = ancestry.next_siblingAncestry;
			// 	if (ancestry.isVisible) {
			// 		break;
			// 	} else if (force) {
			// 		await ancestry.assureIsVisible();
			// 		break;
			// 	}	
			// } while (!ancestry.matchesAncestry(toolsAncestry));
			ancestry.grabOnly();
			signals.signal_relayoutWidgets_fromFocus();
			s_ancestry_editingTools.set(ancestry);
		}
	}

	async ancestry_edit_remoteCreateChildOf(parentAncestry: Ancestry | null) {
		const thing = parentAncestry?.thing;
		if (!!thing && parentAncestry) {
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

	async ancestry_redraw_remoteFetchBulk_browseRight(thing: Thing, ancestry: Ancestry | null = null, grab: boolean = false) {
		if (this.rootsAncestry && thing && thing.title != 'roots') {	// not create roots bulk
			await this.db.fetch_allFrom(thing.title)
			this.relationships_refreshKnowns();
			const childAncestries = ancestry?.childAncestries;
			if (childAncestries && childAncestries.length > 0) {
				if (grab) {
					childAncestries[0].grabOnly()
				}
				ancestry?.expand()
				signals.signal_rebuildGraph_fromFocus();
			}
		}
	}

	async ancestry_remember_bulk_remoteRelocateRight(ancestry: Ancestry, newParentAncestry: Ancestry) {
		const newThingAncestry = await this.thing_remember_bulk_recursive_remoteRelocateRight(ancestry, newParentAncestry);
		if (newThingAncestry) {
			newParentAncestry.signal_relayoutWidgets();
			if (newParentAncestry.isExpanded) {
				newThingAncestry.grabOnly();
			} else {
				newParentAncestry.grabOnly();
			}
		}
	}

	async ancestry_forget_remoteUpdate(ancestry: Ancestry) {
		const thing = ancestry.thing;
		const childAncestries = ancestry.childAncestries;
		for (const childAncestry of childAncestries) {
			this.ancestry_forget_remoteUpdate(childAncestry);
		}
		this.ancestry_forget(ancestry);
		if (!!thing) {
			const array = this.relationships_byChildHID[thing.idHashed];
			if (array) {
				for (const relationship of array) {
					this.relationship_forget(relationship);		// forget so onSnapshot logic will not signal children
					await this.db.relationship_remoteDelete(relationship);
				}
			}
			this.thing_forget(thing);							// forget so onSnapshot logic will not signal children
			await this.db.thing_remoteDelete(thing);
		}
	}

	async ancestry_remember_remoteAddAsChild(parentAncestry: Ancestry, child: Thing, idPredicate: string = Predicate.idContains): Promise<any> {
		const parent = parentAncestry.thing;
		if (parent && !child.isBulkAlias) {
			const changingBulk = parent.isBulkAlias || child.baseID != this.db.baseID;
			const baseID = changingBulk ? child.baseID : parent.baseID;
			if (changingBulk) {
				console.log('changingBulk');
			}
			if (!child.isRemotelyStored) {
				await this.db.thing_remember_remoteCreate(child);					// for everything below, need to await child.id fetched from dbDispatch
			}
			const relationship = await this.relationship_remember_remoteCreateUnique(baseID, idDefault, idPredicate, parent.idBridging, child.id, 0, CreationOptions.getRemoteID);
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
		} else if (k.allow_GraphEditing) {
			const grab = this.grabs.latestAncestryGrabbed(true);
			if (grab) {
				await this.ancestry_rebuild_remoteRelocateRight(grab, RIGHT, EXTREME);
			}
		}
	}

	async ancestry_rebuild_remoteMoveUp(ancestry: Ancestry, up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean) {
		const parentAncestry = ancestry.parentAncestry;
		if (parentAncestry) {
			let needsRebuild = false;
			const siblings = parentAncestry.children;
			const thing = this.thing_forAncestry(ancestry);
			if (!siblings || siblings.length == 0) {
				this.ancestry_rebuild_runtimeBrowseRight(ancestry, true, EXTREME, up);
			} else if (!!thing) {
				const index = siblings.indexOf(thing);
				const newIndex = index.increment(!up, siblings.length);
				if (parentAncestry && !OPTION) {
					const grabAncestry = parentAncestry.appendChild(siblings[newIndex]);
					if (grabAncestry) {
						if (!grabAncestry.isVisible) {
							needsRebuild = parentAncestry.becomeFocus();
						}
						if (SHIFT) {
							grabAncestry.toggleGrab();
						} else {
							grabAncestry.grabOnly();
						}
						signals.signal_relayoutWidgets_fromFocus();
					}
				} else if (k.allow_GraphEditing && OPTION) {
					needsRebuild = true;
					await u.ancestries_orders_normalize_remoteMaybe(parentAncestry.childAncestries, false);
					const wrapped = up ? (index == 0) : (index == siblings.length - 1);
					const goose = ((wrapped == up) ? 1 : -1) * k.halfIncrement;
					const newOrder = newIndex + goose;
					ancestry.relationship?.order_setTo_remoteMaybe(newOrder);
					await u.ancestries_orders_normalize_remoteMaybe(parentAncestry.childAncestries);
				}
				if (needsRebuild) {
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
				if (relationship) {
					const order = RIGHT ? relationship.order : 0;
					relationship.idParent = newParent.id;
					await relationship.order_setTo_remoteMaybe(order + 0.5, true);
				}
				this.relationships_refreshKnowns();
				newParentAncestry.appendChild(thing)?.grabOnly();
				this.rootAncestry.order_normalizeRecursive_remoteMaybe(true);
				if (!newParentAncestry.isExpanded) {
					newParentAncestry.expand();
				}
				if (!newParentAncestry.isVisible) {
					newParentAncestry.becomeFocus();
				}
			}
			signals.signal_rebuildGraph_fromFocus();			// so TreeChildren component will update
		}
	}

	ancestry_rebuild_runtimeBrowseRight(ancestry: Ancestry, RIGHT: boolean, SHIFT: boolean, EXTREME: boolean, fromReveal: boolean = false) {
		let needsRebuild = false;
		const newParentAncestry = ancestry.parentAncestry;
		const childAncestry = ancestry.appendChild(ancestry.firstChild);
		let newGrabAncestry: Ancestry | null = RIGHT ? childAncestry : newParentAncestry;
		const newGrabIsNotFocus = !newGrabAncestry?.isFocus;
		const newFocusAncestry = newParentAncestry;
		if (RIGHT) {
			if (ancestry.hasChildRelationships) {
				if (SHIFT) {
					newGrabAncestry = null;
				}
				needsRebuild = ancestry.expand();
			} else {
				return;
			}
		} else {
			const rootAncestry = this.rootAncestry;
			if (EXTREME) {
				needsRebuild = rootAncestry?.becomeFocus();	// tells graph to update line rects
			} else {
				if (!SHIFT) {
					if (fromReveal) {
						if (!ancestry.isExpanded) {
							needsRebuild = ancestry.expand();
						}
					} else {
						if (newGrabIsNotFocus && newGrabAncestry && !newGrabAncestry.isExpanded) {
							needsRebuild = newGrabAncestry.expand();
						}
					}
				} else if (newGrabAncestry) { 
					if (ancestry.isExpanded) {
						needsRebuild = ancestry.collapse();
						newGrabAncestry = this.grabs.areInvisible ? ancestry : null;
					} else if (newGrabAncestry.isExpanded || (!!rootAncestry && !rootAncestry.matchesAncestry(newGrabAncestry))) {
						needsRebuild = newGrabAncestry.collapse();
					}
				}
			}
		}
		s_title_editing.set(null);
		if (newGrabAncestry) {
			newGrabAncestry.grabOnly();
			if (!RIGHT && newFocusAncestry) {
				const newParentIsGrabbed = newParentAncestry && newParentAncestry.matchesAncestry(newGrabAncestry);
				const canBecomeFocus = (!SHIFT || newParentIsGrabbed) && newGrabIsNotFocus;
				const shouldBecomeFocus = newFocusAncestry.isRoot || !newFocusAncestry.isVisible;
				const becomeFocus = canBecomeFocus && shouldBecomeFocus;
				if (becomeFocus && newFocusAncestry.becomeFocus()) {
					needsRebuild = true;
				}
			}
		}
		if (needsRebuild) {
			signals.signal_rebuildGraph_fromFocus();
		} else {
			signals.signal_relayoutWidgets_fromFocus();
		}
	}

	async ancestry_alterMaybe(ancestry: Ancestry) {
		if (ancestry.things_canAlter_asParentOf_toolsAncestry) {
			const altering = get(s_altering);
			const toolsAncestry = get(s_ancestry_editingTools);
			const idPredicate = altering?.predicate?.id;
			if (altering && toolsAncestry && idPredicate) {
				s_altering.set(null);
				s_ancestry_editingTools.set(null);
				switch (altering.alteration) {
					case AlterationType.deleting:
						await this.relationship_forget_remoteRemove(toolsAncestry, ancestry, idPredicate);
						break;
					case AlterationType.adding:
						const toolsThing = toolsAncestry.thing;
						if (toolsThing) {
							await this.ancestry_remember_remoteAddAsChild(ancestry, toolsThing, idPredicate);
							signals.signal_rebuildGraph_fromFocus();
						}
						break;
				}
			}
		}
	}

	static readonly $_ANCILLARY_$: unique symbol;

	predicate_forKind(kind: string | null): Predicate | null { return (!kind) ? null : this.predicate_byKind[kind]; }
	predicate_forID(idPredicate: string = idDefault): Predicate | null { return (!idPredicate) ? null : this.predicate_byHID[idPredicate.hash()]; }

	predicate_remember(predicate: Predicate) {
		this.predicate_byHID[predicate.idHashed] = predicate;
		this.predicate_byKind[predicate.kind] = predicate;
		this.predicates.push(predicate);
	}

	predicate_remember_runtimeCreateUnique(id: string, kind: string, isBidirectional: boolean, isRemotelyStored: boolean = true) {
		if (!this.predicate_forID(id)) {
			this.predicate_remember_runtimeCreate(id, kind, isBidirectional, isRemotelyStored);
		}
	}

	predicate_remember_runtimeCreate(id: string, kind: string, isBidirectional: boolean, isRemotelyStored: boolean = true) {
		this.predicate_remember(new Predicate(id, kind, isBidirectional, isRemotelyStored));
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

	wrapper_add(wrapper: SvelteWrapper) {
		const type = wrapper.type;
		const array = this.wrappers_byType_andHID;
		const dict = array[type] ?? {};
		const hash = wrapper.ancestry.ancestryHash;
		dict[hash] = wrapper;
		array[type] = dict;
	}

	hierarchy_markAsCompleted() {
		this.db.setHasData(true);
		s_things_arrived.set(true);
		s_isBusy.set(false);
		this.isAssembled = true;
	}

	async add_missing_removeNulls(idParent: string = idDefault, baseID: string) {
		await this.relationships_remoteCreateMissing(idParent, baseID);
		await this.relationships_removeHavingNullReferences();
	}

	toggleAlteration(alteration: AlterationType, isRelated: boolean) {
		const altering = get(s_altering)?.alteration;
		const predicate = isRelated ? Predicate.isRelated : Predicate.contains;
		const became = alteration == altering ? null : new AlterationState(alteration, predicate);
		s_altering.set(became);
	}

}
