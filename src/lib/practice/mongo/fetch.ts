import { MongoClient } from 'mongodb';

async function fetchRecord() {
  const uri = 'mongodb+srv://sand:cat@seriouscluster.mvsmxs4.mongodb.net';
  const dbName = 'ideas';
  const collectionName = 'seriously';

  try {
    const client = await MongoClient.connect(uri);
    const db = client.db(dbName);

    const record = await db.collection(collectionName).findOne({ recordName: 'root' });

    console.log(record);

    client.close();
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

fetchRecord();
