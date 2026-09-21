import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';

const client = new MongoClient(MONGO_URI);

let isConnected = false;

export async function connectDB() {
  if (!isConnected) {
    await client.connect();
    isConnected = true;
    console.log('Connected to MongoDB at', MONGO_URI);
  }
  return client;
}

export function getDupDb() {
  return client.db('acdc_dup_br-int');
}

export function getRteDb() {
  return client.db('acdc_rte_br-int');
}

export { client };
