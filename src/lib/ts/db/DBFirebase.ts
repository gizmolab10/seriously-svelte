import { k, Thing, Datum, DBType, DataKind, signal, Signals, TraitType, Hierarchy, copyObject } from '../common/GlobalImports';
import { doc, addDoc, setDoc, getDocs, deleteDoc, updateDoc, collection, onSnapshot, deleteField } from 'firebase/firestore';
import { getFirestore, DocumentData, DocumentChange, DocumentReference, CollectionReference } from 'firebase/firestore';
import { Predicate, dbDispatch, Relationship, CreationFlag, convertToObject } from '../common/GlobalImports';
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
	bulksName = 'Bulks';
	bulks: [Bulk] | null = null;
	app = initializeApp(this.firebaseConfig);
	predicatesCollection: CollectionReference | null = null;
	_hierarchy: Hierarchy | null = null;
	db = getFirestore(this.app);

	setHasData(flag: boolean) { this.hasData = flag; }
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
		this.setup_bulks()
		await this.fetch_documentsOf(DataKind.predicates);
		await this.fetch_allFrom(name);
		await this.fetch_bulkAliases();
	}

	setup_bulks() {
		if (!this.bulks) {
			this.bulks = [new Bulk(dbDispatch.bulkName)];
		}
	}

	get_bulkFor(bulkName: string | null) {
		if (bulkName) {
			const bulks = this.bulks;
			if (bulks) {
				for (const bulk of bulks) {
					if (bulk.bulkName == bulkName) {
						return bulk;
					}
				}
				const newBulk = new Bulk(bulkName);
				this.bulks!.push(newBulk);
				return newBulk;
			}
		}
		return null;
	}

	async fetch_allFrom(bulkName: string) {
		await this.fetch_documentsOf(DataKind.things, bulkName);
		await this.fetch_documentsOf(DataKind.relationships, bulkName);
	}
		
	async fetch_documentsOf(dataKind: DataKind, bulkName: string | null = null) {
		try {
			const collectionRef = !bulkName ? collection(this.db, dataKind) : collection(this.db, this.bulksName, bulkName, dataKind);
			let querySnapshot = await getDocs(collectionRef);
			const bulk = this.get_bulkFor(bulkName);

			if (bulkName) {
				this.remoteHandler_setup(bulkName, dataKind, collectionRef);
			}

			if (querySnapshot.empty && bulkName) {
				await this.documents_startup_remoteCreate(dataKind, bulkName, collectionRef);
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
			for (const docSnapshot of docs) {
				const id = docSnapshot.id;
				const data = docSnapshot.data();
				await this.document_remember_validated(dataKind, id, data, bulkName ?? dbDispatch.bulkName);
			}
		} catch (error) {
			this.reportError(error);
		}
	}
		
	async fetch_bulkAliases() {
		const root = this.hierarchy.root;
		if (dbDispatch.bulkName == k.adminBulkName && root) {
			const roots = this.hierarchy.thing_getRoots();
			if (roots) {
				try {		// add bulks to roots thing
					const bulk = collection(this.db, this.bulksName);		// fetch all bulks (documents)
					let bulkSnapshot = await getDocs(bulk);
					for (const bulkDoc of bulkSnapshot.docs) {
						const bulkName = bulkDoc.id;
						if (bulkName != dbDispatch.bulkName) {
							let thing = this.hierarchy.thing_getBulkAliasWithTitle(bulkName)
							if (!thing) {													// create a thing for each bulk
								thing = this.hierarchy.thing_runtimeCreate(dbDispatch.bulkName, Datum.newID, bulkName, 'red', TraitType.bulk, -1, false);
								this.hierarchy.thing_remoteAddAsChild(thing, roots);
							} else if (thing.isExpanded) {
								thing.redraw_fetchAll_runtimeBrowseRight(false);
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

	remoteHandler_setup(bulkName: string, dataKind: DataKind, collection: CollectionReference) {
		onSnapshot(collection, (snapshot) => {
			if (this.hierarchy.isConstructed) {								// ignore snapshots caused by data written to server
				snapshot.docChanges().forEach((change) => {	// convert and remember
					this.remoteHandler(bulkName, dataKind, change);
				});
			}
		}
	)};

	async remoteHandler(bulkName: string, dataKind: DataKind, change: DocumentChange) {
		const doc = change.doc;
		const data = doc.data();
		if (DBFirebase.data_isValidOfKind(dataKind, data)) {
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
									this.hierarchy.relationship_remember_runtimeCreateUnique(bulkName, id, remote.predicate.id, remote.from.id, remote.to.id, remote.order, CreationFlag.isFromRemote);
									this.hierarchy.relationships_refreshKnowns_runtimeRenormalize();
								}
								break;
							default:
								if (relationship) {
									switch (change.type) {
										case 'modified':
											if (relationship.wasModifiedWithinMS(100) || remote.isEqualTo(relationship)) {
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
									this.hierarchy.thing_remember_runtimeCreate(bulkName, id, remote.title, remote.color, remote.trait, -1, true);
								}
								break;
							default:
								const parentID = thing?.firstParent?.id;
								if (thing && parentID) {
									switch (change.type) {
										case 'modified':
											if (!this.thing_extractChangesFromRemote(thing, remote)) {
												return;		// do not invoke signal if nothing changed
											}
											break;
										case 'removed': 
											this.hierarchy.thing_forget(thing);
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
	//	    DOCUMENTS & SUBCOLLECTIONS		//
	//////////////////////////////////////////

	async documents_startup_remoteCreate(dataKind: DataKind, bulkName: string, collectionRef: CollectionReference) {
		const docRef = doc(this.db, this.bulksName, bulkName);
		await setDoc(docRef, { isReal: true }, { merge: true });
		await updateDoc(docRef, { isReal: deleteField() });
		if (dataKind == DataKind.things) {
			await this.things_startup_remoteCreateIn(collectionRef);
		}
	}

	async document_remember_validated(dataKind: DataKind, id: string, data: DocumentData, bulkName: string) {
		if (DBFirebase.data_isValidOfKind(dataKind, data)) {
			const h = this.hierarchy;
			switch (dataKind) {
				case DataKind.things:		 h.thing_remember_runtimeCreate(bulkName, id, data.title, data.color, data.trait, -1, true); break;
				case DataKind.predicates:	 h.predicate_remember_runtimeCreate(id, data.kind); break;
				case DataKind.relationships: h.relationship_remember_runtimeCreateUnique(bulkName, id, data.predicate.id, data.from.id, data.to.id, data.order, CreationFlag.isFromRemote); break;
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

	async thing_remoteCreate(thing: Thing) {
		const thingsCollection = this.get_bulkFor(thing.bulkName)?.thingsCollection;
		if (thingsCollection) {
			const remoteThing = new RemoteThing(thing);
			const jsThing = { ...remoteThing };
			try {
				const ref = await addDoc(thingsCollection, jsThing)
				thing.isRemotelyStored = true;
				thing.id = ref.id;			// so relationship will be correct
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	async things_startup_remoteCreateIn(collectionRef: CollectionReference) {
		const fields = ['title', 'color', 'trait'];
		const root = new Thing(dbDispatch.bulkName, Datum.newID, dbDispatch.bulkName, 'coral', TraitType.root, 0, false);
		const thing = new Thing(dbDispatch.bulkName, Datum.newID, 'Click this text to edit it', 'purple', '', 0, false);
		this.hierarchy.root = root;
		await addDoc(collectionRef, convertToObject(thing, fields));
		await addDoc(collectionRef, convertToObject(root, fields));
	}

	async thing_remoteUpdate(thing: Thing) {
		const thingsCollection = this.get_bulkFor(thing.bulkName)?.thingsCollection;
		if (thingsCollection) {
			const ref = doc(thingsCollection, thing.id) as DocumentReference<Thing>;
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
		const thingsCollection = this.get_bulkFor(thing.bulkName)?.thingsCollection;
		if (thingsCollection) {
			try {
				const ref = doc(thingsCollection, thing.id) as DocumentReference<Thing>;
				await deleteDoc(ref);
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	thing_extractChangesFromRemote = (thing: Thing, from: RemoteThing) => {
		const changed = (thing.title != from.title || thing.trait != from.trait || thing.color != from.color)
		if (changed) {
			thing.title = from.title;
			thing.trait = from.trait;
			thing.color = from.color;
		}
		return changed;
	}

	//////////////////////////////////////
	//			 RELATIONSHIP			//
	//////////////////////////////////////

	async relationship_remoteCreate(relationship: Relationship) {
		const relationshipsCollection = this.get_bulkFor(relationship.bulkName)?.relationshipsCollection;
		if (relationshipsCollection) {
			const remoteRelationship = new RemoteRelationship(relationship);
			const jsRelationship = { ...remoteRelationship };
			relationship.awaitingCreation = true;
			try {
				const ref = await addDoc(relationshipsCollection, jsRelationship); // works!
				relationship.awaitingCreation = false;
				relationship.isRemotelyStored = true;
				relationship.id = ref.id;
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	async relationship_remoteUpdate(relationship: Relationship) {
		const relationshipsCollection = this.get_bulkFor(relationship.bulkName)?.relationshipsCollection;
		if (relationshipsCollection) {
			try {
				const ref = doc(relationshipsCollection, relationship.id) as DocumentReference<RemoteRelationship>;
				const remoteRelationship = new RemoteRelationship(relationship);
				const jsRelationship = { ...remoteRelationship };
				await setDoc(ref, jsRelationship);
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	async relationship_remoteDelete(relationship: Relationship) {
		const relationshipsCollection = this.get_bulkFor(relationship.bulkName)?.relationshipsCollection;
		if (relationshipsCollection) {
			try {
				const ref = doc(relationshipsCollection, relationship.id) as DocumentReference<RemoteRelationship>;
				await deleteDoc(ref);
			} catch (error) {
				this.reportError(error);
			}
		}
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

}

export const dbFirebase = new DBFirebase();

class Bulk {
	bulkName: string = '';
	thingsCollection: CollectionReference | null = null;
	relationshipsCollection: CollectionReference | null = null;
	constructor(bulkName: string) {
		this.bulkName = bulkName;
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
}

interface RemoteRelationship {
	order: number;
	to: DocumentReference<Thing, DocumentData>;
	from: DocumentReference<Thing, DocumentData>;
	predicate: DocumentReference<Predicate, DocumentData>;
}

class RemoteRelationship implements RemoteRelationship {

	constructor(data: DocumentData | Relationship) {
		const things = dbFirebase.get_bulkFor(dbDispatch.bulkName)?.thingsCollection;
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

	isEqualTo(relationship: Relationship) {
		return relationship.idPredicate == this.predicate.id &&
		relationship.idFrom == this.from.id &&
		relationship.order == this.order &&
		relationship.idTo == this.to.id;
	}

}
