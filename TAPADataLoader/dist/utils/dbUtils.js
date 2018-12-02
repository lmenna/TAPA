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
            url = process.env.URLEth;

            if (!(url == undefined || url === "")) {
              _context.next = 6;
              break;
            }

            console.log("MongoDB url not set in the environment.");
            console.log("Try running source SetMongoEnv.sh prior to running this.");
            _context.next = 17;
            break;

          case 6:
            _context.prev = 6;
            _context.next = 9;
            return _mongodb.MongoClient.connect(url, {
              useNewUrlParser: true
            });

          case 9:
            client = _context.sent;
            db = client.db("ethereum");
            _context.next = 13;
            return db.collection("marketdata.eth_transactions").find({}).toArray();

          case 13:
            return _context.abrupt("return", _context.sent);

          case 14:
            _context.prev = 14;
            client.close();
            return _context.finish(14);

          case 17:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[6,, 14, 17]]);
  }));
  return _getMostRecentETHData.apply(this, arguments);
}

function writeResultsToMongo(_x, _x2, _x3) {
  return _writeResultsToMongo.apply(this, arguments);
}

function _writeResultsToMongo() {
  _writeResultsToMongo = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2(dataToWrite, targetDB, targetCollection) {
    var url, client, db;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            url = process.env.URLCrypto;

            if (!(url == undefined || url === "")) {
              _context2.next = 6;
              break;
            }

            console.log("MongoDB url not set in the environment.");
            console.log("Try running source SetMongoEnv.sh prior to running this.");
            _context2.next = 22;
            break;

          case 6:
            _context2.prev = 6;
            console.log("Writing results to", targetCollection);
            _context2.next = 10;
            return _mongodb.MongoClient.connect(url, {
              useNewUrlParser: true
            });

          case 10:
            client = _context2.sent;
            db = client.db(targetDB);
            _context2.next = 14;
            return db.collection(targetCollection).insertOne(dataToWrite);

          case 14:
            _context2.next = 19;
            break;

          case 16:
            _context2.prev = 16;
            _context2.t0 = _context2["catch"](6);
            console.log("Error writing to DB:", _context2.t0);

          case 19:
            _context2.prev = 19;
            client.close();
            return _context2.finish(19);

          case 22:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this, [[6, 16, 19, 22]]);
  }));
  return _writeResultsToMongo.apply(this, arguments);
}
//# sourceMappingURL=dbUtils.js.map