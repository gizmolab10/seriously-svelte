import { get, noop, User, Path, Thing, Grabs, debug, Access, remove, TraitType, PersistID, Predicate, Relationship } from '../common/GlobalImports';
import { persistLocal, CreationOptions, sort_byOrder, signal_rebuild_fromHere, orders_normalize_remoteMaybe } from '../common/GlobalImports';
import { path_here, isBusy, paths_grabbed, path_toolsGrab, things_arrived } from './State';
import DBInterface from '../db/DBInterface';

type KnownRelationships = { [id: string]: Array<Relationship> }

//////////////////////////////////////////
//	create, delete, remember, forget	//
//			realtime, remote			//
//		of things and relationships		//
//////////////////////////////////////////

export default class Hierarchy {
	knownU_byID: { [id: string]: User } = {};
	knownT_byID: { [id: string]: Thing } = {};
	knownA_byID: { [id: string]: Access } = {};
	knownP_byID: { [id: string]: Predicate } = {};
	knownR_byID: { [id: string]: Relationship } = {};
	knownA_byKind: { [kind: string]: Access } = {};
	knownP_byKind: { [kind: string]: Predicate } = {};
	knownTs_byTrait: { [trait: string]: Thing[] } = {};
	knownRs_byIDPredicate: KnownRelationships = {};
	knownRs_byIDFrom: KnownRelationships = {};
	knownRs_byIDTo: KnownRelationships = {};
	knownRs: Array<Relationship> = [];
	knownTs: Thing[] = [];
	_grabs: Grabs | null = null;
	root: Thing | null = null;
	here: Thing | null = null;
	isConstructed = false;
	db: DBInterface;

	get hasNothing(): boolean { return !this.root; }
	get idRoot(): (string | null) { return this.root?.id ?? null; };
	get rootPath(): Path | null { return !this.idRoot ? null : new Path(this.idRoot); }
	thing_getForID(idThing: string | null): Thing | null { return (!idThing) ? null : this.knownT_byID[idThing]; }
	thing_getForPath(path: Path | null, back: number = 1): Thing | null { return (path == null) ? null : this.knownT_byID[path?.lastIDOf(back)]; }

	constructor(db: DBInterface) {
		this.db = db;
		path_here.subscribe((path: Path | null) => {
			if (this.db && this.db.hasData) { // make sure this.db has not become null
				this.here = this.thing_getForPath(path);
			}
		})
	}
	
	async hierarchy_assemble(type: string) {
		const root = this.root;
		if (root) {
			await root.normalize_bulkFetchAll(root.baseID);
			this.db.setHasData(true);
			persistLocal.state_updateForDBType(type, root.id);
		}
		this.here_restore();
		things_arrived.set(true);
		isBusy.set(false);
		this.isConstructed = true;
	}

	here_restore() {
		const path = get(path_here);
		let here = this.thing_getForPath(path);
		if (here == null) {
			const grab = this.grabs.thing_lastGrabbed;
			here = grab?.firstParent ?? this.root;
		}
		path?.becomeHere();
	}

	get grabs(): Grabs { 
		if (this._grabs == null) {
			this._grabs = new Grabs(this);
		}
		return this._grabs!;
	}

	//////////////////////////////
	//			THINGS			//
	//////////////////////////////

	things_getForIDs(ids: Array<string>): Array<Thing> {
		const array = Array<Thing>();
		for (const id of ids) {
			const thing = this.thing_getForID(id);
			if (thing) {
				array.push(thing);
			}
		}
		return sort_byOrder(array);
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

	async things_redraw_remoteTraverseDelete(things: Array<Thing>) {
		const h = this;
		if (h.here) {
			for (const grabbed of things) {
				if (grabbed && !grabbed.isEditing && !grabbed.isBulkAlias) {
					let newGrab = grabbed.firstParent;
					const siblings = grabbed.siblings;
					const grandparent = grabbed.grandparent;
					let index = siblings.indexOf(grabbed);
					siblings.splice(index, 1);
					if (siblings.length > 0) {
						if (index >= siblings.length) {
							index = siblings.length - 1;
						}
						newGrab = siblings[index];
						orders_normalize_remoteMaybe(grabbed.siblings);
					} else if (!grandparent.isVisible) {
						grandparent.becomeHere();
					}
					await grabbed.traverse(async (child: Thing): Promise<boolean> => {
						await h.relationships_forget_remoteDeleteAllForThing(child);
						await h.thing_forget_remoteDelete(child);
						return false; // continue the traversal
					});
					newGrab.grabOnly();
				}
			}
			signal_rebuild_fromHere();
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

	async thing_remember_bulk_remoteRelocateRight(thing: Thing, newParent: Thing) {
		const newThing = await this.thing_remember_bulk_recursive_remoteRelocateRight(thing, newParent)
		newParent.signal_relayout();
		if (newParent.isExpanded) {
			newThing.grabOnly();
		} else {
			newParent.grabOnly();
		}
	}

	async thing_remember_bulk_recursive_remoteRelocateRight(thing: Thing, newParent: Thing) {
		const baseID = newParent.isBulkAlias ? newParent.title : newParent.baseID;
		const newThing = await this.thing_remember_runtimeCopy(baseID, thing);
		await newParent.thing_remember_remoteAddAsChild(newThing);
		for (const child of thing.children) {
			this.thing_remember_bulk_recursive_remoteRelocateRight(child, newThing);
		}
		if (thing.isExpanded) {
			setTimeout(() => {
				newThing.expand();	
				thing.collapse();
			}, 2);
		}
		await this.thing_forget_remoteDelete(thing);	// remove thing [N.B. and its progney] from current bulk
		await this.relationships_forget_remoteDeleteAllForThing(thing)
		return newThing;
	}

	async thing_getRoots() {
		let root = this.root;
		for (const thing of this.knownTs_byTrait[TraitType.roots]) {
			if  (thing.title == 'roots') {	// special case TODO: convert to a auery string
				return thing;
			}
		}
		if (root) {
			const roots = this.thing_runtimeCreate(this.db.baseID, null, 'roots', 'red', TraitType.roots, 0, false);
			await root.thing_remember_remoteAddAsChild(roots);
			return roots;
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

	relationships_accomodateRelocations(original: Relationship, relationship: Relationship) {
		const idChild = relationship.idTo;
		const idOriginal = original.idFrom;
		const idParent = relationship.idFrom;
		const parent = this.thing_getForID(idParent);
		const oParent = this.thing_getForID(idOriginal);
		const childIsGrabbed = get(paths_grabbed).includes(idChild);
		if (idOriginal == get(path_here) && idOriginal != idParent && childIsGrabbed) {
			const child = this.thing_getForID(idChild);
			child?.grabOnly(); // update crumbs
			if (oParent && !oParent.hasChildren) {
				parent?.becomeHere();
			}
		}
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
			relationship.order_setTo(order, false);						// AND thing are updated
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
			relationship.order_setTo(order, false);						// AND thing are updated
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
