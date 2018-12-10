"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.loadCoinmetricsFile = loadCoinmetricsFile;

var _fs = _interopRequireDefault(require("fs"));

var _jszip = _interopRequireDefault(require("jszip"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

// npm install lodash --save-dev
//import cloneDeep from "lodash/cloneDeep";

/* csvJSON(csv, fieldsToSelect)
 * desc: Take csv data as a string and parses it into an object with names matching the header row.
 * param: csv data.
 * param: fieldsToSelect. This version only includes selected fields from the .csv data.
 * Note: This is a simplified parser that will work for the coin metrics csv content.  It will not process
 *       generalized csv formats.
 */
function csvJSON(csv, fieldsToSelect) {
  var lines = csv.split("\n");
  var result = [];
  var headers = lines[0].split(","); // Find location of required headers. -1 indicates data doesn't contain the header

  var indexesToSelect = fieldsToSelect.map(function (field) {
    return headers.indexOf(field);
  });

  for (var i = 1; i < lines.length; i++) {
    var obj = {};
    var currentline = lines[i].split(",");

    for (var j = 0; j < headers.length; j++) {
      if (indexesToSelect.includes(j)) obj[headers[j]] = currentline[j];
    } // Add a unix date to the date from the date field
    // Only push data to the result set if it has a valid date.


    var datePosition = headers.indexOf('date');

    if (datePosition != -1) {
      var date = currentline[datePosition];

      if (date != "") {
        obj["unixDate"] = new Date(date).getTime() / 1000;
        result.push(obj);
      }
    }
  }

  return result; //JSON
}
/* csvJSONAllFields(csv)
 * desc: Take csv data as a string and parses it into an object with names matching the header row.
 * param: csv data.  This version includes all fields present in the .csv data.
 * Note: This is a simplified parser that will work for the coin metrics csv content.  It will not process
 *       generalized csv formats.
 */


function csvJSONAllFields(csv) {
  var lines = csv.split("\n");
  var result = [];
  var headers = lines[0].split(",");

  for (var i = 1; i < lines.length; i++) {
    var obj = {};
    var currentline = lines[i].split(",");

    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = currentline[j];
    } // Add a unix date to the date from the date field
    // Only push data to the result set if it has a valid date.


    var datePosition = headers.indexOf('date');

    if (datePosition != -1) {
      var date = currentline[datePosition];

      if (date != "") {
        obj["unixDate"] = new Date(date).getTime() / 1000;
        result.push(obj);
      }
    }
  }

  return result; //JSON
}
/* loadCoinmetricsFile(fileToProcess)
 * desc: Reads data from a presiously downloaded coinmetrics data file.
 * param: File to load inclusing path to it's location.  Ex. "./data/all.zip"
 * param: Array of crypocurrencies to load.
 * returns: JSON object containing data for all crypocurrencies requested
 */


function loadCoinmetricsFile(_x, _x2, _x3) {
  return _loadCoinmetricsFile.apply(this, arguments);
}

function _loadCoinmetricsFile() {
  _loadCoinmetricsFile = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee(fileToProcess, tickerToProcess, fieldsToSelect) {
    var jsonData;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            jsonData = {
              "header": {
                "ticker": "",
                "filename": fileToProcess,
                "availableFields": []
              },
              "data": {}
            };
            return _context.abrupt("return", new Promise(function (resolve, reject) {
              _fs.default.readFile(fileToProcess, function (err, data) {
                if (err) {
                  console.log("Error:", err);
                  reject(err);
                }

                _jszip.default.loadAsync(data).then(function (zip) {
                  var fileToProcess = tickerToProcess + ".csv";
                  var files = Object.keys(zip.files);

                  if (files.indexOf(fileToProcess) === -1) {
                    console.log("Error processing file:", fileToProcess);
                    console.log("Promise rejected with.  Data not found for:" + tickerToProcess);
                    var err = new Error("Data not found for:" + tickerToProcess);
                    reject(err);
                    return err;
                  }

                  zip.file(fileToProcess).async("string").then(function (data) {
                    console.log("Processing:", fileToProcess);
                    jsonData.header.ticker = tickerToProcess;

                    if (fieldsToSelect.legnth === 0) {
                      console.log("Load coinmetrics data using select fields.");
                      jsonData.data = csvJSON(data, fieldsToSelect);
                    } else {
                      console.log("Load coinmetrics data using ALL fields.");
                      jsonData.data = csvJSONAllFields(data);
                    }

                    if (jsonData.data.length > 0) {
                      jsonData.header.availableFields = Object.keys(jsonData.data[0]);
                    }

                    resolve(jsonData);
                  });
                });
              });
            }));

          case 2:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _loadCoinmetricsFile.apply(this, arguments);
}
//# sourceMappingURL=coinmetricsLoader.js.map