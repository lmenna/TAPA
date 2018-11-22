"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getBigQueryData = getBigQueryData;

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

/* googleLoader.js
 * desc: Runs queries against the google BigQuery public data sets
 *
 */
// Got this using npm install --save @google-cloud/bigquery
var _require = require('@google-cloud/bigquery'),
    BigQuery = _require.BigQuery;
/* getBigQueryData(query)
 * desc: Run the BigQuery using async and await execution model.
 * param: String with the query to run.
 */


function runBigQuery(_x) {
  return _runBigQuery.apply(this, arguments);
}

function _runBigQuery() {
  _runBigQuery = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee(queryToRun) {
    var bigquery2, resultSet, rowCount, promise, r;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            bigquery2 = new BigQuery({
              projectId: 'eth-testing-221913',
              keyFilename: '/Users/yglm/eth-testing-221913-87aaade4d104.json'
            });
            console.log("Running Query:", queryToRun);
            resultSet = {
              header: {
                query: queryToRun,
                rowCount: 0,
                errorCode: 0,
                errorMsg: ""
              },
              data: []
            };
            rowCount = 0;
            promise = new Promise(function (resolve, reject) {
              bigquery2.createQueryStream(queryToRun).on('error', console.error).on('data', function (row) {
                resultSet.data.push(row);
                rowCount++;
              }).on('end', function () {
                resultSet.header.rowCount = rowCount;
                console.log("Resolving promise with result set.");
                resolve(resultSet);
              });
            });
            _context.next = 7;
            return promise;

          case 7:
            r = _context.sent;
            return _context.abrupt("return", resultSet);

          case 9:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _runBigQuery.apply(this, arguments);
}

;
/* getBigQueryData()
 * desc: async Wrapper function to call into getBigQueryData() and wait for the result.
 *
 */

function getBigQueryData() {
  return _getBigQueryData.apply(this, arguments);
}

function _getBigQueryData() {
  _getBigQueryData = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2() {
    var query, result;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            // SQL to run on BigQuery.  Will return the daily Ethereum transaction counts.
            // It runs using the time interval from current time back 200 Hours = 8.33 days
            query = "select CAST(CEILING(UNIX_MILLIS(blocks.timestamp)/(1000*60*60*24)) as INT64) as IntDaysFrom19700101,";
            query += "sum(blocks.transaction_count) as Transactions,";
            query += "min(blocks.timestamp) as MinTimestamp,";
            query += "max(blocks.timestamp) as MaxTimestamp,";
            query += "min(UNIX_MILLIS(blocks.timestamp)) as MinUnixTimestamp,";
            query += "max(UNIX_MILLIS(blocks.timestamp)) as MaxUnixTimestamp,";
            query += "min(blocks.number) as MinBlockNumber,";
            query += "max(blocks.number) as MaxBlockNumber,";
            query += "sum(blocks.difficulty) as Difficulty ";
            query += "from `bigquery-public-data.ethereum_blockchain.blocks` as blocks ";
            query += "where blocks.number != 0 ";
            query += "and blocks.timestamp > TIMESTAMP_SUB(current_timestamp, INTERVAL 200 HOUR) ";
            query += "group by IntDaysFrom19700101 ";
            query += "order by IntDaysFrom19700101 DESC";
            _context2.prev = 14;
            _context2.next = 17;
            return runBigQuery(query);

          case 17:
            result = _context2.sent;
            _context2.next = 23;
            break;

          case 20:
            _context2.prev = 20;
            _context2.t0 = _context2["catch"](14);
            console.log("Error:", _context2.t0);

          case 23:
            console.log("Query result:", result);
            return _context2.abrupt("return", result);

          case 25:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this, [[14, 20]]);
  }));
  return _getBigQueryData.apply(this, arguments);
}
//# sourceMappingURL=googleLoader.js.map