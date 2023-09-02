import { doc, addDoc, setDoc, deleteDoc, getDocs, collection, onSnapshot, getFirestore, DocumentData, DocumentChange, DocumentReference, CollectionReference } from 'firebase/firestore';
import { get, Thing, signal, Signals, constants, DataKind, hierarchy, copyObject, Predicate, Relationship, CreationFlag } from '../common/GlobalImports';
import { getAnalytics } from "firebase/analytics";
import { bulkName } from '../managers/State';
import { initializeApp } from "firebase/app";
import DBInterface from './DBInterface';

// https://firebase.google.com/docs/web/setup#available-libraries

// For Firebase JS SDK v7.20.0 and later, measurementId is optional

class DBFirebase implements DBInterface {
  firebaseConfig = {
    appId: "1:224721814373:web:0c60f394c056ef3decd78c",
    apiKey: "AIzaSyAFy4H3Ej5zfI46fvCJpBfUxmyQco-dx9U",
    authDomain: "seriously-4536d.firebaseapp.com",
    storageBucket: "seriously-4536d.appspot.com",
    messagingSenderId: "224721814373",
    measurementId: "G-9PY9LVK813",
    projectId: "seriously-4536d"
  };

  collectionName = 'Bulks';
  app = initializeApp(this.firebaseConfig);
  analytics = getAnalytics(this.app);
  db = getFirestore(this.app);
  relationshipsCollection: CollectionReference | null = null;
  predicatesCollection: CollectionReference | null = null;
  thingsCollection: CollectionReference | null = null;
  things: Thing[] = [];
  hasData = false;

  reportError(error: any) { console.log(error); }
  resetRoot() { hierarchy.resetRootFrom(this.things) }

  async setup() {
    this.things =[];
    await this.fetchDocumentsIn(DataKind.things);
    await this.fetchDocumentsIn(DataKind.predicates, true)
    await this.fetchDocumentsIn(DataKind.relationships);
  }
    
  async fetchDocumentsIn(dataKind: DataKind, noBulk: boolean = false) {
    try {
      const documentsCollection = noBulk ? collection(this.db, dataKind) : collection(this.db, this.collectionName, get(bulkName), dataKind);

      ////////////////
      // data kinds //
      ////////////////

      switch (dataKind) {
        case DataKind.things:        this.thingsCollection = documentsCollection; break;
        case DataKind.predicates:    this.predicatesCollection = documentsCollection; break;
        case DataKind.relationships: this.relationshipsCollection = documentsCollection; break;
      }

      const querySnapshot = await getDocs(documentsCollection);
      const docs = querySnapshot.docs;
      for (const documentSnapshot of docs) {
        const data = documentSnapshot.data();
        const id = documentSnapshot.id;
        await this.rememberValidatedDocument(dataKind, id, data);
      }
      this.handleRemoteChanges(dataKind, documentsCollection);
    } catch (error) {
      this.reportError(error);
    }
  }

  handleRemoteChanges(dataKind: DataKind, collection: CollectionReference) {
    onSnapshot(collection, (snapshot) => {
      if (hierarchy.isConstructed) {                 // ignore snapshots caused by data written to server
        snapshot.docChanges().forEach((change) => {   // convert and remember
          this.handleChange(change, dataKind);
        });
      }
    }
  )};

  async handleChange(change: DocumentChange, dataKind: DataKind) {
    const doc = change.doc;
    const data = doc.data();
    if (DBFirebase.isValidOfKind(dataKind, data)) {
      const id = doc.id;

      ////////////////////
      //   data kinds   //
      //  change types  //
      ////////////////////

      try {
        if (dataKind == DataKind.relationships) {
          const remote = new RemoteRelationship(data);
          if (remote) {
            const relationship = hierarchy.knownR_byID[id];
            const original = !relationship ? null : copyObject(relationship);
            switch (change.type) {
              case 'added':
                if (!relationship) {
                  await hierarchy.rememberRelationship_remoteCreateNoDuplicate(id, remote.predicate.id, remote.from.id, remote.to.id, remote.order, CreationFlag.isFromRemote);
                  hierarchy.relationships_refreshKnowns_runtimeRenormalize();
                }
                break;
              default:
                if (relationship) {
                  switch (change.type) {
                    case 'modified':
                      if (relationship.wasModifiedWithinMS(100) || this.isEqualTo(relationship, remote)) {
                        return;   // already known and contains no new data, or needs to be 'tamed'
                      }
                      this.relationship_extractRemote(relationship, remote);
                      hierarchy.relationships_refreshKnowns_runtimeRenormalize();
                      relationship.thingTo_updateOrder(false);
                      break;
                    case 'removed': 
                      delete hierarchy.knownR_byID[id];
                      hierarchy.relationships_refreshKnowns_runtimeRenormalize();
                      break;
                  }
                }
                break;
            }
            if (relationship) {
              hierarchy.relationships_accomodateRelocations(original, relationship);
              signal(Signals.childrenOf, relationship.idFrom);
            }
          }
        } else if (dataKind == DataKind.things) {
          const remote = new RemoteThing(data);
          const thing = hierarchy.getThing_forID(id);
          if (remote) {
            switch (change.type) {
              case 'added':
                if (!thing) {
                  this.things.push(hierarchy.rememberThing_runtimeCreate(id, remote.title, remote.color, remote.trait, -1, true));
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
                      delete hierarchy.knownT_byID[id];
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

  ////////////////////////////
  //         THING          //
  ////////////////////////////

  async thing_remoteCreate(thing: Thing) {
    const collection = this.thingsCollection;
    if (collection) {
      const remoteThing = new RemoteThing(thing);
      const jsThing = { ...remoteThing };
      try {
        const ref = await addDoc(collection, jsThing)
        thing.isRemotelyStored = true;
        thing.id = ref.id;      // so relationship will be correct
      } catch (error) {
        this.reportError(error);
      }
    }
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

  ///////////////////////////////////
  //         RELATIONSHIP          //
  ///////////////////////////////////

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

  async relationship_remoteWrite(relationship: Relationship) {
    if (!relationship.awaitingCreation) {
      if (relationship.isRemotelyStored) {
        await this.relationship_remoteUpdate(relationship);
      } else {
        await this.relationship_remoteCreate(relationship);
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
    const order = remote.order - constants.orderIncrement;
    relationship.idTo = remote.to.id;
    relationship.order = order;
    relationship.idFrom = remote.from.id;
    relationship.idPredicate = remote.predicate.id;
    // relationship.log('extract');
  }

  /////////////////////////////////
  //         VALIDATION          //
  /////////////////////////////////

  static isValidOfKind(dataKind: DataKind, data: DocumentData) {
    switch (dataKind) {
      case DataKind.things:     
        const thing = data as Thing;   
        if (thing.title && thing.color && thing.trait) {
          return true;
        }
        break;
      case DataKind.predicates:
        if (data.kind) {
          return true;
        }
        break;
      case DataKind.relationships:
        const relationship = data as RemoteRelationship;
        if (relationship.predicate && relationship.from && relationship.to) {
          return true;
        }
        break;
    }
    return false;
  }

  async rememberValidatedDocument(dataKind: DataKind, id: string, data: DocumentData) {
    if (DBFirebase.isValidOfKind(dataKind, data)) {
      switch (dataKind) {
        case DataKind.things:        this.things.push(hierarchy.rememberThing_runtimeCreate(id, data.title, data.color, data.trait, -1, true)); break;
        case DataKind.predicates:    hierarchy.rememberPredicate_runtimeCreate(id, data.kind); break;
        case DataKind.relationships: await hierarchy.rememberRelationship_remoteCreateNoDuplicate(id, data.predicate.id, data.from.id, data.to.id, data.order, CreationFlag.isFromRemote); break;
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
