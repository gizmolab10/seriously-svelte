import { g, k, u, Thing, Trait, debug, signals, DebugFlag, Predicate, TraitType } from '../common/Global_Imports';
import { ThingType, persistLocal, IDPersistent, Relationship, CreationOptions } from '../common/Global_Imports';
import { QuerySnapshot, serverTimestamp, DocumentReference, CollectionReference } from 'firebase/firestore';
import { onSnapshot, deleteField, getFirestore, DocumentData, DocumentChange } from 'firebase/firestore';
import { doc, addDoc, setDoc, getDocs, deleteDoc, updateDoc, collection } from 'firebase/firestore';
import { DBType, DatumType } from '../basis/Persistent_Identifiable';
import Identifiable from '../basis/Identifiable';
import { initializeApp } from 'firebase/app';
import DBCommon from './DBCommon';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional

export default class DBFirebase extends DBCommon {
	firebaseConfig = {
		appId: "1:224721814373:web:0c60f394c056ef3decd78c",
		apiKey: "AIzaSyAFy4H3Ej5zfI46fvCJpBfUxmyQco-dx9U",
		authDomain: "seriously-4536d.firebaseapp.com",
		storageBucket: "seriously-4536d.appspot.com",
		messagingSenderId: "224721814373",
		measurementId: "G-9PY9LVK813",
		projectId: "seriously-4536d"
	};

	isRemote = true;
	baseID = 'Public';
	addedThing!: Thing;
	addedTrait!: Trait;
	isPersistent = true;
	bulksName = 'Bulks';
	bulks!: Array<Bulk>;
	deferSnapshots = false;
	dbType = DBType.firebase;
	app = initializeApp(this.firebaseConfig);
	firestore = getFirestore(this.app);
	predicatesCollection!: CollectionReference;
	deferredSnapshots: Array<SnapshotDeferal> = [];

	reportError(error: any) { console.log(error); }

	queryStrings_apply() {
		const persistedID = persistLocal.read_key(IDPersistent.base_id);
		const id = g.queryStrings.get('name') ?? g.queryStrings.get('dbid') ?? persistedID ?? 'Public';
		persistLocal.write_key(IDPersistent.base_id, id);
		this.baseID = id;
	}

	async remove_all() {
		const documentRef = doc(this.firestore, this.bulksName, this.baseID);
		await this.subcollections_persistentDeleteIn(documentRef);

		try {
			await deleteDoc(documentRef);
		} catch (error) {
			this.reportError(error);
		}
	}

	static readonly FETCH: unique symbol;

	async fetch_all() {
		await this.recordLoginIP();
		await this.fetch_documentsOf(DatumType.predicates);
		await this.hierarchy_fetchForID(this.baseID);
		await this.fetch_bulkAliases();		// TODO: assumes all ancestries are already created
		this.setup_remote_handlers();
	}

	async hierarchy_fetchForID(baseID: string) {
		await this.fetch_documentsOf(DatumType.things, baseID);
		await this.fetch_documentsOf(DatumType.traits, baseID);
		await this.fetch_documentsOf(DatumType.relationships, baseID);
	}
		
	async fetch_documentsOf(datum_type: DatumType, baseID: string | null = null) {
		try {
			const collectionRef = !baseID ? collection(this.firestore, datum_type) : collection(this.firestore, this.bulksName, baseID, datum_type);
			let querySnapshot = await getDocs(collectionRef);
			if (!!baseID) {
				if (querySnapshot.empty) {
					await this.document_defaults_ofType_persistentCreateIn(datum_type, baseID, collectionRef);
					querySnapshot = await getDocs(collectionRef);
				}
			}
			const docs = querySnapshot.docs;
			debug.log_remote('READ ' + docs.length + ' from ' + baseID + ':' + datum_type);
			for (const docSnapshot of docs) {
				const id = docSnapshot.id;
				const data = docSnapshot.data();
				await this.document_ofType_remember_validated(datum_type, id, data, baseID ?? this.baseID);
			}
		} catch (error) {
			this.reportError(error);
		}
	}

	static readonly BULKS: unique symbol;

	bulk_for(baseID: string | null) {
		if (!!baseID) {
			if (!this.bulks) {
				this.bulks = [new Bulk(this.baseID)];
			}
			const bulks = this.bulks;
			if (!!bulks) {
				for (const bulk of bulks) {
					if (bulk.baseID == baseID) {
						return bulk;
					}
				}
				const newBulk = new Bulk(baseID);
				bulks.push(newBulk);
				return newBulk;
			}
		}
		return null;
	}
	
	async fetch_bulkAliases() {
		const h = this.hierarchy;
		const root = h.root;
		if (this.baseID == k.name_bulkAdmin && root) {
			const rootsAncestry = await h.ancestry_roots();		// TODO: assumes all ancestries created
			if (!!rootsAncestry) {
				h.rootsAncestry = rootsAncestry;
				try {		// add bulk aliases to roots thing
					const bulk = collection(this.firestore, this.bulksName);	// fetch all bulks (documents)
					let bulkSnapshot = await getDocs(bulk);
					for (const bulkDoc of bulkSnapshot.docs) {
						const baseID = bulkDoc.id;
						if (baseID != this.baseID) {
							let thing = h.bulks_alias_forTitle_ofThing(baseID);
							if (!thing) {								// create a thing for each bulk
								thing = h.thing_runtimeCreate(this.baseID, Identifiable.newID(), baseID, 'red', ThingType.bulk);
								await h.relationship_remember_persistent_addChild_toAncestry(thing, rootsAncestry);
							} else if (thing.thing_isBulk_expanded) {
								await h.ancestry_redraw_persistentFetchBulk_browseRight(thing);
							}
						}
					}
					// TODO: detect when a root disappears
				} catch (error) {
					this.reportError(error);
				}
			}
		}
	}

	static readonly REMOTE: unique symbol;
	
	snapshot_deferOne(baseID: string, datum_type: DatumType, snapshot: QuerySnapshot) {
		const deferral = new SnapshotDeferal(baseID, datum_type, snapshot);
		this.deferredSnapshots.push(deferral);
	}

	handle_deferredSnapshots() {
		this.deferSnapshots = false;
		while (this.deferredSnapshots.length > 0) {
			const deferral = this.deferredSnapshots.pop();
			if (!!deferral) {
				deferral.snapshot.docChanges().forEach((change) => {	// convert and remember
					this.handle_docChanges(deferral.baseID, deferral.datum_type, change);
				});
			}
		}
	}

	setup_remote_handlers() {
		for (const datum_type of this.hierarchy.fetching_dataTypes) {
			if (datum_type == DatumType.predicates) {
				this.predicatesCollection = collection(this.firestore, datum_type);
			} else {
				const baseID = this.baseID;
				const bulk = this.bulk_for(baseID);
				const collectionRef = collection(this.firestore, this.bulksName, baseID, datum_type);
				if (!!bulk) {
					switch (datum_type) {
						case DatumType.things:				 bulk.thingsCollection = collectionRef; break;
						case DatumType.traits:				 bulk.traitsCollection = collectionRef; break;
						case DatumType.relationships: bulk.relationshipsCollection = collectionRef; break;
					}
				}
				onSnapshot(collectionRef, (snapshot) => {
					if (this.hierarchy.isAssembled) {		// u.ignore snapshots caused by data written to server
						if (this.deferSnapshots) {
							this.snapshot_deferOne(baseID, datum_type, snapshot);
						} else {
							snapshot.docChanges().forEach(async (change) => {	// convert and remember
								await this.handle_docChanges(baseID, datum_type, change);
							});
						}
					}
				})
			}
		}
	}

	async handle_docChanges(baseID: string, datum_type: DatumType, change: DocumentChange) {
		const doc = change.doc;
		const data = doc.data();
		if (DBFirebase.data_isValidOfKind(datum_type, data)) {
			const id = doc.id;

			//////////////////////////////
			//	ignores predicate data  //
			//////////////////////////////

			try {
				switch (datum_type) {
					case DatumType.things:		  this.thing_handle_docChanges(baseID, id, change, data); break;
					case DatumType.traits:		  this.trait_handle_docChanges(baseID, id, change, data); break;
					case DatumType.relationships: this.relationship_handle_docChanges(baseID, id, change, data); break;
				}
			} catch (error) {
				this.reportError(error);
			}
			debug.log_remote('HANDLE ' + baseID + ':' + datum_type + k.space + change.type);
		}
	}

	static readonly SUBCOLLECTIONS: unique symbol;

	async document_defaults_ofType_persistentCreateIn(datum_type: DatumType, baseID: string, collectionRef: CollectionReference) {
		if (!!baseID) {
			const docRef = doc(this.firestore, this.bulksName, baseID);
			await setDoc(docRef, { isReal: true }, { merge: true });
			await updateDoc(docRef, { isReal: deleteField() });
		}
		switch (datum_type) {
			case DatumType.predicates: this.hierarchy.predicate_defaults_remember_runtimeCreate(); break;
			case DatumType.things: await this.root_default_remember_persistentCreateIn(collectionRef); break;
		}
	}

	async document_ofType_remember_validated(datum_type: DatumType, id: string, data: DocumentData, baseID: string) {
		if (DBFirebase.data_isValidOfKind(datum_type, data)) {
			const h = this.hierarchy;
			switch (datum_type) {
				case DatumType.predicates:	  h.predicate_remember_runtimeCreate(id, data.kind, data.isBidirectional); break;
				case DatumType.traits:		  h.trait_remember_runtimeCreate(baseID, id, data.ownerID, data.type, data.text, true); break;
				case DatumType.things:		  h.thing_remember_runtimeCreate(baseID, id, data.title, data.color, data.type ?? data.trait, true, !data.type); break;
				case DatumType.relationships: h.relationship_remember_runtimeCreateUnique(baseID, id, data.predicate.id, data.parent.id, data.child.id, data.order, CreationOptions.isFromPersistent); break;
			}
		}
	}
	
	async subcollections_persistentDeleteIn(docRef: DocumentReference) {
		const subcollectionNames = ['Things', 'Relationships'];
		for (const subcollectionName of subcollectionNames) {
			const subcollectionRef = collection(docRef, subcollectionName);
			const snapshot = await getDocs(subcollectionRef);
			for (const subDoc of snapshot.docs) {
				await deleteDoc(subDoc.ref);
			}
		}
	}

	static readonly THING: unique symbol;

	async thing_remember_persistentCreate(thing: Thing) {
		const thingsCollection = this.bulk_for(thing.baseID)?.thingsCollection;
		if (!!thingsCollection) {
			const remoteThing = new PersistentThing(thing);
			const jsThing = { ...remoteThing };
			thing.state.awaitingCreation = true;
			this.addedThing = thing;
			try {
				this.deferSnapshots = true;
				const ref = await addDoc(thingsCollection, jsThing);
				thing.state.awaitingCreation = false;
				thing.state.already_persisted = true;
				this.hierarchy.thing_remember_updateID_to(thing, ref.id);
				this.handle_deferredSnapshots();
				thing.log(DebugFlag.remote, 'CREATE T');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	async root_default_remember_persistentCreateIn(collectionRef: CollectionReference) {
		const fields = ['title', 'color', 'type'];
		const root = new Thing(this.baseID, Identifiable.newID(), this.baseID, 'coral', ThingType.root, true);
		const rootRef = await addDoc(collectionRef, u.convertToObject(root, fields));		// no need to remember now
		root.log(DebugFlag.remote, 'CREATE T');
		this.hierarchy.root = root;
		root.setID(rootRef.id);
	}

	async thing_persistentUpdate(thing: Thing) {
		const thingsCollection = this.bulk_for(thing.baseID)?.thingsCollection;
		if (!!thingsCollection) {
			const ref = doc(thingsCollection, thing.id) as DocumentReference<Thing>;
			const remoteThing = new PersistentThing(thing);
			const jsThing = { ...remoteThing };
			try {
				await setDoc(ref, jsThing);
				thing.log(DebugFlag.remote, 'UPDATE T');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	async thing_persistentDelete(thing: Thing) {
		const thingsCollection = this.bulk_for(thing.baseID)?.thingsCollection;
		if (!!thingsCollection) {
			try {
				const ref = doc(thingsCollection, thing.id) as DocumentReference<Thing>;
				await deleteDoc(ref);
				thing.log(DebugFlag.remote, 'DELETE T');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	thing_extractChangesFromPersistent(thing: Thing, from: PersistentThing) {
		const changed = !from.isEqualTo(thing);
		if (changed) {
			thing.title		  = from.virginTitle;
			thing.color		  = from.color;
			thing.type		  = from.type;
		}
		return changed;
	}

	thing_handle_docChanges(baseID: string, id: string, change: DocumentChange, data: DocumentData) {
		const remoteThing = new PersistentThing(data);
		const h = this.hierarchy;
		let thing = h.thing_forHID(id.hash());
		if (!!remoteThing) {
			switch (change.type) {
				case 'added':
					if (!!thing || remoteThing.isEqualTo(this.addedThing) || remoteThing.type == ThingType.root) {
						return;			// do not invoke signal because nothing has changed
					}
					thing = h.thing_remember_runtimeCreate(baseID, id, remoteThing.title, remoteThing.color, remoteThing.type, true);
					break;
				case 'removed':
					if (!!thing) {
						h.thing_forget(thing);
					}
					break;
				case 'modified':
					if (!thing || thing.state.wasModifiedWithinMS(800) || !this.thing_extractChangesFromPersistent(thing, remoteThing)) {
						return;		// do not invoke signal if nothing changed
					}
					break;
			}
			signals.signal_rebuildGraph_fromFocus();
		}
	}

	static readonly TRAIT: unique symbol;

	trait_extractChangesFromPersistent(trait: Trait, from: PersistentTrait) {
		const changed = !from.isEqualTo(trait);
		if (changed) {
			trait.ownerID = from.ownerID;
			trait.type	  = from.type;
			trait.text	  = from.text;
		}
		return changed;
	}

	async trait_persistentDelete(trait: Trait) {
		const traitsCollection = this.bulk_for(trait.baseID)?.traitsCollection;
		if (!!traitsCollection) {
			try {
				const ref = doc(traitsCollection, trait.id) as DocumentReference<Trait>;
				await deleteDoc(ref);
				trait.log(DebugFlag.remote, 'DELETE T');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	async trait_persistentUpdate(trait: Trait) {
		const traitsCollection = this.bulk_for(trait.baseID)?.traitsCollection;
		if (!!traitsCollection) {
			const ref = doc(traitsCollection, trait.id) as DocumentReference<Trait>;
			const remoteTrait = new PersistentTrait(trait);
			const jsTrait = { ...remoteTrait };
			try {
				await setDoc(ref, jsTrait);
				trait.log(DebugFlag.remote, 'UPDATE T');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	async trait_remember_persistentCreate(trait: Trait) {
		const traitsCollection = this.bulk_for(trait.baseID)?.traitsCollection;
		if (!!traitsCollection) {
			const remoteTrait = new PersistentTrait(trait);
			const jsTrait = { ...remoteTrait };
			trait.state.awaitingCreation = true;
			this.addedTrait = trait;
			try {
				this.deferSnapshots = true;
				const ref = await addDoc(traitsCollection, jsTrait)
				const h = this.hierarchy;
				trait.state.awaitingCreation = false;
				trait.state.already_persisted = true;
				h.trait_forget(trait);
				trait.setID(ref.id);
				h.trait_remember(trait);
				this.handle_deferredSnapshots();
				trait.log(DebugFlag.remote, 'CREATE T');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	trait_handle_docChanges(baseID: string, id: string, change: DocumentChange, data: DocumentData) {
		const remoteTrait = new PersistentTrait(data);
		if (!!remoteTrait) {
			const h = this.hierarchy;
			let trait = h.trait_forHID(id.hash());
			switch (change.type) {
				case 'added':
					if (!!trait || remoteTrait.isEqualTo(this.addedTrait)) {
						return;		// do not invoke signal because nothing has changed
					}
					trait = h.trait_remember_runtimeCreate(baseID, id, remoteTrait.ownerID, remoteTrait.type, remoteTrait.text, true);
					break;
				case 'removed':
					if (!!trait) {
						h.trait_forget(trait);
					}
					break;
				case 'modified':
					if (!trait || trait.state.wasModifiedWithinMS(800) || !this.trait_extractChangesFromPersistent(trait, remoteTrait)) {
						return;		// do not invoke signal because nothing has changed
					}
					break;
			}
			setTimeout(() => { // wait in case a thing involved in this trait arrives in the data
				h.traits_refreshKnowns();
				signals.signal_rebuildGraph_fromFocus();
			}, 20);
		}
	}
	
	static readonly PREDICATE: unique symbol;

	async predicate_persistentUpdate(predicate: Predicate) {
		const predicatesCollection = this.predicatesCollection;
		if (!!predicatesCollection) {
			try {
				const ref = doc(predicatesCollection, predicate.id) as DocumentReference<PersistentPredicate>;
				const remotePredicate = new PersistentPredicate(predicate);
				const jsPredicate = { ...remotePredicate };
				await setDoc(ref, jsPredicate);
				predicate.log(DebugFlag.remote, 'UPDATE P');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	async predicate_persistentDelete(predicate: Predicate) {
		const predicatesCollection = this.predicatesCollection;
		if (!!predicatesCollection) {
			try {
				const ref = doc(predicatesCollection, predicate.id) as DocumentReference<PersistentPredicate>;
				await deleteDoc(ref);
				predicate.log(DebugFlag.remote, 'DELETE P');
			} catch (error) {
				this.reportError(error);
			}
		}
	}
	async predicate_remember_persistentCreate(predicate: Predicate) {
		const predicatesCollection = this.predicatesCollection;
		if (!!predicatesCollection) {
			const remotePredicate = new PersistentPredicate(predicate);
			const jsPredicate = { ...remotePredicate };
			predicate.state.awaitingCreation = true;
			try {
				this.deferSnapshots = true;
				const ref = await addDoc(predicatesCollection, jsPredicate);
				const h = this.hierarchy;
				predicate.state.awaitingCreation = false;
				predicate.state.already_persisted = true;
				h.predicate_forget(predicate);
				predicate.setID(ref.id);
				h.predicate_remember(predicate);
				this.handle_deferredSnapshots();
				predicate.log(DebugFlag.remote, 'CREATE P');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	static readonly RELATIONSHIP: unique symbol;

	async relationship_persistentDelete(relationship: Relationship) {
		const relationshipsCollection = this.bulk_for(relationship.baseID)?.relationshipsCollection;
		if (!!relationshipsCollection) {
			try {
				const ref = doc(relationshipsCollection, relationship.id) as DocumentReference<PersistentRelationship>;
				await deleteDoc(ref);
				relationship.log(DebugFlag.remote, 'DELETE R');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	async relationship_persistentUpdate(relationship: Relationship) {
		const relationshipsCollection = this.bulk_for(relationship.baseID)?.relationshipsCollection;
		if (!!relationshipsCollection) {
			try {
				const ref = doc(relationshipsCollection, relationship.id) as DocumentReference<PersistentRelationship>;
				const remoteRelationship = new PersistentRelationship(relationship);
				const jsRelationship = { ...remoteRelationship };
				await setDoc(ref, jsRelationship);
				relationship.log(DebugFlag.remote, 'UPDATE R');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	relationship_extractChangesFromPersistent(relationship: Relationship, remote: PersistentRelationship) {
		const changed = (relationship.kindPredicate != remote.predicate.id ||
			relationship.idParent != remote.parent.id ||
			relationship.idChild != remote.child.id ||
			relationship.order != remote.order)
		if (changed) {
			relationship.idChild = remote.child.id;
			relationship.idParent = remote.parent.id;
			relationship.state.already_persisted = true;
			relationship.kindPredicate = remote.predicate.id;
			relationship.order_setTo_persistentMaybe(remote.order + k.halfIncrement);
		}
		return changed;
	}

	async relationship_remember_persistentCreate(relationship: Relationship) {
		const relationshipsCollection = this.bulk_for(relationship.baseID)?.relationshipsCollection;
		if (!!relationshipsCollection) {
			const remoteRelationship = new PersistentRelationship(relationship);
			const jsRelationship = { ...remoteRelationship };
			relationship.state.awaitingCreation = true;
			try {
				this.deferSnapshots = true;
				const ref = await addDoc(relationshipsCollection, jsRelationship);
				const h = this.hierarchy;
				relationship.state.awaitingCreation = false;
				relationship.state.already_persisted = true;
				h.relationship_forget(relationship);
				relationship.setID(ref.id);
				h.relationship_remember(relationship);
				this.handle_deferredSnapshots();
				relationship.log(DebugFlag.remote, 'CREATE R');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	relationship_handle_docChanges(baseID: string, id: string, change: DocumentChange, data: DocumentData) {
		const remoteRelationship = new PersistentRelationship(data);
		if (!!remoteRelationship) {
			const h = this.hierarchy;
			let relationship = h.relationship_forHID(id.hash());
			switch (change.type) {
				case 'added':
					if (!!relationship) {
						return;
					}
					relationship = h.relationship_remember_runtimeCreateUnique(baseID, id, remoteRelationship.predicate.id, remoteRelationship.parent.id, remoteRelationship.child.id, remoteRelationship.order, CreationOptions.isFromPersistent);
					break;
				default:
					if (!relationship) {
						return;	// not known so do not signal
					} else {
						switch (change.type) {
							case 'modified':
								if (relationship.state.wasModifiedWithinMS(800) || !this.relationship_extractChangesFromPersistent(relationship, remoteRelationship)) {
									return;	// already known and contains no new data, or needs to be 'tamed'
								}
								break;
							case 'removed':
								h.relationship_forget(relationship);
								break;
						}
					}
					break;
			}
			setTimeout(() => { // wait in case a thing involved in this relationship arrives in the data
				h.relationships_refreshKnowns();
				h.rootAncestry.order_normalizeRecursive_persistentMaybe(true);
				signals.signal_rebuildGraph_fromFocus();
			}, 20);
		}
	}

	static readonly VALIDATION: unique symbol;

	static data_isValidOfKind(datum_type: DatumType, data: DocumentData) {
		switch (datum_type) {
			case DatumType.things:		
				const thing = data as Thing;	
				if (thing.hasNoData) {
					return false;
				}
				break;
			case DatumType.traits:		
				const trait = data as Trait;	
				if (trait.hasNoData) {
					return false;
				}
				break;
			case DatumType.predicates:
				if (!data.kind) {
					return false;
				}
				break;
			case DatumType.relationships:
				const relationship = data as PersistentRelationship;
				if (!relationship.predicate || !relationship.parent || !relationship.child) {
					return false;
				}
				break;
			default:
				return false;
		}
		return true;
	}

	async recordLoginIP() {
		await this.getUserIPAddress().then( async (ipAddress) => {
			if (!!ipAddress && ipAddress != '69.181.235.85') {
				const queryStrings = g.queryStrings.toString() ?? 'empty';
				const logRef = collection(this.firestore, 'access_logs');
				const item = {
					queries: queryStrings,
					build: k.build_number,
					ipAddress: ipAddress,
					timestamp: serverTimestamp(),
				}
				const jsItem = { ...item };
				try {
					await addDoc(logRef, jsItem);
				} catch (error) {
					this.reportError(error);
				}
			}
		});
	}
	
	async getUserIPAddress(): Promise<string | null> {
		try {
			// Use an external service to determine the IP address (you can replace this URL with a different service if needed).
			const response = await fetch('https://ipv4.icanhazip.com');
			if (!response.ok) {
				throw new Error('Unable to fetch IP address.');
			}
			const ipAddress = await response.text();
			return ipAddress.replace(/\n/g, k.empty);
		} catch (error) {
			this.reportError('Error fetching IP address:' + error);
			return null;
		}
	}

}

class Bulk {
	baseID: string = k.empty;
	thingsCollection: CollectionReference | null = null;
	traitsCollection: CollectionReference | null = null;
	relationshipsCollection: CollectionReference | null = null;
	constructor(baseID: string) {
		this.baseID = baseID;
	}
}

class SnapshotDeferal {
	baseID: string;
	datum_type: DatumType;
	snapshot: QuerySnapshot;

	constructor(baseID: string, datum_type: DatumType, snapshot: QuerySnapshot) {
		this.baseID = baseID;
		this.snapshot = snapshot;
		this.datum_type = datum_type;
	}
}

class PersistentThing {
	title: string;
	color: string;
	type: string;

	constructor(data: DocumentData) {
		const remote = data as PersistentThing;
		this.title	 = remote.title;
		this.type	 = remote.type;
		this.color	 = remote.color;
	}

	get virginTitle(): string {
		const title = this.title;
		if (title.includes('@')) {
			const dual = title.split('@');
			return dual[0];
		}
		return title
	}

	isEqualTo(thing: Thing | null) {
		return !!thing &&
		thing.title == this.title &&
		thing.type == this.type &&
		thing.color == this.color;
	}
}

class PersistentTrait {
	ownerID: string;
	type: TraitType;
	text: string;

	constructor(data: DocumentData) {
		const remote = data as PersistentTrait;
		this.ownerID = remote.ownerID;
		this.type	 = remote.type;
		this.text	 = remote.text;
	}

	isEqualTo(trait: Trait | null) {
		return !!trait &&
		trait.ownerID == this.ownerID &&
		trait.type	  == this.type &&
		trait.text	  == this.text;
	}
}

class PersistentPredicate {
	isBidirectional: boolean;
	stateIndex: number;
	kind: string;

	constructor(data: DocumentData) {
		const remote		 = data as PersistentPredicate;
		this.isBidirectional = remote.isBidirectional;
		this.stateIndex		 = remote.stateIndex;
		this.kind			 = remote.kind;
	}

	isEqualTo(predicate: Predicate | null) {
		return !!predicate &&
		predicate.isBidirectional == this.isBidirectional &&
		predicate.stateIndex	  == this.stateIndex &&
		predicate.kind			  == this.kind;
	}
}

interface PersistentRelationship {
	order: number;
	child: DocumentReference<Thing, DocumentData>;
	parent: DocumentReference<Thing, DocumentData>;
	predicate: DocumentReference<Predicate, DocumentData>;
}

class PersistentRelationship implements PersistentRelationship {

	constructor(data: DocumentData | Relationship) {
		const things = dbFirebase.bulk_for(dbFirebase.baseID)?.thingsCollection;
		const predicates = dbFirebase.predicatesCollection;
		this.order = data.order;
		if (!!things && !!predicates) {
			try {
				if (data instanceof Relationship) {
					if (data.isValid) {
						this.child = doc(things, data.idChild) as DocumentReference<Thing>;
						this.parent = doc(things, data.idParent) as DocumentReference<Thing>;
						this.predicate = doc(predicates, data.kindPredicate) as DocumentReference<Predicate>;
					}
				} else {
					const remote = data as PersistentRelationship;
					if (DBFirebase.data_isValidOfKind(DatumType.relationships, data)) {
						this.child = doc(things, remote.child.id) as DocumentReference<Thing>;
						this.parent = doc(things, remote.parent.id) as DocumentReference<Thing>;
						this.predicate = doc(predicates, remote.predicate.id) as DocumentReference<Predicate>;
					}
				}
			} catch (error) {
				dbFirebase.reportError(error);
			}
		}
	}

	isEqualTo(relationship: Relationship | null) {
		return !!relationship &&
		relationship.kindPredicate == this.predicate.kind &&
		relationship.idParent == this.parent.id &&
		relationship.idChild == this.child.id &&
		relationship.order == this.order;
	}

}

export const dbFirebase = new DBFirebase();
