/* dbUtils.js
 * desc: Utilities for interacting with MongoDB transactional data store
 *       hosted on mlab.com.
 */

// npm install mongodb --save-dev
import { MongoClient } from 'mongodb';

/* getMostRecentETHData()
 * desc: Reads ETH data from MongoDB
 * return: json block of data for ETH daily transaction activity
 */
 async function getMostRecentETHData() {
  var url = process.env.URLEth;
  if (url==undefined || url==="") {
    console.log("MongoDB url not set in the environment.");
    console.log("Try running source SetMongoEnv.sh prior to running this.");
  }
  else {
    var client;
    var db;
    try {
      client = await MongoClient.connect(url, { useNewUrlParser: true });
      db = client.db("ethereum");
      return await db.collection("eth_transactions").find({}).toArray();
    } finally {
      client.close();
    }
  }
}

/* writeResultsToMongo()
 * desc: Writes results into MongoDB on the cloud
 * param: dataToWrite - the json block to write to MongoDB.
 *
 */
async function writeResultsToMongo(dataToWrite, targetDB, targetCollection) {

  var url = process.env.URLCrypto;
  if (url==undefined || url==="") {
    console.log("MongoDB url not set in the environment.");
    console.log("Try running source SetMongoEnv.sh prior to running this.");
  }
  else {
    var client;
    var db;
    try {
      console.log("Connect to MongoDB");
      client = await MongoClient.connect(url, { useNewUrlParser: true });
      db = client.db(targetDB);
      console.log("Writing results to", targetCollection);
      await db.collection(targetCollection).insertOne(dataToWrite);
    }
    catch(err) {
      console.log("Error writing to DB:", err);
    }
    finally {
      if(client!==undefined)
        client.close();
    }
  }
}

/* writeResultsToMongoSync()
 * desc: Writes results into MongoDB on the cloud.
 * param: dataToWrite - the json block to write to MongoDB.
 * return: A promise that the results will be written.
 *
 */
async function writeResultsToMongoSync(dataToWrite, targetDB, targetCollection) {

  return new Promise(async function (resolve, reject) {
  var url = process.env.URLCrypto;
  if (url==undefined || url==="") {
    console.log("MongoDB url not set in the environment.");
    console.log("Try running source SetMongoEnv.sh prior to running this.");
    reject(new Error("MongoDB url not set in the environment."));
  }
  else {
    var client;
    var db;
    try {
      console.log("Connect to MongoDB");
      client = await MongoClient.connect(url, { useNewUrlParser: true });
      db = client.db(targetDB);
      console.log("Writing results to", targetCollection);
      await db.collection(targetCollection).insertOne(dataToWrite);
      console.log("Write to " + targetCollection + " success.");
      resolve("Write to " + targetCollection + " success.");
    }
    catch(err) {
      console.log("Error writing to DB:", err.message);
      reject(new Error("Error writing to DB."));
    }
    finally {
        if(client!==undefined)
          client.close();
    }
  }
  });
}

/* writeResultsToMongo()
 * desc: Writes results from the google BigQuery into MongoDB on the cloud
 * param: dataToWrite - the json block to write to MongoDB.
 *
 */
async function removeCollectionFromMongo(targetDB, targetCollection) {

  var url = process.env.URLCrypto;
  if (url==undefined || url==="") {
    console.log("MongoDB url not set in the environment.");
    console.log("Try running source SetMongoEnv.sh prior to running this.");
  }
  else {
    var client;
    var db;
    try {
      console.log("Connect to MongoDB");
      client = await MongoClient.connect(url, { useNewUrlParser: true });
      db = client.db(targetDB);
      console.log("Deleting prior data in", targetCollection);
      await db.collection(targetCollection).remove();
    }
    catch(err) {
      console.log("Error writing to DB:", err);
    }
    finally {
        client.close();
    }
  }
}


export {writeResultsToMongo, getMostRecentETHData, removeCollectionFromMongo, writeResultsToMongoSync};
