"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getCcyPairsAlertHistory = getCcyPairsAlertHistory;

var _dbUtils = require("./dbUtils");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function getCcyPairsAlertHistory() {
  return _getCcyPairsAlertHistory.apply(this, arguments);
}

function _getCcyPairsAlertHistory() {
  _getCcyPairsAlertHistory = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee() {
    var groupBy, ccyPairAlerts, groupedData;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            groupBy = [{
              $group: {
                _id: "$ccyPair",
                num_alerts: {
                  $sum: 1
                }
              }
            }];
            _context.next = 3;
            return (0, _dbUtils.getEntireCollection)("crypto", "marketdata.arbmonhist");

          case 3:
            ccyPairAlerts = _context.sent;
            groupedData = {};
            ccyPairAlerts.map(function (curElem) {
              var date = new Date(curElem.timeStamp);
              var dateStr = date.getFullYear() + "-" + date.getMonth() + 1 + "-" + date.getDate();

              if (!groupedData[curElem.ccyPair]) {
                groupedData[curElem.ccyPair] = {};
              }

              if (!groupedData[curElem.ccyPair][dateStr]) {
                groupedData[curElem.ccyPair][dateStr] = {
                  count: 0
                };
              }

              groupedData[curElem.ccyPair][dateStr].count++;
            });
            console.log(groupedData);

          case 7:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _getCcyPairsAlertHistory.apply(this, arguments);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9kYkFuYWx5dGljcy50cyJdLCJuYW1lcyI6WyJnZXRDY3lQYWlyc0FsZXJ0SGlzdG9yeSIsImdyb3VwQnkiLCIkZ3JvdXAiLCJfaWQiLCJudW1fYWxlcnRzIiwiJHN1bSIsImNjeVBhaXJBbGVydHMiLCJncm91cGVkRGF0YSIsIm1hcCIsImN1ckVsZW0iLCJkYXRlIiwiRGF0ZSIsInRpbWVTdGFtcCIsImRhdGVTdHIiLCJnZXRGdWxsWWVhciIsImdldE1vbnRoIiwiZ2V0RGF0ZSIsImNjeVBhaXIiLCJjb3VudCIsImNvbnNvbGUiLCJsb2ciXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFNQTs7Ozs7O1NBR2VBLHVCOzs7Ozs7OzBCQUFmO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUVRQyxZQUFBQSxPQUZSLEdBRThCLENBQzFCO0FBQUNDLGNBQUFBLE1BQU0sRUFBRztBQUFDQyxnQkFBQUEsR0FBRyxFQUFHLFVBQVA7QUFBbUJDLGdCQUFBQSxVQUFVLEVBQUc7QUFBQ0Msa0JBQUFBLElBQUksRUFBRztBQUFSO0FBQWhDO0FBQVYsYUFEMEIsQ0FGOUI7QUFBQTtBQUFBLG1CQUs4QixrQ0FBb0IsUUFBcEIsRUFBOEIsdUJBQTlCLENBTDlCOztBQUFBO0FBS1FDLFlBQUFBLGFBTFI7QUFNTUMsWUFBQUEsV0FOTixHQU15QixFQU56QjtBQU9FRCxZQUFBQSxhQUFhLENBQUNFLEdBQWQsQ0FBa0IsVUFBQ0MsT0FBRCxFQUFrQjtBQUNuQyxrQkFBSUMsSUFBSSxHQUFHLElBQUlDLElBQUosQ0FBU0YsT0FBTyxDQUFDRyxTQUFqQixDQUFYO0FBQ0Msa0JBQUlDLE9BQU8sR0FBR0gsSUFBSSxDQUFDSSxXQUFMLEtBQXFCLEdBQXJCLEdBQTJCSixJQUFJLENBQUNLLFFBQUwsRUFBM0IsR0FBMkMsQ0FBM0MsR0FBK0MsR0FBL0MsR0FBcURMLElBQUksQ0FBQ00sT0FBTCxFQUFuRTs7QUFDQSxrQkFBSSxDQUFDVCxXQUFXLENBQUNFLE9BQU8sQ0FBQ1EsT0FBVCxDQUFoQixFQUFrQztBQUNoQ1YsZ0JBQUFBLFdBQVcsQ0FBQ0UsT0FBTyxDQUFDUSxPQUFULENBQVgsR0FBK0IsRUFBL0I7QUFFRDs7QUFDRCxrQkFBRyxDQUFDVixXQUFXLENBQUNFLE9BQU8sQ0FBQ1EsT0FBVCxDQUFYLENBQTZCSixPQUE3QixDQUFKLEVBQTJDO0FBQ3pDTixnQkFBQUEsV0FBVyxDQUFDRSxPQUFPLENBQUNRLE9BQVQsQ0FBWCxDQUE2QkosT0FBN0IsSUFBd0M7QUFDcENLLGtCQUFBQSxLQUFLLEVBQUU7QUFENkIsaUJBQXhDO0FBR0Q7O0FBQ0RYLGNBQUFBLFdBQVcsQ0FBQ0UsT0FBTyxDQUFDUSxPQUFULENBQVgsQ0FBNkJKLE9BQTdCLEVBQXNDSyxLQUF0QztBQUNELGFBYkQ7QUFjQUMsWUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVliLFdBQVo7O0FBckJGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEciLCJzb3VyY2VzQ29udGVudCI6WyIvKiBkYkFuYWx5dGljcy50c1xuICogZGVzYzogUm91dGluZXMgdG8gcGVyZm9ybSBhbmFseXNpcyBvbiBkYXRhIGluIHRoZSBNb25nb0RCLlxuICogRGVzaWduZWQgdG8gd29yayBmcm9tIG5vZGUgYnkgZGlyZWN0bHkgYWNjZXNzaW5nIHRoZSBkYXRhYmFzZS5cbiAqXG4qL1xuXG5pbXBvcnQge2dldEVudGlyZUNvbGxlY3Rpb259IGZyb20gXCIuL2RiVXRpbHNcIjtcbmltcG9ydCB7IGRlZmxhdGVTeW5jIH0gZnJvbSBcInpsaWJcIjtcblxuYXN5bmMgZnVuY3Rpb24gZ2V0Q2N5UGFpcnNBbGVydEhpc3RvcnkoKTpQcm9taXNlPGFueT4ge1xuXG4gIGNvbnN0IGdyb3VwQnk6IEFycmF5PGFueT4gPSBbXG4gICAgeyRncm91cCA6IHtfaWQgOiBcIiRjY3lQYWlyXCIsIG51bV9hbGVydHMgOiB7JHN1bSA6IDF9fX1cbiAgXVxuICBjb25zdCBjY3lQYWlyQWxlcnRzID0gYXdhaXQgZ2V0RW50aXJlQ29sbGVjdGlvbihcImNyeXB0b1wiLCBcIm1hcmtldGRhdGEuYXJibW9uaGlzdFwiKTsgXG4gIGxldCBncm91cGVkRGF0YTogYW55ID0ge307XG4gIGNjeVBhaXJBbGVydHMubWFwKChjdXJFbGVtOiBhbnkpID0+IHtcbiAgIGxldCBkYXRlID0gbmV3IERhdGUoY3VyRWxlbS50aW1lU3RhbXApO1xuICAgIGxldCBkYXRlU3RyID0gZGF0ZS5nZXRGdWxsWWVhcigpICsgXCItXCIgKyBkYXRlLmdldE1vbnRoKCkrMSArIFwiLVwiICsgZGF0ZS5nZXREYXRlKCk7XG4gICAgaWYgKCFncm91cGVkRGF0YVtjdXJFbGVtLmNjeVBhaXJdKXtcbiAgICAgIGdyb3VwZWREYXRhW2N1ckVsZW0uY2N5UGFpcl0gPSB7XG4gICAgICB9XG4gICAgfSAgICAgIFxuICAgIGlmKCFncm91cGVkRGF0YVtjdXJFbGVtLmNjeVBhaXJdW2RhdGVTdHJdKSB7XG4gICAgICBncm91cGVkRGF0YVtjdXJFbGVtLmNjeVBhaXJdW2RhdGVTdHJdID0ge1xuICAgICAgICAgIGNvdW50OiAwXG4gICAgICB9XG4gICAgfVxuICAgIGdyb3VwZWREYXRhW2N1ckVsZW0uY2N5UGFpcl1bZGF0ZVN0cl0uY291bnQrKztcbiAgfSk7XG4gIGNvbnNvbGUubG9nKGdyb3VwZWREYXRhKTtcbn0gXG5cbmV4cG9ydCB7Z2V0Q2N5UGFpcnNBbGVydEhpc3Rvcnl9O1xuIl19