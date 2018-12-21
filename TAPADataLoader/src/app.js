/* app.js
 * desc: Entry point to run data loaders for the TaPA application.
 *
 */

import "@babel/polyfill";
import {getQuery, getBigQueryData} from "./loaders/googleLoader";
// npm install mongodb --save-dev
import { MongoClient } from 'mongodb';
import { removeCollectionFromMongo, writeResultsToMongo, writeResultsToMongoSync } from "./utils/dbUtils"
import { loadPricingData } from "./loaders/etherscanLoader";
import { loadCoinmetricsFile } from "./loaders/coinmetricsLoader";

// Data file where the coinmetrics data can be found.
const dataDir = "./data/";
const fileToProcess = dataDir + "all.zip";
// Crypocurrencies to process from the coinmetrics dataset.
const tickersToSelect = [
  "eth", "btc", "xem", "xmr", "xrp",
  "etc", "eos", "maid", "xlm", "lsk",
  "sp500", "dgb", "zec", "ltc",
  "dash", "bat"
];
// Fields to load from the coinmetrics data set.
const fieldToSelect = [
  "date",
  "txVolume(USD)",
  "adjustedTxVolume(USD)",
  "txCount",
  "price(USD)"
];

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


/* formatResults(results)
 * desc: Take the raw results from BigQuery and formats it for writting to MongoDB
 * param: results Raw data from BigQuery
 */
function formatResults(results) {

  // Get block with the most recent data.  Copy some of this info into the top of the object.
  results.MaxDaysFrom19700101 = results.data[0].IntDaysFrom19700101;
  results.MaxTimestamp = new Date(results.data[0].MaxTimestamp.value);
  results.MaxBlockNumber = results.data[0].MaxBlockNumber;
  console.log("MaxDaysFrom19700101:", results.MaxDaysFrom19700101);
  console.log("MaxTimestamp:", results.MaxTimestamp);
  console.log("MaxBlockNumber:", results.MaxBlockNumber);
}

//var csv is the CSV file with headers
function csvJSON(csv){

  var lines=csv.split("\n");
  var result = [];
  var headers=lines[0].split(",");
  for(var i=1;i<lines.length;i++){
      var obj = {};
      var currentline=lines[i].split(",");
      for(var j=0;j<headers.length;j++){
          obj[headers[j]] = currentline[j];
      }
      result.push(obj);
  }
  //return result; //JavaScript object
  return({"data" : result}); //JSON
}

function formatPricingData(pricingData) {

  var pricingJSON = csvJSON(pricingData.replace(/['"]+/g, '').replace(/['\r]+/g, ''));
  // Need and integer number of days from 19700101
  // CEILING(UNIX_MILLIS(blocks.timestamp)/(60*60*24))
  pricingJSON.data.map(item => {
    item.IntDaysFrom19700101 = item.UnixTimeStamp/(60*60*24);
  });
  return(pricingJSON);
}

async function dataLoadAndSave() {
  var results = await readGoogleData();
  if (results === undefined) {
    console.log("No data was returned from BigQuery");
  }
  else if (results.data.length > 0) {
    console.log("Got good results. Number of records:", results.data.length);
    formatResults(results);
    writeResultsToMongo(results, "ethereum", "marketdata.eth_transactions");
    var pricingData = await loadPricingData();
    var pricingJSON = formatPricingData(pricingData);
    console.log(pricingJSON);
    writeResultsToMongo(pricingJSON, "ethereum", "marketdata.eth_prices");
  }
  else {
    console.log("BigQuery worked but results.data had no rows.")
  }
}

async function processCoinmetrics() {

  await removeCollectionFromMongo("crypto", "marketdata.transaction_prices");
  tickersToSelect.map(async(item) => {
    var ticker = item;
    // var coinmetricsData = await loadCoinmetricsFile(fileToProcess, ticker, fieldToSelect);
    console.log("Processing coinmetrics file:", fileToProcess, " ticker:", ticker)
    let coinmetricsData = "";
    try {
      coinmetricsData = await loadCoinmetricsFile(fileToProcess, ticker, []);
    }
    catch(err) {
      console.log("Error in loadCoinmetricsFile.")
    }
    try {
      let result = await writeResultsToMongoSync(coinmetricsData, "crypto", "marketdata.transaction_prices")
      console.log("Write complete:", result);
    }
    catch(error) {
      console.log("Error in processCoinmetrics:", error.message);
    }
  });
}

processCoinmetrics().then(res => res).catch(err => console.log("err:", err));

// dataLoadAndSave();
