/* coinmetricsLoader.js
 * desc: Extracts data from the file found at "https://coinmetrics.io/data/all.zip"
 *       Assumes the file was downloaded previously into a locally accesible file.
 *
 */
import fs from "fs";
// npm install jszip --save-dev
import JSZip from "jszip";
// npm install lodash --save-dev
import cloneDeep from "lodash/cloneDeep";

/* csvJSON(csv)
 * desc: Take csv data as a string and parses it into an object with names matching the header row.
 * param: csv data.
 * Note: This is a simplified parser that will work for the coin metrics csv content.  It will not process
 *       generalized csv formats.
 */
function csvJSON(csv, fieldToSelect){

  var lines=csv.split("\n");
  var result = [];
  var headers=lines[0].split(",");
  // Find location of required headers. -1 indicates data doesn't contain the header
  var indexesToSelect = fieldToSelect.map(field => {
    return( headers.indexOf(field) );
  })
  for(var i=1; i<lines.length; i++){
      var obj = {};
      var currentline=lines[i].split(",");
      for(var j=0;j<headers.length;j++){
          if(indexesToSelect.includes(j))
            obj[headers[j]] = currentline[j];
      }
      // Add a unix date to the date from the date field
      // Only push data to the result set if it has a valid date.
      var datePosition = headers.indexOf('date');
      if (datePosition!=-1) {
        const date = currentline[datePosition];
        if (date!="") {
          obj["unixDate"] = new Date(date).getTime()/1000;
          result.push(obj);
        }
      }
  }
  return(result); //JSON
}

/* loadCoinmetricsFile(fileToProcess)
 * desc: Reads data from a presiously downloaded coinmetrics data file.
 * param: File to load inclusing path to it's location.  Ex. "./data/all.zip"
 * param: Array of crypocurrencies to load.
 * returns: JSON object containing data for all crypocurrencies requested
 */
async function loadCoinmetricsFile(fileToProcess, tickerToProcess, fieldToSelect) {

  var jsonData = {
    "header": {
        "ticker": "",
        "filename": fileToProcess,
        "availableFields": []
      },
    "data": {}
  };
  return new Promise(function (resolve, reject) {
    fs.readFile(fileToProcess, function(err, data) {
      if (err) {
        console.log("Error:", err);
        reject(err);
      }
      JSZip.loadAsync(data).then(function (zip) {
        var fileToProcess = tickerToProcess + ".csv";
        var files = Object.keys(zip.files);
        if (files.indexOf(fileToProcess)===-1) {
          reject("Data not found for:" + tickerToProcess);
        }
        zip.file(fileToProcess).async("string").then( function (data) {
          console.log("Processing:", fileToProcess);
          jsonData.header.ticker = tickerToProcess;
          jsonData.data = csvJSON(data, fieldToSelect);
          if (jsonData.data.length > 0) {
              jsonData.header.availableFields = Object.keys(jsonData.data[0]);
          }
          resolve(jsonData);
        });
      });
    });
  });
}

export { loadCoinmetricsFile }
