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
var binanceURL = "https://api.binance.com/api/v3/ticker/bookTicker";

function runBittrexBinanceTickerCompare() {
  return _runBittrexBinanceTickerCompare.apply(this, arguments);
}

function _runBittrexBinanceTickerCompare() {
  _runBittrexBinanceTickerCompare = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee() {
    var bittrexData, bittrexJSON, bittrexResults, binanceALL, binanceResults, btcMatch, ethMatch, usdtMatch;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return (0, _getCryptoData.getExchangeMkt)("bittrex");

          case 2:
            bittrexData = _context.sent;
            bittrexJSON = JSON.parse(bittrexData.exchangeData);
            bittrexResults = bittrexJSON.result; // Binance section - All coins from one request.

            _context.next = 7;
            return (0, _getCryptoData.getExchangeMkt)("binance");

          case 7:
            binanceALL = _context.sent;
            binanceResults = JSON.parse(binanceALL.exchangeData);
            btcMatch = [];
            ethMatch = [];
            usdtMatch = [];
            binanceResults.forEach(function (binanceElement) {
              var bittrexTicker = getBittrexTickerFromBinance(binanceElement.symbol);

              for (var idx = 0; idx < bittrexResults.length; idx++) {
                if (bittrexResults[idx].MarketName === bittrexTicker) {
                  console.log("---> Match Binance: ".concat(binanceElement.symbol, " Bittrex: ").concat(bittrexTicker));
                  break;
                }
              }
            });

          case 13:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _runBittrexBinanceTickerCompare.apply(this, arguments);
}

function getBittrexTickerFromBinance(binanceTicker) {
  var bittrexTicker = "";
  var baseTickers = ["BTC", "ETH", "USDC", "USDT"];

  for (var baseIdx = 0; baseIdx < baseTickers.length; baseIdx++) {
    var baseTickerFound = binanceTicker.search(baseTickers[baseIdx]);

    if (baseTickerFound >= 2) {
      var secondaryTicker = binanceTicker.slice(0, baseTickerFound);
      bittrexTicker = "".concat(baseTickers[baseIdx], "-").concat(secondaryTicker);
      break;
    }
  }

  return bittrexTicker;
}

function runPoloBinanceTickerCompare() {
  return _runPoloBinanceTickerCompare.apply(this, arguments);
}

function _runPoloBinanceTickerCompare() {
  _runPoloBinanceTickerCompare = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2() {
    var poloniexData, poloniexJSON, binanceALL, binanceResults, btcMatch, ethMatch, usdtMatch;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return (0, _getCryptoData.getExchangeMkt)("poloniex");

          case 2:
            poloniexData = _context2.sent;
            poloniexJSON = JSON.parse(poloniexData.exchangeData); // Binance section - All coins from one request.

            _context2.next = 6;
            return (0, _getCryptoData.getExchangeMkt)("binance");

          case 6:
            binanceALL = _context2.sent;
            binanceResults = JSON.parse(binanceALL.exchangeData);
            btcMatch = [];
            ethMatch = [];
            usdtMatch = [];
            binanceResults.forEach(function (binanceElement) {
              var poloTicker = getPoloTickerFromBinance(binanceElement.symbol);

              if (poloniexJSON[poloTicker]) {
                console.log("Match:", binanceElement.symbol, " ", poloTicker);
              }
            });

          case 12:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));
  return _runPoloBinanceTickerCompare.apply(this, arguments);
}

function getPoloTickerFromBinance(binanceTicker) {
  var poloTicker = "";
  var baseTickers = ["BTC", "ETH", "USDC", "USDT"];

  for (var baseIdx = 0; baseIdx < baseTickers.length; baseIdx++) {
    var baseTickerFound = binanceTicker.search(baseTickers[baseIdx]);

    if (baseTickerFound >= 2) {
      var secondaryTicker = binanceTicker.slice(0, baseTickerFound);
      poloTicker = "".concat(baseTickers[baseIdx], "_").concat(secondaryTicker);
      break;
    }
  }

  return poloTicker;
}

function runPoloBittrexTickerCompare() {
  return _runPoloBittrexTickerCompare.apply(this, arguments);
}

function _runPoloBittrexTickerCompare() {
  _runPoloBittrexTickerCompare = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee3() {
    var poloniexData, poloniexJSON, bittrexALL, bittrexJSON, bittrexResults, btcMatch, ethMatch, usdtMatch;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return (0, _getCryptoData.getExchangeMkt)("poloniex");

          case 2:
            poloniexData = _context3.sent;
            poloniexJSON = JSON.parse(poloniexData.exchangeData); //console.log("Poloniex:", poloniexJSON);
            // Bittrex section - All coins from one request.

            _context3.next = 6;
            return (0, _getCryptoData.getExchangeMkt)("bittrex");

          case 6:
            bittrexALL = _context3.sent;
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
            return _context3.stop();
        }
      }
    }, _callee3, this);
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
  regeneratorRuntime.mark(function _callee4() {
    var poloniexData, poloniexJSON, hitbtcALL, hitbtcJSON;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return getExchangeData(poloniexURL);

          case 2:
            poloniexData = _context4.sent;
            poloniexJSON = JSON.parse(poloniexData.exchangeData); // Bittrex section - All coins from one request.

            _context4.next = 6;
            return getExchangeData(hitbtcURL);

          case 6:
            hitbtcALL = _context4.sent;
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
            return _context4.stop();
        }
      }
    }, _callee4, this);
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
  regeneratorRuntime.mark(function _callee5() {
    var bittrexALL, bittrexJSON, bittrexResults, hitbtcALL, hitbtcJSON;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.next = 2;
            return getExchangeData(bittrexURLAll);

          case 2:
            bittrexALL = _context5.sent;
            bittrexJSON = JSON.parse(bittrexALL.exchangeData); //console.log("Bittrex:", bittrexJSON);

            bittrexResults = bittrexJSON.result;
            process.stdout.write("\n"); // Hitbtc section

            _context5.next = 8;
            return getExchangeData(hitbtcURL);

          case 8:
            hitbtcALL = _context5.sent;
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
            return _context5.stop();
        }
      }
    }, _callee5, this);
  }));
  return _runBittrexHitbtcTickerCompare.apply(this, arguments);
}

function getHitbtcTickerFromBittrex(bittrexTicker) {
  var bittrexSplit = bittrexTicker.split("-");
  return bittrexSplit[1] + bittrexSplit[0];
} //runPoloBittrexTickerCompare();
//runPoloHitbtcTickerCompare();
//runBittrexHitbtcTickerCompare();
//runPoloBinanceTickerCompare();


runBittrexBinanceTickerCompare();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9ta3REYXRhVGlja2Vycy50cyJdLCJuYW1lcyI6WyJyZXF1aXJlIiwicG9sb25pZXhVUkwiLCJiaXR0cmV4VVJMQWxsIiwiaGl0YnRjVVJMIiwiYmluYW5jZVVSTCIsInJ1bkJpdHRyZXhCaW5hbmNlVGlja2VyQ29tcGFyZSIsImJpdHRyZXhEYXRhIiwiYml0dHJleEpTT04iLCJKU09OIiwicGFyc2UiLCJleGNoYW5nZURhdGEiLCJiaXR0cmV4UmVzdWx0cyIsInJlc3VsdCIsImJpbmFuY2VBTEwiLCJiaW5hbmNlUmVzdWx0cyIsImJ0Y01hdGNoIiwiZXRoTWF0Y2giLCJ1c2R0TWF0Y2giLCJmb3JFYWNoIiwiYmluYW5jZUVsZW1lbnQiLCJiaXR0cmV4VGlja2VyIiwiZ2V0Qml0dHJleFRpY2tlckZyb21CaW5hbmNlIiwic3ltYm9sIiwiaWR4IiwibGVuZ3RoIiwiTWFya2V0TmFtZSIsImNvbnNvbGUiLCJsb2ciLCJiaW5hbmNlVGlja2VyIiwiYmFzZVRpY2tlcnMiLCJiYXNlSWR4IiwiYmFzZVRpY2tlckZvdW5kIiwic2VhcmNoIiwic2Vjb25kYXJ5VGlja2VyIiwic2xpY2UiLCJydW5Qb2xvQmluYW5jZVRpY2tlckNvbXBhcmUiLCJwb2xvbmlleERhdGEiLCJwb2xvbmlleEpTT04iLCJwb2xvVGlja2VyIiwiZ2V0UG9sb1RpY2tlckZyb21CaW5hbmNlIiwicnVuUG9sb0JpdHRyZXhUaWNrZXJDb21wYXJlIiwiYml0dHJleEFMTCIsImJpdHRyZXhFbGVtZW50IiwiZ2V0UG9sb1RpY2tlckZyb21CaXR0cmV4IiwiYml0dHJleFNwbGl0Iiwic3BsaXQiLCJwdXNoIiwicHJvY2VzcyIsInN0ZG91dCIsIndyaXRlIiwibWFwIiwiZWxlbSIsInJ1blBvbG9IaXRidGNUaWNrZXJDb21wYXJlIiwiZ2V0RXhjaGFuZ2VEYXRhIiwiaGl0YnRjQUxMIiwiaGl0YnRjSlNPTiIsImhpdEJUQ0VsZW0iLCJwcm9wb3NlZFBvbG9UaWNrZXIiLCJnZXRQb2xvVGlja2VyRnJvbUhpdGJ0YyIsImhpdGJ0Y1RpY2tlciIsImJhc2VDdXJyZW5jeSIsImVuZHNXaXRoIiwic3Vic3RyaW5nIiwiaW5kZXhPZiIsInJ1bkJpdHRyZXhIaXRidGNUaWNrZXJDb21wYXJlIiwiYml0dHJleEVsZW0iLCJwcm9wb3NlZEhpdGJ0Y1RpY2tlciIsImdldEhpdGJ0Y1RpY2tlckZyb21CaXR0cmV4IiwidGlja2VyTWF0Y2giLCJmaWx0ZXIiLCJpdGVtIl0sIm1hcHBpbmdzIjoiOztBQU9BOzs7Ozs7QUFQQTs7OztBQUtBQSxPQUFPLENBQUMsaUJBQUQsQ0FBUDs7QUFJQSxJQUFNQyxXQUFtQixHQUFHLGtEQUE1QjtBQUNBLElBQU1DLGFBQXFCLEdBQUcsd0RBQTlCO0FBQ0EsSUFBTUMsU0FBaUIsR0FBRyw0Q0FBMUI7QUFDQSxJQUFNQyxVQUFrQixHQUFHLGtEQUEzQjs7U0FHZUMsOEI7Ozs7Ozs7MEJBQWY7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxtQkFFMEIsbUNBQWUsU0FBZixDQUYxQjs7QUFBQTtBQUVNQyxZQUFBQSxXQUZOO0FBR1FDLFlBQUFBLFdBSFIsR0FHc0JDLElBQUksQ0FBQ0MsS0FBTCxDQUFXSCxXQUFXLENBQUNJLFlBQXZCLENBSHRCO0FBSVFDLFlBQUFBLGNBSlIsR0FJcUNKLFdBQVcsQ0FBQ0ssTUFKakQsRUFLRTs7QUFMRjtBQUFBLG1CQU15QixtQ0FBZSxTQUFmLENBTnpCOztBQUFBO0FBTU1DLFlBQUFBLFVBTk47QUFPUUMsWUFBQUEsY0FQUixHQU9xQ04sSUFBSSxDQUFDQyxLQUFMLENBQVdJLFVBQVUsQ0FBQ0gsWUFBdEIsQ0FQckM7QUFRTUssWUFBQUEsUUFSTixHQVFnQyxFQVJoQztBQVNNQyxZQUFBQSxRQVROLEdBU2dDLEVBVGhDO0FBVU1DLFlBQUFBLFNBVk4sR0FVaUMsRUFWakM7QUFXRUgsWUFBQUEsY0FBYyxDQUFDSSxPQUFmLENBQXdCLFVBQUNDLGNBQUQsRUFBb0I7QUFDMUMsa0JBQU1DLGFBQWEsR0FBR0MsMkJBQTJCLENB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VyxDQUFDeEMsVUFBeEIsRUFBb0MsUUFBcEMsRUFBOEN5QyxvQkFBOUMsRUFBb0UsVUFBcEUsRUFBZ0ZFLFdBQVcsQ0FBQyxDQUFELENBQVgsQ0FBZTlDLE1BQS9GO0FBQ0gsYUFQRDtBQVFBeUIsWUFBQUEsT0FBTyxDQUFDQyxNQUFSLENBQWVDLEtBQWYsQ0FBcUIsSUFBckI7O0FBbEJGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEc7Ozs7QUFxQkEsU0FBU2tCLDBCQUFULENBQW9DL0MsYUFBcEMsRUFBb0U7QUFFbEUsTUFBSXdCLFlBQVksR0FBR3hCLGFBQWEsQ0FBQ3lCLEtBQWQsQ0FBb0IsR0FBcEIsQ0FBbkI7QUFDQSxTQUFPRCxZQUFZLENBQUMsQ0FBRCxDQUFaLEdBQWtCQSxZQUFZLENBQUMsQ0FBRCxDQUFyQztBQUNELEMsQ0FFRDtBQUNBO0FBQ0E7QUFDQTs7O0FBQ0F2Qyw4QkFBOEIiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBta3REYXRhVGlja2Vycy50c1xuICogZGVzYzogVXRpbGl0eSBwcm9ncmFtIHRoYXQgZG93bmxvYWRzIG1hcmtldCBkYXRhIGZyb20gZXhjaGFuZ2VzIGFuZCBmaW5kcyBhbGwgb3ZlcmxhcHBpbmcgdGlja2Vycy5cbiAqICAgICAgIFRoZSBmaXJzdCBzZXQgb2YgdGlja2VyIHN5bWJvbCBjb21wYXJlcyBhcmUgYmV0d2VlbiBQb2xvbmlleCBhbmQgQml0dHJleC5cbiAqL1xuXG5yZXF1aXJlKFwiQGJhYmVsL3BvbHlmaWxsXCIpO1xuXG5pbXBvcnQge2dldEV4Y2hhbmdlTWt0fSBmcm9tIFwiLi91dGlscy9nZXRDcnlwdG9EYXRhXCI7XG5cbmNvbnN0IHBvbG9uaWV4VVJMOiBzdHJpbmcgPSBcImh0dHBzOi8vcG9sb25pZXguY29tL3B1YmxpYz9jb21tYW5kPXJldHVyblRpY2tlclwiOyBcbmNvbnN0IGJpdHRyZXhVUkxBbGw6IHN0cmluZyA9IFwiaHR0cHM6Ly9iaXR0cmV4LmNvbS9hcGkvdjEuMS9wdWJsaWMvZ2V0bWFya2V0c3VtbWFyaWVzXCI7XG5jb25zdCBoaXRidGNVUkw6IHN0cmluZyA9IFwiaHR0cHM6Ly9hcGkuaGl0YnRjLmNvbS9hcGkvMi9wdWJsaWMvdGlja2VyXCI7XG5jb25zdCBiaW5hbmNlVVJMOiBzdHJpbmcgPSBcImh0dHBzOi8vYXBpLmJpbmFuY2UuY29tL2FwaS92My90aWNrZXIvYm9va1RpY2tlclwiO1xuXG5cbmFzeW5jIGZ1bmN0aW9uIHJ1bkJpdHRyZXhCaW5hbmNlVGlja2VyQ29tcGFyZSgpIHtcbiAgLy8gUG9sb25pZXggc2VjdGlvbiAtIEFsbCBjb2lucyBmcm9tIG9uZSByZXF1ZXN0XG4gIGxldCBiaXR0cmV4RGF0YSA9IGF3YWl0IGdldEV4Y2hhbmdlTWt0KFwiYml0dHJleFwiKTtcbiAgY29uc3QgYml0dHJleEpTT04gPSBKU09OLnBhcnNlKGJpdHRyZXhEYXRhLmV4Y2hhbmdlRGF0YSk7XG4gIGNvbnN0IGJpdHRyZXhSZXN1bHRzOiBBcnJheTxhbnk+ID0gYml0dHJleEpTT04ucmVzdWx0O1xuICAvLyBCaW5hbmNlIHNlY3Rpb24gLSBBbGwgY29pbnMgZnJvbSBvbmUgcmVxdWVzdC5cbiAgbGV0IGJpbmFuY2VBTEwgPSBhd2FpdCBnZXRFeGNoYW5nZU1rdChcImJpbmFuY2VcIik7XG4gIGNvbnN0IGJpbmFuY2VSZXN1bHRzOiBBcnJheTxhbnk+ID0gSlNPTi5wYXJzZShiaW5hbmNlQUxMLmV4Y2hhbmdlRGF0YSk7XG4gIGxldCBidGNNYXRjaDogQXJyYXk8c3RyaW5nPiA9IFtdO1xuICBsZXQgZXRoTWF0Y2g6IEFycmF5PHN0cmluZz4gPSBbXTtcbiAgbGV0IHVzZHRNYXRjaDogQXJyYXk8c3RyaW5nPiA9IFtdO1xuICBiaW5hbmNlUmVzdWx0cy5mb3JFYWNoKCAoYmluYW5jZUVsZW1lbnQpID0+IHtcbiAgICBjb25zdCBiaXR0cmV4VGlja2VyID0gZ2V0Qml0dHJleFRpY2tlckZyb21CaW5hbmNlKGJpbmFuY2VFbGVtZW50LnN5bWJvbCk7XG4gICAgZm9yKGxldCBpZHg9MDsgaWR4PGJpdHRyZXhSZXN1bHRzLmxlbmd0aDsgaWR4KyspIHtcbiAgICAgIGlmKGJpdHRyZXhSZXN1bHRzW2lkeF0uTWFya2V0TmFtZT09PWJpdHRyZXhUaWNrZXIpIHtcbiAgICAgICAgY29uc29sZS5sb2coYC0tLT4gTWF0Y2ggQmluYW5jZTogJHtiaW5hbmNlRWxlbWVudC5zeW1ib2x9IEJpdHRyZXg6ICR7Yml0dHJleFRpY2tlcn1gKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbn1cblxuXG5mdW5jdGlvbiBnZXRCaXR0cmV4VGlja2VyRnJvbUJpbmFuY2UoYmluYW5jZVRpY2tlciA6IHN0cmluZyk6IHN0cmluZyB7XG5cbiAgbGV0IGJpdHRyZXhUaWNrZXIgPSBcIlwiO1xuICBjb25zdCBiYXNlVGlja2VycyA9IFtcIkJUQ1wiLCBcIkVUSFwiLCBcIlVTRENcIiwgXCJVU0RUXCJdO1xuICBmb3IobGV0IGJhc2VJZHggPSAwOyBiYXNlSWR4PGJhc2VUaWNrZXJzLmxlbmd0aDsgYmFzZUlkeCsrKSB7XG4gICAgY29uc3QgYmFzZVRpY2tlckZvdW5kID0gYmluYW5jZVRpY2tlci5zZWFyY2goYmFzZVRpY2tlcnNbYmFzZUlkeF0pO1xuICAgIGlmIChiYXNlVGlja2VyRm91bmQgPj0gMikge1xuICAgICAgY29uc3Qgc2Vjb25kYXJ5VGlja2VyID0gYmluYW5jZVRpY2tlci5zbGljZSgwLCBiYXNlVGlja2VyRm91bmQpO1xuICAgICAgYml0dHJleFRpY2tlciA9IGAke2Jhc2VUaWNrZXJzW2Jhc2VJZHhdfS0ke3NlY29uZGFyeVRpY2tlcn1gO1xuICAgICAgYnJlYWs7XG4gICAgfSAgXG4gIH1cbiAgcmV0dXJuKGJpdHRyZXhUaWNrZXIpO1xufVxuXG5cblxuYXN5bmMgZnVuY3Rpb24gcnVuUG9sb0JpbmFuY2VUaWNrZXJDb21wYXJlKCkge1xuICAvLyBQb2xvbmlleCBzZWN0aW9uIC0gQWxsIGNvaW5zIGZyb20gb25lIHJlcXVlc3RcbiAgbGV0IHBvbG9uaWV4RGF0YSA9IGF3YWl0IGdldEV4Y2hhbmdlTWt0KFwicG9sb25pZXhcIik7XG4gIGNvbnN0IHBvbG9uaWV4SlNPTiA9IEpTT04ucGFyc2UocG9sb25pZXhEYXRhLmV4Y2hhbmdlRGF0YSk7XG4gIC8vIEJpbmFuY2Ugc2VjdGlvbiAtIEFsbCBjb2lucyBmcm9tIG9uZSByZXF1ZXN0LlxuICBsZXQgYmluYW5jZUFMTCA9IGF3YWl0IGdldEV4Y2hhbmdlTWt0KFwiYmluYW5jZVwiKTtcbiAgY29uc3QgYmluYW5jZVJlc3VsdHM6IEFycmF5PGFueT4gPSBKU09OLnBhcnNlKGJpbmFuY2VBTEwuZXhjaGFuZ2VEYXRhKTtcbiAgbGV0IGJ0Y01hdGNoOiBBcnJheTxzdHJpbmc+ID0gW107XG4gIGxldCBldGhNYXRjaDogQXJyYXk8c3RyaW5nPiA9IFtdO1xuICBsZXQgdXNkdE1hdGNoOiBBcnJheTxzdHJpbmc+ID0gW107XG4gIGJpbmFuY2VSZXN1bHRzLmZvckVhY2goIChiaW5hbmNlRWxlbWVudCkgPT4ge1xuICAgIGNvbnN0IHBvbG9UaWNrZXIgPSBnZXRQb2xvVGlja2VyRnJvbUJpbmFuY2UoYmluYW5jZUVsZW1lbnQuc3ltYm9sKTtcbiAgICBpZihwb2xvbmlleEpTT05bcG9sb1RpY2tlcl0pIHtcbiAgICAgICBjb25zb2xlLmxvZyhcIk1hdGNoOlwiLCBiaW5hbmNlRWxlbWVudC5zeW1ib2wsIFwiIFwiLCBwb2xvVGlja2VyKTtcbiAgICB9XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRQb2xvVGlja2VyRnJvbUJpbmFuY2UoYmluYW5jZVRpY2tlciA6IHN0cmluZyk6IHN0cmluZyB7XG5cbiAgbGV0IHBvbG9UaWNrZXIgPSBcIlwiO1xuICBjb25zdCBiYXNlVGlja2VycyA9IFtcIkJUQ1wiLCBcIkVUSFwiLCBcIlVTRENcIiwgXCJVU0RUXCJdO1xuICBmb3IobGV0IGJhc2VJZHggPSAwOyBiYXNlSWR4PGJhc2VUaWNrZXJzLmxlbmd0aDsgYmFzZUlkeCsrKSB7XG4gICAgY29uc3QgYmFzZVRpY2tlckZvdW5kID0gYmluYW5jZVRpY2tlci5zZWFyY2goYmFzZVRpY2tlcnNbYmFzZUlkeF0pO1xuICAgIGlmIChiYXNlVGlja2VyRm91bmQgPj0gMikge1xuICAgICAgY29uc3Qgc2Vjb25kYXJ5VGlja2VyID0gYmluYW5jZVRpY2tlci5zbGljZSgwLCBiYXNlVGlja2VyRm91bmQpO1xuICAgICAgcG9sb1RpY2tlciA9IGAke2Jhc2VUaWNrZXJzW2Jhc2VJZHhdfV8ke3NlY29uZGFyeVRpY2tlcn1gO1xuICAgICAgYnJlYWs7XG4gICAgfSAgXG4gIH1cbiAgcmV0dXJuKHBvbG9UaWNrZXIpO1xufVxuXG5cbmFzeW5jIGZ1bmN0aW9uIHJ1blBvbG9CaXR0cmV4VGlja2VyQ29tcGFyZSgpIHtcbiAgLy8gUG9sb25pZXggc2VjdGlvbiAtIEFsbCBjb2lucyBmcm9tIG9uZSByZXF1ZXN0XG4gIGxldCBwb2xvbmlleERhdGEgPSBhd2FpdCBnZXRFeGNoYW5nZU1rdChcInBvbG9uaWV4XCIpO1xuICBjb25zdCBwb2xvbmlleEpTT04gPSBKU09OLnBhcnNlKHBvbG9uaWV4RGF0YS5leGNoYW5nZURhdGEpO1xuICAvL2NvbnNvbGUubG9nKFwiUG9sb25pZXg6XCIsIHBvbG9uaWV4SlNPTik7XG4gIC8vIEJpdHRyZXggc2VjdGlvbiAtIEFsbCBjb2lucyBmcm9tIG9uZSByZXF1ZXN0LlxuICBsZXQgYml0dHJleEFMTCA9IGF3YWl0IGdldEV4Y2hhbmdlTWt0KFwiYml0dHJleFwiKTtcbiAgbGV0IGJpdHRyZXhKU09OID0gSlNPTi5wYXJzZShiaXR0cmV4QUxMLmV4Y2hhbmdlRGF0YSk7XG4gIC8vY29uc29sZS5sb2coXCJCaXR0cmV4OlwiLCBiaXR0cmV4SlNPTik7XG4gIGNvbnN0IGJpdHRyZXhSZXN1bHRzOiBBcnJheTxhbnk+ID0gYml0dHJleEpTT04ucmVzdWx0O1xuICBsZXQgYnRjTWF0Y2g6IEFycmF5PHN0cmluZz4gPSBbXTtcbiAgbGV0IGV0aE1hdGNoOiBBcnJheTxzdHJpbmc+ID0gW107XG4gIGxldCB1c2R0TWF0Y2g6IEFycmF5PHN0cmluZz4gPSBbXTtcbiAgYml0dHJleFJlc3VsdHMuZm9yRWFjaCggKGJpdHRyZXhFbGVtZW50KSA9PiB7XG4gICAgY29uc3QgcG9sb1RpY2tlciA9IGdldFBvbG9UaWNrZXJGcm9tQml0dHJleChiaXR0cmV4RWxlbWVudC5NYXJrZXROYW1lKTtcbiAgICBpZihwb2xvbmlleEpTT05bcG9sb1RpY2tlcl0pIHtcbiAgICAgIGxldCBiaXR0cmV4U3BsaXQgPSBiaXR0cmV4RWxlbWVudC5NYXJrZXROYW1lLnNwbGl0KFwiLVwiKTtcbiAgICAgIGlmIChiaXR0cmV4U3BsaXRbMF09PT1cIkJUQ1wiKXtcbiAgICAgICAgYnRjTWF0Y2gucHVzaChiaXR0cmV4U3BsaXRbMV0pO1xuICAgICAgfVxuICAgICAgaWYgKGJpdHRyZXhTcGxpdFswXT09PVwiRVRIXCIpe1xuICAgICAgICBldGhNYXRjaC5wdXNoKGJpdHRyZXhTcGxpdFsxXSk7XG4gICAgICB9XG4gICAgICBpZiAoYml0dHJleFNwbGl0WzBdPT09XCJVU0RUXCIpe1xuICAgICAgICB1c2R0TWF0Y2gucHVzaChiaXR0cmV4U3BsaXRbMV0pO1xuICAgICAgfVxuICAgICAgY29uc29sZS5sb2coXCJNYXRjaDpcIiwgYml0dHJleEVsZW1lbnQuTWFya2V0TmFtZSwgXCIgXCIsIHBvbG9UaWNrZXIpO1xuICAgIH1cbiAgfSk7XG4gIHByb2Nlc3Muc3Rkb3V0LndyaXRlKFwiQlRDOiBbXCIpO1xuICBidGNNYXRjaC5tYXAoKGVsZW0pID0+IHByb2Nlc3Muc3Rkb3V0LndyaXRlKFwiXFxcIlwiK2VsZW0rXCJcXFwiXCIrXCIsXCIpKTtcbiAgcHJvY2Vzcy5zdGRvdXQud3JpdGUoXCJdXFxuXCIpO1xuICBwcm9jZXNzLnN0ZG91dC53cml0ZShcIkVUSDogW1wiKTtcbiAgZXRoTWF0Y2gubWFwKChlbGVtKSA9PiBwcm9jZXNzLnN0ZG91dC53cml0ZShcIlxcXCJcIitlbGVtK1wiXFxcIlwiK1wiLFwiKSk7XG4gIHByb2Nlc3Muc3Rkb3V0LndyaXRlKFwiXVxcblwiKTtcbiAgcHJvY2Vzcy5zdGRvdXQud3JpdGUoXCJVU0RUOiBbXCIpO1xuICB1c2R0TWF0Y2gubWFwKChlbGVtKSA9PiBwcm9jZXNzLnN0ZG91dC53cml0ZShcIlxcXCJcIitlbGVtK1wiXFxcIlwiK1wiLFwiKSk7XG4gIHByb2Nlc3Muc3Rkb3V0LndyaXRlKFwiXVxcblwiKTtcbn1cblxuZnVuY3Rpb24gZ2V0UG9sb1RpY2tlckZyb21CaXR0cmV4KGJpdHRyZXhUaWNrZXIgOiBzdHJpbmcpOiBzdHJpbmcge1xuXG4gIGxldCBiaXR0cmV4U3BsaXQgPSBiaXR0cmV4VGlja2VyLnNwbGl0KFwiLVwiKTtcbiAgcmV0dXJuKGJpdHRyZXhTcGxpdFswXSArIFwiX1wiICsgYml0dHJleFNwbGl0WzFdKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcnVuUG9sb0hpdGJ0Y1RpY2tlckNvbXBhcmUoKSB7XG4gIC8vIFBvbG9uaWV4IHNlY3Rpb24gLSBBbGwgY29pbnMgZnJvbSBvbmUgcmVxdWVzdFxuICBsZXQgcG9sb25pZXhEYXRhID0gYXdhaXQgZ2V0RXhjaGFuZ2VEYXRhKHBvbG9uaWV4VVJMKTtcbiAgY29uc3QgcG9sb25pZXhKU09OID0gSlNPTi5wYXJzZShwb2xvbmlleERhdGEuZXhjaGFuZ2VEYXRhKTtcbiAgLy8gQml0dHJleCBzZWN0aW9uIC0gQWxsIGNvaW5zIGZyb20gb25lIHJlcXVlc3QuXG4gIGxldCBoaXRidGNBTEwgPSBhd2FpdCBnZXRFeGNoYW5nZURhdGEoaGl0YnRjVVJMKTtcbiAgbGV0IGhpdGJ0Y0pTT04gPSBKU09OLnBhcnNlKGhpdGJ0Y0FMTC5leGNoYW5nZURhdGEpO1xuICBoaXRidGNKU09OLmZvckVhY2goIChoaXRCVENFbGVtOiBhbnkpID0+IHtcbiAgICBsZXQgcHJvcG9zZWRQb2xvVGlja2VyID0gZ2V0UG9sb1RpY2tlckZyb21IaXRidGMoaGl0QlRDRWxlbS5zeW1ib2wpO1xuICAgIGlmIChwb2xvbmlleEpTT05bcHJvcG9zZWRQb2xvVGlja2VyXSkge1xuICAgICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUoXCJcXFwiXCIraGl0QlRDRWxlbS5zeW1ib2wrXCJcXFwiLFwiKTtcbiAgICB9XG4gIH0pO1xuICBwcm9jZXNzLnN0ZG91dC53cml0ZShcIlxcblwiKTtcbiAgaGl0YnRjSlNPTi5mb3JFYWNoKCAoaGl0QlRDRWxlbTogYW55KSA9PiB7XG4gICAgbGV0IHByb3Bvc2VkUG9sb1RpY2tlciA9IGdldFBvbG9UaWNrZXJGcm9tSGl0YnRjKGhpdEJUQ0VsZW0uc3ltYm9sKTtcbiAgICBpZiAocG9sb25pZXhKU09OW3Byb3Bvc2VkUG9sb1RpY2tlcl0pIHtcbiAgICAgIHByb2Nlc3Muc3Rkb3V0LndyaXRlKGhpdEJUQ0VsZW0uc3ltYm9sK1wiOiAgIFxcXCJcIitwcm9wb3NlZFBvbG9UaWNrZXIrXCJcXFwiLFxcblwiKTtcbiAgICB9XG4gIH0pO1xuICBwcm9jZXNzLnN0ZG91dC53cml0ZShcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gZ2V0UG9sb1RpY2tlckZyb21IaXRidGMoaGl0YnRjVGlja2VyIDogc3RyaW5nKTogc3RyaW5nIHtcblxuICBjb25zdCBiYXNlQ3VycmVuY3k6IEFycmF5PHN0cmluZz4gPSBbXCJCVENcIiwgXCJFVEhcIiwgXCJVU0RUXCJdO1xuICBmb3IobGV0IGlkeD0wOyBpZHg8YmFzZUN1cnJlbmN5Lmxlbmd0aDsgaWR4KyspIHtcbiAgICBpZihoaXRidGNUaWNrZXIuZW5kc1dpdGgoYmFzZUN1cnJlbmN5W2lkeF0pKSB7XG4gICAgICBsZXQgcG9sb1RpY2tlciA9IGJhc2VDdXJyZW5jeVtpZHhdICsgXCJfXCIgKyBoaXRidGNUaWNrZXIuc3Vic3RyaW5nKDAsaGl0YnRjVGlja2VyLmluZGV4T2YoYmFzZUN1cnJlbmN5W2lkeF0pKTtcbiAgICAgIHJldHVybihwb2xvVGlja2VyKTtcbiAgICB9XG4gIH1cbiByZXR1cm4oXCJOb1BvbG9cIik7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJ1bkJpdHRyZXhIaXRidGNUaWNrZXJDb21wYXJlKCkge1xuICAvLyBCaXR0cmV4IHNlY3Rpb24gLSBBbGwgY29pbnMgZnJvbSBvbmUgcmVxdWVzdC5cbiAgbGV0IGJpdHRyZXhBTEwgPSBhd2FpdCBnZXRFeGNoYW5nZURhdGEoYml0dHJleFVSTEFsbCk7XG4gIGxldCBiaXR0cmV4SlNPTiA9IEpTT04ucGFyc2UoYml0dHJleEFMTC5leGNoYW5nZURhdGEpO1xuICAvL2NvbnNvbGUubG9nKFwiQml0dHJleDpcIiwgYml0dHJleEpTT04pO1xuICBjb25zdCBiaXR0cmV4UmVzdWx0czogQXJyYXk8YW55PiA9IGJpdHRyZXhKU09OLnJlc3VsdDtcbiAgcHJvY2Vzcy5zdGRvdXQud3JpdGUoXCJcXG5cIik7XG4gIC8vIEhpdGJ0YyBzZWN0aW9uXG4gIGxldCBoaXRidGNBTEwgPSBhd2FpdCBnZXRFeGNoYW5nZURhdGEoaGl0YnRjVVJMKTtcbiAgbGV0IGhpdGJ0Y0pTT04gPSBKU09OLnBhcnNlKGhpdGJ0Y0FMTC5leGNoYW5nZURhdGEpO1xuICBiaXR0cmV4UmVzdWx0cy5mb3JFYWNoKCAoYml0dHJleEVsZW06IGFueSkgPT4ge1xuICAgIGxldCBwcm9wb3NlZEhpdGJ0Y1RpY2tlciA9IGdldEhpdGJ0Y1RpY2tlckZyb21CaXR0cmV4KGJpdHRyZXhFbGVtLk1hcmtldE5hbWUpO1xuICAgIGxldCB0aWNrZXJNYXRjaCA9IGhpdGJ0Y0pTT04uZmlsdGVyKChpdGVtOiBhbnkpID0+IHtcbiAgICAgIHJldHVybihpdGVtLnN5bWJvbD09PXByb3Bvc2VkSGl0YnRjVGlja2VyKTtcbiAgICB9KTtcbiAgICBpZih0aWNrZXJNYXRjaC5sZW5ndGghPTApXG4gICAgICBjb25zb2xlLmxvZyhiaXR0cmV4RWxlbS5NYXJrZXROYW1lLCBcIiBnYXZlIFwiLCBwcm9wb3NlZEhpdGJ0Y1RpY2tlciwgXCIgbWF0Y2hlZFwiLCB0aWNrZXJNYXRjaFswXS5zeW1ib2wpO1xuICB9KTtcbiAgcHJvY2Vzcy5zdGRvdXQud3JpdGUoXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIGdldEhpdGJ0Y1RpY2tlckZyb21CaXR0cmV4KGJpdHRyZXhUaWNrZXIgOiBzdHJpbmcpOiBzdHJpbmcge1xuXG4gIGxldCBiaXR0cmV4U3BsaXQgPSBiaXR0cmV4VGlja2VyLnNwbGl0KFwiLVwiKTtcbiAgcmV0dXJuKGJpdHRyZXhTcGxpdFsxXSArIGJpdHRyZXhTcGxpdFswXSk7XG59XG5cbi8vcnVuUG9sb0JpdHRyZXhUaWNrZXJDb21wYXJlKCk7XG4vL3J1blBvbG9IaXRidGNUaWNrZXJDb21wYXJlKCk7XG4vL3J1bkJpdHRyZXhIaXRidGNUaWNrZXJDb21wYXJlKCk7XG4vL3J1blBvbG9CaW5hbmNlVGlja2VyQ29tcGFyZSgpO1xucnVuQml0dHJleEJpbmFuY2VUaWNrZXJDb21wYXJlKCk7Il19