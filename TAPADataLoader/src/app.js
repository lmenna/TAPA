/* app.js
 * desc: Entry point to run data loaders for the TaPA application.
 *
 */

import "@babel/polyfill";
import {getQuery, getBigQueryData} from "./loaders/googleLoader";
// npm install mongodb --save-dev
import { MongoClient } from 'mongodb';
import { writeResultsToMongo } from "./utils/dbUtils"

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


async function dataLoadAndSave() {
  var results = await readGoogleData();
  if (results === undefined) {
    console.log("No data was returned from BigQuery");
  }
  else if (results.data.length > 0) {
    console.log("Got good results. Number of records:", results.data.length);
    formatResults(results);
    writeResultsToMongo(results);
  }
  else {
    console.log("BigQuery worked but results.data had no rows.")
  }
}

dataLoadAndSave();
