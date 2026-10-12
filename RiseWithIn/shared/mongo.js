import { MongoClient } from 'mongodb';

let client;
export const getMongoDb = async () => {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL || 'mongodb://localhost:27017');
    await client.connect();
  }
  return client.db(process.env.MONGO_DB || 'risewithin');
};
