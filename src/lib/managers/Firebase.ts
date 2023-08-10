import { getFirestore, collection, getDocs, QueryDocumentSnapshot } from 'firebase/firestore';
import { Thing, hierarchy } from "../common/GlobalImports";
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// For Firebase JS SDK v7.20.0 and later, measurementId is optional

class Firebase {
  firebaseConfig = {
    apiKey: "AIzaSyAFy4H3Ej5zfI46fvCJpBfUxmyQco-dx9U",
    authDomain: "seriously-4536d.firebaseapp.com",
    projectId: "seriously-4536d",
    storageBucket: "seriously-4536d.appspot.com",
    messagingSenderId: "224721814373",
    appId: "1:224721814373:web:0c60f394c056ef3decd78c",
    measurementId: "G-9PY9LVK813"
  };

  app = initializeApp(this.firebaseConfig);
  analytics = getAnalytics(this.app);
  db = getFirestore(this.app);

  fetchDocuments = async (name: string) => {
    try {
      const itemsCollection = collection(this.db, name);
      const snapshot = await getDocs(itemsCollection);
      return snapshot.docs;
    } catch (error) {
      alert(error);
    }
  }

  fetchAll = async () => {
    const documents = await firebase.fetchDocuments('Things');
    if (documents != undefined) {
      await this.remember(documents);
      hierarchy.hierarchy_construct();
    }
  }

  async remember(snapshots: QueryDocumentSnapshot[]) {
    for (const snapshot of snapshots) {
      const data = snapshot.data();
      const id = snapshot.id;
      const thing = data as Thing;
      hierarchy.thingsByID[id] = thing;
    }
  }

}

export const firebase = new Firebase();
