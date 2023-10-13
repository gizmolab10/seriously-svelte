import { get, User, Datum, Thing, Grabs, Access, remove, constants, Predicate, dbDispatch, Relationship } from '../common/GlobalImports';
import { persistLocal, CreationFlag, normalizeOrderOf, sortAccordingToOrder } from '../common/GlobalImports';
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
	_grabs: Grabs | null = null;
	root: Thing | null = null;
	here: Thing | null = null;
	isConstructed = false;
	db: DBInterface;

	get hasNothing(): boolean { return !this.root; }
	get idRoot(): (string | null) { return this.root?.id ?? null; };
	get things(): Array<Thing> { return Object.values(this.knownT_byID) };
	hasRootWithTitle(title: string) { return this.getRootThingWithTitle(title) != null; }
	getThing_forID(idThing: string | null): Thing | null { return (!idThing) ? null : this.knownT_byID[idThing]; }
	getPredicate_forID(idPredicate: string | null): Predicate | null { return (!idPredicate) ? null : this.knownP_byID[idPredicate]; }

	constructor(db: DBInterface) {
		this.db = db;
		idHere.subscribe((id: string | null) => {
			if (this.db.hasData) {
				this.here = this.getThing_forID(id);
			}
		})
	}
	
	async constructHierarchy(type: string) {
		const idRoot = this.idRoot;
		if (this.root && idRoot) {
			for (const thing of this.things) {
				const idThing = thing.id;
				if (idThing != idRoot) {
					let relationship = this.getRelationship_whereIDEqualsTo(idThing);
					if (relationship) {
						thing.order = relationship.order;
					} else {
						const idPredicateIsAParentOf = Predicate.idIsAParentOf;
						
						// already determined that WE DO NOT NEED NoDuplicate, we do need it's id now

						await this.rememberRelationship_remoteCreate(Datum.newID, idPredicateIsAParentOf, idRoot, idThing, -1, CreationFlag.getRemoteID)
					}
				}
			}
			this.root.normalizeOrder_recursive(true)	// setup order values for all things and relationships
			this.db.hasData = true;
			normalizeOrderOf(this.root.children)
			dbDispatch.updateStateFor(type, idRoot);
		}
		this.restoreHere();
		thingsArrived.set(true);
		isBusy.set(false);
		this.isConstructed = true;
	}

	restoreHere() {
		let here = this.getThing_forID(get(idHere));
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

	getBulkAliasWithTitle(title: string) {
		for (const thing of this.knownTs) {
			if  (thing.isBulkAlias && (thing.title == title ||
				(thing.title == 'Public' && title == 'seriously'))) {	// special case TODO: convert to a auery string
				return thing;
			}
		}
		return null;
	}

	//////////////////////////////
	//			MEMORY			//
	//////////////////////////////

	rememberThing(thing: Thing) {
		this.knownT_byID[thing.id] = thing;
		this.knownTs.push(thing);
		if (thing.trait == '!') {
			this.root = thing;
		}
	}

	forgetThing(thing: Thing) {
		delete this.knownT_byID[thing.id];
	}

	async forgetThing_remoteDelete(thing: Thing) {
		await this.db.thing_remoteDelete(thing);
		this.forgetThing(thing);
	}

	rememberRelationship(relationship: Relationship) {
		if (!this.knownR_byID[relationship.id]) {
			this.knownRs.push(relationship);
			this.knownR_byID[relationship.id] = relationship;
			this.rememberRelationshipByKnown(this.knownRs_byIDTo, relationship.idTo, relationship);
			this.rememberRelationshipByKnown(this.knownRs_byIDFrom, relationship.idFrom, relationship);
			this.rememberRelationshipByKnown(this.knownRs_byIDPredicate, relationship.idPredicate, relationship);
		}
	}

	forgetRelationship(relationship: Relationship) {
		remove<Relationship>(this.knownRs, relationship);
		delete this.knownR_byID[relationship.id];
		this.forgetRelationshipByKnown(this.knownRs_byIDTo, relationship.idTo, relationship);
		this.forgetRelationshipByKnown(this.knownRs_byIDFrom, relationship.idFrom, relationship);
		this.forgetRelationshipByKnown(this.knownRs_byIDPredicate, relationship.idPredicate, relationship);
		relationship.log('forget');
	}

	forgetRelationshipByKnown(known: KnownRelationships, idRelationship: string, relationship: Relationship) {
		let array = known[idRelationship] ?? [];
		remove<Relationship>(array, relationship)
		known[idRelationship] = array;
	}

	rememberRelationshipByKnown(known: KnownRelationships, idRelationship: string, relationship: Relationship) {
		let array = known[idRelationship] ?? [];
		array.push(relationship);
		known[idRelationship] = array;
	}

	rememberThing_runtimeCreateAt(order: number, color: string) {
		return this.rememberThing_runtimeCreate(Datum.newID, constants.defaultTitle, color, '', order, false);
	}

	rememberThing_runtimeCreate(id: string, title: string, color: string, trait: string, order: number, isRemotelyStored: boolean): Thing {
		let thing = this.getBulkAliasWithTitle(title);
		if (thing) {					// this is the bulk alias
			const relationship = this.getRelationship_whereIDEqualsTo(thing.id);
			if (relationship) {
				this.forgetRelationship(relationship);
				relationship.idTo = id; // so this relatiohship will continue to work
				this.rememberRelationship(relationship);
			}
			this.forgetThing(thing);
			thing.needsBulkFetch = false;
			thing.color = color;		// ignore trait
			thing.id = id;				// so children relatiohships will work
		} else {
			thing = new Thing(id, title, color, trait, order, isRemotelyStored);
			if (thing.isBulkAlias) {
				thing.needsBulkFetch = true;
			}
		}
		this.rememberThing(thing);
		return thing;
	}

	relationships_refreshKnowns_runtimeRenormalize() {
		this.relationships_refreshKnowns();
		// this.root?.normalizeOrder_recursive(false);
	}

	////////////////////////////////////
	//		   RELATIONSHIPS		  //
	////////////////////////////////////

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
			this.rememberRelationship(relationship);
		}
	}

	relationships_accomodateRelocations(original: Relationship, relationship: Relationship) {
		const idChild = relationship.idTo;
		const idOriginal = original.idFrom;
		const idParent = relationship.idFrom;
		const parent = this.getThing_forID(idParent);
		const oParent = this.getThing_forID(idOriginal);
		const childIsGrabbed = get(idsGrabbed).includes(idChild);
		if (idOriginal == get(idHere) && idOriginal != idParent && childIsGrabbed) {
			const child = this.getThing_forID(idChild);
			child?.grabOnly(); // update crumbs
			if (oParent && !oParent.hasChildren) {
				parent?.becomeHere();
			}
		}
	}

	rememberRelationship_runtimeCreate(idRelationship: string, idPredicate: string, idFrom: string, idTo: string, order: number, creationFlag: CreationFlag = CreationFlag.none) {
		const relationship = new Relationship(idRelationship, idPredicate, idFrom, idTo, order, creationFlag == CreationFlag.isFromRemote);
		this.rememberRelationship(relationship);
		return relationship;
	}

	async rememberRelationship_remoteCreate(idRelationship: string, idPredicate: string, idFrom: string, idTo: string, order: number, creationFlag: CreationFlag = CreationFlag.none) {
		const relationship = this.rememberRelationship_runtimeCreate(idRelationship, idPredicate, idFrom, idTo, order, creationFlag);
		await relationship.remoteWrite();
		return relationship;
	}

	async rememberRelationship_remoteCreateNoDuplicate(idRelationship: string, idPredicate: string, idFrom: string, idTo: string, order: number, creationFlag: CreationFlag = CreationFlag.none) {
		return this.getRelationship_whereIDEqualsTo(idTo) ?? await this.rememberRelationship_remoteCreate(idRelationship, idPredicate, idFrom, idTo, order, creationFlag);
	}

	async forgetRelationships_remoteDeleteAllForThing(thing: Thing) {
		const array = this.knownRs_byIDTo[thing.id];
		if (array) {
			for (const relationship of array) {
				await this.db.relationship_remoteDelete(relationship);
				this.forgetRelationship(relationship);
			}
		}
	}

	//////////////////////////
	//			GET			//
	//////////////////////////

	getThings_forIDs(ids: Array<string>): Array<Thing> {
		const array = Array<Thing>();
		for (const id of ids) {
			const thing = this.getThing_forID(id);
			if (thing) {
				array.push(thing);
			}
		}
		return sortAccordingToOrder(array);
	}

	getThings_byIDPredicateToAndID(idPredicate: string, to: boolean, idThing: string): Array<Thing> {
		const matches = this.getRelationships_byIDPredicateToAndID(idPredicate, to, idThing);
		const ids: Array<string> = [];
		if (Array.isArray(matches) && matches.length > 0) {
			for (const relationship of matches) {
				ids.push(to ? relationship.idFrom : relationship.idTo);
			}
		}
		return this.getThings_forIDs(ids);
	}

	getRelationship_whereIDEqualsTo(idThing: string, to: boolean = true) {
		const idPredicateIsAParentOf = Predicate.idIsAParentOf;
		const matches = this.getRelationships_byIDPredicateToAndID(idPredicateIsAParentOf, to, idThing);
		if (matches.length > 0) {
			const relationship = matches[0];
			// relationship.log('known');
			return relationship;
		}
		return null;		
	}

	getRelationships_byIDPredicateToAndID(idPredicate: string, to: boolean, idThing: string): Array<Relationship> {
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

	//////////////////////////////////////
	//			ANCILLARY DATA			//
	//////////////////////////////////////

	rememberPredicate(predicate: Predicate) {
		this.knownP_byKind[predicate.kind] = predicate;
		this.knownP_byID[predicate.id] = predicate;
	}

	rememberPredicate_runtimeCreate(id: string, kind: string) {
		const predicate = new Predicate(id, kind);
		this.rememberPredicate(predicate)
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
