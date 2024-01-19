import { k, get, noop, User, Path, Thing, Grabs, debug, Access, remove, signals, TraitType, Predicate } from '../common/GlobalImports';
import { Relationship, persistLocal, CreationOptions, sort_byOrder, orders_normalize_remoteMaybe } from '../common/GlobalImports';
import { s_path_here, s_isBusy, s_path_editing, s_paths_grabbed, s_things_arrived, s_path_toolsGrab } from './State';
import DBInterface from '../db/DBInterface';
import {children} from 'svelte/internal';

type KnownRelationships = { [id: string]: Array<Relationship> }

export default class Hierarchy {
	knownU_byID: { [id: string]: User } = {};
	knownT_byID: { [id: string]: Thing } = {};
	knownA_byID: { [id: string]: Access } = {};
	knownP_byID: { [id: string]: Predicate } = {};
	knownR_byID: { [id: string]: Relationship } = {};
	knownA_byKind: { [kind: string]: Access } = {};
	knownP_byKind: { [kind: string]: Predicate } = {};
	knownTs_byTrait: { [trait: string]: Array<Thing> } = {};
	knownRs_byIDPredicate: KnownRelationships = {};
	knownRs_byIDFrom: KnownRelationships = {};
	knownRs_byIDTo: KnownRelationships = {};
	knownRs: Array<Relationship> = [];
	knownTs: Array<Thing> = [];
	herePath: Path | null = null;
	_grabs: Grabs | null = null;
	root: Thing | null = null;
	isConstructed = false;
	db: DBInterface;

	get hasNothing(): boolean { return !this.root; }
	get idRoot(): (string | null) { return this.root?.id ?? null; }; // undefined --> null
	get rootPath(): Path | null { return !this.idRoot ? null : new Path(this.idRoot); }
	thing_getForID(id: string | null): Thing | null { return (!id) ? null : this.knownT_byID[id]; }
	thing_getForPath(path: Path | null, back: number = 1): Thing | null { return (path == null) ? null : this.thing_getForID(path?.ancestorID(back)); }

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
			await root.normalize_bulkFetchAll(root.baseID);
			this.db.setHasData(true);
			persistLocal.s_updateForDBType(type, root.id);
		}
		this.here_restore();
		s_things_arrived.set(true);
		s_isBusy.set(false);
		this.isConstructed = true;
	}

	here_restore() {
		let here = this.thing_getForPath(this.herePath);
		if (here == null) {
			this.herePath = this.grabs.path_lastGrabbed?.stripBack() ?? this.rootPath;
		}
		this.herePath?.becomeHere();
	}

	async handleKeyDown(event: KeyboardEvent) {
		let pathGrab = this.grabs.latestPathGrabbed(true);
		if (event.type == 'keydown') {
			const OPTION = event.altKey;
			const SHIFT = event.shiftKey;
			const COMMAND = event.metaKey;
			const EXTREME = SHIFT && OPTION;
			const key = event.key.toLowerCase();
			const rootPath = this.rootPath;
			if (!pathGrab && rootPath) {
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
				case '!':				this.rootPath?.becomeHere(); break;
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
		if (path) {
			s_path_toolsGrab.set(path.toolsGrabbed ? null : path);
			signals.signal_rebuild_fromHere();
		}
	}

	//////////////////////////////
	//			THINGS			//
	//////////////////////////////

	things_getForPaths(paths: Array<Path>): Array<Thing> {
		const ids = paths.map(p => p.thingID);
		return this.things_getForIDs(ids);
	}

	things_getForIDs(ids: Array<string> | null): Array<Thing> {
		if (ids) {
			const array = Array<Thing>();
			for (const id of ids) {
				const thing = this.thing_getForID(id);
				if (thing) {
					array.push(thing);
				}
			}
			return sort_byOrder(array);
		}
		return [];
	}

	things_getByIDPredicateToAndID(idPredicate: string, to: boolean, idThing: string): Array<Thing> {
		return this.things_getForIDs(this.thingIDs_getByIDPredicateToAndID(idPredicate, to, idThing));
	}

	thingIDs_getByIDPredicateToAndID(idPredicate: string, to: boolean, idThing: string): Array<string> {
		const matches = this.relationships_getByIDPredicateToAndID(idPredicate, to, idThing);
		const ids: Array<string> = [];
		if (Array.isArray(matches) && matches.length > 0) {
			for (const relationship of matches) {
				ids.push(to ? relationship.idFrom : relationship.idTo);
			}
		}
		return ids;
	}

	things_forgetAll() {
		this.knownTs = []; // clear
		this.knownT_byID = {};
		this.knownTs_byTrait = {};
	}

	//////////////////////
	//		DELETE		//
	//////////////////////

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
						orders_normalize_remoteMaybe(parent.children);
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
		delete this.knownT_byID[thing.id];
		this.knownTs = this.knownTs.filter((known) => known.id !== thing.id);
		this.knownTs_byTrait[thing.trait] = this.knownTs_byTrait[thing.trait].filter((known) => known.id !== thing.id);
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
			const order = thing.order + (below ? 0.5 : -0.5);
			const child = this.thing_runtimeCreate(thing.baseID, null, k.lineTitle, parent.color, '', order, false);
			await this.path_edit_remoteAddAsChild(parentPath, child, false);
		}
	}

	thing_remember_runtimeCreate(baseID: string, id: string | null, title: string, color: string, trait: string, order: number,
		isRemotelyStored: boolean): Thing {
		const thing = this.thing_runtimeCreate(baseID, id, title, color, trait, order, isRemotelyStored);
		this.thing_remember(thing);
		return thing;
	}

	async thing_remember_runtimeCopy(baseID: string, from: Thing) {
		const newThing = new Thing(baseID, null, from.title, from.color, from.trait, from.order, false);
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
			await this.path_edit_remoteAddAsChild(parentPath, sibling);
		}
	}

	thing_remember(thing: Thing) {
		if (this.knownT_byID[thing.id] == null) {
			this.knownT_byID[thing.id] = thing;
			let things = this.knownTs_byTrait[thing.trait];
			if (things == null) {
				things = [thing];
			}
			things.push(thing);
			this.knownTs_byTrait[thing.trait] = things;
			this.knownTs.push(thing);
			if (thing.trait == TraitType.root && (thing.baseID == '' || thing.baseID == this.db.baseID)) {
				this.root = thing;
			}
		}
	}

	thing_runtimeCreate(baseID: string, id: string | null, title: string, color: string, trait: string, order: number,
		isRemotelyStored: boolean): Thing {
		let thing: Thing | null = null;
		if (id && trait == TraitType.root && baseID != this.db.baseID) {		// other bulks have their own root & id
			thing = this.thing_bulkRootpath_set(baseID, id, color);				// which our thing needs to adopt
		}
		if (!thing) {
			thing = new Thing(baseID, id, title, color, trait, order, isRemotelyStored);
			if (baseID != this.db.baseID) {
				noop()
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
			thing.color = color;			// N.B., ignore trait
			this.knownT_byID[id] = thing;
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
			if (newThingPath.isExpanded) {
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
		let rootPath = this.rootPath;
		for (const thing of this.knownTs_byTrait[TraitType.roots]) {
			if  (thing.title == 'roots') {	// special case TODO: convert to a auery string
				const rootsPath = rootPath?.appendChild(thing) ?? null;
				return rootsPath;
			}
		}
		if (rootPath) {
			const roots = this.thing_runtimeCreate(this.db.baseID, null, 'roots', 'red', TraitType.roots, 0, false);
			await this.path_remember_remoteAddAsChild(rootPath, roots);
			const rootsPath = rootPath?.appendChild(roots) ?? null;
			return rootsPath;
		}
		return null;
	}

	////////////////////////////////////
	//		   RELATIONSHIPS		  //
	////////////////////////////////////

	async relationships_remoteCreateMissing(root: Thing) {
		const idRoot = root.id;
		if (idRoot) {
			for (const thing of this.knownTs) {
				const idThing = thing.id;
				if (idThing != idRoot && thing.trait != TraitType.root && thing.baseID == root.baseID) {
					let relationship = this.relationship_getWhereIDEqualsTo(idThing);
					if (relationship) {
						thing.order = relationship.order;
					} else {
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
			const thingTo = this.thing_getForID(relationship.idTo);
			const thingFrom = this.thing_getForID(relationship.idFrom);
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
		this.knownRs_byIDPredicate = {};
		this.knownRs_byIDFrom = {};
		this.knownRs_byIDTo = {};
		this.knownR_byID = {};
		this.knownRs = [];
	}

	async relationships_forget_remoteDeleteAllForThing(thing: Thing) {
		const array = this.knownRs_byIDTo[thing.id];
		if (array) {
			for (const relationship of array) {
				await this.db.relationship_remoteDelete(relationship);
				this.relationship_forget(relationship);
			}
		}
	}

	relationships_getByIDPredicateToAndID(idPredicate: string, to: boolean, idThing: string): Array<Relationship> {
		const dict = to ? this.knownRs_byIDTo : this.knownRs_byIDFrom;
		const matches = dict[idThing] as Array<Relationship>; // filter out bad values (dunno what this does)
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

	relationships_getByIDPredicateFromAndTo(idPredicate: string, idFrom: string, idTo: string): Relationship | null {
		const idPredicateIsAParentOf = Predicate.idIsAParentOf;
		const matches = this.relationships_getByIDPredicateToAndID(idPredicateIsAParentOf, false, idFrom);
		if (Array.isArray(matches)) {
			for (const relationship of matches) {
				if (relationship.idTo == idTo) {
					return relationship;
				}
			}
		}
		return null;
	}

	/////////////////////////////////////
	//			RELATIONSHIP		   //
	/////////////////////////////////////

	relationship_remember(relationship: Relationship) {
		if (!this.knownR_byID[relationship.id]) {
			if (relationship.baseID != this.db.baseID) {
				debug.log_error('RELATIONSHIP ' + relationship.baseID + ' ' + this.thing_getForID(relationship.idFrom)?.description + ' => ' + this.thing_getForID(relationship.idTo)?.description);
			}
			this.knownRs.push(relationship);
			this.knownR_byID[relationship.id] = relationship;
			this.relationship_rememberByKnown(this.knownRs_byIDTo, relationship.idTo, relationship);
			this.relationship_rememberByKnown(this.knownRs_byIDFrom, relationship.idFrom, relationship);
			this.relationship_rememberByKnown(this.knownRs_byIDPredicate, relationship.idPredicate, relationship);
		}
	}

	relationship_forget(relationship: Relationship) {
		remove<Relationship>(this.knownRs, relationship);
		delete this.knownR_byID[relationship.id];
		this.relationship_forgetByKnown(this.knownRs_byIDTo, relationship.idTo, relationship);
		this.relationship_forgetByKnown(this.knownRs_byIDFrom, relationship.idFrom, relationship);
		this.relationship_forgetByKnown(this.knownRs_byIDPredicate, relationship.idPredicate, relationship);
	}

	relationship_forgetByKnown(known: KnownRelationships, idRelationship: string, relationship: Relationship) {
		let array = known[idRelationship] ?? [];
		remove<Relationship>(array, relationship)
		known[idRelationship] = array;
	}

	relationship_rememberByKnown(known: KnownRelationships, idRelationship: string, relationship: Relationship) {
		let array = known[idRelationship] ?? [];
		array.push(relationship);
		known[idRelationship] = array;
	}

	relationship_remember_runtimeCreateUnique(baseID: string, idRelationship: string, idPredicate: string, idFrom: string,
		idTo: string, order: number, creationOptions: CreationOptions = CreationOptions.none) {
		let relationship = this.relationships_getByIDPredicateFromAndTo(idPredicate, idFrom, idTo);
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
		let relationship = this.relationships_getByIDPredicateFromAndTo(idPredicate, idFrom, idTo);
		if (relationship) {
			relationship.order_setTo(order, true);						// AND thing are updated
		} else {
			relationship = new Relationship(baseID, idRelationship, idPredicate, idFrom, idTo, order, creationOptions != CreationOptions.none);
			await this.db.relationship_remember_remoteCreate(relationship);
			this.relationship_remember(relationship);
		}
		return relationship;
	}

	relationship_getWhereIDEqualsTo(idThing: string, to: boolean = true) {
		const idPredicateIsAParentOf = Predicate.idIsAParentOf;
		const matches = this.relationships_getByIDPredicateToAndID(idPredicateIsAParentOf, to, idThing);
		if (matches.length > 0) {
			const relationship = matches[0];
			return relationship;
		}
		return null;
	}

	relationship_getForPath(path: Path | null, by: number = -1): Relationship | null {
		return null;
	}

	////////////////////////
	//		  PATHS		  //
	////////////////////////

	async path_edit_remoteCreateChildOf(parentPath: Path | null) {
		const parent = parentPath?.thing();
		if (parent && parentPath) {
			const child = await this.thing_remember_runtimeCopy(parent.baseID, parent);
			child.title = 'idea';
			parentPath.expand();
			await this.path_edit_remoteAddAsChild(parentPath, child);
		}
	}

	async path_edit_remoteAddAsChild(path: Path, child: Thing, shouldStartEdit: boolean = true) {
		const thing = path.thing();
		if (thing) {
			await this.path_remember_remoteAddAsChild(path, child);
			path.expand();
			signals.signal_rebuild_fromHere();
			const childPath = path.appendChild(child);
			childPath.grabOnly();
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
			await thing.normalize_bulkFetchAll(thing.title);
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
			newParentPath.thing()?.signal_relayout();
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
			const relationship = await this.db.hierarchy.relationship_remember_remoteCreateUnique(baseID, null, idPredicateIsAParentOf, parentID, child.id, child.order, CreationOptions.getRemoteID)
			await orders_normalize_remoteMaybe(thing.children);		// write new order values for relationships
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
				if (SHIFT) {
					grabPath.toggleGrab();
				} else {
					grabPath.grabOnly();
				}
			} else if (k.allowGraphEditing && OPTION) {
				orders_normalize_remoteMaybe(parent.children, false);
				const wrapped = up ? (index == 0) : (index == siblings.length - 1);
				const goose = ((wrapped == up) ? 1 : -1) * k.halfIncrement;
				const newOrder = newIndex + goose;
				thing.order_setTo(newOrder);
				await orders_normalize_remoteMaybe(parent.children);
			}
			signals.signal_rebuild_fromHere();
		}
	}

	async path_rebuild_remoteRelocateRight(path: Path, RIGHT: boolean, EXTREME: boolean) {
		const thing = path.thing();
		const newParentPath = RIGHT ? path.path_ofNextSibling(false) : path.stripBack(2);
		const newParent = newParentPath?.thing();
		if (thing && newParent && newParentPath) {
			const parent = path.parent;
			const relationship = this.relationship_getWhereIDEqualsTo(thing.id);
			if (thing.thing_isInDifferentBulkThan(newParent)) {		// should move across bulks
				this.path_remember_bulk_remoteRelocateRight(path, newParentPath);
			} else {
				// alter the 'to' in ALL [?] the matching 'from' relationships
				// simpler than adjusting children or parents arrays
				// TODO: also match against the 'to' to the current parent
				// TODO: pass predicate in ... to support editing different kinds of relationships

				if (parent && relationship) {
					const order = RIGHT ? parent.order : 0;
					relationship.idFrom = newParent.id;
					await thing.order_setTo(order + 0.5);
				}

				this.relationships_refreshKnowns();		// so children and parent will see the newly relocated things
				this.root?.order_normalizeRecursive_remoteMaybe(true);
				newParentPath.appendChild(thing).grabOnly();
				newParentPath.expand();
				if (!newParentPath.isVisible) {
					newParentPath.becomeHere();
				}
			}
			signals.signal_rebuild_fromHere();					// so Children component will update
		}
	}

	path_rebuild_runtimeBrowseRight(path: Path, RIGHT: boolean, SHIFT: boolean, EXTREME: boolean, fromReveal: boolean = false) {
		const thing = this.thing_getForPath(path);
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
				const rootPath = this.rootPath;
				if (EXTREME) {
					rootPath?.becomeHere();	// tells graph to update line rects
				} else {
					if (!SHIFT) {
						if (fromReveal) {
							path.expand();
						} else {
							if (newGrabIsNotHere && newGrabPath && !newGrabPath.isExpanded) {
								newGrabPath?.expand();
							}
						}
					} else if (newGrabPath) { 
						if (path.isExpanded) {
							path.collapse();
							newGrabPath = null;
						} else if (newGrabPath == rootPath) {
							newGrabPath = null;
						} else {
							newGrabPath.collapse();
						}
					}
				}
			}
			s_path_editing.set(null);
			newGrabPath?.grabOnly();
			const allowToBecomeHere = (!SHIFT || newGrabPath == path.parent) && newGrabIsNotHere; 
			const shouldBecomeHere = !newHerePath?.isVisible || newHerePath.isRoot;
			if (!RIGHT && allowToBecomeHere && shouldBecomeHere) {
				newHerePath?.becomeHere();
			}
			signals.signal_rebuild_fromHere();
		}
	}

	async paths_rebuild_remoteTraverseDelete(paths: Array<Path>) {
		if (this.herePath) {
			for (const path of paths) {
				if (path && !path.isEditing && !path.thing()?.isBulkAlias) {
					let newPath = path.parentPath;
					const siblingPaths = path.siblingPaths;
					const grandparent = path.thing(3);
					let index = siblingPaths.map(p => p.pathString).indexOf(path.pathString);
					siblingPaths.splice(index, 1);
					if (siblingPaths.length > 0) {
						if (index >= siblingPaths.length) {
							index = siblingPaths.length - 1;
						}
						newPath = siblingPaths[index];
						orders_normalize_remoteMaybe(path.parentPath?.thing()?.children);
					} else if (!grandparent.isVisible) {
						grandparent.becomeHere();
					}
					await thing.traverse_async(async (descendant: Thing): Promise<boolean> => {
						await this.relationships_forget_remoteDeleteAllForThing(descendant);
						await this.thing_forget_remoteDelete(descendant);
						return false; // continue the traversal
					});
					newPath?.grabOnly();
				}
			}
			signals.signal_rebuild_fromHere();
		}
	}

	//////////////////////////////////////
	//			ANCILLARY DATA			//
	//////////////////////////////////////

	predicate_getForID(idPredicate: string | null): Predicate | null {
		return (!idPredicate) ? null : this.knownP_byID[idPredicate];
	}

	predicate_remember(predicate: Predicate) {
		this.knownP_byKind[predicate.kind] = predicate;
		this.knownP_byID[predicate.id] = predicate;
	}

	predicate_remember_runtimeCreate(id: string, kind: string) {
		const predicate = new Predicate(id, kind);
		this.predicate_remember(predicate)
	}

	access_runtimeCreate(idAccess: string, kind: string) {
		const access = new Access(idAccess, kind);
		this.knownA_byKind[kind] = access;
		this.knownA_byID[idAccess] = access;
	}

	user_runtimeCreate(id: string, name: string, email: string, phone: string) {
		const user = new User(id, name, email, phone);
		this.knownU_byID[id] = user;
	}
}
