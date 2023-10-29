import { k, get, User, Datum, Thing, Grabs, Access, remove, Predicate, Relationship } from '../common/GlobalImports';
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
	get things(): Array<Thing> { return Object.values(this.knownT_byID) };
	hasRootWithTitle(title: string) { return this.thing_getBulkAliasWithTitle(title) != null; }
	thing_getForID(idThing: string | null): Thing | null { return (!idThing) ? null : this.knownT_byID[idThing]; }

	constructor(db: DBInterface) {
		this.db = db;
		idHere.subscribe((id: string | null) => {
			if (this.db && this.db.hasData) {
				this.here = this.thing_getForID(id);
			}
		})
	}
	
	async hierarchy_construct(type: string) {
		const idRoot = this.idRoot;
		if (this.root && idRoot) {
			for (const thing of this.things) {
				const idThing = thing.id;
				if (idThing != idRoot) {
					let relationship = this.relationship_getWhereIDEqualsTo(idThing);
					if (relationship) {
						thing.order = relationship.order;
					} else {
						const idPredicateIsAParentOf = Predicate.idIsAParentOf;
						
						// already determined that WE DO NOT NEED Unique, we do need it's id now

						await this.relationship_remember_remoteCreateUnique(Datum.newID, idPredicateIsAParentOf,
							idRoot, idThing, -1, CreationFlag.getRemoteID)
					}
				}
			}
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

	thing_getRoots() {
		for (const thing of this.knownTs) {
			if  (thing.trait == '^' && thing.title == 'roots') {	// special case TODO: convert to a auery string
				return thing;
			}
		}
		const root = this.root;
		if (root) {
			const roots = this.thing_remember_runtimeCreate(Datum.newID, 'roots', 'red', '^', -1, false);
			this.thing_remoteAddAsChild(roots, root);
			return roots;
		}
		return null;
	}

	thing_getBulkAliasWithTitle(title: string | null) {
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

	async thing_remoteAddAsChild(child: Thing, parent: Thing): Promise<any> {
		const idPredicateIsAParentOf = Predicate.idIsAParentOf;
		const idRelationship = Datum.newID;
		await this.db?.thing_remoteCreate(child).then(() => { // for everything below, need to await child.id fetched from dbDispatch
			this.thing_remember(child);
			this.relationship_remember_remoteCreateUnique(idRelationship, idPredicateIsAParentOf, parent.id,
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
	}

	async thing_forget_remoteDelete(thing: Thing) {
		await this.db?.thing_remoteDelete(thing);
		this.thing_forget(thing);
	}

	thing_remember(thing: Thing) {
		this.knownT_byID[thing.id] = thing;
		this.knownTs.push(thing);
		if (thing.trait == '!') {
			this.root = thing;
		}
	}

	thing_remember_runtimeCreateAt(order: number, color: string) {
		return this.thing_remember_runtimeCreate(Datum.newID, k.defaultTitle, color, '', order, false);
	}

	thing_remember_runtimeCreate(id: string, title: string, color: string, trait: string, order: number,
		isRemotelyStored: boolean, bulkName: string | null = null): Thing {
		let thing: Thing | null = null;
		if (trait == '!' && bulkName) {
			thing = this.thing_getBulkAliasWithTitle(bulkName);
			if (thing) {	//  this is a bulk alias
				//				need relationships to work
				const relationship = this.relationship_getWhereIDEqualsTo(thing.id);
				if (relationship && relationship.idTo != id) {
					this.relationship_forget(relationship);
					relationship.idTo = id; // so this relatiohship will continue to work
					this.relationship_remember(relationship);
				}
				this.thing_forget(thing);		// remove stale knowns
				thing.needsBulkFetch = false;	// for when user reveals children: they must first be fetched
				thing.color = color;			// N.B., ignore trait
				thing.id = id;					// so children relatiohships will work
			}
		}
		if (!thing) {
			thing = new Thing(id, title, color, trait, order, isRemotelyStored);
			if (thing.isBulkAlias) {
				thing.needsBulkFetch = true;
			}
		}
		this.thing_remember(thing);
		return thing;
	}

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
		// this.root?.order_normalizeRecursive(false);
	}

	relationships_clearKnowns() {
		this.knownRs = [];
		this.knownR_byID = {};
		this.knownRs_byIDTo = {};
		this.knownRs_byIDFrom = {};
		this.knownRs_byIDPredicate = {};
	}

	relationships_refreshKnowns() {
		const saved = this.knownRs;
		this.relationships_clearKnowns();
		for (const relationship of saved) {
			this.relationship_remember(relationship);
		}
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

	relationship_remember_runtimeCreateUnique(idRelationship: string, idPredicate: string, idFrom: string,
		idTo: string, order: number, creationFlag: CreationFlag = CreationFlag.none) {
		let relationship = this.relationships_getByIDPredicateFromAndTo(idPredicate, idFrom, idTo);
		if (relationship) {
			relationship.order_setTo(order, false);						// AND thing are updated
		} else {
			relationship = new Relationship(idRelationship, idPredicate, idFrom, idTo, order, creationFlag == CreationFlag.isFromRemote);
			this.relationship_remember(relationship);
		}
		return relationship;
	}

	async relationship_remember_remoteCreateUnique(idRelationship: string, idPredicate: string, idFrom: string,
		idTo: string, order: number, creationFlag: CreationFlag = CreationFlag.none): Promise<any> {
		let relationship = this.relationships_getByIDPredicateFromAndTo(idPredicate, idFrom, idTo);
		if (relationship) {
			relationship.order_setTo(order, false);						// AND thing are updated
		} else {
			relationship = new Relationship(idRelationship, idPredicate, idFrom, idTo, order, creationFlag == CreationFlag.isFromRemote);
			this.relationship_remember(relationship);
			await relationship.remoteWrite();
		}
		Promise.resolve(relationship);
	}

	async relationship_forget_remoteDeleteAllForThing(thing: Thing) {
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
