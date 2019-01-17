"use strict";

var _dbUtils = require("../utils/dbUtils");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var express = require('express');

var path = require('path');

var appRouter = function appRouter(app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
  var dirname = "/usr/local/dist/arbmon/";
  app.use(express.static(path.join(dirname, 'build-ui')));
  app.get('/', function (req, res) {
    res.sendFile(path.join(dirname, 'build-ui', 'index.html'));
  }); // app.get("/", function(req, res) {
  //   res.status(200).send("Welcome to our restful API");
  // });
  // Route to query mongoDB for arbitrage data.

  app.get("/arbdata",
  /*#__PURE__*/
  function () {
    var _ref = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee(req, res) {
      var data;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              console.log("Calling getArbitrageData");
              _context.next = 3;
              return (0, _dbUtils.getArbitrageData)();

            case 3:
              data = _context.sent;
              res.status(200).send(data);

            case 5:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    return function (_x, _x2) {
      return _ref.apply(this, arguments);
    };
  }());
};

module.exports = appRouter;
//# sourceMappingURL=routes.js.map