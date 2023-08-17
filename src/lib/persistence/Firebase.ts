import { getDocs, collection, onSnapshot, getFirestore, QuerySnapshot, DocumentData, DocumentReference, QueryDocumentSnapshot } from 'firebase/firestore';
import { get, Thing, hierarchy, DataKinds, Predicate, Relationship } from '../common/GlobalImports';
import { bulkName, thingsStore, relationshipsStore } from '../managers/State';
import { getAnalytics } from "firebase/analytics";
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

  fetchAll = async (onCompletion: () => any) => {
    await firebase.fetchDocumentsIn(DataKinds.things);
    await firebase.fetchDocumentsIn(DataKinds.predicates, true);
    await firebase.fetchDocumentsIn(DataKinds.relationships); // fetch these LAST, they depend on fetching all of the above
    onCompletion();
  }
    
  fetchDocumentsIn = async (dataKind: string, noBulk: boolean = false) => {
    try {
      const documentsCollection = noBulk ? collection(this.db, dataKind) : collection(this.db, this.collectionName, get(bulkName), dataKind);
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
    const queryDocumentSnapshot = documentSnapshots.docs;
    const documentData = queryDocumentSnapshot.map(doc => ({ ...doc.data(), id: doc.id }));
    if (dataKind == DataKinds.things) {
      thingsStore.set(documentData);
    } else if (dataKind == DataKinds.relationships) {
      relationshipsStore.set(documentData);
    }
    for (const documentSnapshot of queryDocumentSnapshot) {
      const data = documentSnapshot.data();
      const id = documentSnapshot.id;
      if (dataKind == DataKinds.things) {
        const thing = new Thing(id, data.title, data.color, data.trait, data.order);
        hierarchy.thing_remember(thing);
      } else if (dataKind == DataKinds.predicates) {
        const predicate = new Predicate(id, data.kind);
        hierarchy.predicate_remember(predicate);
      } else if (dataKind == DataKinds.relationships) {
        hierarchy.relationship_new(id, data.predicate.id, data.from.id, data.to.id, data.order);
      }
    }
  }

}

export const firebase = new Firebase();
