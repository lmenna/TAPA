"use strict";

require("@babel/polyfill");

var _googleLoader = require("./loaders/googleLoader");

var _mongodb = require("mongodb");

var _dbUtils = require("./utils/dbUtils");

var _etherscanLoader = require("./loaders/etherscanLoader");

var _coinmetricsLoader = require("./loaders/coinmetricsLoader");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

// Data file where the coinmetrics data can be found.
var dataDir = "./data/";
var fileToProcess = dataDir + "all.zip"; // Crypocurrencies to process from the coinmetrics dataset.

var tickersToSelect = ["eth", "btc", "xem"]; // Fields to load from the coinmetrics data set.

var fieldToSelect = ["date", "txVolume(USD)", "adjustedTxVolume(USD)", "txCount", "price(USD)"];
/* LoadGoogleDataIntoMongo()
 * desc: Gets data from BigQuery, formats the data and saves it to MongoDB
 *
 */

function readGoogleData() {
  return _readGoogleData.apply(this, arguments);
}
/* formatResults(results)
 * desc: Take the raw results from BigQuery and formats it for writting to MongoDB
 * param: results Raw data from BigQuery
 */


function _readGoogleData() {
  _readGoogleData = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee() {
    var results;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return (0, _googleLoader.getBigQueryData)();

          case 3:
            results = _context.sent;
            _context.next = 9;
            break;

          case 6:
            _context.prev = 6;
            _context.t0 = _context["catch"](0);
            console.log("Error:", _context.t0);

          case 9:
            return _context.abrupt("return", results);

          case 10:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[0, 6]]);
  }));
  return _readGoogleData.apply(this, arguments);
}

function formatResults(results) {
  // Get block with the most recent data.  Copy some of this info into the top of the object.
  results.MaxDaysFrom19700101 = results.data[0].IntDaysFrom19700101;
  results.MaxTimestamp = new Date(results.data[0].MaxTimestamp.value);
  results.MaxBlockNumber = results.data[0].MaxBlockNumber;
  console.log("MaxDaysFrom19700101:", results.MaxDaysFrom19700101);
  console.log("MaxTimestamp:", results.MaxTimestamp);
  console.log("MaxBlockNumber:", results.MaxBlockNumber);
} //var csv is the CSV file with headers


function csvJSON(csv) {
  var lines = csv.split("\n");
  var result = [];
  var headers = lines[0].split(",");

  for (var i = 1; i < lines.length; i++) {
    var obj = {};
    var currentline = lines[i].split(",");

    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = currentline[j];
    }

    result.push(obj);
  } //return result; //JavaScript object


  return {
    "data": result
  }; //JSON
}

function formatPricingData(pricingData) {
  var pricingJSON = csvJSON(pricingData.replace(/['"]+/g, '').replace(/['\r]+/g, '')); // Need and integer number of days from 19700101
  // CEILING(UNIX_MILLIS(blocks.timestamp)/(60*60*24))

  pricingJSON.data.map(function (item) {
    item.IntDaysFrom19700101 = item.UnixTimeStamp / (60 * 60 * 24);
  });
  return pricingJSON;
}

function dataLoadAndSave() {
  return _dataLoadAndSave.apply(this, arguments);
}

function _dataLoadAndSave() {
  _dataLoadAndSave = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2() {
    var results, pricingData, pricingJSON;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return readGoogleData();

          case 2:
            results = _context2.sent;

            if (!(results === undefined)) {
              _context2.next = 7;
              break;
            }

            console.log("No data was returned from BigQuery");
            _context2.next = 20;
            break;

          case 7:
            if (!(results.data.length > 0)) {
              _context2.next = 19;
              break;
            }

            console.log("Got good results. Number of records:", results.data.length);
            formatResults(results);
            (0, _dbUtils.writeResultsToMongo)(results, "marketdata.eth_transactions");
            _context2.next = 13;
            return (0, _etherscanLoader.loadPricingData)();

          case 13:
            pricingData = _context2.sent;
            pricingJSON = formatPricingData(pricingData);
            console.log(pricingJSON);
            (0, _dbUtils.writeResultsToMongo)(pricingJSON, "marketdata.eth_prices");
            _context2.next = 20;
            break;

          case 19:
            console.log("BigQuery worked but results.data had no rows.");

          case 20:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));
  return _dataLoadAndSave.apply(this, arguments);
}

function processCoinmetrics() {
  return _processCoinmetrics.apply(this, arguments);
}

function _processCoinmetrics() {
  _processCoinmetrics = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee4() {
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            tickersToSelect.map(
            /*#__PURE__*/
            function () {
              var _ref = _asyncToGenerator(
              /*#__PURE__*/
              regeneratorRuntime.mark(function _callee3(item) {
                var ticker, coinmetricsData;
                return regeneratorRuntime.wrap(function _callee3$(_context3) {
                  while (1) {
                    switch (_context3.prev = _context3.next) {
                      case 0:
                        ticker = item;
                        _context3.next = 3;
                        return (0, _coinmetricsLoader.loadCoinmetricsFile)(fileToProcess, ticker, fieldToSelect);

                      case 3:
                        coinmetricsData = _context3.sent;
                        (0, _dbUtils.writeResultsToMongo)(coinmetricsData, "marketdata.transaction_prices");

                      case 5:
                      case "end":
                        return _context3.stop();
                    }
                  }
                }, _callee3, this);
              }));

              return function (_x) {
                return _ref.apply(this, arguments);
              };
            }());

          case 1:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));
  return _processCoinmetrics.apply(this, arguments);
}

processCoinmetrics().then(function (res) {
  return res;
}).catch(function (err) {
  return console.log("err:", err);
}); // dataLoadAndSave();
//# sourceMappingURL=app.js.map