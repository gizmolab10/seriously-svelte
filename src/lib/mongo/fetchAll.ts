import { MongoClient } from "mongodb";

const url = "mongodb+srv://sand:cat@seriouscluster.mvsmxs4.mongodb.net";
const collectionName = "seriously";
const dbName = "seriously";

async function fetchRecords() {
  const client = new MongoClient(url);

  try {
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    var records = await collection.find().toArray();

    return records;

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
};

fetchRecords()
  .then((records) => {
    console.log(JSON.stringify(records, null, 2));
  });
