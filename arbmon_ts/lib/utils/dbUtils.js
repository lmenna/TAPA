"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateResultsInMongo = updateResultsInMongo;
exports.writeResultsToMongo = writeResultsToMongo;
exports.getMostRecentETHData = getMostRecentETHData;
exports.removeCollectionFromMongo = removeCollectionFromMongo;
exports.writeResultsToMongoSync = writeResultsToMongoSync;
exports.oneTimeUpdate = oneTimeUpdate;
exports.getEntireCollection = getEntireCollection;

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
 * desc: Writes results into MongoDB on the cloud
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
            _context2.next = 23;
            break;

          case 6:
            _context2.prev = 6;
            console.log("Connect to MongoDB");
            _context2.next = 10;
            return _mongodb.MongoClient.connect(url, {
              useNewUrlParser: true
            });

          case 10:
            client = _context2.sent;
            db = client.db(targetDB);
            console.log("Writing results to", targetCollection);
            _context2.next = 15;
            return db.collection(targetCollection).insertOne(dataToWrite);

          case 15:
            _context2.next = 20;
            break;

          case 17:
            _context2.prev = 17;
            _context2.t0 = _context2["catch"](6);
            console.log("Error writing to DB:", _context2.t0);

          case 20:
            _context2.prev = 20;
            if (client !== undefined) client.close();
            return _context2.finish(20);

          case 23:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this, [[6, 17, 20, 23]]);
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
  regeneratorRuntime.mark(function _callee3(key, dataToWrite, targetDB, targetCollection) {
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
            _context3.next = 21;
            break;

          case 6:
            _context3.prev = 6;
            _context3.next = 9;
            return _mongodb.MongoClient.connect(url, {
              useNewUrlParser: true
            });

          case 9:
            client = _context3.sent;
            db = client.db(targetDB);
            _context3.next = 13;
            return db.collection(targetCollection).updateOne(key, {
              $set: dataToWrite
            }, {
              upsert: true,
              w: 1
            });

          case 13:
            _context3.next = 18;
            break;

          case 15:
            _context3.prev = 15;
            _context3.t0 = _context3["catch"](6);
            console.log("Error calling updateOne on DB:", _context3.t0);

          case 18:
            _context3.prev = 18;
            if (client !== undefined) client.close();
            return _context3.finish(18);

          case 21:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, this, [[6, 15, 18, 21]]);
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
  regeneratorRuntime.mark(function _callee5(dataToWrite, targetDB, targetCollection) {
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            return _context5.abrupt("return", new Promise(
            /*#__PURE__*/
            function () {
              var _ref = _asyncToGenerator(
              /*#__PURE__*/
              regeneratorRuntime.mark(function _callee4(resolve, reject) {
                var url, client, db;
                return regeneratorRuntime.wrap(function _callee4$(_context4) {
                  while (1) {
                    switch (_context4.prev = _context4.next) {
                      case 0:
                        url = process.env.URLCrypto;

                        if (!(url == undefined || url === "")) {
                          _context4.next = 7;
                          break;
                        }

                        console.log("MongoDB url not set in the environment.");
                        console.log("Try running source SetMongoEnv.sh prior to running this.");
                        reject(new Error("MongoDB url not set in the environment."));
                        _context4.next = 26;
                        break;

                      case 7:
                        _context4.prev = 7;
                        console.log("Connect to MongoDB");
                        _context4.next = 11;
                        return _mongodb.MongoClient.connect(url, {
                          useNewUrlParser: true
                        });

                      case 11:
                        client = _context4.sent;
                        db = client.db(targetDB);
                        console.log("Writing results to", targetCollection);
                        _context4.next = 16;
                        return db.collection(targetCollection).insertOne(dataToWrite);

                      case 16:
                        return _context4.abrupt("return", _context4.sent);

                      case 19:
                        _context4.prev = 19;
                        _context4.t0 = _context4["catch"](7);
                        console.log("Error calling insertOne on the DB:", _context4.t0.message);
                        reject(new Error("Error writing to DB."));

                      case 23:
                        _context4.prev = 23;
                        if (client !== undefined) client.close();
                        return _context4.finish(23);

                      case 26:
                      case "end":
                        return _context4.stop();
                    }
                  }
                }, _callee4, this, [[7, 19, 23, 26]]);
              }));

              return function (_x18, _x19) {
                return _ref.apply(this, arguments);
              };
            }()));

          case 1:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5, this);
  }));
  return _writeResultsToMongoSync.apply(this, arguments);
}

function removeCollectionFromMongo(_x11, _x12) {
  return _removeCollectionFromMongo.apply(this, arguments);
}
/* oneTimeUpdate()
 * desc: Reads a collection in and adds a timeStamp to each record.
 * param: targetCollection - the collection to remove.
 *
 */


function _removeCollectionFromMongo() {
  _removeCollectionFromMongo = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee6(targetDB, targetCollection) {
    var url, client, db;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            url = process.env.URLCrypto;

            if (!(url == undefined || url === "")) {
              _context6.next = 6;
              break;
            }

            console.log("MongoDB url not set in the environment.");
            console.log("Try running source SetMongoEnv.sh prior to running this.");
            _context6.next = 23;
            break;

          case 6:
            _context6.prev = 6;
            console.log("Connect to MongoDB");
            _context6.next = 10;
            return _mongodb.MongoClient.connect(url, {
              useNewUrlParser: true
            });

          case 10:
            client = _context6.sent;
            db = client.db(targetDB);
            console.log("Deleting prior data in", targetCollection);
            _context6.next = 15;
            return db.collection(targetCollection).remove();

          case 15:
            _context6.next = 20;
            break;

          case 17:
            _context6.prev = 17;
            _context6.t0 = _context6["catch"](6);
            console.log("Error writing to DB:", _context6.t0);

          case 20:
            _context6.prev = 20;
            client.close();
            return _context6.finish(20);

          case 23:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6, this, [[6, 17, 20, 23]]);
  }));
  return _removeCollectionFromMongo.apply(this, arguments);
}

function oneTimeUpdate(_x13, _x14) {
  return _oneTimeUpdate.apply(this, arguments);
}

function _oneTimeUpdate() {
  _oneTimeUpdate = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee8(targetDB, targetCollection) {
    var url, client, db, sourceData, modifiedData;
    return regeneratorRuntime.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            url = process.env.URLCrypto;

            if (!(url == undefined || url === "")) {
              _context8.next = 6;
              break;
            }

            console.log("MongoDB url not set in the environment.");
            console.log("Try running source SetMongoEnv.sh prior to running this.");
            _context8.next = 24;
            break;

          case 6:
            _context8.prev = 6;
            _context8.next = 9;
            return _mongodb.MongoClient.connect(url, {
              useNewUrlParser: true
            });

          case 9:
            client = _context8.sent;
            db = client.db(targetDB);
            _context8.next = 13;
            return db.collection(targetCollection).find({}).toArray();

          case 13:
            sourceData = _context8.sent;
            modifiedData = sourceData.map(function (element) {
              var tsString = element.timeStamp;
              var ts = new Date(element.timeStamp);
              var tsInteger = ts.getTime() / 1000;
              console.log(tsString, " ", ts, " ", tsInteger);
              element.time = tsInteger;
              return element;
            });
            modifiedData.map(
            /*#__PURE__*/
            function () {
              var _ref2 = _asyncToGenerator(
              /*#__PURE__*/
              regeneratorRuntime.mark(function _callee7(element) {
                var key;
                return regeneratorRuntime.wrap(function _callee7$(_context7) {
                  while (1) {
                    switch (_context7.prev = _context7.next) {
                      case 0:
                        key = {
                          key: element.key
                        };
                        console.log("Updating record:", element);
                        _context7.next = 4;
                        return db.collection(targetCollection).updateOne(key, {
                          $set: element
                        });

                      case 4:
                      case "end":
                        return _context7.stop();
                    }
                  }
                }, _callee7, this);
              }));

              return function (_x20) {
                return _ref2.apply(this, arguments);
              };
            }());
            _context8.next = 21;
            break;

          case 18:
            _context8.prev = 18;
            _context8.t0 = _context8["catch"](6);
            console.log("Error during oneTimeUpdate:", _context8.t0);

          case 21:
            _context8.prev = 21;
            client.close();
            return _context8.finish(21);

          case 24:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8, this, [[6, 18, 21, 24]]);
  }));
  return _oneTimeUpdate.apply(this, arguments);
}

function getEntireCollection(_x15, _x16, _x17) {
  return _getEntireCollection.apply(this, arguments);
}

function _getEntireCollection() {
  _getEntireCollection = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee9(targetDB, targetCollection, groupBy) {
    var url, client, db, mysort, dbResults;
    return regeneratorRuntime.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            url = process.env.URLCrypto;

            if (!(url == undefined || url === "")) {
              _context9.next = 6;
              break;
            }

            console.log("MongoDB url not set in the environment.");
            console.log("Try running source SetMongoEnv.sh prior to running this.");
            _context9.next = 31;
            break;

          case 6:
            _context9.prev = 6;
            _context9.next = 9;
            return _mongodb.MongoClient.connect(url, {
              useNewUrlParser: true
            });

          case 9:
            client = _context9.sent;
            db = client.db(targetDB);
            mysort = {
              time: 1
            };
            dbResults = {};

            if (!groupBy) {
              _context9.next = 19;
              break;
            }

            _context9.next = 16;
            return db.collection(targetCollection).aggregate(groupBy).toArray();

          case 16:
            dbResults = _context9.sent;
            _context9.next = 22;
            break;

          case 19:
            _context9.next = 21;
            return db.collection(targetCollection).find({}).sort(mysort).toArray();

          case 21:
            dbResults = _context9.sent;

          case 22:
            return _context9.abrupt("return", dbResults);

          case 25:
            _context9.prev = 25;
            _context9.t0 = _context9["catch"](6);
            console.log("Error during getEntireCollection:", _context9.t0);

          case 28:
            _context9.prev = 28;
            client.close();
            return _context9.finish(28);

          case 31:
          case "end":
            return _context9.stop();
        }
      }
    }, _callee9, this, [[6, 25, 28, 31]]);
  }));
  return _getEntireCollection.apply(this, arguments);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9kYlV0aWxzLmpzIl0sIm5hbWVzIjpbImdldE1vc3RSZWNlbnRFVEhEYXRhIiwidXJsIiwicHJvY2VzcyIsImVudiIsIlVSTEV0aCIsInVuZGVmaW5lZCIsImNvbnNvbGUiLCJsb2ciLCJNb25nb0NsaWVudCIsImNvbm5lY3QiLCJ1c2VOZXdVcmxQYXJzZXIiLCJjbGllbnQiLCJkYiIsImNvbGxlY3Rpb24iLCJmaW5kIiwidG9BcnJheSIsImNsb3NlIiwid3JpdGVSZXN1bHRzVG9Nb25nbyIsImRhdGFUb1dyaXRlIiwidGFyZ2V0REIiLCJ0YXJnZXRDb2xsZWN0aW9uIiwiVVJMQ3J5cHRvIiwiaW5zZXJ0T25lIiwidXBkYXRlUmVzdWx0c0luTW9uZ28iLCJrZXkiLCJ1cGRhdGVPbmUiLCIkc2V0IiwidXBzZXJ0IiwidyIsIndyaXRlUmVzdWx0c1RvTW9uZ29TeW5jIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJFcnJvciIsIm1lc3NhZ2UiLCJyZW1vdmVDb2xsZWN0aW9uRnJvbU1vbmdvIiwicmVtb3ZlIiwib25lVGltZVVwZGF0ZSIsInNvdXJjZURhdGEiLCJtb2RpZmllZERhdGEiLCJtYXAiLCJlbGVtZW50IiwidHNTdHJpbmciLCJ0aW1lU3RhbXAiLCJ0cyIsIkRhdGUiLCJ0c0ludGVnZXIiLCJnZXRUaW1lIiwidGltZSIsImdldEVudGlyZUNvbGxlY3Rpb24iLCJncm91cEJ5IiwibXlzb3J0IiwiZGJSZXN1bHRzIiwiYWdncmVnYXRlIiwic29ydCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQU1BOzs7Ozs7QUFFQTs7OztTQUlnQkEsb0I7OztBQW1CaEI7Ozs7Ozs7Ozs7MEJBbkJDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUNLQyxZQUFBQSxHQURMLEdBQ1dDLE9BQU8sQ0FBQ0MsR0FBUixDQUFZQyxNQUR2Qjs7QUFBQSxrQkFFS0gsR0FBRyxJQUFFSSxTQUFMLElBQWtCSixHQUFHLEtBQUcsRUFG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LEVBQW1EbkMsT0FBbkQsRUFmMUI7O0FBQUE7QUFlUXFDLFlBQUFBLFNBZlI7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQSxtQkFrQjBCeEMsRUFBRSxDQUFDQyxVQUFILENBQWNPLGdCQUFkLEVBQWdDTixJQUFoQyxDQUFxQyxFQUFyQyxFQUF5Q3dDLElBQXpDLENBQThDSCxNQUE5QyxFQUFzRHBDLE9BQXRELEVBbEIxQjs7QUFBQTtBQWtCUXFDLFlBQUFBLFNBbEJSOztBQUFBO0FBQUEsOENBb0JhQSxTQXBCYjs7QUFBQTtBQUFBO0FBQUE7QUF1Qk05QyxZQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxtQ0FBWjs7QUF2Qk47QUFBQTtBQTBCTUksWUFBQUEsTUFBTSxDQUFDSyxLQUFQO0FBMUJOOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEciLCJzb3VyY2VzQ29udGVudCI6WyIvKiBkYlV0aWxzLmpzXG4gKiBkZXNjOiBVdGlsaXRpZXMgZm9yIGludGVyYWN0aW5nIHdpdGggTW9uZ29EQiB0cmFuc2FjdGlvbmFsIGRhdGEgc3RvcmVcbiAqICAgICAgIGhvc3RlZCBvbiBtbGFiLmNvbS5cbiAqL1xuXG4vLyBucG0gaW5zdGFsbCBtb25nb2RiIC0tc2F2ZS1kZXZcbmltcG9ydCB7IE1vbmdvQ2xpZW50IH0gZnJvbSAnbW9uZ29kYic7XG5cbi8qIGdldE1vc3RSZWNlbnRFVEhEYXRhKClcbiAqIGRlc2M6IFJlYWRzIEVUSCBkYXRhIGZyb20gTW9uZ29EQlxuICogcmV0dXJuOiBqc29uIGJsb2NrIG9mIGRhdGEgZm9yIEVUSCBkYWlseSB0cmFuc2FjdGlvbiBhY3Rpdml0eVxuICovXG4gYXN5bmMgZnVuY3Rpb24gZ2V0TW9zdFJlY2VudEVUSERhdGEoKSB7XG4gIHZhciB1cmwgPSBwcm9jZXNzLmVudi5VUkxFdGg7XG4gIGlmICh1cmw9PXVuZGVmaW5lZCB8fCB1cmw9PT1cIlwiKSB7XG4gICAgY29uc29sZS5sb2coXCJNb25nb0RCIHVybCBub3Qgc2V0IGluIHRoZSBlbnZpcm9ubWVudC5cIik7XG4gICAgY29uc29sZS5sb2coXCJUcnkgcnVubmluZyBzb3VyY2UgU2V0TW9uZ29FbnYuc2ggcHJpb3IgdG8gcnVubmluZyB0aGlzLlwiKTtcbiAgfVxuICBlbHNlIHtcbiAgICB2YXIgY2xpZW50O1xuICAgIHZhciBkYjtcbiAgICB0cnkge1xuICAgICAgY2xpZW50ID0gYXdhaXQgTW9uZ29DbGllbnQuY29ubmVjdCh1cmwsIHsgdXNlTmV3VXJsUGFyc2VyOiB0cnVlIH0pO1xuICAgICAgZGIgPSBjbGllbnQuZGIoXCJldGhlcmV1bVwiKTtcbiAgICAgIHJldHVybiBhd2FpdCBkYi5jb2xsZWN0aW9uKFwiZXRoX3RyYW5zYWN0aW9uc1wiKS5maW5kKHt9KS50b0FycmF5KCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGNsaWVudC5jbG9zZSgpO1xuICAgIH1cbiAgfVxufVxuXG4vKiB3cml0ZVJlc3VsdHNUb01vbmdvKClcbiAqIGRlc2M6IFdyaXRlcyByZXN1bHRzIGludG8gTW9uZ29EQiBvbiB0aGUgY2xvdWRcbiAqIHBhcmFtOiBkYXRhVG9Xcml0ZSAtIHRoZSBqc29uIGJsb2NrIHRvIHdyaXRlIHRvIE1vbmdvREIuXG4gKlxuICovXG5hc3luYyBmdW5jdGlvbiB3cml0ZVJlc3VsdHNUb01vbmdvKGRhdGFUb1dyaXRlLCB0YXJnZXREQiwgdGFyZ2V0Q29sbGVjdGlvbikge1xuXG4gIHZhciB1cmwgPSBwcm9jZXNzLmVudi5VUkxDcnlwdG87XG4gIGlmICh1cmw9PXVuZGVmaW5lZCB8fCB1cmw9PT1cIlwiKSB7XG4gICAgY29uc29sZS5sb2coXCJNb25nb0RCIHVybCBub3Qgc2V0IGluIHRoZSBlbnZpcm9ubWVudC5cIik7XG4gICAgY29uc29sZS5sb2coXCJUcnkgcnVubmluZyBzb3VyY2UgU2V0TW9uZ29FbnYuc2ggcHJpb3IgdG8gcnVubmluZyB0aGlzLlwiKTtcbiAgfVxuICBlbHNlIHtcbiAgICB2YXIgY2xpZW50O1xuICAgIHZhciBkYjtcbiAgICB0cnkge1xuICAgICAgY29uc29sZS5sb2coXCJDb25uZWN0IHRvIE1vbmdvREJcIik7XG4gICAgICBjbGllbnQgPSBhd2FpdCBNb25nb0NsaWVudC5jb25uZWN0KHVybCwgeyB1c2VOZXdVcmxQYXJzZXI6IHRydWUgfSk7XG4gICAgICBkYiA9IGNsaWVudC5kYih0YXJnZXREQik7XG4gICAgICBjb25zb2xlLmxvZyhcIldyaXRpbmcgcmVzdWx0cyB0b1wiLCB0YXJnZXRDb2xsZWN0aW9uKTtcbiAgICAgIGF3YWl0IGRiLmNvbGxlY3Rpb24odGFyZ2V0Q29sbGVjdGlvbikuaW5zZXJ0T25lKGRhdGFUb1dyaXRlKTtcbiAgICB9XG4gICAgY2F0Y2goZXJyKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIkVycm9yIHdyaXRpbmcgdG8gREI6XCIsIGVycik7XG4gICAgfVxuICAgIGZpbmFsbHkge1xuICAgICAgaWYoY2xpZW50IT09dW5kZWZpbmVkKVxuICAgICAgICBjbGllbnQuY2xvc2UoKTtcbiAgICB9XG4gIH1cbn1cblxuLyogdXBkYXRlUmVzdWx0c0luTW9uZ28oKVxuICogZGVzYzogVXBkYXRlcyBhbiBleGlzdGluZyByZWNvcmQgaW4gdGhlIGRhdGFiYXNlLiAgSWYgcmVjb3JkIGRvZXNuJ3QgZXhpc3QgaXQgaXMgY3JlYXRlZC5cbiAqIHBhcmFtOiBkYXRhVG9Xcml0ZSAtIHRoZSBqc29uIGJsb2NrIHRvIHdyaXRlIHRvIE1vbmdvREIuXG4gKlxuICovXG5hc3luYyBmdW5jdGlvbiB1cGRhdGVSZXN1bHRzSW5Nb25nbyhrZXksIGRhdGFUb1dyaXRlLCB0YXJnZXREQiwgdGFyZ2V0Q29sbGVjdGlvbikge1xuXG4gIHZhciB1cmwgPSBwcm9jZXNzLmVudi5VUkxDcnlwdG87XG4gIGlmICh1cmw9PXVuZGVmaW5lZCB8fCB1cmw9PT1cIlwiKSB7XG4gICAgY29uc29sZS5sb2coXCJNb25nb0RCIHVybCBub3Qgc2V0IGluIHRoZSBlbnZpcm9ubWVudC5cIik7XG4gICAgY29uc29sZS5sb2coXCJUcnkgcnVubmluZyBzb3VyY2UgU2V0TW9uZ29FbnYuc2ggcHJpb3IgdG8gcnVubmluZyB0aGlzLlwiKTtcbiAgfVxuICBlbHNlIHtcbiAgICB2YXIgY2xpZW50O1xuICAgIHZhciBkYjtcbiAgICB0cnkge1xuICAgICAgY2xpZW50ID0gYXdhaXQgTW9uZ29DbGllbnQuY29ubmVjdCh1cmwsIHsgdXNlTmV3VXJsUGFyc2VyOiB0cnVlIH0pO1xuICAgICAgZGIgPSBjbGllbnQuZGIodGFyZ2V0REIpO1xuICAgICAgYXdhaXQgZGIuY29sbGVjdGlvbih0YXJnZXRDb2xsZWN0aW9uKS51cGRhdGVPbmUoa2V5LCB7JHNldDogZGF0YVRvV3JpdGV9LCB7dXBzZXJ0OnRydWUsIHc6IDF9KTtcbiAgICB9XG4gICAgY2F0Y2goZXJyKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIkVycm9yIGNhbGxpbmcgdXBkYXRlT25lIG9uIERCOlwiLCBlcnIpO1xuICAgIH1cbiAgICBmaW5hbGx5IHtcbiAgICAgIGlmKGNsaWVudCE9PXVuZGVmaW5lZClcbiAgICAgICAgY2xpZW50LmNsb3NlKCk7XG4gICAgfVxuICB9XG59XG5cblxuLyogd3JpdGVSZXN1bHRzVG9Nb25nb1N5bmMoKVxuICogZGVzYzogV3JpdGVzIHJlc3VsdHMgaW50byBNb25nb0RCIG9uIHRoZSBjbG91ZC5cbiAqIHBhcmFtOiBkYXRhVG9Xcml0ZSAtIHRoZSBqc29uIGJsb2NrIHRvIHdyaXRlIHRvIE1vbmdvREIuXG4gKiByZXR1cm46IEEgcHJvbWlzZSB0aGF0IHRoZSByZXN1bHRzIHdpbGwgYmUgd3JpdHRlbi5cbiAqXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHdyaXRlUmVzdWx0c1RvTW9uZ29TeW5jKGRhdGFUb1dyaXRlLCB0YXJnZXREQiwgdGFyZ2V0Q29sbGVjdGlvbikge1xuXG4gIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyBmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gIHZhciB1cmwgPSBwcm9jZXNzLmVudi5VUkxDcnlwdG87XG4gIGlmICh1cmw9PXVuZGVmaW5lZCB8fCB1cmw9PT1cIlwiKSB7XG4gICAgY29uc29sZS5sb2coXCJNb25nb0RCIHVybCBub3Qgc2V0IGluIHRoZSBlbnZpcm9ubWVudC5cIik7XG4gICAgY29uc29sZS5sb2coXCJUcnkgcnVubmluZyBzb3VyY2UgU2V0TW9uZ29FbnYuc2ggcHJpb3IgdG8gcnVubmluZyB0aGlzLlwiKTtcbiAgICByZWplY3QobmV3IEVycm9yKFwiTW9uZ29EQiB1cmwgbm90IHNldCBpbiB0aGUgZW52aXJvbm1lbnQuXCIpKTtcbiAgfVxuICBlbHNlIHtcbiAgICB2YXIgY2xpZW50O1xuICAgIHZhciBkYjtcbiAgICB0cnkge1xuICAgICAgY29uc29sZS5sb2coXCJDb25uZWN0IHRvIE1vbmdvREJcIik7XG4gICAgICBjbGllbnQgPSBhd2FpdCBNb25nb0NsaWVudC5jb25uZWN0KHVybCwgeyB1c2VOZXdVcmxQYXJzZXI6IHRydWUgfSk7XG4gICAgICBkYiA9IGNsaWVudC5kYih0YXJnZXREQik7XG4gICAgICBjb25zb2xlLmxvZyhcIldyaXRpbmcgcmVzdWx0cyB0b1wiLCB0YXJnZXRDb2xsZWN0aW9uKTtcbiAgICAgIHJldHVybihhd2FpdCBkYi5jb2xsZWN0aW9uKHRhcmdldENvbGxlY3Rpb24pLmluc2VydE9uZShkYXRhVG9Xcml0ZSkpO1xuICAgIH1cbiAgICBjYXRjaChlcnIpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiRXJyb3IgY2FsbGluZyBpbnNlcnRPbmUgb24gdGhlIERCOlwiLCBlcnIubWVzc2FnZSk7XG4gICAgICByZWplY3QobmV3IEVycm9yKFwiRXJyb3Igd3JpdGluZyB0byBEQi5cIikpO1xuICAgIH1cbiAgICBmaW5hbGx5IHtcbiAgICAgICAgaWYoY2xpZW50IT09dW5kZWZpbmVkKVxuICAgICAgICAgIGNsaWVudC5jbG9zZSgpO1xuICAgIH1cbiAgfVxuICB9KTtcbn1cblxuLyogcmVtb3ZlQ29sbGVjdGlvbkZyb21Nb25nbygpXG4gKiBkZXNjOiBSZW1vdmVzIGFuIGVudGlyZSBjb2xsZWN0aW9uIGZyb20gdGhlIGRhdGFiYXNlLlxuICogcGFyYW06IHRhcmdldENvbGxlY3Rpb24gLSB0aGUgY29sbGVjdGlvbiB0byByZW1vdmUuXG4gKlxuICovXG5hc3luYyBmdW5jdGlvbiByZW1vdmVDb2xsZWN0aW9uRnJvbU1vbmdvKHRhcmdldERCLCB0YXJnZXRDb2xsZWN0aW9uKSB7XG5cbiAgdmFyIHVybCA9IHByb2Nlc3MuZW52LlVSTENyeXB0bztcbiAgaWYgKHVybD09dW5kZWZpbmVkIHx8IHVybD09PVwiXCIpIHtcbiAgICBjb25zb2xlLmxvZyhcIk1vbmdvREIgdXJsIG5vdCBzZXQgaW4gdGhlIGVudmlyb25tZW50LlwiKTtcbiAgICBjb25zb2xlLmxvZyhcIlRyeSBydW5uaW5nIHNvdXJjZSBTZXRNb25nb0Vudi5zaCBwcmlvciB0byBydW5uaW5nIHRoaXMuXCIpO1xuICB9XG4gIGVsc2Uge1xuICAgIHZhciBjbGllbnQ7XG4gICAgdmFyIGRiO1xuICAgIHRyeSB7XG4gICAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3QgdG8gTW9uZ29EQlwiKTtcbiAgICAgIGNsaWVudCA9IGF3YWl0IE1vbmdvQ2xpZW50LmNvbm5lY3QodXJsLCB7IHVzZU5ld1VybFBhcnNlcjogdHJ1ZSB9KTtcbiAgICAgIGRiID0gY2xpZW50LmRiKHRhcmdldERCKTtcbiAgICAgIGNvbnNvbGUubG9nKFwiRGVsZXRpbmcgcHJpb3IgZGF0YSBpblwiLCB0YXJnZXRDb2xsZWN0aW9uKTtcbiAgICAgIGF3YWl0IGRiLmNvbGxlY3Rpb24odGFyZ2V0Q29sbGVjdGlvbikucmVtb3ZlKCk7XG4gICAgfVxuICAgIGNhdGNoKGVycikge1xuICAgICAgY29uc29sZS5sb2coXCJFcnJvciB3cml0aW5nIHRvIERCOlwiLCBlcnIpO1xuICAgIH1cbiAgICBmaW5hbGx5IHtcbiAgICAgICAgY2xpZW50LmNsb3NlKCk7XG4gICAgfVxuICB9XG59XG5cblxuLyogb25lVGltZVVwZGF0ZSgpXG4gKiBkZXNjOiBSZWFkcyBhIGNvbGxlY3Rpb24gaW4gYW5kIGFkZHMgYSB0aW1lU3RhbXAgdG8gZWFjaCByZWNvcmQuXG4gKiBwYXJhbTogdGFyZ2V0Q29sbGVjdGlvbiAtIHRoZSBjb2xsZWN0aW9uIHRvIHJlbW92ZS5cbiAqXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIG9uZVRpbWVVcGRhdGUodGFyZ2V0REIsIHRhcmdldENvbGxlY3Rpb24pIHtcblxuICB2YXIgdXJsID0gcHJvY2Vzcy5lbnYuVVJMQ3J5cHRvO1xuICBpZiAodXJsPT11bmRlZmluZWQgfHwgdXJsPT09XCJcIikge1xuICAgIGNvbnNvbGUubG9nKFwiTW9uZ29EQiB1cmwgbm90IHNldCBpbiB0aGUgZW52aXJvbm1lbnQuXCIpO1xuICAgIGNvbnNvbGUubG9nKFwiVHJ5IHJ1bm5pbmcgc291cmNlIFNldE1vbmdvRW52LnNoIHByaW9yIHRvIHJ1bm5pbmcgdGhpcy5cIik7XG4gIH1cbiAgZWxzZSB7XG4gICAgdmFyIGNsaWVudDtcbiAgICB2YXIgZGI7XG4gICAgdHJ5IHtcbiAgICAgIGNsaWVudCA9IGF3YWl0IE1vbmdvQ2xpZW50LmNvbm5lY3QodXJsLCB7IHVzZU5ld1VybFBhcnNlcjogdHJ1ZSB9KTtcbiAgICAgIGRiID0gY2xpZW50LmRiKHRhcmdldERCKTtcbiAgICAgIGNvbnN0IHNvdXJjZURhdGEgPSBhd2FpdCBkYi5jb2xsZWN0aW9uKHRhcmdldENvbGxlY3Rpb24pLmZpbmQoe30pLnRvQXJyYXkoKTtcbiAgICAgIGNvbnN0IG1vZGlmaWVkRGF0YSA9IHNvdXJjZURhdGEubWFwKGVsZW1lbnQgPT4ge1xuICAgICAgICBsZXQgdHNTdHJpbmcgPSBlbGVtZW50LnRpbWVTdGFtcDtcbiAgICAgICAgbGV0IHRzID0gbmV3IERhdGUoZWxlbWVudC50aW1lU3RhbXApO1xuICAgICAgICBsZXQgdHNJbnRlZ2VyID0gdHMuZ2V0VGltZSgpLzEwMDA7XG4gICAgICAgIGNvbnNvbGUubG9nKHRzU3RyaW5nLCBcIiBcIiwgdHMsIFwiIFwiLCB0c0ludGVnZXIpO1xuICAgICAgICBlbGVtZW50LnRpbWUgPSB0c0ludGVnZXI7XG4gICAgICAgIHJldHVybihlbGVtZW50KTtcbiAgICAgIH0pO1xuICAgICAgbW9kaWZpZWREYXRhLm1hcChhc3luYyBlbGVtZW50ID0+IHtcbiAgICAgICAgY29uc3Qga2V5ID0ge1xuICAgICAgICAgIGtleTogZWxlbWVudC5rZXlcbiAgICAgICAgfTtcbiAgICAgICAgY29uc29sZS5sb2coXCJVcGRhdGluZyByZWNvcmQ6XCIsIGVsZW1lbnQpO1xuICAgICAgICBhd2FpdCBkYi5jb2xsZWN0aW9uKHRhcmdldENvbGxlY3Rpb24pLnVwZGF0ZU9uZShrZXksIHskc2V0OiBlbGVtZW50fSk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgY2F0Y2goZXJyKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIkVycm9yIGR1cmluZyBvbmVUaW1lVXBkYXRlOlwiLCBlcnIpO1xuICAgIH0gXG4gICAgZmluYWxseSB7XG4gICAgICBjbGllbnQuY2xvc2UoKTtcbiAgICB9XG4gIH1cbn0gXG5cbmFzeW5jIGZ1bmN0aW9uIGdldEVudGlyZUNvbGxlY3Rpb24odGFyZ2V0REIsIHRhcmdldENvbGxlY3Rpb24sIGdyb3VwQnkpIHtcbiAgdmFyIHVybCA9IHByb2Nlc3MuZW52LlVSTENyeXB0bztcbiAgaWYgKHVybD09dW5kZWZpbmVkIHx8IHVybD09PVwiXCIpIHtcbiAgICBjb25zb2xlLmxvZyhcIk1vbmdvREIgdXJsIG5vdCBzZXQgaW4gdGhlIGVudmlyb25tZW50LlwiKTtcbiAgICBjb25zb2xlLmxvZyhcIlRyeSBydW5uaW5nIHNvdXJjZSBTZXRNb25nb0Vudi5zaCBwcmlvciB0byBydW5uaW5nIHRoaXMuXCIpO1xuICB9XG4gIGVsc2Uge1xuICAgIHZhciBjbGllbnQ7XG4gICAgdmFyIGRiO1xuICAgIHRyeSB7XG4gICAgICBjbGllbnQgPSBhd2FpdCBNb25nb0NsaWVudC5jb25uZWN0KHVybCwgeyB1c2VOZXdVcmxQYXJzZXI6IHRydWUgfSk7XG4gICAgICBkYiA9IGNsaWVudC5kYih0YXJnZXREQik7XG4gICAgICB2YXIgbXlzb3J0ID0geyB0aW1lOiAxIH07XG4gICAgICBsZXQgZGJSZXN1bHRzID0ge307XG4gICAgICBpZiAoZ3JvdXBCeSkge1xuICAgICAgICBkYlJlc3VsdHMgPSBhd2FpdCBkYi5jb2xsZWN0aW9uKHRhcmdldENvbGxlY3Rpb24pLmFnZ3JlZ2F0ZShncm91cEJ5KS50b0FycmF5KCk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgZGJSZXN1bHRzID0gYXdhaXQgZGIuY29sbGVjdGlvbih0YXJnZXRDb2xsZWN0aW9uKS5maW5kKHt9KS5zb3J0KG15c29ydCkudG9BcnJheSgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuKGRiUmVzdWx0cyk7XG4gICAgfVxuICAgIGNhdGNoKGVycikge1xuICAgICAgY29uc29sZS5sb2coXCJFcnJvciBkdXJpbmcgZ2V0RW50aXJlQ29sbGVjdGlvbjpcIiwgZXJyKTtcbiAgICB9IFxuICAgIGZpbmFsbHkge1xuICAgICAgY2xpZW50LmNsb3NlKCk7XG4gICAgfVxuICB9IFxufSBcblxuZXhwb3J0IHt1cGRhdGVSZXN1bHRzSW5Nb25nbywgd3JpdGVSZXN1bHRzVG9Nb25nbywgZ2V0TW9zdFJlY2VudEVUSERhdGEsIFxuICByZW1vdmVDb2xsZWN0aW9uRnJvbU1vbmdvLCB3cml0ZVJlc3VsdHNUb01vbmdvU3luYywgb25lVGltZVVwZGF0ZSxcbiAgZ2V0RW50aXJlQ29sbGVjdGlvbn07XG4iXX0=