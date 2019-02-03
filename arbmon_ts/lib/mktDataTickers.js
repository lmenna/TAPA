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
var hitbtcURL = "https://api.hitbtc.com/api/2/public/ticker";

function runPoloBittrexTickerCompare() {
  return _runPoloBittrexTickerCompare.apply(this, arguments);
}

function _runPoloBittrexTickerCompare() {
  _runPoloBittrexTickerCompare = _asyncToGenerator(
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
            poloniexJSON = JSON.parse(poloniexData.exchangeData); //console.log("Poloniex:", poloniexJSON);
            // Bittrex section - All coins from one request.

            _context.next = 6;
            return (0, _getCryptoData.getExchangeData)(bittrexURLAll);

          case 6:
            bittrexALL = _context.sent;
            bittrexJSON = JSON.parse(bittrexALL.exchangeData); //console.log("Bittrex:", bittrexJSON);

            bittrexResults = bittrexJSON.result;
            btcMatch = [];
            ethMatch = [];
            usdtMatch = [];
            bittrexResults.forEach(function (bittrexElement) {
              var poloTicker = getPoloTickerFromBittrex(bittrexElement.MarketName);

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

          case 22:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _runPoloBittrexTickerCompare.apply(this, arguments);
}

function getPoloTickerFromBittrex(bittrexTicker) {
  var bittrexSplit = bittrexTicker.split("-");
  return bittrexSplit[0] + "_" + bittrexSplit[1];
}

function runPoloHitbtcTickerCompare() {
  return _runPoloHitbtcTickerCompare.apply(this, arguments);
}

function _runPoloHitbtcTickerCompare() {
  _runPoloHitbtcTickerCompare = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2() {
    var poloniexData, poloniexJSON, hitbtcALL, hitbtcJSON;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return (0, _getCryptoData.getExchangeData)(poloniexURL);

          case 2:
            poloniexData = _context2.sent;
            poloniexJSON = JSON.parse(poloniexData.exchangeData); // Bittrex section - All coins from one request.

            _context2.next = 6;
            return (0, _getCryptoData.getExchangeData)(hitbtcURL);

          case 6:
            hitbtcALL = _context2.sent;
            hitbtcJSON = JSON.parse(hitbtcALL.exchangeData);
            hitbtcJSON.forEach(function (hitBTCElem) {
              var proposedPoloTicker = getPoloTickerFromHitbtc(hitBTCElem.symbol);

              if (poloniexJSON[proposedPoloTicker]) {
                process.stdout.write("\"" + hitBTCElem.symbol + "\",");
              }
            });
            process.stdout.write("\n");
            hitbtcJSON.forEach(function (hitBTCElem) {
              var proposedPoloTicker = getPoloTickerFromHitbtc(hitBTCElem.symbol);

              if (poloniexJSON[proposedPoloTicker]) {
                process.stdout.write(hitBTCElem.symbol + ":   \"" + proposedPoloTicker + "\",\n");
              }
            });
            process.stdout.write("\n");

          case 12:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));
  return _runPoloHitbtcTickerCompare.apply(this, arguments);
}

function getPoloTickerFromHitbtc(hitbtcTicker) {
  var baseCurrency = ["BTC", "ETH", "USDT"];

  for (var idx = 0; idx < baseCurrency.length; idx++) {
    if (hitbtcTicker.endsWith(baseCurrency[idx])) {
      var poloTicker = baseCurrency[idx] + "_" + hitbtcTicker.substring(0, hitbtcTicker.indexOf(baseCurrency[idx]));
      return poloTicker;
    }
  }

  return "NoPolo";
}

function runBittrexHitbtcTickerCompare() {
  return _runBittrexHitbtcTickerCompare.apply(this, arguments);
}

function _runBittrexHitbtcTickerCompare() {
  _runBittrexHitbtcTickerCompare = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee3() {
    var bittrexALL, bittrexJSON, bittrexResults, hitbtcALL, hitbtcJSON;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return (0, _getCryptoData.getExchangeData)(bittrexURLAll);

          case 2:
            bittrexALL = _context3.sent;
            bittrexJSON = JSON.parse(bittrexALL.exchangeData); //console.log("Bittrex:", bittrexJSON);

            bittrexResults = bittrexJSON.result;
            process.stdout.write("\n"); // Hitbtc section

            _context3.next = 8;
            return (0, _getCryptoData.getExchangeData)(hitbtcURL);

          case 8:
            hitbtcALL = _context3.sent;
            hitbtcJSON = JSON.parse(hitbtcALL.exchangeData);
            bittrexResults.forEach(function (bittrexElem) {
              var proposedHitbtcTicker = getHitbtcTickerFromBittrex(bittrexElem.MarketName);
              var tickerMatch = hitbtcJSON.filter(function (item) {
                return item.symbol === proposedHitbtcTicker;
              });
              if (tickerMatch.length != 0) console.log(bittrexElem.MarketName, " gave ", proposedHitbtcTicker, " matched", tickerMatch[0].symbol);
            });
            process.stdout.write("\n");

          case 12:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));
  return _runBittrexHitbtcTickerCompare.apply(this, arguments);
}

function getHitbtcTickerFromBittrex(bittrexTicker) {
  var bittrexSplit = bittrexTicker.split("-");
  return bittrexSplit[1] + bittrexSplit[0];
} //runPoloBittrexTickerCompare();
//runPoloHitbtcTickerCompare();


runBittrexHitbtcTickerCompare();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9ta3REYXRhVGlja2Vycy50cyJdLCJuYW1lcyI6WyJyZXF1aXJlIiwicG9sb25pZXhVUkwiLCJiaXR0cmV4VVJMQWxsIiwiaGl0YnRjVVJMIiwicnVuUG9sb0JpdHRyZXhUaWNrZXJDb21wYXJlIiwicG9sb25pZXhEYXRhIiwicG9sb25pZXhKU09OIiwiSlNPTiIsInBhcnNlIiwiZXhjaGFuZ2VEYXRhIiwiYml0dHJleEFMTCIsImJpdHRyZXhKU09OIiwiYml0dHJleFJlc3VsdHMiLCJyZXN1bHQiLCJidGNNYXRjaCIsImV0aE1hdGNoIiwidXNkdE1hdGNoIiwiZm9yRWFjaCIsImJpdHRyZXhFbGVtZW50IiwicG9sb1RpY2tlciIsImdldFBvbG9UaWNrZXJGcm9tQml0dHJleCIsIk1hcmtldE5hbWUiLCJiaXR0cmV4U3BsaXQiLCJzcGxpdCIsInB1c2giLCJjb25zb2xlIiwibG9nIiwicHJvY2VzcyIsInN0ZG91dCIsIndyaXRlIiwibWFwIiwiZWxlbSIsImJpdHRyZXhUaWNrZXIiLCJydW5Qb2xvSGl0YnRjVGlja2VyQ29tcGFyZSIsImhpdGJ0Y0FMTCIsImhpdGJ0Y0pTT04iLCJoaXRCVENFbGVtIiwicHJvcG9zZWRQb2xvVGlja2VyIiwiZ2V0UG9sb1RpY2tlckZyb21IaXRidGMiLCJzeW1ib2wiLCJoaXRidGNUaWNrZXIiLCJiYXNlQ3VycmVuY3kiLCJpZHgiLCJsZW5ndGgiLCJlbmRzV2l0aCIsInN1YnN0cmluZyIsImluZGV4T2YiLCJydW5CaXR0cmV4SGl0YnRjVGlja2VyQ29tcGFyZSIsImJpdHRyZXhFbGVtIiwicHJvcG9zZWRIaXRidGNUaWNrZXIiLCJnZXRIaXRidGNUaWNrZXJGcm9tQml0dHJleCIsInRpY2tlck1hdGNoIiwiZmlsdGVyIiwiaXRlbSJdLCJtYXBwaW5ncyI6Ijs7QUFPQTs7Ozs7O0FBUEE7Ozs7QUFLQUEsT0FBTyxDQUFDLGlCQUFELENBQVA7O0FBSUEsSUFBTUMsV0FBbUIsR0FBRyxrREFBNUI7QUFDQSxJQUFN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QyxFQUFvRTtBQUVsRSxNQUFJVixZQUFZLEdBQUdVLGFBQWEsQ0FBQ1QsS0FBZCxDQUFvQixHQUFwQixDQUFuQjtBQUNBLFNBQU9ELFlBQVksQ0FBQyxDQUFELENBQVosR0FBa0JBLFlBQVksQ0FBQyxDQUFELENBQXJDO0FBQ0QsQyxDQUVEO0FBQ0E7OztBQUNBeUIsNkJBQTZCIiwic291cmNlc0NvbnRlbnQiOlsiLyogbWt0RGF0YVRpY2tlcnMudHNcbiAqIGRlc2M6IFV0aWxpdHkgcHJvZ3JhbSB0aGF0IGRvd25sb2FkcyBtYXJrZXQgZGF0YSBmcm9tIGV4Y2hhbmdlcyBhbmQgZmluZHMgYWxsIG92ZXJsYXBwaW5nIHRpY2tlcnMuXG4gKiAgICAgICBUaGUgZmlyc3Qgc2V0IG9mIHRpY2tlciBzeW1ib2wgY29tcGFyZXMgYXJlIGJldHdlZW4gUG9sb25pZXggYW5kIEJpdHRyZXguXG4gKi9cblxucmVxdWlyZShcIkBiYWJlbC9wb2x5ZmlsbFwiKTtcblxuaW1wb3J0IHtnZXRFeGNoYW5nZURhdGF9IGZyb20gXCIuL3V0aWxzL2dldENyeXB0b0RhdGFcIjtcblxuY29uc3QgcG9sb25pZXhVUkw6IHN0cmluZyA9IFwiaHR0cHM6Ly9wb2xvbmlleC5jb20vcHVibGljP2NvbW1hbmQ9cmV0dXJuVGlja2VyXCI7IFxuY29uc3QgYml0dHJleFVSTEFsbDogc3RyaW5nID0gXCJodHRwczovL2JpdHRyZXguY29tL2FwaS92MS4xL3B1YmxpYy9nZXRtYXJrZXRzdW1tYXJpZXNcIjtcbmNvbnN0IGhpdGJ0Y1VSTDogc3RyaW5nID0gXCJodHRwczovL2FwaS5oaXRidGMuY29tL2FwaS8yL3B1YmxpYy90aWNrZXJcIjtcblxuYXN5bmMgZnVuY3Rpb24gcnVuUG9sb0JpdHRyZXhUaWNrZXJDb21wYXJlKCkge1xuICAvLyBQb2xvbmlleCBzZWN0aW9uIC0gQWxsIGNvaW5zIGZyb20gb25lIHJlcXVlc3RcbiAgbGV0IHBvbG9uaWV4RGF0YSA9IGF3YWl0IGdldEV4Y2hhbmdlRGF0YShwb2xvbmlleFVSTCk7XG4gIGNvbnN0IHBvbG9uaWV4SlNPTiA9IEpTT04ucGFyc2UocG9sb25pZXhEYXRhLmV4Y2hhbmdlRGF0YSk7XG4gIC8vY29uc29sZS5sb2coXCJQb2xvbmlleDpcIiwgcG9sb25pZXhKU09OKTtcbiAgLy8gQml0dHJleCBzZWN0aW9uIC0gQWxsIGNvaW5zIGZyb20gb25lIHJlcXVlc3QuXG4gIGxldCBiaXR0cmV4QUxMID0gYXdhaXQgZ2V0RXhjaGFuZ2VEYXRhKGJpdHRyZXhVUkxBbGwpO1xuICBsZXQgYml0dHJleEpTT04gPSBKU09OLnBhcnNlKGJpdHRyZXhBTEwuZXhjaGFuZ2VEYXRhKTtcbiAgLy9jb25zb2xlLmxvZyhcIkJpdHRyZXg6XCIsIGJpdHRyZXhKU09OKTtcbiAgY29uc3QgYml0dHJleFJlc3VsdHM6IEFycmF5PGFueT4gPSBiaXR0cmV4SlNPTi5yZXN1bHQ7XG4gIGxldCBidGNNYXRjaDogQXJyYXk8c3RyaW5nPiA9IFtdO1xuICBsZXQgZXRoTWF0Y2g6IEFycmF5PHN0cmluZz4gPSBbXTtcbiAgbGV0IHVzZHRNYXRjaDogQXJyYXk8c3RyaW5nPiA9IFtdO1xuICBiaXR0cmV4UmVzdWx0cy5mb3JFYWNoKCAoYml0dHJleEVsZW1lbnQpID0+IHtcbiAgICBjb25zdCBwb2xvVGlja2VyID0gZ2V0UG9sb1RpY2tlckZyb21CaXR0cmV4KGJpdHRyZXhFbGVtZW50Lk1hcmtldE5hbWUpO1xuICAgIGlmKHBvbG9uaWV4SlNPTltwb2xvVGlja2VyXSkge1xuICAgICAgbGV0IGJpdHRyZXhTcGxpdCA9IGJpdHRyZXhFbGVtZW50Lk1hcmtldE5hbWUuc3BsaXQoXCItXCIpO1xuICAgICAgaWYgKGJpdHRyZXhTcGxpdFswXT09PVwiQlRDXCIpe1xuICAgICAgICBidGNNYXRjaC5wdXNoKGJpdHRyZXhTcGxpdFsxXSk7XG4gICAgICB9XG4gICAgICBpZiAoYml0dHJleFNwbGl0WzBdPT09XCJFVEhcIil7XG4gICAgICAgIGV0aE1hdGNoLnB1c2goYml0dHJleFNwbGl0WzFdKTtcbiAgICAgIH1cbiAgICAgIGlmIChiaXR0cmV4U3BsaXRbMF09PT1cIlVTRFRcIil7XG4gICAgICAgIHVzZHRNYXRjaC5wdXNoKGJpdHRyZXhTcGxpdFsxXSk7XG4gICAgICB9XG4gICAgICBjb25zb2xlLmxvZyhcIk1hdGNoOlwiLCBiaXR0cmV4RWxlbWVudC5NYXJrZXROYW1lLCBcIiBcIiwgcG9sb1RpY2tlcik7XG4gICAgfVxuICB9KTtcbiAgcHJvY2Vzcy5zdGRvdXQud3JpdGUoXCJCVEM6IFtcIik7XG4gIGJ0Y01hdGNoLm1hcCgoZWxlbSkgPT4gcHJvY2Vzcy5zdGRvdXQud3JpdGUoXCJcXFwiXCIrZWxlbStcIlxcXCJcIitcIixcIikpO1xuICBwcm9jZXNzLnN0ZG91dC53cml0ZShcIl1cXG5cIik7XG4gIHByb2Nlc3Muc3Rkb3V0LndyaXRlKFwiRVRIOiBbXCIpO1xuICBldGhNYXRjaC5tYXAoKGVsZW0pID0+IHByb2Nlc3Muc3Rkb3V0LndyaXRlKFwiXFxcIlwiK2VsZW0rXCJcXFwiXCIrXCIsXCIpKTtcbiAgcHJvY2Vzcy5zdGRvdXQud3JpdGUoXCJdXFxuXCIpO1xuICBwcm9jZXNzLnN0ZG91dC53cml0ZShcIlVTRFQ6IFtcIik7XG4gIHVzZHRNYXRjaC5tYXAoKGVsZW0pID0+IHByb2Nlc3Muc3Rkb3V0LndyaXRlKFwiXFxcIlwiK2VsZW0rXCJcXFwiXCIrXCIsXCIpKTtcbiAgcHJvY2Vzcy5zdGRvdXQud3JpdGUoXCJdXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBnZXRQb2xvVGlja2VyRnJvbUJpdHRyZXgoYml0dHJleFRpY2tlciA6IHN0cmluZyk6IHN0cmluZyB7XG5cbiAgbGV0IGJpdHRyZXhTcGxpdCA9IGJpdHRyZXhUaWNrZXIuc3BsaXQoXCItXCIpO1xuICByZXR1cm4oYml0dHJleFNwbGl0WzBdICsgXCJfXCIgKyBiaXR0cmV4U3BsaXRbMV0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBydW5Qb2xvSGl0YnRjVGlja2VyQ29tcGFyZSgpIHtcbiAgLy8gUG9sb25pZXggc2VjdGlvbiAtIEFsbCBjb2lucyBmcm9tIG9uZSByZXF1ZXN0XG4gIGxldCBwb2xvbmlleERhdGEgPSBhd2FpdCBnZXRFeGNoYW5nZURhdGEocG9sb25pZXhVUkwpO1xuICBjb25zdCBwb2xvbmlleEpTT04gPSBKU09OLnBhcnNlKHBvbG9uaWV4RGF0YS5leGNoYW5nZURhdGEpO1xuICAvLyBCaXR0cmV4IHNlY3Rpb24gLSBBbGwgY29pbnMgZnJvbSBvbmUgcmVxdWVzdC5cbiAgbGV0IGhpdGJ0Y0FMTCA9IGF3YWl0IGdldEV4Y2hhbmdlRGF0YShoaXRidGNVUkwpO1xuICBsZXQgaGl0YnRjSlNPTiA9IEpTT04ucGFyc2UoaGl0YnRjQUxMLmV4Y2hhbmdlRGF0YSk7XG4gIGhpdGJ0Y0pTT04uZm9yRWFjaCggKGhpdEJUQ0VsZW06IGFueSkgPT4ge1xuICAgIGxldCBwcm9wb3NlZFBvbG9UaWNrZXIgPSBnZXRQb2xvVGlja2VyRnJvbUhpdGJ0YyhoaXRCVENFbGVtLnN5bWJvbCk7XG4gICAgaWYgKHBvbG9uaWV4SlNPTltwcm9wb3NlZFBvbG9UaWNrZXJdKSB7XG4gICAgICBwcm9jZXNzLnN0ZG91dC53cml0ZShcIlxcXCJcIitoaXRCVENFbGVtLnN5bWJvbCtcIlxcXCIsXCIpO1xuICAgIH1cbiAgfSk7XG4gIHByb2Nlc3Muc3Rkb3V0LndyaXRlKFwiXFxuXCIpO1xuICBoaXRidGNKU09OLmZvckVhY2goIChoaXRCVENFbGVtOiBhbnkpID0+IHtcbiAgICBsZXQgcHJvcG9zZWRQb2xvVGlja2VyID0gZ2V0UG9sb1RpY2tlckZyb21IaXRidGMoaGl0QlRDRWxlbS5zeW1ib2wpO1xuICAgIGlmIChwb2xvbmlleEpTT05bcHJvcG9zZWRQb2xvVGlja2VyXSkge1xuICAgICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUoaGl0QlRDRWxlbS5zeW1ib2wrXCI6ICAgXFxcIlwiK3Byb3Bvc2VkUG9sb1RpY2tlcitcIlxcXCIsXFxuXCIpO1xuICAgIH1cbiAgfSk7XG4gIHByb2Nlc3Muc3Rkb3V0LndyaXRlKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBnZXRQb2xvVGlja2VyRnJvbUhpdGJ0YyhoaXRidGNUaWNrZXIgOiBzdHJpbmcpOiBzdHJpbmcge1xuXG4gIGNvbnN0IGJhc2VDdXJyZW5jeTogQXJyYXk8c3RyaW5nPiA9IFtcIkJUQ1wiLCBcIkVUSFwiLCBcIlVTRFRcIl07XG4gIGZvcihsZXQgaWR4PTA7IGlkeDxiYXNlQ3VycmVuY3kubGVuZ3RoOyBpZHgrKykge1xuICAgIGlmKGhpdGJ0Y1RpY2tlci5lbmRzV2l0aChiYXNlQ3VycmVuY3lbaWR4XSkpIHtcbiAgICAgIGxldCBwb2xvVGlja2VyID0gYmFzZUN1cnJlbmN5W2lkeF0gKyBcIl9cIiArIGhpdGJ0Y1RpY2tlci5zdWJzdHJpbmcoMCxoaXRidGNUaWNrZXIuaW5kZXhPZihiYXNlQ3VycmVuY3lbaWR4XSkpO1xuICAgICAgcmV0dXJuKHBvbG9UaWNrZXIpO1xuICAgIH1cbiAgfVxuIHJldHVybihcIk5vUG9sb1wiKTtcbn1cblxuXG5hc3luYyBmdW5jdGlvbiBydW5CaXR0cmV4SGl0YnRjVGlja2VyQ29tcGFyZSgpIHtcbiAgLy8gQml0dHJleCBzZWN0aW9uIC0gQWxsIGNvaW5zIGZyb20gb25lIHJlcXVlc3QuXG4gIGxldCBiaXR0cmV4QUxMID0gYXdhaXQgZ2V0RXhjaGFuZ2VEYXRhKGJpdHRyZXhVUkxBbGwpO1xuICBsZXQgYml0dHJleEpTT04gPSBKU09OLnBhcnNlKGJpdHRyZXhBTEwuZXhjaGFuZ2VEYXRhKTtcbiAgLy9jb25zb2xlLmxvZyhcIkJpdHRyZXg6XCIsIGJpdHRyZXhKU09OKTtcbiAgY29uc3QgYml0dHJleFJlc3VsdHM6IEFycmF5PGFueT4gPSBiaXR0cmV4SlNPTi5yZXN1bHQ7XG4gIHByb2Nlc3Muc3Rkb3V0LndyaXRlKFwiXFxuXCIpO1xuICAvLyBIaXRidGMgc2VjdGlvblxuICBsZXQgaGl0YnRjQUxMID0gYXdhaXQgZ2V0RXhjaGFuZ2VEYXRhKGhpdGJ0Y1VSTCk7XG4gIGxldCBoaXRidGNKU09OID0gSlNPTi5wYXJzZShoaXRidGNBTEwuZXhjaGFuZ2VEYXRhKTtcbiAgYml0dHJleFJlc3VsdHMuZm9yRWFjaCggKGJpdHRyZXhFbGVtOiBhbnkpID0+IHtcbiAgICBsZXQgcHJvcG9zZWRIaXRidGNUaWNrZXIgPSBnZXRIaXRidGNUaWNrZXJGcm9tQml0dHJleChiaXR0cmV4RWxlbS5NYXJrZXROYW1lKTtcbiAgICBsZXQgdGlja2VyTWF0Y2ggPSBoaXRidGNKU09OLmZpbHRlcigoaXRlbTogYW55KSA9PiB7XG4gICAgICByZXR1cm4oaXRlbS5zeW1ib2w9PT1wcm9wb3NlZEhpdGJ0Y1RpY2tlcik7XG4gICAgfSk7XG4gICAgaWYodGlja2VyTWF0Y2gubGVuZ3RoIT0wKVxuICAgICAgY29uc29sZS5sb2coYml0dHJleEVsZW0uTWFya2V0TmFtZSwgXCIgZ2F2ZSBcIiwgcHJvcG9zZWRIaXRidGNUaWNrZXIsIFwiIG1hdGNoZWRcIiwgdGlja2VyTWF0Y2hbMF0uc3ltYm9sKTtcbiAgfSk7XG4gIHByb2Nlc3Muc3Rkb3V0LndyaXRlKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBnZXRIaXRidGNUaWNrZXJGcm9tQml0dHJleChiaXR0cmV4VGlja2VyIDogc3RyaW5nKTogc3RyaW5nIHtcblxuICBsZXQgYml0dHJleFNwbGl0ID0gYml0dHJleFRpY2tlci5zcGxpdChcIi1cIik7XG4gIHJldHVybihiaXR0cmV4U3BsaXRbMV0gKyBiaXR0cmV4U3BsaXRbMF0pO1xufVxuXG4vL3J1blBvbG9CaXR0cmV4VGlja2VyQ29tcGFyZSgpO1xuLy9ydW5Qb2xvSGl0YnRjVGlja2VyQ29tcGFyZSgpO1xucnVuQml0dHJleEhpdGJ0Y1RpY2tlckNvbXBhcmUoKTtcbiJdfQ==