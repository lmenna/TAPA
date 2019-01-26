"use strict";

var _getCryptoData = require("./utils/getCryptoData");

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
}
/* runYobitInternalCompare
 * desc: Checks intenral prices for the Yobit exchange to see if any cases exist with
 *       the Arb Factor is greater than one.
 */


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

function runYobitInternalCompare() {
  numberOfChecks++;
  var yobitMarkets = ["zec", "lsk", "etc", "ltc", "fto", "edr2", "lbr", "ban", "kin", "nbt", "rntb", "bunny", "trx", "kbc", "vrtm", "hur", "noah", "xrp", "doge", "edit", "evn", "exmr", "payp", "yozi", "waves", "nyc", "dgb", "dux", "dash"];
  var baseMarkets = ["btc", "eth"];
  runYobitBaseMktCompare(baseMarkets, yobitMarkets);
}

function runYobitBaseMktCompare(_x, _x2) {
  return _runYobitBaseMktCompare.apply(this, arguments);
} // Set the default copare to run.


function _runYobitBaseMktCompare() {
  _runYobitBaseMktCompare = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee5(baseMarkets, yobitMarkets) {
    var tickerListStr, i, yobitMkt, mktData;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            // Yobit accepts multiple tickers in the URL using a dash seperated format.
            // Ex. https://yobit.net/api/3/ticker/eth_btc-zec_btc-zec_eth
            //
            // Will return data in the format,
            //
            // {"eth_btc":
            //    {"high":0.03309,"low":0.03235388,"avg":0.03272194,"vol":1008.06706066,"vol_cur":30640.27824728,"last":0.03286274,"buy":0.03278187,"sell":0.03291259,"updated":1548167171},
            //  "zec_btc":
            //    {"high":0.01471407,"low":0.0144448,"avg":0.01457943,"vol":866.12370712,"vol_cur":59191.16379133,"last":0.01459557,"buy":0.01453871,"sell":0.01464882,"updated":1548167168},
            //  "zec_eth":
            //    {"high":0.44859239,"low":0.43719904,"avg":0.44289571,"vol":3.47843354,"vol_cur":7.77771142,"last":0.44859239,"buy":0.44008596,"sell":0.44859238,"updated":1548166052}
            // }
            // Create ticker list in format Yobit will accept.
            tickerListStr = "";

            for (i = 0; i < yobitMarkets.length; i++) {
              tickerListStr += yobitMarkets[i] + "_" + baseMarkets[0] + "-";
              tickerListStr += yobitMarkets[i] + "_" + baseMarkets[1];
              if (i != yobitMarkets.length - 1) tickerListStr += "-";else tickerListStr += "-" + baseMarkets[1] + "_" + baseMarkets[0];
            }

            _context5.next = 4;
            return (0, _getCryptoData.getExchangeData)(yobitBaseURL + tickerListStr);

          case 4:
            yobitMkt = _context5.sent;

            try {
              mktData = JSON.parse(yobitMkt.exchangeData); // Analyze Yobit market looking for price anomolies

              (0, _comparePricingData.internalCompareForYobit)(mktData, yobitMarkets, baseMarkets);
            } catch (e) {
              console.log("Invalid market data returned from:", yobitBaseURL);
              console.log("Data object returned:", yobitMkt);
            }

          case 6:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5, this);
  }));
  return _runYobitBaseMktCompare.apply(this, arguments);
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
    } else if (process.argv[2] === "yobitinternal") {
      compareToRun = runYobitInternalCompare;
    } else {
      console.log("Running default polo bittrex compare.");
    }
  }
}

var newInteral = 1000 * (timeInSecondsBetweenPriceChecks + 20 * Math.random());
console.log("Setting the timer interval to ".concat(newInteral / 1000, " seconds."));
compareToRun();
intervalHandel = setInterval(compareToRun, newInteral);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcHAudHMiXSwibmFtZXMiOlsicmVxdWlyZSIsIlhNTEh0dHBSZXF1ZXN0IiwicG9sb25pZXhVUkwiLCJjb2luYmFzZVVSTCIsImJpdHRyZXhVUkxBbGwiLCJoaXRidGNVUkwiLCJ5b2JpdEJhc2VVUkwiLCJ0aHJlc2hvbGQiLCJudW1iZXJPZkNoZWNrcyIsImludGVydmFsSGFuZGVsIiwibWF4QnV5QXJiIiwibWF4U2VsbEFyYiIsIm1heFNlbGxBcmJFVEgiLCJtYXhTZWxsQXJiWE1SIiwidGltZUluU2Vjb25kc0JldHdlZW5QcmljZUNoZWNrcyIsInBvbG9JbnRlcm5hbENvbXBhcmUiLCJjb25zb2xlIiwibG9nIiwieG1saHR0cCIsIm1ldGhvZCIsInVybCIsIm9wZW4iLCJvbmVycm9yIiwib25yZWFkeXN0YXRlY2hhbmdlIiwicmVhZHlTdGF0ZSIsInN0YXR1cyIsImV4Y2hhbmdlRGF0YSIsInJlc3BvbnNlVGV4dCIsInRpbWVTdGFtcCIsIkRhdGUiLCJleGNoYW5nZU9iamVjdCIsIkpTT04iLCJwYXJzZSIsImNvaW5zIiwiYmFzZVN0YWJsZUNvaW4iLCJhbmFseXplUG9sb0JUQ1ByaWNlcyIsImFuYWx5emVQb2xvRVRIUHJpY2VzIiwiYW5hbHl6ZVBvbG9YTVJQcmljZXMiLCJzZW5kIiwiZXhjaGFuZ2VQcmljZXMiLCJ0aW1lU3RhbXBTdHIiLCJnZXRUaW1lIiwiZm9yRWFjaCIsImN1ckNvaW4iLCJsb3dlc3RBc2tCVEMiLCJsb3dlc3RBc2siLCJoaWdoZXN0QmlkVVNEQyIsImhpZ2hlc3RCaWQiLCJVU0RDX0JUQ2xvd2VzdEFzayIsIkFyYlJhdGlvIiwic2hvd01heCIsIkJUQ19jdXJDb2luQmlkIiwiVVNEQ19CVENCaWQiLCJVU0RDX2N1ckNvaW5Bc2siLCJBbXRJbml0IiwiQW10RmluYWwiLCJFVEhfY3VyQ29pbkJpZCIsIkJUQ19FVEhCaWQiLCJCVENfY3VyQ29pbkFzayIsImluc3RydWN0aW9ucyIsImJhc2VNYXJrZXQiLCJiYXNlTWFya2V0X2N1ckNvaW5CaWQiLCJCVENfYmFzZU1hcmtldEJpZCIsInJ1blBvbG9Db2luYmFzZUNvbXBhcmUiLCJwb2xvbmlleERhdGEiLCJjb2luYmFzZURhdGFaRUMiLCJjb2luYmFzZURhdGFFVEgiLCJjb2luYmFzZURhdGFCVEMiLCJydW5Qb2xvQml0dHJleENvbXBhcmUiLCJiaXR0cmV4QUxMIiwiYml0dHJleEpTT04iLCJiaXR0cmV4QlRDQ29pbnMiLCJCVEMiLCJFVEgiLCJVU0RUIiwiYmFzZU1hcmtldHMiLCJiYXNlTWt0IiwiYml0dHJleFRyaW1tZWQiLCJyZXN1bHQiLCJtYXJrZXQiLCJjb2luIiwiTWFya2V0TmFtZSIsInRvVXBwZXJDYXNlIiwiYml0dHJleENvbXBhcmUiLCJydW5Qb2xvSGl0YnRjQ29tcGFyZSIsImhpdGJ0Y0RhdGEiLCJoaXRidGNKU09OIiwiaGl0YnRjTWFya2V0cyIsImhpdGJ0Y1RyaW1tZWQiLCJzeW1ib2wiLCJoaXRidGNDb21wYXJlIiwicnVuUG9sb1lvYml0Q29tcGFyZSIsInlvYml0TWFya2V0cyIsInRpY2tlckxpc3QiLCJpIiwibGVuZ3RoIiwieW9iaXRVUkwiLCJ5b2JpdERhdGEiLCJydW5Zb2JpdEludGVybmFsQ29tcGFyZSIsInJ1bllvYml0QmFzZU1rdENvbXBhcmUiLCJ0aWNrZXJMaXN0U3RyIiwieW9iaXRNa3QiLCJta3REYXRhIiwiZSIsImNvbXBhcmVUb1J1biIsInByb2Nlc3MiLCJhcmd2IiwibmV3SW50ZXJhbCIsIk1hdGgiLCJyYW5kb20iLCJzZXRJbnRlcnZhbCJdLCJtYXBwaW5ncyI6Ijs7QUFFQTs7QUFDQTs7Ozs7O0FBSEFBLE9BQU8sQ0FBQyxpQkFBRCxDQUFQOztBQU1BLElBQUlDLGNBQWMsR0FBR0QsT0FBTyxDQUFDLGdCQUFELENBQVAsQ0FBMEJDLGNBQS9DOztBQUVBLElBQU1DLFdBQVcsR0FBRyxrREFBcEI7QUFDQSxJQUFNQyxXQUFXLEdBQUcsdUNBQXBCO0FBQ0EsSUFBTUMsYUFBYSxHQUFHLHdEQUF0QjtBQUNBLElBQU1D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QUFJMEYsT0FBTyxDQUFDQyxJQUFSLENBQWEsQ0FBYixNQUFrQixjQUF0QixFQUFzQztBQUNwQ0YsTUFBQUEsWUFBWSxHQUFHekMsc0JBQWY7QUFDQS9DLE1BQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLDhCQUFaO0FBQ0QsS0FIRCxNQUlLLElBQUl3RixPQUFPLENBQUNDLElBQVIsQ0FBYSxDQUFiLE1BQWtCLFlBQXRCLEVBQW9DO0FBQ3ZDRixNQUFBQSxZQUFZLEdBQUdwQixvQkFBZjtBQUNBcEUsTUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksNEJBQVo7QUFDRCxLQUhJLE1BSUEsSUFBSXdGLE9BQU8sQ0FBQ0MsSUFBUixDQUFhLENBQWIsTUFBa0IsV0FBdEIsRUFBbUM7QUFDdENGLE1BQUFBLFlBQVksR0FBR2IsbUJBQWY7QUFDQTNFLE1BQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLDhCQUFaO0FBQ0QsS0FISSxNQUlBLElBQUl3RixPQUFPLENBQUNDLElBQVIsQ0FBYSxDQUFiLE1BQWtCLGVBQXRCLEVBQXVDO0FBQzFDRixNQUFBQSxZQUFZLEdBQUdOLHVCQUFmO0FBQ0QsS0FGSSxNQUlMO0FBQ0VsRixNQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSx1Q0FBWjtBQUNEO0FBQ0Y7QUFDRjs7QUFDRCxJQUFJMEYsVUFBVSxHQUFHLFFBQU03RiwrQkFBK0IsR0FBRyxLQUFHOEYsSUFBSSxDQUFDQyxNQUFMLEVBQTNDLENBQWpCO0FBQ0E3RixPQUFPLENBQUNDLEdBQVIseUNBQTZDMEYsVUFBVSxHQUFDLElBQXhEO0FBQ0FILFlBQVk7QUFDWi9GLGNBQWMsR0FBR3FHLFdBQVcsQ0FBQ04sWUFBRCxFQUFlRyxVQUFmLENBQTVCIiwic291cmNlc0NvbnRlbnQiOlsicmVxdWlyZShcIkBiYWJlbC9wb2x5ZmlsbFwiKTtcblxuaW1wb3J0IHtnZXRFeGNoYW5nZURhdGF9IGZyb20gXCIuL3V0aWxzL2dldENyeXB0b0RhdGFcIjtcbmltcG9ydCB7Y29tcGFyZVBvbG9uaWV4Q29pbmJhc2UsIGNvbXBhcmVBbGxQb2xvbmlleEJpdHRyZXgsIGNvbXBhcmVBbGxQb2xvbmlleEhpdGJ0YyxcbiAgY29tcGFyZUFsbFBvbG9uaWV4WW9iaXQsIGludGVybmFsQ29tcGFyZUZvcllvYml0fSBmcm9tIFwiLi91dGlscy9jb21wYXJlUHJpY2luZ0RhdGFcIjtcblxubGV0IFhNTEh0dHBSZXF1ZXN0ID0gcmVxdWlyZShcInhtbGh0dHByZXF1ZXN0XCIpLlhNTEh0dHBSZXF1ZXN0O1xuXG5jb25zdCBwb2xvbmlleFVSTCA9IFwiaHR0cHM6Ly9wb2xvbmlleC5jb20vcHVibGljP2NvbW1hbmQ9cmV0dXJuVGlja2VyXCI7IFxuY29uc3QgY29pbmJhc2VVUkwgPSBcImh0dHBzOi8vYXBpLnByby5jb2luYmFzZS5jb20vcHJvZHVjdHNcIjsgXG5jb25zdCBiaXR0cmV4VVJMQWxsID0gXCJodHRwczovL2JpdHRyZXguY29tL2FwaS92MS4xL3B1YmxpYy9nZXRtYXJrZXRzdW1tYXJpZXNcIjtcbmNvbnN0IGhpdGJ0Y1VSTCA9IFwiaHR0cHM6Ly9hcGkuaGl0YnRjLmNvbS9hcGkvMi9wdWJsaWMvdGlja2VyXCI7XG5jb25zdCB5b2JpdEJhc2VVUkwgPSBcImh0dHBzOi8veW9iaXQubmV0L2FwaS8zL3RpY2tlci9cIlxuY29uc3QgdGhyZXNob2xkID0gMS4wMTtcbmxldCBudW1iZXJPZkNoZWNrcyA9IDA7XG5sZXQgaW50ZXJ2YWxIYW5kZWwgPSAtMTtcbmxldCBtYXhCdXlBcmIgPSAwO1xubGV0IG1heFNlbGxBcmIgPSAwO1xubGV0IG1heFNlbGxBcmJFVEggPSAwO1xubGV0IG1heFNlbGxBcmJYTVIgPSAwO1xuXG5jb25zdCB0aW1lSW5TZWNvbmRzQmV0d2VlblByaWNlQ2hlY2tzID0gMTU7XG5cbi8qIHBvbG9JbnRlcm5hbENvbXBhcmVcbiAqIGRlc2M6IExvb2tzIGZvciBhcmJpdHJhZ2UgcHJvZml0cyBmcm9tIHNjZW5hcmlvcyB3aGVyZSBhIGNvaW4xIGlzIGV4Y2hhbmdlZCBmb3IgY29pbjIsIGNvaW4yIGV4Y2hhbmdlZCBmb3IgY29pbjMgYW5kIHRoZW4gXG4gKiAgICAgICBjb2luMyBleGNoYW5nZWQgYmFjayBpbnRvIGNvaW4xLlxuICogICAgICAgVGhpcyBjb21wYXJlIGxvb2tzIG9ubHkgd2l0aGluIHRoZSBQb2xvbmlleCBleGNoYW5nZS5cbiovXG5mdW5jdGlvbiBwb2xvSW50ZXJuYWxDb21wYXJlKCkge1xuXG4gIGNvbnNvbGUubG9nKFwiQkVHSU46IHBvbG9JbnRlcm5hbENvbXBhcmVcIik7XG4gIGxldCB4bWxodHRwID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCksXG4gICAgbWV0aG9kID0gXCJHRVRcIixcbiAgICB1cmwgPSBwb2xvbmlleFVSTDtcblxuICBjb25zb2xlLmxvZyhcIkxvYWRpbmcgZGF0YSBmcm9tIDogSHR0cC5zZW5kKFwiLCB1cmwsIFwiKVwiKTtcbiAgeG1saHR0cC5vcGVuKG1ldGhvZCwgdXJsLCB0cnVlKTtcbiAgeG1saHR0cC5vbmVycm9yID0gZnVuY3Rpb24gKCkge1xuICAgIGNvbnNvbGUubG9nKFwiKiogQW4gZXJyb3Igb2NjdXJyZWQgZHVyaW5nIHRoZSB0cmFuc2FjdGlvblwiKTtcbiAgfTtcbiAgeG1saHR0cC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5yZWFkeVN0YXRlPT09NCAmJiB0aGlzLnN0YXR1cz09PTIwMCkge1xuICAgICAgbGV0IGV4Y2hhbmdlRGF0YSA9IHhtbGh0dHAucmVzcG9uc2VUZXh0O1xuICAgICAgbnVtYmVyT2ZDaGVja3MrKztcbiAgICAgIGxldCB0aW1lU3RhbXAgPSBuZXcgRGF0ZSgpO1xuICAgICAgbGV0IGV4Y2hhbmdlT2JqZWN0ID0gSlNPTi5wYXJzZShleGNoYW5nZURhdGEpO1xuICAgICAgbGV0IGNvaW5zID0gW1wiRk9BTVwiLCBcIlpFQ1wiLCBcIkxUQ1wiLCBcIkVUSFwiLCBcIlhSUFwiLCBcIlNUUlwiLCBcIlhNUlwiLCBcIkRPR0VcIiwgXCJCQ0hBQkNcIiwgXCJCQ0hTVlwiXTtcbiAgICAgIGxldCBiYXNlU3RhYmxlQ29pbiA9IFwiVVNEQ1wiO1xuICAgICAgYW5hbHl6ZVBvbG9CVENQcmljZXMoZXhjaGFuZ2VPYmplY3QsIGJhc2VTdGFibGVDb2luLCBjb2lucywgdGltZVN0YW1wKTtcbiAgICAgIGNvaW5zID0gW1wiQkFUXCIsIFwiQk5UXCIsIFwiREFTSFwiLCBcIkRPR0VcIiwgXCJFT1NcIiwgXCJFVENcIiwgXCJFVEhcIiwgXCJHTlRcIiwgXCJLTkNcIiwgXCJMT09NXCIsIFwiTFNLXCIsXG4gICAgICAgIFwiTFRDXCIsIFwiTUFOQVwiLCBcIk5YVFwiLCBcIlFUVU1cIiwgXCJSRVBcIiwgXCJTQ1wiLCBcIlNOVFwiLCBcIlNUUlwiLCBcIlhNUlwiLCBcIlhSUFwiLCBcIlpFQ1wiLCBcIlpSWFwiXTtcbiAgICAgIGJhc2VTdGFibGVDb2luID0gXCJVU0RUXCI7IFxuICAgICAgYW5hbHl6ZVBvbG9CVENQcmljZXMoZXhjaGFuZ2VPYmplY3QsIGJhc2VTdGFibGVDb2luLCBjb2lucywgdGltZVN0YW1wKTtcbiAgICAgIGFuYWx5emVQb2xvRVRIUHJpY2VzKGV4Y2hhbmdlT2JqZWN0LCB0aW1lU3RhbXApO1xuICAgICAgYW5hbHl6ZVBvbG9YTVJQcmljZXMoZXhjaGFuZ2VPYmplY3QsIHRpbWVTdGFtcCk7XG4gICAgfVxuICB9XG4gIHhtbGh0dHAuc2VuZCgpO1xuICBjb25zb2xlLmxvZyhcIkVORDogcG9sb0ludGVybmFsQ29tcGFyZVwiKTtcbn1cblxuLyogYW5hbHl6ZVBvbG9CVENQcmljZXNcbiAqIGRlc2M6IFRha2VzIHRoZSBleGNoYW5nZSBwcmljZXMgZnJvbSBQb2xvbmlleCBhbmQgZG9lcyB0aGUgZGV0YWlsZWQgY29tcGFyZXMgdG8gZmluZCBhcmJpdHJhZ2VcbiAqICAgICAgIHdpdGhpbiB0aGlzIGV4Y2hhbmdlLiAgSXQgZG9lcyB0aGlzIGZvciB0aGUgQlRDIG1hcmtldC5cbiAqL1xuZnVuY3Rpb24gYW5hbHl6ZVBvbG9CVENQcmljZXMoZXhjaGFuZ2VQcmljZXM6IGFueSwgYmFzZVN0YWJsZUNvaW46IFxuICBzdHJpbmcsIGNvaW5zOiBBcnJheTxzdHJpbmc+LCB0aW1lU3RhbXA6IERhdGUpIHtcblxuICBsZXQgdGltZVN0YW1wU3RyID0gdGltZVN0YW1wLmdldFRpbWUoKTtcbiAgY29uc29sZS5sb2coYHByaWNlQ2hlY2tDb3VudDoke251bWJlck9mQ2hlY2tzfXwke2Jhc2VTdGFibGVDb2lufXxtYXhCdXlBcmI6JHttYXhCdXlBcmJ9fG1heFNlbGxBcmI6JHttYXhTZWxsQXJifWApO1xuICAvLyBDaGVjayBpZiBidXlpbmcgdGhlIGNvaW4gd2lsbCBiZSBwcm9maXRhYmxlLlxuICBjb2lucy5mb3JFYWNoKGN1ckNvaW4gPT4ge1xuICAgIGxldCBsb3dlc3RBc2tCVEMgPSBleGNoYW5nZVByaWNlc1tcIkJUQ19cIiArIGN1ckNvaW5dLmxvd2VzdEFzaztcbiAgICBsZXQgaGlnaGVzdEJpZFVTREMgPSBleGNoYW5nZVByaWNlc1tiYXNlU3RhYmxlQ29pbiArIFwiX1wiICsgY3VyQ29pbl0uaGlnaGVzdEJpZDtcbiAgICBsZXQgVVNEQ19CVENsb3dlc3RBc2sgPSBleGNoYW5nZVByaWNlc1tiYXNlU3RhYmxlQ29pbiArIFwiX1wiICsgXCJCVENcIl0ubG93ZXN0QXNrO1xuICAgIGxldCBBcmJSYXRpbyA9IGhpZ2hlc3RCaWRVU0RDIC8gKCBsb3dlc3RBc2tCVEMgKiAgVVNEQ19CVENsb3dlc3RBc2spO1xuICAgIGxldCBzaG93TWF4ID0gXCJcIjtcbiAgICBpZiAoQXJiUmF0aW8+bWF4QnV5QXJiKSB7XG4gICAgICBtYXhCdXlBcmIgPSBBcmJSYXRpbztcbiAgICAgIHNob3dNYXggPSBcIk5ld01heFwiO1xuICAgIH1cbiAgICBpZiAoQXJiUmF0aW8+MS4wKVxuICAgICAgY29uc29sZS5sb2coYFJFQ3wke3RpbWVTdGFtcH18JHt0aW1lU3RhbXBTdHJ9fEJ1eXwke2Jhc2VTdGFibGVDb2lufXwke2N1ckNvaW59fEFyYlJhdGlvOiR7QXJiUmF0aW99fCR7c2hvd01heH1gKTtcbiAgICBpZiAoQXJiUmF0aW8gPiB0aHJlc2hvbGQpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiU29tZXRoaW5nIGRyYW1hdGljIG5lZWRzIHRvIGhhcHBlbiFcIik7XG4gICAgfVxuICB9KTtcbiAgLy8gQ2hlY2sgaWYgc2VsbGluZyB0aGUgY29pbiB3aWxsIGJlIHByb2ZpdGFibGVcbiAgY29pbnMuZm9yRWFjaChjdXJDb2luID0+IHtcbiAgICBsZXQgQlRDX2N1ckNvaW5CaWQgPSBleGNoYW5nZVByaWNlc1tcIkJUQ19cIitjdXJDb2luXS5oaWdoZXN0QmlkO1xuICAgIGxldCBVU0RDX0JUQ0JpZCA9IGV4Y2hhbmdlUHJpY2VzW2Jhc2VTdGFibGVDb2luICsgXCJfXCIgKyBcIkJUQ1wiXS5oaWdoZXN0QmlkO1xuICAgIGxldCBVU0RDX2N1ckNvaW5Bc2sgPSBleGNoYW5nZVByaWNlc1tiYXNlU3RhYmxlQ29pbiArIFwiX1wiICtjdXJDb2luXS5sb3dlc3RBc2s7XG4gICAgbGV0IEFtdEluaXQgPSAxMDAwMDtcbiAgICBsZXQgQW10RmluYWwgPSBBbXRJbml0KkJUQ19jdXJDb2luQmlkKlVTRENfQlRDQmlkL1VTRENfY3VyQ29pbkFzaztcbiAgICBsZXQgQXJiUmF0aW8gPSBBbXRGaW5hbC9BbXRJbml0O1xuICAgIGxldCBzaG93TWF4ID0gXCJcIjtcbiAgICBpZiAoQXJiUmF0aW8+bWF4U2VsbEFyYikge1xuICAgICAgbWF4U2VsbEFyYiA9IEFyYlJhdGlvO1xuICAgICAgc2hvd01heCA9IFwiTmV3TWF4XCI7XG4gICAgfVxuICAgIGlmIChBcmJSYXRpbz4xLjApXG4gICAgICBjb25zb2xlLmxvZyhgUkVDfCR7dGltZVN0YW1wfXwke3RpbWVTdGFtcFN0cn18U2VsbHwke2Jhc2VTdGFibGVDb2lufXwke2N1ckNvaW59fEFyYlJhdGlvOiR7QXJiUmF0aW99fCR7c2hvd01heH1gKTtcbiAgICBpZiAoQXJiUmF0aW8gPiB0aHJlc2hvbGQpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiU29tZXRoaW5nIGRyYW1hdGljIG5lZWRzIHRvIGhhcHBlbiFcIik7XG4gICAgfVxuICB9KTtcbn1cblxuLyogYW5hbHl6ZVBvbG9FVEhQcmljZXNcbiAqIGRlc2M6IFRha2VzIHRoZSBleGNoYW5nZSBwcmljZXMgZnJvbSBQb2xvbmlleCBhbmQgZG9lcyB0aGUgZGV0YWlsZWQgY29tcGFyZXMgdG8gZmluZCBhcmJpdHJhZ2VcbiAqICAgICAgIHdpdGhpbiB0aGlzIGV4Y2hhbmdlIGZvciB0aGVpciBFVEggbWFya2V0LlxuICovXG5mdW5jdGlvbiBhbmFseXplUG9sb0VUSFByaWNlcyhleGNoYW5nZVByaWNlczogYW55LCB0aW1lU3RhbXA6IERhdGUpIHtcblxuICBsZXQgdGltZVN0YW1wU3RyID0gdGltZVN0YW1wLmdldFRpbWUoKTtcbiAgY29uc29sZS5sb2coYHByaWNlQ2hlY2tDb3VudDoke251bWJlck9mQ2hlY2tzfXxFVEh8bWF4QnV5QXJiOk4vQXxtYXhTZWxsQXJiRVRIOiR7bWF4U2VsbEFyYkVUSH1gKTtcbiAgbGV0IGNvaW5zID0gW1wiQkFUXCIsIFwiQk5UXCIsIFwiQ1ZDXCIsIFwiRU9TXCIsIFwiRVRDXCIsIFwiR0FTXCIsIFwiR05UXCIsIFwiS05DXCIsIFwiTE9PTVwiLCBcIkxTS1wiLCBcbiAgICBcIk1BTkFcIiwgXCJPTUdcIiwgXCJRVFVNXCIsIFwiUkVQXCIsIFwiU05UXCIsIFwiU1RFRU1cIiwgXCJaRUNcIiwgXCJaUlhcIl07XG4gIC8vIENoZWNrIGlmIHNlbGxpbmcgdGhlIGNvaW4gd2lsbCBiZSBwcm9maXRhYmxlXG4gIGNvaW5zLmZvckVhY2goY3VyQ29pbiA9PiB7XG4gICAgbGV0IEVUSF9jdXJDb2luQmlkID0gZXhjaGFuZ2VQcmljZXNbXCJFVEhfXCIrY3VyQ29pbl0uaGlnaGVzdEJpZDtcbiAgICBsZXQgQlRDX0VUSEJpZCA9IGV4Y2hhbmdlUHJpY2VzW1wiQlRDX0VUSFwiXS5oaWdoZXN0QmlkO1xuICAgIGxldCBCVENfY3VyQ29pbkFzayA9IGV4Y2hhbmdlUHJpY2VzW1wiQlRDX1wiK2N1ckNvaW5dLmxvd2VzdEFzaztcbiAgICBsZXQgQW10SW5pdCA9IDE7XG4gICAgbGV0IEFtdEZpbmFsID0gQW10SW5pdCpCVENfRVRIQmlkKkVUSF9jdXJDb2luQmlkL0JUQ19jdXJDb2luQXNrO1xuICAgIGxldCBBcmJSYXRpbyA9IEFtdEZpbmFsL0FtdEluaXQ7XG4gICAgbGV0IHNob3dNYXggPSBcIlwiO1xuICAgIGlmIChBcmJSYXRpbz5tYXhTZWxsQXJiRVRIKSB7XG4gICAgICBtYXhTZWxsQXJiRVRIID0gQXJiUmF0aW87XG4gICAgICBzaG93TWF4ID0gXCJOZXdNYXhcIjtcbiAgICB9XG4gICAgaWYgKEFyYlJhdGlvPjEuMClcbiAgICAgIGNvbnNvbGUubG9nKGBSRUN8JHt0aW1lU3RhbXB9fCR7dGltZVN0YW1wU3RyfXxTZWxsfCR7Y3VyQ29pbn18RVRIfEFyYlJhdGlvOiR7QXJiUmF0aW99fCR7c2hvd01heH1gKTtcbiAgICBpZiAoQXJiUmF0aW8gPiB0aHJlc2hvbGQpIHtcbiAgICAgIGxldCBpbnN0cnVjdGlvbnMgPSBgQUxFUlQ6IFNlbGwgJHtBbXRJbml0fSAke2N1ckNvaW59IGZvciAke0FtdEluaXQqRVRIX2N1ckNvaW5CaWR9IEVUSCwgXG4gICAgICAgIHRoZW4gc2VsbCB0aG9zZSBFVEggZm9yICR7QW10SW5pdCpFVEhfY3VyQ29pbkJpZCpCVENfRVRIQmlkfSBCVEMsXG4gICAgICAgIHRoZW4gdXNlIHRob3NlIEJUQyB0byBidXkgJHtBbXRGaW5hbH0gJHtjdXJDb2lufWA7XG4gICAgICBjb25zb2xlLmxvZyhpbnN0cnVjdGlvbnMpO1xuICAgIH1cbiAgfSk7XG59XG5cbi8qIGFuYWx5emVQb2xvWE1SUHJpY2VzXG4gKiBkZXNjOiBUYWtlcyB0aGUgZXhjaGFuZ2UgcHJpY2VzIGZyb20gUG9sb25pZXggYW5kIGRvZXMgdGhlIGRldGFpbGVkIGNvbXBhcmVzIHRvIGZpbmQgYXJiaXRyYWdlXG4gKiAgICAgICB3aXRoaW4gdGhpcyBleGNoYW5nZSBmb3IgdGhlaXIgWFJNIG1hcmtldC5cbiAqL1xuZnVuY3Rpb24gYW5hbHl6ZVBvbG9YTVJQcmljZXMoZXhjaGFuZ2VQcmljZXM6IGFueSwgdGltZVN0YW1wOiBEYXRlKSB7XG5cbiAgbGV0IHRpbWVTdGFtcFN0ciA9IHRpbWVTdGFtcC5nZXRUaW1lKCk7XG4gIGNvbnNvbGUubG9nKGBwcmljZUNoZWNrQ291bnQ6JHtudW1iZXJPZkNoZWNrc318WE1SfG1heEJ1eUFyYjpOL0F8bWF4U2VsbEFyYlhNUjoke21heFNlbGxBcmJYTVJ9YCk7XG4gIGxldCBjb2lucyA9IFtcIkxUQ1wiLCBcIlpFQ1wiLCBcIk5YVFwiLCBcIkRBU0hcIiwgXCJCQ05cIiwgXCJNQUlEXCJdO1xuICAvLyBDaGVjayBpZiBzZWxsaW5nIHRoZSBjb2luIHdpbGwgYmUgcHJvZml0YWJsZVxuICBjb2lucy5mb3JFYWNoKGN1ckNvaW4gPT4ge1xuICAgIGxldCBiYXNlTWFya2V0ID0gXCJYTVJcIjtcbiAgICBsZXQgYmFzZU1hcmtldF9jdXJDb2luQmlkID0gZXhjaGFuZ2VQcmljZXNbYmFzZU1hcmtldCArIFwiX1wiICsgY3VyQ29pbl0uaGlnaGVzdEJpZDtcbiAgICBsZXQgQlRDX2Jhc2VNYXJrZXRCaWQgPSBleGNoYW5nZVByaWNlc1tcIkJUQ1wiICsgXCJfXCIgKyBiYXNlTWFya2V0XS5oaWdoZXN0QmlkO1xuICAgIGxldCBCVENfY3VyQ29pbkFzayA9IGV4Y2hhbmdlUHJpY2VzW1wiQlRDXCIgKyBcIl9cIiArIGN1ckNvaW5dLmxvd2VzdEFzaztcbiAgICBsZXQgQW10SW5pdCA9IDE7XG4gICAgbGV0IEFtdEZpbmFsID0gQW10SW5pdCpCVENfYmFzZU1hcmtldEJpZCpiYXNlTWFya2V0X2N1ckNvaW5CaWQvQlRDX2N1ckNvaW5Bc2s7XG4gICAgbGV0IEFyYlJhdGlvID0gQW10RmluYWwvQW10SW5pdDtcbiAgICBsZXQgc2hvd01heCA9IFwiXCI7XG4gICAgaWYgKEFyYlJhdGlvPm1heFNlbGxBcmJYTVIpIHtcbiAgICAgIG1heFNlbGxBcmJYTVIgPSBBcmJSYXRpbztcbiAgICAgIHNob3dNYXggPSBcIk5ld01heFwiO1xuICAgIH1cbiAgICBpZiAoQXJiUmF0aW8+MS4wKVxuICAgICAgY29uc29sZS5sb2coYFJFQ3wke3RpbWVTdGFtcH18JHt0aW1lU3RhbXBTdHJ9fFNlbGx8JHtjdXJDb2lufXxYTVJ8QXJiUmF0aW86JHtBcmJSYXRpb318JHtzaG93TWF4fWApO1xuICAgIGlmIChBcmJSYXRpbyA+IHRocmVzaG9sZCkge1xuICAgICAgbGV0IGluc3RydWN0aW9ucyA9IGBBTEVSVDogU2VsbCAke0FtdEluaXR9ICR7Y3VyQ29pbn0gZm9yICR7QW10SW5pdCpiYXNlTWFya2V0X2N1ckNvaW5CaWR9IFhNUiwgXG4gICAgICAgIHRoZW4gc2VsbCB0aG9zZSBYTVIgZm9yICR7QW10SW5pdCpCVENfYmFzZU1hcmtldEJpZCpiYXNlTWFya2V0X2N1ckNvaW5CaWR9IEJUQyxcbiAgICAgICAgdGhlbiB1c2UgdGhvc2UgQlRDIHRvIGJ1eSAke0FtdEZpbmFsfSAke2N1ckNvaW59YDtcbiAgICAgIGNvbnNvbGUubG9nKGluc3RydWN0aW9ucyk7XG4gICAgfVxuICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcnVuUG9sb0NvaW5iYXNlQ29tcGFyZSgpIHtcbiAgbGV0IHBvbG9uaWV4RGF0YSA9IGF3YWl0IGdldEV4Y2hhbmdlRGF0YShwb2xvbmlleFVSTCk7XG4gIGxldCBjb2luYmFzZURhdGFaRUMgPSBhd2FpdCBnZXRFeGNoYW5nZURhdGEoY29pbmJhc2VVUkwrXCIvWkVDLVVTREMvYm9va1wiKTtcbiAgbGV0IGNvaW5iYXNlRGF0YUVUSCA9IGF3YWl0IGdldEV4Y2hhbmdlRGF0YShjb2luYmFzZVVSTCtcIi9FVEgtVVNEQy9ib29rXCIpO1xuICBsZXQgY29pbmJhc2VEYXRhQlRDID0gYXdhaXQgZ2V0RXhjaGFuZ2VEYXRhKGNvaW5iYXNlVVJMK1wiL0JUQy1VU0RDL2Jvb2tcIik7XG4gIGNvbXBhcmVQb2xvbmlleENvaW5iYXNlKHBvbG9uaWV4RGF0YSwgY29pbmJhc2VEYXRhWkVDLCBcIlpFQ1wiKTtcbiAgY29tcGFyZVBvbG9uaWV4Q29pbmJhc2UocG9sb25pZXhEYXRhLCBjb2luYmFzZURhdGFFVEgsIFwiRVRIXCIpO1xuICBjb21wYXJlUG9sb25pZXhDb2luYmFzZShwb2xvbmlleERhdGEsIGNvaW5iYXNlRGF0YUJUQywgXCJCVENcIik7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJ1blBvbG9CaXR0cmV4Q29tcGFyZSgpIHtcblxuICBudW1iZXJPZkNoZWNrcysrO1xuICAvLyBQb2xvbmlleCBzZWN0aW9uIC0gQWxsIGNvaW5zIGZyb20gb25lIHJlcXVlc3RcbiAgbGV0IHBvbG9uaWV4RGF0YSA9IGF3YWl0IGdldEV4Y2hhbmdlRGF0YShwb2xvbmlleFVSTCk7XG4gIC8vIEJpdHRyZXggc2VjdGlvbiAtIEFsbCBjb2lucyBmcm9tIG9uZSByZXF1ZXN0LlxuICAvLyBCaXR0cmV4IG1hcmtldCBzdW1tYXJ5IC0gQWxsIGNvaW5zIGZyb20gb25lIHJlcXVlc3QuXG4gIGxldCBiaXR0cmV4QUxMID0gYXdhaXQgZ2V0RXhjaGFuZ2VEYXRhKGJpdHRyZXhVUkxBbGwpO1xuICBsZXQgYml0dHJleEpTT046IGFueSA9IEpTT04ucGFyc2UoYml0dHJleEFMTC5leGNoYW5nZURhdGEpO1xuICBsZXQgYml0dHJleEJUQ0NvaW5zOiBhbnkgPSB7XG4gICAgQlRDOiBbXCJhcmRyXCIsIFwiYmF0XCIsIFwiYm50XCIsIFwiYnVyc3RcIiwgXCJjdmNcIiwgXCJkYXNoXCIsIFwiZGNyXCIsIFwiZGdiXCIsIFwiZG9nZVwiLCBcImV0Y1wiLCBcbiAgICBcImV0aFwiLCBcImZjdFwiLCBcImdhbWVcIiwgXCJnbnRcIiwgXCJsYmNcIiwgXCJsb29tXCIsIFwibHNrXCIsIFwibHRjXCIsIFwibWFuYVwiLCBcIm5hdlwiLCBcbiAgICBcIm5tclwiLCBcIm54dFwiLCBcIm9tZ1wiLCBcInBvbHlcIiwgXCJwcGNcIiwgXCJxdHVtXCIsIFwicmVwXCIsIFwic2JkXCIsIFwic2NcIiwgXCJzbnRcIiwgXG4gICAgXCJzdGVlbVwiLCBcInN0b3JqXCIsIFwic3RyYXRcIiwgXCJzeXNcIiwgXCJ2aWFcIiwgXCJ2dGNcIiwgXCJ4Y3BcIiwgXCJ4ZW1cIiwgXCJ4bG1cIiwgXCJ4bXJcIiwgXG4gICAgXCJ4cnBcIiwgXCJ6ZWNcIiwgXCJ6cnhcIl0sXG4gICAgRVRIOiBbXCJCQVRcIiwgXCJCTlRcIiwgXCJDVkNcIiwgXCJFVENcIiwgXCJHTlRcIiwgXCJNQU5BXCIsIFwiT01HXCIsIFwiUVRVTVwiLCBcbiAgICAgIFwiUkVQXCIsIFwiU05UXCIsIFwiWkVDXCIsIFwiWlJYXCJdLFxuICAgIFVTRFQ6IFtcIkJBVFwiLCBcIkJUQ1wiLCBcIkRBU0hcIiwgXCJET0dFXCIsIFwiTFRDXCIsIFwiWE1SXCIsIFwiWFJQXCJdXG5cbiAgfTtcbiAgbGV0IGJhc2VNYXJrZXRzID0gW1wiQlRDXCIsIFwiRVRIXCIsIFwiVVNEVFwiXTtcbiAgYmFzZU1hcmtldHMuZm9yRWFjaCgoYmFzZU1rdDogc3RyaW5nKSA9PiB7XG4gICAgY29uc29sZS5sb2coXCJQcm9jZXNzaW5nIGJhc2Vta3Q6XCIsIGJhc2VNa3QpO1xuICAgIGxldCBiaXR0cmV4VHJpbW1lZDogYW55ID0ge307XG4gICAgYml0dHJleEpTT04ucmVzdWx0LmZvckVhY2goKG1hcmtldDogYW55KSA9PiB7XG4gICAgICBiaXR0cmV4QlRDQ29pbnNbYmFzZU1rdF0uZm9yRWFjaCgoY29pbjogc3RyaW5nKSA9PiB7XG4gICAgICAgIGxldCBNYXJrZXROYW1lID0gYmFzZU1rdCtcIi1cIitjb2luLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgIC8vY29uc29sZS5sb2coXCJNYXJrZXROYW1lOlwiLCBNYXJrZXROYW1lKTtcbiAgICAgICAgaWYgKG1hcmtldC5NYXJrZXROYW1lPT09TWFya2V0TmFtZSkge1xuICAgICAgICAgIGJpdHRyZXhUcmltbWVkW01hcmtldE5hbWVdID0gbWFya2V0O1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBsZXQgYml0dHJleENvbXBhcmU6IGFueSA9IHt9O1xuICAgIGJpdHRyZXhDb21wYXJlLnRpbWVTdGFtcCA9IGJpdHRyZXhBTEwudGltZVN0YW1wO1xuICAgIGJpdHRyZXhDb21wYXJlLmV4Y2hhbmdlRGF0YSA9IGJpdHRyZXhUcmltbWVkO1xuICAgIGNvbXBhcmVBbGxQb2xvbmlleEJpdHRyZXgocG9sb25pZXhEYXRhLCBiaXR0cmV4Q29tcGFyZSk7XG4gIH0pO1xuICBjb25zb2xlLmxvZyhgQ29tcGFyZSBjeWNsZSAke251bWJlck9mQ2hlY2tzfSBjb21wbGV0ZS5gKVxufVxuXG5cbmFzeW5jIGZ1bmN0aW9uIHJ1blBvbG9IaXRidGNDb21wYXJlKCkge1xuXG4gIG51bWJlck9mQ2hlY2tzKys7XG4gIC8vIFBvbG9uaWV4IHNlY3Rpb24gLSBBbGwgY29pbnMgZnJvbSBvbmUgcmVxdWVzdFxuICBsZXQgcG9sb25pZXhEYXRhID0gYXdhaXQgZ2V0RXhjaGFuZ2VEYXRhKHBvbG9uaWV4VVJMKTtcbiAgLy8gQml0dHJleCBzZWN0aW9uIC0gQWxsIGNvaW5zIGZyb20gb25lIHJlcXVlc3QuXG4gIC8vIEJpdHRyZXggbWFya2V0IHN1bW1hcnkgLSBBbGwgY29pbnMgZnJvbSBvbmUgcmVxdWVzdC5cbiAgbGV0IGhpdGJ0Y0RhdGEgPSBhd2FpdCBnZXRFeGNoYW5nZURhdGEoaGl0YnRjVVJMKTsgIFxuICBsZXQgaGl0YnRjSlNPTiA9IEpTT04ucGFyc2UoaGl0YnRjRGF0YS5leGNoYW5nZURhdGEpO1xuICBsZXQgaGl0YnRjTWFya2V0czogQXJyYXk8c3RyaW5nPiA9IFtcbiAgICBcIkJDTkJUQ1wiLCBcIkJOVFVTRFRcIiwgXCJEQVNIQlRDXCIsIFwiREFTSFVTRFRcIiwgXCJER0JCVENcIiwgXCJET0dFQlRDXCIsIFxuICAgIFwiRE9HRVVTRFRcIiwgXCJFT1NCVENcIiwgXCJFT1NVU0RUXCIsIFwiRVRDVVNEVFwiLCBcIkVUSEJUQ1wiLCBcbiAgICBcIkVUSFVTRFRcIiwgXCJMU0tCVENcIiwgXCJNQUlEQlRDXCIsIFwiTUFOQUJUQ1wiLCBcbiAgICBcIk9NR0JUQ1wiLCBcIlBQQ0JUQ1wiLCBcIlFUVU1QUENcIiwgXCJSRVBCVENcIiwgXCJSRVBVU0RUXCIsIFxuICAgIFwiWEVNQlRDXCIsIFwiWkVDRVRIXCIgXG4gIF07XG5cbiAgbGV0IGhpdGJ0Y1RyaW1tZWQ6IGFueSA9IHt9O1xuICBoaXRidGNNYXJrZXRzLmZvckVhY2gobWFya2V0ID0+IHtcbiAgICBoaXRidGNKU09OLmZvckVhY2goKGV4Y2hhbmdlRGF0YTogYW55KSA9PiB7XG4gICAgICBpZihleGNoYW5nZURhdGEuc3ltYm9sPT09bWFya2V0KVxuICAgICAgICBoaXRidGNUcmltbWVkW21hcmtldF0gPSBleGNoYW5nZURhdGE7XG4gICAgfSk7ICAgICBcbiAgfSk7XG4gIGxldCBoaXRidGNDb21wYXJlOiBhbnkgPSB7fTtcbiAgaGl0YnRjQ29tcGFyZS50aW1lU3RhbXAgPSBoaXRidGNEYXRhLnRpbWVTdGFtcDtcbiAgaGl0YnRjQ29tcGFyZS5leGNoYW5nZURhdGEgPSBoaXRidGNUcmltbWVkO1xuICBjb21wYXJlQWxsUG9sb25pZXhIaXRidGMocG9sb25pZXhEYXRhLCBoaXRidGNDb21wYXJlKTtcbn1cblxuXG5hc3luYyBmdW5jdGlvbiBydW5Qb2xvWW9iaXRDb21wYXJlKCkge1xuXG4gIG51bWJlck9mQ2hlY2tzKys7XG4gIC8vIFBvbG9uaWV4IHNlY3Rpb24gLSBBbGwgY29pbnMgZnJvbSBvbmUgcmVxdWVzdFxuICBsZXQgcG9sb25pZXhEYXRhID0gYXdhaXQgZ2V0RXhjaGFuZ2VEYXRhKHBvbG9uaWV4VVJMKTtcbiAgLy8gQml0dHJleCBzZWN0aW9uIC0gQWxsIGNvaW5zIGZyb20gb25lIHJlcXVlc3QuXG4gIC8vIEJpdHRyZXggbWFya2V0IHN1bW1hcnkgLSBBbGwgY29pbnMgZnJvbSBvbmUgcmVxdWVzdC5cbiAgbGV0IHlvYml0TWFya2V0cyA9IFtcbiAgICBcImx0Y19idGNcIiwgXCJldGhfYnRjXCJcbiAgXTtcbiAgbGV0IHRpY2tlckxpc3QgPSBcIlwiO1xuICBmb3IobGV0IGk9MDsgaTx5b2JpdE1hcmtldHMubGVuZ3RoOyBpKyspIHtcbiAgICB0aWNrZXJMaXN0ICs9IHlvYml0TWFya2V0c1tpXTtcbiAgICBpZiAoaSE9eW9iaXRNYXJrZXRzLmxlbmd0aC0xKVxuICAgICAgdGlja2VyTGlzdCArPSBcIi1cIjtcbiAgfVxuICBsZXQgeW9iaXRVUkwgPSB5b2JpdEJhc2VVUkwgKyB0aWNrZXJMaXN0O1xuICBjb25zb2xlLmxvZyhcIlJ1biBxdWVyeSBmb3IgZGF0YSBhdDpcIiwgeW9iaXRVUkwpO1xuICBsZXQgeW9iaXREYXRhID0gYXdhaXQgZ2V0RXhjaGFuZ2VEYXRhKHlvYml0VVJMKTsgIFxuICBjb25zb2xlLmxvZyhcInlvYml0RGF0YTpcIiwgeW9iaXREYXRhKTtcbiAgY29tcGFyZUFsbFBvbG9uaWV4WW9iaXQocG9sb25pZXhEYXRhLCB5b2JpdERhdGEpO1xufVxuXG4vKiBydW5Zb2JpdEludGVybmFsQ29tcGFyZVxuICogZGVzYzogQ2hlY2tzIGludGVucmFsIHByaWNlcyBmb3IgdGhlIFlvYml0IGV4Y2hhbmdlIHRvIHNlZSBpZiBhbnkgY2FzZXMgZXhpc3Qgd2l0aFxuICogICAgICAgdGhlIEFyYiBGYWN0b3IgaXMgZ3JlYXRlciB0aGFuIG9uZS5cbiAqL1xuZnVuY3Rpb24gcnVuWW9iaXRJbnRlcm5hbENvbXBhcmUoKSB7XG5cbiAgbnVtYmVyT2ZDaGVja3MrKztcbiAgbGV0IHlvYml0TWFya2V0cyA9IFtcbiAgICAgIFwiemVjXCIsIFwibHNrXCIsIFwiZXRjXCIsIFwibHRjXCIsIFwiZnRvXCIsIFwiZWRyMlwiLCBcImxiclwiLCBcImJhblwiLCBcImtpblwiLCBcIm5idFwiLFxuICAgICAgXCJybnRiXCIsIFwiYnVubnlcIiwgXCJ0cnhcIiwgXCJrYmNcIiwgXCJ2cnRtXCIsIFwiaHVyXCIsIFwibm9haFwiLCBcInhycFwiLCBcImRvZ2VcIiwgXG4gICAgICBcImVkaXRcIiwgXCJldm5cIiwgXCJleG1yXCIsIFwicGF5cFwiLCBcInlvemlcIiwgXCJ3YXZlc1wiLCBcIm55Y1wiLFxuICAgICAgXCJkZ2JcIiwgXCJkdXhcIiwgXCJkYXNoXCJdO1xuICBsZXQgYmFzZU1hcmtldHMgPSBbXG4gICAgICBcImJ0Y1wiLCBcImV0aFwiXG4gICAgXTtcbiAgcnVuWW9iaXRCYXNlTWt0Q29tcGFyZShiYXNlTWFya2V0cywgeW9iaXRNYXJrZXRzKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcnVuWW9iaXRCYXNlTWt0Q29tcGFyZShiYXNlTWFya2V0czogQXJyYXk8c3RyaW5nPiwgeW9iaXRNYXJrZXRzOiBBcnJheTxzdHJpbmc+KSB7XG5cbiAgLy8gWW9iaXQgYWNjZXB0cyBtdWx0aXBsZSB0aWNrZXJzIGluIHRoZSBVUkwgdXNpbmcgYSBkYXNoIHNlcGVyYXRlZCBmb3JtYXQuXG4gIC8vIEV4LiBodHRwczovL3lvYml0Lm5ldC9hcGkvMy90aWNrZXIvZXRoX2J0Yy16ZWNfYnRjLXplY19ldGhcbiAgLy9cbiAgLy8gV2lsbCByZXR1cm4gZGF0YSBpbiB0aGUgZm9ybWF0LFxuICAvL1xuICAvLyB7XCJldGhfYnRjXCI6XG4gIC8vICAgIHtcImhpZ2hcIjowLjAzMzA5LFwibG93XCI6MC4wMzIzNTM4OCxcImF2Z1wiOjAuMDMyNzIxOTQsXCJ2b2xcIjoxMDA4LjA2NzA2MDY2LFwidm9sX2N1clwiOjMwNjQwLjI3ODI0NzI4LFwibGFzdFwiOjAuMDMyODYyNzQsXCJidXlcIjowLjAzMjc4MTg3LFwic2VsbFwiOjAuMDMyOTEyNTksXCJ1cGRhdGVkXCI6MTU0ODE2NzE3MX0sXG4gIC8vICBcInplY19idGNcIjpcbiAgLy8gICAge1wiaGlnaFwiOjAuMDE0NzE0MDcsXCJsb3dcIjowLjAxNDQ0NDgsXCJhdmdcIjowLjAxNDU3OTQzLFwidm9sXCI6ODY2LjEyMzcwNzEyLFwidm9sX2N1clwiOjU5MTkxLjE2Mzc5MTMzLFwibGFzdFwiOjAuMDE0NTk1NTcsXCJidXlcIjowLjAxNDUzODcxLFwic2VsbFwiOjAuMDE0NjQ4ODIsXCJ1cGRhdGVkXCI6MTU0ODE2NzE2OH0sXG4gIC8vICBcInplY19ldGhcIjpcbiAgLy8gICAge1wiaGlnaFwiOjAuNDQ4NTkyMzksXCJsb3dcIjowLjQzNzE5OTA0LFwiYXZnXCI6MC40NDI4OTU3MSxcInZvbFwiOjMuNDc4NDMzNTQsXCJ2b2xfY3VyXCI6Ny43Nzc3MTE0MixcImxhc3RcIjowLjQ0ODU5MjM5LFwiYnV5XCI6MC40NDAwODU5NixcInNlbGxcIjowLjQ0ODU5MjM4LFwidXBkYXRlZFwiOjE1NDgxNjYwNTJ9XG4gIC8vIH1cblxuICAvLyBDcmVhdGUgdGlja2VyIGxpc3QgaW4gZm9ybWF0IFlvYml0IHdpbGwgYWNjZXB0LlxuICBsZXQgdGlja2VyTGlzdFN0ciA9IFwiXCI7XG4gIGZvcihsZXQgaT0wOyBpPHlvYml0TWFya2V0cy5sZW5ndGg7IGkrKykge1xuICAgIHRpY2tlckxpc3RTdHIgKz0geW9iaXRNYXJrZXRzW2ldICsgXCJfXCIgKyBiYXNlTWFya2V0c1swXSArIFwiLVwiO1xuICAgIHRpY2tlckxpc3RTdHIgKz0geW9iaXRNYXJrZXRzW2ldICsgXCJfXCIgKyBiYXNlTWFya2V0c1sxXTtcbiAgICBpZiAoaSE9eW9iaXRNYXJrZXRzLmxlbmd0aC0xKVxuICAgICAgdGlja2VyTGlzdFN0ciArPSBcIi1cIjtcbiAgICBlbHNlXG4gICAgICB0aWNrZXJMaXN0U3RyICs9IFwiLVwiICsgYmFzZU1hcmtldHNbMV0gKyBcIl9cIiArIGJhc2VNYXJrZXRzWzBdO1xuICB9XG4gIGxldCB5b2JpdE1rdCA9IGF3YWl0IGdldEV4Y2hhbmdlRGF0YSh5b2JpdEJhc2VVUkwgKyB0aWNrZXJMaXN0U3RyKTsgIFxuICB0cnkge1xuICAgIGxldCBta3REYXRhID0gSlNPTi5wYXJzZSh5b2JpdE1rdC5leGNoYW5nZURhdGEpO1xuICAgIC8vIEFuYWx5emUgWW9iaXQgbWFya2V0IGxvb2tpbmcgZm9yIHByaWNlIGFub21vbGllc1xuICAgIGludGVybmFsQ29tcGFyZUZvcllvYml0KG1rdERhdGEsIHlvYml0TWFya2V0cywgYmFzZU1hcmtldHMpO1xuICB9XG4gIGNhdGNoKGUpIHtcbiAgICBjb25zb2xlLmxvZyhcIkludmFsaWQgbWFya2V0IGRhdGEgcmV0dXJuZWQgZnJvbTpcIiwgeW9iaXRCYXNlVVJMKTtcbiAgICBjb25zb2xlLmxvZyhcIkRhdGEgb2JqZWN0IHJldHVybmVkOlwiLCB5b2JpdE1rdCk7XG4gIH1cbn1cblxuXG4vLyBTZXQgdGhlIGRlZmF1bHQgY29wYXJlIHRvIHJ1bi5cbmxldCBjb21wYXJlVG9SdW46IFByb21pc2U8dm9pZD4gPSBydW5Qb2xvQml0dHJleENvbXBhcmU7XG5pZiAocHJvY2Vzcy5hcmd2Lmxlbmd0aD49Mykge1xuICBpZiAocHJvY2Vzcy5hcmd2WzJdPT09XCJwb2xvaW50ZXJuYWxcIikge1xuICAgIGNvbnNvbGUubG9nKGBSdW5uaW5nIHBvbG9pbnRlcm5hbCBjb21wYXJlLmApO1xuICAgIGNvbXBhcmVUb1J1biA9IHBvbG9JbnRlcm5hbENvbXBhcmU7XG4gIH1cbiAgZWxzZSB7XG4gICAgaWYgKHByb2Nlc3MuYXJndlsyXT09PVwicG9sb2NvaW5iYXNlXCIpIHtcbiAgICAgIGNvbXBhcmVUb1J1biA9IHJ1blBvbG9Db2luYmFzZUNvbXBhcmU7XG4gICAgICBjb25zb2xlLmxvZyhcIlJ1bm5pbmcgUG9sb0NvaW5iYXNlQ29tcGFyZS5cIik7XG4gICAgfVxuICAgIGVsc2UgaWYgKHByb2Nlc3MuYXJndlsyXT09PVwicG9sb2hpdGJ0Y1wiKSB7XG4gICAgICBjb21wYXJlVG9SdW4gPSBydW5Qb2xvSGl0YnRjQ29tcGFyZTtcbiAgICAgIGNvbnNvbGUubG9nKFwiUnVubmluZyBQb2xvSGl0YnRjQ29tcGFyZS5cIilcbiAgICB9XG4gICAgZWxzZSBpZiAocHJvY2Vzcy5hcmd2WzJdPT09XCJwb2xveW9iaXRcIikge1xuICAgICAgY29tcGFyZVRvUnVuID0gcnVuUG9sb1lvYml0Q29tcGFyZTtcbiAgICAgIGNvbnNvbGUubG9nKFwiUnVubmluZyBydW5Qb2xvWW9iaXRDb21wYXJlLlwiKVxuICAgIH1cbiAgICBlbHNlIGlmIChwcm9jZXNzLmFyZ3ZbMl09PT1cInlvYml0aW50ZXJuYWxcIikge1xuICAgICAgY29tcGFyZVRvUnVuID0gcnVuWW9iaXRJbnRlcm5hbENvbXBhcmU7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICBjb25zb2xlLmxvZyhcIlJ1bm5pbmcgZGVmYXVsdCBwb2xvIGJpdHRyZXggY29tcGFyZS5cIik7XG4gICAgfVxuICB9XG59XG5sZXQgbmV3SW50ZXJhbCA9IDEwMDAqKHRpbWVJblNlY29uZHNCZXR3ZWVuUHJpY2VDaGVja3MgKyAyMCpNYXRoLnJhbmRvbSgpKTtcbmNvbnNvbGUubG9nKGBTZXR0aW5nIHRoZSB0aW1lciBpbnRlcnZhbCB0byAke25ld0ludGVyYWwvMTAwMH0gc2Vjb25kcy5gICk7XG5jb21wYXJlVG9SdW4oKTtcbmludGVydmFsSGFuZGVsID0gc2V0SW50ZXJ2YWwoY29tcGFyZVRvUnVuLCBuZXdJbnRlcmFsKTtcbiJdfQ==