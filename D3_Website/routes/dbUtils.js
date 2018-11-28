/* dbUtils.js
 * desc: Utilities for interacting with MongoDB transactional data store
 *       hosted on mlab.com.
 */

// npm install mongodb --save-dev
var MongoClient = require("mongodb");

/* getTransactionsAndPrices()
 * desc: Reads transaction ans price data from MongoDB
 * return: json block of data for all cryptocurrencies
 */
 async function getTransactionsAndPrices() {
  var url = "mongodb://" + process.env.mongoU +":"+ process.env.mongoP + "@" + process.env.host + "/ethereum";
  var client;
  var db;
  try {
    client = await MongoClient.connect(url, { useNewUrlParser: true });
    db = client.db("ethereum");
    return await db.collection("marketdata.transaction_prices").find({}).toArray();
  } finally {
    client.close();
  }
}

/* getMostRecentETHData()
 * desc: Reads ETH data from MongoDB
 * return: json block of data for ETH daily transaction activity
 */
 async function getMostRecentETHData() {
   if (process.env.mongoU==undefined || process.env.mongoU==="") {
    console.log("Environment NOT setup to connect to MongoDB.");
    console.log("Please source SetMongoEnv.sh when launching this application.");
   }
   else {
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

module.exports.getMostRecentETHData = getMostRecentETHData;
module.exports.writeResultsToMongo = writeResultsToMongo;
module.exports.getTransactionsAndPrices = getTransactionsAndPrices;
