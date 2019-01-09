"use strict";

var _getCryptoData = require("./utils/getCryptoData.js");

var _comparePricingData = require("./utils/comparePricingData");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

require("@babel/polyfill");

var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

var poloniexURL = "https://poloniex.com/public?command=returnTicker";
var coinbaseURL = "https://api.pro.coinbase.com/products";
var bittrexURL = "https://bittrex.com/api/v1.1/public/getmarketsummary";
var bittrexURLAll = "https://bittrex.com/api/v1.1/public/getmarketsummaries";
var threshold = 1.01;
var numberOfChecks = 0;
var intervalHandel = -1;
var maxBuyArb = 0;
var maxSellArb = 0;
var maxSellArbETH = 0;
var maxSellArbXMR = 0;
var timeInSecondsBetweenPriceChecks = 15;
/* poloInternalCompare
 * desc: Looks for arbitrage profits from scenarios where a coin1 is exchanged for coin2, coin2 exchanged for coin3 and then 
 *       coin3 exchanged back into coin1.
 *       This compare looks only within the Poloniex exchange.
*/

function poloInternalCompare() {
  console.log("BEGIN: poloInternalCompare");
  var xmlhttp = new XMLHttpRequest(),
      method = "GET",
      url = poloniexURL;
  console.log("Loading data from : Http.send(", url, ")");
  xmlhttp.open(method, url, true);

  xmlhttp.onerror = function () {
    console.log("** An error occurred during the transaction");
  };

  xmlhttp.onreadystatechange = function () {
    if (this.readyState === 4 && this.status === 200) {
      var exchangeData = xmlhttp.responseText;
      numberOfChecks++;
      var timeStamp = new Date();
      var exchangeObject = JSON.parse(exchangeData);
      var coins = ["FOAM", "ZEC", "LTC", "ETH", "XRP", "STR", "XMR", "DOGE", "BCHABC", "BCHSV"];
      var baseStableCoin = "USDC";
      analyzePoloBTCPrices(exchangeObject, baseStableCoin, coins, timeStamp);
      coins = ["BAT", "BNT", "DASH", "DOGE", "EOS", "ETC", "ETH", "GNT", "KNC", "LOOM", "LSK", "LTC", "MANA", "NXT", "QTUM", "REP", "SC", "SNT", "STR", "XMR", "XRP", "ZEC", "ZRX"];
      baseStableCoin = "USDT";
      analyzePoloBTCPrices(exchangeObject, baseStableCoin, coins, timeStamp);
      analyzePoloETHPrices(exchangeObject, timeStamp);
      analyzePoloXMRPrices(exchangeObject, timeStamp);
    }
  };

  xmlhttp.send();
  console.log("END: poloInternalCompare");
}
/* analyzePoloBTCPrices
 * desc: Takes the exchange prices from Poloniex and does the detailed compares to find arbitrage
 *       within this exchange.  It does this for the BTC market.
 */


function analyzePoloBTCPrices(exchangePrices, baseStableCoin, coins, timeStamp) {
  var timeStampStr = timeStamp.getTime();
  console.log("priceCheckCount:".concat(numberOfChecks, "|").concat(baseStableCoin, "|maxBuyArb:").concat(maxBuyArb, "|maxSellArb:").concat(maxSellArb)); // Check if buying the coin will be profitable.

  coins.forEach(function (curCoin) {
    var lowestAskBTC = exchangePrices["BTC_" + curCoin].lowestAsk;
    var highestBidUSDC = exchangePrices[baseStableCoin + "_" + curCoin].highestBid;
    var USDC_BTClowestAsk = exchangePrices[baseStableCoin + "_" + "BTC"].lowestAsk;
    var ArbRatio = highestBidUSDC / (lowestAskBTC * USDC_BTClowestAsk);
    var showMax = "";

    if (ArbRatio > maxBuyArb) {
      maxBuyArb = ArbRatio;
      showMax = "NewMax";
    }

    if (ArbRatio > 1.0) console.log("REC|".concat(timeStamp, "|").concat(timeStampStr, "|Buy|").concat(baseStableCoin, "|").concat(curCoin, "|ArbRatio:").concat(ArbRatio, "|").concat(showMax));

    if (ArbRatio > threshold) {
      console.log("Something dramatic needs to happen!");
    }
  }); // Check if selling the coin will be profitable

  coins.forEach(function (curCoin) {
    var BTC_curCoinBid = exchangePrices["BTC_" + curCoin].highestBid;
    var USDC_BTCBid = exchangePrices[baseStableCoin + "_" + "BTC"].highestBid;
    var USDC_curCoinAsk = exchangePrices[baseStableCoin + "_" + curCoin].lowestAsk;
    var AmtInit = 10000;
    var AmtFinal = AmtInit * BTC_curCoinBid * USDC_BTCBid / USDC_curCoinAsk;
    var ArbRatio = AmtFinal / AmtInit;
    var showMax = "";

    if (ArbRatio > maxSellArb) {
      maxSellArb = ArbRatio;
      showMax = "NewMax";
    }

    if (ArbRatio > 1.0) console.log("REC|".concat(timeStamp, "|").concat(timeStampStr, "|Sell|").concat(baseStableCoin, "|").concat(curCoin, "|ArbRatio:").concat(ArbRatio, "|").concat(showMax));

    if (ArbRatio > threshold) {
      console.log("Something dramatic needs to happen!");
    }
  });
}
/* analyzePoloETHPrices
 * desc: Takes the exchange prices from Poloniex and does the detailed compares to find arbitrage
 *       within this exchange for their ETH market.
 */


function analyzePoloETHPrices(exchangePrices, timeStamp) {
  var timeStampStr = timeStamp.getTime();
  console.log("priceCheckCount:".concat(numberOfChecks, "|ETH|maxBuyArb:N/A|maxSellArbETH:").concat(maxSellArbETH));
  var coins = ["BAT", "BNT", "CVC", "EOS", "ETC", "GAS", "GNT", "KNC", "LOOM", "LSK", "MANA", "OMG", "QTUM", "REP", "SNT", "STEEM", "ZEC", "ZRX"]; // Check if selling the coin will be profitable

  coins.forEach(function (curCoin) {
    var ETH_curCoinBid = exchangePrices["ETH_" + curCoin].highestBid;
    var BTC_ETHBid = exchangePrices["BTC_ETH"].highestBid;
    var BTC_curCoinAsk = exchangePrices["BTC_" + curCoin].lowestAsk;
    var AmtInit = 1;
    var AmtFinal = AmtInit * BTC_ETHBid * ETH_curCoinBid / BTC_curCoinAsk;
    var ArbRatio = AmtFinal / AmtInit;
    var showMax = "";

    if (ArbRatio > maxSellArbETH) {
      maxSellArbETH = ArbRatio;
      showMax = "NewMax";
    }

    if (ArbRatio > 1.0) console.log("REC|".concat(timeStamp, "|").concat(timeStampStr, "|Sell|").concat(curCoin, "|ETH|ArbRatio:").concat(ArbRatio, "|").concat(showMax));

    if (ArbRatio > threshold) {
      var instructions = "ALERT: Sell ".concat(AmtInit, " ").concat(curCoin, " for ").concat(AmtInit * ETH_curCoinBid, " ETH, \n        then sell those ETH for ").concat(AmtInit * ETH_curCoinBid * BTC_ETHBid, " BTC,\n        then use those BTC to buy ").concat(AmtFinal, " ").concat(curCoin);
      console.log(instructions);
    }
  });
}
/* analyzePoloXMRPrices
 * desc: Takes the exchange prices from Poloniex and does the detailed compares to find arbitrage
 *       within this exchange for their XRM market.
 */


function analyzePoloXMRPrices(exchangePrices, timeStamp) {
  var timeStampStr = timeStamp.getTime();
  console.log("priceCheckCount:".concat(numberOfChecks, "|XMR|maxBuyArb:N/A|maxSellArbXMR:").concat(maxSellArbXMR));
  var coins = ["LTC", "ZEC", "NXT", "DASH", "BCN", "MAID"]; // Check if selling the coin will be profitable

  coins.forEach(function (curCoin) {
    var baseMarket = "XMR";
    var baseMarket_curCoinBid = exchangePrices[baseMarket + "_" + curCoin].highestBid;
    var BTC_baseMarketBid = exchangePrices["BTC" + "_" + baseMarket].highestBid;
    var BTC_curCoinAsk = exchangePrices["BTC" + "_" + curCoin].lowestAsk;
    var AmtInit = 1;
    var AmtFinal = AmtInit * BTC_baseMarketBid * baseMarket_curCoinBid / BTC_curCoinAsk;
    var ArbRatio = AmtFinal / AmtInit;
    var showMax = "";

    if (ArbRatio > maxSellArbXMR) {
      maxSellArbXMR = ArbRatio;
      showMax = "NewMax";
    }

    if (ArbRatio > 1.0) console.log("REC|".concat(timeStamp, "|").concat(timeStampStr, "|Sell|").concat(curCoin, "|XMR|ArbRatio:").concat(ArbRatio, "|").concat(showMax));

    if (ArbRatio > threshold) {
      var instructions = "ALERT: Sell ".concat(AmtInit, " ").concat(curCoin, " for ").concat(AmtInit * baseMarket_curCoinBid, " XMR, \n        then sell those XMR for ").concat(AmtInit * BTC_baseMarketBid * baseMarket_curCoinBid, " BTC,\n        then use those BTC to buy ").concat(AmtFinal, " ").concat(curCoin);
      console.log(instructions);
    }
  });
}

function runPoloCoinbaseCompare() {
  return _runPoloCoinbaseCompare.apply(this, arguments);
}

function _runPoloCoinbaseCompare() {
  _runPoloCoinbaseCompare = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee() {
    var poloniexData, coinbaseDataZEC, coinbaseDataETH, coinbaseDataBTC;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return (0, _getCryptoData.getExchangeData)(poloniexURL);

          case 2:
            poloniexData = _context.sent;
            _context.next = 5;
            return (0, _getCryptoData.getExchangeData)(coinbaseURL + "/ZEC-USDC/book");

          case 5:
            coinbaseDataZEC = _context.sent;
            _context.next = 8;
            return (0, _getCryptoData.getExchangeData)(coinbaseURL + "/ETH-USDC/book");

          case 8:
            coinbaseDataETH = _context.sent;
            _context.next = 11;
            return (0, _getCryptoData.getExchangeData)(coinbaseURL + "/BTC-USDC/book");

          case 11:
            coinbaseDataBTC = _context.sent;
            (0, _comparePricingData.comparePoloniexCoinbase)(poloniexData, coinbaseDataZEC, "ZEC");
            (0, _comparePricingData.comparePoloniexCoinbase)(poloniexData, coinbaseDataETH, "ETH");
            (0, _comparePricingData.comparePoloniexCoinbase)(poloniexData, coinbaseDataBTC, "BTC");

          case 15:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _runPoloCoinbaseCompare.apply(this, arguments);
}

function runPoloBittrexCompare() {
  return _runPoloBittrexCompare.apply(this, arguments);
} // Set the default copare to run.


function _runPoloBittrexCompare() {
  _runPoloBittrexCompare = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2() {
    var poloniexData, bittrexALL, bittrexJSON, bittrexBTCCoins, baseMarkets;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            numberOfChecks++; // Poloniex section - All coins from one request

            _context2.next = 3;
            return (0, _getCryptoData.getExchangeData)(poloniexURL);

          case 3:
            poloniexData = _context2.sent;
            _context2.next = 6;
            return (0, _getCryptoData.getExchangeData)(bittrexURLAll);

          case 6:
            bittrexALL = _context2.sent;
            bittrexJSON = JSON.parse(bittrexALL.exchangeData);
            bittrexBTCCoins = {
              BTC: ["ardr", "bat", "bnt", "burst", "cvc", "dash", "dgb", "doge", "etc", "eth", "fct", "game", "gnt", "lbc", "loom", "lsk", "ltc", "mana", "nav", "nmr", "nxt", "omg", "poly", "ppc", "qtum", "rep", "sbd", "sc", "snt", "steem", "storj", "xrp", "sys", "strat", "via", "vtc", "xcp", "xem", "xmr", "xrp", "zec", "zrx"],
              ETH: ["BAT", "BNT", "CVC", "ETC", "GNT", "MANA", "OMG", "QTUM", "REP", "SNT", "ZEC", "ZRX"],
              USDT: ["BAT", "BTC", "DASH"]
            };
            baseMarkets = ["BTC", "ETH", "USDT"];
            baseMarkets.forEach(function (baseMkt) {
              console.log("Processing basemkt:", baseMkt);
              var bittrexTrimmed = {};
              bittrexJSON.result.forEach(function (market) {
                bittrexBTCCoins[baseMkt].forEach(function (coin) {
                  var MarketName = baseMkt + "-" + coin.toUpperCase(); //console.log("MarketName:", MarketName);

                  if (market.MarketName === MarketName) {
                    bittrexTrimmed[MarketName] = market;
                  }
                });
              });
              var bittrexCompare = {};
              bittrexCompare.timeStamp = bittrexALL.timeStamp;
              bittrexCompare.exchangeData = bittrexTrimmed;
              (0, _comparePricingData.compareAllPoloniexBittrex)(poloniexData, bittrexCompare);
            });
            console.log("Compare cycle ".concat(numberOfChecks, " complete."));

          case 12:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));
  return _runPoloBittrexCompare.apply(this, arguments);
}

var compareToRun = runPoloBittrexCompare;

if (process.argv.length >= 3) {
  if (process.argv[2] === "polointernal") {
    console.log("Running polointernal compare.");
    compareToRun = poloInternalCompare;
  } else {
    if (process.argv[2] === "polocoinbase") {
      compareToRun = runPoloCoinbaseCompare;
      console.log("Running PoloCoinbaseCompare compare.");
    } else {
      console.log("Running default polo bittrex compare.");
    }
  }
}

var newInteral = 1000 * (timeInSecondsBetweenPriceChecks + 20 * Math.random());
console.log("Setting the timer interval to ".concat(newInteral / 1000, " seconds."));
compareToRun();
intervalHandel = setInterval(compareToRun, newInteral);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcHAuanMiXSwibmFtZXMiOlsicmVxdWlyZSIsIlhNTEh0dHBSZXF1ZXN0IiwicG9sb25pZXhVUkwiLCJjb2luYmFzZVVSTCIsImJpdHRyZXhVUkwiLCJiaXR0cmV4VVJMQWxsIiwidGhyZXNob2xkIiwibnVtYmVyT2ZDaGVja3MiLCJpbnRlcnZhbEhhbmRlbCIsIm1heEJ1eUFyYiIsIm1heFNlbGxBcmIiLCJtYXhTZWxsQXJiRVRIIiwibWF4U2VsbEFyYlhNUiIsInRpbWVJblNlY29uZHNCZXR3ZWVuUHJpY2VDaGVja3MiLCJwb2xvSW50ZXJuYWxDb21wYXJlIiwiY29uc29sZSIsImxvZyIsInhtbGh0dHAiLCJtZXRob2QiLCJ1cmwiLCJvcGVuIiwib25lcnJvciIsIm9ucmVhZHlzdGF0ZWNoYW5nZSIsInJlYWR5U3RhdGUiLCJzdGF0dXMiLCJleGNoYW5nZURhdGEiLCJyZXNwb25zZVRleHQiLCJ0aW1lU3RhbXAiLCJEYXRlIiwiZXhjaGFuZ2VPYmplY3QiLCJKU09OIiwicGFyc2UiLCJjb2lucyIsImJhc2VTdGFibGVDb2luIiwiYW5hbHl6ZVBvbG9CVENQcmljZXMiLCJhbmFseXplUG9sb0VUSFByaWNlcyIsImFuYWx5emVQb2xvWE1SUHJpY2VzIiwic2VuZCIsImV4Y2hhbmdlUHJpY2VzIiwidGltZVN0YW1wU3RyIiwiZ2V0VGltZSIsImZvckVhY2giLCJjdXJDb2luIiwibG93ZXN0QXNrQlRDIiwibG93ZXN0QXNrIiwiaGlnaGVzdEJpZFVTREMiLCJoaWdoZXN0QmlkIiwiVVNEQ19CVENsb3dlc3RBc2siLCJBcmJSYXRpbyIsInNob3dNYXgiLCJCVENfY3VyQ29pbkJpZCIsIlVTRENfQlRDQmlkIiwiVVNEQ19jdXJDb2luQXNrIiwiQW10SW5pdCIsIkFtdEZpbmFsIiwiRVRIX2N1ckNvaW5CaWQiLCJCVENfRVRIQmlkIiwiQlRDX2N1ckNvaW5Bc2siLCJpbnN0cnVjdGlvbnMiLCJiYXNlTWFya2V0IiwiYmFzZU1hcmtldF9jdXJDb2luQmlkIiwiQlRDX2Jhc2VNYXJrZXRCaWQiLCJydW5Qb2xvQ29pbmJhc2VDb21wYXJlIiwicG9sb25pZXhEYXRhIiwiY29pbmJhc2VEYXRhWkVDIiwiY29pbmJhc2VEYXRhRVRIIiwiY29pbmJhc2VEYXRhQlRDIiwicnVuUG9sb0JpdHRyZXhDb21wYXJlIiwiYml0dHJleEFMTCIsImJpdHRyZXhKU09OIiwiYml0dHJleEJUQ0NvaW5zIiwiQlRDIiwiRVRIIiwiVVNEVCIsImJhc2VNYXJrZXRzIiwiYmFzZU1rdCIsImJpdHRyZXhUcmltbWVkIiwicmVzdWx0IiwibWFya2V0IiwiY29pbiIsIk1hcmtldE5hbWUiLCJ0b1VwcGVyQ2FzZSIsImJpdHRyZXhDb21wYXJlIiwiY29tcGFyZVRvUnVuIiwicHJvY2VzcyIsImFyZ3YiLCJsZW5ndGgiLCJuZXdJbnRlcmFsIiwiTWF0aCIsInJhbmRvbSIsInNldEludGVydmFsIl0sIm1hcHBpbmdzIjoiOztBQUVBOztBQUNBOzs7Ozs7QUFIQUEsT0FBTyxDQUFDLGlCQUFELENBQVA7O0FBS0EsSUFBSUMsY0FBYyxHQUFHRCxPQUFPLENBQUMsZ0JBQUQsQ0FBUCxDQUEwQkMsY0FBL0M7O0FBRUEsSUFBTUMsV0FBVyxHQUFHLGtEQUFwQjtBQUNBLElBQU1DLFdBQVcsR0FBRyx1Q0FBcEI7QUFDQSxJQUFNQyxVQUFVLEdBQUcsc0RBQW5CO0FBQ0EsSUFBTUMsYUFBYSxHQUFHLHdEQUF0QjtBQUNBLElBQU1DLFNBQVMsR0FBRyxJQUFsQjtBQUNBLElBQUlDLGNBQWMsR0FBRyxDQUFyQjtBQUNBLElBQUlDLGNBQWMsR0FBRyxDQUFDLENBQXRCO0FBQ0EsSUFBSUMsU0FBUyxHQUFHLENBQWhCO0FBQ0EsSUFBSUMsVUFBVSxHQUFHLENBQWpCO0FBQ0EsSUFBSUMsYUFBYSxHQUFHLENBQXBCO0FBQ0EsSUFBSUMsYUFBYSxHQUFHLENBQXBCO0FBRUEsSUFBTUMsK0JBQStCLEdBQUcsRUFBeEM7QUFFQTs7Ozs7O0FBS0EsU0FBU0MsbUJBQVQsR0FBK0I7QUFFN0JDLEVBQUFBLE9B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SUFBUixDQUFhLENBQWIsTUFBa0IsY0FBdEIsRUFBc0M7QUFDcENGLE1BQUFBLFlBQVksR0FBR3JCLHNCQUFmO0FBQ0EvQyxNQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxzQ0FBWjtBQUNELEtBSEQsTUFJSztBQUNIRCxNQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSx1Q0FBWjtBQUNEO0FBQ0Y7QUFDRjs7QUFDRCxJQUFJdUUsVUFBVSxHQUFHLFFBQU0xRSwrQkFBK0IsR0FBRyxLQUFHMkUsSUFBSSxDQUFDQyxNQUFMLEVBQTNDLENBQWpCO0FBQ0ExRSxPQUFPLENBQUNDLEdBQVIseUNBQTZDdUUsVUFBVSxHQUFDLElBQXhEO0FBQ0FKLFlBQVk7QUFDWjNFLGNBQWMsR0FBR2tGLFdBQVcsQ0FBQ1AsWUFBRCxFQUFlSSxVQUFmLENBQTVCIiwic291cmNlc0NvbnRlbnQiOlsicmVxdWlyZShcIkBiYWJlbC9wb2x5ZmlsbFwiKTtcblxuaW1wb3J0IHtnZXRFeGNoYW5nZURhdGF9IGZyb20gXCIuL3V0aWxzL2dldENyeXB0b0RhdGEuanNcIjtcbmltcG9ydCB7Y29tcGFyZVBvbG9uaWV4Q29pbmJhc2UsIGNvbXBhcmVBbGxQb2xvbmlleEJpdHRyZXh9IGZyb20gXCIuL3V0aWxzL2NvbXBhcmVQcmljaW5nRGF0YVwiO1xuXG5sZXQgWE1MSHR0cFJlcXVlc3QgPSByZXF1aXJlKFwieG1saHR0cHJlcXVlc3RcIikuWE1MSHR0cFJlcXVlc3Q7XG5cbmNvbnN0IHBvbG9uaWV4VVJMID0gXCJodHRwczovL3BvbG9uaWV4LmNvbS9wdWJsaWM/Y29tbWFuZD1yZXR1cm5UaWNrZXJcIjsgXG5jb25zdCBjb2luYmFzZVVSTCA9IFwiaHR0cHM6Ly9hcGkucHJvLmNvaW5iYXNlLmNvbS9wcm9kdWN0c1wiOyBcbmNvbnN0IGJpdHRyZXhVUkwgPSBcImh0dHBzOi8vYml0dHJleC5jb20vYXBpL3YxLjEvcHVibGljL2dldG1hcmtldHN1bW1hcnlcIjtcbmNvbnN0IGJpdHRyZXhVUkxBbGwgPSBcImh0dHBzOi8vYml0dHJleC5jb20vYXBpL3YxLjEvcHVibGljL2dldG1hcmtldHN1bW1hcmllc1wiO1xuY29uc3QgdGhyZXNob2xkID0gMS4wMTtcbmxldCBudW1iZXJPZkNoZWNrcyA9IDA7XG5sZXQgaW50ZXJ2YWxIYW5kZWwgPSAtMTtcbmxldCBtYXhCdXlBcmIgPSAwO1xubGV0IG1heFNlbGxBcmIgPSAwO1xubGV0IG1heFNlbGxBcmJFVEggPSAwO1xubGV0IG1heFNlbGxBcmJYTVIgPSAwO1xuXG5jb25zdCB0aW1lSW5TZWNvbmRzQmV0d2VlblByaWNlQ2hlY2tzID0gMTU7XG5cbi8qIHBvbG9JbnRlcm5hbENvbXBhcmVcbiAqIGRlc2M6IExvb2tzIGZvciBhcmJpdHJhZ2UgcHJvZml0cyBmcm9tIHNjZW5hcmlvcyB3aGVyZSBhIGNvaW4xIGlzIGV4Y2hhbmdlZCBmb3IgY29pbjIsIGNvaW4yIGV4Y2hhbmdlZCBmb3IgY29pbjMgYW5kIHRoZW4gXG4gKiAgICAgICBjb2luMyBleGNoYW5nZWQgYmFjayBpbnRvIGNvaW4xLlxuICogICAgICAgVGhpcyBjb21wYXJlIGxvb2tzIG9ubHkgd2l0aGluIHRoZSBQb2xvbmlleCBleGNoYW5nZS5cbiovXG5mdW5jdGlvbiBwb2xvSW50ZXJuYWxDb21wYXJlKCkge1xuXG4gIGNvbnNvbGUubG9nKFwiQkVHSU46IHBvbG9JbnRlcm5hbENvbXBhcmVcIik7XG4gIGxldCB4bWxodHRwID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCksXG4gICAgbWV0aG9kID0gXCJHRVRcIixcbiAgICB1cmwgPSBwb2xvbmlleFVSTDtcblxuICBjb25zb2xlLmxvZyhcIkxvYWRpbmcgZGF0YSBmcm9tIDogSHR0cC5zZW5kKFwiLCB1cmwsIFwiKVwiKTtcbiAgeG1saHR0cC5vcGVuKG1ldGhvZCwgdXJsLCB0cnVlKTtcbiAgeG1saHR0cC5vbmVycm9yID0gZnVuY3Rpb24gKCkge1xuICAgIGNvbnNvbGUubG9nKFwiKiogQW4gZXJyb3Igb2NjdXJyZWQgZHVyaW5nIHRoZSB0cmFuc2FjdGlvblwiKTtcbiAgfTtcbiAgeG1saHR0cC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5yZWFkeVN0YXRlPT09NCAmJiB0aGlzLnN0YXR1cz09PTIwMCkge1xuICAgICAgbGV0IGV4Y2hhbmdlRGF0YSA9IHhtbGh0dHAucmVzcG9uc2VUZXh0O1xuICAgICAgbnVtYmVyT2ZDaGVja3MrKztcbiAgICAgIGxldCB0aW1lU3RhbXAgPSBuZXcgRGF0ZSgpO1xuICAgICAgbGV0IGV4Y2hhbmdlT2JqZWN0ID0gSlNPTi5wYXJzZShleGNoYW5nZURhdGEpO1xuICAgICAgbGV0IGNvaW5zID0gW1wiRk9BTVwiLCBcIlpFQ1wiLCBcIkxUQ1wiLCBcIkVUSFwiLCBcIlhSUFwiLCBcIlNUUlwiLCBcIlhNUlwiLCBcIkRPR0VcIiwgXCJCQ0hBQkNcIiwgXCJCQ0hTVlwiXTtcbiAgICAgIGxldCBiYXNlU3RhYmxlQ29pbiA9IFwiVVNEQ1wiO1xuICAgICAgYW5hbHl6ZVBvbG9CVENQcmljZXMoZXhjaGFuZ2VPYmplY3QsIGJhc2VTdGFibGVDb2luLCBjb2lucywgdGltZVN0YW1wKTtcbiAgICAgIGNvaW5zID0gW1wiQkFUXCIsIFwiQk5UXCIsIFwiREFTSFwiLCBcIkRPR0VcIiwgXCJFT1NcIiwgXCJFVENcIiwgXCJFVEhcIiwgXCJHTlRcIiwgXCJLTkNcIiwgXCJMT09NXCIsIFwiTFNLXCIsXG4gICAgICAgIFwiTFRDXCIsIFwiTUFOQVwiLCBcIk5YVFwiLCBcIlFUVU1cIiwgXCJSRVBcIiwgXCJTQ1wiLCBcIlNOVFwiLCBcIlNUUlwiLCBcIlhNUlwiLCBcIlhSUFwiLCBcIlpFQ1wiLCBcIlpSWFwiXTtcbiAgICAgIGJhc2VTdGFibGVDb2luID0gXCJVU0RUXCI7IFxuICAgICAgYW5hbHl6ZVBvbG9CVENQcmljZXMoZXhjaGFuZ2VPYmplY3QsIGJhc2VTdGFibGVDb2luLCBjb2lucywgdGltZVN0YW1wKTtcbiAgICAgIGFuYWx5emVQb2xvRVRIUHJpY2VzKGV4Y2hhbmdlT2JqZWN0LCB0aW1lU3RhbXApO1xuICAgICAgYW5hbHl6ZVBvbG9YTVJQcmljZXMoZXhjaGFuZ2VPYmplY3QsIHRpbWVTdGFtcCk7XG4gICAgfVxuICB9XG4gIHhtbGh0dHAuc2VuZCgpO1xuICBjb25zb2xlLmxvZyhcIkVORDogcG9sb0ludGVybmFsQ29tcGFyZVwiKTtcbn1cblxuLyogYW5hbHl6ZVBvbG9CVENQcmljZXNcbiAqIGRlc2M6IFRha2VzIHRoZSBleGNoYW5nZSBwcmljZXMgZnJvbSBQb2xvbmlleCBhbmQgZG9lcyB0aGUgZGV0YWlsZWQgY29tcGFyZXMgdG8gZmluZCBhcmJpdHJhZ2VcbiAqICAgICAgIHdpdGhpbiB0aGlzIGV4Y2hhbmdlLiAgSXQgZG9lcyB0aGlzIGZvciB0aGUgQlRDIG1hcmtldC5cbiAqL1xuZnVuY3Rpb24gYW5hbHl6ZVBvbG9CVENQcmljZXMoZXhjaGFuZ2VQcmljZXMsIGJhc2VTdGFibGVDb2luLCBjb2lucywgdGltZVN0YW1wKSB7XG5cbiAgbGV0IHRpbWVTdGFtcFN0ciA9IHRpbWVTdGFtcC5nZXRUaW1lKCk7XG4gIGNvbnNvbGUubG9nKGBwcmljZUNoZWNrQ291bnQ6JHtudW1iZXJPZkNoZWNrc318JHtiYXNlU3RhYmxlQ29pbn18bWF4QnV5QXJiOiR7bWF4QnV5QXJifXxtYXhTZWxsQXJiOiR7bWF4U2VsbEFyYn1gKTtcbiAgLy8gQ2hlY2sgaWYgYnV5aW5nIHRoZSBjb2luIHdpbGwgYmUgcHJvZml0YWJsZS5cbiAgY29pbnMuZm9yRWFjaChjdXJDb2luID0+IHtcbiAgICBsZXQgbG93ZXN0QXNrQlRDID0gZXhjaGFuZ2VQcmljZXNbXCJCVENfXCIgKyBjdXJDb2luXS5sb3dlc3RBc2s7XG4gICAgbGV0IGhpZ2hlc3RCaWRVU0RDID0gZXhjaGFuZ2VQcmljZXNbYmFzZVN0YWJsZUNvaW4gKyBcIl9cIiArIGN1ckNvaW5dLmhpZ2hlc3RCaWQ7XG4gICAgbGV0IFVTRENfQlRDbG93ZXN0QXNrID0gZXhjaGFuZ2VQcmljZXNbYmFzZVN0YWJsZUNvaW4gKyBcIl9cIiArIFwiQlRDXCJdLmxvd2VzdEFzaztcbiAgICBsZXQgQXJiUmF0aW8gPSBoaWdoZXN0QmlkVVNEQyAvICggbG93ZXN0QXNrQlRDICogIFVTRENfQlRDbG93ZXN0QXNrKTtcbiAgICBsZXQgc2hvd01heCA9IFwiXCI7XG4gICAgaWYgKEFyYlJhdGlvPm1heEJ1eUFyYikge1xuICAgICAgbWF4QnV5QXJiID0gQXJiUmF0aW87XG4gICAgICBzaG93TWF4ID0gXCJOZXdNYXhcIjtcbiAgICB9XG4gICAgaWYgKEFyYlJhdGlvPjEuMClcbiAgICAgIGNvbnNvbGUubG9nKGBSRUN8JHt0aW1lU3RhbXB9fCR7dGltZVN0YW1wU3RyfXxCdXl8JHtiYXNlU3RhYmxlQ29pbn18JHtjdXJDb2lufXxBcmJSYXRpbzoke0FyYlJhdGlvfXwke3Nob3dNYXh9YCk7XG4gICAgaWYgKEFyYlJhdGlvID4gdGhyZXNob2xkKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIlNvbWV0aGluZyBkcmFtYXRpYyBuZWVkcyB0byBoYXBwZW4hXCIpO1xuICAgIH1cbiAgfSk7XG4gIC8vIENoZWNrIGlmIHNlbGxpbmcgdGhlIGNvaW4gd2lsbCBiZSBwcm9maXRhYmxlXG4gIGNvaW5zLmZvckVhY2goY3VyQ29pbiA9PiB7XG4gICAgbGV0IEJUQ19jdXJDb2luQmlkID0gZXhjaGFuZ2VQcmljZXNbXCJCVENfXCIrY3VyQ29pbl0uaGlnaGVzdEJpZDtcbiAgICBsZXQgVVNEQ19CVENCaWQgPSBleGNoYW5nZVByaWNlc1tiYXNlU3RhYmxlQ29pbiArIFwiX1wiICsgXCJCVENcIl0uaGlnaGVzdEJpZDtcbiAgICBsZXQgVVNEQ19jdXJDb2luQXNrID0gZXhjaGFuZ2VQcmljZXNbYmFzZVN0YWJsZUNvaW4gKyBcIl9cIiArY3VyQ29pbl0ubG93ZXN0QXNrO1xuICAgIGxldCBBbXRJbml0ID0gMTAwMDA7XG4gICAgbGV0IEFtdEZpbmFsID0gQW10SW5pdCpCVENfY3VyQ29pbkJpZCpVU0RDX0JUQ0JpZC9VU0RDX2N1ckNvaW5Bc2s7XG4gICAgbGV0IEFyYlJhdGlvID0gQW10RmluYWwvQW10SW5pdDtcbiAgICBsZXQgc2hvd01heCA9IFwiXCI7XG4gICAgaWYgKEFyYlJhdGlvPm1heFNlbGxBcmIpIHtcbiAgICAgIG1heFNlbGxBcmIgPSBBcmJSYXRpbztcbiAgICAgIHNob3dNYXggPSBcIk5ld01heFwiO1xuICAgIH1cbiAgICBpZiAoQXJiUmF0aW8+MS4wKVxuICAgICAgY29uc29sZS5sb2coYFJFQ3wke3RpbWVTdGFtcH18JHt0aW1lU3RhbXBTdHJ9fFNlbGx8JHtiYXNlU3RhYmxlQ29pbn18JHtjdXJDb2lufXxBcmJSYXRpbzoke0FyYlJhdGlvfXwke3Nob3dNYXh9YCk7XG4gICAgaWYgKEFyYlJhdGlvID4gdGhyZXNob2xkKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIlNvbWV0aGluZyBkcmFtYXRpYyBuZWVkcyB0byBoYXBwZW4hXCIpO1xuICAgIH1cbiAgfSk7XG59XG5cbi8qIGFuYWx5emVQb2xvRVRIUHJpY2VzXG4gKiBkZXNjOiBUYWtlcyB0aGUgZXhjaGFuZ2UgcHJpY2VzIGZyb20gUG9sb25pZXggYW5kIGRvZXMgdGhlIGRldGFpbGVkIGNvbXBhcmVzIHRvIGZpbmQgYXJiaXRyYWdlXG4gKiAgICAgICB3aXRoaW4gdGhpcyBleGNoYW5nZSBmb3IgdGhlaXIgRVRIIG1hcmtldC5cbiAqL1xuZnVuY3Rpb24gYW5hbHl6ZVBvbG9FVEhQcmljZXMoZXhjaGFuZ2VQcmljZXMsIHRpbWVTdGFtcCkge1xuXG4gIGxldCB0aW1lU3RhbXBTdHIgPSB0aW1lU3RhbXAuZ2V0VGltZSgpO1xuICBjb25zb2xlLmxvZyhgcHJpY2VDaGVja0NvdW50OiR7bnVtYmVyT2ZDaGVja3N9fEVUSHxtYXhCdXlBcmI6Ti9BfG1heFNlbGxBcmJFVEg6JHttYXhTZWxsQXJiRVRIfWApO1xuICBsZXQgY29pbnMgPSBbXCJCQVRcIiwgXCJCTlRcIiwgXCJDVkNcIiwgXCJFT1NcIiwgXCJFVENcIiwgXCJHQVNcIiwgXCJHTlRcIiwgXCJLTkNcIiwgXCJMT09NXCIsIFwiTFNLXCIsIFxuICAgIFwiTUFOQVwiLCBcIk9NR1wiLCBcIlFUVU1cIiwgXCJSRVBcIiwgXCJTTlRcIiwgXCJTVEVFTVwiLCBcIlpFQ1wiLCBcIlpSWFwiXTtcbiAgLy8gQ2hlY2sgaWYgc2VsbGluZyB0aGUgY29pbiB3aWxsIGJlIHByb2ZpdGFibGVcbiAgY29pbnMuZm9yRWFjaChjdXJDb2luID0+IHtcbiAgICBsZXQgRVRIX2N1ckNvaW5CaWQgPSBleGNoYW5nZVByaWNlc1tcIkVUSF9cIitjdXJDb2luXS5oaWdoZXN0QmlkO1xuICAgIGxldCBCVENfRVRIQmlkID0gZXhjaGFuZ2VQcmljZXNbXCJCVENfRVRIXCJdLmhpZ2hlc3RCaWQ7XG4gICAgbGV0IEJUQ19jdXJDb2luQXNrID0gZXhjaGFuZ2VQcmljZXNbXCJCVENfXCIrY3VyQ29pbl0ubG93ZXN0QXNrO1xuICAgIGxldCBBbXRJbml0ID0gMTtcbiAgICBsZXQgQW10RmluYWwgPSBBbXRJbml0KkJUQ19FVEhCaWQqRVRIX2N1ckNvaW5CaWQvQlRDX2N1ckNvaW5Bc2s7XG4gICAgbGV0IEFyYlJhdGlvID0gQW10RmluYWwvQW10SW5pdDtcbiAgICBsZXQgc2hvd01heCA9IFwiXCI7XG4gICAgaWYgKEFyYlJhdGlvPm1heFNlbGxBcmJFVEgpIHtcbiAgICAgIG1heFNlbGxBcmJFVEggPSBBcmJSYXRpbztcbiAgICAgIHNob3dNYXggPSBcIk5ld01heFwiO1xuICAgIH1cbiAgICBpZiAoQXJiUmF0aW8+MS4wKVxuICAgICAgY29uc29sZS5sb2coYFJFQ3wke3RpbWVTdGFtcH18JHt0aW1lU3RhbXBTdHJ9fFNlbGx8JHtjdXJDb2lufXxFVEh8QXJiUmF0aW86JHtBcmJSYXRpb318JHtzaG93TWF4fWApO1xuICAgIGlmIChBcmJSYXRpbyA+IHRocmVzaG9sZCkge1xuICAgICAgbGV0IGluc3RydWN0aW9ucyA9IGBBTEVSVDogU2VsbCAke0FtdEluaXR9ICR7Y3VyQ29pbn0gZm9yICR7QW10SW5pdCpFVEhfY3VyQ29pbkJpZH0gRVRILCBcbiAgICAgICAgdGhlbiBzZWxsIHRob3NlIEVUSCBmb3IgJHtBbXRJbml0KkVUSF9jdXJDb2luQmlkKkJUQ19FVEhCaWR9IEJUQyxcbiAgICAgICAgdGhlbiB1c2UgdGhvc2UgQlRDIHRvIGJ1eSAke0FtdEZpbmFsfSAke2N1ckNvaW59YDtcbiAgICAgIGNvbnNvbGUubG9nKGluc3RydWN0aW9ucyk7XG4gICAgfVxuICB9KTtcbn1cblxuLyogYW5hbHl6ZVBvbG9YTVJQcmljZXNcbiAqIGRlc2M6IFRha2VzIHRoZSBleGNoYW5nZSBwcmljZXMgZnJvbSBQb2xvbmlleCBhbmQgZG9lcyB0aGUgZGV0YWlsZWQgY29tcGFyZXMgdG8gZmluZCBhcmJpdHJhZ2VcbiAqICAgICAgIHdpdGhpbiB0aGlzIGV4Y2hhbmdlIGZvciB0aGVpciBYUk0gbWFya2V0LlxuICovXG5mdW5jdGlvbiBhbmFseXplUG9sb1hNUlByaWNlcyhleGNoYW5nZVByaWNlcywgdGltZVN0YW1wKSB7XG5cbiAgbGV0IHRpbWVTdGFtcFN0ciA9IHRpbWVTdGFtcC5nZXRUaW1lKCk7XG4gIGNvbnNvbGUubG9nKGBwcmljZUNoZWNrQ291bnQ6JHtudW1iZXJPZkNoZWNrc318WE1SfG1heEJ1eUFyYjpOL0F8bWF4U2VsbEFyYlhNUjoke21heFNlbGxBcmJYTVJ9YCk7XG4gIGxldCBjb2lucyA9IFtcIkxUQ1wiLCBcIlpFQ1wiLCBcIk5YVFwiLCBcIkRBU0hcIiwgXCJCQ05cIiwgXCJNQUlEXCJdO1xuICAvLyBDaGVjayBpZiBzZWxsaW5nIHRoZSBjb2luIHdpbGwgYmUgcHJvZml0YWJsZVxuICBjb2lucy5mb3JFYWNoKGN1ckNvaW4gPT4ge1xuICAgIGxldCBiYXNlTWFya2V0ID0gXCJYTVJcIjtcbiAgICBsZXQgYmFzZU1hcmtldF9jdXJDb2luQmlkID0gZXhjaGFuZ2VQcmljZXNbYmFzZU1hcmtldCArIFwiX1wiICsgY3VyQ29pbl0uaGlnaGVzdEJpZDtcbiAgICBsZXQgQlRDX2Jhc2VNYXJrZXRCaWQgPSBleGNoYW5nZVByaWNlc1tcIkJUQ1wiICsgXCJfXCIgKyBiYXNlTWFya2V0XS5oaWdoZXN0QmlkO1xuICAgIGxldCBCVENfY3VyQ29pbkFzayA9IGV4Y2hhbmdlUHJpY2VzW1wiQlRDXCIgKyBcIl9cIiArIGN1ckNvaW5dLmxvd2VzdEFzaztcbiAgICBsZXQgQW10SW5pdCA9IDE7XG4gICAgbGV0IEFtdEZpbmFsID0gQW10SW5pdCpCVENfYmFzZU1hcmtldEJpZCpiYXNlTWFya2V0X2N1ckNvaW5CaWQvQlRDX2N1ckNvaW5Bc2s7XG4gICAgbGV0IEFyYlJhdGlvID0gQW10RmluYWwvQW10SW5pdDtcbiAgICBsZXQgc2hvd01heCA9IFwiXCI7XG4gICAgaWYgKEFyYlJhdGlvPm1heFNlbGxBcmJYTVIpIHtcbiAgICAgIG1heFNlbGxBcmJYTVIgPSBBcmJSYXRpbztcbiAgICAgIHNob3dNYXggPSBcIk5ld01heFwiO1xuICAgIH1cbiAgICBpZiAoQXJiUmF0aW8+MS4wKVxuICAgICAgY29uc29sZS5sb2coYFJFQ3wke3RpbWVTdGFtcH18JHt0aW1lU3RhbXBTdHJ9fFNlbGx8JHtjdXJDb2lufXxYTVJ8QXJiUmF0aW86JHtBcmJSYXRpb318JHtzaG93TWF4fWApO1xuICAgIGlmIChBcmJSYXRpbyA+IHRocmVzaG9sZCkge1xuICAgICAgbGV0IGluc3RydWN0aW9ucyA9IGBBTEVSVDogU2VsbCAke0FtdEluaXR9ICR7Y3VyQ29pbn0gZm9yICR7QW10SW5pdCpiYXNlTWFya2V0X2N1ckNvaW5CaWR9IFhNUiwgXG4gICAgICAgIHRoZW4gc2VsbCB0aG9zZSBYTVIgZm9yICR7QW10SW5pdCpCVENfYmFzZU1hcmtldEJpZCpiYXNlTWFya2V0X2N1ckNvaW5CaWR9IEJUQyxcbiAgICAgICAgdGhlbiB1c2UgdGhvc2UgQlRDIHRvIGJ1eSAke0FtdEZpbmFsfSAke2N1ckNvaW59YDtcbiAgICAgIGNvbnNvbGUubG9nKGluc3RydWN0aW9ucyk7XG4gICAgfVxuICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcnVuUG9sb0NvaW5iYXNlQ29tcGFyZSgpIHtcbiAgbGV0IHBvbG9uaWV4RGF0YSA9IGF3YWl0IGdldEV4Y2hhbmdlRGF0YShwb2xvbmlleFVSTCk7XG4gIGxldCBjb2luYmFzZURhdGFaRUMgPSBhd2FpdCBnZXRFeGNoYW5nZURhdGEoY29pbmJhc2VVUkwrXCIvWkVDLVVTREMvYm9va1wiKTtcbiAgbGV0IGNvaW5iYXNlRGF0YUVUSCA9IGF3YWl0IGdldEV4Y2hhbmdlRGF0YShjb2luYmFzZVVSTCtcIi9FVEgtVVNEQy9ib29rXCIpO1xuICBsZXQgY29pbmJhc2VEYXRhQlRDID0gYXdhaXQgZ2V0RXhjaGFuZ2VEYXRhKGNvaW5iYXNlVVJMK1wiL0JUQy1VU0RDL2Jvb2tcIik7XG4gIGNvbXBhcmVQb2xvbmlleENvaW5iYXNlKHBvbG9uaWV4RGF0YSwgY29pbmJhc2VEYXRhWkVDLCBcIlpFQ1wiKTtcbiAgY29tcGFyZVBvbG9uaWV4Q29pbmJhc2UocG9sb25pZXhEYXRhLCBjb2luYmFzZURhdGFFVEgsIFwiRVRIXCIpO1xuICBjb21wYXJlUG9sb25pZXhDb2luYmFzZShwb2xvbmlleERhdGEsIGNvaW5iYXNlRGF0YUJUQywgXCJCVENcIik7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJ1blBvbG9CaXR0cmV4Q29tcGFyZSgpIHtcblxuICBudW1iZXJPZkNoZWNrcysrO1xuICAvLyBQb2xvbmlleCBzZWN0aW9uIC0gQWxsIGNvaW5zIGZyb20gb25lIHJlcXVlc3RcbiAgbGV0IHBvbG9uaWV4RGF0YSA9IGF3YWl0IGdldEV4Y2hhbmdlRGF0YShwb2xvbmlleFVSTCk7XG4gIC8vIEJpdHRyZXggc2VjdGlvbiAtIEFsbCBjb2lucyBmcm9tIG9uZSByZXF1ZXN0LlxuICAvLyBCaXR0cmV4IG1hcmtldCBzdW1tYXJ5IC0gQWxsIGNvaW5zIGZyb20gb25lIHJlcXVlc3QuXG4gIGxldCBiaXR0cmV4QUxMID0gYXdhaXQgZ2V0RXhjaGFuZ2VEYXRhKGJpdHRyZXhVUkxBbGwpO1xuICBsZXQgYml0dHJleEpTT04gPSBKU09OLnBhcnNlKGJpdHRyZXhBTEwuZXhjaGFuZ2VEYXRhKTtcbiAgbGV0IGJpdHRyZXhCVENDb2lucyA9IHtcbiAgICBCVEM6IFtcImFyZHJcIiwgXCJiYXRcIiwgXCJibnRcIiwgXCJidXJzdFwiLCBcImN2Y1wiLCBcImRhc2hcIiwgXCJkZ2JcIiwgXCJkb2dlXCIsXG4gICAgXCJldGNcIiwgXCJldGhcIiwgXCJmY3RcIiwgXCJnYW1lXCIsIFwiZ250XCIsIFwibGJjXCIsIFwibG9vbVwiLCBcImxza1wiLCBcImx0Y1wiLCBcIm1hbmFcIiwgXCJuYXZcIiwgXCJubXJcIiwgXCJueHRcIiwgXCJvbWdcIixcbiAgICBcInBvbHlcIiwgXCJwcGNcIiwgXCJxdHVtXCIsIFwicmVwXCIsIFwic2JkXCIsIFwic2NcIiwgXCJzbnRcIiwgXCJzdGVlbVwiLCBcInN0b3JqXCIsIFwieHJwXCIsIFwic3lzXCIsIFwic3RyYXRcIiwgXCJ2aWFcIiwgXCJ2dGNcIixcbiAgICBcInhjcFwiLCBcInhlbVwiLCBcInhtclwiLCBcInhycFwiLCBcInplY1wiLCBcInpyeFwiXSxcbiAgICBFVEg6IFtcIkJBVFwiLCBcIkJOVFwiLCBcIkNWQ1wiLCBcIkVUQ1wiLCBcIkdOVFwiLCBcIk1BTkFcIiwgXCJPTUdcIiwgXCJRVFVNXCIsIFwiUkVQXCIsIFwiU05UXCIsIFwiWkVDXCIsIFwiWlJYXCJdLFxuICAgIFVTRFQ6IFtcIkJBVFwiLCBcIkJUQ1wiLCBcIkRBU0hcIl1cbiAgfTtcbiAgbGV0IGJhc2VNYXJrZXRzID0gW1wiQlRDXCIsIFwiRVRIXCIsIFwiVVNEVFwiXTtcbiAgYmFzZU1hcmtldHMuZm9yRWFjaChiYXNlTWt0ID0+IHtcbiAgICBjb25zb2xlLmxvZyhcIlByb2Nlc3NpbmcgYmFzZW1rdDpcIiwgYmFzZU1rdCk7XG4gICAgbGV0IGJpdHRyZXhUcmltbWVkID0ge307XG4gICAgYml0dHJleEpTT04ucmVzdWx0LmZvckVhY2gobWFya2V0ID0+IHtcbiAgICAgIGJpdHRyZXhCVENDb2luc1tiYXNlTWt0XS5mb3JFYWNoKGNvaW4gPT4ge1xuICAgICAgICBsZXQgTWFya2V0TmFtZSA9IGJhc2VNa3QrXCItXCIrY29pbi50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAvL2NvbnNvbGUubG9nKFwiTWFya2V0TmFtZTpcIiwgTWFya2V0TmFtZSk7XG4gICAgICAgIGlmIChtYXJrZXQuTWFya2V0TmFtZT09PU1hcmtldE5hbWUpIHtcbiAgICAgICAgICBiaXR0cmV4VHJpbW1lZFtNYXJrZXROYW1lXSA9IG1hcmtldDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgbGV0IGJpdHRyZXhDb21wYXJlID0ge307XG4gICAgYml0dHJleENvbXBhcmUudGltZVN0YW1wID0gYml0dHJleEFMTC50aW1lU3RhbXA7XG4gICAgYml0dHJleENvbXBhcmUuZXhjaGFuZ2VEYXRhID0gYml0dHJleFRyaW1tZWQ7XG4gICAgY29tcGFyZUFsbFBvbG9uaWV4Qml0dHJleChwb2xvbmlleERhdGEsIGJpdHRyZXhDb21wYXJlKTtcbiAgfSk7XG4gIGNvbnNvbGUubG9nKGBDb21wYXJlIGN5Y2xlICR7bnVtYmVyT2ZDaGVja3N9IGNvbXBsZXRlLmApXG59XG5cbi8vIFNldCB0aGUgZGVmYXVsdCBjb3BhcmUgdG8gcnVuLlxubGV0IGNvbXBhcmVUb1J1biA9ICBydW5Qb2xvQml0dHJleENvbXBhcmU7XG5pZiAocHJvY2Vzcy5hcmd2Lmxlbmd0aD49Mykge1xuICBpZiAocHJvY2Vzcy5hcmd2WzJdPT09XCJwb2xvaW50ZXJuYWxcIikge1xuICAgIGNvbnNvbGUubG9nKGBSdW5uaW5nIHBvbG9pbnRlcm5hbCBjb21wYXJlLmApO1xuICAgIGNvbXBhcmVUb1J1biA9IHBvbG9JbnRlcm5hbENvbXBhcmU7XG4gIH1cbiAgZWxzZSB7XG4gICAgaWYgKHByb2Nlc3MuYXJndlsyXT09PVwicG9sb2NvaW5iYXNlXCIpIHtcbiAgICAgIGNvbXBhcmVUb1J1biA9IHJ1blBvbG9Db2luYmFzZUNvbXBhcmU7XG4gICAgICBjb25zb2xlLmxvZyhcIlJ1bm5pbmcgUG9sb0NvaW5iYXNlQ29tcGFyZSBjb21wYXJlLlwiKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjb25zb2xlLmxvZyhcIlJ1bm5pbmcgZGVmYXVsdCBwb2xvIGJpdHRyZXggY29tcGFyZS5cIik7XG4gICAgfVxuICB9XG59XG5sZXQgbmV3SW50ZXJhbCA9IDEwMDAqKHRpbWVJblNlY29uZHNCZXR3ZWVuUHJpY2VDaGVja3MgKyAyMCpNYXRoLnJhbmRvbSgpKTtcbmNvbnNvbGUubG9nKGBTZXR0aW5nIHRoZSB0aW1lciBpbnRlcnZhbCB0byAke25ld0ludGVyYWwvMTAwMH0gc2Vjb25kcy5gICk7XG5jb21wYXJlVG9SdW4oKTtcbmludGVydmFsSGFuZGVsID0gc2V0SW50ZXJ2YWwoY29tcGFyZVRvUnVuLCBuZXdJbnRlcmFsKTtcbiJdfQ==