import { g, k, u, get, User, Path, Thing, Grabs, debug, Access, DBType, IDTool, IDTrait, signals } from '../common/GlobalImports';
import { Wrapper, Predicate, Relationship, Alteration, AlterationState, CreationOptions } from '../common/GlobalImports';
import { s_title_editing, s_altering, s_layout_byClusters, s_path_editingTools } from '../state/State';
import { s_isBusy, s_path_focus, s_db_loadTime, s_paths_grabbed, s_things_arrived } from '../state/State';
import DBInterface from '../db/DBInterface';

type Relationships_ByHID = { [hid: number]: Array<Relationship> }

export default class Hierarchy {
	private wrappers_byType_andHID: { [type: string]: { [hid: number]: Wrapper } } = {};
	private relationship_byHID: { [hid: number]: Relationship } = {};
	private predicate_byHID: { [hid: number]: Predicate } = {};
	private access_byHID: { [hid: number]: Access } = {};
	private thing_byHID: { [hid: number]: Thing } = {};
	private user_byHID: { [hid: number]: User } = {};
	private path_byHash: { [hash: number]: Path } = {};
	private access_byKind: { [kind: string]: Access } = {};
	private predicate_byKind: { [kind: string]: Predicate } = {};
	private things_byTrait: { [trait: string]: Array<Thing> } = {};
	private relationships_byPredicateHID: Relationships_ByHID = {};
	private relationships_byParentHID: Relationships_ByHID = {};
	private relationships_byChildHID: Relationships_ByHID = {};
	private _grabs: Grabs | null = null;
	private things: Array<Thing> = [];
	relationships: Array<Relationship> = [];
	predicates: Array<Predicate> = [];
	root: Thing | null = null;
	isAssembled = false;
	db: DBInterface;

	get hasNothing(): boolean { return !this.root; }
	get idRoot(): string | null { return this.root?.id ?? null; };
	thing_forPath(path: Path | null): Thing | null { return path?.thing ?? null; }
	thing_forHID(hid: number | null): Thing | null { return (!hid) ? null : this.thing_byHID[hid]; }

	static readonly $_INIT_$: unique symbol;

	constructor(db: DBInterface) {
		this.db = db;
	}

	async hierarchy_fetch_andBuild(type: string) {
		if (!this.db.hasData) {
			if (type != DBType.local) {
				s_isBusy.set(true);
				s_things_arrived.set(false);
			}
			await this.db.fetch_all();
			await this.add_missing_removeNulls(null, this.db.baseID);
		}
		g.rootPath_set(this.path_remember_createUnique());
	}

	static readonly $_EVENTS_$: unique symbol;

	async handle_tool_clicked(idButton: string, event: MouseEvent, isLong: boolean) {
        const path = get(s_path_editingTools);
		if (!!path) {
			switch (idButton) {
				case IDTool.create: await this.path_edit_remoteCreateChildOf(path); break;
				case IDTool.add_parent: this.toggleAlteration(Alteration.adding, isLong); return;
				case IDTool.next: this.path_relayout_toolCluster_nextParent(event.altKey); return;
				case IDTool.delete_parent: this.toggleAlteration(Alteration.deleting, isLong); return;
				case IDTool.delete_confirm: await this.paths_rebuild_traverse_remoteDelete([path]); break;
				case IDTool.more: console.log('needs more'); break;
				default: break;
			}
			s_path_editingTools.set(null);
			signals.signal_relayoutWidgets_fromFocus();
		}
	}

	async handle_key_down(event: KeyboardEvent) {
		let pathGrab = this.grabs.latestPathGrabbed(true);
		if (event.type == 'keydown') {
			const OPTION = event.altKey;
			const SHIFT = event.shiftKey;
			const COMMAND = event.metaKey;
			const EXTREME = SHIFT && OPTION;
			const key = event.key.toLowerCase();
			const rootPath = g.rootPath;
			let needsRebuild = false;
			if (!pathGrab) {
				pathGrab = rootPath;
				needsRebuild = rootPath.becomeFocus();
			}
			if (k.allow_GraphEditing) {
				if (!!pathGrab && k.allow_TitleEditing) {
					switch (key) {
						case 'd':		await this.thing_edit_remoteDuplicate(pathGrab); break;
						case k.space:	await this.path_edit_remoteCreateChildOf(pathGrab); break;
						case '-':		if (!COMMAND) { await this.thing_edit_remoteAddLine(pathGrab); } break;
						case 'tab':		await this.path_edit_remoteCreateChildOf(pathGrab.parentPath); break; // Title editor also makes this call
						case 'enter':	pathGrab.startEdit(); break;
					}
				}
				switch (key) {
					case 'delete':
					case 'backspace':	await this.paths_rebuild_traverse_remoteDelete(get(s_paths_grabbed)); break;
				}
			}
			if (!!pathGrab) {
				switch (key) {
					case '/':			needsRebuild = pathGrab.becomeFocus(); break;
					case 'arrowright':	event.preventDefault(); await this.path_rebuild_remoteMoveRight(pathGrab, true, SHIFT, OPTION, EXTREME); break;
					case 'arrowleft':	event.preventDefault(); await this.path_rebuild_remoteMoveRight(pathGrab, false, SHIFT, OPTION, EXTREME); break;
				}
			}
			switch (key) {
				case '!':				needsRebuild = g.rootPath?.becomeFocus(); break;
				case '`':               event.preventDefault(); this.latestPathGrabbed_toggleEditingTools(); break;
				case 'arrowup':			await this.latestPathGrabbed_rebuild_remoteMoveUp(true, SHIFT, OPTION, EXTREME); break;
				case 'arrowdown':		await this.latestPathGrabbed_rebuild_remoteMoveUp(false, SHIFT, OPTION, EXTREME); break;
			}
			if (needsRebuild) {
				signals.signal_rebuildGraph_fromFocus();
			}
		}
	}

	static readonly $_GRABS_$: unique symbol;

	get grabs(): Grabs { 
		if (this._grabs == null) {
			this._grabs = new Grabs(this);
		}
		return this._grabs!;
	}

	async latestPathGrabbed_rebuild_remoteMoveUp(up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean) {
		const path = this.grabs.latestPathGrabbed(up);
		if (!!path) {
			this.path_rebuild_remoteMoveUp(path, up, SHIFT, OPTION, EXTREME);
		}
	}

	latestPathGrabbed_toggleEditingTools(up: boolean = true) {
		const path = this.grabs.latestPathGrabbed(up);
		if (!!path && !path.isRoot) {
			s_path_editingTools.set(path.toolsGrabbed ? null : path);
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

	things_forPath(path: Path): Array<Thing | null> {
		const root = this.root;
		const things: Array<Thing | null> = root ? [root] : [];
		for (const hid of path.ids_hashed) {
			const thing = this.relationship_forHID(hid)?.childThing || null;
			things.push(thing);
		}
		return things;
	}

	things_forPaths(paths: Array<Path>): Array<Thing> {
		const things = Array<Thing>();
		for (const path of paths) {
			const thing = this.thing_forPath(path);
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
		this.things = u.strip_falsies(this.things);
		this.things_byTrait[thing.trait] = u.strip_falsies(this.things_byTrait[thing.trait]);
	}

	async thing_edit_remoteAddLine(path: Path, below: boolean = true) {
		const parentPath = path.parentPath;
		const parent = parentPath?.thing;
		const thing = path.thing;
		if (!!thing && parent && parentPath) {
			const order = path.order + (below ? 0.5 : -0.5);
			const child = this.thing_runtimeCreate(thing.baseID, null, k.title_line, parent.color, k.empty, false);
			await this.path_edit_remoteAddAsChild(parentPath, child, order, false);
		}
	}

	thing_remember_runtimeCreateUnique(baseID: string, id: string | null, title: string, color: string, trait: string,
		isRemotelyStored: boolean): Thing {
		let thing = this.thing_forHID(id?.hash() ?? null);
		if (!thing) {
			thing = this.thing_remember_runtimeCreate(baseID, id, title, color, trait, isRemotelyStored);
		}
		return thing;
	}

	thing_remember_runtimeCreate(baseID: string, id: string | null, title: string, color: string, trait: string,
		isRemotelyStored: boolean): Thing {
		const thing = this.thing_runtimeCreate(baseID, id, title, color, trait, isRemotelyStored);
		this.thing_remember(thing);
		return thing;
	}

	async thing_remember_runtimeCopy(baseID: string, parent: Thing) {
		const newThing = new Thing(baseID, null, parent.title, parent.color, parent.trait, false);
		const prohibitedTraits: Array<string> = [IDTrait.roots, IDTrait.root, IDTrait.bulk];
		if (prohibitedTraits.includes(parent.trait)) {
			newThing.trait = k.empty;
		}
		this.thing_remember(newThing);
		return newThing;
	}

	async thing_edit_remoteDuplicate(path: Path) {
		const thing = path.thing;
		const id = thing?.id;
		const parentPath = path.parentPath;
		if (!!thing && id && parentPath) {
			const sibling = await this.thing_remember_runtimeCopy(id, thing);
			sibling.title = 'idea';
			await this.path_edit_remoteAddAsChild(parentPath, sibling, path.order + 0.5);
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
				g.root = thing;
			}
		}
	}

	thing_runtimeCreate(baseID: string, id: string | null, title: string, color: string, trait: string,
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
			// i.e., it is the root id from another baseID
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

	async thing_remember_bulk_recursive_remoteRelocateRight(path: Path, newParentPath: Path) {
		const newParent = newParentPath.thing;
		let newThingPath: Path | null = null;
		const thing = path.thing;
		if (!!thing && newParent) {
			const baseID = newParent.isBulkAlias ? newParent.title : newParent.baseID;
			const newThing = await this.thing_remember_runtimeCopy(baseID, thing);
			newThingPath = newParentPath.appendChild(newThing);
			if (newThingPath) {
				await this.path_remember_remoteAddAsChild(newParentPath, newThing);
				for (const childPath of path.childPaths) {
					this.thing_remember_bulk_recursive_remoteRelocateRight(childPath, newThingPath);
				}
				if (!newThingPath.isExpanded) {
					setTimeout(() => {
						if (newThingPath) {
							newThingPath.expand();	
							path.collapse()
						};
					}, 2);
				}
				await this.path_forget_remoteUpdate(path);
			}
		}
		return newThingPath;
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

	relationships_forPredicateThingIsChild(idPredicate: string, idThing: string, isChild: boolean): Array<Relationship> {
		const dict = isChild ? this.relationships_byChildHID : this.relationships_byParentHID;
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

	async relationships_remoteCreateMissing(idParent: string | null, baseID: string) {
		const startingID = idParent ?? this.idRoot;
		if (startingID) {
			for (const thing of this.things) {
				const idThing = thing.id;
				if (idThing != startingID && thing.trait != IDTrait.root && thing.baseID == baseID) {
					let relationship = this.relationship_whereID_isChild(idThing);
					if (!relationship) {
						const idPredicateContains = Predicate.idContains;
						await this.relationship_remember_remoteCreateUnique(baseID, null, idPredicateContains,
							startingID, idThing, 0, CreationOptions.getRemoteID)
					}
				}
			}
		}
	}

	async relationships_removeHavingNullReferences() {
		const array = Array<Relationship>();
		for (const relationship of this.relationships) {
			const thingTo = relationship.childThing;
			const thingFrom = relationship.parentThing;
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
			if (!relationship.childThing) {
				console.log('missing CHILD thing');
			}
			relationships[hid] = array;
		}
	}
	
	relationship_remember(relationship: Relationship) {
		// console.log(`RELATIONSHIP ${relationship.parentThing?.title} => ${relationship.childThing?.title}`);
		if (!this.relationship_byHID[relationship.idHashed]) {
			if (relationship.baseID != this.db.baseID) {
				debug.log_error(`RELATIONSHIP off base: ${relationship.baseID} ${relationship.parentThing?.description} => ${relationship.childThing?.description}`);
			}
			this.relationships.push(relationship);
			this.relationship_byHID[relationship.idHashed] = relationship;
			this.relationship_rememberByKnown(this.relationships_byChildHID, relationship, relationship.idChild);
			this.relationship_rememberByKnown(this.relationships_byParentHID, relationship, relationship.idParent);
			this.relationship_rememberByKnown(this.relationships_byPredicateHID, relationship, relationship.idPredicate);
		}
	}

	async relationship_forget_remoteRemove(path: Path, otherPath: Path, idPredicate: string) {
		const thing = path.thing;
		const parentPath = path.parentPath;
		const relationship = this.relationship_forPredicate_parent_child(idPredicate, otherPath.idThing, path.idThing);
		if (parentPath && relationship && (thing?.hasParents ?? false)) {
			this.relationship_forget(relationship);
			if (otherPath.hasChildRelationships) {
				parentPath.order_normalizeRecursive_remoteMaybe(true);
			} else {
				otherPath.collapse();
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

	relationship_remember_runtimeCreateUnique(baseID: string, idRelationship: string, idPredicate: string, idParent: string,
		idChild: string, order: number, creationOptions: CreationOptions = CreationOptions.none) {
		let relationship = this.relationship_forPredicate_parent_child(idPredicate, idParent, idChild);
		if (relationship) {
			relationship.order_setTo(order);						// AND thing are updated
		} else {
			// const predicate = this.predicate_forID(idPredicate);
			relationship = new Relationship(baseID, idRelationship, idPredicate, idParent, idChild, order, creationOptions != CreationOptions.none);
			this.relationship_remember(relationship);
		}
		return relationship;
	}

	async relationship_remember_remoteCreateUnique(baseID: string, idRelationship: string | null, idPredicate: string, idParent: string,
		idChild: string, order: number, creationOptions: CreationOptions = CreationOptions.isFromRemote): Promise<any> {
		let relationship = this.relationship_forPredicate_parent_child(idPredicate, idParent, idChild);
		if (relationship) {
			relationship.order_setTo(order, true);						// AND thing are updated
		} else {
			const predicate = this.predicate_forID(idPredicate);
			relationship = new Relationship(baseID, idRelationship, idPredicate, idParent, idChild, order, creationOptions != CreationOptions.none);
			await this.db.relationship_remember_remoteCreate(relationship);
			this.relationship_remember(relationship);
			if (predicate && predicate.directions == 2) {
				relationship = new Relationship(baseID, idRelationship, idPredicate, idChild, idParent, order);
				this.relationship_remember(relationship);
			}
		}
		return relationship;
	}

	static readonly $_PATHS_$: unique symbol;

	async paths_rebuild_traverse_remoteDelete(paths: Array<Path>) {
		let needsRebuild = false;
		if (get(s_path_focus)) {
			for (const path of paths) {
				const thing = path.thing;
				const parentPath = path.parentPath;
				if (parentPath) {
					const grandParentPath = parentPath.parentPath;
					if (!!thing && grandParentPath && !path.isEditing && !thing.isBulkAlias) {
						const siblings = parentPath.children;
						let index = siblings.indexOf(thing);
						siblings.splice(index, 1);
						parentPath.grabOnly();
						if (siblings.length == 0) {
							needsRebuild = parentPath.collapse();
							if (!grandParentPath.isVisible) {
								needsRebuild = grandParentPath.becomeFocus();	// call become focus before applying
							}
						}
						await path.traverse_async(async (progenyPath: Path): Promise<boolean> => {
							await this.path_forget_remoteUpdate(progenyPath);
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

	static readonly $_PATH_$: unique symbol;

	path_remember_createUnique(pathString: string = k.empty, idPredicate: string = Predicate.idContains): Path | null {
		const pathHash = pathString.hash();
		let path = this.path_byHash[pathHash];
		if (!path) {
			path = new Path(pathString, idPredicate);
			if (this.things_forPath(path).includes(null)) {	// asure path is valid
				return null;
			} else {
				this.path_byHash[pathHash] = path;
			}
		}
		return path;
	}

	async path_roots() {		// TODO: assumes all paths created
		let rootsPath: Path | null = null;
		const rootPath = g.rootPath;
		for (const rootsMaybe of this.things_byTrait[IDTrait.roots]) {	// should only be one
			if  (rootsMaybe.title == 'roots') {	// special case TODO: convert to a query string
				return rootPath.appendChild(rootsMaybe) ?? null;
			}
		}
		const roots = this.thing_runtimeCreate(this.db.baseID, null, 'roots', 'red', IDTrait.roots, false);
		await this.path_remember_remoteAddAsChild(rootPath, roots).then((path) => { rootsPath = path; });
		return rootsPath;
	}

	async path_relayout_toolCluster_nextParent(force: boolean = false) {
		const toolsPath = get(s_path_editingTools);
		if (toolsPath) {
			let path = toolsPath;
			do {
				path = path.next_siblingPath;
				if (path.isVisible) {
					break;
				} else if (force) {
					await path.assureIsVisible();
					break;
				}	
			} while (!path.matchesPath(toolsPath));
			path.grabOnly();
			signals.signal_relayoutWidgets_fromFocus();
			s_path_editingTools.set(path);
		}
	}

	async path_edit_remoteCreateChildOf(parentPath: Path | null) {
		const thing = parentPath?.thing;
		if (!!thing && parentPath) {
			const child = await this.thing_remember_runtimeCopy(thing.baseID, thing);
			child.title = 'idea';
			parentPath.expand();
			await this.path_edit_remoteAddAsChild(parentPath, child, 0);
		}
	}

	async path_edit_remoteAddAsChild(parentPath: Path, child: Thing, order: number, shouldStartEdit: boolean = true) {
		const childPath = await this.path_remember_remoteAddAsChild(parentPath, child);
		childPath.grabOnly();
		childPath.relationship?.order_setTo(order);
		signals.signal_rebuildGraph_fromFocus();
		if (shouldStartEdit) {
			setTimeout(() => {
				childPath.startEdit();
			}, 20);
		}
	}

	async path_redraw_remoteFetchBulk_browseRight(thing: Thing, path: Path | null = null, grab: boolean = false) {
		const rootsPath = g.rootsPath;
		if (rootsPath && thing && thing.title != 'roots') {	// not create roots bulk
			await this.db.fetch_allFrom(thing.title)
			this.relationships_refreshKnowns();
			const childPaths = path?.childPaths;
			if (childPaths && childPaths.length > 0) {
				if (grab) {
					childPaths[0].grabOnly()
				}
				path?.expand()
				signals.signal_rebuildGraph_fromFocus();
			}
		}
	}

	async path_remember_bulk_remoteRelocateRight(path: Path, newParentPath: Path) {
		const newThingPath = await this.thing_remember_bulk_recursive_remoteRelocateRight(path, newParentPath);
		if (newThingPath) {
			newParentPath.signal_relayoutWidgets();
			if (newParentPath.isExpanded) {
				newThingPath.grabOnly();
			} else {
				newParentPath.grabOnly();
			}
		}
	}

	async path_forget_remoteUpdate(path: Path) {
		const thing = path.thing;
		const childPaths = path.childPaths;
		for (const childPath of childPaths) {
			this.path_forget_remoteUpdate(childPath);
		}
		delete this.path_byHash[path.pathString.hash()];
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

	async path_remember_remoteAddAsChild(parentPath: Path, childThing: Thing, idPredicate: string | null = null): Promise<any> {
		const child = parentPath.thing;
		if (child && !childThing.isBulkAlias) {
			const id = idPredicate ?? Predicate.idContains;
			const changingBulk = child.isBulkAlias || childThing.baseID != this.db.baseID;
			const baseID = changingBulk ? childThing.baseID : child.baseID;
			if (changingBulk) {
				console.log('changingBulk');
			}
			if (!childThing.isRemotelyStored) {	
				await this.db.thing_remember_remoteCreate(childThing);			// for everything below, need to await childThing.id fetched from dbDispatch
			}
			const relationship = await this.relationship_remember_remoteCreateUnique(baseID, null, id, child.idBridging, childThing.id, 0, CreationOptions.getRemoteID);
			const childPath = parentPath.uniquelyAppendID(relationship.id);
			await u.paths_orders_normalize_remoteMaybe(parentPath.childPaths);		// write new order values for relationships
			return childPath;
		}
	}

	async path_rebuild_remoteMoveRight(path: Path, RIGHT: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean, fromReveal: boolean = false) {
		if (!OPTION) {
			const thing = path.thing;
			if (!!thing) {
				if (RIGHT && thing.needsBulkFetch) {
					await this.path_redraw_remoteFetchBulk_browseRight(thing, path, true);
				} else {
					this.path_rebuild_runtimeBrowseRight(path, RIGHT, SHIFT, EXTREME, fromReveal);
				}
			}
		} else if (k.allow_GraphEditing) {
			const grab = this.grabs.latestPathGrabbed(true);
			if (grab) {
				await this.path_rebuild_remoteRelocateRight(grab, RIGHT, EXTREME);
			}
		}
	}

	async path_rebuild_remoteMoveUp(path: Path, up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean) {
		const thing = this.thing_forPath(path);
		const parentPath = path.parentPath;
		if (parentPath) {
			const siblings = parentPath.children;
			if (!siblings || siblings.length == 0) {
				this.path_rebuild_runtimeBrowseRight(path, true, EXTREME, up);
			} else if (!!thing) {
				const index = siblings.indexOf(thing);
				const newIndex = index.increment(!up, siblings.length);
				if (parentPath && !OPTION) {
					const grabPath = parentPath.appendChild(siblings[newIndex]);
					if (grabPath) {
						if (get(s_layout_byClusters)) {
							grabPath.becomeFocus();
							grabPath.grabOnly();
						} else if (!grabPath.isVisible) {
							parentPath.becomeFocus();
						}
						if (SHIFT) {
							grabPath.toggleGrab();
						} else {
							grabPath.grabOnly();
						}
						signals.signal_relayoutWidgets_fromFocus();
					}
				} else if (k.allow_GraphEditing && OPTION) {
					await u.paths_orders_normalize_remoteMaybe(parentPath.childPaths, false);
					const wrapped = up ? (index == 0) : (index == siblings.length - 1);
					const goose = ((wrapped == up) ? 1 : -1) * k.halfIncrement;
					const newOrder = newIndex + goose;
					path.relationship?.order_setTo(newOrder);
					await u.paths_orders_normalize_remoteMaybe(parentPath.childPaths);
					signals.signal_rebuildGraph_fromFocus();
				}
			}
		}
	}

	async path_rebuild_remoteRelocateRight(path: Path, RIGHT: boolean, EXTREME: boolean) {
		const thing = path.thing;
		const newParentPath = RIGHT ? path.path_ofNextSibling(false) : path.stripBack(2);
		const newParent = newParentPath?.thing;
		if (!!thing && newParent && newParentPath) {
			if (thing.isInDifferentBulkThan(newParent)) {		// should move across bulks
				this.path_remember_bulk_remoteRelocateRight(path, newParentPath);
			} else {
				const relationship = path.relationship;
				if (relationship) {
					const order = RIGHT ? relationship.order : 0;
					relationship.idParent = newParent.id;
					await relationship.order_setTo(order + 0.5, true);
				}
				this.relationships_refreshKnowns();
				newParentPath.appendChild(thing)?.grabOnly();
				g.rootPath.order_normalizeRecursive_remoteMaybe(true);
				if (!newParentPath.isExpanded) {
					newParentPath.expand();
				}
				if (!newParentPath.isVisible) {
					newParentPath.becomeFocus();
				}
			}
			signals.signal_rebuildGraph_fromFocus();			// so TreeChildren component will update
		}
	}

	path_rebuild_runtimeBrowseRight(path: Path, RIGHT: boolean, SHIFT: boolean, EXTREME: boolean, fromReveal: boolean = false) {
		let needsRebuild = false;
		const newParentPath = path.parentPath;
		const childPath = path.appendChild(path.firstChild);
		let newGrabPath: Path | null = RIGHT ? childPath : newParentPath;
		const newGrabIsNotFocus = !newGrabPath?.isFocus;
		const newFocusPath = newParentPath;
		if (RIGHT) {
			if (path.hasChildRelationships) {
				if (SHIFT) {
					newGrabPath = null;
				}
				needsRebuild = path.expand();
			} else {
				return;
			}
		} else {
			const rootPath = g.rootPath;
			if (EXTREME) {
				needsRebuild = rootPath?.becomeFocus();	// tells graph to update line rects
			} else {
				if (!SHIFT) {
					if (fromReveal) {
						if (!path.isExpanded) {
							needsRebuild = path.expand();
						}
					} else {
						if (newGrabIsNotFocus && newGrabPath && !newGrabPath.isExpanded) {
							needsRebuild = newGrabPath.expand();
						}
					}
				} else if (newGrabPath) { 
					if (path.isExpanded) {
						needsRebuild = path.collapse();
						newGrabPath = this.grabs.areInvisible ? path : null;
					} else if (!!rootPath && !rootPath.matchesPath(newGrabPath)) {
						needsRebuild = newGrabPath.collapse();
					}
				}
			}
		}
		s_title_editing.set(null);
		newGrabPath?.grabOnly();
		const matches = newParentPath && newGrabPath && newGrabPath.matchesPath(newParentPath);
		const allowToBecomeFocus = (!SHIFT || matches) && newGrabIsNotFocus; 
		const shouldBecomeFocus = !newFocusPath?.isVisible || newFocusPath.isRoot;
		if (!RIGHT && allowToBecomeFocus && shouldBecomeFocus && (newFocusPath?.becomeFocus() ?? false)) {
			needsRebuild = true;
		}
		if (needsRebuild) {
			signals.signal_rebuildGraph_fromFocus();
		} else {
			signals.signal_relayoutWidgets_fromFocus();
		}
	}

	async path_alterMaybe(path: Path) {
		if (path.things_canAlter_asParentOf_toolsGrab) {
			const altering = get(s_altering);
			const toolsPath = get(s_path_editingTools);
			const idPredicate = altering?.predicate?.id;
			if (altering && toolsPath && idPredicate) {
				s_altering.set(null);
				s_path_editingTools.set(null);
				switch (altering.alteration) {
					case Alteration.deleting:
						await this.relationship_forget_remoteRemove(toolsPath, path, idPredicate);
						break;
					case Alteration.adding:
						const toolsThing = toolsPath.thing;
						if (toolsThing) {
							await this.path_remember_remoteAddAsChild(path, toolsThing, idPredicate);
							signals.signal_rebuildGraph_fromFocus();
						}
						break;
				}
			}
		}
	}

	static readonly $_ANCILLARY_$: unique symbol;

	predicate_forKind(kind: string | null): Predicate | null { return (!kind) ? null : this.predicate_byKind[kind]; }
	predicate_forID(idPredicate: string | null): Predicate | null { return (!idPredicate) ? null : this.predicate_byHID[idPredicate.hash()]; }

	predicate_remember(predicate: Predicate) {
		this.predicate_byHID[predicate.idHashed] = predicate;
		this.predicate_byKind[predicate.kind] = predicate;
		this.predicates.push(predicate);
	}

	predicate_remember_runtimeCreateUnique(id: string, kind: string, isRemotelyStored: boolean = true, directions: number = 1) {
		if (!this.predicate_forID(id)) {
			this.predicate_remember_runtimeCreate(id, kind, isRemotelyStored, directions);
		}
	}

	predicate_remember_runtimeCreate(id: string, kind: string, isRemotelyStored: boolean = true, directions: number = 1) {
		this.predicate_remember(new Predicate(id, kind, isRemotelyStored, directions));
	}

	access_runtimeCreate(idAccess: string, kind: string) {
		const access = new Access(idAccess, kind);
		this.access_byKind[kind] = access;
		this.access_byHID[idAccess.hash()] = access;
	}

	user_runtimeCreate(id: string, name: string, email: string, phone: string) {
		const user = new User(id, name, email, phone);
		this.user_byHID[id.hash()] = user;
	}

	static readonly $_OTHER_$: unique symbol;

	wrapper_add(wrapper: Wrapper) {
		const path = wrapper.path
		const hash = path.pathHash;
		const dict = this.wrappers_byType_andHID[wrapper.type] ?? {};
		dict[hash] = wrapper;
		this.wrappers_byType_andHID[wrapper.type] = dict;
	}

	hierarchy_completed(startTime: number) {
		this.db.setHasData(true);
		s_things_arrived.set(true);
		s_isBusy.set(false);
		this.isAssembled = true;
		const duration = Math.trunc(((new Date().getTime()) - startTime) / 100) / 10;
		const places = (duration == Math.trunc(duration)) ? 0 : 1;
		const loadTime = (((new Date().getTime()) - startTime) / 1000).toFixed(places);
		this.db.loadTime = loadTime;
		s_db_loadTime.set(loadTime);
	}

	async add_missing_removeNulls(idParent: string | null, baseID: string) {
		await this.relationships_remoteCreateMissing(idParent, baseID);
		await this.relationships_removeHavingNullReferences();
	}

	toggleAlteration(alteration: Alteration, isRelated: boolean) {
		const altering = get(s_altering)?.alteration;
		const predicate = isRelated ? Predicate.isRelated : Predicate.contains;
		const became = alteration == altering ? null : new AlterationState(alteration, predicate);
		console.log(`altering ${became?.description ?? 'nothing'}`);
		s_altering.set(became);
	}

}
