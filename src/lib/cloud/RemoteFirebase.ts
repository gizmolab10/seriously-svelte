import { doc, addDoc, setDoc, deleteDoc, getDocs, collection, onSnapshot, getFirestore, QuerySnapshot, DocumentData, DocumentReference, CollectionReference } from 'firebase/firestore';
import { get, Thing, signal, Signals, hierarchy, DataKinds, Predicate, Relationship } from '../common/GlobalImports';
import { getAnalytics } from "firebase/analytics";
import { bulkName } from '../managers/State';
import { initializeApp } from "firebase/app";

// TODO: Add SDKs for Firebase products that you want to use
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

      switch (dataKind) {
        case DataKinds.things:        this.thingsCollection = documentsCollection; break;
        case DataKinds.predicates:    this.predicatesCollection = documentsCollection; break;
        case DataKinds.relationships: this.relationshipsCollection = documentsCollection; break;
      }

      const querySnapshot = await getDocs(documentsCollection);
      this.rememberAllOf(dataKind, querySnapshot);
      this.handleRemoteChanges(dataKind, documentsCollection);
    } catch (error) {
      this.reportError(error);
    }
  }

  static isValidOfKind(dataKind: string, data: DocumentData) {
    switch (dataKind) {
      case DataKinds.things:     
        const thing = data as Thing;   
        if (thing.title && thing.color && thing.trait) {
          return true;
        }
        break;
      case DataKinds.predicates:
        if (data.kind) {
          return true;
        }
        break;
      case DataKinds.relationships:
        const relationship = data as RemoteRelationship;
        if (relationship.predicate && relationship.from && relationship.to && relationship.order != null) {
          return true;
        }
        break;
    }
    return false;
  }

  rememberAllOf(dataKind: string,   querySnapshot: QuerySnapshot) {
    const documentSnapshots = querySnapshot.docs; // ERROR: for relationships, docs is an empty array
    for (const documentSnapshot of documentSnapshots) {
      const data = documentSnapshot.data();
      if (RemoteFirebase.isValidOfKind(dataKind, data)) {
        const id = documentSnapshot.id;

        ////////////////
        // data kinds //
        ////////////////

        switch (dataKind) {
          case DataKinds.things:        hierarchy.thing_new(id, data.title, data.color, data.trait, data.order); break;
          case DataKinds.predicates:    hierarchy.predicate_new(id, data.kind); break;
          case DataKinds.relationships: hierarchy.relationship_new(id, data.predicate.id, data.from.id, data.to.id, data.order); break;
        }
      }
    }
  }

  handleRemoteChanges(dataKind: string, collection: CollectionReference) {
    onSnapshot(collection, (snapshot) => {
      if (hierarchy.isConstructed) {
        snapshot.docChanges().forEach((change) => {       // convert and remember
          const doc = change.doc;
          const data = doc.data();
          if (RemoteFirebase.isValidOfKind(dataKind, data)) {
            const idChange = doc.id;

            ////////////////////
            //   data kinds   //
            //  change types  //
            ////////////////////

            if (dataKind == DataKinds.relationships) {
              const relationship = hierarchy.knownR_byID[idChange];
              const remote = new RemoteRelationship(data);
              if (relationship && remote) {
                const parentID = relationship?.idFrom;
                if (change.type === 'added') {
                  hierarchy.relationship_new_assureNotDuplicated(idChange, remote.predicate.id, remote.from.id, remote.to.id, remote.order);
                } else if (change.type === 'modified') {
                  this.copyRelationship(relationship, remote);
                } else if (change.type === 'removed') {
                  delete hierarchy.knownR_byID[idChange];
                }
                hierarchy.relationships_refreshKnowns();
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
          }
        });
      }
    }
  )};

  handleAllNeeds = async () => {

    // do relationships first, in case one points to a thing that needs delete,
    // so the relationship can be modified without confusing the server

    let collection = this.relationshipsCollection;
    if (collection != null) {
      for (const relationship of hierarchy.needyRelationships) {
        try {
          // console.log(relationship.description);

          /////////////////////
          //  relationships  //
          /////////////////////

          if (relationship.needsDelete()) {

          } else if (relationship.needsUpdate()) {
            await this.relationship_remoteUpdate(relationship)
          } else if (relationship.needsCreate()) {
            await this.relationship_remoteCreate(relationship);
          } 
          relationship.noNeeds();
        } catch (error) {
          this.reportError(error);
        }
      }
    }
    
    collection = this.thingsCollection;
    if (collection != null) {
      for (const thing of hierarchy.needyThings) {

        //////////////
        //  things  //
        //////////////

        if (thing.needsDelete()) {
        }
        if (thing.needsCreate()) {
          await this.thing_remoteCreate(thing)
        }
        if (thing.needsUpdate()) {
          await this.thing_remoteUpdate(thing)
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
      thing.id = ref.id;      // so relationship will be correct
      thing.needsCreate(false);
    }
  }

  async thing_remoteUpdate(thing: Thing) {
    const collection = this.thingsCollection;
    if (collection != null) {
      const ref = doc(collection, thing.id) as DocumentReference<Thing>;
      const remoteThing = new RemoteThing(thing);
      const jsThing = { ...remoteThing };
      await setDoc(ref, jsThing);
      thing.needsUpdate(false);
    }
  }

  thing_remoteDelete = async (thing: Thing) => {
    const collection = this.thingsCollection;
    if (collection != null) {
      const ref = doc(collection, thing.id) as DocumentReference<Thing>;
      await deleteDoc(ref);
      thing.needsUpdate(false);
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
      const ref = await addDoc(collection, jsRelationship); // works!
      relationship.id = ref.id;      // so relationship will be correct
      relationship.needsCreate(false);
    }
  }

  async relationship_remoteUpdate(relationship: Relationship) {
    const collection = this.relationshipsCollection;
    if (collection != null) {
      const ref = doc(collection, relationship.id) as DocumentReference<RemoteRelationship>;
      const remoteRelationship = new RemoteRelationship(relationship);
      const jsRelationship = { ...remoteRelationship };
      await setDoc(ref, jsRelationship);
      relationship.needsUpdate(false);
    }
  }

  async relationship_remoteDelete(relationship: Relationship) {
    const collection = this.relationshipsCollection;
    if (collection != null) {
      const ref = doc(collection, relationship.id) as DocumentReference<RemoteRelationship>;
      await deleteDoc(ref);
      relationship.needsUpdate(false);
    }
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
          if (RemoteFirebase.isValidOfKind(DataKinds.relationships, data)) {
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
