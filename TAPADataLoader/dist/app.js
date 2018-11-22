"use strict";

require("@babel/polyfill");

var _googleLoader = require("./loaders/googleLoader");

var _mongodb = require("mongodb");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

// var mongodb = require('mongodb');
function LoadGoogleDataIntoMongo() {
  return _LoadGoogleDataIntoMongo.apply(this, arguments);
}

function _LoadGoogleDataIntoMongo() {
  _LoadGoogleDataIntoMongo = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee() {
    var result;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return (0, _googleLoader.getBigQueryData)(query);

          case 3:
            result = _context.sent;

            if (result.data.length > 0) {
              console.log(result);
              readFromMongo();
            }

            _context.next = 10;
            break;

          case 7:
            _context.prev = 7;
            _context.t0 = _context["catch"](0);
            console.log("Error:", _context.t0);

          case 10:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[0, 7]]);
  }));
  return _LoadGoogleDataIntoMongo.apply(this, arguments);
}

function readFromMongo() {
  console.log("Connecting to Mongo as USER:", process.env.mongoU);
  var url = "mongodb://" + process.env.mongoU + ":" + process.env.mongoP + "@" + process.env.host + "/ethereum";

  _mongodb.MongoClient.connect(url, function (err, db) {
    if (err) {
      console.log('Unable to connect to the DB server', err);
    } else {
      console.log('Connection established');
      var collection = db.collection('samplesite.students');
      collection.find({}).toArray(function (err, result) {
        if (err) {
          console.log("Error retrieving data. ", err);
        } else if (result.length) {
          console.log("result:", result);
        } else {
          console.log("No documents found");
        }

        db.close();
      });
    }
  });
}

var query = (0, _googleLoader.getQuery)();
console.log((0, _googleLoader.getQuery)());
LoadGoogleDataIntoMongo();
//# sourceMappingURL=app.js.map