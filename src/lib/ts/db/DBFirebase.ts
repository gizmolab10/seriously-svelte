import { g, k, u, Thing, Trait, debug, signals, DebugFlag, Hierarchy, Predicate, TraitType } from '../common/Global_Imports';
import { ThingType, dbDispatch, persistLocal, IDPersistent, Relationship, CreationOptions } from '../common/Global_Imports';
import { QuerySnapshot, serverTimestamp, DocumentReference, CollectionReference } from 'firebase/firestore';
import { onSnapshot, deleteField, getFirestore, DocumentData, DocumentChange } from 'firebase/firestore';
import { doc, addDoc, setDoc, getDocs, deleteDoc, updateDoc, collection } from 'firebase/firestore';
import { DBType, DatumType } from '../basis/PersistentIdentifiable';
import { s_hierarchy } from '../state/Svelte_Stores';
import Identifiable from '../basis/Identifiable';
import { initializeApp } from 'firebase/app';
import DBInterface from './DBInterface';
import { get } from 'svelte/store';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional

export default class DBFirebase extends DBInterface {
	firebaseConfig = {
		appId: "1:224721814373:web:0c60f394c056ef3decd78c",
		apiKey: "AIzaSyAFy4H3Ej5zfI46fvCJpBfUxmyQco-dx9U",
		authDomain: "seriously-4536d.firebaseapp.com",
		storageBucket: "seriously-4536d.appspot.com",
		messagingSenderId: "224721814373",
		measurementId: "G-9PY9LVK813",
		projectId: "seriously-4536d"
	};

	loadTime = null;
	hasData = false;
	isPersistent = true;
	baseID = 'Public';
	addedThing!: Thing;
	addedTrait!: Trait;
	bulksName = 'Bulks';
	bulks!: Array<Bulk>;
	hierarchy!: Hierarchy;
	deferSnapshots = false;
	dbType = DBType.firebase;
	app = initializeApp(this.firebaseConfig);
	firestore = getFirestore(this.app);
	predicatesCollection!: CollectionReference;
	deferredSnapshots: Array<SnapshotDeferal> = [];

	setHasData(flag: boolean) { this.hasData = flag; }
	reportError(error: any) { console.log(error); }

	queryStrings_apply() {
		const persistedID = persistLocal.read_key(IDPersistent.base_id);
		const id = g.queryStrings.get('name') ?? g.queryStrings.get('dbid') ?? persistedID ?? 'Public';
		persistLocal.write_key(IDPersistent.base_id, id);
		this.baseID = id;
	}

	async crud_onThing(crud: string, thing: Thing) {};
	async crud_onTrait(crud: string, trait: Trait) {};
	async crud_onRelationship(crud: string, relationship: Relationship) {};

	static readonly $_FETCH_$: unique symbol;

	async fetch_all() {
		if (dbDispatch.eraseDB) {
			await this.document_persistentDelete();
		}
		await this.recordLoginIP();
		await this.fetch_documentsOf(DatumType.predicates);
		await this.fetch_hierarchy_from(this.baseID);
		await this.fetch_bulkAliases();		// TODO: assumes all ancestries created
	}

	async fetch_hierarchy_from(baseID: string) {
		await this.fetch_documentsOf(DatumType.things, baseID);
		await this.fetch_documentsOf(DatumType.traits, baseID);
		await this.fetch_documentsOf(DatumType.relationships, baseID);
	}
		
	async fetch_documentsOf(datum_type: DatumType, baseID: string | null = null) {
		try {
			const collectionRef = !baseID ? collection(this.firestore, datum_type) : collection(this.firestore, this.bulksName, baseID, datum_type);
			let querySnapshot = await getDocs(collectionRef);
			const bulk = this.bulk_for(baseID);

			if (!!baseID) {
				if (querySnapshot.empty) {
					await this.documents_firstTime_persistentCreate(datum_type, baseID, collectionRef);
					querySnapshot = await getDocs(collectionRef);
				}
				this.setup_handle_docChanges(baseID, datum_type, collectionRef);
			}
			
			
			///////////////////
			// data IDSignal //
			///////////////////

			if (bulk) {
				switch (datum_type) {
					case DatumType.things:				 bulk.thingsCollection = collectionRef; break;
					case DatumType.traits:				 bulk.traitsCollection = collectionRef; break;
					case DatumType.relationships: bulk.relationshipsCollection = collectionRef; break;
				}
			} else if (datum_type == DatumType.predicates) {
				this.predicatesCollection = collectionRef;
			}

			const docs = querySnapshot.docs;
			debug.log_persistent('READ ' + docs.length + ' from ' + baseID + ':' + datum_type);
			for (const docSnapshot of docs) {
				const id = docSnapshot.id;
				const data = docSnapshot.data();
				await this.document_remember_validated(datum_type, id, data, baseID ?? this.baseID);
			}
		} catch (error) {
			this.reportError(error);
		}
	}

	static readonly $_BULKS_$: unique symbol;

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
		const root = get(s_hierarchy).root;
		if (this.baseID == k.name_bulkAdmin && root) {
			const rootsAncestry = await get(s_hierarchy).ancestry_roots();		// TODO: assumes all ancestries created
			if (!!rootsAncestry) {
				get(s_hierarchy).rootsAncestry = rootsAncestry;
				try {		// add bulk aliases to roots thing
					const bulk = collection(this.firestore, this.bulksName);	// fetch all bulks (documents)
					let bulkSnapshot = await getDocs(bulk);
					for (const bulkDoc of bulkSnapshot.docs) {
						const baseID = bulkDoc.id;
						if (baseID != this.baseID) {
							let thing = get(s_hierarchy).thing_bulkAlias_forTitle(baseID);
							if (!thing) {								// create a thing for each bulk
								thing = get(s_hierarchy).thing_runtimeCreate(this.baseID, Identifiable.newID(), baseID, 'red', ThingType.bulk);
								await get(s_hierarchy).ancestry_remember_persistentAddAsChild(rootsAncestry, thing);
							} else if (thing.thing_isBulk_expanded) {
								await get(s_hierarchy).ancestry_redraw_persistentFetchBulk_browseRight(thing);
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

	static readonly $_REMOTE_$: unique symbol;
	
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

	setup_handle_docChanges(baseID: string, datum_type: DatumType, collection: CollectionReference) {
		onSnapshot(collection, (snapshot) => {
			if (get(s_hierarchy).isAssembled) {		// u.ignore snapshots caused by data written to server
				if (this.deferSnapshots) {
					this.snapshot_deferOne(baseID, datum_type, snapshot);
				} else {
					snapshot.docChanges().forEach((change) => {	// convert and remember
						this.handle_docChanges(baseID, datum_type, change);
					});
				}
			}
		}
	)};

	async handle_docChanges(baseID: string, datum_type: DatumType, change: DocumentChange) {
		const doc = change.doc;
		const data = doc.data();
		if (DBFirebase.data_isValidOfKind(datum_type, data)) {
			const id = doc.id;

			///////////////////////
			//	 data IDSignal	 //
			//	change IDSignal  //
			///////////////////////

			try {
				switch (datum_type) {
					case DatumType.things:		  this.thing_handle_docChanges(baseID, id, change, data); break;
					case DatumType.traits:		  this.trait_handle_docChanges(baseID, id, change, data); break;
					case DatumType.relationships: this.relationship_handle_docChanges(baseID, id, change, data); break;
				}
			} catch (error) {
				this.reportError(error);
			}
			debug.log_persistent('HANDLE ' + baseID + ':' + datum_type + k.space + change.type);
		}
	}

	static readonly $_SUBCOLLECTIONS_$: unique symbol;

	async documents_firstTime_persistentCreate(datum_type: DatumType, baseID: string, collectionRef: CollectionReference) {
		const docRef = doc(this.firestore, this.bulksName, baseID);
		await setDoc(docRef, { isReal: true }, { merge: true });
		await updateDoc(docRef, { isReal: deleteField() });
		if (datum_type == DatumType.things) {
			await this.things_remember_firstTime_persistentCreateIn(collectionRef);
		}
	}

	async document_remember_validated(datum_type: DatumType, id: string, data: DocumentData, baseID: string) {
		if (DBFirebase.data_isValidOfKind(datum_type, data)) {
			switch (datum_type) {
				case DatumType.predicates:	  get(s_hierarchy).predicate_remember_runtimeCreate(id, data.kind, data.isBidirectional); break;
				case DatumType.traits:		  get(s_hierarchy).trait_remember_runtimeCreate(baseID, id, data.ownerID, data.type, data.text, true); break;
				case DatumType.things:		  get(s_hierarchy).thing_remember_runtimeCreate(baseID, id, data.title, data.color, data.type ?? data.trait, true, !data.type); break;
				case DatumType.relationships: get(s_hierarchy).relationship_remember_runtimeCreateUnique(baseID, id, data.predicate.id, data.parent.id, data.child.id, data.order, CreationOptions.isFromPersistent); break;
			}
		}
	}

	async document_persistentDelete() {
		const documentRef = doc(this.firestore, this.bulksName, this.baseID);
		await this.subcollections_persistentDeleteIn(documentRef);

		try {
			await deleteDoc(documentRef);
		} catch (error) {
			this.reportError(error);
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

	static readonly $_THING_$: unique symbol;

	async thing_remember_persistentCreate(thing: Thing) {
		const thingsCollection = this.bulk_for(thing.baseID)?.thingsCollection;
		if (!!thingsCollection) {
			const remoteThing = new PersistentThing(thing);
			const jsThing = { ...remoteThing };
			thing.awaitingCreation = true;
			this.addedThing = thing;
			try {
				this.deferSnapshots = true;
				const ref = await addDoc(thingsCollection, jsThing)
				thing.awaitingCreation = false;
				thing.already_persisted = true;
				thing.setID(ref.id);			// so relationship will be correct
				get(s_hierarchy).thing_remember(thing);
				this.handle_deferredSnapshots();
				thing.log(DebugFlag.remote, 'CREATE T');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	async things_remember_firstTime_persistentCreateIn(collectionRef: CollectionReference) {
		const fields = ['title', 'color', 'type'];
		const root = new Thing(this.baseID, Identifiable.newID(), this.baseID, 'coral', ThingType.root, true);
		const thing = new Thing(this.baseID, Identifiable.newID(), 'Click this text to edit it', 'purple', ThingType.generic, true);
		get(s_hierarchy).root = root;
		const thingRef = await addDoc(collectionRef, u.convertToObject(thing, fields));		// N.B. these will be fetched, shortly
		const rootRef = await addDoc(collectionRef, u.convertToObject(root, fields));		// no need to remember now
		thing.setID(thingRef.id);
		root.setID(rootRef.id);
		root.log(DebugFlag.remote, 'CREATE T');
		thing.log(DebugFlag.remote, 'CREATE T');
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
		let thing = get(s_hierarchy).thing_forHID(id.hash());
		if (!!remoteThing) {
			switch (change.type) {
				case 'added':
					if (!!thing || remoteThing.isEqualTo(this.addedThing) || remoteThing.type == ThingType.root) {
						return;			// do not invoke signal because nothing has changed
					}
					thing = get(s_hierarchy).thing_remember_runtimeCreate(baseID, id, remoteThing.title, remoteThing.color, remoteThing.type, true);
					break;
				case 'removed':
					if (!!thing) {
						get(s_hierarchy).thing_forget(thing);
					}
					break;
				case 'modified':
					if (!thing || thing.wasModifiedWithinMS(800) || !this.thing_extractChangesFromPersistent(thing, remoteThing)) {
						return;		// do not invoke signal if nothing changed
					}
					break;
			}
			signals.signal_rebuildGraph_fromFocus();
		}
	}

	static readonly $_TRAIT_$: unique symbol;

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
			trait.awaitingCreation = true;
			this.addedTrait = trait;
			try {
				this.deferSnapshots = true;
				const ref = await addDoc(traitsCollection, jsTrait)
				trait.awaitingCreation = false;
				trait.already_persisted = true;
				trait.setID(ref.id);			// so relationship will be correct
				get(s_hierarchy).trait_remember(trait);
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
			let trait = get(s_hierarchy).trait_forHID(id.hash());
			switch (change.type) {
				case 'added':
					if (!!trait || remoteTrait.isEqualTo(this.addedTrait)) {
						return;		// do not invoke signal because nothing has changed
					}
					trait = get(s_hierarchy).trait_remember_runtimeCreate(baseID, id, remoteTrait.ownerID, remoteTrait.type, remoteTrait.text, true);
					break;
				case 'removed':
					if (!!trait) {
						get(s_hierarchy).trait_forget(trait);
					}
					break;
				case 'modified':
					if (!trait || trait.wasModifiedWithinMS(800) || !this.trait_extractChangesFromPersistent(trait, remoteTrait)) {
						return;		// do not invoke signal because nothing has changed
					}
					break;
			}
			setTimeout(() => { // wait in case a thing involved in this trait arrives in the data
				get(s_hierarchy).traits_refreshKnowns();
				signals.signal_rebuildGraph_fromFocus();
			}, 20);
		}
	}

	static readonly $_RELATIONSHIP_$: unique symbol;

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
		const changed = (relationship.idPredicate != remote.predicate.id ||
			relationship.idParent != remote.parent.id ||
			relationship.idChild != remote.child.id ||
			relationship.order != remote.order)
		if (changed) {
			relationship.idChild = remote.child.id;
			relationship.idParent = remote.parent.id;
			relationship.already_persisted = true;
			relationship.idPredicate = remote.predicate.id;
			relationship.order_setTo_persistentMaybe(remote.order + k.halfIncrement);
		}
		return changed;
	}

	async relationship_remember_persistentCreate(relationship: Relationship) {
		const relationshipsCollection = this.bulk_for(relationship.baseID)?.relationshipsCollection;
		if (!!relationshipsCollection) {
			const remoteRelationship = new PersistentRelationship(relationship);
			const jsRelationship = { ...remoteRelationship };
			relationship.awaitingCreation = true;
			try {
				this.deferSnapshots = true;
				const ref = await addDoc(relationshipsCollection, jsRelationship); // works!
				relationship.awaitingCreation = false;
				relationship.already_persisted = true;
				relationship.setID(ref.id);
				get(s_hierarchy).relationship_remember(relationship);
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
			let relationship = get(s_hierarchy).relationship_forHID(id.hash());
			switch (change.type) {
				case 'added':
					if (!!relationship) {
						return;
					}
					relationship = get(s_hierarchy).relationship_remember_runtimeCreateUnique(baseID, id, remoteRelationship.predicate.id, remoteRelationship.parent.id, remoteRelationship.child.id, remoteRelationship.order, CreationOptions.isFromPersistent);
					break;
				default:
					if (!relationship) {
						return;	// not known so do not signal
					} else {
						switch (change.type) {
							case 'modified':
								if (relationship.wasModifiedWithinMS(800) || !this.relationship_extractChangesFromPersistent(relationship, remoteRelationship)) {
									return;	// already known and contains no new data, or needs to be 'tamed'
								}
								break;
							case 'removed':
								get(s_hierarchy).relationship_forget(relationship);
								break;
						}
					}
					break;
			}
			setTimeout(() => { // wait in case a thing involved in this relationship arrives in the data
				get(s_hierarchy).relationships_refreshKnowns();
				get(s_hierarchy).rootAncestry.order_normalizeRecursive_persistentMaybe(true);
				signals.signal_rebuildGraph_fromFocus();
			}, 20);
		}
	}

	static readonly $_VALIDATION_$: unique symbol;

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
		await this.getUserIPAddress().then((ipAddress) => {
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
					(async () => {
						await addDoc(logRef, jsItem);
					})();
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

interface PersistentThing {
	title: string;
	color: string;
	type: string;
}

class PersistentThing implements PersistentThing {
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

interface PersistentTrait {
	type: TraitType;
	ownerID: string;
	text: string;
}

class PersistentTrait implements PersistentTrait {
	constructor(data: DocumentData) {
		const remote = data as PersistentTrait;
		this.ownerID = remote.ownerID;
		this.type	 = remote.type;
		this.text	 = remote.text;
	}

	isEqualTo(trait: Trait | null) {
		return !!trait &&
		trait.ownerID == this.ownerID &&
		trait.type == this.type &&
		trait.text == this.text;
	}
}

interface PersistentRelationship {
	order: number;
	child: DocumentReference<Thing, DocumentData>;
	parent: DocumentReference<Thing, DocumentData>;
	predicate: DocumentReference<Predicate, DocumentData>;
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
						this.predicate = doc(predicates, data.idPredicate) as DocumentReference<Predicate>;
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
		relationship.idPredicate == this.predicate.id &&
		relationship.idParent == this.parent.id &&
		relationship.idChild == this.child.id &&
		relationship.order == this.order;
	}

}

export const dbFirebase = new DBFirebase();
