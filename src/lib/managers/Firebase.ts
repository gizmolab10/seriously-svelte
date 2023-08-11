import { onSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';
import { getFirestore, collection, getDocs } from 'firebase/firestore/lite';
import { Thing, hierarchy, firebaseDocuments } from "../common/GlobalImports";
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
// import Cloudable from './Cloudable';

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

  // documentSnapshotsByCollectionName: { [id: string]: Array<QueryDocumentSnapshot> } = {};
  app = initializeApp(this.firebaseConfig);
  analytics = getAnalytics(this.app);
  db = getFirestore(this.app);

  fetchAll = async (onCompletion: () => any) => {
    await firebase.fetchDocuments('Things');
    hierarchy.hierarchy_construct();
    onCompletion();
  }

  fetchDocuments = async (collectionName: string) => {
    try {
      const itemsCollection = collection(this.db, collectionName);
      onSnapshot(itemsCollection, snapshot => {
        const updatedItems = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        firebaseDocuments.set(updatedItems);
      });
      const querySnapshot = await getDocs(itemsCollection);
      const documentSnapshots = querySnapshot.docs;
      if (documentSnapshots != undefined) {
        await this.remember(documentSnapshots, collectionName);
      }
      return documentSnapshots;
    } catch (error) {
      alert(error);
    }
  }

  // saveDocument = async (cloudable: Cloudable, collectionName: string) => {
  //   const id = cloudable.id;
  //   const documentSnapshots = this.documentSnapshotsByCollectionName[collectionName];
  //   documentSnapshots.forEach((documentSnapshot) => {
  //     if (documentSnapshot.id == id) {
  //       const ref = hierarchy.thing_forID(id);
  //       documentSnapshot.set(ref as DocumentData);

  //     }
  //   })
  // }

  async remember(documentSnapshots: QueryDocumentSnapshot[], collectionName: string) {
    // this.documentSnapshotsByCollectionName[collectionName] = documentSnapshots;
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