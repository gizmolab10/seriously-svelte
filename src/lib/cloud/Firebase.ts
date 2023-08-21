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
      this.handleChangesTo(dataKind, documentsCollection);

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
      this.remember(dataKind, querySnapshot);
    } catch (error) {
      console.log(error);
    }
  }

  remember(dataKind: string, documentSnapshots: QuerySnapshot) {
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

  handleChangesTo(dataKind: string, collection: CollectionReference) {
    onSnapshot(collection, (snapshot) => {
      snapshot.docChanges().forEach((remoteChange) => {       // convert and remember
        const doc = remoteChange.doc;
        const data = doc.data();
        const idChange = doc.id;

        ////////////////////
        //   data kinds   //
        //  change types  //
        ////////////////////

        if (dataKind == DataKinds.relationships) {
          if (remoteChange.type === 'added') {
            hierarchy.relationship_uniqueNew(idChange, data.predicate.id, data.from.id, data.to.id, data.order);
          } else if (remoteChange.type === 'modified') {
            
          } else if (remoteChange.type === 'removed') {

          }
        } else if (dataKind == DataKinds.things) {
          if (remoteChange.type === 'added') {

          } else if (remoteChange.type === 'modified') {
            const thing = hierarchy.thing_forID(idChange);
            if (thing) {
              const order = thing.order;
              const remoteThing = data as Thing;
              const parentID = thing.firstParent.id;
              thing.copyFrom(remoteThing);
              thing.setOrderTo(order);
              signal(Signals.childrenOf, parentID);
            }
          } else if (remoteChange.type === 'removed') {

          }
        }
      });
    }
  )};

  handleAllNeedy = async () => {
    await this.relationships_handleNeeds();    // do this first, in case a relationship points to a thing that needs delete
    await this.things_handleNeeds();
  }

  async things_handleNeeds() {
    let collection = this.thingsCollection;
    if (collection != null) {
      for (const thing of hierarchy.things) {
        if (thing.needs != 0) {
            const jsThing = { ...thing };

          ////////////////
          // need kinds //
          ////////////////

          if (thing.needsDelete()) {
            // await this.thing_delete(thing)
          } else if (thing.needsCreate()) {
            // await this.thing_create(thing)
          } else if (thing.needsUpdate()) {
              const ref = doc(collection, thing.id) as DocumentReference<Thing>;
              setDoc(ref, jsThing);
          }
        }
      }
    }
  }

  async relationships_handleNeeds() {
    let collection = this.relationshipsCollection;
    if (collection != null) {
      for (const relationship of hierarchy.relationships) {
        try {
          if (relationship.hasNeeds) {
            // console.log(relationship.description);
            const firebaseRelationship = new FirebaseRelationship(relationship);
            const jsRelationship = { ...firebaseRelationship };

            ////////////////
            // need kinds //
            ////////////////

            if (relationship.needsCreate()) {
              await addDoc(collection, jsRelationship); // works!
            } else if (relationship.needsUpdate()) {
              const ref = doc(collection, relationship.id) as DocumentReference<FirebaseRelationship>;
              setDoc(ref, jsRelationship);
            }
          }
        } catch (error) {
          console.log(error);
        }
      }
    }
  }
}

export const firebase = new Firebase();

export interface FirebaseThing {
  title: string;
  color: string;
  trait: string;
}

export interface FirebaseRelationship {
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