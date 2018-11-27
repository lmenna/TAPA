/* dbUtils.js
 * desc: Utilities for interacting with MongoDB transactional data store
 *       hosted on mlab.com.
 */

import { MongoClient } from 'mongodb';

/* getMostRecentETHData()
 * desc: Reads ETH data from MongoDB
 * return: json block of data for ETH daily transaction activity
 */
 async function getMostRecentETHData() {
  var url = "mongodb://" + process.env.mongoU +":"+ process.env.mongoP + "@" + process.env.host + "/ethereum";
  var client;
  var db;
  try {
    client = await MongoClient.connect(url, { useNewUrlParser: true });
    db = client.db("ethereum");
    return await db.collection("marketdata.eth_transactions").find({}).toArray();
  } finally {
    client.close();
  }
}

/* writeResultsToMongo()
 * desc: Writes results from the google BigQuery into MongoDB on the cloud
 * param: dataToWrite - the json block to write to MongoDB.
 *
 */
async function writeResultsToMongo(dataToWrite, targetCollection) {

  var url = "mongodb://" + process.env.mongoU +":"+ process.env.mongoP + "@" + process.env.host + "/ethereum";
  var client;
  var db;
  try {
    client = await MongoClient.connect(url, { useNewUrlParser: true });
    db = client.db("ethereum");
    await db.collection(targetCollection).insertOne(dataToWrite);
  }
  catch(err) {
    console.log("Error writing to DB:", err);
  }
  finally {
      client.close();
  }
}

export {writeResultsToMongo, getMostRecentETHData};
