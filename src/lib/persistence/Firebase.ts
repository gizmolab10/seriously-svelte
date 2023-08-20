import { doc, addDoc, getDocs, collection, onSnapshot, getFirestore, QuerySnapshot, DocumentData, DocumentReference, CollectionReference } from 'firebase/firestore';
import { get, hierarchy, DataKinds, Thing, Predicate, Needs, cloud, Relationship } from '../common/GlobalImports';
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
      if (dataKind == DataKinds.things) {
        this.thingsCollection = documentsCollection;
      } else if (dataKind == DataKinds.predicates) {
        this.predicatesCollection = documentsCollection;
      } else if (dataKind == DataKinds.relationships) {
        this.relationshipsCollection = documentsCollection;
      }
      const querySnapshot = await getDocs(documentsCollection);
      this.remember(dataKind, querySnapshot);
      onSnapshot(documentsCollection, querySnapshot => { 
        this.remember(dataKind, querySnapshot);
      });
    } catch (error) {
      console.log(error);
    }
  }

  remember(dataKind: string, documentSnapshots: QuerySnapshot) {
    const queryDocumentSnapshots = documentSnapshots.docs;
    const documentData = queryDocumentSnapshots.map(doc => ({ ...doc.data(), id: doc.id }));
    for (const documentSnapshot of queryDocumentSnapshots) {
      const data = documentSnapshot.data();
      const id = documentSnapshot.id;
      if (dataKind == DataKinds.things) {
        hierarchy.thing_new(id, data.title, data.color, data.trait, data.order);
      } else if (dataKind == DataKinds.predicates) {
        hierarchy.predicate_new(id, data.kind);
      } else if (dataKind == DataKinds.relationships) {
        hierarchy.relationship_uniqueNew(id, data.predicate.id, data.from.id, data.to.id, data.order);
      }
    }
  }

  updateAllNeedy = async () => {
    await this.relationships_updateNeedy(); // do this first, in case a relationship points to a thing that needs delete
    await this.things_updateNeedy();
  }

  async things_updateNeedy() {
    for (const thing of hierarchy.things) {
      if (thing.needs != 0) {
        if (thing.needsDelete()) {
          // await this.thing_delete(thing)
        } else if (thing.needsCreate()) {
          // await this.thing_create(thing)
        } else if (thing.needsSave()) {
          // await this.thing_save(thing)
        }
      }
    }
  }

  async relationships_updateNeedy() {
    let collection = this.relationshipsCollection;
    if (collection != null)
    for (const relationship of hierarchy.relationships) {
      if (relationship.needs != Needs.synced) {
        // console.log(relationship.description);
        if (relationship.needsCreate()) {
          const firebaseRelationship = new FirebaseRelationship(relationship);
          const jsRelationship = { ...firebaseRelationship };
          try {
            await addDoc(collection, jsRelationship);
          } catch (error) {
            console.log(error);
          }
        // } else {
        //   const targetDocIndex = store.findIndex(doc => doc.id === relationship.id);
        //   if (targetDocIndex == -1) {

        //   } else {
        //     const doc = store[targetDocIndex] as FirebaseRelationship;
        //     if (relationship.needsSave()) {
        //       doc.order = relationship.order;
        //       // await doc.to.update(hierarchy.thing_forID(relationship.idTo));
        //       // await doc.from.update(hierarchy.thing_forID(relationship.idFrom));
        //       // await doc.predicate.update(hierarchy.predicate_forID(relationship.idPredicate));
        //     } else if (relationship.needsDelete()) {

        //     }
        //   }
        }
      }
    }
  }
}

export const firebase = new Firebase();

export interface FirebaseRelationship {
  id: string;
  order: number;
  to: DocumentReference<Thing, DocumentData>;
  from: DocumentReference<Thing, DocumentData>;
  predicate: DocumentReference<Predicate, DocumentData>;
}

export class FirebaseRelationship {
  constructor(relationship: Relationship) {
    const things = firebase.thingsCollection;
    const predicates = firebase.predicatesCollection;
    if (things && predicates) {
      this.order = relationship.order;
      this.to = doc(things, relationship.idTo) as DocumentReference<Thing>;
      this.from = doc(things, relationship.idFrom) as DocumentReference<Thing>;
      this.predicate = doc(predicates, relationship.idPredicate) as DocumentReference<Predicate>;
    }
  }
}