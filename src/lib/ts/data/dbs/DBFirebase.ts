import { g, k, u, Thing, Trait, debug, signals, Predicate, preferences, Relationship } from '../../common/Global_Imports';
import { T_Thing, T_Trait, T_Debug, T_Create, T_Predicate, T_Preference } from '../../common/Global_Imports';
import { doc, addDoc, setDoc, getDoc, getDocs, deleteDoc, updateDoc, collection } from 'firebase/firestore';
import { QuerySnapshot, serverTimestamp, DocumentReference, CollectionReference } from 'firebase/firestore';
import { onSnapshot, deleteField, getFirestore, DocumentData, DocumentChange } from 'firebase/firestore';
import { T_Datum, T_Database, T_Persistence } from './DBCommon';
import Identifiable from '../basis/Identifiable';
import { initializeApp } from 'firebase/app';
import DBCommon from './DBCommon';

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

	idBase = 'Public';
	addedThing!: Thing;
	addedTrait!: Trait;
	bulksName = 'Bulks';
	bulks!: Array<Bulk>;
	deferSnapshots = false;
	type_db = T_Database.firebase;
	kind_persistence = T_Persistence.remote;
	app = initializeApp(this.firebaseConfig);
	firestore = getFirestore(this.app);
	predicatesCollection!: CollectionReference;
	deferredSnapshots: Array<SnapshotDeferal> = [];

	reportError(error: any) { console.log(error); }

	queryStrings_apply() {
		const persistedID = preferences.read_key(T_Preference.base_id);
		const id = g.queryStrings.get('name') ?? g.queryStrings.get('dbid') ?? persistedID ?? 'Public';
		preferences.write_key(T_Preference.base_id, id);
		this.idBase = id;
	}

	async remove_all() {
		const documentRef = doc(this.firestore, this.bulksName, this.idBase);
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
		await this.fetch_documentsOf(T_Datum.predicates);
		await this.hierarchy_fetchForID(this.idBase);
		await this.fetch_bulkAliases();		// TODO: assumes all ancestries are already created
		this.setup_remote_handlers();
	}

	async hierarchy_fetchForID(idBase: string) {
		await this.fetch_documentsOf(T_Datum.things, idBase);
		await this.fetch_documentsOf(T_Datum.traits, idBase);
		await this.fetch_documentsOf(T_Datum.relationships, idBase);
	}
		
	async fetch_documentsOf(datum_type: T_Datum, idBase: string | null = null) {
		try {
			const collectionRef = !idBase ? collection(this.firestore, datum_type) : collection(this.firestore, this.bulksName, idBase, datum_type);
			let querySnapshot = await getDocs(collectionRef);
			if (!!idBase) {
				if (querySnapshot.empty) {
					await this.document_defaults_ofType_persistentCreateIn(datum_type, idBase, collectionRef);
					querySnapshot = await getDocs(collectionRef);
				}
			}
			const docs = querySnapshot.docs;
			debug.log_remote('READ ' + docs.length + ' from ' + idBase + ':' + datum_type);
			for (const docSnapshot of docs) {
				const id = docSnapshot.id;
				const data = docSnapshot.data();
				await this.document_ofType_remember_validated(datum_type, id, data, idBase ?? this.idBase);
			}
		} catch (error) {
			this.reportError(error);
		}
	}

	static readonly BULKS: unique symbol;

	bulk_for(idBase: string | null) {
		if (!!idBase) {
			if (!this.bulks) {
				this.bulks = [new Bulk(this.idBase)];
			}
			const bulks = this.bulks;
			if (!!bulks) {
				for (const bulk of bulks) {
					if (bulk.idBase == idBase) {
						return bulk;
					}
				}
				const newBulk = new Bulk(idBase);
				bulks.push(newBulk);
				return newBulk;
			}
		}
		return null;
	}
	
	async fetch_bulkAliases() {
		const h = this.hierarchy;
		const root = h.root;
		if (this.idBase == k.name_bulkAdmin && root) {
			const rootsAncestry = await h.ancestry_roots();		// TODO: assumes all ancestries created
			if (!!rootsAncestry) {
				h.rootsAncestry = rootsAncestry;
				try {		// add bulk aliases to roots thing
					const bulk = collection(this.firestore, this.bulksName);	// fetch all bulks (documents)
					let bulkSnapshot = await getDocs(bulk);
					for (const bulkDoc of bulkSnapshot.docs) {
						const idBase = bulkDoc.id;
						if (idBase != this.idBase) {
							let thing = h.bulks_alias_forTitle_ofThing(idBase);
							if (!thing) {								// create a thing for each bulk
								thing = h.thing_runtimeCreate(this.idBase, Identifiable.newID(), idBase, 'red', T_Thing.bulk);
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
	
	snapshot_deferOne(idBase: string, datum_type: T_Datum, snapshot: QuerySnapshot) {
		const deferral = new SnapshotDeferal(idBase, datum_type, snapshot);
		this.deferredSnapshots.push(deferral);
	}

	handle_deferredSnapshots() {
		this.deferSnapshots = false;
		while (this.deferredSnapshots.length > 0) {
			const deferral = this.deferredSnapshots.pop();
			if (!!deferral) {
				deferral.snapshot.docChanges().forEach((change) => {	// convert and remember
					this.handle_docChanges(deferral.idBase, deferral.datum_type, change);
				});
			}
		}
	}

	setup_remote_handlers() {
		for (const datum_type of this.hierarchy.dataTypes_forFetching) {
			if (datum_type == T_Datum.predicates) {
				this.predicatesCollection = collection(this.firestore, datum_type);
			} else {
				const idBase = this.idBase;
				const bulk = this.bulk_for(idBase);
				const collectionRef = collection(this.firestore, this.bulksName, idBase, datum_type);
				if (!!bulk) {
					switch (datum_type) {
						case T_Datum.things:				 bulk.thingsCollection = collectionRef; break;
						case T_Datum.traits:				 bulk.traitsCollection = collectionRef; break;
						case T_Datum.relationships: bulk.relationshipsCollection = collectionRef; break;
					}
				}
				onSnapshot(collectionRef, (snapshot) => {
					if (this.hierarchy.isAssembled) {		// u.ignore snapshots caused by data written to server
						if (this.deferSnapshots) {
							this.snapshot_deferOne(idBase, datum_type, snapshot);
						} else {
							snapshot.docChanges().forEach(async (change) => {	// convert and remember
								await this.handle_docChanges(idBase, datum_type, change);
							});
						}
					}
				})
			}
		}
	}

	async handle_docChanges(idBase: string, datum_type: T_Datum, change: DocumentChange) {
		const doc = change.doc;
		const data = doc.data();
		if (DBFirebase.data_isValidOfKind(datum_type, data)) {
			const id = doc.id;

			//////////////////////////////
			//	ignores predicate data  //
			//////////////////////////////

			try {
				switch (datum_type) {
					case T_Datum.things:		this.thing_handle_docChanges(idBase, id, change, data); break;
					case T_Datum.traits:		this.trait_handle_docChanges(idBase, id, change, data); break;
					case T_Datum.relationships: this.relationship_handle_docChanges(idBase, id, change, data); break;
				}
			} catch (error) {
				this.reportError(error);
			}
			debug.log_remote('HANDLE ' + idBase + ':' + datum_type + k.space + change.type);
		}
	}

	static readonly SUBCOLLECTIONS: unique symbol;

	async document_defaults_ofType_persistentCreateIn(datum_type: T_Datum, idBase: string, collectionRef: CollectionReference) {
		if (!!idBase) {
			const docRef = doc(this.firestore, this.bulksName, idBase);
			await setDoc(docRef, { isReal: true }, { merge: true });
			await updateDoc(docRef, { isReal: deleteField() });
		}
		switch (datum_type) {
			case T_Datum.predicates: this.hierarchy.predicate_defaults_remember_runtimeCreate(); break;
			case T_Datum.things: await this.root_default_remember_persistentCreateIn(collectionRef); break;
		}
	}

	async document_ofType_remember_validated(datum_type: T_Datum, id: string, data: DocumentData, idBase: string) {
		if (DBFirebase.data_isValidOfKind(datum_type, data)) {
			const h = this.hierarchy;
			switch (datum_type) {
				case T_Datum.predicates:	h.predicate_remember_runtimeCreate(id, data.kind, data.isBidirectional); break;
				case T_Datum.traits:		h.trait_remember_runtimeCreate(idBase, id, data.ownerID, data.type, data.text, true); break;
				case T_Datum.things:		h.thing_remember_runtimeCreate(idBase, id, data.title, data.color, data.type ?? data.trait, true, !data.type); break;
				case T_Datum.relationships: h.relationship_remember_runtimeCreateUnique(idBase, id, data.predicate.id, data.parent.id, data.child.id, data.order, T_Create.isFromPersistent); break;
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
		const thingsCollection = this.bulk_for(thing.idBase)?.thingsCollection;
		if (!!thingsCollection) {
			const remoteThing = new PersistentThing(thing);
			const jsThing = { ...remoteThing };
			thing.persistence.awaitingCreation = true;
			this.addedThing = thing;
			try {
				this.deferSnapshots = true;
				const ref = await addDoc(thingsCollection, jsThing);
				thing.persistence.awaitingCreation = false;
				thing.persistence.already_persisted = true;
				this.hierarchy.thing_remember_updateID_to(thing, ref.id);
				this.handle_deferredSnapshots();
				thing.log(T_Debug.remote, 'CREATE T');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	async root_default_remember_persistentCreateIn(collectionRef: CollectionReference) {
		const fields = ['title', 'color', 'type'];
		const root = new Thing(this.idBase, Identifiable.newID(), this.idBase, 'coral', T_Thing.root, true);
		const rootRef = await addDoc(collectionRef, u.convertToObject(root, fields));		// no need to remember now
		root.log(T_Debug.remote, 'CREATE T');
		this.hierarchy.root = root;
		root.setID(rootRef.id);
	}

	async thing_persistentUpdate(thing: Thing) {
		const thingsCollection = this.bulk_for(thing.idBase)?.thingsCollection;
		if (!!thingsCollection) {
			const ref = doc(thingsCollection, thing.id) as DocumentReference<Thing>;
			const remoteThing = new PersistentThing(thing);
			const jsThing = { ...remoteThing };
			try {
				await setDoc(ref, jsThing);
				thing.log(T_Debug.remote, 'UPDATE T');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	async thing_persistentDelete(thing: Thing) {
		const thingsCollection = this.bulk_for(thing.idBase)?.thingsCollection;
		if (!!thingsCollection) {
			try {
				const ref = doc(thingsCollection, thing.id) as DocumentReference<Thing>;
				await deleteDoc(ref);
				thing.log(T_Debug.remote, 'DELETE T');
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

	thing_handle_docChanges(idBase: string, id: string, change: DocumentChange, data: DocumentData) {
		const remoteThing = new PersistentThing(data);
		const h = this.hierarchy;
		let thing = h.thing_forHID(id.hash());
		if (!!remoteThing) {
			switch (change.type) {
				case 'added':
					if (!!thing || remoteThing.isEqualTo(this.addedThing) || remoteThing.type == T_Thing.root) {
						return;			// do not invoke signal because nothing has changed
					}
					thing = h.thing_remember_runtimeCreate(idBase, id, remoteThing.title, remoteThing.color, remoteThing.type, true);
					break;
				case 'removed':
					if (!!thing) {
						h.thing_forget(thing);
					}
					break;
				case 'modified':
					if (!thing || thing.persistence.wasModifiedWithinMS(800) || !this.thing_extractChangesFromPersistent(thing, remoteThing)) {
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
		const traitsCollection = this.bulk_for(trait.idBase)?.traitsCollection;
		if (!!traitsCollection) {
			try {
				const ref = doc(traitsCollection, trait.id) as DocumentReference<Trait>;
				await deleteDoc(ref);
				trait.log(T_Debug.remote, 'DELETE T');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	async trait_persistentUpdate(trait: Trait) {
		const traitsCollection = this.bulk_for(trait.idBase)?.traitsCollection;
		if (!!traitsCollection) {
			const ref = doc(traitsCollection, trait.id) as DocumentReference<Trait>;
			const remoteTrait = new PersistentTrait(trait);
			const jsTrait = { ...remoteTrait };
			try {
				await setDoc(ref, jsTrait);
				trait.log(T_Debug.remote, 'UPDATE T');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	async trait_remember_persistentCreate(trait: Trait) {
		const traitsCollection = this.bulk_for(trait.idBase)?.traitsCollection;
		if (!!traitsCollection) {
			const remoteTrait = new PersistentTrait(trait);
			const jsTrait = { ...remoteTrait };
			trait.persistence.awaitingCreation = true;
			this.addedTrait = trait;
			try {
				this.deferSnapshots = true;
				const ref = await addDoc(traitsCollection, jsTrait)
				const h = this.hierarchy;
				trait.persistence.awaitingCreation = false;
				trait.persistence.already_persisted = true;
				h.trait_forget(trait);
				trait.setID(ref.id);
				h.trait_remember(trait);
				this.handle_deferredSnapshots();
				trait.log(T_Debug.remote, 'CREATE T');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	trait_handle_docChanges(idBase: string, id: string, change: DocumentChange, data: DocumentData) {
		const remoteTrait = new PersistentTrait(data);
		if (!!remoteTrait) {
			const h = this.hierarchy;
			let trait = h.trait_forHID(id.hash());
			switch (change.type) {
				case 'added':
					if (!!trait || remoteTrait.isEqualTo(this.addedTrait)) {
						return;		// do not invoke signal because nothing has changed
					}
					trait = h.trait_remember_runtimeCreate(idBase, id, remoteTrait.ownerID, remoteTrait.type, remoteTrait.text, true);
					break;
				case 'removed':
					if (!!trait) {
						h.trait_forget(trait);
					}
					break;
				case 'modified':
					if (!trait || trait.persistence.wasModifiedWithinMS(800) || !this.trait_extractChangesFromPersistent(trait, remoteTrait)) {
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
				predicate.log(T_Debug.remote, 'UPDATE P');
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
				predicate.log(T_Debug.remote, 'DELETE P');
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
			predicate.persistence.awaitingCreation = true;
			try {
				this.deferSnapshots = true;
				const ref = await addDoc(predicatesCollection, jsPredicate);
				const h = this.hierarchy;
				predicate.persistence.awaitingCreation = false;
				predicate.persistence.already_persisted = true;
				h.predicate_forget(predicate);
				predicate.setID(ref.id);
				h.predicate_remember(predicate);
				this.handle_deferredSnapshots();
				predicate.log(T_Debug.remote, 'CREATE P');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	static readonly RELATIONSHIP: unique symbol;

	async relationship_persistentDelete(relationship: Relationship) {
		const relationshipsCollection = this.bulk_for(relationship.idBase)?.relationshipsCollection;
		if (!!relationshipsCollection) {
			try {
				const ref = doc(relationshipsCollection, relationship.id) as DocumentReference<PersistentRelationship>;
				await deleteDoc(ref);
				relationship.log(T_Debug.remote, 'DELETE R');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	async relationship_persistentUpdate(relationship: Relationship) {
		const relationshipsCollection = this.bulk_for(relationship.idBase)?.relationshipsCollection;
		if (!!relationshipsCollection) {
			try {
				const ref = doc(relationshipsCollection, relationship.id) as DocumentReference<PersistentRelationship>;
				const remoteRelationship = new PersistentRelationship(relationship);
				const jsRelationship = { ...remoteRelationship };
				await setDoc(ref, jsRelationship);
				relationship.log(T_Debug.remote, 'UPDATE R');
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
			relationship.persistence.already_persisted = true;
			relationship.kindPredicate = remote.kindPredicate;
			relationship.order_setTo_persistentMaybe(remote.order + k.halfIncrement);
		}
		return changed;
	}

	async relationship_remember_persistentCreate(relationship: Relationship) {
		const relationshipsCollection = this.bulk_for(relationship.idBase)?.relationshipsCollection;
		if (!!relationshipsCollection) {
			const remoteRelationship = new PersistentRelationship(relationship);
			const jsRelationship = { ...remoteRelationship };
			relationship.persistence.awaitingCreation = true;
			try {
				this.deferSnapshots = true;
				const ref = await addDoc(relationshipsCollection, jsRelationship);
				const h = this.hierarchy;
				relationship.persistence.awaitingCreation = false;
				relationship.persistence.already_persisted = true;
				h.relationship_forget(relationship);
				relationship.setID(ref.id);
				h.relationship_remember(relationship);
				this.handle_deferredSnapshots();
				relationship.log(T_Debug.remote, 'CREATE R');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	relationship_handle_docChanges(idBase: string, id: string, change: DocumentChange, data: DocumentData) {
		const remoteRelationship = new PersistentRelationship(data);
		if (!!remoteRelationship) {
			const h = this.hierarchy;
			let relationship = h.relationship_forHID(id.hash());
			switch (change.type) {
				case 'added':
					if (!!relationship) {
						return;
					}
					relationship = h.relationship_remember_runtimeCreateUnique(idBase, id, remoteRelationship.kindPredicate, remoteRelationship.parent.id, remoteRelationship.child.id, remoteRelationship.order, T_Create.isFromPersistent);
					break;
				default:
					if (!relationship) {
						return;	// not known so do not signal
					} else {
						switch (change.type) {
							case 'modified':
								if (relationship.persistence.wasModifiedWithinMS(800) || !this.relationship_extractChangesFromPersistent(relationship, remoteRelationship)) {
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

	static data_isValidOfKind(datum_type: T_Datum, data: DocumentData) {
		switch (datum_type) {
			case T_Datum.things:		
				const thing = data as PersistentThing;	
				if (thing.hasNoData) {
					return false;
				}
				break;
			case T_Datum.traits:		
				const trait = data as PersistentTrait;	
				if (trait.hasNoData) {
					return false;
				}
				break;
			case T_Datum.predicates:
				if (!data.kind) {
					return false;
				}
				break;
			case T_Datum.relationships:
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
	idBase: string = k.empty;
	thingsCollection: CollectionReference | null = null;
	traitsCollection: CollectionReference | null = null;
	relationshipsCollection: CollectionReference | null = null;
	constructor(idBase: string) {
		this.idBase = idBase;
	}
}

class SnapshotDeferal {
	idBase: string;
	datum_type: T_Datum;
	snapshot: QuerySnapshot;

	constructor(idBase: string, datum_type: T_Datum, snapshot: QuerySnapshot) {
		this.idBase = idBase;
		this.snapshot = snapshot;
		this.datum_type = datum_type;
	}
}

class PersistentThing {
	title: string;
	color: string;
	type: T_Thing;

	constructor(data: DocumentData) {
		const remote = data as PersistentThing;
		this.title	 = remote.title;
		this.type	 = remote.type;
		this.color	 = remote.color;
	}

	get hasNoData(): boolean { return !this.title && !this.color && !this.type; }

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
	type: T_Trait;
	text: string;

	constructor(data: DocumentData) {
		const remote = data as PersistentTrait;
		this.ownerID = remote.ownerID;
		this.type	 = remote.type;
		this.text	 = remote.text;
	}
	
	get hasNoData(): boolean { return !this.ownerID && !this.type && !this.type; }

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
	kind: T_Predicate;

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

class PersistentRelationship implements PersistentRelationship {
	predicate!: DocumentReference<Predicate, DocumentData>;
	parent!: DocumentReference<Thing, DocumentData>;
	child!: DocumentReference<Thing, DocumentData>;
	kindPredicate!: T_Predicate;
	order: number;

	constructor(data: DocumentData | Relationship) {
		const things = dbFirebase.bulk_for(dbFirebase.idBase)?.thingsCollection;
		const predicates = dbFirebase.predicatesCollection;
		this.order = data.order;
		if (!!things && !!predicates) {
			try {
				if (data instanceof Relationship) {
					if (data.isValid) {
						this.kindPredicate = data.kindPredicate;
						this.child = doc(things, data.idChild) as DocumentReference<Thing>;
						this.parent = doc(things, data.idParent) as DocumentReference<Thing>;
						this.predicate = doc(predicates, data.kindPredicate) as DocumentReference<Predicate>;
					}
				} else {
					const remote = data as PersistentRelationship;
					if (DBFirebase.data_isValidOfKind(T_Datum.relationships, data)) {
						this.kindPredicate = data.kindPredicate;
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

	async isEqualTo(relationship: Relationship | null) {
		return !!relationship &&
		relationship.kindPredicate == await this.kindPredicate &&
		relationship.idParent == this.parent.id &&
		relationship.idChild == this.child.id &&
		relationship.order == this.order;
	}

}

export const dbFirebase = new DBFirebase();
