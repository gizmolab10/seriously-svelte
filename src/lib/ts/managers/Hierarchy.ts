import { get, User, Thing, Grabs, Access, remove, signal, Signals, TraitType, Predicate, Relationship, dbDispatch } from '../common/GlobalImports';
import { persistLocal, CreationFlag, sort_byOrder, orders_normalize_remoteMaybe } from '../common/GlobalImports';
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
	knownP_byKind: { [kind: string]: Predicate } = {};
	knownA_byKind: { [kind: string]: Access } = {};
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
		const idRoot = this.idRoot;
		if (this.root && idRoot) {
			await this.relationships_remoteCreateMissing();
			// this.relationships_removePhantoms();
			this.root.order_normalizeRecursive(true)	// setup order values for all things and relationships
			this.db?.setHasData(true);
			orders_normalize_remoteMaybe(this.root.children)
			persistLocal.state_updateFor(type, idRoot);
		}
		this.here_restore();
		thingsArrived.set(true);
		isBusy.set(false);
		this.isConstructed = true;
	}

	async relationships_remoteCreateMissing() {
		const idRoot = this.idRoot;
		if (idRoot) {
			for (const thing of this.knownTs) {
				const idThing = thing.id;
				if (idThing != idRoot) {
					let relationship = this.relationship_getWhereIDEqualsTo(idThing);
					if (relationship) {
						thing.order = relationship.order;
					} else {
						const idPredicateIsAParentOf = Predicate.idIsAParentOf;
						await this.relationship_remember_remoteCreateUnique(dbDispatch.bulkName, null, idPredicateIsAParentOf,
							idRoot, idThing, -1, CreationFlag.getRemoteID)
					}
				}
			}
		}
	}

	relationships_removePhantoms() {
		const array = Array<Relationship>();
		for (const relationship of this.knownRs) {
			const thingTo = this.thing_getForID(relationship.idTo);
			const thingFrom = this.thing_getForID(relationship.idFrom);
			if (!thingTo || !thingFrom) {
				array.push(relationship);
				dbDispatch.db.relationship_remoteDelete(relationship);
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
		await this.db?.thing_remember_remoteCreate(child).then(() => { // for everything below, need to await child.id fetched from dbDispatch
			this.relationship_remember_remoteCreateUnique(parent.bulkName, null, idPredicateIsAParentOf, parent.id,
				child.id, child.order, CreationFlag.getRemoteID)
			.then((relationship) => {
				orders_normalize_remoteMaybe(parent.children);		// write new order values for relationships
				Promise.resolve(relationship);
			})
		});
	}

	things_forgetAll() {
		this.knownTs = []; // clear
		this.knownT_byID = {};
	}

	thing_forget(thing: Thing) {
		delete this.knownT_byID[thing.id];
		this.knownTs = this.knownTs.filter((known) => known.id !== thing.id);
	}

	async thing_forget_remoteDelete(thing: Thing) {
		this.thing_forget(thing);					// forget first, so onSnapshot logic will not signal children
		await this.db?.thing_remoteDelete(thing);
	}

	thing_remember(thing: Thing) {
		this.knownT_byID[thing.id] = thing;
		this.knownTs.push(thing);
		if (thing.trait == TraitType.root) {
			this.root = thing;
		}
	}

	thing_runtimeCreate(bulkName: string, id: string | null, title: string, color: string, trait: string, order: number,
		isRemotelyStored: boolean): Thing {
		let thing: Thing | null = null;
		if (id && bulkName && bulkName != dbDispatch.bulkName && trait == TraitType.root) {		// other bulks have their own root & id
			thing = this.thing_remember_bulkAlias_adjust(bulkName, id, color);						// which our (thing and relationship) needs to adopt
		}
		if (!thing) {
			thing = new Thing(bulkName ?? dbDispatch.bulkName, id, title, color, trait, order, isRemotelyStored);
			if (thing.isBulkAlias) {
				thing.needsBulkFetch = true;
			}
		}
		return thing;
	}

	thing_remember_runtimeCreate(bulkName: string, id: string | null, title: string, color: string, trait: string, order: number,
		isRemotelyStored: boolean): Thing {
		const thing = this.thing_runtimeCreate(bulkName, id, title, color, trait, order, isRemotelyStored);
		this.thing_remember(thing);
		return thing;
	}

	async thing_remember_remoteCopy(bulkName: string, thing: Thing) {
		const newThing = Thing.thing_runtimeCreate(bulkName, thing);
		await this.db?.thing_remember_remoteCreate(newThing);
		return newThing;
	}

	//////////////////////////
	//	 	   BULKS		//
	//////////////////////////

	thing_bulkAlias_getForTitle(title: string | null) {
		if (title) {
			for (const thing of this.knownTs) {
				if  (thing.isBulkAlias && (thing.title == title ||
					(thing.title == 'Public' && title == 'seriously'))) {	// special case TODO: convert to a auery string
					return thing;
				}
			}
		}
		return null;
	}

	async thing_remember_bulk_remoteRelocateRight(thing: Thing, newParent: Thing) {
		this.thing_remember_bulk_recursive_remoteRelocateRight(thing, newParent).then((newThing) => {
			signal(Signals.childrenOf, newParent.id);
			if (newParent.isExpanded) {
				newThing.grabOnly();
			} else {
				newParent.grabOnly();
			}
		})
	}

	async thing_remember_bulk_recursive_remoteRelocateRight(thing: Thing, newParent: Thing) {
		const newThing = await this.thing_remember_remoteCopy(newParent.bulkName, thing);
		await this.thing_remember_remoteAddAsChild(newThing, newParent);
		for (const child of thing.children) {
			this.thing_remember_bulk_recursive_remoteRelocateRight(child, newThing);
		}
		await this.thing_forget_remoteDelete(thing);	// remove thing [N.B. and its progney] from current bulk
		await this.relationships_forget_remoteDeleteAllForThing(thing)
		return newThing;
	}

	thing_remember_bulkAlias_adjust(bulkName: string, id: string, color: string) {
		const thing = this.thing_bulkAlias_getForTitle(bulkName);
		if (thing) {	// need alias' parent and child relationships to work
			const relationship = this.relationship_getWhereIDEqualsTo(thing.id);
			if (relationship && relationship.idTo != id) {
				this.relationship_forget(relationship);
				relationship.idTo = id;		// so this relatiohship will continue to work
				this.relationship_remember(relationship);
			}
			this.thing_forget(thing);		// remove stale knowns
			thing.needsBulkFetch = false;	// for when user reveals children: they must first be fetched
			thing.color = color;			// N.B., ignore trait
			thing.id = id;					// so children relatiohships will work
		}
		return thing;
	}

	async thing_getRoots() {
		let root = this.root;
		for (const thing of this.knownTs) {
			if  (thing.trait == TraitType.roots && thing.title == 'roots') {	// special case TODO: convert to a auery string
				return thing;
			}
		}
		if (root) {
			const roots = this.thing_runtimeCreate(dbDispatch.bulkName, null, 'roots', 'red', TraitType.roots, -1, false);
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

	relationships_refreshKnowns_runtimeRenormalize() {
		this.relationships_refreshKnowns();
		this.root?.order_normalizeRecursive(false);
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
		idTo: string, order: number, creationFlag: CreationFlag = CreationFlag.none) {
		let relationship = this.relationships_getByIDPredicateFromAndTo(idPredicate, idFrom, idTo);
		if (relationship) {
			relationship.order_setTo(order, false);						// AND thing are updated
		} else {
			relationship = new Relationship(bulkName, idRelationship, idPredicate, idFrom, idTo, order, creationFlag == CreationFlag.isFromRemote);
			this.relationship_remember(relationship);
		}
		return relationship;
	}

	async relationship_remember_remoteCreateUnique(bulkName: string, idRelationship: string | null, idPredicate: string, idFrom: string,
		idTo: string, order: number, creationFlag: CreationFlag = CreationFlag.none): Promise<any> {
		let relationship = this.relationships_getByIDPredicateFromAndTo(idPredicate, idFrom, idTo);
		if (relationship) {
			relationship.order_setTo(order, false);						// AND thing are updated
		} else {
			relationship = new Relationship(bulkName, idRelationship, idPredicate, idFrom, idTo, order, creationFlag == CreationFlag.isFromRemote);
			await this.db?.relationship_remember_remoteCreate(relationship);
			this.relationship_remember(relationship);
		}
		Promise.resolve(relationship);
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
