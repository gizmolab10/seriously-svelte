import { g, k, u, Thing, debug, signals, IDTrait, DebugFlag, Hierarchy, Predicate } from '../common/Global_Imports';
import { dbDispatch, persistLocal, IDPersistent, Relationship, CreationOptions } from '../common/Global_Imports';
import { QuerySnapshot, serverTimestamp, DocumentReference, CollectionReference } from 'firebase/firestore';
import { onSnapshot, deleteField, getFirestore, DocumentData, DocumentChange } from 'firebase/firestore';
import { doc, addDoc, setDoc, getDocs, deleteDoc, updateDoc, collection } from 'firebase/firestore';
import { DBType, DatumType } from '../db/DBInterface';
import Identifiable from '../basis/Identifiable';
import { initializeApp } from 'firebase/app';
import DBInterface from './DBInterface';
import { h } from '../db/DBDispatch';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional

export default class DBFirebase implements DBInterface {
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
	isRemote = true;
	baseID = 'Public';
	addedThing!: Thing;
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

	static readonly $_FETCH_$: unique symbol;

	async fetch_all() {
		if (dbDispatch.eraseDB) {
			await this.document_remoteDelete();
		}
		await this.recordLoginIP();
		await this.fetch_documentsOf(DatumType.predicates);
		await this.fetch_hierarchy_from(this.baseID);
		await this.fetch_bulkAliases();		// TODO: assumes all ancestries created
	}

	async fetch_hierarchy_from(baseID: string) {
		await this.fetch_documentsOf(DatumType.things, baseID);
		await this.fetch_documentsOf(DatumType.relationships, baseID);
	}
		
	async fetch_documentsOf(type: DatumType, baseID: string | null = null) {
		try {
			const collectionRef = !baseID ? collection(this.firestore, type) : collection(this.firestore, this.bulksName, baseID, type);
			let querySnapshot = await getDocs(collectionRef);
			const bulk = this.bulk_for(baseID);

			if (!!baseID) {
				if (querySnapshot.empty) {
					await this.documents_firstTime_remoteCreate(type, baseID, collectionRef);
					querySnapshot = await getDocs(collectionRef);
				}
				this.setup_handle_docChanges(baseID, type, collectionRef);
			}
			
			
			///////////////////
			// data IDSignal //
			///////////////////

			if (bulk) {
				switch (type) {
					case DatumType.things:				 bulk.thingsCollection = collectionRef; break;
					case DatumType.relationships: bulk.relationshipsCollection = collectionRef; break;
				}
			} else if (type == DatumType.predicates) {
				this.predicatesCollection = collectionRef;
			}

			const docs = querySnapshot.docs;
			debug.log_remote('READ ' + docs.length + ' from ' + baseID + ':' + type);
			for (const docSnapshot of docs) {
				const id = docSnapshot.id;
				const data = docSnapshot.data();
				await this.document_remember_validated(type, id, data, baseID ?? this.baseID);
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
							let thing = h.thing_bulkAlias_forTitle(baseID);
							if (!thing) {								// create a thing for each bulk
								thing = h.thing_runtimeCreate(this.baseID, Identifiable.newID(), baseID, 'red', IDTrait.bulk);
								await h.ancestry_remember_remoteAddAsChild(rootsAncestry, thing);
							} else if (thing.thing_isBulk_expanded) {
								await h.ancestry_redraw_remoteFetchBulk_browseRight(thing);
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
	
	snapshot_deferOne(baseID: string, type: DatumType, snapshot: QuerySnapshot) {
		const deferral = new SnapshotDeferal(baseID, type, snapshot);
		this.deferredSnapshots.push(deferral);
	}

	handle_deferredSnapshots() {
		this.deferSnapshots = false;
		while (this.deferredSnapshots.length > 0) {
			const deferral = this.deferredSnapshots.pop();
			if (!!deferral) {
				deferral.snapshot.docChanges().forEach((change) => {	// convert and remember
					this.handle_docChanges(deferral.baseID, deferral.type, change);
				});
			}
		}
	}

	setup_handle_docChanges(baseID: string, type: DatumType, collection: CollectionReference) {
		onSnapshot(collection, (snapshot) => {
			if (h.isAssembled) {		// u.ignore snapshots caused by data written to server
				if (this.deferSnapshots) {
					this.snapshot_deferOne(baseID, type, snapshot);
				} else {
					snapshot.docChanges().forEach((change) => {	// convert and remember
						this.handle_docChanges(baseID, type, change);
					});
				}
			}
		}
	)};

	async handle_docChanges(baseID: string, type: DatumType, change: DocumentChange) {
		const doc = change.doc;
		const data = doc.data();
		if (DBFirebase.data_isValidOfKind(type, data)) {
			const id = doc.id;

			///////////////////////
			//	 data IDSignal	 //
			//	change IDSignal  //
			///////////////////////

			try {
				if (type == DatumType.relationships) {
					const remoteRelationship = new RemoteRelationship(data);
					if (!!remoteRelationship) {
						let relationship = h.relationship_forHID(id.hash());
						switch (change.type) {
							case 'added':
								if (!!relationship) {
									return;
								}
								relationship = h.relationship_remember_runtimeCreateUnique(baseID, id, remoteRelationship.predicate.id, remoteRelationship.parent.id, remoteRelationship.child.id, remoteRelationship.order, CreationOptions.isFromRemote);
								break;
							default:
								if (!relationship) {
									return;	// not known so do not signal
								} else {
									switch (change.type) {
										case 'modified':
											if (relationship.wasModifiedWithinMS(800) || !this.relationship_extractChangesFromRemote(relationship, remoteRelationship)) {
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
							h.rootAncestry.order_normalizeRecursive_remoteMaybe(true);
						}, 20);
					}
				} else if (type == DatumType.things) {
					const remoteThing = new RemoteThing(data);
					let thing = h.thing_forHID(id.hash());
					if (!!remoteThing) {
						switch (change.type) {
							case 'added':
								if (!!thing || remoteThing.isEqualTo(this.addedThing) || remoteThing.trait == IDTrait.root) {
									return;			// do not invoke signal because nothing has changed
								}
								thing = h.thing_remember_runtimeCreate(baseID, id, remoteThing.title, remoteThing.color, remoteThing.trait, data.consequence, data.quest, true);
								break;
							case 'removed':
								if (!!thing) {
									h.thing_forget(thing);
								}
								break;
							case 'modified':
								if (!thing || thing.wasModifiedWithinMS(800) || !this.thing_extractChangesFromRemote(thing, remoteThing)) {
									return;		// do not invoke signal if nothing changed
								}
								break;
						}
					}
				}
				signals.signal_rebuildGraph_fromFocus();
			} catch (error) {
				this.reportError(error);
			}
			debug.log_remote('HANDLE ' + baseID + ':' + type + k.space + change.type);
		}
	}

	static readonly $_SUBCOLLECTIONS_$: unique symbol;

	async documents_firstTime_remoteCreate(type: DatumType, baseID: string, collectionRef: CollectionReference) {
		const docRef = doc(this.firestore, this.bulksName, baseID);
		await setDoc(docRef, { isReal: true }, { merge: true });
		await updateDoc(docRef, { isReal: deleteField() });
		if (type == DatumType.things) {
			await this.things_remember_firstTime_remoteCreateIn(collectionRef);
		}
	}

	async document_remember_validated(type: DatumType, id: string, data: DocumentData, baseID: string) {
		if (DBFirebase.data_isValidOfKind(type, data)) {
			switch (type) {
				case DatumType.predicates:	  h.predicate_remember_runtimeCreate(id, data.kind, data.isBidirectional); break;
				case DatumType.things:		  h.thing_remember_runtimeCreate(baseID, id, data.title, data.color, data.trait, data.consequence, data.quest, true); break;
				case DatumType.relationships: h.relationship_remember_runtimeCreateUnique(baseID, id, data.predicate.id, data.parent.id, data.child.id, data.order, CreationOptions.isFromRemote); break;
			}
		}
	}

	async document_remoteDelete() {
		const documentRef = doc(this.firestore, this.bulksName, this.baseID);
		await this.subcollections_remoteDeleteIn(documentRef);

		try {
			await deleteDoc(documentRef);
		} catch (error) {
			this.reportError(error);
		}
	}
	
	async subcollections_remoteDeleteIn(docRef: DocumentReference) {
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

	async thing_remember_remoteCreate(thing: Thing) {
		const thingsCollection = this.bulk_for(thing.baseID)?.thingsCollection;
		if (!!thingsCollection) {
			const remoteThing = new RemoteThing(thing);
			const jsThing = { ...remoteThing };
			thing.awaitingCreation = true;
			this.addedThing = thing;
			try {
				this.deferSnapshots = true;
				const ref = await addDoc(thingsCollection, jsThing)
				thing.awaitingCreation = false;
				thing.hasBeen_remotely_saved = true;
				thing.setID(ref.id);			// so relationship will be correct
				h.thing_remember(thing);
				this.handle_deferredSnapshots();
				thing.log(DebugFlag.remote, 'CREATE T');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	async things_remember_firstTime_remoteCreateIn(collectionRef: CollectionReference) {
		const fields = ['title', 'color', 'trait', 'consequence'];
		const root = new Thing(this.baseID, Identifiable.newID(), this.baseID, 'coral', IDTrait.root, k.empty, k.empty, true);
		const thing = new Thing(this.baseID, Identifiable.newID(), 'Click this text to edit it', 'purple', k.empty, k.empty, k.empty, true);
		h.root = root;
		const thingRef = await addDoc(collectionRef, u.convertToObject(thing, fields));		// N.B. these will be fetched, shortly
		const rootRef = await addDoc(collectionRef, u.convertToObject(root, fields));		// no need to remember now
		thing.setID(thingRef.id);
		root.setID(rootRef.id);
		root.log(DebugFlag.remote, 'CREATE T');
		thing.log(DebugFlag.remote, 'CREATE T');
	}

	async thing_remoteUpdate(thing: Thing) {
		const thingsCollection = this.bulk_for(thing.baseID)?.thingsCollection;
		if (!!thingsCollection) {
			const ref = doc(thingsCollection, thing.id) as DocumentReference<Thing>;
			const remoteThing = new RemoteThing(thing);
			const jsThing = { ...remoteThing };
			try {
				await setDoc(ref, jsThing);
				thing.log(DebugFlag.remote, 'UPDATE T');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	async thing_remoteDelete(thing: Thing) {
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

	thing_extractChangesFromRemote(thing: Thing, from: RemoteThing) {
		const changed = !from.isEqualTo(thing);
		if (changed) {
			thing.consequence = from.consequence;
			thing.title		  = from.virginTitle;
			thing.quest		  = from.quest;
			thing.trait		  = from.trait;
			thing.color		  = from.color;
		}
		return changed;
	}

	static readonly $_RELATIONSHIP_$: unique symbol;

	async relationship_remember_remoteCreate(relationship: Relationship) {
		const relationshipsCollection = this.bulk_for(relationship.baseID)?.relationshipsCollection;
		if (!!relationshipsCollection) {
			const remoteRelationship = new RemoteRelationship(relationship);
			const jsRelationship = { ...remoteRelationship };
			relationship.awaitingCreation = true;
			try {
				this.deferSnapshots = true;
				const ref = await addDoc(relationshipsCollection, jsRelationship); // works!
				relationship.awaitingCreation = false;
				relationship.hasBeen_remotely_saved = true;
				relationship.setID(ref.id);
				h.relationship_remember(relationship);
				this.handle_deferredSnapshots();
				relationship.log(DebugFlag.remote, 'CREATE R');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	async relationship_remoteUpdate(relationship: Relationship) {
		const relationshipsCollection = this.bulk_for(relationship.baseID)?.relationshipsCollection;
		if (!!relationshipsCollection) {
			try {
				const ref = doc(relationshipsCollection, relationship.id) as DocumentReference<RemoteRelationship>;
				const remoteRelationship = new RemoteRelationship(relationship);
				const jsRelationship = { ...remoteRelationship };
				await setDoc(ref, jsRelationship);
				relationship.log(DebugFlag.remote, 'UPDATE R');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	async relationship_remoteDelete(relationship: Relationship) {
		const relationshipsCollection = this.bulk_for(relationship.baseID)?.relationshipsCollection;
		if (!!relationshipsCollection) {
			try {
				const ref = doc(relationshipsCollection, relationship.id) as DocumentReference<RemoteRelationship>;
				await deleteDoc(ref);
				relationship.log(DebugFlag.remote, 'DELETE R');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	relationship_extractChangesFromRemote(relationship: Relationship, remote: RemoteRelationship) {
		const changed = (relationship.idPredicate != remote.predicate.id ||
			relationship.idParent != remote.parent.id ||
			relationship.idChild != remote.child.id ||
			relationship.order != remote.order)
		if (changed) {
			relationship.idChild = remote.child.id;
			relationship.idParent = remote.parent.id;
			relationship.hasBeen_remotely_saved = true;
			relationship.idPredicate = remote.predicate.id;
			relationship.order_setTo_remoteMaybe(remote.order + k.halfIncrement);
		}
		return changed;
	}

	static readonly $_VALIDATION_$: unique symbol;

	static data_isValidOfKind(type: DatumType, data: DocumentData) {
		switch (type) {
			case DatumType.things:		
				const thing = data as Thing;	
				if (thing.hasNoData) {
					return false;
				}
				break;
			case DatumType.predicates:
				if (!data.kind) {
					return false;
				}
				break;
			case DatumType.relationships:
				const relationship = data as RemoteRelationship;
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
	relationshipsCollection: CollectionReference | null = null;
	constructor(baseID: string) {
		this.baseID = baseID;
	}
}

class SnapshotDeferal {
	baseID: string;
	type: DatumType;
	snapshot: QuerySnapshot;

	constructor(baseID: string, type: DatumType, snapshot: QuerySnapshot) {
		this.baseID = baseID;
		this.type = type;
		this.snapshot = snapshot;
	}
}

interface RemoteThing {
	consequence: string;
	title: string;
	quest: string;
	color: string;
	trait: string;
}

class RemoteThing implements RemoteThing {
	constructor(data: DocumentData) {
		const remote = data as RemoteThing;
		this.consequence = remote.consequence;
		this.title	 = remote.title;
		this.quest	 = remote.quest;
		this.trait	 = remote.trait;
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
		thing.consequence == this.consequence &&
		thing.title == this.title &&
		thing.quest == this.quest &&
		thing.trait == this.trait &&
		thing.color == this.color;
	}
}

interface RemoteRelationship {
	order: number;
	child: DocumentReference<Thing, DocumentData>;
	parent: DocumentReference<Thing, DocumentData>;
	predicate: DocumentReference<Predicate, DocumentData>;
}

class RemoteRelationship implements RemoteRelationship {

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
					const remote = data as RemoteRelationship;
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
