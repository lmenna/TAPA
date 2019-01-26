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

/* updateResultsInMongo()
 * desc: Updates an existing record in the database.  If record doesn't exist it is created.
 * param: dataToWrite - the json block to write to MongoDB.
 *
 */
async function updateResultsInMongo(key, dataToWrite, targetDB, targetCollection) {

  var url = process.env.URLCrypto;
  if (url==undefined || url==="") {
    console.log("MongoDB url not set in the environment.");
    console.log("Try running source SetMongoEnv.sh prior to running this.");
  }
  else {
    var client;
    var db;
    try {
      client = await MongoClient.connect(url, { useNewUrlParser: true });
      db = client.db(targetDB);
      await db.collection(targetCollection).updateOne(key, {$set: dataToWrite}, {upsert:true, w: 1});
    }
    catch(err) {
      console.log("Error calling updateOne on DB:", err);
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
      return(await db.collection(targetCollection).insertOne(dataToWrite));
    }
    catch(err) {
      console.log("Error calling insertOne on the DB:", err.message);
      reject(new Error("Error writing to DB."));
    }
    finally {
        if(client!==undefined)
          client.close();
    }
  }
  });
}

/* removeCollectionFromMongo()
 * desc: Removes an entire collection from the database.
 * param: targetCollection - the collection to remove.
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


/* oneTimeUpdate()
 * desc: Reads a collection in and adds a timeStamp to each record.
 * param: targetCollection - the collection to remove.
 *
 */
async function oneTimeUpdate(targetDB, targetCollection) {

  var url = process.env.URLCrypto;
  if (url==undefined || url==="") {
    console.log("MongoDB url not set in the environment.");
    console.log("Try running source SetMongoEnv.sh prior to running this.");
  }
  else {
    var client;
    var db;
    try {
      client = await MongoClient.connect(url, { useNewUrlParser: true });
      db = client.db(targetDB);
      const sourceData = await db.collection(targetCollection).find({}).toArray();
      const modifiedData = sourceData.map(element => {
        let tsString = element.timeStamp;
        let ts = new Date(element.timeStamp);
        let tsInteger = ts.getTime()/1000;
        console.log(tsString, " ", ts, " ", tsInteger);
        element.time = tsInteger;
        return(element);
      });
      modifiedData.map(async element => {
        const key = {
          key: element.key
        };
        console.log("Updating record:", element);
        await db.collection(targetCollection).updateOne(key, {$set: element});
      });
    }
    catch(err) {
      console.log("Error during oneTimeUpdate:", err);
    } 
    finally {
      client.close();
    }
  }
} 

async function getEntireCollection(targetDB, targetCollection, groupBy) {
  var url = process.env.URLCrypto;
  if (url==undefined || url==="") {
    console.log("MongoDB url not set in the environment.");
    console.log("Try running source SetMongoEnv.sh prior to running this.");
  }
  else {
    var client;
    var db;
    try {
      client = await MongoClient.connect(url, { useNewUrlParser: true });
      db = client.db(targetDB);
      var mysort = { time: 1 };
      let dbResults = {};
      if (groupBy) {
        dbResults = await db.collection(targetCollection).aggregate(groupBy).toArray();
      }
      else {
        dbResults = await db.collection(targetCollection).find({}).sort(mysort).toArray();
      }
      return(dbResults);
    }
    catch(err) {
      console.log("Error during getEntireCollection:", err);
    } 
    finally {
      client.close();
    }
  } 
} 

export {updateResultsInMongo, writeResultsToMongo, getMostRecentETHData, 
  removeCollectionFromMongo, writeResultsToMongoSync, oneTimeUpdate,
  getEntireCollection};
