"use strict";

var _getCryptoData = require("./utils/getCryptoData.js");

var _comparePricingData = require("./utils/comparePricingData");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

require("@babel/polyfill");

var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

var poloniexURL = "https://poloniex.com/public?command=returnTicker";
var coinbaseURL = "https://api.pro.coinbase.com/products";
var bittrexURLAll = "https://bittrex.com/api/v1.1/public/getmarketsummaries";
var hitbtcURL = "https://api.hitbtc.com/api/2/public/ticker";
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
}

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

function runPoloHitbtcCompare() {
  return _runPoloHitbtcCompare.apply(this, arguments);
} // Set the default copare to run.


function _runPoloHitbtcCompare() {
  _runPoloHitbtcCompare = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee3() {
    var poloniexData, hitbtcData, hitbtcJSON, hitbtcMarkets, hitbtcTrimmed, hitbtcCompare;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            numberOfChecks++; // Poloniex section - All coins from one request

            _context3.next = 3;
            return (0, _getCryptoData.getExchangeData)(poloniexURL);

          case 3:
            poloniexData = _context3.sent;
            _context3.next = 6;
            return (0, _getCryptoData.getExchangeData)(hitbtcURL);

          case 6:
            hitbtcData = _context3.sent;
            hitbtcJSON = JSON.parse(hitbtcData.exchangeData);
            hitbtcMarkets = ["ETHBTC", "LSKBTC", "DASHBTC", "ZECETH", "BCNBTC", "DASHBTC", "DOGEBTC", "LSKBTC", "MAIDBTC", "REPBTC", "XEMBTC"];
            hitbtcTrimmed = {};
            hitbtcMarkets.forEach(function (market) {
              hitbtcJSON.forEach(function (exchangeData) {
                if (exchangeData.symbol === market) hitbtcTrimmed[market] = exchangeData;
              });
            });
            hitbtcCompare = {};
            hitbtcCompare.timeStamp = hitbtcData.timeStamp;
            hitbtcCompare.exchangeData = hitbtcTrimmed;
            (0, _comparePricingData.compareAllPoloniexHitbtc)(poloniexData, hitbtcCompare);

          case 15:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));
  return _runPoloHitbtcCompare.apply(this, arguments);
}

var compareToRun = runPoloBittrexCompare;

if (process.argv.length >= 3) {
  if (process.argv[2] === "polointernal") {
    console.log("Running polointernal compare.");
    compareToRun = poloInternalCompare;
  } else {
    if (process.argv[2] === "polocoinbase") {
      compareToRun = runPoloCoinbaseCompare;
      console.log("Running PoloCoinbaseCompare.");
    } else if (process.argv[2] === "polohitbtc") {
      compareToRun = runPoloHitbtcCompare;
      console.log("Running PoloHitbtcCompare.");
    } else {
      console.log("Running default polo bittrex compare.");
    }
  }
}

var newInteral = 1000 * (timeInSecondsBetweenPriceChecks + 20 * Math.random());
console.log("Setting the timer interval to ".concat(newInteral / 1000, " seconds."));
compareToRun();
intervalHandel = setInterval(compareToRun, newInteral);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcHAuanMiXSwibmFtZXMiOlsicmVxdWlyZSIsIlhNTEh0dHBSZXF1ZXN0IiwicG9sb25pZXhVUkwiLCJjb2luYmFzZVVSTCIsImJpdHRyZXhVUkxBbGwiLCJoaXRidGNVUkwiLCJ0aHJlc2hvbGQiLCJudW1iZXJPZkNoZWNrcyIsImludGVydmFsSGFuZGVsIiwibWF4QnV5QXJiIiwibWF4U2VsbEFyYiIsIm1heFNlbGxBcmJFVEgiLCJtYXhTZWxsQXJiWE1SIiwidGltZUluU2Vjb25kc0JldHdlZW5QcmljZUNoZWNrcyIsInBvbG9JbnRlcm5hbENvbXBhcmUiLCJjb25zb2xlIiwibG9nIiwieG1saHR0cCIsIm1ldGhvZCIsInVybCIsIm9wZW4iLCJvbmVycm9yIiwib25yZWFkeXN0YXRlY2hhbmdlIiwicmVhZHlTdGF0ZSIsInN0YXR1cyIsImV4Y2hhbmdlRGF0YSIsInJlc3BvbnNlVGV4dCIsInRpbWVTdGFtcCIsIkRhdGUiLCJleGNoYW5nZU9iamVjdCIsIkpTT04iLCJwYXJzZSIsImNvaW5zIiwiYmFzZVN0YWJsZUNvaW4iLCJhbmFseXplUG9sb0JUQ1ByaWNlcyIsImFuYWx5emVQb2xvRVRIUHJpY2VzIiwiYW5hbHl6ZVBvbG9YTVJQcmljZXMiLCJzZW5kIiwiZXhjaGFuZ2VQcmljZXMiLCJ0aW1lU3RhbXBTdHIiLCJnZXRUaW1lIiwiZm9yRWFjaCIsImN1ckNvaW4iLCJsb3dlc3RBc2tCVEMiLCJsb3dlc3RBc2siLCJoaWdoZXN0QmlkVVNEQyIsImhpZ2hlc3RCaWQiLCJVU0RDX0JUQ2xvd2VzdEFzayIsIkFyYlJhdGlvIiwic2hvd01heCIsIkJUQ19jdXJDb2luQmlkIiwiVVNEQ19CVENCaWQiLCJVU0RDX2N1ckNvaW5Bc2siLCJBbXRJbml0IiwiQW10RmluYWwiLCJFVEhfY3VyQ29pbkJpZCIsIkJUQ19FVEhCaWQiLCJCVENfY3VyQ29pbkFzayIsImluc3RydWN0aW9ucyIsImJhc2VNYXJrZXQiLCJiYXNlTWFya2V0X2N1ckNvaW5CaWQiLCJCVENfYmFzZU1hcmtldEJpZCIsInJ1blBvbG9Db2luYmFzZUNvbXBhcmUiLCJwb2xvbmlleERhdGEiLCJjb2luYmFzZURhdGFaRUMiLCJjb2luYmFzZURhdGFFVEgiLCJjb2luYmFzZURhdGFCVEMiLCJydW5Qb2xvQml0dHJleENvbXBhcmUiLCJiaXR0cmV4QUxMIiwiYml0dHJleEpTT04iLCJiaXR0cmV4QlRDQ29pbnMiLCJCVEMiLCJFVEgiLCJVU0RUIiwiYmFzZU1hcmtldHMiLCJiYXNlTWt0IiwiYml0dHJleFRyaW1tZWQiLCJyZXN1bHQiLCJtYXJrZXQiLCJjb2luIiwiTWFya2V0TmFtZSIsInRvVXBwZXJDYXNlIiwiYml0dHJleENvbXBhcmUiLCJydW5Qb2xvSGl0YnRjQ29tcGFyZSIsImhpdGJ0Y0RhdGEiLCJoaXRidGNKU09OIiwiaGl0YnRjTWFya2V0cyIsImhpdGJ0Y1RyaW1tZWQiLCJzeW1ib2wiLCJoaXRidGNDb21wYXJlIiwiY29tcGFyZVRvUnVuIiwicHJvY2VzcyIsImFyZ3YiLCJsZW5ndGgiLCJuZXdJbnRlcmFsIiwiTWF0aCIsInJhbmRvbSIsInNldEludGVydmFsIl0sIm1hcHBpbmdzIjoiOztBQUVBOztBQUNBOzs7Ozs7QUFIQUEsT0FBTyxDQUFDLGlCQUFELENBQVA7O0FBS0EsSUFBSUMsY0FBYyxHQUFHRCxPQUFPLENBQUMsZ0JBQUQsQ0FBUCxDQUEwQkMsY0FBL0M7O0FBRUEsSUFBTUMsV0FBVyxHQUFHLGtEQUFwQjtBQUNBLElBQU1DLFdBQVcsR0FBRyx1Q0FBcEI7QUFDQSxJQUFNQyxhQUFhLEdBQUcsd0RBQXRCO0FBQ0EsSUFBTUMsU0FBUyxHQUFHLDRDQUFsQjtBQUNBLElBQU1DLFNBQVMsR0FBRyxJQUFsQjtBQUNBLElBQUlDLGNBQWMsR0FBRyxDQUFyQjtBQUNBLElBQUlDLGNBQWMsR0FBRyxDQUFDLENBQXRCO0FBQ0EsSUFBSUMsU0FBUyxHQUFHLENBQWhCO0FBQ0EsSUFBSUMsVUFBVSxHQUFHLENBQWpCO0FBQ0EsSUFBSUMsYUFBYSxHQUFHLENBQXBC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QSxPQUFPLENBQUNDLEdBQVI7QUFDQTBFLElBQUFBLFlBQVksR0FBRzVFLG1CQUFmO0FBQ0QsR0FIRCxNQUlLO0FBQ0gsUUFBSTZFLE9BQU8sQ0FBQ0MsSUFBUixDQUFhLENBQWIsTUFBa0IsY0FBdEIsRUFBc0M7QUFDcENGLE1BQUFBLFlBQVksR0FBRzVCLHNCQUFmO0FBQ0EvQyxNQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSw4QkFBWjtBQUNELEtBSEQsTUFJSyxJQUFJMkUsT0FBTyxDQUFDQyxJQUFSLENBQWEsQ0FBYixNQUFrQixZQUF0QixFQUFvQztBQUN2Q0YsTUFBQUEsWUFBWSxHQUFHUCxvQkFBZjtBQUNBcEUsTUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksNEJBQVo7QUFDRCxLQUhJLE1BS0w7QUFDRUQsTUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksdUNBQVo7QUFDRDtBQUNGO0FBQ0Y7O0FBQ0QsSUFBSThFLFVBQVUsR0FBRyxRQUFNakYsK0JBQStCLEdBQUcsS0FBR2tGLElBQUksQ0FBQ0MsTUFBTCxFQUEzQyxDQUFqQjtBQUNBakYsT0FBTyxDQUFDQyxHQUFSLHlDQUE2QzhFLFVBQVUsR0FBQyxJQUF4RDtBQUNBSixZQUFZO0FBQ1psRixjQUFjLEdBQUd5RixXQUFXLENBQUNQLFlBQUQsRUFBZUksVUFBZixDQUE1QiIsInNvdXJjZXNDb250ZW50IjpbInJlcXVpcmUoXCJAYmFiZWwvcG9seWZpbGxcIik7XG5cbmltcG9ydCB7Z2V0RXhjaGFuZ2VEYXRhfSBmcm9tIFwiLi91dGlscy9nZXRDcnlwdG9EYXRhLmpzXCI7XG5pbXBvcnQge2NvbXBhcmVQb2xvbmlleENvaW5iYXNlLCBjb21wYXJlQWxsUG9sb25pZXhCaXR0cmV4LCBjb21wYXJlQWxsUG9sb25pZXhIaXRidGN9IGZyb20gXCIuL3V0aWxzL2NvbXBhcmVQcmljaW5nRGF0YVwiO1xuXG5sZXQgWE1MSHR0cFJlcXVlc3QgPSByZXF1aXJlKFwieG1saHR0cHJlcXVlc3RcIikuWE1MSHR0cFJlcXVlc3Q7XG5cbmNvbnN0IHBvbG9uaWV4VVJMID0gXCJodHRwczovL3BvbG9uaWV4LmNvbS9wdWJsaWM/Y29tbWFuZD1yZXR1cm5UaWNrZXJcIjsgXG5jb25zdCBjb2luYmFzZVVSTCA9IFwiaHR0cHM6Ly9hcGkucHJvLmNvaW5iYXNlLmNvbS9wcm9kdWN0c1wiOyBcbmNvbnN0IGJpdHRyZXhVUkxBbGwgPSBcImh0dHBzOi8vYml0dHJleC5jb20vYXBpL3YxLjEvcHVibGljL2dldG1hcmtldHN1bW1hcmllc1wiO1xuY29uc3QgaGl0YnRjVVJMID0gXCJodHRwczovL2FwaS5oaXRidGMuY29tL2FwaS8yL3B1YmxpYy90aWNrZXJcIjtcbmNvbnN0IHRocmVzaG9sZCA9IDEuMDE7XG5sZXQgbnVtYmVyT2ZDaGVja3MgPSAwO1xubGV0IGludGVydmFsSGFuZGVsID0gLTE7XG5sZXQgbWF4QnV5QXJiID0gMDtcbmxldCBtYXhTZWxsQXJiID0gMDtcbmxldCBtYXhTZWxsQXJiRVRIID0gMDtcbmxldCBtYXhTZWxsQXJiWE1SID0gMDtcblxuY29uc3QgdGltZUluU2Vjb25kc0JldHdlZW5QcmljZUNoZWNrcyA9IDE1O1xuXG4vKiBwb2xvSW50ZXJuYWxDb21wYXJlXG4gKiBkZXNjOiBMb29rcyBmb3IgYXJiaXRyYWdlIHByb2ZpdHMgZnJvbSBzY2VuYXJpb3Mgd2hlcmUgYSBjb2luMSBpcyBleGNoYW5nZWQgZm9yIGNvaW4yLCBjb2luMiBleGNoYW5nZWQgZm9yIGNvaW4zIGFuZCB0aGVuIFxuICogICAgICAgY29pbjMgZXhjaGFuZ2VkIGJhY2sgaW50byBjb2luMS5cbiAqICAgICAgIFRoaXMgY29tcGFyZSBsb29rcyBvbmx5IHdpdGhpbiB0aGUgUG9sb25pZXggZXhjaGFuZ2UuXG4qL1xuZnVuY3Rpb24gcG9sb0ludGVybmFsQ29tcGFyZSgpIHtcblxuICBjb25zb2xlLmxvZyhcIkJFR0lOOiBwb2xvSW50ZXJuYWxDb21wYXJlXCIpO1xuICBsZXQgeG1saHR0cCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpLFxuICAgIG1ldGhvZCA9IFwiR0VUXCIsXG4gICAgdXJsID0gcG9sb25pZXhVUkw7XG5cbiAgY29uc29sZS5sb2coXCJMb2FkaW5nIGRhdGEgZnJvbSA6IEh0dHAuc2VuZChcIiwgdXJsLCBcIilcIik7XG4gIHhtbGh0dHAub3BlbihtZXRob2QsIHVybCwgdHJ1ZSk7XG4gIHhtbGh0dHAub25lcnJvciA9IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zb2xlLmxvZyhcIioqIEFuIGVycm9yIG9jY3VycmVkIGR1cmluZyB0aGUgdHJhbnNhY3Rpb25cIik7XG4gIH07XG4gIHhtbGh0dHAub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMucmVhZHlTdGF0ZT09PTQgJiYgdGhpcy5zdGF0dXM9PT0yMDApIHtcbiAgICAgIGxldCBleGNoYW5nZURhdGEgPSB4bWxodHRwLnJlc3BvbnNlVGV4dDtcbiAgICAgIG51bWJlck9mQ2hlY2tzKys7XG4gICAgICBsZXQgdGltZVN0YW1wID0gbmV3IERhdGUoKTtcbiAgICAgIGxldCBleGNoYW5nZU9iamVjdCA9IEpTT04ucGFyc2UoZXhjaGFuZ2VEYXRhKTtcbiAgICAgIGxldCBjb2lucyA9IFtcIkZPQU1cIiwgXCJaRUNcIiwgXCJMVENcIiwgXCJFVEhcIiwgXCJYUlBcIiwgXCJTVFJcIiwgXCJYTVJcIiwgXCJET0dFXCIsIFwiQkNIQUJDXCIsIFwiQkNIU1ZcIl07XG4gICAgICBsZXQgYmFzZVN0YWJsZUNvaW4gPSBcIlVTRENcIjtcbiAgICAgIGFuYWx5emVQb2xvQlRDUHJpY2VzKGV4Y2hhbmdlT2JqZWN0LCBiYXNlU3RhYmxlQ29pbiwgY29pbnMsIHRpbWVTdGFtcCk7XG4gICAgICBjb2lucyA9IFtcIkJBVFwiLCBcIkJOVFwiLCBcIkRBU0hcIiwgXCJET0dFXCIsIFwiRU9TXCIsIFwiRVRDXCIsIFwiRVRIXCIsIFwiR05UXCIsIFwiS05DXCIsIFwiTE9PTVwiLCBcIkxTS1wiLFxuICAgICAgICBcIkxUQ1wiLCBcIk1BTkFcIiwgXCJOWFRcIiwgXCJRVFVNXCIsIFwiUkVQXCIsIFwiU0NcIiwgXCJTTlRcIiwgXCJTVFJcIiwgXCJYTVJcIiwgXCJYUlBcIiwgXCJaRUNcIiwgXCJaUlhcIl07XG4gICAgICBiYXNlU3RhYmxlQ29pbiA9IFwiVVNEVFwiOyBcbiAgICAgIGFuYWx5emVQb2xvQlRDUHJpY2VzKGV4Y2hhbmdlT2JqZWN0LCBiYXNlU3RhYmxlQ29pbiwgY29pbnMsIHRpbWVTdGFtcCk7XG4gICAgICBhbmFseXplUG9sb0VUSFByaWNlcyhleGNoYW5nZU9iamVjdCwgdGltZVN0YW1wKTtcbiAgICAgIGFuYWx5emVQb2xvWE1SUHJpY2VzKGV4Y2hhbmdlT2JqZWN0LCB0aW1lU3RhbXApO1xuICAgIH1cbiAgfVxuICB4bWxodHRwLnNlbmQoKTtcbiAgY29uc29sZS5sb2coXCJFTkQ6IHBvbG9JbnRlcm5hbENvbXBhcmVcIik7XG59XG5cbi8qIGFuYWx5emVQb2xvQlRDUHJpY2VzXG4gKiBkZXNjOiBUYWtlcyB0aGUgZXhjaGFuZ2UgcHJpY2VzIGZyb20gUG9sb25pZXggYW5kIGRvZXMgdGhlIGRldGFpbGVkIGNvbXBhcmVzIHRvIGZpbmQgYXJiaXRyYWdlXG4gKiAgICAgICB3aXRoaW4gdGhpcyBleGNoYW5nZS4gIEl0IGRvZXMgdGhpcyBmb3IgdGhlIEJUQyBtYXJrZXQuXG4gKi9cbmZ1bmN0aW9uIGFuYWx5emVQb2xvQlRDUHJpY2VzKGV4Y2hhbmdlUHJpY2VzLCBiYXNlU3RhYmxlQ29pbiwgY29pbnMsIHRpbWVTdGFtcCkge1xuXG4gIGxldCB0aW1lU3RhbXBTdHIgPSB0aW1lU3RhbXAuZ2V0VGltZSgpO1xuICBjb25zb2xlLmxvZyhgcHJpY2VDaGVja0NvdW50OiR7bnVtYmVyT2ZDaGVja3N9fCR7YmFzZVN0YWJsZUNvaW59fG1heEJ1eUFyYjoke21heEJ1eUFyYn18bWF4U2VsbEFyYjoke21heFNlbGxBcmJ9YCk7XG4gIC8vIENoZWNrIGlmIGJ1eWluZyB0aGUgY29pbiB3aWxsIGJlIHByb2ZpdGFibGUuXG4gIGNvaW5zLmZvckVhY2goY3VyQ29pbiA9PiB7XG4gICAgbGV0IGxvd2VzdEFza0JUQyA9IGV4Y2hhbmdlUHJpY2VzW1wiQlRDX1wiICsgY3VyQ29pbl0ubG93ZXN0QXNrO1xuICAgIGxldCBoaWdoZXN0QmlkVVNEQyA9IGV4Y2hhbmdlUHJpY2VzW2Jhc2VTdGFibGVDb2luICsgXCJfXCIgKyBjdXJDb2luXS5oaWdoZXN0QmlkO1xuICAgIGxldCBVU0RDX0JUQ2xvd2VzdEFzayA9IGV4Y2hhbmdlUHJpY2VzW2Jhc2VTdGFibGVDb2luICsgXCJfXCIgKyBcIkJUQ1wiXS5sb3dlc3RBc2s7XG4gICAgbGV0IEFyYlJhdGlvID0gaGlnaGVzdEJpZFVTREMgLyAoIGxvd2VzdEFza0JUQyAqICBVU0RDX0JUQ2xvd2VzdEFzayk7XG4gICAgbGV0IHNob3dNYXggPSBcIlwiO1xuICAgIGlmIChBcmJSYXRpbz5tYXhCdXlBcmIpIHtcbiAgICAgIG1heEJ1eUFyYiA9IEFyYlJhdGlvO1xuICAgICAgc2hvd01heCA9IFwiTmV3TWF4XCI7XG4gICAgfVxuICAgIGlmIChBcmJSYXRpbz4xLjApXG4gICAgICBjb25zb2xlLmxvZyhgUkVDfCR7dGltZVN0YW1wfXwke3RpbWVTdGFtcFN0cn18QnV5fCR7YmFzZVN0YWJsZUNvaW59fCR7Y3VyQ29pbn18QXJiUmF0aW86JHtBcmJSYXRpb318JHtzaG93TWF4fWApO1xuICAgIGlmIChBcmJSYXRpbyA+IHRocmVzaG9sZCkge1xuICAgICAgY29uc29sZS5sb2coXCJTb21ldGhpbmcgZHJhbWF0aWMgbmVlZHMgdG8gaGFwcGVuIVwiKTtcbiAgICB9XG4gIH0pO1xuICAvLyBDaGVjayBpZiBzZWxsaW5nIHRoZSBjb2luIHdpbGwgYmUgcHJvZml0YWJsZVxuICBjb2lucy5mb3JFYWNoKGN1ckNvaW4gPT4ge1xuICAgIGxldCBCVENfY3VyQ29pbkJpZCA9IGV4Y2hhbmdlUHJpY2VzW1wiQlRDX1wiK2N1ckNvaW5dLmhpZ2hlc3RCaWQ7XG4gICAgbGV0IFVTRENfQlRDQmlkID0gZXhjaGFuZ2VQcmljZXNbYmFzZVN0YWJsZUNvaW4gKyBcIl9cIiArIFwiQlRDXCJdLmhpZ2hlc3RCaWQ7XG4gICAgbGV0IFVTRENfY3VyQ29pbkFzayA9IGV4Y2hhbmdlUHJpY2VzW2Jhc2VTdGFibGVDb2luICsgXCJfXCIgK2N1ckNvaW5dLmxvd2VzdEFzaztcbiAgICBsZXQgQW10SW5pdCA9IDEwMDAwO1xuICAgIGxldCBBbXRGaW5hbCA9IEFtdEluaXQqQlRDX2N1ckNvaW5CaWQqVVNEQ19CVENCaWQvVVNEQ19jdXJDb2luQXNrO1xuICAgIGxldCBBcmJSYXRpbyA9IEFtdEZpbmFsL0FtdEluaXQ7XG4gICAgbGV0IHNob3dNYXggPSBcIlwiO1xuICAgIGlmIChBcmJSYXRpbz5tYXhTZWxsQXJiKSB7XG4gICAgICBtYXhTZWxsQXJiID0gQXJiUmF0aW87XG4gICAgICBzaG93TWF4ID0gXCJOZXdNYXhcIjtcbiAgICB9XG4gICAgaWYgKEFyYlJhdGlvPjEuMClcbiAgICAgIGNvbnNvbGUubG9nKGBSRUN8JHt0aW1lU3RhbXB9fCR7dGltZVN0YW1wU3RyfXxTZWxsfCR7YmFzZVN0YWJsZUNvaW59fCR7Y3VyQ29pbn18QXJiUmF0aW86JHtBcmJSYXRpb318JHtzaG93TWF4fWApO1xuICAgIGlmIChBcmJSYXRpbyA+IHRocmVzaG9sZCkge1xuICAgICAgY29uc29sZS5sb2coXCJTb21ldGhpbmcgZHJhbWF0aWMgbmVlZHMgdG8gaGFwcGVuIVwiKTtcbiAgICB9XG4gIH0pO1xufVxuXG4vKiBhbmFseXplUG9sb0VUSFByaWNlc1xuICogZGVzYzogVGFrZXMgdGhlIGV4Y2hhbmdlIHByaWNlcyBmcm9tIFBvbG9uaWV4IGFuZCBkb2VzIHRoZSBkZXRhaWxlZCBjb21wYXJlcyB0byBmaW5kIGFyYml0cmFnZVxuICogICAgICAgd2l0aGluIHRoaXMgZXhjaGFuZ2UgZm9yIHRoZWlyIEVUSCBtYXJrZXQuXG4gKi9cbmZ1bmN0aW9uIGFuYWx5emVQb2xvRVRIUHJpY2VzKGV4Y2hhbmdlUHJpY2VzLCB0aW1lU3RhbXApIHtcblxuICBsZXQgdGltZVN0YW1wU3RyID0gdGltZVN0YW1wLmdldFRpbWUoKTtcbiAgY29uc29sZS5sb2coYHByaWNlQ2hlY2tDb3VudDoke251bWJlck9mQ2hlY2tzfXxFVEh8bWF4QnV5QXJiOk4vQXxtYXhTZWxsQXJiRVRIOiR7bWF4U2VsbEFyYkVUSH1gKTtcbiAgbGV0IGNvaW5zID0gW1wiQkFUXCIsIFwiQk5UXCIsIFwiQ1ZDXCIsIFwiRU9TXCIsIFwiRVRDXCIsIFwiR0FTXCIsIFwiR05UXCIsIFwiS05DXCIsIFwiTE9PTVwiLCBcIkxTS1wiLCBcbiAgICBcIk1BTkFcIiwgXCJPTUdcIiwgXCJRVFVNXCIsIFwiUkVQXCIsIFwiU05UXCIsIFwiU1RFRU1cIiwgXCJaRUNcIiwgXCJaUlhcIl07XG4gIC8vIENoZWNrIGlmIHNlbGxpbmcgdGhlIGNvaW4gd2lsbCBiZSBwcm9maXRhYmxlXG4gIGNvaW5zLmZvckVhY2goY3VyQ29pbiA9PiB7XG4gICAgbGV0IEVUSF9jdXJDb2luQmlkID0gZXhjaGFuZ2VQcmljZXNbXCJFVEhfXCIrY3VyQ29pbl0uaGlnaGVzdEJpZDtcbiAgICBsZXQgQlRDX0VUSEJpZCA9IGV4Y2hhbmdlUHJpY2VzW1wiQlRDX0VUSFwiXS5oaWdoZXN0QmlkO1xuICAgIGxldCBCVENfY3VyQ29pbkFzayA9IGV4Y2hhbmdlUHJpY2VzW1wiQlRDX1wiK2N1ckNvaW5dLmxvd2VzdEFzaztcbiAgICBsZXQgQW10SW5pdCA9IDE7XG4gICAgbGV0IEFtdEZpbmFsID0gQW10SW5pdCpCVENfRVRIQmlkKkVUSF9jdXJDb2luQmlkL0JUQ19jdXJDb2luQXNrO1xuICAgIGxldCBBcmJSYXRpbyA9IEFtdEZpbmFsL0FtdEluaXQ7XG4gICAgbGV0IHNob3dNYXggPSBcIlwiO1xuICAgIGlmIChBcmJSYXRpbz5tYXhTZWxsQXJiRVRIKSB7XG4gICAgICBtYXhTZWxsQXJiRVRIID0gQXJiUmF0aW87XG4gICAgICBzaG93TWF4ID0gXCJOZXdNYXhcIjtcbiAgICB9XG4gICAgaWYgKEFyYlJhdGlvPjEuMClcbiAgICAgIGNvbnNvbGUubG9nKGBSRUN8JHt0aW1lU3RhbXB9fCR7dGltZVN0YW1wU3RyfXxTZWxsfCR7Y3VyQ29pbn18RVRIfEFyYlJhdGlvOiR7QXJiUmF0aW99fCR7c2hvd01heH1gKTtcbiAgICBpZiAoQXJiUmF0aW8gPiB0aHJlc2hvbGQpIHtcbiAgICAgIGxldCBpbnN0cnVjdGlvbnMgPSBgQUxFUlQ6IFNlbGwgJHtBbXRJbml0fSAke2N1ckNvaW59IGZvciAke0FtdEluaXQqRVRIX2N1ckNvaW5CaWR9IEVUSCwgXG4gICAgICAgIHRoZW4gc2VsbCB0aG9zZSBFVEggZm9yICR7QW10SW5pdCpFVEhfY3VyQ29pbkJpZCpCVENfRVRIQmlkfSBCVEMsXG4gICAgICAgIHRoZW4gdXNlIHRob3NlIEJUQyB0byBidXkgJHtBbXRGaW5hbH0gJHtjdXJDb2lufWA7XG4gICAgICBjb25zb2xlLmxvZyhpbnN0cnVjdGlvbnMpO1xuICAgIH1cbiAgfSk7XG59XG5cbi8qIGFuYWx5emVQb2xvWE1SUHJpY2VzXG4gKiBkZXNjOiBUYWtlcyB0aGUgZXhjaGFuZ2UgcHJpY2VzIGZyb20gUG9sb25pZXggYW5kIGRvZXMgdGhlIGRldGFpbGVkIGNvbXBhcmVzIHRvIGZpbmQgYXJiaXRyYWdlXG4gKiAgICAgICB3aXRoaW4gdGhpcyBleGNoYW5nZSBmb3IgdGhlaXIgWFJNIG1hcmtldC5cbiAqL1xuZnVuY3Rpb24gYW5hbHl6ZVBvbG9YTVJQcmljZXMoZXhjaGFuZ2VQcmljZXMsIHRpbWVTdGFtcCkge1xuXG4gIGxldCB0aW1lU3RhbXBTdHIgPSB0aW1lU3RhbXAuZ2V0VGltZSgpO1xuICBjb25zb2xlLmxvZyhgcHJpY2VDaGVja0NvdW50OiR7bnVtYmVyT2ZDaGVja3N9fFhNUnxtYXhCdXlBcmI6Ti9BfG1heFNlbGxBcmJYTVI6JHttYXhTZWxsQXJiWE1SfWApO1xuICBsZXQgY29pbnMgPSBbXCJMVENcIiwgXCJaRUNcIiwgXCJOWFRcIiwgXCJEQVNIXCIsIFwiQkNOXCIsIFwiTUFJRFwiXTtcbiAgLy8gQ2hlY2sgaWYgc2VsbGluZyB0aGUgY29pbiB3aWxsIGJlIHByb2ZpdGFibGVcbiAgY29pbnMuZm9yRWFjaChjdXJDb2luID0+IHtcbiAgICBsZXQgYmFzZU1hcmtldCA9IFwiWE1SXCI7XG4gICAgbGV0IGJhc2VNYXJrZXRfY3VyQ29pbkJpZCA9IGV4Y2hhbmdlUHJpY2VzW2Jhc2VNYXJrZXQgKyBcIl9cIiArIGN1ckNvaW5dLmhpZ2hlc3RCaWQ7XG4gICAgbGV0IEJUQ19iYXNlTWFya2V0QmlkID0gZXhjaGFuZ2VQcmljZXNbXCJCVENcIiArIFwiX1wiICsgYmFzZU1hcmtldF0uaGlnaGVzdEJpZDtcbiAgICBsZXQgQlRDX2N1ckNvaW5Bc2sgPSBleGNoYW5nZVByaWNlc1tcIkJUQ1wiICsgXCJfXCIgKyBjdXJDb2luXS5sb3dlc3RBc2s7XG4gICAgbGV0IEFtdEluaXQgPSAxO1xuICAgIGxldCBBbXRGaW5hbCA9IEFtdEluaXQqQlRDX2Jhc2VNYXJrZXRCaWQqYmFzZU1hcmtldF9jdXJDb2luQmlkL0JUQ19jdXJDb2luQXNrO1xuICAgIGxldCBBcmJSYXRpbyA9IEFtdEZpbmFsL0FtdEluaXQ7XG4gICAgbGV0IHNob3dNYXggPSBcIlwiO1xuICAgIGlmIChBcmJSYXRpbz5tYXhTZWxsQXJiWE1SKSB7XG4gICAgICBtYXhTZWxsQXJiWE1SID0gQXJiUmF0aW87XG4gICAgICBzaG93TWF4ID0gXCJOZXdNYXhcIjtcbiAgICB9XG4gICAgaWYgKEFyYlJhdGlvPjEuMClcbiAgICAgIGNvbnNvbGUubG9nKGBSRUN8JHt0aW1lU3RhbXB9fCR7dGltZVN0YW1wU3RyfXxTZWxsfCR7Y3VyQ29pbn18WE1SfEFyYlJhdGlvOiR7QXJiUmF0aW99fCR7c2hvd01heH1gKTtcbiAgICBpZiAoQXJiUmF0aW8gPiB0aHJlc2hvbGQpIHtcbiAgICAgIGxldCBpbnN0cnVjdGlvbnMgPSBgQUxFUlQ6IFNlbGwgJHtBbXRJbml0fSAke2N1ckNvaW59IGZvciAke0FtdEluaXQqYmFzZU1hcmtldF9jdXJDb2luQmlkfSBYTVIsIFxuICAgICAgICB0aGVuIHNlbGwgdGhvc2UgWE1SIGZvciAke0FtdEluaXQqQlRDX2Jhc2VNYXJrZXRCaWQqYmFzZU1hcmtldF9jdXJDb2luQmlkfSBCVEMsXG4gICAgICAgIHRoZW4gdXNlIHRob3NlIEJUQyB0byBidXkgJHtBbXRGaW5hbH0gJHtjdXJDb2lufWA7XG4gICAgICBjb25zb2xlLmxvZyhpbnN0cnVjdGlvbnMpO1xuICAgIH1cbiAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJ1blBvbG9Db2luYmFzZUNvbXBhcmUoKSB7XG4gIGxldCBwb2xvbmlleERhdGEgPSBhd2FpdCBnZXRFeGNoYW5nZURhdGEocG9sb25pZXhVUkwpO1xuICBsZXQgY29pbmJhc2VEYXRhWkVDID0gYXdhaXQgZ2V0RXhjaGFuZ2VEYXRhKGNvaW5iYXNlVVJMK1wiL1pFQy1VU0RDL2Jvb2tcIik7XG4gIGxldCBjb2luYmFzZURhdGFFVEggPSBhd2FpdCBnZXRFeGNoYW5nZURhdGEoY29pbmJhc2VVUkwrXCIvRVRILVVTREMvYm9va1wiKTtcbiAgbGV0IGNvaW5iYXNlRGF0YUJUQyA9IGF3YWl0IGdldEV4Y2hhbmdlRGF0YShjb2luYmFzZVVSTCtcIi9CVEMtVVNEQy9ib29rXCIpO1xuICBjb21wYXJlUG9sb25pZXhDb2luYmFzZShwb2xvbmlleERhdGEsIGNvaW5iYXNlRGF0YVpFQywgXCJaRUNcIik7XG4gIGNvbXBhcmVQb2xvbmlleENvaW5iYXNlKHBvbG9uaWV4RGF0YSwgY29pbmJhc2VEYXRhRVRILCBcIkVUSFwiKTtcbiAgY29tcGFyZVBvbG9uaWV4Q29pbmJhc2UocG9sb25pZXhEYXRhLCBjb2luYmFzZURhdGFCVEMsIFwiQlRDXCIpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBydW5Qb2xvQml0dHJleENvbXBhcmUoKSB7XG5cbiAgbnVtYmVyT2ZDaGVja3MrKztcbiAgLy8gUG9sb25pZXggc2VjdGlvbiAtIEFsbCBjb2lucyBmcm9tIG9uZSByZXF1ZXN0XG4gIGxldCBwb2xvbmlleERhdGEgPSBhd2FpdCBnZXRFeGNoYW5nZURhdGEocG9sb25pZXhVUkwpO1xuICAvLyBCaXR0cmV4IHNlY3Rpb24gLSBBbGwgY29pbnMgZnJvbSBvbmUgcmVxdWVzdC5cbiAgLy8gQml0dHJleCBtYXJrZXQgc3VtbWFyeSAtIEFsbCBjb2lucyBmcm9tIG9uZSByZXF1ZXN0LlxuICBsZXQgYml0dHJleEFMTCA9IGF3YWl0IGdldEV4Y2hhbmdlRGF0YShiaXR0cmV4VVJMQWxsKTtcbiAgbGV0IGJpdHRyZXhKU09OID0gSlNPTi5wYXJzZShiaXR0cmV4QUxMLmV4Y2hhbmdlRGF0YSk7XG4gIGxldCBiaXR0cmV4QlRDQ29pbnMgPSB7XG4gICAgQlRDOiBbXCJhcmRyXCIsIFwiYmF0XCIsIFwiYm50XCIsIFwiYnVyc3RcIiwgXCJjdmNcIiwgXCJkYXNoXCIsIFwiZGdiXCIsIFwiZG9nZVwiLFxuICAgIFwiZXRjXCIsIFwiZXRoXCIsIFwiZmN0XCIsIFwiZ2FtZVwiLCBcImdudFwiLCBcImxiY1wiLCBcImxvb21cIiwgXCJsc2tcIiwgXCJsdGNcIiwgXCJtYW5hXCIsIFwibmF2XCIsIFwibm1yXCIsIFwibnh0XCIsIFwib21nXCIsXG4gICAgXCJwb2x5XCIsIFwicHBjXCIsIFwicXR1bVwiLCBcInJlcFwiLCBcInNiZFwiLCBcInNjXCIsIFwic250XCIsIFwic3RlZW1cIiwgXCJzdG9yalwiLCBcInhycFwiLCBcInN5c1wiLCBcInN0cmF0XCIsIFwidmlhXCIsIFwidnRjXCIsXG4gICAgXCJ4Y3BcIiwgXCJ4ZW1cIiwgXCJ4bXJcIiwgXCJ4cnBcIiwgXCJ6ZWNcIiwgXCJ6cnhcIl0sXG4gICAgRVRIOiBbXCJCQVRcIiwgXCJCTlRcIiwgXCJDVkNcIiwgXCJFVENcIiwgXCJHTlRcIiwgXCJNQU5BXCIsIFwiT01HXCIsIFwiUVRVTVwiLCBcIlJFUFwiLCBcIlNOVFwiLCBcIlpFQ1wiLCBcIlpSWFwiXSxcbiAgICBVU0RUOiBbXCJCQVRcIiwgXCJCVENcIiwgXCJEQVNIXCJdXG4gIH07XG4gIGxldCBiYXNlTWFya2V0cyA9IFtcIkJUQ1wiLCBcIkVUSFwiLCBcIlVTRFRcIl07XG4gIGJhc2VNYXJrZXRzLmZvckVhY2goYmFzZU1rdCA9PiB7XG4gICAgY29uc29sZS5sb2coXCJQcm9jZXNzaW5nIGJhc2Vta3Q6XCIsIGJhc2VNa3QpO1xuICAgIGxldCBiaXR0cmV4VHJpbW1lZCA9IHt9O1xuICAgIGJpdHRyZXhKU09OLnJlc3VsdC5mb3JFYWNoKG1hcmtldCA9PiB7XG4gICAgICBiaXR0cmV4QlRDQ29pbnNbYmFzZU1rdF0uZm9yRWFjaChjb2luID0+IHtcbiAgICAgICAgbGV0IE1hcmtldE5hbWUgPSBiYXNlTWt0K1wiLVwiK2NvaW4udG9VcHBlckNhc2UoKTtcbiAgICAgICAgLy9jb25zb2xlLmxvZyhcIk1hcmtldE5hbWU6XCIsIE1hcmtldE5hbWUpO1xuICAgICAgICBpZiAobWFya2V0Lk1hcmtldE5hbWU9PT1NYXJrZXROYW1lKSB7XG4gICAgICAgICAgYml0dHJleFRyaW1tZWRbTWFya2V0TmFtZV0gPSBtYXJrZXQ7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGxldCBiaXR0cmV4Q29tcGFyZSA9IHt9O1xuICAgIGJpdHRyZXhDb21wYXJlLnRpbWVTdGFtcCA9IGJpdHRyZXhBTEwudGltZVN0YW1wO1xuICAgIGJpdHRyZXhDb21wYXJlLmV4Y2hhbmdlRGF0YSA9IGJpdHRyZXhUcmltbWVkO1xuICAgIGNvbXBhcmVBbGxQb2xvbmlleEJpdHRyZXgocG9sb25pZXhEYXRhLCBiaXR0cmV4Q29tcGFyZSk7XG4gIH0pO1xuICBjb25zb2xlLmxvZyhgQ29tcGFyZSBjeWNsZSAke251bWJlck9mQ2hlY2tzfSBjb21wbGV0ZS5gKVxufVxuXG5cbmFzeW5jIGZ1bmN0aW9uIHJ1blBvbG9IaXRidGNDb21wYXJlKCkge1xuXG4gIG51bWJlck9mQ2hlY2tzKys7XG4gIC8vIFBvbG9uaWV4IHNlY3Rpb24gLSBBbGwgY29pbnMgZnJvbSBvbmUgcmVxdWVzdFxuICBsZXQgcG9sb25pZXhEYXRhID0gYXdhaXQgZ2V0RXhjaGFuZ2VEYXRhKHBvbG9uaWV4VVJMKTtcbiAgLy8gQml0dHJleCBzZWN0aW9uIC0gQWxsIGNvaW5zIGZyb20gb25lIHJlcXVlc3QuXG4gIC8vIEJpdHRyZXggbWFya2V0IHN1bW1hcnkgLSBBbGwgY29pbnMgZnJvbSBvbmUgcmVxdWVzdC5cbiAgbGV0IGhpdGJ0Y0RhdGEgPSBhd2FpdCBnZXRFeGNoYW5nZURhdGEoaGl0YnRjVVJMKTsgIFxuICBsZXQgaGl0YnRjSlNPTiA9IEpTT04ucGFyc2UoaGl0YnRjRGF0YS5leGNoYW5nZURhdGEpO1xuICBsZXQgaGl0YnRjTWFya2V0cyA9IFtcIkVUSEJUQ1wiLCBcIkxTS0JUQ1wiLCBcIkRBU0hCVENcIiwgXCJaRUNFVEhcIixcbiAgXCJCQ05CVENcIixcbiAgXCJEQVNIQlRDXCIsXG4gIFwiRE9HRUJUQ1wiLFxuICBcIkxTS0JUQ1wiLFxuICBcIk1BSURCVENcIixcbiAgXCJSRVBCVENcIixcbiAgXCJYRU1CVENcIl07XG5cbiAgbGV0IGhpdGJ0Y1RyaW1tZWQgPSB7fTtcbiAgaGl0YnRjTWFya2V0cy5mb3JFYWNoKG1hcmtldCA9PiB7XG4gICAgaGl0YnRjSlNPTi5mb3JFYWNoKGV4Y2hhbmdlRGF0YSA9PiB7XG4gICAgICBpZihleGNoYW5nZURhdGEuc3ltYm9sPT09bWFya2V0KVxuICAgICAgICBoaXRidGNUcmltbWVkW21hcmtldF0gPSBleGNoYW5nZURhdGE7XG4gICAgfSk7ICAgICBcbiAgfSk7XG4gIGxldCBoaXRidGNDb21wYXJlID0ge307XG4gIGhpdGJ0Y0NvbXBhcmUudGltZVN0YW1wID0gaGl0YnRjRGF0YS50aW1lU3RhbXA7XG4gIGhpdGJ0Y0NvbXBhcmUuZXhjaGFuZ2VEYXRhID0gaGl0YnRjVHJpbW1lZDtcbiAgY29tcGFyZUFsbFBvbG9uaWV4SGl0YnRjKHBvbG9uaWV4RGF0YSwgaGl0YnRjQ29tcGFyZSk7XG59XG5cbi8vIFNldCB0aGUgZGVmYXVsdCBjb3BhcmUgdG8gcnVuLlxubGV0IGNvbXBhcmVUb1J1biA9ICBydW5Qb2xvQml0dHJleENvbXBhcmU7XG5pZiAocHJvY2Vzcy5hcmd2Lmxlbmd0aD49Mykge1xuICBpZiAocHJvY2Vzcy5hcmd2WzJdPT09XCJwb2xvaW50ZXJuYWxcIikge1xuICAgIGNvbnNvbGUubG9nKGBSdW5uaW5nIHBvbG9pbnRlcm5hbCBjb21wYXJlLmApO1xuICAgIGNvbXBhcmVUb1J1biA9IHBvbG9JbnRlcm5hbENvbXBhcmU7XG4gIH1cbiAgZWxzZSB7XG4gICAgaWYgKHByb2Nlc3MuYXJndlsyXT09PVwicG9sb2NvaW5iYXNlXCIpIHtcbiAgICAgIGNvbXBhcmVUb1J1biA9IHJ1blBvbG9Db2luYmFzZUNvbXBhcmU7XG4gICAgICBjb25zb2xlLmxvZyhcIlJ1bm5pbmcgUG9sb0NvaW5iYXNlQ29tcGFyZS5cIik7XG4gICAgfVxuICAgIGVsc2UgaWYgKHByb2Nlc3MuYXJndlsyXT09PVwicG9sb2hpdGJ0Y1wiKSB7XG4gICAgICBjb21wYXJlVG9SdW4gPSBydW5Qb2xvSGl0YnRjQ29tcGFyZTtcbiAgICAgIGNvbnNvbGUubG9nKFwiUnVubmluZyBQb2xvSGl0YnRjQ29tcGFyZS5cIilcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiUnVubmluZyBkZWZhdWx0IHBvbG8gYml0dHJleCBjb21wYXJlLlwiKTtcbiAgICB9XG4gIH1cbn1cbmxldCBuZXdJbnRlcmFsID0gMTAwMCoodGltZUluU2Vjb25kc0JldHdlZW5QcmljZUNoZWNrcyArIDIwKk1hdGgucmFuZG9tKCkpO1xuY29uc29sZS5sb2coYFNldHRpbmcgdGhlIHRpbWVyIGludGVydmFsIHRvICR7bmV3SW50ZXJhbC8xMDAwfSBzZWNvbmRzLmAgKTtcbmNvbXBhcmVUb1J1bigpO1xuaW50ZXJ2YWxIYW5kZWwgPSBzZXRJbnRlcnZhbChjb21wYXJlVG9SdW4sIG5ld0ludGVyYWwpO1xuIl19