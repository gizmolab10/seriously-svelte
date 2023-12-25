import { k, get, Thing, debug, launch, DBType, TraitType, DataKind, Hierarchy, copyObject, DebugFlag, signal_rebuild_fromHere } from '../common/GlobalImports';
import { Predicate, dbDispatch, Relationship, CreationOptions, convertToObject, orders_normalize_remoteMaybe } from '../common/GlobalImports';
import { doc, addDoc, setDoc, getDocs, deleteDoc, updateDoc, collection, onSnapshot, deleteField, getFirestore } from 'firebase/firestore';
import { DocumentData, DocumentChange, QuerySnapshot, serverTimestamp, DocumentReference, CollectionReference } from 'firebase/firestore';
import { initializeApp } from "firebase/app";
import { build } from '../managers/State';
import DBInterface from './DBInterface';

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
	baseID = 'Public';
	bulksName = 'Bulks';
	deferSnapshots = false;
	db_type = DBType.firebase;
	bulks: [Bulk] | null = null;
	app = initializeApp(this.firebaseConfig);
	predicatesCollection: CollectionReference | null = null;
	deferredSnapshots: Array<SnapshotDeferal> = [];
	addedRelationship: Relationship | null = null
	_hierarchy: Hierarchy | null = null;
	addedThing: Thing | null = null
	db = getFirestore(this.app);

	setHasData(flag: boolean) { this.hasData = flag; }
	reportError(error: any) { console.log(error); }

	get hierarchy(): Hierarchy { 
		if (this._hierarchy == null) {
		this._hierarchy = new Hierarchy(this);
}
		return this._hierarchy!;
	}

	applyQueryStrings(params: URLSearchParams) {
		this.baseID = params.get('name') ?? params.get('dbid') ?? 'Public';
	}

	//////////////////////////
	//	 	   FETCH		//
	//////////////////////////

	async fetch_all() {
		await this.recordLogin();
		const name = this.baseID;
		if (dbDispatch.eraseDB) {
			await this.document_remoteDelete(name);
		}
		this.setup_bulks()
		await this.fetch_documentsOf(DataKind.predicates);
		await this.fetch_allFrom(name);
		await this.fetch_bulkAliases();
	}

	async fetch_allFrom(baseID: string) {
		await this.fetch_documentsOf(DataKind.things, baseID);
		await this.fetch_documentsOf(DataKind.relationships, baseID);
	}
		
	async fetch_documentsOf(dataKind: DataKind, baseID: string | null = null) {
		try {
			const collectionRef = !baseID ? collection(this.db, dataKind) : collection(this.db, this.bulksName, baseID, dataKind);
			let querySnapshot = await getDocs(collectionRef);
			const bulk = this.get_bulk_for(baseID);

			if (baseID) {
				this.setup_remoteHandler(baseID, dataKind, collectionRef);
			}

			if (querySnapshot.empty && baseID) {
				await this.documents_firstTime_remoteCreate(dataKind, baseID, collectionRef);
				querySnapshot = await getDocs(collectionRef);
			}
			
			////////////////
			// data kinds //
			////////////////

			if (bulk) {
				switch (dataKind) {
					case DataKind.things:				bulk.thingsCollection = collectionRef; break;
					case DataKind.relationships: bulk.relationshipsCollection = collectionRef; break;
				}
			} else if (dataKind == DataKind.predicates) {
				this.predicatesCollection = collectionRef;
			}

			const docs = querySnapshot.docs;
			debug.log_remote('READ ' + docs.length + ' from ' + baseID + ':' + dataKind);
			for (const docSnapshot of docs) {
				const id = docSnapshot.id;
				const data = docSnapshot.data();
				await this.document_remember_validated(dataKind, id, data, baseID ?? this.baseID);
			}
		} catch (error) {
			this.reportError(error);
		}
	}

	//////////////////////////
	//	 	   BULKS		//
	//////////////////////////

	setup_bulks() {
		if (!this.bulks) {
			this.bulks = [new Bulk(this.baseID)];
		}
	}

	get_bulk_for(baseID: string | null) {
		if (baseID) {
			const bulks = this.bulks;
			if (bulks) {
				for (const bulk of bulks) {
					if (bulk.baseID == baseID) {
						return bulk;
					}
				}
				const newBulk = new Bulk(baseID);
				this.bulks!.push(newBulk);
				return newBulk;
			}
		}
		return null;
	}
	
	async fetch_bulkAliases() {
		const root = this.hierarchy.root;
		if (this.baseID == k.adminBulkName && root) {
			const roots = await this.hierarchy.thing_getRoots();
			if (roots) {
				try {		// add bulks to roots thing
					const bulk = collection(this.db, this.bulksName);		// fetch all bulks (documents)
					let bulkSnapshot = await getDocs(bulk);
					for (const bulkDoc of bulkSnapshot.docs) {
						const baseID = bulkDoc.id;
						if (baseID != this.baseID) {
							let thing = this.hierarchy.thing_bulkAlias_getForTitle(baseID)
							if (!thing) {													// create a thing for each bulk
								thing = this.hierarchy.thing_runtimeCreate(this.baseID, null, baseID, 'red', TraitType.bulk, 0, false);
								await this.hierarchy.thing_remember_remoteAddAsChild(thing, roots);
							} else if (thing.isExpanded) {
								thing.redraw_bulkFetchAll_runtimeBrowseRight(false);
							}
						}
					}
					// TODO: detect when a root disappears
					// TODO: store the expanded in its own  ** bulk-specific **  persistent storage
				} catch (error) {
					this.reportError(error);
				}
			}
		}
	}

	//////////////////////////////////////
	//	 		REMOTE SNAPSHOTS		//
	//////////////////////////////////////
	
	snapshot_deferOne(baseID: string, dataKind: DataKind, snapshot: QuerySnapshot) {
		const deferral = new SnapshotDeferal(baseID, dataKind, snapshot);
		this.deferredSnapshots.push(deferral);
	}

	snapshots_handleDeferred() {
		this.deferSnapshots = false;
		while (this.deferredSnapshots.length > 0) {
			const deferral = this.deferredSnapshots.pop();
			if (deferral) {
				deferral.snapshot.docChanges().forEach((change) => {	// convert and remember
					this.remoteHandler(deferral.baseID, deferral.dataKind, change);
				});
			}
		}
	}

	setup_remoteHandler(baseID: string, dataKind: DataKind, collection: CollectionReference) {
		onSnapshot(collection, (snapshot) => {
			if (this.hierarchy.isConstructed) {		// ignore snapshots caused by data written to server
				if (this.deferSnapshots) {
					this.snapshot_deferOne(baseID, dataKind, snapshot);
				} else {
					snapshot.docChanges().forEach((change) => {	// convert and remember
						this.remoteHandler(baseID, dataKind, change);
					});
				}
			}
		}
	)};

	async remoteHandler(baseID: string, dataKind: DataKind, change: DocumentChange) {
		const doc = change.doc;
		const data = doc.data();
		if (DBFirebase.data_isValidOfKind(dataKind, data)) {
			const h = this.hierarchy;
			const id = doc.id;

			////////////////////
			//	 data kinds	  //
			//	change types  //
			////////////////////

			try {
				if (dataKind == DataKind.relationships) {
					const remote = new RemoteRelationship(data);
					if (remote) {
						const relationship = h.knownR_byID[id];
						const original = !relationship ? null : copyObject(relationship);
						switch (change.type) {
							case 'added':
								if (relationship || remote.isEqualTo(this.addedRelationship)) {
									return;
								}
								h.relationship_remember_runtimeCreateUnique(baseID, id, remote.predicate.id, remote.from.id, remote.to.id, remote.order, CreationOptions.isFromRemote);
								break;
							default:
								if (!relationship) {
									return;	// not known so do not signal
								} else {
									switch (change.type) {
										case 'modified':
											if (relationship.wasModifiedWithinMS(800) || !this.relationship_extractChangesFromRemote(relationship, remote)) {
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
						h.relationships_refreshKnowns_remoteRenormalize();
						if (relationship) {
							h.relationships_accomodateRelocations(original, relationship);
						}
					}
				} else if (dataKind == DataKind.things) {
					const remote = new RemoteThing(data);
					let thing = h.thing_getForID(id);
					if (remote) {
						switch (change.type) {
							case 'added':
								if (thing || remote.isEqualTo(this.addedThing) || remote.trait == TraitType.root) {
									return;			// do not invoke signal because nothing has changed
								}
								thing = h.thing_remember_runtimeCreate(baseID, id, remote.title, remote.color, remote.trait, 0, true);
								orders_normalize_remoteMaybe(thing.siblings);
								break;
							case 'removed':
								if (thing) {
									h.thing_forget(thing);
								}
								break;
							case 'modified':
								if (!thing || thing.wasModifiedWithinMS(800) || !this.thing_extractChangesFromRemote(thing, remote)) {
									return;		// do not invoke signal if nothing changed
								}
								break;
						}
					}
				}
				signal_rebuild_fromHere();
			} catch (error) {
				this.reportError(error);
			}
			debug.log_remote('HANDLE ' + baseID + ':' + dataKind + ' ' + change.type);
		}
	}

	//////////////////////////////////////////
	//	    DOCUMENTS & SUBCOLLECTIONS		//
	//////////////////////////////////////////

	async documents_firstTime_remoteCreate(dataKind: DataKind, baseID: string, collectionRef: CollectionReference) {
		const docRef = doc(this.db, this.bulksName, baseID);
		await setDoc(docRef, { isReal: true }, { merge: true });
		await updateDoc(docRef, { isReal: deleteField() });
		if (dataKind == DataKind.things) {
			await this.things_remember_firstTime_remoteCreateIn(collectionRef);
		}
	}

	async document_remember_validated(dataKind: DataKind, id: string, data: DocumentData, baseID: string) {
		if (DBFirebase.data_isValidOfKind(dataKind, data)) {
			const h = this.hierarchy;
			switch (dataKind) {
				case DataKind.things:		 h.thing_remember_runtimeCreate(baseID, id, data.title, data.color, data.trait, 0, true); break;
				case DataKind.predicates:	 h.predicate_remember_runtimeCreate(id, data.kind); break;
				case DataKind.relationships: h.relationship_remember_runtimeCreateUnique(baseID, id, data.predicate.id, data.from.id, data.to.id, data.order, CreationOptions.isFromRemote); break;
			}
		}
	}

	async document_remoteDelete(name: string) {
		const documentRef = doc(this.db, this.bulksName, name);
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

	//////////////////////////////
	//			 THING			//
	//////////////////////////////

	async thing_remember_remoteCreate(thing: Thing) {
		const thingsCollection = this.get_bulk_for(thing.baseID)?.thingsCollection;
		if (thingsCollection) {
			const remoteThing = new RemoteThing(thing);
			const jsThing = { ...remoteThing };
			thing.awaitingCreation = true;
			this.addedThing = thing;
			try {
				this.deferSnapshots = true;
				const ref = await addDoc(thingsCollection, jsThing)
				thing.awaitingCreation = false;
				thing.isRemotelyStored = true;
				thing.id = ref.id;			// so relationship will be correct
				this.hierarchy.thing_remember(thing);
				this.snapshots_handleDeferred();
				thing.log(DebugFlag.remote, 'CREATE T');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	async things_remember_firstTime_remoteCreateIn(collectionRef: CollectionReference) {
		const fields = ['title', 'color', 'trait'];
		const root = new Thing(this.baseID, null, this.baseID, 'coral', TraitType.root, 0, true);
		const thing = new Thing(this.baseID, null, 'Click this text to edit it', 'purple', '', 0, true);
		this.hierarchy.root = root;
		const thingRef = await addDoc(collectionRef, convertToObject(thing, fields));	// N.B. these will be fetched, shortly
		const rootRef = await addDoc(collectionRef, convertToObject(root, fields));		// no need to remember now
		thing.id = thingRef.id;
		root.id = rootRef.id;
		root.log(DebugFlag.remote, 'CREATE T');
		thing.log(DebugFlag.remote, 'CREATE T');
	}

	async thing_remoteUpdate(thing: Thing) {
		const thingsCollection = this.get_bulk_for(thing.baseID)?.thingsCollection;
		if (thingsCollection) {
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
		const thingsCollection = this.get_bulk_for(thing.baseID)?.thingsCollection;
		if (thingsCollection) {
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
		const changed = (thing.title != from.virginTitle || thing.trait != from.trait || thing.color != from.color)
		if (changed) {
			thing.title = from.virginTitle;
			thing.trait = from.trait;
			thing.color = from.color;
		}
		return changed;
	}

	//////////////////////////////////////
	//			 RELATIONSHIP			//
	//////////////////////////////////////

	async relationship_remember_remoteCreate(relationship: Relationship) {
		const relationshipsCollection = this.get_bulk_for(relationship.baseID)?.relationshipsCollection;
		if (relationshipsCollection) {
			const remoteRelationship = new RemoteRelationship(relationship);
			const jsRelationship = { ...remoteRelationship };
			this.addedRelationship = relationship;
			relationship.awaitingCreation = true;
			try {
				this.deferSnapshots = true;
				const ref = await addDoc(relationshipsCollection, jsRelationship); // works!
				relationship.awaitingCreation = false;
				relationship.isRemotelyStored = true;
				relationship.id = ref.id;
				this.hierarchy.relationship_remember(relationship);
				this.snapshots_handleDeferred();
				relationship.log(DebugFlag.remote, 'CREATE R');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	async relationship_remoteUpdate(relationship: Relationship) {
		const relationshipsCollection = this.get_bulk_for(relationship.baseID)?.relationshipsCollection;
		if (relationshipsCollection) {
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
		const relationshipsCollection = this.get_bulk_for(relationship.baseID)?.relationshipsCollection;
		if (relationshipsCollection) {
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
		const order = remote.order + k.halfIncrement;
		const changed = (relationship.idTo != remote.to.id || relationship.idFrom != remote.from.id || relationship.idPredicate != remote.predicate.id)
		if (changed) {
			relationship.idTo = remote.to.id;
			relationship.idFrom = remote.from.id;
			relationship.isRemotelyStored = true;
			relationship.order_setTo(order, false);		// also sets to-thing's order
			relationship.idPredicate = remote.predicate.id;
		}
		return changed;
	}

	//////////////////////////////////
	//			VALIDATION			//
	//////////////////////////////////

	static data_isValidOfKind(dataKind: DataKind, data: DocumentData) {
		switch (dataKind) {
			case DataKind.things:		
				const thing = data as Thing;	
				if (!thing.title && thing.title != '' || !thing.color && thing.color != '' || !thing.trait && thing.trait != '') {
					return false;
				}
				break;
			case DataKind.predicates:
				if (!data.kind) {
					return false;
				}
				break;
			case DataKind.relationships:
				const relationship = data as RemoteRelationship;
				if (!relationship.predicate || !relationship.from || !relationship.to) {
					return false;
				}
				break;
			default:
				return false;
		}
		return true;
	}

	async recordLogin() {
		await this.getUserIPAddress().then((ipAddress) => {
			if (ipAddress != null && ipAddress != '69.181.235.85') {
				const queries = launch.queryStrings?.toString() ?? 'empty';
				const logRef = collection(this.db, 'access_logs');
				const item = {
					queries: queries,
					build: get(build),
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
			return ipAddress.replace(/\n/g, '');
		} catch (error) {
			this.reportError('Error fetching IP address:' + error);
			return null;
		}
	}

}

export const dbFirebase = new DBFirebase();

class Bulk {
	baseID: string = '';
	thingsCollection: CollectionReference | null = null;
	relationshipsCollection: CollectionReference | null = null;
	constructor(baseID: string) {
		this.baseID = baseID;
	}
}

class SnapshotDeferal {
	baseID: string;
	dataKind: DataKind;
	snapshot: QuerySnapshot;

	constructor(baseID: string, dataKind: DataKind, snapshot: QuerySnapshot) {
		this.baseID = baseID;
		this.dataKind = dataKind;
		this.snapshot = snapshot;
	}
}

interface RemoteThing {
	title: string;
	color: string;
	trait: string;
}

class RemoteThing implements RemoteThing {
	constructor(data: DocumentData) {
		const remote = data as RemoteThing;
		this.title = remote.title;
		this.trait = remote.trait;
		this.color = remote.color;
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
		return thing != null &&
		thing.title == this.title &&
		thing.trait == this.trait &&
		thing.color == this.color;
	}
}

interface RemoteRelationship {
	order: number;
	to: DocumentReference<Thing, DocumentData>;
	from: DocumentReference<Thing, DocumentData>;
	predicate: DocumentReference<Predicate, DocumentData>;
}

class RemoteRelationship implements RemoteRelationship {

	constructor(data: DocumentData | Relationship) {
		const things = dbFirebase.get_bulk_for(dbFirebase.baseID)?.thingsCollection;
		const predicates = dbFirebase.predicatesCollection;
		this.order = data.order;
		if (things && predicates) {
			try {
				if (data instanceof Relationship) {
					if (data.isValid) {
						this.to = doc(things, data.idTo) as DocumentReference<Thing>;
						this.from = doc(things, data.idFrom) as DocumentReference<Thing>;
						this.predicate = doc(predicates, data.idPredicate) as DocumentReference<Predicate>;
					}
				} else {
					const remote = data as RemoteRelationship;
					if (DBFirebase.data_isValidOfKind(DataKind.relationships, data)) {
						this.to = doc(things, remote.to.id) as DocumentReference<Thing>;
						this.from = doc(things, remote.from.id) as DocumentReference<Thing>;
						this.predicate = doc(predicates, remote.predicate.id) as DocumentReference<Predicate>;
					}
				}
			} catch (error) {
				dbFirebase.reportError(error);
			}
		}
	}

	isEqualTo(relationship: Relationship | null) {
		return relationship != null &&
		relationship.idPredicate == this.predicate.id &&
		relationship.idFrom == this.from.id &&
		relationship.order == this.order &&
		relationship.idTo == this.to.id;
	}

}
