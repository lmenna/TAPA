"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.loadPricingData = loadPricingData;

var _request = _interopRequireDefault(require("request"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var urlForPrices = "https://etherscan.io/chart/etherprice?output=csv";

function loadPricingData() {
  return _loadPricingData.apply(this, arguments);
}

function _loadPricingData() {
  _loadPricingData = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee() {
    var pricingData;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt("return", new Promise(function (resolve, reject) {
              (0, _request.default)({
                uri: urlForPrices,
                method: "GET",
                timeout: 10000,
                followRedirect: true,
                maxRedirects: 10
              }, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                  resolve(body);
                } else {
                  reject(error);
                }
              });
            }));

          case 1:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _loadPricingData.apply(this, arguments);
}
//# sourceMappingURL=etherscanLoader.js.map