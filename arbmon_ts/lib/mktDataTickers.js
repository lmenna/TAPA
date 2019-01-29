"use strict";

var _getCryptoData = require("./utils/getCryptoData");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

/* mktDataTickers.ts
 * desc: Utility program that downloads market data from exchanges and finds all overlapping tickers.
 *       The first set of ticker symbol compares are between Poloniex and Bittrex.
 */
require("@babel/polyfill");

var poloniexURL = "https://poloniex.com/public?command=returnTicker";
var bittrexURLAll = "https://bittrex.com/api/v1.1/public/getmarketsummaries";

function runTickerCompare() {
  return _runTickerCompare.apply(this, arguments);
}

function _runTickerCompare() {
  _runTickerCompare = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee() {
    var poloniexData, poloniexJSON, bittrexALL, bittrexJSON, bittrexResults, btcMatch, ethMatch, usdtMatch;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return (0, _getCryptoData.getExchangeData)(poloniexURL);

          case 2:
            poloniexData = _context.sent;
            poloniexJSON = JSON.parse(poloniexData.exchangeData);
            console.log("Poloniex:", poloniexJSON); // Bittrex section - All coins from one request.

            _context.next = 7;
            return (0, _getCryptoData.getExchangeData)(bittrexURLAll);

          case 7:
            bittrexALL = _context.sent;
            bittrexJSON = JSON.parse(bittrexALL.exchangeData); //console.log("Bittrex:", bittrexJSON);

            bittrexResults = bittrexJSON.result;
            btcMatch = [];
            ethMatch = [];
            usdtMatch = [];
            bittrexResults.forEach(function (bittrexElement) {
              var poloTicker = getPoloTicker(bittrexElement.MarketName);

              if (poloniexJSON[poloTicker]) {
                var bittrexSplit = bittrexElement.MarketName.split("-");

                if (bittrexSplit[0] === "BTC") {
                  btcMatch.push(bittrexSplit[1]);
                }

                if (bittrexSplit[0] === "ETH") {
                  ethMatch.push(bittrexSplit[1]);
                }

                if (bittrexSplit[0] === "USDT") {
                  usdtMatch.push(bittrexSplit[1]);
                }

                console.log("Match:", bittrexElement.MarketName, " ", poloTicker);
              }
            });
            process.stdout.write("BTC: [");
            btcMatch.map(function (elem) {
              return process.stdout.write("\"" + elem + "\"" + ",");
            });
            process.stdout.write("]\n");
            process.stdout.write("ETH: [");
            ethMatch.map(function (elem) {
              return process.stdout.write("\"" + elem + "\"" + ",");
            });
            process.stdout.write("]\n");
            process.stdout.write("USDT: [");
            usdtMatch.map(function (elem) {
              return process.stdout.write("\"" + elem + "\"" + ",");
            });
            process.stdout.write("]\n");

          case 23:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _runTickerCompare.apply(this, arguments);
}

function getPoloTicker(bittrexTicker) {
  var bittrexSplit = bittrexTicker.split("-");
  return bittrexSplit[0] + "_" + bittrexSplit[1];
}

runTickerCompare();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9ta3REYXRhVGlja2Vycy50cyJdLCJuYW1lcyI6WyJyZXF1aXJlIiwicG9sb25pZXhVUkwiLCJiaXR0cmV4VVJMQWxsIiwicnVuVGlja2VyQ29tcGFyZSIsInBvbG9uaWV4RGF0YSIsInBvbG9uaWV4SlNPTiIsIkpTT04iLCJwYXJzZSIsImV4Y2hhbmdlRGF0YSIsImNvbnNvbGUiLCJsb2ciLCJiaXR0cmV4QUxMIiwiYml0dHJleEpTT04iLCJiaXR0cmV4UmVzdWx0cyIsInJlc3VsdCIsImJ0Y01hdGNoIiwiZXRoTWF0Y2giLCJ1c2R0TWF0Y2giLCJmb3JFYWNoIiwiYml0dHJleEVsZW1lbnQiLCJwb2xvVGlja2VyIiwiZ2V0UG9sb1RpY2tlciIsIk1hcmtldE5hbWUiLCJiaXR0cmV4U3BsaXQiLCJzcGxpdCIsInB1c2giLCJwcm9jZXNzIiwic3Rkb3V0Iiwid3JpdGUiLCJtYXAiLCJlbGVtIiwiYml0dHJleFRpY2tlciJdLCJtYXBwaW5ncyI6Ijs7QUFPQTs7Ozs7O0FBUEE7Ozs7QUFLQUEsT0FBTyxDQUFDLGlCQUFELENBQVA7O0FBSUEsSUFBTUMsV0FBbUIsR0FBRyxrREFBNUI7QUFDQSxJQUFNQyxhQUFxQixHQUFHLHdEQUE5Qjs7U0FHZUMsZ0I7Ozs7Ozs7MEJBQWY7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxtQkFFMkIsb0NBQWdCRixXQUFoQixDQUYzQjs7QUFBQTtBQUVNRyxZQUFBQSxZQUZOO0FBR1FDLFlBQUFBLFlBSFIsR0FHdUJDLElBQUksQ0FBQ0MsS0FBTCxDQUFXSCxZQUFZLENBQUNJLFlBQXhCLENBSHZCO0FBSUVDLFlBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLFdBQVosRUFBeUJMLFlBQXpCLEVBSkYsQ0FLRTs7QUFMRjtBQUFBLG1CQU15QixvQ0FBZ0JILGFBQWhCLENBTnpCOztBQUFBO0FBTU1TLFlBQUFBLFVBTk47QUFPTUMsWUFBQUEsV0FQTixHQU9vQk4sSUFBSSxDQUFDQyxLQUFMLENBQVdJ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LnRzXG4gKiBkZXNjOiBVdGlsaXR5IHByb2dyYW0gdGhhdCBkb3dubG9hZHMgbWFya2V0IGRhdGEgZnJvbSBleGNoYW5nZXMgYW5kIGZpbmRzIGFsbCBvdmVybGFwcGluZyB0aWNrZXJzLlxuICogICAgICAgVGhlIGZpcnN0IHNldCBvZiB0aWNrZXIgc3ltYm9sIGNvbXBhcmVzIGFyZSBiZXR3ZWVuIFBvbG9uaWV4IGFuZCBCaXR0cmV4LlxuICovXG5cbnJlcXVpcmUoXCJAYmFiZWwvcG9seWZpbGxcIik7XG5cbmltcG9ydCB7Z2V0RXhjaGFuZ2VEYXRhfSBmcm9tIFwiLi91dGlscy9nZXRDcnlwdG9EYXRhXCI7XG5cbmNvbnN0IHBvbG9uaWV4VVJMOiBzdHJpbmcgPSBcImh0dHBzOi8vcG9sb25pZXguY29tL3B1YmxpYz9jb21tYW5kPXJldHVyblRpY2tlclwiOyBcbmNvbnN0IGJpdHRyZXhVUkxBbGw6IHN0cmluZyA9IFwiaHR0cHM6Ly9iaXR0cmV4LmNvbS9hcGkvdjEuMS9wdWJsaWMvZ2V0bWFya2V0c3VtbWFyaWVzXCI7XG5cblxuYXN5bmMgZnVuY3Rpb24gcnVuVGlja2VyQ29tcGFyZSgpIHtcbiAgLy8gUG9sb25pZXggc2VjdGlvbiAtIEFsbCBjb2lucyBmcm9tIG9uZSByZXF1ZXN0XG4gIGxldCBwb2xvbmlleERhdGEgPSBhd2FpdCBnZXRFeGNoYW5nZURhdGEocG9sb25pZXhVUkwpO1xuICBjb25zdCBwb2xvbmlleEpTT04gPSBKU09OLnBhcnNlKHBvbG9uaWV4RGF0YS5leGNoYW5nZURhdGEpO1xuICBjb25zb2xlLmxvZyhcIlBvbG9uaWV4OlwiLCBwb2xvbmlleEpTT04pO1xuICAvLyBCaXR0cmV4IHNlY3Rpb24gLSBBbGwgY29pbnMgZnJvbSBvbmUgcmVxdWVzdC5cbiAgbGV0IGJpdHRyZXhBTEwgPSBhd2FpdCBnZXRFeGNoYW5nZURhdGEoYml0dHJleFVSTEFsbCk7XG4gIGxldCBiaXR0cmV4SlNPTiA9IEpTT04ucGFyc2UoYml0dHJleEFMTC5leGNoYW5nZURhdGEpO1xuICAvL2NvbnNvbGUubG9nKFwiQml0dHJleDpcIiwgYml0dHJleEpTT04pO1xuICBjb25zdCBiaXR0cmV4UmVzdWx0czogQXJyYXk8YW55PiA9IGJpdHRyZXhKU09OLnJlc3VsdDtcbiAgbGV0IGJ0Y01hdGNoOiBBcnJheTxzdHJpbmc+ID0gW107XG4gIGxldCBldGhNYXRjaDogQXJyYXk8c3RyaW5nPiA9IFtdO1xuICBsZXQgdXNkdE1hdGNoOiBBcnJheTxzdHJpbmc+ID0gW107XG4gIGJpdHRyZXhSZXN1bHRzLmZvckVhY2goIChiaXR0cmV4RWxlbWVudCkgPT4ge1xuICAgIGNvbnN0IHBvbG9UaWNrZXIgPSBnZXRQb2xvVGlja2VyKGJpdHRyZXhFbGVtZW50Lk1hcmtldE5hbWUpO1xuICAgIGlmKHBvbG9uaWV4SlNPTltwb2xvVGlja2VyXSkge1xuICAgICAgbGV0IGJpdHRyZXhTcGxpdCA9IGJpdHRyZXhFbGVtZW50Lk1hcmtldE5hbWUuc3BsaXQoXCItXCIpO1xuICAgICAgaWYgKGJpdHRyZXhTcGxpdFswXT09PVwiQlRDXCIpe1xuICAgICAgICBidGNNYXRjaC5wdXNoKGJpdHRyZXhTcGxpdFsxXSk7XG4gICAgICB9XG4gICAgICBpZiAoYml0dHJleFNwbGl0WzBdPT09XCJFVEhcIil7XG4gICAgICAgIGV0aE1hdGNoLnB1c2goYml0dHJleFNwbGl0WzFdKTtcbiAgICAgIH1cbiAgICAgIGlmIChiaXR0cmV4U3BsaXRbMF09PT1cIlVTRFRcIil7XG4gICAgICAgIHVzZHRNYXRjaC5wdXNoKGJpdHRyZXhTcGxpdFsxXSk7XG4gICAgICB9XG4gICAgICBjb25zb2xlLmxvZyhcIk1hdGNoOlwiLCBiaXR0cmV4RWxlbWVudC5NYXJrZXROYW1lLCBcIiBcIiwgcG9sb1RpY2tlcik7XG4gICAgfVxuICB9KTtcbiAgcHJvY2Vzcy5zdGRvdXQud3JpdGUoXCJCVEM6IFtcIik7XG4gIGJ0Y01hdGNoLm1hcCgoZWxlbSkgPT4gcHJvY2Vzcy5zdGRvdXQud3JpdGUoXCJcXFwiXCIrZWxlbStcIlxcXCJcIitcIixcIikpO1xuICBwcm9jZXNzLnN0ZG91dC53cml0ZShcIl1cXG5cIik7XG4gIHByb2Nlc3Muc3Rkb3V0LndyaXRlKFwiRVRIOiBbXCIpO1xuICBldGhNYXRjaC5tYXAoKGVsZW0pID0+IHByb2Nlc3Muc3Rkb3V0LndyaXRlKFwiXFxcIlwiK2VsZW0rXCJcXFwiXCIrXCIsXCIpKTtcbiAgcHJvY2Vzcy5zdGRvdXQud3JpdGUoXCJdXFxuXCIpO1xuICBwcm9jZXNzLnN0ZG91dC53cml0ZShcIlVTRFQ6IFtcIik7XG4gIHVzZHRNYXRjaC5tYXAoKGVsZW0pID0+IHByb2Nlc3Muc3Rkb3V0LndyaXRlKFwiXFxcIlwiK2VsZW0rXCJcXFwiXCIrXCIsXCIpKTtcbiAgcHJvY2Vzcy5zdGRvdXQud3JpdGUoXCJdXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBnZXRQb2xvVGlja2VyKGJpdHRyZXhUaWNrZXIgOiBzdHJpbmcpOiBzdHJpbmcge1xuXG4gIGxldCBiaXR0cmV4U3BsaXQgPSBiaXR0cmV4VGlja2VyLnNwbGl0KFwiLVwiKTtcbiAgcmV0dXJuKGJpdHRyZXhTcGxpdFswXSArIFwiX1wiICsgYml0dHJleFNwbGl0WzFdKTtcbn1cblxucnVuVGlja2VyQ29tcGFyZSgpO1xuXG5cblxuXG5cblxuIl19