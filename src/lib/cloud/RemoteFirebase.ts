import { doc, addDoc, setDoc, deleteDoc, getDocs, collection, onSnapshot, getFirestore, QuerySnapshot, DocumentData, DocumentChange, DocumentReference, CollectionReference } from 'firebase/firestore';
import { get, Thing, signal, Signals, hierarchy, DataKind, Predicate, Relationship, CreationFlag } from '../common/GlobalImports';
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { bulkName } from '../managers/State';

// https://firebase.google.com/docs/web/setup#available-libraries

// For Firebase JS SDK v7.20.0 and later, measurementId is optional

class RemoteFirebase {
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

  reportError(error: any) {
    console.log(error);
  }

  async setup() {
    await firebase.fetchDocumentsIn(DataKind.things);
    await firebase.fetchDocumentsIn(DataKind.predicates, true)
    await firebase.fetchDocumentsIn(DataKind.relationships);
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
    if (RemoteFirebase.isValidOfKind(dataKind, data)) {
      switch (dataKind) {
        case DataKind.things:        hierarchy.rememberThing_runtimeCreate(id, data.title, data.color, data.trait, -1, true); break;
        case DataKind.predicates:    hierarchy.rememberPredicate_runtimeCreate(id, data.kind); break;
        case DataKind.relationships: await hierarchy.rememberRelationship_remoteCreateNoDuplicate(id, data.predicate.id, data.from.id, data.to.id, data.order, CreationFlag.isFromRemote); break;
      }
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
    if (RemoteFirebase.isValidOfKind(dataKind, data)) {
      const id = doc.id;

      ////////////////////
      //   data kinds   //
      //  change types  //
      ////////////////////

      if (dataKind == DataKind.relationships) {
        const remote = new RemoteRelationship(data);
        if (remote) {
          const relationship = hierarchy.knownR_byID[id];
          switch (change.type) {
            case 'added':
              if (!relationship) {
                await hierarchy.rememberRelationship_remoteCreateNoDuplicate(id, remote.predicate.id, remote.from.id, remote.to.id, remote.order, CreationFlag.isFromRemote);
              }
              break;
            default:
              if (relationship) {
                switch (change.type) {
                  case 'modified':
                    if (relationship.wasJustModified || this.isEqualTo(relationship, remote)) {
                      return;   // already known and contains no new data
                    }
                    this.relationship_extractRemote(relationship, remote);
                    break;
                  case 'removed': 
                    delete hierarchy.knownR_byID[id];
                    break;
                }
                hierarchy.relationships_refreshKnowns();
                hierarchy.root?.normalizeOrder_recursive();
                signal(Signals.childrenOf, relationship.idFrom);
              }
              break;
          }
        }
      } else if (dataKind == DataKind.things) {
        const remote = new RemoteThing(data);
        const thing = hierarchy.getThing_forID(id);
        if (remote) {
          switch (change.type) {
            case 'added':
              if (!thing) {
                hierarchy.rememberThing_runtimeCreate(id, remote.title, remote.color, remote.trait, -1, true);
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
      const ref = await addDoc(collection, jsThing)
      thing.isRemotelyStored = true;
      thing.id = ref.id;      // so relationship will be correct
    }
  }

  async thing_remoteUpdate(thing: Thing) {
    const collection = this.thingsCollection;
    if (collection) {
      const ref = doc(collection, thing.id) as DocumentReference<Thing>;
      const remoteThing = new RemoteThing(thing);
      const jsThing = { ...remoteThing };
      await setDoc(ref, jsThing);
    }
  }

  async thing_remoteDelete(thing: Thing) {
    const collection = this.thingsCollection;
    if (collection) {
      const ref = doc(collection, thing.id) as DocumentReference<Thing>;
      await deleteDoc(ref);
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
      const ref = await addDoc(collection, jsRelationship); // works!
      relationship.awaitingCreation = false;
      relationship.isRemotelyStored = true;
      relationship.id = ref.id;
    }
  }

  async relationship_remoteUpdate(relationship: Relationship) {
    const collection = this.relationshipsCollection;
    if (collection) {
      const ref = doc(collection, relationship.id) as DocumentReference<RemoteRelationship>;
      const remoteRelationship = new RemoteRelationship(relationship);
      const jsRelationship = { ...remoteRelationship };
      await setDoc(ref, jsRelationship);
    }
  }

  async relationship_remoteDelete(relationship: Relationship) {
    const collection = this.relationshipsCollection;
    if (collection) {
      const ref = doc(collection, relationship.id) as DocumentReference<RemoteRelationship>;
      await deleteDoc(ref);
    }
  }

  isEqualTo(relationship: Relationship, remote: RemoteRelationship) {
    return relationship.idPredicate == remote.predicate.id &&
    relationship.idFrom == remote.from.id &&
    relationship.order == remote.order &&
    relationship.idTo == remote.to.id;
  }

  relationship_extractRemote(relationship: Relationship, remote: RemoteRelationship) {
    const order = remote.order - 0.1;
    relationship.idTo = remote.to.id;
    relationship.order = order;
    relationship.idFrom = remote.from.id;
    relationship.idPredicate = remote.predicate.id;
    hierarchy.getThing_forID(relationship.idTo)?.setOrderTo(order);
    relationship.log('extract');
  }

}

export const firebase = new RemoteFirebase();

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
    const things = firebase.thingsCollection;
    const predicates = firebase.predicatesCollection;
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
          if (RemoteFirebase.isValidOfKind(DataKind.relationships, data)) {
            this.to = doc(things, remote.to.id) as DocumentReference<Thing>;
            this.from = doc(things, remote.from.id) as DocumentReference<Thing>;
            this.predicate = doc(predicates, remote.predicate.id) as DocumentReference<Predicate>;
          }
        }
      } catch (error) {
        console.log(error);
      }
    }
  }

}
