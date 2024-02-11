import { s_isBusy, s_path_here, s_paths_grabbed, s_things_arrived, s_title_editing, s_altering_parent, s_path_toolsCluster } from './State';
import { k, u, get, User, Path, Thing, Grabs, debug, Access, IDTrait, IDTool, signals, Wrapper } from '../common/GlobalImports';
import { Predicate, Relationship, persistLocal, AlteringParent, CreationOptions } from '../common/GlobalImports';
import DBInterface from '../db/DBInterface';

type KnownRelationships = { [hID: number]: Array<Relationship> }

export default class Hierarchy {
	knownU_byHID: { [h: number]: User } = {};
	knownT_byHID: { [h: number]: Thing } = {};
	knownA_byHID: { [h: number]: Access } = {};
	knownA_byKind: { [k: string]: Access } = {};
	knownPath_byHash: { [h: number]: Path } = {};
	knownP_byHID: { [h: number]: Predicate } = {};
	knownP_byKind: { [k: string]: Predicate } = {};
	knownR_byHID: { [h: number]: Relationship } = {};
	knownWs_byTypeAndPath: { [t: string]: { [h: number]: Wrapper } } = {};
	knownTs_byTrait: { [trait: string]: Array<Thing> } = {};
	knownRs_byHIDPredicate: KnownRelationships = {};
	knownRs_byHIDFrom: KnownRelationships = {};
	knownRs_byHIDTo: KnownRelationships = {};
	knownRs: Array<Relationship> = [];
	knownPs: Array<Predicate> = [];
	knownTs: Array<Thing> = [];
	herePath: Path | null = null;
	_grabs: Grabs | null = null;
	root: Thing | null = null;
	isAssembled = false;
	db: DBInterface;

	get hasNothing(): boolean { return !this.root; }
	get idRoot(): string | null { return this.root?.id ?? null; };
	thing_getForPath(path: Path | null): Thing | null { return path?.thing ?? null; }
	thing_getForHID(hID: number | null): Thing | null { return (!hID) ? null : this.knownT_byHID[hID]; }

	constructor(db: DBInterface) {
		this.db = db;
		s_path_here.subscribe((path: Path | null) => {
			if (this.db && this.db.hasData) { // make sure this.db has not become null
				this.herePath = path;
			}
		})
	}
	
	async hierarchy_assemble(type: string) {
		await this.fetchAll(null, this.db.baseID);
		persistLocal.paths_restore();
		this.paths_subscriptions_setup();
		this.here_restore();
		this.db.setHasData(true);
		s_things_arrived.set(true);
		s_isBusy.set(false);
		this.isAssembled = true;
	}

	async handleToolClicked(IDButton: string) {
		const path = get(s_path_toolsCluster);
		if (path) {
			switch (IDButton) {
				case IDTool.next: this.path_relayout_toolCluster_nextParent(); return;
				case IDTool.add: await this.path_edit_remoteCreateChildOf(path); break;
				case IDTool.addParent: this.toggleAlteration(AlteringParent.adding); return;
				case IDTool.deleteParent: this.toggleAlteration(AlteringParent.deleting); return;
				case IDTool.delete: await this.paths_rebuild_traverse_remoteDelete([path]); break;
				case IDTool.more: console.log('needs more'); break;
				default: break;
			}
			s_path_toolsCluster.set(null);
			signals.signal_relayout_fromHere();
		}
	}

	async handleKeyDown(event: KeyboardEvent) {
		let pathGrab = this.grabs.latestPathGrabbed(true);
		if (event.type == 'keydown') {
			const OPTION = event.altKey;
			const SHIFT = event.shiftKey;
			const COMMAND = event.metaKey;
			const EXTREME = SHIFT && OPTION;
			const key = event.key.toLowerCase();
			const rootPath = k.rootPath;
			let needsRebuild = false;
			if (!pathGrab) {
				needsRebuild = rootPath.becomeHere();
				rootPath.grabOnly();		// update crumbs and dots
				pathGrab = rootPath;
			}
			if (k.allowGraphEditing) {
				if (pathGrab && k.allowTitleEditing) {
					switch (key) {
						case 'd':		await this.thing_edit_remoteDuplicate(pathGrab); break;
						case ' ':		await this.path_edit_remoteCreateChildOf(pathGrab); break;
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
					case '/':			needsRebuild = needsRebuild || pathGrab.becomeHere(); break;
					case 'arrowright':	await this.path_rebuild_remoteMoveRight(pathGrab, true, SHIFT, OPTION, EXTREME); break;
					case 'arrowleft':	event.preventDefault(); await this.path_rebuild_remoteMoveRight(pathGrab, false, SHIFT, OPTION, EXTREME); break;
				}
			}
			switch (key) {
				case '!':				needsRebuild = needsRebuild || k.rootPath?.becomeHere(); break;
				case '`':               event.preventDefault(); this.latestPathGrabbed_toggleToolsCluster(); break;
				case 'arrowup':			await this.latestPathGrabbed_rebuild_remoteMoveUp(true, SHIFT, OPTION, EXTREME); break;
				case 'arrowdown':		await this.latestPathGrabbed_rebuild_remoteMoveUp(false, SHIFT, OPTION, EXTREME); break;
			}
			if (needsRebuild) {
				signals.signal_rebuild_fromHere();
			}
		}
	}

	async fetchAll(parentID: string | null, baseID: string) {
		await this.db.fetch_allFrom(baseID)
		await this.relationships_remoteCreateMissing(parentID, baseID);
		await this.relationships_removeHavingNullReferences();
	}

	here_restore() {
		let here = this.thing_getForPath(this.herePath);
		if (here == null) {
			this.herePath = this.grabs.path_lastGrabbed?.fromPath ?? k.rootPath;
		}
		this.herePath?.becomeHere();
	}

	toggleAlteration(alteration: AlteringParent) {
		s_altering_parent.set((get(s_altering_parent) == alteration) ? null : alteration);
	}

	//////////////////////////////
	//			 GRABS			//
	//////////////////////////////

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
			signals.signal_rebuild_fromHere();
		}
	}

	thing_to_getForRelationshipHID(hID: number | null): Thing | null {
		if (hID) {
			const relationship = this.relationship_getForHID(hID);
			if (relationship) {
				return this.knownT_byHID[relationship.idTo.hash()];
			}
		}
		return this.root;
	}

	//////////////////////////////
	//			THINGS			//
	//////////////////////////////

	things_getForPath(path: Path): Array<Thing> {
		const things = Array<Thing>();
		for (const hid of path.hashedIDs) {
			const thing = this.relationship_getForHID(hid)?.thing(true);
			if (thing) {
				things.push(thing);
			}
		}
		return things;
	}

	things_getForPaths(paths: Array<Path>): Array<Thing> {
		const things = Array<Thing>();
		for (const path of paths) {
			const thing = this.thing_getForPath(path);
			if (thing) {
				things.push(thing);
			}
		}
		return things;
	}

	things_forgetAll() {
		this.knownTs = []; // clear
		this.knownT_byHID = {};
		this.knownTs_byTrait = {};
	}

	//////////////////////////////
	//			THING			//
	//////////////////////////////

	async thing_remember_remoteRelocateChild(child: Thing, fromParent: Thing, toParent: Thing): Promise<any> {
		let relationship = this.relationship_getWhereIDEqualsTo(child.id);
		if (relationship && relationship.idFrom == fromParent.id) {
			this.relationship_forget(relationship);
			relationship.idFrom = toParent.id;
			this.relationship_remember(relationship);
			relationship.remoteWrite();
		}
	}

	thing_forget(thing: Thing) {
		delete this.knownT_byHID[thing.hashedID];
		this.knownTs = this.knownTs.filter((knownT) => knownT.id !== thing.id);
		this.knownTs_byTrait[thing.trait] = this.knownTs_byTrait[thing.trait].filter((knownT) => knownT.id !== thing.id);
	}

	async thing_edit_remoteAddLine(path: Path, below: boolean = true) {
		const parentPath = path.fromPath;
		const parent = parentPath?.thing;
		const thing = path.thing;
		if (thing && parent && parentPath) {
			const order = path.order + (below ? 0.5 : -0.5);
			const child = this.thing_runtimeCreate(thing.baseID, null, k.lineTitle, parent.color, '', false);
			await this.path_edit_remoteAddAsChild(parentPath, child, order, false);
		}
	}

	thing_remember_runtimeCreate(baseID: string, id: string | null, title: string, color: string, trait: string,
		isRemotelyStored: boolean): Thing {
		const thing = this.thing_runtimeCreate(baseID, id, title, color, trait, isRemotelyStored);
		this.thing_remember(thing);
		return thing;
	}

	async thing_remember_runtimeCopy(baseID: string, from: Thing) {
		const newThing = new Thing(baseID, null, from.title, from.color, from.trait, false);
		if (newThing.isBulkAlias || newThing.trait == IDTrait.roots || newThing.trait == IDTrait.root) {
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
		if (this.knownT_byHID[thing.hashedID] == null) {
			this.knownT_byHID[thing.hashedID] = thing;
			let things = this.knownTs_byTrait[thing.trait] ?? [];
			things.push(thing);
			this.knownTs_byTrait[thing.trait] = things;
			this.knownTs.push(thing);
			if (thing.trait == IDTrait.root && (thing.baseID == '' || thing.baseID == this.db.baseID)) {
				this.root = thing;
			}
		}
	}

	thing_runtimeCreate(baseID: string, id: string | null, title: string, color: string, trait: string,
		isRemotelyStored: boolean): Thing {
		let thing: Thing | null = null;
		if (id && trait == IDTrait.root && baseID != this.db.baseID) {		// other bulks have their own root & id
			thing = this.thing_bulkRootpath_set(baseID, id, color);				// which our thing needs to adopt
		}
		if (!thing) {
			thing = new Thing(baseID, id, title, color, trait, isRemotelyStored);
			if (baseID != this.db.baseID) {
				u.noop()
			}
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

	//////////////////////////
	//	 	   BULKS		//
	//////////////////////////

	thing_bulkRootpath_set(baseID: string, id: string, color: string) {
		const thing = this.thing_bulkAlias_getForTitle(baseID);
		if (thing) {
			thing.needsBulkFetch = false;	// this id is from bulk fetch all
			thing.bulkRootID = id;			// so children relatiohships will work
			thing.color = color;			// N.B., u trait
			this.knownT_byHID[id.hash()] = thing;
			// this.db.thing_remoteUpdate(thing);		// not needed if bulk id not remotely stored
		}
		return thing;
	}

	thing_bulkAlias_getForTitle(title: string | null) {
		if (title) {
			for (const thing of this.knownTs_byTrait[IDTrait.bulk]) {
				if  (thing.title == title) {							// special case TODO: convert to a auery string
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

	async thing_getRoots() {
		let rootsPath: Path | null = null;
		let rootPath = k.rootPath;
		for (const thing of this.knownTs_byTrait[IDTrait.roots]) {
			if  (thing.title == 'roots') {	// special case TODO: convert to a auery string
				return rootPath.appendChild(thing) ?? null;
			}
		}
		const roots = this.thing_runtimeCreate(this.db.baseID, null, 'roots', 'red', IDTrait.roots, false);
		await this.path_remember_remoteAddAsChild(rootPath, roots).then((path) => { rootsPath = path; });
		return rootsPath;
	}

	////////////////////////////////////
	//		   RELATIONSHIPS		  //
	////////////////////////////////////

	relationships_refreshKnowns() {
		const saved = this.knownRs;
		this.relationships_clearKnowns();
		for (const relationship of saved) {
			this.relationship_remember(relationship);
		}
	}

	relationships_clearKnowns() {
		this.knownRs_byHIDPredicate = {};
		this.knownRs_byHIDFrom = {};
		this.knownRs_byHIDTo = {};
		this.knownR_byHID = {};
		this.knownRs = [];
	}

	relationships_getByPredicateIDToAndID(idPredicate: string, to: boolean, idThing: string): Array<Relationship> {
		const dict = to ? this.knownRs_byHIDTo : this.knownRs_byHIDFrom;
		const matches = dict[idThing.hash()] as Array<Relationship>; // filter out bad values (dunno what this does)
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

	relationship_getByIDPredicateFromAndTo(idPredicate: string, idFrom: string, idTo: string): Relationship | null {
		const matches = this.relationships_getByPredicateIDToAndID(idPredicate, false, idFrom);
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
			for (const thing of this.knownTs) {
				const idThing = thing.id;
				if (idThing != startingID && thing.trait != IDTrait.root && thing.baseID == baseID) {
					let relationship = this.relationship_getWhereIDEqualsTo(idThing);
					if (!relationship) {
						const idPredicateIsAParentOf = Predicate.idIsAParentOf;
						await this.relationship_remember_remoteCreateUnique(baseID, null, idPredicateIsAParentOf,
							startingID, idThing, 0, CreationOptions.getRemoteID)
					}
				}
			}
		}
	}

	async relationships_removeHavingNullReferences() {
		const array = Array<Relationship>();
		for (const relationship of this.knownRs) {
			const thingTo = this.thing_getForHID(relationship.idTo.hash());
			const thingFrom = this.thing_getForHID(relationship.idFrom.hash());
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

	/////////////////////////////////////
	//			RELATIONSHIP		   //
	/////////////////////////////////////

	relationship_getForHID(hID: number): Relationship | null { return this.knownR_byHID[hID]; }

	relationship_rememberByKnown(known: KnownRelationships, hID: number, relationship: Relationship) {
		let array = known[hID] ?? [];
		array.push(relationship);
		known[hID] = array;
	}

	relationship_forgetByKnown(known: KnownRelationships, hID: number, relationship: Relationship) {
		let array = known[hID] ?? [];
		u.remove<Relationship>(array, relationship)
		known[hID] = array;
	}

	relationship_forget(relationship: Relationship) {
		u.remove<Relationship>(this.knownRs, relationship);
		delete this.knownR_byHID[relationship.hashedID];
		this.relationship_forgetByKnown(this.knownRs_byHIDTo, relationship.idTo.hash(), relationship);
		this.relationship_forgetByKnown(this.knownRs_byHIDFrom, relationship.idFrom.hash(), relationship);
		this.relationship_forgetByKnown(this.knownRs_byHIDPredicate, relationship.idPredicate.hash(), relationship);
	}

	relationship_getWhereIDEqualsTo(idThing: string, to: boolean = true) {
		const idPredicateIsAParentOf = Predicate.idIsAParentOf;
		const matches = this.relationships_getByPredicateIDToAndID(idPredicateIsAParentOf, to, idThing);
		if (matches.length > 0) {
			const relationship = matches[0];
			return relationship;
		}
		return null;
	}

	relationship_remember_runtimeCreateUnique(baseID: string, idRelationship: string, idPredicate: string, idFrom: string,
		idTo: string, order: number, creationOptions: CreationOptions = CreationOptions.none) {
		let relationship = this.relationship_getByIDPredicateFromAndTo(idPredicate, idFrom, idTo);
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
		let relationship = this.relationship_getByIDPredicateFromAndTo(idPredicate, idFrom, idTo);
		if (relationship) {
			relationship.order_setTo(order, true);						// AND thing are updated
		} else {
			relationship = new Relationship(baseID, idRelationship, idPredicate, idFrom, idTo, order, creationOptions != CreationOptions.none);
			await this.db.relationship_remember_remoteCreate(relationship);
			this.relationship_remember(relationship);
		}
		return relationship;
	}

	relationship_remember(relationship: Relationship) {
		if (!this.knownR_byHID[relationship.hashedID]) {
			if (relationship.baseID != this.db.baseID) {
				debug.log_error('RELATIONSHIP ' + relationship.baseID + ' ' + this.thing_getForHID(relationship.idFrom.hash())?.description + ' => ' + this.thing_getForHID(relationship.idTo.hash())?.description);
			}
			this.knownRs.push(relationship);
			this.knownR_byHID[relationship.hashedID] = relationship;
			this.relationship_rememberByKnown(this.knownRs_byHIDTo, relationship.idTo.hash(), relationship);
			this.relationship_rememberByKnown(this.knownRs_byHIDFrom, relationship.idFrom.hash(), relationship);
			this.relationship_rememberByKnown(this.knownRs_byHIDPredicate, relationship.idPredicate.hash(), relationship);
		}
	}

	////////////////////////
	//		  PATH		  //
	////////////////////////

	path_unique(pathString: string = ''): Path {
		let path = this.knownPath_byHash[pathString.hash()];
		if (!path) {
			path = new Path(pathString);
			this.knownPath_byHash[pathString.hash()] = path;
		}
		return path;
	}

	async path_relayout_toolCluster_nextParent() {
		const path = get(s_path_toolsCluster)?.next_siblingPath;
		if (path) {
			await path.assureIsVisible();
			path.grabOnly();
			signals.signal_relayout_fromHere();
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
		signals.signal_rebuild_fromHere();
		if (shouldStartEdit) {
			setTimeout(() => {
				childPath.startEdit();
			}, 20);
		}
	}

	async path_redraw_fetchBulk_runtimeBrowseRight(path: Path, grab: boolean = true) {
		const thing = path.thing;
		const rootsPath = await this.thing_getRoots();
		if (thing && rootsPath) {
			path.expand();		// do this before fetch, so next launch will see it
			await this.fetchAll(rootsPath.thingID, thing.title);
			if (path.hasChildren) {
				if (grab) {
					path.childPaths[0].grabOnly()
				}
				if (path.expand()) {
					signals.signal_rebuild_fromHere();
				}
			}
		}
	}

	async path_remember_bulk_remoteRelocateRight(path: Path, newParentPath: Path) {
		const newThingPath = await this.thing_remember_bulk_recursive_remoteRelocateRight(path, newParentPath);
		if (newThingPath) {
			newParentPath.signal_relayout();
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
		delete this.knownPath_byHash[path.pathString.hash()];
		if (thing) {
			const array = this.knownRs_byHIDTo[thing.hashedID];
			if (array) {
				for (const relationship of array) {
					this.relationship_forget(relationship);		// forget first, so onSnapshot logic will not signal children
					await this.db.relationship_remoteDelete(relationship);
				}
			}
			this.thing_forget(thing);							// forget first, so onSnapshot logic will not signal children
			await this.db.thing_remoteDelete(thing);
		}
	}

	async path_remember_remoteAddAsChild(fromPath: Path, toThing: Thing): Promise<any> {
		const fromThing = fromPath.thing;
		if (fromThing) {
			const changingBulk = fromThing.isBulkAlias || toThing.baseID != this.db.baseID;
			const baseID = changingBulk ? toThing.baseID : fromThing.baseID;
			const idPredicateIsAParentOf = Predicate.idIsAParentOf;
			const fromID = fromThing.idForChildren;
			if (!toThing.isRemotelyStored) {	
				await this.db.thing_remember_remoteCreate(toThing);			// for everything below, need to await toThing.id fetched from dbDispatch
			}
			const relationship = await this.relationship_remember_remoteCreateUnique(baseID, null, idPredicateIsAParentOf, fromID, toThing.id, 0, CreationOptions.getRemoteID);
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
					await this.path_redraw_fetchBulk_runtimeBrowseRight(path);
				} else {
					this.path_rebuild_runtimeBrowseRight(path, RIGHT, SHIFT, EXTREME, fromReveal);
				}
			}
		} else if (k.allowGraphEditing) {
			const grab = this.grabs.latestPathGrabbed(true);
			if (grab) {
				await this.path_rebuild_remoteRelocateRight(grab, RIGHT, EXTREME);
			}
		}
	}

	async path_rebuild_remoteMoveUp(path: Path, up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean) {
		const thing = this.thing_getForPath(path);
		const fromPath = path.fromPath;
		const siblings = fromPath.children;
		if (!siblings || siblings.length == 0) {
			this.path_rebuild_runtimeBrowseRight(path, true, EXTREME, up);
		} else if (thing) {
			const index = siblings.indexOf(thing);
			const newIndex = index.increment(!up, siblings.length);
			if (fromPath && !OPTION) {
				const grabPath = fromPath.appendChild(siblings[newIndex]);
				if (!grabPath.isVisible) {
					grabPath.fromPath?.becomeHere();
				}
				if (SHIFT) {
					grabPath.toggleGrab();
				} else {
					grabPath.grabOnly();
				}
				signals.signal_relayout_fromHere();
			} else if (k.allowGraphEditing && OPTION) {
				await u.paths_orders_normalize_remoteMaybe(fromPath.childPaths, false);
				const wrapped = up ? (index == 0) : (index == siblings.length - 1);
				const goose = ((wrapped == up) ? 1 : -1) * k.halfIncrement;
				const newOrder = newIndex + goose;
				path.relationship?.order_setTo(newOrder);
				await u.paths_orders_normalize_remoteMaybe(fromPath.childPaths);
				signals.signal_rebuild_fromHere();
			}
		}
	}

	async path_rebuild_remoteRelocateRight(path: Path, RIGHT: boolean, EXTREME: boolean) {
		const thing = path.thing;
		const newParentPath = RIGHT ? path.path_ofNextSibling(false) : path.stripBack(2);
		const newParent = newParentPath?.thing;
		if (thing && newParent && newParentPath) {
			if (thing.thing_isInDifferentBulkThan(newParent)) {		// should move across bulks
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
				k.rootPath.order_normalizeRecursive_remoteMaybe(true);
				if (!newParentPath.isExpanded) {
					newParentPath.expand();
				}
				if (!newParentPath.isVisible) {
					newParentPath.becomeHere();
				}
			}
			signals.signal_rebuild_fromHere();			// so Children component will update
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
			const rootPath = k.rootPath;
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
						newGrabPath = null;
					} else if (newGrabPath.matchesPath(rootPath)) {
						newGrabPath = null;
					} else {
						needsRebuild = newGrabPath.collapse();
					}
				}
			}
		}
		s_title_editing.set(null);
		newGrabPath?.grabOnly();
		const allowToBecomeHere = (!SHIFT || path.fromPath.matchesPath(newGrabPath)) && newGrabIsNotHere; 
		const shouldBecomeHere = !newHerePath?.isVisible || newHerePath.isRoot;
		if (!RIGHT && allowToBecomeHere && shouldBecomeHere && newHerePath?.becomeHere()) {
			needsRebuild = true;
		}
		if (needsRebuild) {
			signals.signal_rebuild_fromHere();
		} else {
			signals.signal_relayout_fromHere();
		}
	}

	async relationship_forget_remoteRemove(path: Path, otherPath: Path) {
		const thing = path.thing;
		const fromPath = path.fromPath;
		const relationship = this.relationship_getByIDPredicateFromAndTo(Predicate.idIsAParentOf, otherPath.thingID, path.thingID);
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
						signals.signal_rebuild_fromHere();
						break;
				}
			}
		}
	}	
	////////////////////////
	//		  PATHS		  //
	////////////////////////

	paths_subscriptions_setup() {
		for (const path of Object.values(this.knownPath_byHash)) {
			path.subscriptions_setup();
		}
	}

	async paths_rebuild_traverse_remoteDelete(paths: Array<Path>) {
		let needsRebuild = false;
		if (this.herePath) {
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
					}
					if (!fromFromPath.isVisible) {
						needsRebuild = needsRebuild || fromFromPath.becomeHere();
					}
					await path.traverse_async(async (progenyPath: Path): Promise<boolean> => {
						await this.path_forget_remoteUpdate(progenyPath);
						return false; // continue the traversal
					});
				}
			}
			if (needsRebuild) {
				signals.signal_rebuild_fromHere();
			}
		}
	}

	//////////////////////////////////////
	//			ANCILLARY DATA			//
	//////////////////////////////////////

	predicate_getForID(idPredicate: string | null): Predicate | null {
		return (!idPredicate) ? null : this.knownP_byHID[idPredicate.hash()];
	}

	predicate_remember(predicate: Predicate) {
		this.knownP_byHID[predicate.hashedID] = predicate;
		this.knownP_byKind[predicate.kind] = predicate;
		this.knownPs.push(predicate);
	}

	predicate_remember_runtimeCreate(id: string, kind: string, isRemotelyStored: boolean = true) {
		const predicate = new Predicate(id, kind, isRemotelyStored);
		this.predicate_remember(predicate)
	}

	access_runtimeCreate(idAccess: string, kind: string) {
		const access = new Access(idAccess, kind);
		this.knownA_byKind[kind] = access;
		this.knownA_byHID[idAccess.hash()] = access;
	}

	user_runtimeCreate(id: string, name: string, email: string, phone: string) {
		const user = new User(id, name, email, phone);
		this.knownU_byHID[id.hash()] = user;
	}

	wrapper_add(wrapper: Wrapper) {
		const path = wrapper.path
		const hash = path.hashedPath;
		const dict = this.knownWs_byTypeAndPath[wrapper.type] ?? {};
		dict[hash] = wrapper;
		this.knownWs_byTypeAndPath[wrapper.type] = dict;
	}

}
