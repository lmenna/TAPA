import "@babel/polyfill";
import {getQuery, getBigQueryData} from "./loaders/googleLoader";
// npm install mongodb --save-dev
import { MongoClient } from 'mongodb';
// var mongodb = require('mongodb');


async function LoadGoogleDataIntoMongo() {
  var result;
  try {
    result = await getBigQueryData(query);
    if(result.data.length > 0) {
      console.log(result);
      readFromMongo();
    }
  } catch(e) {
    console.log("Error:", e);
  }
}

function readFromMongo() {

  console.log("Connecting to Mongo as USER:", process.env.mongoU);
  var url = "mongodb://" + process.env.mongoU +":"+ process.env.mongoP + "@" + process.env.host + "/ethereum";
  MongoClient.connect(url, function(err, db) {
    if(err) {
      console.log('Unable to connect to the DB server', err);
    }
    else {
      console.log('Connection established');
      var collection = db.collection('samplesite.students');
      collection.find({}).toArray(function(err, result) {
        if (err) {
          console.log("Error retrieving data. ", err);
        }
        else if (result.length){
          console.log("result:", result);
        } else {
          console.log("No documents found");
        }
        db.close();
      });
    }
  });
}

var query = getQuery();
console.log(getQuery());
LoadGoogleDataIntoMongo();
