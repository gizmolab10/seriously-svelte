import { doc, addDoc, setDoc, deleteDoc, getDocs, collection, onSnapshot, getFirestore, QuerySnapshot, DocumentData, DocumentReference, CollectionReference, DocumentChange } from 'firebase/firestore';
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

  setup(): Promise<void> {
    return new Promise(async (resolve) => {
      firebase.fetchDocumentsIn(DataKind.things).then(() => {
        firebase.fetchDocumentsIn(DataKind.predicates, true).then(() => {
          firebase.fetchDocumentsIn(DataKind.relationships).then(() => { // fetch these LAST, they depend on fetching all of the above
            resolve();
          })
        })
      })
    });
  }
    
  async fetchDocumentsIn(dataKind: DataKind, noBulk: boolean = false): Promise<void> {
    return new Promise(async (resolve) => {
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
        this.rememberAllOf(dataKind, querySnapshot);
        this.handleRemoteChanges(dataKind, documentsCollection);
      } catch (error) {
        this.reportError(error);
      }
      resolve();
    })
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
        if (relationship.predicate && relationship.from && relationship.to && relationship.order != null) {
          return true;
        }
        break;
    }
    return false;
  }

  rememberAllOf(dataKind: DataKind,   querySnapshot: QuerySnapshot) {
    const documentSnapshots = querySnapshot.docs; // ERROR: for relationships, docs is an empty array
    for (const documentSnapshot of documentSnapshots) {
      const data = documentSnapshot.data();
      if (RemoteFirebase.isValidOfKind(dataKind, data)) {
        const id = documentSnapshot.id;

        ////////////////
        // data kinds //
        ////////////////

        switch (dataKind) {
          case DataKind.things:        hierarchy.rememberThing_create(id, data.title, data.color, data.trait, -1, true); break;
          case DataKind.predicates:    hierarchy.rememberPredicate_create(id, data.kind); break;
          case DataKind.relationships: hierarchy.rememberRelationship_remoteCreate(id, data.predicate.id, data.from.id, data.to.id, data.order, CreationFlag.isFromRemote).then(); break;
        }
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
      const idChange = doc.id;

      ////////////////////
      //   data kinds   //
      //  change types  //
      ////////////////////
      if (dataKind == DataKind.relationships) {
        const relationship = hierarchy.knownR_byID[idChange];
        const remote = new RemoteRelationship(data);
        if (relationship && remote) {
          const parentID = relationship?.idFrom;
          if (change.type === 'added') {
            hierarchy.rememberRelationship_remoteCreateNoDuplicate(idChange, remote.predicate.id, remote.from.id, remote.to.id, remote.order, CreationFlag.isFromRemote).then();
          } else if (change.type === 'modified') {
            this.extractRemoteRelationship(relationship, remote);
          } else if (change.type === 'removed') {
            delete hierarchy.knownR_byID[idChange];
          }
          hierarchy.relationships_refreshKnowns();
          hierarchy.root?.normalizeOrder_recursive();
          signal(Signals.childrenOf, parentID);
        }
      } else if (dataKind == DataKind.things) {
        const thing = hierarchy.getThing_forID(idChange);
        const parentID = thing?.firstParent?.id;
        if (thing && parentID != undefined) {
          if (change.type === 'added') {
          } else if (change.type === 'modified') {
            const remote = new RemoteThing(data);
            this.copyThing(thing, remote);
          } else if (change.type === 'removed') {
            delete hierarchy.knownT_byID[idChange];
          }
          signal(Signals.childrenOf, parentID);
        }
      }
    }
  }

  ////////////////////////////
  //         THING          //
  ////////////////////////////

  async thing_remoteCreate(thing: Thing) {
    const collection = this.thingsCollection;
    if (collection != null) {
      const remoteThing = new RemoteThing(thing);
      const jsThing = { ...remoteThing };
      const ref = await addDoc(collection, jsThing)
      thing.isRemotelyStored = true;
      thing.id = ref.id;      // so relationship will be correct
    }
  }

  async thing_remoteUpdate(thing: Thing) {
    const collection = this.thingsCollection;
    if (collection != null) {
      const ref = doc(collection, thing.id) as DocumentReference<Thing>;
      const remoteThing = new RemoteThing(thing);
      const jsThing = { ...remoteThing };
      await setDoc(ref, jsThing);
    }
  }

  async thing_remoteDelete(thing: Thing) {
    const collection = this.thingsCollection;
    if (collection != null) {
      const ref = doc(collection, thing.id) as DocumentReference<Thing>;
      await deleteDoc(ref);
    }
  }

  copyThing = (thing: Thing, from: RemoteThing) => {
    thing.title = from.title;
    thing.trait = from.trait;
    thing.color = from.color;
  }

  ///////////////////////////////////
  //         RELATIONSHIP          //
  ///////////////////////////////////

  async relationship_remoteCreate(relationship: Relationship) {
    const collection = this.relationshipsCollection;
    if (collection != null) {
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
    if (collection != null) {
      const ref = doc(collection, relationship.id) as DocumentReference<RemoteRelationship>;
      const remoteRelationship = new RemoteRelationship(relationship);
      const jsRelationship = { ...remoteRelationship };
      await setDoc(ref, jsRelationship);
    }
  }

  async relationship_remoteDelete(relationship: Relationship) {
    const collection = this.relationshipsCollection;
    if (collection != null) {
      const ref = doc(collection, relationship.id) as DocumentReference<RemoteRelationship>;
      await deleteDoc(ref);
    }
  }

  extractRemoteRelationship = (relationship: Relationship, from: RemoteRelationship) => {
    const order = from.order - 0.1;
    relationship.idTo = from.to.id;
    relationship.order = order;
    relationship.idFrom = from.from.id;
    relationship.idPredicate = from.predicate.id;
    hierarchy.getThing_forID(relationship.idTo)?.setOrderTo(order);
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
