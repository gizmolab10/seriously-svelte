import { getDocs, collection, onSnapshot, getFirestore, QueryDocumentSnapshot } from 'firebase/firestore';
import { get, Thing, hierarchy, DataKinds } from '../common/GlobalImports';
import { privateBulk, thingsStore, relationshipsStore } from '../managers/State';
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
// import Cloudable from './Cloudable'; // comment this out when writables work

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
    hierarchy.hierarchy_construct();
    onCompletion();
  }
    
  fetchDocumentsIn = async (dataKind: string, noBulk: boolean = false) => {
    try {
      const areThings = dataKind == DataKinds.things;
      const documentsCollection = noBulk ? collection(this.db, this.collectionName) : collection(this.db, this.collectionName, get(privateBulk), dataKind);
      onSnapshot(documentsCollection, snapshot => {
        const documentSnapshots = snapshot.docs
        const documentData = documentSnapshots.map(doc => ({ ...doc.data(), id: doc.id }));
        if (areThings) {
          thingsStore.set(documentData);
          this.rememberThings(documentSnapshots);
        } else if (dataKind == DataKinds.relationships) {
          relationshipsStore.set(documentData);
        } else if (dataKind == DataKinds.predicates) {
          // store in hierarchy
        }
      });
      const querySnapshot = await getDocs(documentsCollection);
      const documentSnapshots = querySnapshot.docs;
      if (documentSnapshots != undefined && areThings) {
        this.rememberThings(documentSnapshots);
      }
    } catch (error) {
      console.log(error);
    }
  }

  rememberThings(documentSnapshots: QueryDocumentSnapshot[]) {
    for (const documentSnapshot of documentSnapshots) {
      const data = documentSnapshot.data();
      const thing = data as Thing;
      const id = documentSnapshot.id;
      thing.id = id;
      hierarchy.thingsByID[id] = thing;
      if (thing.trait == '!') {
        hierarchy.root = thing;
      }
    }
  }

}

export const firebase = new Firebase();
