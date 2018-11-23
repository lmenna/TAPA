"use strict";

require("@babel/polyfill");

var _googleLoader = require("./loaders/googleLoader");

var _mongodb = require("mongodb");

var _dbUtils = require("./utils/dbUtils");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

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
}

function dataLoadAndSave() {
  return _dataLoadAndSave.apply(this, arguments);
}

function _dataLoadAndSave() {
  _dataLoadAndSave = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2() {
    var results;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return readGoogleData();

          case 2:
            results = _context2.sent;

            if (results === undefined) {
              console.log("No data was returned from BigQuery");
            } else if (results.data.length > 0) {
              console.log("Got good results. Number of records:", results.data.length);
              formatResults(results);
              (0, _dbUtils.writeResultsToMongo)(results);
            } else {
              console.log("BigQuery worked but results.data had no rows.");
            }

          case 4:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));
  return _dataLoadAndSave.apply(this, arguments);
}

dataLoadAndSave();
//# sourceMappingURL=app.js.map