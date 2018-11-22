/* app.js
 * desc: Entry point to run data loaders for the TaPA application.
 *
 */

import "@babel/polyfill";
import {getQuery, getBigQueryData} from "./loaders/googleLoader";
// npm install mongodb --save-dev
import { MongoClient } from 'mongodb';


/* LoadGoogleDataIntoMongo()
 * desc: Gets data from BigQuery, formats the data and saves it to MongoDB
 *
 */
async function readGoogleData() {
  var results;
  try {
    results = await getBigQueryData();
  } catch(e) {
    console.log("Error:", e);
  }
  return(results);
}

/* writeResultsToMongo()
 * desc: Writes results from the google BigQuery into MongoDB on the cloud
 * param: results - the formatted big query results.
 *
 */
async function writeResultsToMongo(results) {

  var url = "mongodb://" + process.env.mongoU +":"+ process.env.mongoP + "@" + process.env.host + "/ethereum";
  console.log("Connect to Mongo");
  MongoClient.connect(url, function(err, db) {
    if(err) {
      console.log('Unable to connect to the DB server', err);
    }
    else {
      console.log('Connection established');
      try {
        var collection = db.collection('marketdata.eth_transactions');
        // await collection.insert({"name": "value"});
        db.collection("marketdata.eth_transactions").insertOne(results, function(err, res) {
          if (err)
            throw err;
          console.log("Result was inserted");
          db.close();
        });
      }
      catch(e) {
        console.log("Error:", e);
      }
    }
  });
}

/* readFromMongo()
 * desc: Reads previously stored results from MongoDB
 *
 */
function readFromMongo() {

  var url = "mongodb://" + process.env.mongoU +":"+ process.env.mongoP + "@" + process.env.host + "/ethereum";
  MongoClient.connect(url, function(err, db) {
    if(err) {
      console.log('Unable to connect to the DB server', err);
    }
    else {
      console.log('Connection established');
      var collection = db.collection("marketdata.eth_transactions");
      collection.find({}).toArray(function(err, result) {
        if (err) {
          console.log("Error retrieving data. ", err);
        }
        else if (result.length){
          result.map(item => {
            console.log(item);
          });
        } else {
          console.log("No documents found");
        }
        db.close();
      });
    }
  });
}

async function dataLoadAndSave() {
  var results = await readGoogleData();
  if (results === undefined) {
    console.log("No data was returned from BigQuery");
  }
  else if (results.data.length > 0) {
    console.log("Got good results. Write them to MongoDB");
    writeResultsToMongo(results);
  }
}

dataLoadAndSave();
