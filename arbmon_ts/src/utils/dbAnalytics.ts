/* dbAnalytics.ts
 * desc: Routines to perform analysis on data in the MongoDB.
 * Designed to work from node by directly accessing the database.
 *
*/

import {getEntireCollection} from "./dbUtils";
import { deflateSync } from "zlib";

async function getCcyPairsAlertHistory():Promise<any> {

  const groupBy: Array<any> = [
    {$group : {_id : "$ccyPair", num_alerts : {$sum : 1}}}
  ]
  const ccyPairAlerts = await getEntireCollection("crypto", "marketdata.arbmonhist"); 
  let groupedData: any = {};
  ccyPairAlerts.map((curElem: any) => {
   let date = new Date(curElem.timeStamp);
    let dateStr = date.getFullYear() + "-" + date.getMonth()+1 + "-" + date.getDate();
    if (!groupedData[curElem.ccyPair]){
      groupedData[curElem.ccyPair] = {
      }
    }      
    if(!groupedData[curElem.ccyPair][dateStr]) {
      groupedData[curElem.ccyPair][dateStr] = {
          count: 0
      }
    }
    groupedData[curElem.ccyPair][dateStr].count++;
  });
  console.log(groupedData);
} 

export {getCcyPairsAlertHistory};
