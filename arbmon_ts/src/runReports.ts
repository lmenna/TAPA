/* runReports.ts
 * desc: Utility file that launches reports run against the MongoDB.  First report is a grouped summary report
 *       from marketdata.arbmonhist 
 */

require("@babel/polyfill");

import {getCcyPairsAlertHistory} from "./utils/dbAnalytics";


getCcyPairsAlertHistory();

