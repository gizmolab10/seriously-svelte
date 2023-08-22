import { doc, addDoc, setDoc, getDoc, getDocs, collection, onSnapshot, getFirestore, QuerySnapshot, DocumentData, DocumentReference, CollectionReference } from 'firebase/firestore';
import { get, Thing, signal, Signals, hierarchy, DataKinds, Predicate, Relationship } from '../common/GlobalImports';
import { getAnalytics } from "firebase/analytics";
import { bulkName } from '../managers/State';
import { initializeApp } from "firebase/app";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// For Firebase JS SDK v7.20.0 and later, measurementId is optional

class Firebase {
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

  setup = async (onCompletion: () => any) => {
    await firebase.fetchDocumentsIn(DataKinds.things);
    await firebase.fetchDocumentsIn(DataKinds.predicates, true);
    await firebase.fetchDocumentsIn(DataKinds.relationships); // fetch these LAST, they depend on fetching all of the above
    onCompletion();
  }
    
  fetchDocumentsIn = async (dataKind: string, noBulk: boolean = false) => {
    try {
      const documentsCollection = noBulk ? collection(this.db, dataKind) : collection(this.db, this.collectionName, get(bulkName), dataKind);

      ////////////////
      // data kinds //
      ////////////////

      if (dataKind == DataKinds.things) {
        this.thingsCollection = documentsCollection;
      } else if (dataKind == DataKinds.predicates) {
        this.predicatesCollection = documentsCollection;
      } else if (dataKind == DataKinds.relationships) {
        this.relationshipsCollection = documentsCollection;
      }

      const querySnapshot = await getDocs(documentsCollection);
      this.register(dataKind, querySnapshot);
      this.handleRemoteChanges(dataKind, documentsCollection);
    } catch (error) {
      console.log(error);
    }
  }

  register(dataKind: string, documentSnapshots: QuerySnapshot) {
    const queryDocumentSnapshots = documentSnapshots.docs;
    for (const documentSnapshot of queryDocumentSnapshots) {
      const data = documentSnapshot.data();
      const id = documentSnapshot.id;

      ////////////////
      // data kinds //
      ////////////////

      if (dataKind == DataKinds.things) {
        hierarchy.thing_new(id, data.title, data.color, data.trait, data.order);
      } else if (dataKind == DataKinds.predicates) {
        hierarchy.predicate_new(id, data.kind);
      } else if (dataKind == DataKinds.relationships) {
        hierarchy.relationship_uniqueNew(id, data.predicate.id, data.from.id, data.to.id, data.order);
      }
    }
  }

  handleRemoteChanges(dataKind: string, collection: CollectionReference) {
    onSnapshot(collection, (snapshot) => {
      snapshot.docChanges().forEach((change) => {       // convert and register
        const doc = change.doc;
        const data = doc.data();
        const idChange = doc.id;

        ////////////////////
        //   data kinds   //
        //  change types  //
        ////////////////////

        if (dataKind == DataKinds.relationships) {
          const relationship = hierarchy.relationshipByID[idChange];
          const remote = new RemoteRelationship(data);
          if (relationship && remote) {
            const parentID = relationship?.idFrom;
            if (change.type === 'added') {
              hierarchy.relationship_uniqueNew(idChange, remote.predicate.id, remote.from.id, remote.to.id, remote.order);
            } else if (change.type === 'modified') {
              this.copyRelationship(relationship, remote);
            } else if (change.type === 'removed') {
              delete hierarchy.relationshipByID[idChange];
            }
            hierarchy.relationships_refreshLookups();
            hierarchy.order_normalizeAllRecursive();
            signal(Signals.childrenOf, parentID);
          }
        } else if (dataKind == DataKinds.things) {
          const thing = hierarchy.thing_forID(idChange);
          if (thing) {
            const remote = new RemoteThing(data);
            const parentID = thing?.firstParent?.id;
            if (change.type === 'added') {

            } else if (change.type === 'modified') {
              if (thing) {
                this.copyThing(thing, remote);
              }
            } else if (change.type === 'removed') {

            }
            signal(Signals.childrenOf, parentID);
          }
        }
      });
    }
  )};

  handleAllNeeds = async () => {
    await this.relationships_handleNeeds();    // do this first, in case a relationship points to a thing that needs delete
    await this.things_handleNeeds();
  }

  async things_handleNeeds() {
    let collection = this.thingsCollection;
    if (collection != null) {
      for (const thing of hierarchy.needyThings) {
        const remoteThing = new RemoteThing(thing);

        ////////////////
        // need kinds //
        ////////////////

        if (thing.needsDelete()) {
          // await this.thing_delete(thing)
        } else if (thing.needsCreate()) {
          // await this.thing_create(thing)
        } else if (thing.needsUpdate()) {
            const ref = doc(collection, thing.id) as DocumentReference<Thing>;
            const jsThing = { ...remoteThing };
            await setDoc(ref, jsThing);
        }
      }
    }
  }

  async relationships_handleNeeds() {
    let collection = this.relationshipsCollection;
    if (collection != null) {
      for (const relationship of hierarchy.needyRelationships) {
        try {
          // console.log(relationship.description);
          const remoteRelationship = new RemoteRelationship(relationship);
          const jsRelationship = { ...remoteRelationship };

          ////////////////
          // need kinds //
          ////////////////

          if (relationship.needsCreate()) {
            await addDoc(collection, jsRelationship); // works!
          } else if (relationship.needsUpdate()) {
            const ref = doc(collection, relationship.id) as DocumentReference<RemoteRelationship>;
            await setDoc(ref, jsRelationship);
          }
        } catch (error) {
          console.log(error);
        }
      }
    }
  }

  copyThing = (thing: Thing, from: RemoteThing) => {
    thing.title = from.title;
    thing.trait = from.trait;
    thing.color = from.color;
  }

  copyRelationship = (relationship: Relationship, from: RemoteRelationship) => {
    const order = from.order - 0.1;
    relationship.idTo = from.to.id;
    relationship.order = order;
    relationship.idFrom = from.from.id;
    relationship.idPredicate = from.predicate.id;
    hierarchy.thing_forID(relationship.idTo)?.setOrderTo(order);
  }
}

export const firebase = new Firebase();

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
      if (data instanceof Relationship) {
        this.to = doc(things, data.idTo) as DocumentReference<Thing>;
        this.from = doc(things, data.idFrom) as DocumentReference<Thing>;
        this.predicate = doc(predicates, data.idPredicate) as DocumentReference<Predicate>;
      } else {
        const remote = data as RemoteRelationship;
        this.to = doc(things, remote.to.id) as DocumentReference<Thing>;
        this.from = doc(things, remote.from.id) as DocumentReference<Thing>;
        this.predicate = doc(predicates, remote.predicate.id) as DocumentReference<Predicate>;
      }
    }
  }
}
