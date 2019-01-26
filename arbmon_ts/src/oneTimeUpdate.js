/* oneTimeUpdate.js
 * Will add a timeStamp to each element in the collection specified.
 *
 * To run this use,
 * 
 * source SetMongoEnv.sh 
 * npm run build
 * node lib/oneTimeUpdate.js
 * 
 */
require("@babel/polyfill");

import {oneTimeUpdate} from "./utils/dbUtils";

const db = "crypto";
const collection = "marketdata.arbmonhist";

oneTimeUpdate(db, collection);
