import { MongoClient } from "mongodb";

const url = "mongodb+srv://sand:cat@seriouscluster.mvsmxs4.mongodb.net";
const dbName = "seriously";

async function fetchRecord(): Promise<any> {
  const client = new MongoClient(url);

  try {
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection("seriously");
      const record = await collection.findOne({ recordName: "root" });

    return record;

  } catch (error) {
    console.error("Error:", error);
    throw error;
  } finally {
    await client.close();
  }
}

fetchRecord()
  .then((record) => {
    console.log("Fetched record:", record);
  })
  .catch((error) => {
    console.error("Error:", error);
  });
