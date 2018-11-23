"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.writeResultsToMongo = writeResultsToMongo;
exports.getMostRecentETHData = getMostRecentETHData;

var _mongodb = require("mongodb");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

/* getMostRecentETHData()
 * desc: Reads ETH data from MongoDB
 * return: json block of data for ETH daily transaction activity
 */
function getMostRecentETHData() {
  return _getMostRecentETHData.apply(this, arguments);
}
/* writeResultsToMongo()
 * desc: Writes results from the google BigQuery into MongoDB on the cloud
 * param: dataToWrite - the json block to write to MongoDB.
 *
 */


function _getMostRecentETHData() {
  _getMostRecentETHData = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee() {
    var url, client, db;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            url = "mongodb://" + process.env.mongoU + ":" + process.env.mongoP + "@" + process.env.host + "/ethereum";
            _context.prev = 1;
            _context.next = 4;
            return _mongodb.MongoClient.connect(url, {
              useNewUrlParser: true
            });

          case 4:
            client = _context.sent;
            db = client.db("ethereum");
            _context.next = 8;
            return db.collection("marketdata.eth_transactions").find({}).toArray();

          case 8:
            return _context.abrupt("return", _context.sent);

          case 9:
            _context.prev = 9;
            client.close();
            return _context.finish(9);

          case 12:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[1,, 9, 12]]);
  }));
  return _getMostRecentETHData.apply(this, arguments);
}

function writeResultsToMongo(_x) {
  return _writeResultsToMongo.apply(this, arguments);
}

function _writeResultsToMongo() {
  _writeResultsToMongo = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2(dataToWrite) {
    var url, client, db;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            url = "mongodb://" + process.env.mongoU + ":" + process.env.mongoP + "@" + process.env.host + "/ethereum";
            _context2.prev = 1;
            _context2.next = 4;
            return _mongodb.MongoClient.connect(url, {
              useNewUrlParser: true
            });

          case 4:
            client = _context2.sent;
            db = client.db("ethereum");
            _context2.next = 8;
            return db.collection("marketdata.eth_transactions").insertOne(dataToWrite);

          case 8:
            _context2.next = 13;
            break;

          case 10:
            _context2.prev = 10;
            _context2.t0 = _context2["catch"](1);
            console.log("Error writting to DB:", _context2.t0);

          case 13:
            _context2.prev = 13;
            client.close();
            return _context2.finish(13);

          case 16:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this, [[1, 10, 13, 16]]);
  }));
  return _writeResultsToMongo.apply(this, arguments);
}
//# sourceMappingURL=dbUtils.js.map