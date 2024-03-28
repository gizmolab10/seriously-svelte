import { g, k, u, get, User, Path, Thing, Grabs, debug, Access, IDTool, IDTrait, signals } from '../common/GlobalImports';
import { TypeDB, Wrapper, Predicate, Relationship, AlteringParent, CreationOptions } from '../common/GlobalImports';
import { s_title_editing, s_altering_parent, s_layout_asCircles, s_path_toolsCluster } from '../common/State';
import { s_isBusy, s_path_here, s_db_loadTime, s_paths_grabbed, s_things_arrived } from '../common/State';
import DBInterface from '../db/DBInterface';

type Relationships_ByHID = { [hid: number]: Array<Relationship> }

export default class Hierarchy {
	wrappers_byType_andHID: { [type: string]: { [hid: number]: Wrapper } } = {};
	relationship_byHID: { [hid: number]: Relationship } = {};
	predicate_byHID: { [hid: number]: Predicate } = {};
	access_byHID: { [hid: number]: Access } = {};
	thing_byHID: { [hid: number]: Thing } = {};
	user_byHID: { [hid: number]: User } = {};
	path_byHash: { [hash: number]: Path } = {};
	access_byKind: { [kind: string]: Access } = {};
	predicate_byKind: { [kind: string]: Predicate } = {};
	things_byTrait: { [trait: string]: Array<Thing> } = {};
	relationships_byPredicate: Relationships_ByHID = {};
	relationships_byFrom: Relationships_ByHID = {};
	relationships_byTo: Relationships_ByHID = {};
	relationships: Array<Relationship> = [];
	predicates: Array<Predicate> = [];
	things: Array<Thing> = [];
	_grabs: Grabs | null = null;
	isAssembled = false;
	db: DBInterface;

	get hasNothing(): boolean { return !g.root; }
	get idRoot(): string | null { return g.root?.id ?? null; };
	thing_get_byPath(path: Path | null): Thing | null { return path?.thing ?? null; }
	thing_get_byHID(hid: number | null): Thing | null { return (!hid) ? null : this.thing_byHID[hid]; }

	static readonly $_INIT_$: unique symbol;

	constructor(db: DBInterface) {
		this.db = db;
	}

	async hierarchy_fetch_andBuild(type: string) {
		if (!this.db.hasData) {
			if (type != TypeDB.local) {
				s_isBusy.set(true);
				s_things_arrived.set(false);
			}
			await this.db.fetch_all();
			await this.add_missing_removeNulls(null, this.db.baseID);
		}
	}

	static readonly $_EVENTS_$: unique symbol;

	async handle_tool_clicked(IDButton: string, event: MouseEvent) {
		const path = get(s_path_toolsCluster);
		if (path) {
			switch (IDButton) {
				case IDTool.create: await this.path_edit_remoteCreateChildOf(path); break;
				case IDTool.add_parent: this.toggleAlteration(AlteringParent.adding); return;
				case IDTool.next: this.path_relayout_toolCluster_nextParent(event.altKey); return;
				case IDTool.delete_parent: this.toggleAlteration(AlteringParent.deleting); return;
				case IDTool.delete_confirm: await this.paths_rebuild_traverse_remoteDelete([path]); break;
				case IDTool.more: console.log('needs more'); break;
				default: break;
			}
			s_path_toolsCluster.set(null);
			signals.signal_relayoutWidgets_fromHere();
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
				needsRebuild = rootPath.becomeHere();
			}
			if (k.allow_GraphEditing) {
				if (pathGrab && k.allow_TitleEditing) {
					switch (key) {
						case 'd':		await this.thing_edit_remoteDuplicate(pathGrab); break;
						case k.space:		await this.path_edit_remoteCreateChildOf(pathGrab); break;
						case '-':		if (!COMMAND) { await this.thing_edit_remoteAddLine(pathGrab); } break;
						case 'tab':		await this.path_edit_remoteCreateChildOf(pathGrab.fromPath); break; // Title editor also makes this call
						case 'enter':	pathGrab.startEdit(); break;
					}
				}
				switch (key) {
					case 'delete':
					case 'backspace':	await this.paths_rebuild_traverse_remoteDelete(get(s_paths_grabbed)); break;
				}
			}
			if (pathGrab) {
				switch (key) {
					case '/':			needsRebuild = pathGrab.becomeHere(); break;
					case 'arrowright':	event.preventDefault(); await this.path_rebuild_remoteMoveRight(pathGrab, true, SHIFT, OPTION, EXTREME); break;
					case 'arrowleft':	event.preventDefault(); await this.path_rebuild_remoteMoveRight(pathGrab, false, SHIFT, OPTION, EXTREME); break;
				}
			}
			switch (key) {
				case '!':				needsRebuild = g.rootPath?.becomeHere(); break;
				case '`':               event.preventDefault(); this.latestPathGrabbed_toggleToolsCluster(); break;
				case 'arrowup':			await this.latestPathGrabbed_rebuild_remoteMoveUp(true, SHIFT, OPTION, EXTREME); break;
				case 'arrowdown':		await this.latestPathGrabbed_rebuild_remoteMoveUp(false, SHIFT, OPTION, EXTREME); break;
			}
			if (needsRebuild) {
				signals.signal_rebuildWidgets_fromHere();
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
		if (path) {
			this.path_rebuild_remoteMoveUp(path, up, SHIFT, OPTION, EXTREME);
		}
	}

	latestPathGrabbed_toggleToolsCluster(up: boolean = true) {
		const path = this.grabs.latestPathGrabbed(up);
		if (path && !path.isRoot) {
			s_path_toolsCluster.set(path.toolsGrabbed ? null : path);
			signals.signal_rebuildWidgets_fromHere();
		}
	}

	thing_to_get_byRelationshipHID(hid: number | null): Thing | null {
		if (hid) {
			const relationship = this.relationship_get_byHID(hid);
			if (relationship) {
				return this.thing_byHID[relationship.idTo.hash()];
			}
		}
		return g.root;
	}
	
	static readonly $_THINGS_$: unique symbol;

	things_get_byPath(path: Path): Array<Thing | null> {
		const root = g.root;
		const things: Array<Thing | null> = root ? [root] : [];
		for (const hid of path.hashedIDs) {
			const thing = this.relationship_get_byHID(hid)?.toThing || null;
			things.push(thing);
		}
		return things;
	}

	things_get_byPaths(paths: Array<Path>): Array<Thing> {
		const things = Array<Thing>();
		for (const path of paths) {
			const thing = this.thing_get_byPath(path);
			if (thing) {
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
		let relationship = this.relationship_get_whereIDEqualsTo(child.id);
		if (relationship && relationship.idFrom == fromParent.id) {
			this.relationship_forget(relationship);
			relationship.idFrom = toParent.id;
			this.relationship_remember(relationship);
			relationship.remoteWrite();
		}
	}

	thing_forget(thing: Thing) {
		delete this.thing_byHID[thing.hashedID];
		this.things = this.things.filter((thing) => thing.id !== thing.id);
		this.things_byTrait[thing.trait] = this.things_byTrait[thing.trait].filter((thing) => thing.id !== thing.id);
	}

	async thing_edit_remoteAddLine(path: Path, below: boolean = true) {
		const parentPath = path.fromPath;
		const parent = parentPath?.thing;
		const thing = path.thing;
		if (thing && parent && parentPath) {
			const order = path.order + (below ? 0.5 : -0.5);
			const child = this.thing_runtimeCreate(thing.baseID, null, k.title_line, parent.color, '', false);
			await this.path_edit_remoteAddAsChild(parentPath, child, order, false);
		}
	}

	thing_remember_runtimeCreateUnique(baseID: string, id: string | null, title: string, color: string, trait: string,
		isRemotelyStored: boolean): Thing {
		let thing = this.thing_get_byHID(id?.hash() ?? null);
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

	async thing_remember_runtimeCopy(baseID: string, from: Thing) {
		const newThing = new Thing(baseID, null, from.title, from.color, from.trait, false);
		const prohibitedTraits: Array<string> = [IDTrait.roots, IDTrait.root, IDTrait.bulk];
		if (prohibitedTraits.includes(from.trait)) {
			newThing.trait = '';
		}
		this.thing_remember(newThing);
		return newThing;
	}

	async thing_edit_remoteDuplicate(path: Path) {
		const thing = path.thing;
		const id = thing?.id;
		const parentPath = path.fromPath;
		if (thing && id && parentPath) {
			const sibling = await this.thing_remember_runtimeCopy(id, thing);
			sibling.title = 'idea';
			await this.path_edit_remoteAddAsChild(parentPath, sibling, path.order + 0.5);
		}
	}

	thing_remember(thing: Thing) {
		if (this.thing_byHID[thing.hashedID] == null) {
			this.thing_byHID[thing.hashedID] = thing;
			let things = this.things_byTrait[thing.trait] ?? [];
			things.push(thing);
			this.things_byTrait[thing.trait] = things;
			this.things.push(thing);
			if (thing.trait == IDTrait.root && (thing.baseID == '' || thing.baseID == this.db.baseID)) {
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
		const thing = this.thing_bulkAlias_get_byTitle(baseID);
		if (thing) {
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

	thing_bulkAlias_get_byTitle(title: string | null) {
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
		const thing = path.thing;
		if (thing && newParent) {
			const baseID = newParent.isBulkAlias ? newParent.title : newParent.baseID;
			const newThing = await this.thing_remember_runtimeCopy(baseID, thing);
			const newThingPath = newParentPath.appendChild(newThing);
			await this.path_remember_remoteAddAsChild(newParentPath, newThing);
			for (const childPath of path.childPaths) {
				this.thing_remember_bulk_recursive_remoteRelocateRight(childPath, newThingPath);
			}
			if (!newThingPath.isExpanded) {
				setTimeout(() => {
					newThingPath.expand();	
					path.collapse();
				}, 2);
			}
			await this.path_forget_remoteUpdate(path);
			return newThingPath;
		}
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
		this.relationships_byPredicate = {};
		this.relationships_byFrom = {};
		this.relationships_byTo = {};
		this.relationship_byHID = {};
		this.relationships = [];
	}

	relationships_get_byPredicate_to_thing(idPredicate: string, to: boolean, idThing: string): Array<Relationship> {
		const dict = to ? this.relationships_byTo : this.relationships_byFrom;
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

	relationship_get_byPredicate_from_to(idPredicate: string, idFrom: string, idTo: string): Relationship | null {
		const matches = this.relationships_get_byPredicate_to_thing(idPredicate, false, idFrom);
		if (Array.isArray(matches)) {
			for (const relationship of matches) {
				if (relationship.idTo == idTo) {
					return relationship;
				}
			}
		}
		return null;
	}

	async relationships_remoteCreateMissing(parentID: string | null, baseID: string) {
		const startingID = parentID ?? this.idRoot;
		if (startingID) {
			for (const thing of this.things) {
				const idThing = thing.id;
				if (idThing != startingID && thing.trait != IDTrait.root && thing.baseID == baseID) {
					let relationship = this.relationship_get_whereIDEqualsTo(idThing);
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
			const thingTo = relationship.toThing;
			const thingFrom = relationship.fromThing;
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

	relationship_get_byHID(hid: number): Relationship | null { return this.relationship_byHID[hid]; }

	relationship_rememberByKnown(relationships: Relationships_ByHID, relationship: Relationship, id: string) {
		if (!id) {
			u.noop();
		} else {
			const hid = id.hash();
			let array = relationships[hid] ?? [];
			array.push(relationship);
			if (!relationship.toThing) {
				console.log('missing TO thing');
			}
			relationships[hid] = array;
		}
	}
	
	relationship_remember(relationship: Relationship) {
		// console.log(`RELATIONSHIP ${relationship.fromThing?.title} => ${relationship.toThing?.title}`);
		if (!this.relationship_byHID[relationship.hashedID]) {
			if (relationship.baseID != this.db.baseID) {
				debug.log_error(`RELATIONSHIP off base: ${relationship.baseID} ${relationship.fromThing?.description} => ${relationship.toThing?.description}`);
			}
			this.relationships.push(relationship);
			this.relationship_byHID[relationship.hashedID] = relationship;
			this.relationship_rememberByKnown(this.relationships_byTo, relationship, relationship.idTo);
			this.relationship_rememberByKnown(this.relationships_byFrom, relationship, relationship.idFrom);
			this.relationship_rememberByKnown(this.relationships_byPredicate, relationship, relationship.idPredicate);
		}
	}

	async relationship_forget_remoteRemove(path: Path, otherPath: Path) {
		const thing = path.thing;
		const fromPath = path.fromPath;
		const relationship = this.relationship_get_byPredicate_from_to(Predicate.idContains, otherPath.idThing, path.idThing);
		if (fromPath && relationship && (thing?.parents.length ?? 0) > 1) {
			this.relationship_forget(relationship);
			if (otherPath.hasChildren) {
				fromPath.order_normalizeRecursive_remoteMaybe(true);
			} else {
				otherPath.collapse();
			}
			await this.db.relationship_remoteDelete(relationship);
		}
	}

	relationship_forget_byHID(relationships: Relationships_ByHID, hid: number, relationship: Relationship) {
		let array = relationships[hid] ?? [];
		u.remove<Relationship>(array, relationship)
		relationships[hid] = array;
	}

	relationship_forget(relationship: Relationship) {
		u.remove<Relationship>(this.relationships, relationship);
		delete this.relationship_byHID[relationship.hashedID];
		this.relationship_forget_byHID(this.relationships_byTo, relationship.idTo.hash(), relationship);
		this.relationship_forget_byHID(this.relationships_byFrom, relationship.idFrom.hash(), relationship);
		this.relationship_forget_byHID(this.relationships_byPredicate, relationship.idPredicate.hash(), relationship);
	}

	relationship_get_whereIDEqualsTo(idThing: string, to: boolean = true) {
		const idPredicateContains = Predicate.idContains;
		const matches = this.relationships_get_byPredicate_to_thing(idPredicateContains, to, idThing);
		if (matches.length > 0) {
			const relationship = matches[0];
			return relationship;
		}
		return null;
	}

	relationship_remember_runtimeCreateUnique(baseID: string, idRelationship: string, idPredicate: string, idFrom: string,
		idTo: string, order: number, creationOptions: CreationOptions = CreationOptions.none) {
		if (idRelationship == 'FqhFXEEnhs5qSKy1OgCG') {
			u.noop();
		}
		let relationship = this.relationship_get_byPredicate_from_to(idPredicate, idFrom, idTo);
		if (relationship) {
			relationship.order_setTo(order);						// AND thing are updated
		} else {
			relationship = new Relationship(baseID, idRelationship, idPredicate, idFrom, idTo, order, creationOptions != CreationOptions.none);
			this.relationship_remember(relationship);
		}
		return relationship;
	}

	async relationship_remember_remoteCreateUnique(baseID: string, idRelationship: string | null, idPredicate: string, idFrom: string,
		idTo: string, order: number, creationOptions: CreationOptions = CreationOptions.isFromRemote): Promise<any> {
		let relationship = this.relationship_get_byPredicate_from_to(idPredicate, idFrom, idTo);
		if (relationship) {
			relationship.order_setTo(order, true);						// AND thing are updated
		} else {
			relationship = new Relationship(baseID, idRelationship, idPredicate, idFrom, idTo, order, creationOptions != CreationOptions.none);
			await this.db.relationship_remember_remoteCreate(relationship);
			this.relationship_remember(relationship);
		}
		return relationship;
	}

	static readonly $_PATHS_$: unique symbol;

	async paths_rebuild_traverse_remoteDelete(paths: Array<Path>) {
		let needsRebuild = false;
		if (get(s_path_here)) {
			for (const path of paths) {
				const thing = path.thing;
				const fromPath = path.fromPath;
				const fromFromPath = fromPath.fromPath;
				let fromThing = fromPath.thing;
				if (thing && fromThing && fromPath && fromFromPath && path && !path.isEditing && !thing.isBulkAlias) {
					const siblings = fromPath.children;
					let index = siblings.indexOf(thing);
					siblings.splice(index, 1);
					fromPath.grabOnly();
					if (siblings.length == 0) {
						needsRebuild = fromPath.collapse();
						if (!fromFromPath.isVisible) {
							needsRebuild = fromFromPath.becomeHere();	// call become here before applying
						}
					}
					await path.traverse_async(async (progenyPath: Path): Promise<boolean> => {
						await this.path_forget_remoteUpdate(progenyPath);
						return false; // continue the traversal
					});
				}
			}
			if (needsRebuild) {
				signals.signal_rebuildWidgets_fromHere();
			}
		}
	}

	static readonly $_PATH_$: unique symbol;

	path_remember_unique(pathString: string = ''): Path {
		const hashedPath = pathString.hash();
		let path = this.path_byHash[hashedPath];
		if (!path) {
			path = new Path(pathString);
			this.path_byHash[hashedPath] = path;
		}
		return path;
	}

	async path_get_roots() {		// TODO: assumes all paths created
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
		const toolsPath = get(s_path_toolsCluster);
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
			signals.signal_relayoutWidgets_fromHere();
			s_path_toolsCluster.set(path);
		}
	}

	async path_edit_remoteCreateChildOf(fromPath: Path | null) {
		const fromThing = fromPath?.thing;
		if (fromThing && fromPath) {
			const child = await this.thing_remember_runtimeCopy(fromThing.baseID, fromThing);
			child.title = 'idea';
			fromPath.expand();
			await this.path_edit_remoteAddAsChild(fromPath, child, 0);
		}
	}

	async path_edit_remoteAddAsChild(fromPath: Path, child: Thing, order: number, shouldStartEdit: boolean = true) {
		const childPath = await this.path_remember_remoteAddAsChild(fromPath, child);
		childPath.grabOnly();
		childPath.relationship?.order_setTo(order);
		signals.signal_rebuildWidgets_fromHere();
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
				signals.signal_rebuildWidgets_fromHere();
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
		if (thing) {
			const array = this.relationships_byTo[thing.hashedID];
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

	async path_remember_remoteAddAsChild(fromPath: Path, toThing: Thing): Promise<any> {
		const fromThing = fromPath.thing;
		if (fromThing && !toThing.isBulkAlias) {
			const isBulkAlias = fromThing.isBulkAlias;
			const idPredicateContains = Predicate.idContains;
			const fromID = fromThing.idBridging;
			const changingBulk = isBulkAlias || toThing.baseID != this.db.baseID;
			const baseID = changingBulk ? toThing.baseID : fromThing.baseID;
			if (changingBulk) {
				console.log('changingBulk');
			}
			if (!toThing.isRemotelyStored) {	
				await this.db.thing_remember_remoteCreate(toThing);			// for everything below, need to await toThing.id fetched from dbDispatch
			}
			const relationship = await this.relationship_remember_remoteCreateUnique(baseID, null, idPredicateContains, fromID, toThing.id, 0, CreationOptions.getRemoteID);
			const childPath = fromPath.appendID(relationship.id);
			await u.paths_orders_normalize_remoteMaybe(fromPath.childPaths);		// write new order values for relationships
			return childPath;
		}
	}

	async path_rebuild_remoteMoveRight(path: Path, RIGHT: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean, fromReveal: boolean = false) {
		if (!OPTION) {
			const thing = path.thing;
			if (thing) {
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
		const thing = this.thing_get_byPath(path);
		const fromPath = path.fromPath;
		const siblings = fromPath.children;
		if (!siblings || siblings.length == 0) {
			this.path_rebuild_runtimeBrowseRight(path, true, EXTREME, up);
		} else if (thing) {
			const index = siblings.indexOf(thing);
			const newIndex = index.increment(!up, siblings.length);
			if (fromPath && !OPTION) {
				const grabPath = fromPath.appendChild(siblings[newIndex]);
				if (get(s_layout_asCircles)) {
					grabPath.becomeHere();
				} else if (!grabPath.isVisible) {
					fromPath.becomeHere();
				}
				if (SHIFT) {
					grabPath.toggleGrab();
				} else {
					grabPath.grabOnly();
				}
				signals.signal_relayoutWidgets_fromHere();
			} else if (k.allow_GraphEditing && OPTION) {
				await u.paths_orders_normalize_remoteMaybe(fromPath.childPaths, false);
				const wrapped = up ? (index == 0) : (index == siblings.length - 1);
				const goose = ((wrapped == up) ? 1 : -1) * k.halfIncrement;
				const newOrder = newIndex + goose;
				path.relationship?.order_setTo(newOrder);
				await u.paths_orders_normalize_remoteMaybe(fromPath.childPaths);
				signals.signal_rebuildWidgets_fromHere();
			}
		}
	}

	async path_rebuild_remoteRelocateRight(path: Path, RIGHT: boolean, EXTREME: boolean) {
		const thing = path.thing;
		const newParentPath = RIGHT ? path.path_ofNextSibling(false) : path.stripBack(2);
		const newParent = newParentPath?.thing;
		if (thing && newParent && newParentPath) {
			if (thing.isInDifferentBulkThan(newParent)) {		// should move across bulks
				this.path_remember_bulk_remoteRelocateRight(path, newParentPath);
			} else {
				const relationship = path.relationship;
				if (relationship) {
					const order = RIGHT ? relationship.order : 0;
					relationship.idFrom = newParent.id;
					await relationship.order_setTo(order + 0.5, true);
				}
				this.relationships_refreshKnowns();
				newParentPath.appendChild(thing).grabOnly();
				g.rootPath.order_normalizeRecursive_remoteMaybe(true);
				if (!newParentPath.isExpanded) {
					newParentPath.expand();
				}
				if (!newParentPath.isVisible) {
					newParentPath.becomeHere();
				}
			}
			signals.signal_rebuildWidgets_fromHere();			// so Children component will update
		}
	}

	path_rebuild_runtimeBrowseRight(path: Path, RIGHT: boolean, SHIFT: boolean, EXTREME: boolean, fromReveal: boolean = false) {
		let needsRebuild = false;
		const newParentPath = path.fromPath;
		const childPath = path.appendChild(path.firstChild);
		let newGrabPath: Path | null = RIGHT ? childPath : newParentPath;
		const newGrabIsNotHere = !newGrabPath?.isHere;
		const newHerePath = newParentPath;
		if (RIGHT) {
			if (path.hasChildren) {
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
				needsRebuild = rootPath?.becomeHere();	// tells graph to update line rects
			} else {
				if (!SHIFT) {
					if (fromReveal) {
						if (!path.isExpanded) {
							needsRebuild = path.expand();
						}
					} else {
						if (newGrabIsNotHere && newGrabPath && !newGrabPath.isExpanded) {
							needsRebuild = newGrabPath.expand();
						}
					}
				} else if (newGrabPath) { 
					if (path.isExpanded) {
						needsRebuild = path.collapse();
						newGrabPath = this.grabs.areInvisible ? path : null;
					} else if (!newGrabPath.matchesPath(rootPath)) {
						needsRebuild = newGrabPath.collapse();
					}
				}
			}
		}
		s_title_editing.set(null);
		newGrabPath?.grabOnly();
		const allowToBecomeHere = (!SHIFT || path.fromPath.matchesPath(newGrabPath)) && newGrabIsNotHere; 
		const shouldBecomeHere = !newHerePath?.isVisible || newHerePath.isRoot;
		if (!RIGHT && allowToBecomeHere && shouldBecomeHere && (newHerePath?.becomeHere() ?? false)) {
			needsRebuild = true;
		}
		if (needsRebuild) {
			signals.signal_rebuildWidgets_fromHere();
		} else {
			signals.signal_relayoutWidgets_fromHere();
		}
	}

	async path_alterMaybe(path: Path) {
		const alteration = get(s_altering_parent);
		if (path.things_canAlter_asParentOf_toolsGrab) {
			const toolsPath = get(s_path_toolsCluster);
			const toolsThing = toolsPath?.thing;
			if (toolsPath && toolsThing) {
				s_altering_parent.set(null);
				s_path_toolsCluster.set(null);
				switch (alteration) {
					case AlteringParent.deleting:
						await this.relationship_forget_remoteRemove(toolsPath, path);
						break;
					case AlteringParent.adding:
						await this.path_remember_remoteAddAsChild(path, toolsThing);
						signals.signal_rebuildWidgets_fromHere();
						break;
				}
			}
		}
	}

	static readonly $_ANCILLARY_$: unique symbol;

	predicate_get_byID(idPredicate: string | null): Predicate | null {
		return (!idPredicate) ? null : this.predicate_byHID[idPredicate.hash()];
	}

	predicate_remember(predicate: Predicate) {
		this.predicate_byHID[predicate.hashedID] = predicate;
		this.predicate_byKind[predicate.kind] = predicate;
		this.predicates.push(predicate);
	}

	predicate_remember_runtimeCreateUnique(id: string, kind: string, isRemotelyStored: boolean = true) {
		if (!this.predicate_get_byID(id)) {
			this.predicate_remember_runtimeCreate(id, kind, isRemotelyStored);
		}
	}

	predicate_remember_runtimeCreate(id: string, kind: string, isRemotelyStored: boolean = true) {
		const predicate = new Predicate(id, kind, isRemotelyStored);
		this.predicate_remember(predicate)
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
		const hash = path.hashedPath;
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

	async add_missing_removeNulls(parentID: string | null, baseID: string) {
		await this.relationships_remoteCreateMissing(parentID, baseID);
		await this.relationships_removeHavingNullReferences();
	}

	toggleAlteration(alteration: AlteringParent) {
		s_altering_parent.set((get(s_altering_parent) == alteration) ? null : alteration);
	}

}
