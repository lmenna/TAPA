"use strict";

require("@babel/polyfill");

var _googleLoader = require("./loaders/googleLoader");

var _mongodb = require("mongodb");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

/* LoadGoogleDataIntoMongo()
 * desc: Gets data from BigQuery, formats the data and saves it to MongoDB
 *
 */
function readGoogleData() {
  return _readGoogleData.apply(this, arguments);
}
/* writeResultsToMongo()
 * desc: Writes results from the google BigQuery into MongoDB on the cloud
 * param: results - the formatted big query results.
 *
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

function writeResultsToMongo(_x) {
  return _writeResultsToMongo.apply(this, arguments);
}
/* readFromMongo()
 * desc: Reads previously stored results from MongoDB
 *
 */


function _writeResultsToMongo() {
  _writeResultsToMongo = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2(results) {
    var url;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            url = "mongodb://" + process.env.mongoU + ":" + process.env.mongoP + "@" + process.env.host + "/ethereum";
            console.log("Connect to Mongo");

            _mongodb.MongoClient.connect(url, function (err, db) {
              if (err) {
                console.log('Unable to connect to the DB server', err);
              } else {
                console.log('Connection established');

                try {
                  var collection = db.collection('marketdata.eth_transactions'); // await collection.insert({"name": "value"});

                  db.collection("marketdata.eth_transactions").insertOne(results, function (err, res) {
                    if (err) throw err;
                    console.log("Result was inserted");
                    db.close();
                  });
                } catch (e) {
                  console.log("Error:", e);
                }
              }
            });

          case 3:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));
  return _writeResultsToMongo.apply(this, arguments);
}

function readFromMongo() {
  var url = "mongodb://" + process.env.mongoU + ":" + process.env.mongoP + "@" + process.env.host + "/ethereum";

  _mongodb.MongoClient.connect(url, function (err, db) {
    if (err) {
      console.log('Unable to connect to the DB server', err);
    } else {
      console.log('Connection established');
      var collection = db.collection("marketdata.eth_transactions");
      collection.find({}).toArray(function (err, result) {
        if (err) {
          console.log("Error retrieving data. ", err);
        } else if (result.length) {
          result.map(function (item) {
            console.log(item);
          });
        } else {
          console.log("No documents found");
        }

        db.close();
      });
    }
  });
}

function dataLoadAndSave() {
  return _dataLoadAndSave.apply(this, arguments);
}

function _dataLoadAndSave() {
  _dataLoadAndSave = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee3() {
    var results;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return readGoogleData();

          case 2:
            results = _context3.sent;

            if (results === undefined) {
              console.log("No data was returned from BigQuery");
            } else if (results.data.length > 0) {
              console.log("Got good results. Write them to MongoDB");
              writeResultsToMongo(results);
            }

          case 4:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));
  return _dataLoadAndSave.apply(this, arguments);
}

dataLoadAndSave();
//# sourceMappingURL=app.js.map