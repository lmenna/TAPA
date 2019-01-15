"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getArbitrageData = getArbitrageData;
exports.updateResultsInMongo = updateResultsInMongo;
exports.writeResultsToMongo = writeResultsToMongo;
exports.getMostRecentETHData = getMostRecentETHData;
exports.removeCollectionFromMongo = removeCollectionFromMongo;
exports.writeResultsToMongoSync = writeResultsToMongoSync;

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
/* getArbitrageData()
 * desc: Reads crypto arbitrage data from the mongoDB
 * return: json block with arbitrage data for all markets
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
            return db.collection("eth_transactions").find({}).toArray();

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

function getArbitrageData() {
  return _getArbitrageData.apply(this, arguments);
}
/* writeResultsToMongo()
 * desc: Writes results into MongoDB on the cloud
 * param: dataToWrite - the json block to write to MongoDB.
 *
 */


function _getArbitrageData() {
  _getArbitrageData = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2() {
    var url, client, db, results;
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
            _context2.next = 19;
            break;

          case 6:
            _context2.prev = 6;
            _context2.next = 9;
            return _mongodb.MongoClient.connect(url, {
              useNewUrlParser: true
            });

          case 9:
            client = _context2.sent;
            db = client.db("crypto");
            console.log("getArbitrageData - marketdata.arbmon");
            _context2.next = 14;
            return db.collection("marketdata.arbmon").find({}).toArray();

          case 14:
            results = _context2.sent;
            return _context2.abrupt("return", results);

          case 16:
            _context2.prev = 16;
            client.close();
            return _context2.finish(16);

          case 19:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this, [[6,, 16, 19]]);
  }));
  return _getArbitrageData.apply(this, arguments);
}

function writeResultsToMongo(_x, _x2, _x3) {
  return _writeResultsToMongo.apply(this, arguments);
}
/* updateResultsInMongo()
 * desc: Updates an existing record in the database.  If record doesn't exist it is created.
 * param: dataToWrite - the json block to write to MongoDB.
 *
 */


function _writeResultsToMongo() {
  _writeResultsToMongo = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee3(dataToWrite, targetDB, targetCollection) {
    var url, client, db;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            url = process.env.URLCrypto;

            if (!(url == undefined || url === "")) {
              _context3.next = 6;
              break;
            }

            console.log("MongoDB url not set in the environment.");
            console.log("Try running source SetMongoEnv.sh prior to running this.");
            _context3.next = 23;
            break;

          case 6:
            _context3.prev = 6;
            console.log("Connect to MongoDB");
            _context3.next = 10;
            return _mongodb.MongoClient.connect(url, {
              useNewUrlParser: true
            });

          case 10:
            client = _context3.sent;
            db = client.db(targetDB);
            console.log("Writing results to", targetCollection);
            _context3.next = 15;
            return db.collection(targetCollection).insertOne(dataToWrite);

          case 15:
            _context3.next = 20;
            break;

          case 17:
            _context3.prev = 17;
            _context3.t0 = _context3["catch"](6);
            console.log("Error writing to DB:", _context3.t0);

          case 20:
            _context3.prev = 20;
            if (client !== undefined) client.close();
            return _context3.finish(20);

          case 23:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, this, [[6, 17, 20, 23]]);
  }));
  return _writeResultsToMongo.apply(this, arguments);
}

function updateResultsInMongo(_x4, _x5, _x6, _x7) {
  return _updateResultsInMongo.apply(this, arguments);
}
/* writeResultsToMongoSync()
 * desc: Writes results into MongoDB on the cloud.
 * param: dataToWrite - the json block to write to MongoDB.
 * return: A promise that the results will be written.
 *
 */


function _updateResultsInMongo() {
  _updateResultsInMongo = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee4(key, dataToWrite, targetDB, targetCollection) {
    var url, client, db;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            url = process.env.URLCrypto;

            if (!(url == undefined || url === "")) {
              _context4.next = 6;
              break;
            }

            console.log("MongoDB url not set in the environment.");
            console.log("Try running source SetMongoEnv.sh prior to running this.");
            _context4.next = 21;
            break;

          case 6:
            _context4.prev = 6;
            _context4.next = 9;
            return _mongodb.MongoClient.connect(url, {
              useNewUrlParser: true
            });

          case 9:
            client = _context4.sent;
            db = client.db(targetDB);
            _context4.next = 13;
            return db.collection(targetCollection).updateOne(key, {
              $set: dataToWrite
            }, {
              upsert: true,
              w: 1
            });

          case 13:
            _context4.next = 18;
            break;

          case 15:
            _context4.prev = 15;
            _context4.t0 = _context4["catch"](6);
            console.log("Error writing to DB:", _context4.t0);

          case 18:
            _context4.prev = 18;
            if (client !== undefined) client.close();
            return _context4.finish(18);

          case 21:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, this, [[6, 15, 18, 21]]);
  }));
  return _updateResultsInMongo.apply(this, arguments);
}

function writeResultsToMongoSync(_x8, _x9, _x10) {
  return _writeResultsToMongoSync.apply(this, arguments);
}
/* removeCollectionFromMongo()
 * desc: Removes an entire collection from the database.
 * param: targetCollection - the collection to remove.
 *
 */


function _writeResultsToMongoSync() {
  _writeResultsToMongoSync = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee6(dataToWrite, targetDB, targetCollection) {
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            return _context6.abrupt("return", new Promise(
            /*#__PURE__*/
            function () {
              var _ref = _asyncToGenerator(
              /*#__PURE__*/
              regeneratorRuntime.mark(function _callee5(resolve, reject) {
                var url, client, db;
                return regeneratorRuntime.wrap(function _callee5$(_context5) {
                  while (1) {
                    switch (_context5.prev = _context5.next) {
                      case 0:
                        url = process.env.URLCrypto;

                        if (!(url == undefined || url === "")) {
                          _context5.next = 7;
                          break;
                        }

                        console.log("MongoDB url not set in the environment.");
                        console.log("Try running source SetMongoEnv.sh prior to running this.");
                        reject(new Error("MongoDB url not set in the environment."));
                        _context5.next = 27;
                        break;

                      case 7:
                        _context5.prev = 7;
                        console.log("Connect to MongoDB");
                        _context5.next = 11;
                        return _mongodb.MongoClient.connect(url, {
                          useNewUrlParser: true
                        });

                      case 11:
                        client = _context5.sent;
                        db = client.db(targetDB);
                        console.log("Writing results to", targetCollection);
                        _context5.next = 16;
                        return db.collection(targetCollection).insertOne(dataToWrite);

                      case 16:
                        console.log("Write to " + targetCollection + " success.");
                        resolve("Write to " + targetCollection + " success.");
                        _context5.next = 24;
                        break;

                      case 20:
                        _context5.prev = 20;
                        _context5.t0 = _context5["catch"](7);
                        console.log("Error writing to DB:", _context5.t0.message);
                        reject(new Error("Error writing to DB."));

                      case 24:
                        _context5.prev = 24;
                        if (client !== undefined) client.close();
                        return _context5.finish(24);

                      case 27:
                      case "end":
                        return _context5.stop();
                    }
                  }
                }, _callee5, this, [[7, 20, 24, 27]]);
              }));

              return function (_x13, _x14) {
                return _ref.apply(this, arguments);
              };
            }()));

          case 1:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6, this);
  }));
  return _writeResultsToMongoSync.apply(this, arguments);
}

function removeCollectionFromMongo(_x11, _x12) {
  return _removeCollectionFromMongo.apply(this, arguments);
}

function _removeCollectionFromMongo() {
  _removeCollectionFromMongo = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee7(targetDB, targetCollection) {
    var url, client, db;
    return regeneratorRuntime.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            url = process.env.URLCrypto;

            if (!(url == undefined || url === "")) {
              _context7.next = 6;
              break;
            }

            console.log("MongoDB url not set in the environment.");
            console.log("Try running source SetMongoEnv.sh prior to running this.");
            _context7.next = 23;
            break;

          case 6:
            _context7.prev = 6;
            console.log("Connect to MongoDB");
            _context7.next = 10;
            return _mongodb.MongoClient.connect(url, {
              useNewUrlParser: true
            });

          case 10:
            client = _context7.sent;
            db = client.db(targetDB);
            console.log("Deleting prior data in", targetCollection);
            _context7.next = 15;
            return db.collection(targetCollection).remove();

          case 15:
            _context7.next = 20;
            break;

          case 17:
            _context7.prev = 17;
            _context7.t0 = _context7["catch"](6);
            console.log("Error writing to DB:", _context7.t0);

          case 20:
            _context7.prev = 20;
            client.close();
            return _context7.finish(20);

          case 23:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7, this, [[6, 17, 20, 23]]);
  }));
  return _removeCollectionFromMongo.apply(this, arguments);
}
//# sourceMappingURL=dbUtils.js.map