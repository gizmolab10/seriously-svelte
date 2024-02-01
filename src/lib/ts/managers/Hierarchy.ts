import { s_isBusy, s_path_here, s_paths_grabbed, s_things_arrived, s_title_editing, s_altering_parent, s_path_toolsCluster } from './State';
import { k, u, get, User, Path, Paths, Thing, Grabs, debug, Access, signals, TraitType, Predicate } from '../common/GlobalImports';
import { Relations, Relationship, persistLocal, AlteringParent, CreationOptions, ClusterToolType } from '../common/GlobalImports';
import DBInterface from '../db/DBInterface';

type KnownRelationships = { [hID: number]: Array<Relationship> }

export default class Hierarchy {
	knownU_byHID: { [hID: number]: User } = {};
	knownT_byHID: { [hID: number]: Thing } = {};
	knownA_byHID: { [hID: number]: Access } = {};
	knownP_byHID: { [hID: number]: Predicate } = {};
	knownR_byHID: { [hID: number]: Relationship } = {};
	knownA_byKind: { [kind: string]: Access } = {};
	knownP_byKind: { [kind: string]: Predicate } = {};
	knownPath_byPathStringHash: { [hID: number]: Path } = {};
	knownPaths_toThingHID: { [hID: number]: Array<Path> } = {};
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
	isConstructed = false;
	db: DBInterface;

	get hasNothing(): boolean { return !this.root; }
	get idRoot(): (string | null) { return this.root?.id ?? null; }; // undefined --> null
	thing_getForHID(hID: number | null): Thing | null { return (!hID) ? null : this.knownT_byHID[hID]; }
	thing_getForPath(path: Path | null, back: number = 1): Thing | null { return (path == null) ? null : path?.thing(back) ?? null; }

	constructor(db: DBInterface) {
		this.db = db;
		s_path_here.subscribe((path: Path | null) => {
			if (this.db && this.db.hasData) { // make sure this.db has not become null
				this.herePath = path;
			}
		})
	}
	
	async hierarchy_assemble(type: string) {
		const root = this.root;
		if (root) {
			await root.bulk_fetchAll(root.baseID);
			root.relations.relations_recursive_assemble(k.rootPath);
			root.order_normalizeRecursive_remoteMaybe(true);
			this.db.setHasData(true);
			persistLocal.s_updateForDBType(type);
		}
		this.here_restore();
		s_things_arrived.set(true);
		s_isBusy.set(false);
		this.isConstructed = true;
	}

	here_restore() {
		let here = this.thing_getForPath(this.herePath);
		if (here == null) {
			this.herePath = this.grabs.path_lastGrabbed?.parentPath ?? k.rootPath;
		}
		this.herePath?.becomeHere();
	}

	toggleAlteration(alteration: AlteringParent) {
		s_altering_parent.set((get(s_altering_parent) == alteration) ? null : alteration);
	}

	async handleToolClicked(buttonID: string) {
		const path = get(s_path_toolsCluster);
		if (path) {
			switch (buttonID) {
				case ClusterToolType.next: this.path_relayout_toolCluster_nextParent(); return;
				case ClusterToolType.add: await this.path_edit_remoteCreateChildOf(path); break;
				case ClusterToolType.addParent: this.toggleAlteration(AlteringParent.adding); return;
				case ClusterToolType.deleteParent: this.toggleAlteration(AlteringParent.deleting); return;
				case ClusterToolType.delete: await this.paths_rebuild_traverse_remoteDelete([path]); break;
				case ClusterToolType.more: console.log('needs more'); break;
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
			if (!pathGrab) {
				rootPath.becomeHere();
				rootPath.grabOnly();		// update crumbs and dots
				pathGrab = rootPath;
			}
			if (k.allowGraphEditing) {
				if (pathGrab && k.allowTitleEditing) {
					switch (key) {
						case 'd':		await this.thing_edit_remoteDuplicate(pathGrab); break;
						case ' ':		await this.path_edit_remoteCreateChildOf(pathGrab); break;
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
			if (pathGrab) {
				switch (key) {
					case '/':			pathGrab.becomeHere(); break;
					case 'arrowright':	await this.path_rebuild_remoteMoveRight(pathGrab, true, SHIFT, OPTION, EXTREME); break;
					case 'arrowleft':	event.preventDefault(); await this.path_rebuild_remoteMoveRight(pathGrab, false, SHIFT, OPTION, EXTREME); break;
				}
			}
			switch (key) {
				case '!':				k.rootPath?.becomeHere(); break;
				case '`':               event.preventDefault(); this.latestPathGrabbed_toggleToolsCluster(); break;
				case 'arrowup':			await this.latestPathGrabbed_rebuild_remoteMoveUp(true, SHIFT, OPTION, EXTREME); break;
				case 'arrowdown':		await this.latestPathGrabbed_rebuild_remoteMoveUp(false, SHIFT, OPTION, EXTREME); break;
			}
		}
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

	async thing_forget_remoteDelete(thing: Thing) {
		this.thing_forget(thing);					// forget first, so onSnapshot logic will not signal children
		await this.db.thing_remoteDelete(thing);
	}

	async thing_edit_remoteAddLine(path: Path, below: boolean = true) {
		const parentPath = path.parentPath;
		const parent = parentPath?.thing();
		const thing = path.thing();
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
		if (newThing.isBulkAlias || newThing.trait == TraitType.roots || newThing.trait == TraitType.root) {
			newThing.trait = '';
		}
		this.thing_remember(newThing);
		return newThing;
	}

	async thing_edit_remoteDuplicate(path: Path) {
		const thing = path.thing();
		const id = thing?.id;
		const parentPath = path.parentPath;
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
			if (thing.trait == TraitType.root && (thing.baseID == '' || thing.baseID == this.db.baseID)) {
				this.root = thing;
			}
		}
	}

	thing_runtimeCreate(baseID: string, id: string | null, title: string, color: string, trait: string,
		isRemotelyStored: boolean): Thing {
		let thing: Thing | null = null;
		if (id && trait == TraitType.root && baseID != this.db.baseID) {		// other bulks have their own root & id
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
			for (const thing of this.knownTs_byTrait[TraitType.bulk]) {
				if  (thing.title == title) {							// special case TODO: convert to a auery string
					return thing;
				}
			}
		}
		return null;
	}

	async thing_remember_bulk_recursive_remoteRelocateRight(path: Path, newParentPath: Path) {
		const newParent = newParentPath.thing();
		const thing = path.thing();
		if (thing && newParent) {
			const baseID = newParent.isBulkAlias ? newParent.title : newParent.baseID;
			const newThing = await this.thing_remember_runtimeCopy(baseID, thing);
			const newThingPath = newParentPath.appendChild(newThing);
			await this.path_remember_remoteAddAsChild(newParentPath, newThing);
			for (const child of thing.children) {
				const childpath = path.appendChild(child);
				this.thing_remember_bulk_recursive_remoteRelocateRight(childpath, newThingPath);
			}
			if (!newThingPath.isExpanded) {
				setTimeout(() => {
					newThingPath.expand();	
					path.collapse();
				}, 2);
			}
			await this.thing_forget_remoteDelete(thing);	// remove thing [N.B. and its progney] from current bulk
			await this.relationships_forget_remoteDeleteAllForThing(thing)
			return newThingPath;
		}
	}

	async thing_getRoots() {
		let rootPath = k.rootPath;
		for (const thing of this.knownTs_byTrait[TraitType.roots]) {
			if  (thing.title == 'roots') {	// special case TODO: convert to a auery string
				const rootsPath = rootPath.appendChild(thing) ?? null;
				return rootsPath;
			}
		}
		const roots = this.thing_runtimeCreate(this.db.baseID, null, 'roots', 'red', TraitType.roots, false);
		await this.path_remember_remoteAddAsChild(rootPath, roots);
		const rootsPath = rootPath?.appendChild(roots) ?? null;
		return rootsPath;
	}

	////////////////////////////////////
	//		   RELATIONSHIPS		  //
	////////////////////////////////////

	relationships_refreshKnowns_remoteRenormalize() {
		this.relationships_refreshKnowns();
		this.root?.order_normalizeRecursive_remoteMaybe(true);
	}

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

	async relationships_forget_remoteDeleteAllForThing(thing: Thing) {
		const array = this.knownRs_byHIDTo[thing.hashedID];
		if (array) {
			for (const relationship of array) {
				await this.db.relationship_remoteDelete(relationship);
				this.relationship_forget(relationship);
			}
		}
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

	async relationships_remoteCreateMissing(root: Thing) {
		const idRoot = root.id;
		if (idRoot) {
			for (const thing of this.knownTs) {
				const idThing = thing.id;
				if (idThing != idRoot && thing.trait != TraitType.root && thing.baseID == root.baseID) {
					let relationship = this.relationship_getWhereIDEqualsTo(idThing);
					if (!relationship) {
						const idPredicateIsAParentOf = Predicate.idIsAParentOf;
						await this.relationship_remember_remoteCreateUnique(root.baseID, null, idPredicateIsAParentOf,
							idRoot, idThing, 0, CreationOptions.getRemoteID)
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
		let path = this.knownPath_byPathStringHash[pathString.hash()];
		if (!path) {
			path = new Path(pathString);
			this.path_remember(path);
		}
		return path;
	}

	path_remember(path: Path) {
		const hID = path.thingID.hash();
		const pathHash = path.pathString.hash();
		const paths = this.knownPaths_toThingHID[hID] ?? [];
		this.knownPath_byPathStringHash[pathHash] = path;
		if (hID != 0 && paths.indexOf(path) == -1) {
			paths.push(path);
			// console.log(`remember path for ${path.thing()?.title}`)
			this.knownPaths_toThingHID[hID] = paths;
		}
	}

	path_nextParent(path: Path): Path | null {
		let nextPath: Path | null = null
		const hID = path.thingID.hash();
		const paths = this.knownPaths_toThingHID[hID];
		if (paths) {
			const index = paths.map(p => p.pathString).indexOf(path.pathString);
			const next = index.increment(true, paths.length)
			nextPath = paths[next];
		}
		return nextPath;
	}

	async path_relayout_toolCluster_nextParent() {
		const path = get(s_path_toolsCluster);
		if (path) {
			const nextPath = this.path_nextParent(path);
			if (nextPath && !path.matchesPath(nextPath)) {
				await nextPath.assureIsVisible();
				nextPath.grabOnly();
				s_path_toolsCluster.set(nextPath);
				signals.signal_relayout_fromHere();
			}
		}
	}

	async path_edit_remoteCreateChildOf(parentPath: Path | null) {
		const parent = parentPath?.thing();
		if (parent && parentPath) {
			const child = await this.thing_remember_runtimeCopy(parent.baseID, parent);
			child.title = 'idea';
			parentPath.expand();
			await this.path_edit_remoteAddAsChild(parentPath, child, 0);
		}
	}

	async path_edit_remoteAddAsChild(path: Path, child: Thing, order: number, shouldStartEdit: boolean = true) {
		const thing = path.thing();
		if (thing) {
			await this.path_remember_remoteAddAsChild(path, child);
			path.expand();
			signals.signal_rebuild_fromHere();
			const childPath = path.appendChild(child);
			childPath.grabOnly();
			childPath.order_setTo(order);
			if (shouldStartEdit) {
				setTimeout(() => {
					childPath.startEdit();
				}, 200);
			}
		}
	}

	async path_redraw_bulkFetchAll_runtimeBrowseRight(path: Path, grab: boolean = true) {
		const thing = path.thing();
		if (thing) {
			path.expand();		// do this before fetch, so next launch will see it
			await thing.bulk_fetchAll(thing.title);
			thing.relations.relations_recursive_assemble(path);
			thing.order_normalizeRecursive_remoteMaybe(true);
			if (thing.hasChildren) {
				if (grab) {
					path.appendChild(thing.children[0]).grabOnly()
				}
				path.expand();
				signals.signal_rebuild_fromHere();
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

	async path_remember_remoteAddAsChild(path: Path, child: Thing): Promise<any> {
		const thing = path.thing();
		if (thing) {
			const changingBulk = thing.isBulkAlias || child.baseID != this.db.baseID;
			const baseID = changingBulk ? child.baseID : thing.baseID;
			const idPredicateIsAParentOf = Predicate.idIsAParentOf;
			const parentID = thing.idForChildren;
			if (!child.isRemotelyStored) {	
				await this.db.thing_remember_remoteCreate(child);			// for everything below, need to await child.id fetched from dbDispatch
			}
			const relationship = await this.db.hierarchy.relationship_remember_remoteCreateUnique(baseID, null, idPredicateIsAParentOf, parentID, child.id, 0, CreationOptions.getRemoteID)
			await u.paths_orders_normalize_remoteMaybe(thing.childPaths);		// write new order values for relationships
			return relationship;
		}
	}

	async path_rebuild_remoteMoveRight(path: Path, RIGHT: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean, fromReveal: boolean = false) {
		if (!OPTION) {
			const thing = path.thing();
			if (thing) {
				if (RIGHT && thing.needsBulkFetch) {
					await this.path_redraw_bulkFetchAll_runtimeBrowseRight(path);
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
		const parentPath = path.parentPath;
		const parent = this.thing_getForPath(parentPath);
		const siblings = parent?.children;
		if (!siblings || siblings.length == 0) {
			this.path_rebuild_runtimeBrowseRight(path, true, EXTREME, up);
		} else if (thing) {
			const index = siblings.indexOf(thing);
			const newIndex = index.increment(!up, siblings.length);
			if (parentPath && !OPTION) {
				const grabPath = parentPath.appendChild(siblings[newIndex]);
				if (!grabPath.isVisible) {
					grabPath.parentPath?.becomeHere();
				}
				if (SHIFT) {
					grabPath.toggleGrab();
				} else {
					grabPath.grabOnly();
				}
				signals.signal_relayout_fromHere();
			} else if (k.allowGraphEditing && OPTION) {
				await u.paths_orders_normalize_remoteMaybe(parent.childPaths, false);
				const wrapped = up ? (index == 0) : (index == siblings.length - 1);
				const goose = ((wrapped == up) ? 1 : -1) * k.halfIncrement;
				const newOrder = newIndex + goose;
				thing.order_setTo(newOrder);
				await u.paths_orders_normalize_remoteMaybe(parent.childPaths);
				signals.signal_rebuild_fromHere();
			}
		}
	}

	async path_rebuild_remoteRelocateRight(path: Path, RIGHT: boolean, EXTREME: boolean) {
		let needsRebuild = false;
		const thing = path.thing();
		const newParentPath = RIGHT ? path.path_ofNextSibling(false) : path.stripBack(2);
		const newParent = newParentPath?.thing();
		if (thing && newParent && newParentPath) {
			if (thing.thing_isInDifferentBulkThan(newParent)) {		// should move across bulks
				this.path_remember_bulk_remoteRelocateRight(path, newParentPath);
			} else {
				const relationship = path.relationship();

				// alter the 'to' in ALL [?] the matching 'from' relationships
				// simpler than adjusting children or parents arrays
				// TODO: also match against the 'to' to the current parent
				// TODO: pass predicate in ... to support editing different kinds of relationships

				if (relationship) {
					const order = RIGHT ? relationship.order : 0;
					relationship.idFrom = newParent.id;
					await relationship.order_setTo(order + 0.5);
				}

				this.relationships_refreshKnowns();		// so children and parent will see the newly relocated things
				this.root?.order_normalizeRecursive_remoteMaybe(true);
				newParentPath.appendChild(thing).grabOnly();
				if (!newParentPath.isExpanded) {
					newParentPath.expand();
					needsRebuild = true;
				}
				if (!newParentPath.isVisible) {
					newParentPath.becomeHere();
					needsRebuild = true;
				}
			}
			if (needsRebuild) {
				signals.signal_rebuild_fromHere();			// so Children component will update
			} else {
				signals.signal_relayout_fromHere();
			}
		}
	}

	path_rebuild_runtimeBrowseRight(path: Path, RIGHT: boolean, SHIFT: boolean, EXTREME: boolean, fromReveal: boolean = false) {
		const thing = this.thing_getForPath(path);
		let needsRebuild = false;
		if (thing) {
			const newParentPath = path.parentPath;
			const childPath = path.appendChild(thing?.firstChild);
			let newGrabPath: Path | null = RIGHT ? childPath : newParentPath;
			const newGrabIsNotHere = !newGrabPath?.isHere;
			const newHerePath = newParentPath;
			if (RIGHT) {
				if (thing.hasChildren) {
					if (SHIFT) {
						newGrabPath = null;
					}
					path.expand();
				} else {
					return;
				}
			} else {
				const rootPath = k.rootPath;
				if (EXTREME) {
					rootPath?.becomeHere();	// tells graph to update line rects
				} else {
					if (!SHIFT) {
						if (fromReveal) {
							if (!path.isExpanded) {
								path.expand();
								needsRebuild = true;
							}
						} else {
							if (newGrabIsNotHere && newGrabPath && !newGrabPath.isExpanded) {
								newGrabPath.expand();
								needsRebuild = true;
							}
						}
					} else if (newGrabPath) { 
						if (path.isExpanded) {
							path.collapse();
							newGrabPath = null;
							needsRebuild = true;
						} else if (newGrabPath == rootPath) {
							newGrabPath = null;
						} else {
							newGrabPath.collapse();
							needsRebuild = true;
						}
					}
				}
			}
			s_title_editing.set(null);
			newGrabPath?.grabOnly();
			const allowToBecomeHere = (!SHIFT || newGrabPath == path.parent) && newGrabIsNotHere; 
			const shouldBecomeHere = !newHerePath?.isVisible || newHerePath.isRoot;
			if (!RIGHT && allowToBecomeHere && shouldBecomeHere) {
				newHerePath?.becomeHere();
				needsRebuild = true;
			}
			if (needsRebuild) {
				signals.signal_rebuild_fromHere();
			} else {
				signals.signal_relayout_fromHere();
			}
		}
	}

	////////////////////////
	//		  PATHS		  //
	////////////////////////

	paths_forgetAll() {
		this.knownPath_byPathStringHash = {};
		this.knownPaths_toThingHID = {};
	}

	async paths_rebuild_traverse_remoteDelete(paths: Array<Path>) {
		if (this.herePath) {
			for (const path of paths) {
				let parent = path.parent;
				const thing = path.thing();
				const parentPath = path.stripBack(1);
				const grandparentPath = path.stripBack(2);
				if (thing && parent && parentPath && grandparentPath && path && !path.isEditing && !thing.isBulkAlias) {
					const siblings = parent.children;
					let index = siblings.indexOf(thing);
					siblings.splice(index, 1);
					parentPath.grabOnly();
					if (siblings.length > 0) {
						if (index >= siblings.length) {
							index = siblings.length - 1;
						}
						parentPath?.appendChild(parent);
						parent = siblings[index];
						await u.paths_orders_normalize_remoteMaybe(parent.childPaths);
					} else if (!grandparentPath.isVisible) {
						grandparentPath.becomeHere();
					}
					await thing.traverse_async(async (descendant: Thing): Promise<boolean> => {
						await this.relationships_forget_remoteDeleteAllForThing(descendant);
						await this.thing_forget_remoteDelete(descendant);
						return false; // continue the traversal
					});
				}
			}
			signals.signal_rebuild_fromHere();
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

	predicate_remember_runtimeCreate(id: string, kind: string) {
		const predicate = new Predicate(id, kind);
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
}
