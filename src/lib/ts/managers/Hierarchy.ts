import { get, noop, User, Thing, Grabs, debug, Access, remove, signal, Signals, TraitType, Predicate, dbDispatch } from '../common/GlobalImports';
import { Relationship, persistLocal, CreationOptions, DebugOption, sort_byOrder, orders_normalize_remoteMaybe } from '../common/GlobalImports';
import { idHere, isBusy, idsGrabbed, thingsArrived } from './State';
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
	db: DBInterface | null = null;
	_grabs: Grabs | null = null;
	root: Thing | null = null;
	here: Thing | null = null;
	isConstructed = false;

	get hasNothing(): boolean { return !this.root; }
	get idRoot(): (string | null) { return this.root?.id ?? null; };
	thing_getForID(idThing: string | null): Thing | null { return (!idThing) ? null : this.knownT_byID[idThing]; }

	constructor(db: DBInterface) {
		this.db = db;
		idHere.subscribe((id: string | null) => {
			if (this.db && this.db.hasData) {
				this.here = this.thing_getForID(id);
			}
		})
	}
	
	async hierarchy_assemble(type: string) {
		const root = this.root;
		if (root) {
			await this.relationships_remoteCreateMissing(root);
			await this.relationships_removeHavingNullReferences();
			root.order_normalizeRecursive(true)	// setup order values for all things and relationships
			this.db?.setHasData(true);
			orders_normalize_remoteMaybe(root.children)
			persistLocal.state_updateForDBType(type, root.id);
		}
		this.here_restore();
		thingsArrived.set(true);
		isBusy.set(false);
		this.isConstructed = true;
	}

	async relationships_remoteCreateMissing(root: Thing) {
		const idRoot = root.id;
		if (idRoot) {
			for (const thing of this.knownTs) {
				const idThing = thing.id;
				if (idThing != idRoot && thing.trait != TraitType.root && thing.bulkName == root.bulkName) {
					let relationship = this.relationship_getWhereIDEqualsTo(idThing);
					if (relationship) {
						thing.order = relationship.order;
					} else {
						const idPredicateIsAParentOf = Predicate.idIsAParentOf;
						await this.relationship_remember_remoteCreateUnique(root.bulkName, null, idPredicateIsAParentOf,
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
				await dbDispatch.db.relationship_remoteDelete(relationship);
			}
		}
		while (array.length > 0) {
			const relationship = array.pop();
			if (relationship) {
				this.relationship_forget(relationship);
			}
		}
	}

	here_restore() {
		let here = this.thing_getForID(get(idHere));
		if (here == null) {
			const grab = this.grabs.last_thingGrabbed;
			here = grab?.firstParent ?? this.root;
		}
		here?.becomeHere();
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
		const matches = this.relationships_getByIDPredicateToAndID(idPredicate, to, idThing);
		const ids: Array<string> = [];
		if (Array.isArray(matches) && matches.length > 0) {
			for (const relationship of matches) {
				ids.push(to ? relationship.idFrom : relationship.idTo);
			}
		}
		return this.things_getForIDs(ids);
	}

	async thing_remember_remoteAddAsChild(child: Thing, parent: Thing): Promise<any> {
		const idPredicateIsAParentOf = Predicate.idIsAParentOf;
		const changingBulk = parent.isBulkAlias || child.bulkName != dbDispatch.bulkName;
		const bulkName = changingBulk ? child.bulkName : parent.bulkName;
		const parentID = changingBulk ? parent.bulkRootID : parent.id;
		await this.db?.thing_remember_remoteCreate(child);			// for everything below, need to await child.id fetched from dbDispatch
		const relationship = await this.relationship_remember_remoteCreateUnique(bulkName, null, idPredicateIsAParentOf, parentID, child.id, child.order, CreationOptions.getRemoteID)
		await orders_normalize_remoteMaybe(parent.children);		// write new order values for relationships
		return relationship;
	}

	things_forgetAll() {
		this.knownTs = []; // clear
		this.knownT_byID = {};
		this.knownTs_byTrait = {};
	}

	thing_forget(thing: Thing) {
		delete this.knownT_byID[thing.id];
		this.knownTs = this.knownTs.filter((known) => known.id !== thing.id);
		this.knownTs_byTrait[thing.trait] = this.knownTs_byTrait[thing.trait].filter((known) => known.id !== thing.id);
	}

	async thing_forget_remoteDelete(thing: Thing) {
		this.thing_forget(thing);					// forget first, so onSnapshot logic will not signal children
		await this.db?.thing_remoteDelete(thing);
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
			if (thing.trait == TraitType.root && thing.bulkName == dbDispatch.bulkName) {
				this.root = thing;
			}
		}
	}

	thing_remember_runtimeCreate(bulkName: string, id: string | null, title: string, color: string, trait: string, order: number,
		isRemotelyStored: boolean): Thing {
		const thing = this.thing_runtimeCreate(bulkName, id, title, color, trait, order, isRemotelyStored);
		this.thing_remember(thing);
		return thing;
	}

	async thing_remember_runtimeCopy(bulkName: string, thing: Thing) {
		const newThing = Thing.thing_runtimeCopy(bulkName, thing);
		if (newThing.isBulkAlias || newThing.trait == TraitType.roots || newThing.trait == TraitType.root) {
			newThing.trait = '';
		}
		this.thing_remember(newThing);
		return newThing;
	}

	thing_runtimeCreate(bulkName: string, id: string | null, title: string, color: string, trait: string, order: number,
		isRemotelyStored: boolean): Thing {
		let thing: Thing | null = null;
		if (id && trait == TraitType.root && bulkName != dbDispatch.bulkName) {		// other bulks have their own root & id
			thing = this.thing_bulkRootID_set(bulkName, id, color);				// which our thing needs to adopt
		}
		if (!thing) {
			thing = new Thing(bulkName, id, title, color, trait, order, isRemotelyStored);
			if (bulkName != dbDispatch.bulkName) {
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
			signal(Signals.childrenOf);
		}
	}

	//////////////////////////
	//	 	   BULKS		//
	//////////////////////////

	thing_bulkRootID_set(bulkName: string, id: string, color: string) {
		const thing = this.thing_bulkAlias_getForTitle(bulkName);
		if (thing) {
			thing.needsBulkFetch = false;	// this id is from bulk fetch all
			thing.bulkRootID = id;			// so children relatiohships will work
			thing.color = color;			// N.B., ignore trait
			this.knownT_byID[id] = thing;
			// dbDispatch.db.thing_remoteUpdate(thing);		// not needed if bulk id not remotely stored
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
		signal(Signals.childrenOf, newParent.id);
		if (newParent.isExpanded) {
			newThing.grabOnly();
		} else {
			newParent.grabOnly();
		}
	}

	async thing_remember_bulk_recursive_remoteRelocateRight(thing: Thing, newParent: Thing) {
		const bulkName = newParent.isBulkAlias ? newParent.title : newParent.bulkName;
		const newThing = await this.thing_remember_runtimeCopy(bulkName, thing);
		await this.thing_remember_remoteAddAsChild(newThing, newParent);
		for (const child of thing.children) {
			this.thing_remember_bulk_recursive_remoteRelocateRight(child, newThing);
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
			const roots = this.thing_runtimeCreate(dbDispatch.bulkName, null, 'roots', 'red', TraitType.roots, 0, false);
			await this.thing_remember_remoteAddAsChild(roots, root);
			return roots;
		}
		return null;
	}

	////////////////////////////////////
	//		   RELATIONSHIPS		  //
	////////////////////////////////////

	relationship_remember(relationship: Relationship) {
		if (!this.knownR_byID[relationship.id]) {
			if (relationship.bulkName != dbDispatch.bulkName) {
				debug.log(DebugOption.error, 'RELATIONSHIP ' + relationship.bulkName + ' ' + this.thing_getForID(relationship.idFrom)?.description + ' => ' + this.thing_getForID(relationship.idTo)?.description);
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

	relationships_refreshKnowns_remoteRenormalize() {
		this.relationships_refreshKnowns();
		this.root?.order_normalizeRecursive(true);
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
		const childIsGrabbed = get(idsGrabbed).includes(idChild);
		if (idOriginal == get(idHere) && idOriginal != idParent && childIsGrabbed) {
			const child = this.thing_getForID(idChild);
			child?.grabOnly(); // update crumbs
			if (oParent && !oParent.hasChildren) {
				parent?.becomeHere();
			}
		}
	}

	relationship_remember_runtimeCreateUnique(bulkName: string, idRelationship: string, idPredicate: string, idFrom: string,
		idTo: string, order: number, creationOptions: CreationOptions = CreationOptions.none) {
		let relationship = this.relationships_getByIDPredicateFromAndTo(idPredicate, idFrom, idTo);
		if (relationship) {
			relationship.order_setTo(order, false);						// AND thing are updated
		} else {
			relationship = new Relationship(bulkName, idRelationship, idPredicate, idFrom, idTo, order, creationOptions != CreationOptions.none);
			this.relationship_remember(relationship);
		}
		return relationship;
	}

	async relationship_remember_remoteCreateUnique(bulkName: string, idRelationship: string | null, idPredicate: string, idFrom: string,
		idTo: string, order: number, creationOptions: CreationOptions = CreationOptions.isFromRemote): Promise<any> {
		let relationship = this.relationships_getByIDPredicateFromAndTo(idPredicate, idFrom, idTo);
		if (relationship) {
			relationship.order_setTo(order, false);						// AND thing are updated
		} else {
			relationship = new Relationship(bulkName, idRelationship, idPredicate, idFrom, idTo, order, creationOptions != CreationOptions.none);
			await this.db?.relationship_remember_remoteCreate(relationship);
			this.relationship_remember(relationship);
		}
		return relationship;
	}

	async relationships_forget_remoteDeleteAllForThing(thing: Thing) {
		const array = this.knownRs_byIDTo[thing.id];
		if (array) {
			for (const relationship of array) {
				await this.db?.relationship_remoteDelete(relationship);
				this.relationship_forget(relationship);
			}
		}
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
