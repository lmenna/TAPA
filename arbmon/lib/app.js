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
var yobitBaseURL = "https://yobit.net/api/3/ticker/";
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
              BTC: ["ardr", "bat", "bnt", "burst", "cvc", "dash", "dcr", "dgb", "doge", "etc", "eth", "fct", "game", "gnt", "lbc", "loom", "lsk", "ltc", "mana", "nav", "nmr", "nxt", "omg", "poly", "ppc", "qtum", "rep", "sbd", "sc", "snt", "steem", "storj", "strat", "sys", "via", "vtc", "xcp", "xem", "xlm", "xmr", "xrp", "zec", "zrx"],
              ETH: ["BAT", "BNT", "CVC", "ETC", "GNT", "MANA", "OMG", "QTUM", "REP", "SNT", "ZEC", "ZRX"],
              USDT: ["BAT", "BTC", "DASH", "DOGE", "LTC", "XMR", "XRP"]
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
}

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
            hitbtcMarkets = ["BCNBTC", "BNTUSDT", "DASHBTC", "DASHUSDT", "DGBBTC", "DOGEBTC", "DOGEUSDT", "EOSBTC", "EOSUSDT", "ETCUSDT", "ETHBTC", "ETHUSDT", "LSKBTC", "MAIDBTC", "MANABTC", "OMGBTC", "PPCBTC", "QTUMPPC", "REPBTC", "REPUSDT", "XEMBTC", "ZECETH"];
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

function runPoloYobitCompare() {
  return _runPoloYobitCompare.apply(this, arguments);
} // Set the default copare to run.


function _runPoloYobitCompare() {
  _runPoloYobitCompare = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee4() {
    var poloniexData, yobitMarkets, tickerList, i, yobitURL, yobitData;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            numberOfChecks++; // Poloniex section - All coins from one request

            _context4.next = 3;
            return (0, _getCryptoData.getExchangeData)(poloniexURL);

          case 3:
            poloniexData = _context4.sent;
            // Bittrex section - All coins from one request.
            // Bittrex market summary - All coins from one request.
            yobitMarkets = ["ltc_btc", "eth_btc"];
            tickerList = "";

            for (i = 0; i < yobitMarkets.length; i++) {
              tickerList += yobitMarkets[i];
              if (i != yobitMarkets.length - 1) tickerList += "-";
            }

            yobitURL = yobitBaseURL + tickerList;
            console.log("Run query for data at:", yobitURL);
            _context4.next = 11;
            return (0, _getCryptoData.getExchangeData)(yobitURL);

          case 11:
            yobitData = _context4.sent;
            console.log("yobitData:", yobitData);
            (0, _comparePricingData.compareAllPoloniexYobit)(poloniexData, yobitData);

          case 14:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));
  return _runPoloYobitCompare.apply(this, arguments);
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
    } else if (process.argv[2] === "poloyobit") {
      compareToRun = runPoloYobitCompare;
      console.log("Running runPoloYobitCompare.");
    } else {
      console.log("Running default polo bittrex compare.");
    }
  }
}

var newInteral = 1000 * (timeInSecondsBetweenPriceChecks + 20 * Math.random());
console.log("Setting the timer interval to ".concat(newInteral / 1000, " seconds."));
compareToRun();
intervalHandel = setInterval(compareToRun, newInteral);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcHAuanMiXSwibmFtZXMiOlsicmVxdWlyZSIsIlhNTEh0dHBSZXF1ZXN0IiwicG9sb25pZXhVUkwiLCJjb2luYmFzZVVSTCIsImJpdHRyZXhVUkxBbGwiLCJoaXRidGNVUkwiLCJ5b2JpdEJhc2VVUkwiLCJ0aHJlc2hvbGQiLCJudW1iZXJPZkNoZWNrcyIsImludGVydmFsSGFuZGVsIiwibWF4QnV5QXJiIiwibWF4U2VsbEFyYiIsIm1heFNlbGxBcmJFVEgiLCJtYXhTZWxsQXJiWE1SIiwidGltZUluU2Vjb25kc0JldHdlZW5QcmljZUNoZWNrcyIsInBvbG9JbnRlcm5hbENvbXBhcmUiLCJjb25zb2xlIiwibG9nIiwieG1saHR0cCIsIm1ldGhvZCIsInVybCIsIm9wZW4iLCJvbmVycm9yIiwib25yZWFkeXN0YXRlY2hhbmdlIiwicmVhZHlTdGF0ZSIsInN0YXR1cyIsImV4Y2hhbmdlRGF0YSIsInJlc3BvbnNlVGV4dCIsInRpbWVTdGFtcCIsIkRhdGUiLCJleGNoYW5nZU9iamVjdCIsIkpTT04iLCJwYXJzZSIsImNvaW5zIiwiYmFzZVN0YWJsZUNvaW4iLCJhbmFseXplUG9sb0JUQ1ByaWNlcyIsImFuYWx5emVQb2xvRVRIUHJpY2VzIiwiYW5hbHl6ZVBvbG9YTVJQcmljZXMiLCJzZW5kIiwiZXhjaGFuZ2VQcmljZXMiLCJ0aW1lU3RhbXBTdHIiLCJnZXRUaW1lIiwiZm9yRWFjaCIsImN1ckNvaW4iLCJsb3dlc3RBc2tCVEMiLCJsb3dlc3RBc2siLCJoaWdoZXN0QmlkVVNEQyIsImhpZ2hlc3RCaWQiLCJVU0RDX0JUQ2xvd2VzdEFzayIsIkFyYlJhdGlvIiwic2hvd01heCIsIkJUQ19jdXJDb2luQmlkIiwiVVNEQ19CVENCaWQiLCJVU0RDX2N1ckNvaW5Bc2siLCJBbXRJbml0IiwiQW10RmluYWwiLCJFVEhfY3VyQ29pbkJpZCIsIkJUQ19FVEhCaWQiLCJCVENfY3VyQ29pbkFzayIsImluc3RydWN0aW9ucyIsImJhc2VNYXJrZXQiLCJiYXNlTWFya2V0X2N1ckNvaW5CaWQiLCJCVENfYmFzZU1hcmtldEJpZCIsInJ1blBvbG9Db2luYmFzZUNvbXBhcmUiLCJwb2xvbmlleERhdGEiLCJjb2luYmFzZURhdGFaRUMiLCJjb2luYmFzZURhdGFFVEgiLCJjb2luYmFzZURhdGFCVEMiLCJydW5Qb2xvQml0dHJleENvbXBhcmUiLCJiaXR0cmV4QUxMIiwiYml0dHJleEpTT04iLCJiaXR0cmV4QlRDQ29pbnMiLCJCVEMiLCJFVEgiLCJVU0RUIiwiYmFzZU1hcmtldHMiLCJiYXNlTWt0IiwiYml0dHJleFRyaW1tZWQiLCJyZXN1bHQiLCJtYXJrZXQiLCJjb2luIiwiTWFya2V0TmFtZSIsInRvVXBwZXJDYXNlIiwiYml0dHJleENvbXBhcmUiLCJydW5Qb2xvSGl0YnRjQ29tcGFyZSIsImhpdGJ0Y0RhdGEiLCJoaXRidGNKU09OIiwiaGl0YnRjTWFya2V0cyIsImhpdGJ0Y1RyaW1tZWQiLCJzeW1ib2wiLCJoaXRidGNDb21wYXJlIiwicnVuUG9sb1lvYml0Q29tcGFyZSIsInlvYml0TWFya2V0cyIsInRpY2tlckxpc3QiLCJpIiwibGVuZ3RoIiwieW9iaXRVUkwiLCJ5b2JpdERhdGEiLCJjb21wYXJlVG9SdW4iLCJwcm9jZXNzIiwiYXJndiIsIm5ld0ludGVyYWwiLCJNYXRoIiwicmFuZG9tIiwic2V0SW50ZXJ2YWwiXSwibWFwcGluZ3MiOiI7O0FBRUE7O0FBQ0E7Ozs7OztBQUhBQSxPQUFPLENBQUMsaUJBQUQsQ0FBUDs7QUFNQSxJQUFJQyxjQUFjLEdBQUdELE9BQU8sQ0FBQyxnQkFBRCxDQUFQLENBQTBCQyxjQUEvQzs7QUFFQSxJQUFNQyxXQUFXLEdBQUcsa0RBQXBCO0FBQ0EsSUFBTUMsV0FBVyxHQUFHLHVDQUFwQjtBQUNBLElBQU1DLGFBQWEsR0FBRyx3REFBdEI7QUFDQSxJQUFNQyxTQUFTLEdBQUcsNENBQWxCO0FBQ0EsSUFBTUMsWUFBWSxHQUFHLGlDQUFyQjtBQUNBLElBQU1DLFNBQVMsR0FBRyxJQUFsQjtBQUNBLElBQUlDLGNBQWMsR0FB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aGFuZ2VEYXRhfSBmcm9tIFwiLi91dGlscy9nZXRDcnlwdG9EYXRhLmpzXCI7XG5pbXBvcnQge2NvbXBhcmVQb2xvbmlleENvaW5iYXNlLCBjb21wYXJlQWxsUG9sb25pZXhCaXR0cmV4LCBjb21wYXJlQWxsUG9sb25pZXhIaXRidGMsXG4gIGNvbXBhcmVBbGxQb2xvbmlleFlvYml0fSBmcm9tIFwiLi91dGlscy9jb21wYXJlUHJpY2luZ0RhdGFcIjtcblxubGV0IFhNTEh0dHBSZXF1ZXN0ID0gcmVxdWlyZShcInhtbGh0dHByZXF1ZXN0XCIpLlhNTEh0dHBSZXF1ZXN0O1xuXG5jb25zdCBwb2xvbmlleFVSTCA9IFwiaHR0cHM6Ly9wb2xvbmlleC5jb20vcHVibGljP2NvbW1hbmQ9cmV0dXJuVGlja2VyXCI7IFxuY29uc3QgY29pbmJhc2VVUkwgPSBcImh0dHBzOi8vYXBpLnByby5jb2luYmFzZS5jb20vcHJvZHVjdHNcIjsgXG5jb25zdCBiaXR0cmV4VVJMQWxsID0gXCJodHRwczovL2JpdHRyZXguY29tL2FwaS92MS4xL3B1YmxpYy9nZXRtYXJrZXRzdW1tYXJpZXNcIjtcbmNvbnN0IGhpdGJ0Y1VSTCA9IFwiaHR0cHM6Ly9hcGkuaGl0YnRjLmNvbS9hcGkvMi9wdWJsaWMvdGlja2VyXCI7XG5jb25zdCB5b2JpdEJhc2VVUkwgPSBcImh0dHBzOi8veW9iaXQubmV0L2FwaS8zL3RpY2tlci9cIlxuY29uc3QgdGhyZXNob2xkID0gMS4wMTtcbmxldCBudW1iZXJPZkNoZWNrcyA9IDA7XG5sZXQgaW50ZXJ2YWxIYW5kZWwgPSAtMTtcbmxldCBtYXhCdXlBcmIgPSAwO1xubGV0IG1heFNlbGxBcmIgPSAwO1xubGV0IG1heFNlbGxBcmJFVEggPSAwO1xubGV0IG1heFNlbGxBcmJYTVIgPSAwO1xuXG5jb25zdCB0aW1lSW5TZWNvbmRzQmV0d2VlblByaWNlQ2hlY2tzID0gMTU7XG5cbi8qIHBvbG9JbnRlcm5hbENvbXBhcmVcbiAqIGRlc2M6IExvb2tzIGZvciBhcmJpdHJhZ2UgcHJvZml0cyBmcm9tIHNjZW5hcmlvcyB3aGVyZSBhIGNvaW4xIGlzIGV4Y2hhbmdlZCBmb3IgY29pbjIsIGNvaW4yIGV4Y2hhbmdlZCBmb3IgY29pbjMgYW5kIHRoZW4gXG4gKiAgICAgICBjb2luMyBleGNoYW5nZWQgYmFjayBpbnRvIGNvaW4xLlxuICogICAgICAgVGhpcyBjb21wYXJlIGxvb2tzIG9ubHkgd2l0aGluIHRoZSBQb2xvbmlleCBleGNoYW5nZS5cbiovXG5mdW5jdGlvbiBwb2xvSW50ZXJuYWxDb21wYXJlKCkge1xuXG4gIGNvbnNvbGUubG9nKFwiQkVHSU46IHBvbG9JbnRlcm5hbENvbXBhcmVcIik7XG4gIGxldCB4bWxodHRwID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCksXG4gICAgbWV0aG9kID0gXCJHRVRcIixcbiAgICB1cmwgPSBwb2xvbmlleFVSTDtcblxuICBjb25zb2xlLmxvZyhcIkxvYWRpbmcgZGF0YSBmcm9tIDogSHR0cC5zZW5kKFwiLCB1cmwsIFwiKVwiKTtcbiAgeG1saHR0cC5vcGVuKG1ldGhvZCwgdXJsLCB0cnVlKTtcbiAgeG1saHR0cC5vbmVycm9yID0gZnVuY3Rpb24gKCkge1xuICAgIGNvbnNvbGUubG9nKFwiKiogQW4gZXJyb3Igb2NjdXJyZWQgZHVyaW5nIHRoZSB0cmFuc2FjdGlvblwiKTtcbiAgfTtcbiAgeG1saHR0cC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5yZWFkeVN0YXRlPT09NCAmJiB0aGlzLnN0YXR1cz09PTIwMCkge1xuICAgICAgbGV0IGV4Y2hhbmdlRGF0YSA9IHhtbGh0dHAucmVzcG9uc2VUZXh0O1xuICAgICAgbnVtYmVyT2ZDaGVja3MrKztcbiAgICAgIGxldCB0aW1lU3RhbXAgPSBuZXcgRGF0ZSgpO1xuICAgICAgbGV0IGV4Y2hhbmdlT2JqZWN0ID0gSlNPTi5wYXJzZShleGNoYW5nZURhdGEpO1xuICAgICAgbGV0IGNvaW5zID0gW1wiRk9BTVwiLCBcIlpFQ1wiLCBcIkxUQ1wiLCBcIkVUSFwiLCBcIlhSUFwiLCBcIlNUUlwiLCBcIlhNUlwiLCBcIkRPR0VcIiwgXCJCQ0hBQkNcIiwgXCJCQ0hTVlwiXTtcbiAgICAgIGxldCBiYXNlU3RhYmxlQ29pbiA9IFwiVVNEQ1wiO1xuICAgICAgYW5hbHl6ZVBvbG9CVENQcmljZXMoZXhjaGFuZ2VPYmplY3QsIGJhc2VTdGFibGVDb2luLCBjb2lucywgdGltZVN0YW1wKTtcbiAgICAgIGNvaW5zID0gW1wiQkFUXCIsIFwiQk5UXCIsIFwiREFTSFwiLCBcIkRPR0VcIiwgXCJFT1NcIiwgXCJFVENcIiwgXCJFVEhcIiwgXCJHTlRcIiwgXCJLTkNcIiwgXCJMT09NXCIsIFwiTFNLXCIsXG4gICAgICAgIFwiTFRDXCIsIFwiTUFOQVwiLCBcIk5YVFwiLCBcIlFUVU1cIiwgXCJSRVBcIiwgXCJTQ1wiLCBcIlNOVFwiLCBcIlNUUlwiLCBcIlhNUlwiLCBcIlhSUFwiLCBcIlpFQ1wiLCBcIlpSWFwiXTtcbiAgICAgIGJhc2VTdGFibGVDb2luID0gXCJVU0RUXCI7IFxuICAgICAgYW5hbHl6ZVBvbG9CVENQcmljZXMoZXhjaGFuZ2VPYmplY3QsIGJhc2VTdGFibGVDb2luLCBjb2lucywgdGltZVN0YW1wKTtcbiAgICAgIGFuYWx5emVQb2xvRVRIUHJpY2VzKGV4Y2hhbmdlT2JqZWN0LCB0aW1lU3RhbXApO1xuICAgICAgYW5hbHl6ZVBvbG9YTVJQcmljZXMoZXhjaGFuZ2VPYmplY3QsIHRpbWVTdGFtcCk7XG4gICAgfVxuICB9XG4gIHhtbGh0dHAuc2VuZCgpO1xuICBjb25zb2xlLmxvZyhcIkVORDogcG9sb0ludGVybmFsQ29tcGFyZVwiKTtcbn1cblxuLyogYW5hbHl6ZVBvbG9CVENQcmljZXNcbiAqIGRlc2M6IFRha2VzIHRoZSBleGNoYW5nZSBwcmljZXMgZnJvbSBQb2xvbmlleCBhbmQgZG9lcyB0aGUgZGV0YWlsZWQgY29tcGFyZXMgdG8gZmluZCBhcmJpdHJhZ2VcbiAqICAgICAgIHdpdGhpbiB0aGlzIGV4Y2hhbmdlLiAgSXQgZG9lcyB0aGlzIGZvciB0aGUgQlRDIG1hcmtldC5cbiAqL1xuZnVuY3Rpb24gYW5hbHl6ZVBvbG9CVENQcmljZXMoZXhjaGFuZ2VQcmljZXMsIGJhc2VTdGFibGVDb2luLCBjb2lucywgdGltZVN0YW1wKSB7XG5cbiAgbGV0IHRpbWVTdGFtcFN0ciA9IHRpbWVTdGFtcC5nZXRUaW1lKCk7XG4gIGNvbnNvbGUubG9nKGBwcmljZUNoZWNrQ291bnQ6JHtudW1iZXJPZkNoZWNrc318JHtiYXNlU3RhYmxlQ29pbn18bWF4QnV5QXJiOiR7bWF4QnV5QXJifXxtYXhTZWxsQXJiOiR7bWF4U2VsbEFyYn1gKTtcbiAgLy8gQ2hlY2sgaWYgYnV5aW5nIHRoZSBjb2luIHdpbGwgYmUgcHJvZml0YWJsZS5cbiAgY29pbnMuZm9yRWFjaChjdXJDb2luID0+IHtcbiAgICBsZXQgbG93ZXN0QXNrQlRDID0gZXhjaGFuZ2VQcmljZXNbXCJCVENfXCIgKyBjdXJDb2luXS5sb3dlc3RBc2s7XG4gICAgbGV0IGhpZ2hlc3RCaWRVU0RDID0gZXhjaGFuZ2VQcmljZXNbYmFzZVN0YWJsZUNvaW4gKyBcIl9cIiArIGN1ckNvaW5dLmhpZ2hlc3RCaWQ7XG4gICAgbGV0IFVTRENfQlRDbG93ZXN0QXNrID0gZXhjaGFuZ2VQcmljZXNbYmFzZVN0YWJsZUNvaW4gKyBcIl9cIiArIFwiQlRDXCJdLmxvd2VzdEFzaztcbiAgICBsZXQgQXJiUmF0aW8gPSBoaWdoZXN0QmlkVVNEQyAvICggbG93ZXN0QXNrQlRDICogIFVTRENfQlRDbG93ZXN0QXNrKTtcbiAgICBsZXQgc2hvd01heCA9IFwiXCI7XG4gICAgaWYgKEFyYlJhdGlvPm1heEJ1eUFyYikge1xuICAgICAgbWF4QnV5QXJiID0gQXJiUmF0aW87XG4gICAgICBzaG93TWF4ID0gXCJOZXdNYXhcIjtcbiAgICB9XG4gICAgaWYgKEFyYlJhdGlvPjEuMClcbiAgICAgIGNvbnNvbGUubG9nKGBSRUN8JHt0aW1lU3RhbXB9fCR7dGltZVN0YW1wU3RyfXxCdXl8JHtiYXNlU3RhYmxlQ29pbn18JHtjdXJDb2lufXxBcmJSYXRpbzoke0FyYlJhdGlvfXwke3Nob3dNYXh9YCk7XG4gICAgaWYgKEFyYlJhdGlvID4gdGhyZXNob2xkKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIlNvbWV0aGluZyBkcmFtYXRpYyBuZWVkcyB0byBoYXBwZW4hXCIpO1xuICAgIH1cbiAgfSk7XG4gIC8vIENoZWNrIGlmIHNlbGxpbmcgdGhlIGNvaW4gd2lsbCBiZSBwcm9maXRhYmxlXG4gIGNvaW5zLmZvckVhY2goY3VyQ29pbiA9PiB7XG4gICAgbGV0IEJUQ19jdXJDb2luQmlkID0gZXhjaGFuZ2VQcmljZXNbXCJCVENfXCIrY3VyQ29pbl0uaGlnaGVzdEJpZDtcbiAgICBsZXQgVVNEQ19CVENCaWQgPSBleGNoYW5nZVByaWNlc1tiYXNlU3RhYmxlQ29pbiArIFwiX1wiICsgXCJCVENcIl0uaGlnaGVzdEJpZDtcbiAgICBsZXQgVVNEQ19jdXJDb2luQXNrID0gZXhjaGFuZ2VQcmljZXNbYmFzZVN0YWJsZUNvaW4gKyBcIl9cIiArY3VyQ29pbl0ubG93ZXN0QXNrO1xuICAgIGxldCBBbXRJbml0ID0gMTAwMDA7XG4gICAgbGV0IEFtdEZpbmFsID0gQW10SW5pdCpCVENfY3VyQ29pbkJpZCpVU0RDX0JUQ0JpZC9VU0RDX2N1ckNvaW5Bc2s7XG4gICAgbGV0IEFyYlJhdGlvID0gQW10RmluYWwvQW10SW5pdDtcbiAgICBsZXQgc2hvd01heCA9IFwiXCI7XG4gICAgaWYgKEFyYlJhdGlvPm1heFNlbGxBcmIpIHtcbiAgICAgIG1heFNlbGxBcmIgPSBBcmJSYXRpbztcbiAgICAgIHNob3dNYXggPSBcIk5ld01heFwiO1xuICAgIH1cbiAgICBpZiAoQXJiUmF0aW8+MS4wKVxuICAgICAgY29uc29sZS5sb2coYFJFQ3wke3RpbWVTdGFtcH18JHt0aW1lU3RhbXBTdHJ9fFNlbGx8JHtiYXNlU3RhYmxlQ29pbn18JHtjdXJDb2lufXxBcmJSYXRpbzoke0FyYlJhdGlvfXwke3Nob3dNYXh9YCk7XG4gICAgaWYgKEFyYlJhdGlvID4gdGhyZXNob2xkKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIlNvbWV0aGluZyBkcmFtYXRpYyBuZWVkcyB0byBoYXBwZW4hXCIpO1xuICAgIH1cbiAgfSk7XG59XG5cbi8qIGFuYWx5emVQb2xvRVRIUHJpY2VzXG4gKiBkZXNjOiBUYWtlcyB0aGUgZXhjaGFuZ2UgcHJpY2VzIGZyb20gUG9sb25pZXggYW5kIGRvZXMgdGhlIGRldGFpbGVkIGNvbXBhcmVzIHRvIGZpbmQgYXJiaXRyYWdlXG4gKiAgICAgICB3aXRoaW4gdGhpcyBleGNoYW5nZSBmb3IgdGhlaXIgRVRIIG1hcmtldC5cbiAqL1xuZnVuY3Rpb24gYW5hbHl6ZVBvbG9FVEhQcmljZXMoZXhjaGFuZ2VQcmljZXMsIHRpbWVTdGFtcCkge1xuXG4gIGxldCB0aW1lU3RhbXBTdHIgPSB0aW1lU3RhbXAuZ2V0VGltZSgpO1xuICBjb25zb2xlLmxvZyhgcHJpY2VDaGVja0NvdW50OiR7bnVtYmVyT2ZDaGVja3N9fEVUSHxtYXhCdXlBcmI6Ti9BfG1heFNlbGxBcmJFVEg6JHttYXhTZWxsQXJiRVRIfWApO1xuICBsZXQgY29pbnMgPSBbXCJCQVRcIiwgXCJCTlRcIiwgXCJDVkNcIiwgXCJFT1NcIiwgXCJFVENcIiwgXCJHQVNcIiwgXCJHTlRcIiwgXCJLTkNcIiwgXCJMT09NXCIsIFwiTFNLXCIsIFxuICAgIFwiTUFOQVwiLCBcIk9NR1wiLCBcIlFUVU1cIiwgXCJSRVBcIiwgXCJTTlRcIiwgXCJTVEVFTVwiLCBcIlpFQ1wiLCBcIlpSWFwiXTtcbiAgLy8gQ2hlY2sgaWYgc2VsbGluZyB0aGUgY29pbiB3aWxsIGJlIHByb2ZpdGFibGVcbiAgY29pbnMuZm9yRWFjaChjdXJDb2luID0+IHtcbiAgICBsZXQgRVRIX2N1ckNvaW5CaWQgPSBleGNoYW5nZVByaWNlc1tcIkVUSF9cIitjdXJDb2luXS5oaWdoZXN0QmlkO1xuICAgIGxldCBCVENfRVRIQmlkID0gZXhjaGFuZ2VQcmljZXNbXCJCVENfRVRIXCJdLmhpZ2hlc3RCaWQ7XG4gICAgbGV0IEJUQ19jdXJDb2luQXNrID0gZXhjaGFuZ2VQcmljZXNbXCJCVENfXCIrY3VyQ29pbl0ubG93ZXN0QXNrO1xuICAgIGxldCBBbXRJbml0ID0gMTtcbiAgICBsZXQgQW10RmluYWwgPSBBbXRJbml0KkJUQ19FVEhCaWQqRVRIX2N1ckNvaW5CaWQvQlRDX2N1ckNvaW5Bc2s7XG4gICAgbGV0IEFyYlJhdGlvID0gQW10RmluYWwvQW10SW5pdDtcbiAgICBsZXQgc2hvd01heCA9IFwiXCI7XG4gICAgaWYgKEFyYlJhdGlvPm1heFNlbGxBcmJFVEgpIHtcbiAgICAgIG1heFNlbGxBcmJFVEggPSBBcmJSYXRpbztcbiAgICAgIHNob3dNYXggPSBcIk5ld01heFwiO1xuICAgIH1cbiAgICBpZiAoQXJiUmF0aW8+MS4wKVxuICAgICAgY29uc29sZS5sb2coYFJFQ3wke3RpbWVTdGFtcH18JHt0aW1lU3RhbXBTdHJ9fFNlbGx8JHtjdXJDb2lufXxFVEh8QXJiUmF0aW86JHtBcmJSYXRpb318JHtzaG93TWF4fWApO1xuICAgIGlmIChBcmJSYXRpbyA+IHRocmVzaG9sZCkge1xuICAgICAgbGV0IGluc3RydWN0aW9ucyA9IGBBTEVSVDogU2VsbCAke0FtdEluaXR9ICR7Y3VyQ29pbn0gZm9yICR7QW10SW5pdCpFVEhfY3VyQ29pbkJpZH0gRVRILCBcbiAgICAgICAgdGhlbiBzZWxsIHRob3NlIEVUSCBmb3IgJHtBbXRJbml0KkVUSF9jdXJDb2luQmlkKkJUQ19FVEhCaWR9IEJUQyxcbiAgICAgICAgdGhlbiB1c2UgdGhvc2UgQlRDIHRvIGJ1eSAke0FtdEZpbmFsfSAke2N1ckNvaW59YDtcbiAgICAgIGNvbnNvbGUubG9nKGluc3RydWN0aW9ucyk7XG4gICAgfVxuICB9KTtcbn1cblxuLyogYW5hbHl6ZVBvbG9YTVJQcmljZXNcbiAqIGRlc2M6IFRha2VzIHRoZSBleGNoYW5nZSBwcmljZXMgZnJvbSBQb2xvbmlleCBhbmQgZG9lcyB0aGUgZGV0YWlsZWQgY29tcGFyZXMgdG8gZmluZCBhcmJpdHJhZ2VcbiAqICAgICAgIHdpdGhpbiB0aGlzIGV4Y2hhbmdlIGZvciB0aGVpciBYUk0gbWFya2V0LlxuICovXG5mdW5jdGlvbiBhbmFseXplUG9sb1hNUlByaWNlcyhleGNoYW5nZVByaWNlcywgdGltZVN0YW1wKSB7XG5cbiAgbGV0IHRpbWVTdGFtcFN0ciA9IHRpbWVTdGFtcC5nZXRUaW1lKCk7XG4gIGNvbnNvbGUubG9nKGBwcmljZUNoZWNrQ291bnQ6JHtudW1iZXJPZkNoZWNrc318WE1SfG1heEJ1eUFyYjpOL0F8bWF4U2VsbEFyYlhNUjoke21heFNlbGxBcmJYTVJ9YCk7XG4gIGxldCBjb2lucyA9IFtcIkxUQ1wiLCBcIlpFQ1wiLCBcIk5YVFwiLCBcIkRBU0hcIiwgXCJCQ05cIiwgXCJNQUlEXCJdO1xuICAvLyBDaGVjayBpZiBzZWxsaW5nIHRoZSBjb2luIHdpbGwgYmUgcHJvZml0YWJsZVxuICBjb2lucy5mb3JFYWNoKGN1ckNvaW4gPT4ge1xuICAgIGxldCBiYXNlTWFya2V0ID0gXCJYTVJcIjtcbiAgICBsZXQgYmFzZU1hcmtldF9jdXJDb2luQmlkID0gZXhjaGFuZ2VQcmljZXNbYmFzZU1hcmtldCArIFwiX1wiICsgY3VyQ29pbl0uaGlnaGVzdEJpZDtcbiAgICBsZXQgQlRDX2Jhc2VNYXJrZXRCaWQgPSBleGNoYW5nZVByaWNlc1tcIkJUQ1wiICsgXCJfXCIgKyBiYXNlTWFya2V0XS5oaWdoZXN0QmlkO1xuICAgIGxldCBCVENfY3VyQ29pbkFzayA9IGV4Y2hhbmdlUHJpY2VzW1wiQlRDXCIgKyBcIl9cIiArIGN1ckNvaW5dLmxvd2VzdEFzaztcbiAgICBsZXQgQW10SW5pdCA9IDE7XG4gICAgbGV0IEFtdEZpbmFsID0gQW10SW5pdCpCVENfYmFzZU1hcmtldEJpZCpiYXNlTWFya2V0X2N1ckNvaW5CaWQvQlRDX2N1ckNvaW5Bc2s7XG4gICAgbGV0IEFyYlJhdGlvID0gQW10RmluYWwvQW10SW5pdDtcbiAgICBsZXQgc2hvd01heCA9IFwiXCI7XG4gICAgaWYgKEFyYlJhdGlvPm1heFNlbGxBcmJYTVIpIHtcbiAgICAgIG1heFNlbGxBcmJYTVIgPSBBcmJSYXRpbztcbiAgICAgIHNob3dNYXggPSBcIk5ld01heFwiO1xuICAgIH1cbiAgICBpZiAoQXJiUmF0aW8+MS4wKVxuICAgICAgY29uc29sZS5sb2coYFJFQ3wke3RpbWVTdGFtcH18JHt0aW1lU3RhbXBTdHJ9fFNlbGx8JHtjdXJDb2lufXxYTVJ8QXJiUmF0aW86JHtBcmJSYXRpb318JHtzaG93TWF4fWApO1xuICAgIGlmIChBcmJSYXRpbyA+IHRocmVzaG9sZCkge1xuICAgICAgbGV0IGluc3RydWN0aW9ucyA9IGBBTEVSVDogU2VsbCAke0FtdEluaXR9ICR7Y3VyQ29pbn0gZm9yICR7QW10SW5pdCpiYXNlTWFya2V0X2N1ckNvaW5CaWR9IFhNUiwgXG4gICAgICAgIHRoZW4gc2VsbCB0aG9zZSBYTVIgZm9yICR7QW10SW5pdCpCVENfYmFzZU1hcmtldEJpZCpiYXNlTWFya2V0X2N1ckNvaW5CaWR9IEJUQyxcbiAgICAgICAgdGhlbiB1c2UgdGhvc2UgQlRDIHRvIGJ1eSAke0FtdEZpbmFsfSAke2N1ckNvaW59YDtcbiAgICAgIGNvbnNvbGUubG9nKGluc3RydWN0aW9ucyk7XG4gICAgfVxuICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcnVuUG9sb0NvaW5iYXNlQ29tcGFyZSgpIHtcbiAgbGV0IHBvbG9uaWV4RGF0YSA9IGF3YWl0IGdldEV4Y2hhbmdlRGF0YShwb2xvbmlleFVSTCk7XG4gIGxldCBjb2luYmFzZURhdGFaRUMgPSBhd2FpdCBnZXRFeGNoYW5nZURhdGEoY29pbmJhc2VVUkwrXCIvWkVDLVVTREMvYm9va1wiKTtcbiAgbGV0IGNvaW5iYXNlRGF0YUVUSCA9IGF3YWl0IGdldEV4Y2hhbmdlRGF0YShjb2luYmFzZVVSTCtcIi9FVEgtVVNEQy9ib29rXCIpO1xuICBsZXQgY29pbmJhc2VEYXRhQlRDID0gYXdhaXQgZ2V0RXhjaGFuZ2VEYXRhKGNvaW5iYXNlVVJMK1wiL0JUQy1VU0RDL2Jvb2tcIik7XG4gIGNvbXBhcmVQb2xvbmlleENvaW5iYXNlKHBvbG9uaWV4RGF0YSwgY29pbmJhc2VEYXRhWkVDLCBcIlpFQ1wiKTtcbiAgY29tcGFyZVBvbG9uaWV4Q29pbmJhc2UocG9sb25pZXhEYXRhLCBjb2luYmFzZURhdGFFVEgsIFwiRVRIXCIpO1xuICBjb21wYXJlUG9sb25pZXhDb2luYmFzZShwb2xvbmlleERhdGEsIGNvaW5iYXNlRGF0YUJUQywgXCJCVENcIik7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJ1blBvbG9CaXR0cmV4Q29tcGFyZSgpIHtcblxuICBudW1iZXJPZkNoZWNrcysrO1xuICAvLyBQb2xvbmlleCBzZWN0aW9uIC0gQWxsIGNvaW5zIGZyb20gb25lIHJlcXVlc3RcbiAgbGV0IHBvbG9uaWV4RGF0YSA9IGF3YWl0IGdldEV4Y2hhbmdlRGF0YShwb2xvbmlleFVSTCk7XG4gIC8vIEJpdHRyZXggc2VjdGlvbiAtIEFsbCBjb2lucyBmcm9tIG9uZSByZXF1ZXN0LlxuICAvLyBCaXR0cmV4IG1hcmtldCBzdW1tYXJ5IC0gQWxsIGNvaW5zIGZyb20gb25lIHJlcXVlc3QuXG4gIGxldCBiaXR0cmV4QUxMID0gYXdhaXQgZ2V0RXhjaGFuZ2VEYXRhKGJpdHRyZXhVUkxBbGwpO1xuICBsZXQgYml0dHJleEpTT04gPSBKU09OLnBhcnNlKGJpdHRyZXhBTEwuZXhjaGFuZ2VEYXRhKTtcbiAgbGV0IGJpdHRyZXhCVENDb2lucyA9IHtcbiAgICBCVEM6IFtcImFyZHJcIiwgXCJiYXRcIiwgXCJibnRcIiwgXCJidXJzdFwiLCBcImN2Y1wiLCBcImRhc2hcIiwgXCJkY3JcIiwgXCJkZ2JcIiwgXCJkb2dlXCIsIFwiZXRjXCIsIFxuICAgIFwiZXRoXCIsIFwiZmN0XCIsIFwiZ2FtZVwiLCBcImdudFwiLCBcImxiY1wiLCBcImxvb21cIiwgXCJsc2tcIiwgXCJsdGNcIiwgXCJtYW5hXCIsIFwibmF2XCIsIFxuICAgIFwibm1yXCIsIFwibnh0XCIsIFwib21nXCIsIFwicG9seVwiLCBcInBwY1wiLCBcInF0dW1cIiwgXCJyZXBcIiwgXCJzYmRcIiwgXCJzY1wiLCBcInNudFwiLCBcbiAgICBcInN0ZWVtXCIsIFwic3RvcmpcIiwgXCJzdHJhdFwiLCBcInN5c1wiLCBcInZpYVwiLCBcInZ0Y1wiLCBcInhjcFwiLCBcInhlbVwiLCBcInhsbVwiLCBcInhtclwiLCBcbiAgICBcInhycFwiLCBcInplY1wiLCBcInpyeFwiXSxcbiAgICBFVEg6IFtcIkJBVFwiLCBcIkJOVFwiLCBcIkNWQ1wiLCBcIkVUQ1wiLCBcIkdOVFwiLCBcIk1BTkFcIiwgXCJPTUdcIiwgXCJRVFVNXCIsIFxuICAgICAgXCJSRVBcIiwgXCJTTlRcIiwgXCJaRUNcIiwgXCJaUlhcIl0sXG4gICAgVVNEVDogW1wiQkFUXCIsIFwiQlRDXCIsIFwiREFTSFwiLCBcIkRPR0VcIiwgXCJMVENcIiwgXCJYTVJcIiwgXCJYUlBcIl1cblxuICB9O1xuICBsZXQgYmFzZU1hcmtldHMgPSBbXCJCVENcIiwgXCJFVEhcIiwgXCJVU0RUXCJdO1xuICBiYXNlTWFya2V0cy5mb3JFYWNoKGJhc2VNa3QgPT4ge1xuICAgIGNvbnNvbGUubG9nKFwiUHJvY2Vzc2luZyBiYXNlbWt0OlwiLCBiYXNlTWt0KTtcbiAgICBsZXQgYml0dHJleFRyaW1tZWQgPSB7fTtcbiAgICBiaXR0cmV4SlNPTi5yZXN1bHQuZm9yRWFjaChtYXJrZXQgPT4ge1xuICAgICAgYml0dHJleEJUQ0NvaW5zW2Jhc2VNa3RdLmZvckVhY2goY29pbiA9PiB7XG4gICAgICAgIGxldCBNYXJrZXROYW1lID0gYmFzZU1rdCtcIi1cIitjb2luLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgIC8vY29uc29sZS5sb2coXCJNYXJrZXROYW1lOlwiLCBNYXJrZXROYW1lKTtcbiAgICAgICAgaWYgKG1hcmtldC5NYXJrZXROYW1lPT09TWFya2V0TmFtZSkge1xuICAgICAgICAgIGJpdHRyZXhUcmltbWVkW01hcmtldE5hbWVdID0gbWFya2V0O1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBsZXQgYml0dHJleENvbXBhcmUgPSB7fTtcbiAgICBiaXR0cmV4Q29tcGFyZS50aW1lU3RhbXAgPSBiaXR0cmV4QUxMLnRpbWVTdGFtcDtcbiAgICBiaXR0cmV4Q29tcGFyZS5leGNoYW5nZURhdGEgPSBiaXR0cmV4VHJpbW1lZDtcbiAgICBjb21wYXJlQWxsUG9sb25pZXhCaXR0cmV4KHBvbG9uaWV4RGF0YSwgYml0dHJleENvbXBhcmUpO1xuICB9KTtcbiAgY29uc29sZS5sb2coYENvbXBhcmUgY3ljbGUgJHtudW1iZXJPZkNoZWNrc30gY29tcGxldGUuYClcbn1cblxuXG5hc3luYyBmdW5jdGlvbiBydW5Qb2xvSGl0YnRjQ29tcGFyZSgpIHtcblxuICBudW1iZXJPZkNoZWNrcysrO1xuICAvLyBQb2xvbmlleCBzZWN0aW9uIC0gQWxsIGNvaW5zIGZyb20gb25lIHJlcXVlc3RcbiAgbGV0IHBvbG9uaWV4RGF0YSA9IGF3YWl0IGdldEV4Y2hhbmdlRGF0YShwb2xvbmlleFVSTCk7XG4gIC8vIEJpdHRyZXggc2VjdGlvbiAtIEFsbCBjb2lucyBmcm9tIG9uZSByZXF1ZXN0LlxuICAvLyBCaXR0cmV4IG1hcmtldCBzdW1tYXJ5IC0gQWxsIGNvaW5zIGZyb20gb25lIHJlcXVlc3QuXG4gIGxldCBoaXRidGNEYXRhID0gYXdhaXQgZ2V0RXhjaGFuZ2VEYXRhKGhpdGJ0Y1VSTCk7ICBcbiAgbGV0IGhpdGJ0Y0pTT04gPSBKU09OLnBhcnNlKGhpdGJ0Y0RhdGEuZXhjaGFuZ2VEYXRhKTtcbiAgbGV0IGhpdGJ0Y01hcmtldHMgPSBbXG4gICAgXCJCQ05CVENcIiwgXCJCTlRVU0RUXCIsIFwiREFTSEJUQ1wiLCBcIkRBU0hVU0RUXCIsIFwiREdCQlRDXCIsIFwiRE9HRUJUQ1wiLCBcbiAgICBcIkRPR0VVU0RUXCIsIFwiRU9TQlRDXCIsIFwiRU9TVVNEVFwiLCBcIkVUQ1VTRFRcIiwgXCJFVEhCVENcIiwgXG4gICAgXCJFVEhVU0RUXCIsIFwiTFNLQlRDXCIsXCJNQUlEQlRDXCIsXG4gICAgXCJNQU5BQlRDXCIsIFwiT01HQlRDXCIsIFwiUFBDQlRDXCIsIFwiUVRVTVBQQ1wiLCBcIlJFUEJUQ1wiLCBcbiAgICBcIlJFUFVTRFRcIiwgXCJYRU1CVENcIiwgXCJaRUNFVEhcIiBcbiAgXTtcblxuICBsZXQgaGl0YnRjVHJpbW1lZCA9IHt9O1xuICBoaXRidGNNYXJrZXRzLmZvckVhY2gobWFya2V0ID0+IHtcbiAgICBoaXRidGNKU09OLmZvckVhY2goZXhjaGFuZ2VEYXRhID0+IHtcbiAgICAgIGlmKGV4Y2hhbmdlRGF0YS5zeW1ib2w9PT1tYXJrZXQpXG4gICAgICAgIGhpdGJ0Y1RyaW1tZWRbbWFya2V0XSA9IGV4Y2hhbmdlRGF0YTtcbiAgICB9KTsgICAgIFxuICB9KTtcbiAgbGV0IGhpdGJ0Y0NvbXBhcmUgPSB7fTtcbiAgaGl0YnRjQ29tcGFyZS50aW1lU3RhbXAgPSBoaXRidGNEYXRhLnRpbWVTdGFtcDtcbiAgaGl0YnRjQ29tcGFyZS5leGNoYW5nZURhdGEgPSBoaXRidGNUcmltbWVkO1xuICBjb21wYXJlQWxsUG9sb25pZXhIaXRidGMocG9sb25pZXhEYXRhLCBoaXRidGNDb21wYXJlKTtcbn1cblxuXG5hc3luYyBmdW5jdGlvbiBydW5Qb2xvWW9iaXRDb21wYXJlKCkge1xuXG4gIG51bWJlck9mQ2hlY2tzKys7XG4gIC8vIFBvbG9uaWV4IHNlY3Rpb24gLSBBbGwgY29pbnMgZnJvbSBvbmUgcmVxdWVzdFxuICBsZXQgcG9sb25pZXhEYXRhID0gYXdhaXQgZ2V0RXhjaGFuZ2VEYXRhKHBvbG9uaWV4VVJMKTtcbiAgLy8gQml0dHJleCBzZWN0aW9uIC0gQWxsIGNvaW5zIGZyb20gb25lIHJlcXVlc3QuXG4gIC8vIEJpdHRyZXggbWFya2V0IHN1bW1hcnkgLSBBbGwgY29pbnMgZnJvbSBvbmUgcmVxdWVzdC5cbiAgbGV0IHlvYml0TWFya2V0cyA9IFtcbiAgICBcImx0Y19idGNcIiwgXCJldGhfYnRjXCJcbiAgXTtcbiAgbGV0IHRpY2tlckxpc3QgPSBcIlwiO1xuICBmb3IobGV0IGk9MDsgaTx5b2JpdE1hcmtldHMubGVuZ3RoOyBpKyspIHtcbiAgICB0aWNrZXJMaXN0ICs9IHlvYml0TWFya2V0c1tpXTtcbiAgICBpZiAoaSE9eW9iaXRNYXJrZXRzLmxlbmd0aC0xKVxuICAgICAgdGlja2VyTGlzdCArPSBcIi1cIjtcbiAgfVxuICBsZXQgeW9iaXRVUkwgPSB5b2JpdEJhc2VVUkwgKyB0aWNrZXJMaXN0O1xuICBjb25zb2xlLmxvZyhcIlJ1biBxdWVyeSBmb3IgZGF0YSBhdDpcIiwgeW9iaXRVUkwpO1xuICBsZXQgeW9iaXREYXRhID0gYXdhaXQgZ2V0RXhjaGFuZ2VEYXRhKHlvYml0VVJMKTsgIFxuICBjb25zb2xlLmxvZyhcInlvYml0RGF0YTpcIiwgeW9iaXREYXRhKTtcbiAgY29tcGFyZUFsbFBvbG9uaWV4WW9iaXQocG9sb25pZXhEYXRhLCB5b2JpdERhdGEpO1xufVxuXG5cbi8vIFNldCB0aGUgZGVmYXVsdCBjb3BhcmUgdG8gcnVuLlxubGV0IGNvbXBhcmVUb1J1biA9ICBydW5Qb2xvQml0dHJleENvbXBhcmU7XG5pZiAocHJvY2Vzcy5hcmd2Lmxlbmd0aD49Mykge1xuICBpZiAocHJvY2Vzcy5hcmd2WzJdPT09XCJwb2xvaW50ZXJuYWxcIikge1xuICAgIGNvbnNvbGUubG9nKGBSdW5uaW5nIHBvbG9pbnRlcm5hbCBjb21wYXJlLmApO1xuICAgIGNvbXBhcmVUb1J1biA9IHBvbG9JbnRlcm5hbENvbXBhcmU7XG4gIH1cbiAgZWxzZSB7XG4gICAgaWYgKHByb2Nlc3MuYXJndlsyXT09PVwicG9sb2NvaW5iYXNlXCIpIHtcbiAgICAgIGNvbXBhcmVUb1J1biA9IHJ1blBvbG9Db2luYmFzZUNvbXBhcmU7XG4gICAgICBjb25zb2xlLmxvZyhcIlJ1bm5pbmcgUG9sb0NvaW5iYXNlQ29tcGFyZS5cIik7XG4gICAgfVxuICAgIGVsc2UgaWYgKHByb2Nlc3MuYXJndlsyXT09PVwicG9sb2hpdGJ0Y1wiKSB7XG4gICAgICBjb21wYXJlVG9SdW4gPSBydW5Qb2xvSGl0YnRjQ29tcGFyZTtcbiAgICAgIGNvbnNvbGUubG9nKFwiUnVubmluZyBQb2xvSGl0YnRjQ29tcGFyZS5cIilcbiAgICB9XG4gICAgZWxzZSBpZiAocHJvY2Vzcy5hcmd2WzJdPT09XCJwb2xveW9iaXRcIikge1xuICAgICAgY29tcGFyZVRvUnVuID0gcnVuUG9sb1lvYml0Q29tcGFyZTtcbiAgICAgIGNvbnNvbGUubG9nKFwiUnVubmluZyBydW5Qb2xvWW9iaXRDb21wYXJlLlwiKVxuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgY29uc29sZS5sb2coXCJSdW5uaW5nIGRlZmF1bHQgcG9sbyBiaXR0cmV4IGNvbXBhcmUuXCIpO1xuICAgIH1cbiAgfVxufVxubGV0IG5ld0ludGVyYWwgPSAxMDAwKih0aW1lSW5TZWNvbmRzQmV0d2VlblByaWNlQ2hlY2tzICsgMjAqTWF0aC5yYW5kb20oKSk7XG5jb25zb2xlLmxvZyhgU2V0dGluZyB0aGUgdGltZXIgaW50ZXJ2YWwgdG8gJHtuZXdJbnRlcmFsLzEwMDB9IHNlY29uZHMuYCApO1xuY29tcGFyZVRvUnVuKCk7XG5pbnRlcnZhbEhhbmRlbCA9IHNldEludGVydmFsKGNvbXBhcmVUb1J1biwgbmV3SW50ZXJhbCk7XG4iXX0=