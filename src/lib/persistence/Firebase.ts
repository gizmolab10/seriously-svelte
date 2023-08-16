import { getDocs, collection, onSnapshot, getFirestore, QuerySnapshot, QueryDocumentSnapshot } from 'firebase/firestore';
import { bulkName, thingsArrived, thingsStore, relationshipsStore } from '../managers/State';
import { get, Thing, hierarchy, DataKinds, Predicate } from '../common/GlobalImports';
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
    await firebase.fetchDocumentsIn(DataKinds.predicates, true);
    // await firebase.fetchDocumentsIn(DataKinds.relationships);
    await firebase.fetchDocumentsIn(DataKinds.things);
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
      this.rememberThings(queryDocumentSnapshot);
    } else if (dataKind == DataKinds.relationships) {
      relationshipsStore.set(documentData);
    } else if (dataKind == DataKinds.predicates) {
      console.log('predicates', documentData);
      // store in hierarchy
    }    
  }
  
  rememberPredicates(documentSnapshots: QueryDocumentSnapshot[]) {
    for (const documentSnapshot of documentSnapshots) {
      const data = documentSnapshot.data();
      const predicate = data as Predicate;
      const id = documentSnapshot.id;
      predicate.id = id;
      hierarchy.predicate_remember(predicate);
    }
  }

  rememberThings(documentSnapshots: QueryDocumentSnapshot[]) {
    for (const documentSnapshot of documentSnapshots) {
      const data = documentSnapshot.data();
      const thing = data as Thing;
      const id = documentSnapshot.id;
      thing.id = id;
      hierarchy.thing_remember(thing);
    }
    hierarchy.hierarchy_construct();
    thingsArrived.set(true);
  }

}

export const firebase = new Firebase();
