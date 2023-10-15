import { Thing, Datum, DBType, DataKind, signal, Signals, k, Hierarchy, copyObject, Predicate, dbDispatch, Relationship, CreationFlag, convertToObject } from '../common/GlobalImports';
import { doc, addDoc, setDoc, getDocs, deleteDoc, updateDoc, collection, onSnapshot, getFirestore, deleteField } from 'firebase/firestore';
import { DocumentData, DocumentChange, DocumentReference, CollectionReference } from 'firebase/firestore';
import { initializeApp } from "firebase/app";
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
	dbType = DBType.firebase;
	collectionName = 'Bulks';
	app = initializeApp(this.firebaseConfig);
	db = getFirestore(this.app);
	_hierarchy: Hierarchy | null = null;
	thingsCollection: CollectionReference | null = null;
	predicatesCollection: CollectionReference | null = null;
	relationshipsCollection: CollectionReference | null = null;

	reportError(error: any) { console.log(error); }

	get hierarchy(): Hierarchy { 
		if (this._hierarchy == null) {
			this._hierarchy = new Hierarchy(this);
		}
		return this._hierarchy!;
	}

	async fetch_all() {
		const name = dbDispatch.bulkName;
		if (dbDispatch.eraseDB) {
			await this.document_remoteDelete(name);
		}
		await this.fetch_documentsOf(DataKind.predicates);
		await this.fetch_allFrom(name);
		await this.fetch_allBulks();
	}

	async fetch_allFrom(bulkName: string) {
		await this.fetch_documentsOf(DataKind.things, bulkName);
		await this.fetch_documentsOf(DataKind.relationships, bulkName);
	}
		
	async fetch_documentsOf(dataKind: DataKind, bulkName: string | null = null) {
		try {
			const collectionRef = !bulkName ? collection(this.db, dataKind) : collection(this.db, this.collectionName, bulkName, dataKind);
			let querySnapshot = await getDocs(collectionRef);
			this.remoteHandler_setup(dataKind, collectionRef);

			if (querySnapshot.empty && bulkName) {
				await this.documents_startup_remoteCreate(dataKind, bulkName, collectionRef);
				querySnapshot = await getDocs(collectionRef);
			}
			
			////////////////
			// data kinds //
			////////////////

			switch (dataKind) {
				case DataKind.things:				this.thingsCollection = collectionRef; break;
				case DataKind.predicates:		this.predicatesCollection = collectionRef; break;
				case DataKind.relationships: this.relationshipsCollection = collectionRef; break;
			}

			const docs = querySnapshot.docs;
			for (const docSnapshot of docs) {
				const id = docSnapshot.id;
				const data = docSnapshot.data();
				await this.remember_validatedDocument(dataKind, id, data, bulkName);
			}
		} catch (error) {
			this.reportError(error);
		}
	}
		
	async fetch_allBulks() {
		const root = this.hierarchy.root;
		if (dbDispatch.bulkName == 'Jonathan Sand' && root) {
			let roots = this.hierarchy.thing_getRoots();
			if (!roots) {
				roots = this.hierarchy.thing_remember_runtimeCreate(Datum.newID, 'roots', 'red', '^', -1, false);
				await this.hierarchy.thing_remoteAddAsChild(roots, root);
			}
			try {		// add bulks to roots thing
				const bulksCollection = collection(this.db, this.collectionName);		// fetch all bulks (documents)
				let bulkSnapshot = await getDocs(bulksCollection);
				for (const bulkShot of bulkSnapshot.docs) {
					const title = bulkShot.id;
					if (title != dbDispatch.bulkName && !this.hierarchy.hasRootWithTitle(title)) {				// create a thing for each bulk
						const thing = this.hierarchy.thing_remember_runtimeCreate(Datum.newID, title, 'red', '~', -1, false);
						await this.hierarchy.thing_remoteAddAsChild(thing, roots);
					}
				}
				// TODO: detect when a root disappears
				// TODO: store the expanded in its own bulk-specific persistent storage
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	remoteHandler_setup(dataKind: DataKind, collection: CollectionReference) {
		onSnapshot(collection, (snapshot) => {
			if (this.hierarchy.isConstructed) {								// ignore snapshots caused by data written to server
				snapshot.docChanges().forEach((change) => {	// convert and remember
					this.remoteHandler(change, dataKind);
				});
				signal(Signals.childrenOf);
			}
		}
	)};

	async remoteHandler(change: DocumentChange, dataKind: DataKind) {
		const doc = change.doc;
		const data = doc.data();
		if (DBFirebase.isValidOfKind(dataKind, data)) {
			const id = doc.id;

			////////////////////
			//	 data kinds	  //
			//	change types  //
			////////////////////

			try {
				if (dataKind == DataKind.relationships) {
					const remote = new RemoteRelationship(data);
					if (remote) {
						const relationship = this.hierarchy.knownR_byID[id];
						const original = !relationship ? null : copyObject(relationship);
						switch (change.type) {
							case 'added':
								if (!relationship) {
									await this.hierarchy.relationship_remember_remoteCreateNoDuplicate(id, remote.predicate.id, remote.from.id, remote.to.id, remote.order, CreationFlag.isFromRemote);
									this.hierarchy.relationships_refreshKnowns_runtimeRenormalize();
								}
								break;
							default:
								if (relationship) {
									switch (change.type) {
										case 'modified':
											if (relationship.wasModifiedWithinMS(100) || this.isEqualTo(relationship, remote)) {
												return;	// already known and contains no new data, or needs to be 'tamed'
											}
											this.relationship_extractRemote(relationship, remote);
											this.hierarchy.relationships_refreshKnowns_runtimeRenormalize();
											relationship.thingTo_updateOrder(false);
											break;
										case 'removed': 
											delete this.hierarchy.knownR_byID[id];
											this.hierarchy.relationships_refreshKnowns_runtimeRenormalize();
											break;
									}
								}
								break;
						}
						if (relationship) {
							this.hierarchy.relationships_accomodateRelocations(original, relationship);
						}
					}
				} else if (dataKind == DataKind.things) {
					const remote = new RemoteThing(data);
					const thing = this.hierarchy.thing_getForID(id);
					if (remote) {
						switch (change.type) {
							case 'added':
								if (!thing) {
									this.hierarchy.thing_remember_runtimeCreate(id, remote.title, remote.color, remote.trait, -1, true);
								}
								break;
							default:
								const parentID = thing?.firstParent?.id;
								if (thing && parentID) {
									switch (change.type) {
										case 'modified':
											this.thing_extractRemote(thing, remote);
											break;
										case 'removed': 
											delete this.hierarchy.knownT_byID[id];
											break;
									}
									signal(Signals.childrenOf, parentID);
								}
								break;
						}
					}
				}
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	//////////////////////////////////////////
	//	    DOCUMENTS / SUBCOLLECTIONS		//
	//////////////////////////////////////////

	async documents_startup_remoteCreate(dataKind: DataKind, bulkName: string, collectionRef: CollectionReference) {
		const docRef = doc(this.db, this.collectionName, bulkName);
		await setDoc(docRef, { isReal: true }, { merge: true });
		await updateDoc(docRef, { isReal: deleteField() });
		if (dataKind == DataKind.things) {
			await this.things_startup_remoteCreateIn(collectionRef);
		}
	}

	async document_remoteDelete(name: string) {
		const documentRef = doc(this.db, this.collectionName, name);
		await this.subcollections_remoteDeleteIn(documentRef);

		try {
			await deleteDoc(documentRef);
			console.log('deleted');
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

	async thing_remoteCreate(thing: Thing) {
		const collection = this.thingsCollection;
		if (collection) {
			const remoteThing = new RemoteThing(thing);
			const jsThing = { ...remoteThing };
			try {
				const ref = await addDoc(collection, jsThing)
				thing.isRemotelyStored = true;
				thing.id = ref.id;			// so relationship will be correct
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	async things_startup_remoteCreateIn(collectionRef: CollectionReference) {
		const fields = ['title', 'color', 'trait'];
		const root = new Thing(Datum.newID, dbDispatch.bulkName, 'coral', '!', 0, false);
		const thing = new Thing(Datum.newID, 'Click this text to edit it', 'purple', '', 0, false);
		this.hierarchy.root = root;
		await addDoc(collectionRef, convertToObject(thing, fields));
		await addDoc(collectionRef, convertToObject(root, fields));
	}

	async thing_remoteUpdate(thing: Thing) {
		const collection = this.thingsCollection;
		if (collection) {
			const ref = doc(collection, thing.id) as DocumentReference<Thing>;
			const remoteThing = new RemoteThing(thing);
			const jsThing = { ...remoteThing };
			try {
				await setDoc(ref, jsThing);
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	async thing_remoteDelete(thing: Thing) {
		const collection = this.thingsCollection;
		if (collection) {
			try {
				const ref = doc(collection, thing.id) as DocumentReference<Thing>;
				await deleteDoc(ref);
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	thing_extractRemote = (thing: Thing, from: RemoteThing) => {
		thing.title = from.title;
		thing.trait = from.trait;
		thing.color = from.color;
	}

	//////////////////////////////////////
	//			 RELATIONSHIP			//
	//////////////////////////////////////

	async relationship_remoteCreate(relationship: Relationship) {
		const collection = this.relationshipsCollection;
		if (collection) {
			const remoteRelationship = new RemoteRelationship(relationship);
			const jsRelationship = { ...remoteRelationship };
			relationship.awaitingCreation = true;
			try {
				const ref = await addDoc(collection, jsRelationship); // works!
				relationship.awaitingCreation = false;
				relationship.isRemotelyStored = true;
				relationship.id = ref.id;
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	async relationship_remoteUpdate(relationship: Relationship) {
		const collection = this.relationshipsCollection;
		if (collection) {
			try {
				const ref = doc(collection, relationship.id) as DocumentReference<RemoteRelationship>;
				const remoteRelationship = new RemoteRelationship(relationship);
				const jsRelationship = { ...remoteRelationship };
				await setDoc(ref, jsRelationship);
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	async relationship_remoteDelete(relationship: Relationship) {
		const collection = this.relationshipsCollection;
		if (collection) {
			try {
				const ref = doc(collection, relationship.id) as DocumentReference<RemoteRelationship>;
				await deleteDoc(ref);
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	isEqualTo(relationship: Relationship, remote: RemoteRelationship) {
		return relationship.idPredicate == remote.predicate.id &&
		relationship.idFrom == remote.from.id &&
		relationship.order == remote.order &&
		relationship.idTo == remote.to.id;
	}

	relationship_extractRemote(relationship: Relationship, remote: RemoteRelationship) {
		const order = remote.order - k.orderIncrement;
		relationship.idTo = remote.to.id;
		relationship.order = order;
		relationship.idFrom = remote.from.id;
		relationship.idPredicate = remote.predicate.id;
		// relationship.log('extract');
	}

	//////////////////////////////////
	//			VALIDATION			//
	//////////////////////////////////

	static isValidOfKind(dataKind: DataKind, data: DocumentData) {
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

	async remember_validatedDocument(dataKind: DataKind, id: string, data: DocumentData, bulkName: string | null = null) {
		if (DBFirebase.isValidOfKind(dataKind, data)) {
			const h = this.hierarchy;
			switch (dataKind) {
				case DataKind.things:			h.thing_remember_runtimeCreate(id, data.title, data.color, data.trait, -1, true, bulkName); break;
				case DataKind.predicates:		h.predicate_rememberRuntimeCreate(id, data.kind); break;
				case DataKind.relationships:	await h.relationship_remember_remoteCreateNoDuplicate(id, data.predicate.id, data.from.id, data.to.id, data.order, CreationFlag.isFromRemote); break;
			}
		}
	}
}

export const dbFirebase = new DBFirebase();

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
}

interface RemoteRelationship {
	order: number;
	to: DocumentReference<Thing, DocumentData>;
	from: DocumentReference<Thing, DocumentData>;
	predicate: DocumentReference<Predicate, DocumentData>;
}

class RemoteRelationship implements RemoteRelationship {
	constructor(data: DocumentData | Relationship) {
		const things = dbFirebase.thingsCollection;
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
					if (DBFirebase.isValidOfKind(DataKind.relationships, data)) {
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

}
