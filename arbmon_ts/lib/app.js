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
  runYobitBaseMktCompare(baseMarkets, yobitMarkets); // let yobitMarkets: Array<string> = [ "ltc", "waves" ];
  // let baseMarkets: Array<string> = [ "doge", "eth" ];
  // runYobitBaseMktCompare(baseMarkets, yobitMarkets);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcHAudHMiXSwibmFtZXMiOlsicmVxdWlyZSIsIlhNTEh0dHBSZXF1ZXN0IiwicG9sb25pZXhVUkwiLCJjb2luYmFzZVVSTCIsImJpdHRyZXhVUkxBbGwiLCJoaXRidGNVUkwiLCJ5b2JpdEJhc2VVUkwiLCJ0aHJlc2hvbGQiLCJudW1iZXJPZkNoZWNrcyIsImludGVydmFsSGFuZGVsIiwibWF4QnV5QXJiIiwibWF4U2VsbEFyYiIsIm1heFNlbGxBcmJFVEgiLCJtYXhTZWxsQXJiWE1SIiwidGltZUluU2Vjb25kc0JldHdlZW5QcmljZUNoZWNrcyIsInBvbG9JbnRlcm5hbENvbXBhcmUiLCJjb25zb2xlIiwibG9nIiwieG1saHR0cCIsIm1ldGhvZCIsInVybCIsIm9wZW4iLCJvbmVycm9yIiwib25yZWFkeXN0YXRlY2hhbmdlIiwicmVhZHlTdGF0ZSIsInN0YXR1cyIsImV4Y2hhbmdlRGF0YSIsInJlc3BvbnNlVGV4dCIsInRpbWVTdGFtcCIsIkRhdGUiLCJleGNoYW5nZU9iamVjdCIsIkpTT04iLCJwYXJzZSIsImNvaW5zIiwiYmFzZVN0YWJsZUNvaW4iLCJhbmFseXplUG9sb0JUQ1ByaWNlcyIsImFuYWx5emVQb2xvRVRIUHJpY2VzIiwiYW5hbHl6ZVBvbG9YTVJQcmljZXMiLCJzZW5kIiwiZXhjaGFuZ2VQcmljZXMiLCJ0aW1lU3RhbXBTdHIiLCJnZXRUaW1lIiwiZm9yRWFjaCIsImN1ckNvaW4iLCJsb3dlc3RBc2tCVEMiLCJsb3dlc3RBc2siLCJoaWdoZXN0QmlkVVNEQyIsImhpZ2hlc3RCaWQiLCJVU0RDX0JUQ2xvd2VzdEFzayIsIkFyYlJhdGlvIiwic2hvd01heCIsIkJUQ19jdXJDb2luQmlkIiwiVVNEQ19CVENCaWQiLCJVU0RDX2N1ckNvaW5Bc2siLCJBbXRJbml0IiwiQW10RmluYWwiLCJFVEhfY3VyQ29pbkJpZCIsIkJUQ19FVEhCaWQiLCJCVENfY3VyQ29pbkFzayIsImluc3RydWN0aW9ucyIsImJhc2VNYXJrZXQiLCJiYXNlTWFya2V0X2N1ckNvaW5CaWQiLCJCVENfYmFzZU1hcmtldEJpZCIsInJ1blBvbG9Db2luYmFzZUNvbXBhcmUiLCJwb2xvbmlleERhdGEiLCJjb2luYmFzZURhdGFaRUMiLCJjb2luYmFzZURhdGFFVEgiLCJjb2luYmFzZURhdGFCVEMiLCJydW5Qb2xvQml0dHJleENvbXBhcmUiLCJiaXR0cmV4QUxMIiwiYml0dHJleEpTT04iLCJiaXR0cmV4QlRDQ29pbnMiLCJCVEMiLCJFVEgiLCJVU0RUIiwiYmFzZU1hcmtldHMiLCJiYXNlTWt0IiwiYml0dHJleFRyaW1tZWQiLCJyZXN1bHQiLCJtYXJrZXQiLCJjb2luIiwiTWFya2V0TmFtZSIsInRvVXBwZXJDYXNlIiwiYml0dHJleENvbXBhcmUiLCJydW5Qb2xvSGl0YnRjQ29tcGFyZSIsImhpdGJ0Y0RhdGEiLCJoaXRidGNKU09OIiwiaGl0YnRjTWFya2V0cyIsImhpdGJ0Y1RyaW1tZWQiLCJzeW1ib2wiLCJoaXRidGNDb21wYXJlIiwicnVuUG9sb1lvYml0Q29tcGFyZSIsInlvYml0TWFya2V0cyIsInRpY2tlckxpc3QiLCJpIiwibGVuZ3RoIiwieW9iaXRVUkwiLCJ5b2JpdERhdGEiLCJydW5Zb2JpdEludGVybmFsQ29tcGFyZSIsInJ1bllvYml0QmFzZU1rdENvbXBhcmUiLCJ0aWNrZXJMaXN0U3RyIiwieW9iaXRNa3QiLCJta3REYXRhIiwiZSIsImNvbXBhcmVUb1J1biIsInByb2Nlc3MiLCJhcmd2IiwibmV3SW50ZXJhbCIsIk1hdGgiLCJyYW5kb20iLCJzZXRJbnRlcnZhbCJdLCJtYXBwaW5ncyI6Ijs7QUFFQTs7QUFDQTs7Ozs7O0FBSEFBLE9BQU8sQ0FBQyxpQkFBRCxDQUFQOztBQU1BLElBQUlDLGNBQWMsR0FBR0QsT0FBTyxDQUFDLGdCQUFELENBQVAsQ0FBMEJDLGNBQS9DOztBQUVBLElBQU1DLFdBQVcsR0FBRyxrREFBcEI7QUFDQSxJQUFNQyxXQUFXLEdBQUcsdUNBQXBCO0FBQ0EsSUFBTUMsYUFBYSxHQUFHLHdEQUF0QjtBQUNBLElBQU1D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O0FBQ0QsR0FIRCxNQUlLO0FBQ0gsUUFBSTBGLE9BQU8sQ0FBQ0MsSUFBUixDQUFhLENBQWIsTUFBa0IsY0FBdEIsRUFBc0M7QUFDcENGLE1BQUFBLFlBQVksR0FBR3pDLHNCQUFmO0FBQ0EvQyxNQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSw4QkFBWjtBQUNELEtBSEQsTUFJSyxJQUFJd0YsT0FBTyxDQUFDQyxJQUFSLENBQWEsQ0FBYixNQUFrQixZQUF0QixFQUFvQztBQUN2Q0YsTUFBQUEsWUFBWSxHQUFHcEIsb0JBQWY7QUFDQXBFLE1BQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLDRCQUFaO0FBQ0QsS0FISSxNQUlBLElBQUl3RixPQUFPLENBQUNDLElBQVIsQ0FBYSxDQUFiLE1BQWtCLFdBQXRCLEVBQW1DO0FBQ3RDRixNQUFBQSxZQUFZLEdBQUdiLG1CQUFmO0FBQ0EzRSxNQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSw4QkFBWjtBQUNELEtBSEksTUFJQSxJQUFJd0YsT0FBTyxDQUFDQyxJQUFSLENBQWEsQ0FBYixNQUFrQixlQUF0QixFQUF1QztBQUMxQ0YsTUFBQUEsWUFBWSxHQUFHTix1QkFBZjtBQUNELEtBRkksTUFJTDtBQUNFbEYsTUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksdUNBQVo7QUFDRDtBQUNGO0FBQ0Y7O0FBQ0QsSUFBSTBGLFVBQVUsR0FBRyxRQUFNN0YsK0JBQStCLEdBQUcsS0FBRzhGLElBQUksQ0FBQ0MsTUFBTCxFQUEzQyxDQUFqQjtBQUNBN0YsT0FBTyxDQUFDQyxHQUFSLHlDQUE2QzBGLFVBQVUsR0FBQyxJQUF4RDtBQUNBSCxZQUFZO0FBQ1ovRixjQUFjLEdBQUdxRyxXQUFXLENBQUNOLFlBQUQsRUFBZUcsVUFBZixDQUE1QiIsInNvdXJjZXNDb250ZW50IjpbInJlcXVpcmUoXCJAYmFiZWwvcG9seWZpbGxcIik7XG5cbmltcG9ydCB7Z2V0RXhjaGFuZ2VEYXRhfSBmcm9tIFwiLi91dGlscy9nZXRDcnlwdG9EYXRhLmpzXCI7XG5pbXBvcnQge2NvbXBhcmVQb2xvbmlleENvaW5iYXNlLCBjb21wYXJlQWxsUG9sb25pZXhCaXR0cmV4LCBjb21wYXJlQWxsUG9sb25pZXhIaXRidGMsXG4gIGNvbXBhcmVBbGxQb2xvbmlleFlvYml0LCBpbnRlcm5hbENvbXBhcmVGb3JZb2JpdH0gZnJvbSBcIi4vdXRpbHMvY29tcGFyZVByaWNpbmdEYXRhXCI7XG5cbmxldCBYTUxIdHRwUmVxdWVzdCA9IHJlcXVpcmUoXCJ4bWxodHRwcmVxdWVzdFwiKS5YTUxIdHRwUmVxdWVzdDtcblxuY29uc3QgcG9sb25pZXhVUkwgPSBcImh0dHBzOi8vcG9sb25pZXguY29tL3B1YmxpYz9jb21tYW5kPXJldHVyblRpY2tlclwiOyBcbmNvbnN0IGNvaW5iYXNlVVJMID0gXCJodHRwczovL2FwaS5wcm8uY29pbmJhc2UuY29tL3Byb2R1Y3RzXCI7IFxuY29uc3QgYml0dHJleFVSTEFsbCA9IFwiaHR0cHM6Ly9iaXR0cmV4LmNvbS9hcGkvdjEuMS9wdWJsaWMvZ2V0bWFya2V0c3VtbWFyaWVzXCI7XG5jb25zdCBoaXRidGNVUkwgPSBcImh0dHBzOi8vYXBpLmhpdGJ0Yy5jb20vYXBpLzIvcHVibGljL3RpY2tlclwiO1xuY29uc3QgeW9iaXRCYXNlVVJMID0gXCJodHRwczovL3lvYml0Lm5ldC9hcGkvMy90aWNrZXIvXCJcbmNvbnN0IHRocmVzaG9sZCA9IDEuMDE7XG5sZXQgbnVtYmVyT2ZDaGVja3MgPSAwO1xubGV0IGludGVydmFsSGFuZGVsID0gLTE7XG5sZXQgbWF4QnV5QXJiID0gMDtcbmxldCBtYXhTZWxsQXJiID0gMDtcbmxldCBtYXhTZWxsQXJiRVRIID0gMDtcbmxldCBtYXhTZWxsQXJiWE1SID0gMDtcblxuY29uc3QgdGltZUluU2Vjb25kc0JldHdlZW5QcmljZUNoZWNrcyA9IDE1O1xuXG4vKiBwb2xvSW50ZXJuYWxDb21wYXJlXG4gKiBkZXNjOiBMb29rcyBmb3IgYXJiaXRyYWdlIHByb2ZpdHMgZnJvbSBzY2VuYXJpb3Mgd2hlcmUgYSBjb2luMSBpcyBleGNoYW5nZWQgZm9yIGNvaW4yLCBjb2luMiBleGNoYW5nZWQgZm9yIGNvaW4zIGFuZCB0aGVuIFxuICogICAgICAgY29pbjMgZXhjaGFuZ2VkIGJhY2sgaW50byBjb2luMS5cbiAqICAgICAgIFRoaXMgY29tcGFyZSBsb29rcyBvbmx5IHdpdGhpbiB0aGUgUG9sb25pZXggZXhjaGFuZ2UuXG4qL1xuZnVuY3Rpb24gcG9sb0ludGVybmFsQ29tcGFyZSgpIHtcblxuICBjb25zb2xlLmxvZyhcIkJFR0lOOiBwb2xvSW50ZXJuYWxDb21wYXJlXCIpO1xuICBsZXQgeG1saHR0cCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpLFxuICAgIG1ldGhvZCA9IFwiR0VUXCIsXG4gICAgdXJsID0gcG9sb25pZXhVUkw7XG5cbiAgY29uc29sZS5sb2coXCJMb2FkaW5nIGRhdGEgZnJvbSA6IEh0dHAuc2VuZChcIiwgdXJsLCBcIilcIik7XG4gIHhtbGh0dHAub3BlbihtZXRob2QsIHVybCwgdHJ1ZSk7XG4gIHhtbGh0dHAub25lcnJvciA9IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zb2xlLmxvZyhcIioqIEFuIGVycm9yIG9jY3VycmVkIGR1cmluZyB0aGUgdHJhbnNhY3Rpb25cIik7XG4gIH07XG4gIHhtbGh0dHAub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMucmVhZHlTdGF0ZT09PTQgJiYgdGhpcy5zdGF0dXM9PT0yMDApIHtcbiAgICAgIGxldCBleGNoYW5nZURhdGEgPSB4bWxodHRwLnJlc3BvbnNlVGV4dDtcbiAgICAgIG51bWJlck9mQ2hlY2tzKys7XG4gICAgICBsZXQgdGltZVN0YW1wID0gbmV3IERhdGUoKTtcbiAgICAgIGxldCBleGNoYW5nZU9iamVjdCA9IEpTT04ucGFyc2UoZXhjaGFuZ2VEYXRhKTtcbiAgICAgIGxldCBjb2lucyA9IFtcIkZPQU1cIiwgXCJaRUNcIiwgXCJMVENcIiwgXCJFVEhcIiwgXCJYUlBcIiwgXCJTVFJcIiwgXCJYTVJcIiwgXCJET0dFXCIsIFwiQkNIQUJDXCIsIFwiQkNIU1ZcIl07XG4gICAgICBsZXQgYmFzZVN0YWJsZUNvaW4gPSBcIlVTRENcIjtcbiAgICAgIGFuYWx5emVQb2xvQlRDUHJpY2VzKGV4Y2hhbmdlT2JqZWN0LCBiYXNlU3RhYmxlQ29pbiwgY29pbnMsIHRpbWVTdGFtcCk7XG4gICAgICBjb2lucyA9IFtcIkJBVFwiLCBcIkJOVFwiLCBcIkRBU0hcIiwgXCJET0dFXCIsIFwiRU9TXCIsIFwiRVRDXCIsIFwiRVRIXCIsIFwiR05UXCIsIFwiS05DXCIsIFwiTE9PTVwiLCBcIkxTS1wiLFxuICAgICAgICBcIkxUQ1wiLCBcIk1BTkFcIiwgXCJOWFRcIiwgXCJRVFVNXCIsIFwiUkVQXCIsIFwiU0NcIiwgXCJTTlRcIiwgXCJTVFJcIiwgXCJYTVJcIiwgXCJYUlBcIiwgXCJaRUNcIiwgXCJaUlhcIl07XG4gICAgICBiYXNlU3RhYmxlQ29pbiA9IFwiVVNEVFwiOyBcbiAgICAgIGFuYWx5emVQb2xvQlRDUHJpY2VzKGV4Y2hhbmdlT2JqZWN0LCBiYXNlU3RhYmxlQ29pbiwgY29pbnMsIHRpbWVTdGFtcCk7XG4gICAgICBhbmFseXplUG9sb0VUSFByaWNlcyhleGNoYW5nZU9iamVjdCwgdGltZVN0YW1wKTtcbiAgICAgIGFuYWx5emVQb2xvWE1SUHJpY2VzKGV4Y2hhbmdlT2JqZWN0LCB0aW1lU3RhbXApO1xuICAgIH1cbiAgfVxuICB4bWxodHRwLnNlbmQoKTtcbiAgY29uc29sZS5sb2coXCJFTkQ6IHBvbG9JbnRlcm5hbENvbXBhcmVcIik7XG59XG5cbi8qIGFuYWx5emVQb2xvQlRDUHJpY2VzXG4gKiBkZXNjOiBUYWtlcyB0aGUgZXhjaGFuZ2UgcHJpY2VzIGZyb20gUG9sb25pZXggYW5kIGRvZXMgdGhlIGRldGFpbGVkIGNvbXBhcmVzIHRvIGZpbmQgYXJiaXRyYWdlXG4gKiAgICAgICB3aXRoaW4gdGhpcyBleGNoYW5nZS4gIEl0IGRvZXMgdGhpcyBmb3IgdGhlIEJUQyBtYXJrZXQuXG4gKi9cbmZ1bmN0aW9uIGFuYWx5emVQb2xvQlRDUHJpY2VzKGV4Y2hhbmdlUHJpY2VzOiBhbnksIGJhc2VTdGFibGVDb2luOiBcbiAgc3RyaW5nLCBjb2luczogQXJyYXk8c3RyaW5nPiwgdGltZVN0YW1wOiBEYXRlKSB7XG5cbiAgbGV0IHRpbWVTdGFtcFN0ciA9IHRpbWVTdGFtcC5nZXRUaW1lKCk7XG4gIGNvbnNvbGUubG9nKGBwcmljZUNoZWNrQ291bnQ6JHtudW1iZXJPZkNoZWNrc318JHtiYXNlU3RhYmxlQ29pbn18bWF4QnV5QXJiOiR7bWF4QnV5QXJifXxtYXhTZWxsQXJiOiR7bWF4U2VsbEFyYn1gKTtcbiAgLy8gQ2hlY2sgaWYgYnV5aW5nIHRoZSBjb2luIHdpbGwgYmUgcHJvZml0YWJsZS5cbiAgY29pbnMuZm9yRWFjaChjdXJDb2luID0+IHtcbiAgICBsZXQgbG93ZXN0QXNrQlRDID0gZXhjaGFuZ2VQcmljZXNbXCJCVENfXCIgKyBjdXJDb2luXS5sb3dlc3RBc2s7XG4gICAgbGV0IGhpZ2hlc3RCaWRVU0RDID0gZXhjaGFuZ2VQcmljZXNbYmFzZVN0YWJsZUNvaW4gKyBcIl9cIiArIGN1ckNvaW5dLmhpZ2hlc3RCaWQ7XG4gICAgbGV0IFVTRENfQlRDbG93ZXN0QXNrID0gZXhjaGFuZ2VQcmljZXNbYmFzZVN0YWJsZUNvaW4gKyBcIl9cIiArIFwiQlRDXCJdLmxvd2VzdEFzaztcbiAgICBsZXQgQXJiUmF0aW8gPSBoaWdoZXN0QmlkVVNEQyAvICggbG93ZXN0QXNrQlRDICogIFVTRENfQlRDbG93ZXN0QXNrKTtcbiAgICBsZXQgc2hvd01heCA9IFwiXCI7XG4gICAgaWYgKEFyYlJhdGlvPm1heEJ1eUFyYikge1xuICAgICAgbWF4QnV5QXJiID0gQXJiUmF0aW87XG4gICAgICBzaG93TWF4ID0gXCJOZXdNYXhcIjtcbiAgICB9XG4gICAgaWYgKEFyYlJhdGlvPjEuMClcbiAgICAgIGNvbnNvbGUubG9nKGBSRUN8JHt0aW1lU3RhbXB9fCR7dGltZVN0YW1wU3RyfXxCdXl8JHtiYXNlU3RhYmxlQ29pbn18JHtjdXJDb2lufXxBcmJSYXRpbzoke0FyYlJhdGlvfXwke3Nob3dNYXh9YCk7XG4gICAgaWYgKEFyYlJhdGlvID4gdGhyZXNob2xkKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIlNvbWV0aGluZyBkcmFtYXRpYyBuZWVkcyB0byBoYXBwZW4hXCIpO1xuICAgIH1cbiAgfSk7XG4gIC8vIENoZWNrIGlmIHNlbGxpbmcgdGhlIGNvaW4gd2lsbCBiZSBwcm9maXRhYmxlXG4gIGNvaW5zLmZvckVhY2goY3VyQ29pbiA9PiB7XG4gICAgbGV0IEJUQ19jdXJDb2luQmlkID0gZXhjaGFuZ2VQcmljZXNbXCJCVENfXCIrY3VyQ29pbl0uaGlnaGVzdEJpZDtcbiAgICBsZXQgVVNEQ19CVENCaWQgPSBleGNoYW5nZVByaWNlc1tiYXNlU3RhYmxlQ29pbiArIFwiX1wiICsgXCJCVENcIl0uaGlnaGVzdEJpZDtcbiAgICBsZXQgVVNEQ19jdXJDb2luQXNrID0gZXhjaGFuZ2VQcmljZXNbYmFzZVN0YWJsZUNvaW4gKyBcIl9cIiArY3VyQ29pbl0ubG93ZXN0QXNrO1xuICAgIGxldCBBbXRJbml0ID0gMTAwMDA7XG4gICAgbGV0IEFtdEZpbmFsID0gQW10SW5pdCpCVENfY3VyQ29pbkJpZCpVU0RDX0JUQ0JpZC9VU0RDX2N1ckNvaW5Bc2s7XG4gICAgbGV0IEFyYlJhdGlvID0gQW10RmluYWwvQW10SW5pdDtcbiAgICBsZXQgc2hvd01heCA9IFwiXCI7XG4gICAgaWYgKEFyYlJhdGlvPm1heFNlbGxBcmIpIHtcbiAgICAgIG1heFNlbGxBcmIgPSBBcmJSYXRpbztcbiAgICAgIHNob3dNYXggPSBcIk5ld01heFwiO1xuICAgIH1cbiAgICBpZiAoQXJiUmF0aW8+MS4wKVxuICAgICAgY29uc29sZS5sb2coYFJFQ3wke3RpbWVTdGFtcH18JHt0aW1lU3RhbXBTdHJ9fFNlbGx8JHtiYXNlU3RhYmxlQ29pbn18JHtjdXJDb2lufXxBcmJSYXRpbzoke0FyYlJhdGlvfXwke3Nob3dNYXh9YCk7XG4gICAgaWYgKEFyYlJhdGlvID4gdGhyZXNob2xkKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIlNvbWV0aGluZyBkcmFtYXRpYyBuZWVkcyB0byBoYXBwZW4hXCIpO1xuICAgIH1cbiAgfSk7XG59XG5cbi8qIGFuYWx5emVQb2xvRVRIUHJpY2VzXG4gKiBkZXNjOiBUYWtlcyB0aGUgZXhjaGFuZ2UgcHJpY2VzIGZyb20gUG9sb25pZXggYW5kIGRvZXMgdGhlIGRldGFpbGVkIGNvbXBhcmVzIHRvIGZpbmQgYXJiaXRyYWdlXG4gKiAgICAgICB3aXRoaW4gdGhpcyBleGNoYW5nZSBmb3IgdGhlaXIgRVRIIG1hcmtldC5cbiAqL1xuZnVuY3Rpb24gYW5hbHl6ZVBvbG9FVEhQcmljZXMoZXhjaGFuZ2VQcmljZXM6IGFueSwgdGltZVN0YW1wOiBEYXRlKSB7XG5cbiAgbGV0IHRpbWVTdGFtcFN0ciA9IHRpbWVTdGFtcC5nZXRUaW1lKCk7XG4gIGNvbnNvbGUubG9nKGBwcmljZUNoZWNrQ291bnQ6JHtudW1iZXJPZkNoZWNrc318RVRIfG1heEJ1eUFyYjpOL0F8bWF4U2VsbEFyYkVUSDoke21heFNlbGxBcmJFVEh9YCk7XG4gIGxldCBjb2lucyA9IFtcIkJBVFwiLCBcIkJOVFwiLCBcIkNWQ1wiLCBcIkVPU1wiLCBcIkVUQ1wiLCBcIkdBU1wiLCBcIkdOVFwiLCBcIktOQ1wiLCBcIkxPT01cIiwgXCJMU0tcIiwgXG4gICAgXCJNQU5BXCIsIFwiT01HXCIsIFwiUVRVTVwiLCBcIlJFUFwiLCBcIlNOVFwiLCBcIlNURUVNXCIsIFwiWkVDXCIsIFwiWlJYXCJdO1xuICAvLyBDaGVjayBpZiBzZWxsaW5nIHRoZSBjb2luIHdpbGwgYmUgcHJvZml0YWJsZVxuICBjb2lucy5mb3JFYWNoKGN1ckNvaW4gPT4ge1xuICAgIGxldCBFVEhfY3VyQ29pbkJpZCA9IGV4Y2hhbmdlUHJpY2VzW1wiRVRIX1wiK2N1ckNvaW5dLmhpZ2hlc3RCaWQ7XG4gICAgbGV0IEJUQ19FVEhCaWQgPSBleGNoYW5nZVByaWNlc1tcIkJUQ19FVEhcIl0uaGlnaGVzdEJpZDtcbiAgICBsZXQgQlRDX2N1ckNvaW5Bc2sgPSBleGNoYW5nZVByaWNlc1tcIkJUQ19cIitjdXJDb2luXS5sb3dlc3RBc2s7XG4gICAgbGV0IEFtdEluaXQgPSAxO1xuICAgIGxldCBBbXRGaW5hbCA9IEFtdEluaXQqQlRDX0VUSEJpZCpFVEhfY3VyQ29pbkJpZC9CVENfY3VyQ29pbkFzaztcbiAgICBsZXQgQXJiUmF0aW8gPSBBbXRGaW5hbC9BbXRJbml0O1xuICAgIGxldCBzaG93TWF4ID0gXCJcIjtcbiAgICBpZiAoQXJiUmF0aW8+bWF4U2VsbEFyYkVUSCkge1xuICAgICAgbWF4U2VsbEFyYkVUSCA9IEFyYlJhdGlvO1xuICAgICAgc2hvd01heCA9IFwiTmV3TWF4XCI7XG4gICAgfVxuICAgIGlmIChBcmJSYXRpbz4xLjApXG4gICAgICBjb25zb2xlLmxvZyhgUkVDfCR7dGltZVN0YW1wfXwke3RpbWVTdGFtcFN0cn18U2VsbHwke2N1ckNvaW59fEVUSHxBcmJSYXRpbzoke0FyYlJhdGlvfXwke3Nob3dNYXh9YCk7XG4gICAgaWYgKEFyYlJhdGlvID4gdGhyZXNob2xkKSB7XG4gICAgICBsZXQgaW5zdHJ1Y3Rpb25zID0gYEFMRVJUOiBTZWxsICR7QW10SW5pdH0gJHtjdXJDb2lufSBmb3IgJHtBbXRJbml0KkVUSF9jdXJDb2luQmlkfSBFVEgsIFxuICAgICAgICB0aGVuIHNlbGwgdGhvc2UgRVRIIGZvciAke0FtdEluaXQqRVRIX2N1ckNvaW5CaWQqQlRDX0VUSEJpZH0gQlRDLFxuICAgICAgICB0aGVuIHVzZSB0aG9zZSBCVEMgdG8gYnV5ICR7QW10RmluYWx9ICR7Y3VyQ29pbn1gO1xuICAgICAgY29uc29sZS5sb2coaW5zdHJ1Y3Rpb25zKTtcbiAgICB9XG4gIH0pO1xufVxuXG4vKiBhbmFseXplUG9sb1hNUlByaWNlc1xuICogZGVzYzogVGFrZXMgdGhlIGV4Y2hhbmdlIHByaWNlcyBmcm9tIFBvbG9uaWV4IGFuZCBkb2VzIHRoZSBkZXRhaWxlZCBjb21wYXJlcyB0byBmaW5kIGFyYml0cmFnZVxuICogICAgICAgd2l0aGluIHRoaXMgZXhjaGFuZ2UgZm9yIHRoZWlyIFhSTSBtYXJrZXQuXG4gKi9cbmZ1bmN0aW9uIGFuYWx5emVQb2xvWE1SUHJpY2VzKGV4Y2hhbmdlUHJpY2VzOiBhbnksIHRpbWVTdGFtcDogRGF0ZSkge1xuXG4gIGxldCB0aW1lU3RhbXBTdHIgPSB0aW1lU3RhbXAuZ2V0VGltZSgpO1xuICBjb25zb2xlLmxvZyhgcHJpY2VDaGVja0NvdW50OiR7bnVtYmVyT2ZDaGVja3N9fFhNUnxtYXhCdXlBcmI6Ti9BfG1heFNlbGxBcmJYTVI6JHttYXhTZWxsQXJiWE1SfWApO1xuICBsZXQgY29pbnMgPSBbXCJMVENcIiwgXCJaRUNcIiwgXCJOWFRcIiwgXCJEQVNIXCIsIFwiQkNOXCIsIFwiTUFJRFwiXTtcbiAgLy8gQ2hlY2sgaWYgc2VsbGluZyB0aGUgY29pbiB3aWxsIGJlIHByb2ZpdGFibGVcbiAgY29pbnMuZm9yRWFjaChjdXJDb2luID0+IHtcbiAgICBsZXQgYmFzZU1hcmtldCA9IFwiWE1SXCI7XG4gICAgbGV0IGJhc2VNYXJrZXRfY3VyQ29pbkJpZCA9IGV4Y2hhbmdlUHJpY2VzW2Jhc2VNYXJrZXQgKyBcIl9cIiArIGN1ckNvaW5dLmhpZ2hlc3RCaWQ7XG4gICAgbGV0IEJUQ19iYXNlTWFya2V0QmlkID0gZXhjaGFuZ2VQcmljZXNbXCJCVENcIiArIFwiX1wiICsgYmFzZU1hcmtldF0uaGlnaGVzdEJpZDtcbiAgICBsZXQgQlRDX2N1ckNvaW5Bc2sgPSBleGNoYW5nZVByaWNlc1tcIkJUQ1wiICsgXCJfXCIgKyBjdXJDb2luXS5sb3dlc3RBc2s7XG4gICAgbGV0IEFtdEluaXQgPSAxO1xuICAgIGxldCBBbXRGaW5hbCA9IEFtdEluaXQqQlRDX2Jhc2VNYXJrZXRCaWQqYmFzZU1hcmtldF9jdXJDb2luQmlkL0JUQ19jdXJDb2luQXNrO1xuICAgIGxldCBBcmJSYXRpbyA9IEFtdEZpbmFsL0FtdEluaXQ7XG4gICAgbGV0IHNob3dNYXggPSBcIlwiO1xuICAgIGlmIChBcmJSYXRpbz5tYXhTZWxsQXJiWE1SKSB7XG4gICAgICBtYXhTZWxsQXJiWE1SID0gQXJiUmF0aW87XG4gICAgICBzaG93TWF4ID0gXCJOZXdNYXhcIjtcbiAgICB9XG4gICAgaWYgKEFyYlJhdGlvPjEuMClcbiAgICAgIGNvbnNvbGUubG9nKGBSRUN8JHt0aW1lU3RhbXB9fCR7dGltZVN0YW1wU3RyfXxTZWxsfCR7Y3VyQ29pbn18WE1SfEFyYlJhdGlvOiR7QXJiUmF0aW99fCR7c2hvd01heH1gKTtcbiAgICBpZiAoQXJiUmF0aW8gPiB0aHJlc2hvbGQpIHtcbiAgICAgIGxldCBpbnN0cnVjdGlvbnMgPSBgQUxFUlQ6IFNlbGwgJHtBbXRJbml0fSAke2N1ckNvaW59IGZvciAke0FtdEluaXQqYmFzZU1hcmtldF9jdXJDb2luQmlkfSBYTVIsIFxuICAgICAgICB0aGVuIHNlbGwgdGhvc2UgWE1SIGZvciAke0FtdEluaXQqQlRDX2Jhc2VNYXJrZXRCaWQqYmFzZU1hcmtldF9jdXJDb2luQmlkfSBCVEMsXG4gICAgICAgIHRoZW4gdXNlIHRob3NlIEJUQyB0byBidXkgJHtBbXRGaW5hbH0gJHtjdXJDb2lufWA7XG4gICAgICBjb25zb2xlLmxvZyhpbnN0cnVjdGlvbnMpO1xuICAgIH1cbiAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJ1blBvbG9Db2luYmFzZUNvbXBhcmUoKSB7XG4gIGxldCBwb2xvbmlleERhdGEgPSBhd2FpdCBnZXRFeGNoYW5nZURhdGEocG9sb25pZXhVUkwpO1xuICBsZXQgY29pbmJhc2VEYXRhWkVDID0gYXdhaXQgZ2V0RXhjaGFuZ2VEYXRhKGNvaW5iYXNlVVJMK1wiL1pFQy1VU0RDL2Jvb2tcIik7XG4gIGxldCBjb2luYmFzZURhdGFFVEggPSBhd2FpdCBnZXRFeGNoYW5nZURhdGEoY29pbmJhc2VVUkwrXCIvRVRILVVTREMvYm9va1wiKTtcbiAgbGV0IGNvaW5iYXNlRGF0YUJUQyA9IGF3YWl0IGdldEV4Y2hhbmdlRGF0YShjb2luYmFzZVVSTCtcIi9CVEMtVVNEQy9ib29rXCIpO1xuICBjb21wYXJlUG9sb25pZXhDb2luYmFzZShwb2xvbmlleERhdGEsIGNvaW5iYXNlRGF0YVpFQywgXCJaRUNcIik7XG4gIGNvbXBhcmVQb2xvbmlleENvaW5iYXNlKHBvbG9uaWV4RGF0YSwgY29pbmJhc2VEYXRhRVRILCBcIkVUSFwiKTtcbiAgY29tcGFyZVBvbG9uaWV4Q29pbmJhc2UocG9sb25pZXhEYXRhLCBjb2luYmFzZURhdGFCVEMsIFwiQlRDXCIpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBydW5Qb2xvQml0dHJleENvbXBhcmUoKSB7XG5cbiAgbnVtYmVyT2ZDaGVja3MrKztcbiAgLy8gUG9sb25pZXggc2VjdGlvbiAtIEFsbCBjb2lucyBmcm9tIG9uZSByZXF1ZXN0XG4gIGxldCBwb2xvbmlleERhdGEgPSBhd2FpdCBnZXRFeGNoYW5nZURhdGEocG9sb25pZXhVUkwpO1xuICAvLyBCaXR0cmV4IHNlY3Rpb24gLSBBbGwgY29pbnMgZnJvbSBvbmUgcmVxdWVzdC5cbiAgLy8gQml0dHJleCBtYXJrZXQgc3VtbWFyeSAtIEFsbCBjb2lucyBmcm9tIG9uZSByZXF1ZXN0LlxuICBsZXQgYml0dHJleEFMTCA9IGF3YWl0IGdldEV4Y2hhbmdlRGF0YShiaXR0cmV4VVJMQWxsKTtcbiAgbGV0IGJpdHRyZXhKU09OOiBhbnkgPSBKU09OLnBhcnNlKGJpdHRyZXhBTEwuZXhjaGFuZ2VEYXRhKTtcbiAgbGV0IGJpdHRyZXhCVENDb2luczogYW55ID0ge1xuICAgIEJUQzogW1wiYXJkclwiLCBcImJhdFwiLCBcImJudFwiLCBcImJ1cnN0XCIsIFwiY3ZjXCIsIFwiZGFzaFwiLCBcImRjclwiLCBcImRnYlwiLCBcImRvZ2VcIiwgXCJldGNcIiwgXG4gICAgXCJldGhcIiwgXCJmY3RcIiwgXCJnYW1lXCIsIFwiZ250XCIsIFwibGJjXCIsIFwibG9vbVwiLCBcImxza1wiLCBcImx0Y1wiLCBcIm1hbmFcIiwgXCJuYXZcIiwgXG4gICAgXCJubXJcIiwgXCJueHRcIiwgXCJvbWdcIiwgXCJwb2x5XCIsIFwicHBjXCIsIFwicXR1bVwiLCBcInJlcFwiLCBcInNiZFwiLCBcInNjXCIsIFwic250XCIsIFxuICAgIFwic3RlZW1cIiwgXCJzdG9yalwiLCBcInN0cmF0XCIsIFwic3lzXCIsIFwidmlhXCIsIFwidnRjXCIsIFwieGNwXCIsIFwieGVtXCIsIFwieGxtXCIsIFwieG1yXCIsIFxuICAgIFwieHJwXCIsIFwiemVjXCIsIFwienJ4XCJdLFxuICAgIEVUSDogW1wiQkFUXCIsIFwiQk5UXCIsIFwiQ1ZDXCIsIFwiRVRDXCIsIFwiR05UXCIsIFwiTUFOQVwiLCBcIk9NR1wiLCBcIlFUVU1cIiwgXG4gICAgICBcIlJFUFwiLCBcIlNOVFwiLCBcIlpFQ1wiLCBcIlpSWFwiXSxcbiAgICBVU0RUOiBbXCJCQVRcIiwgXCJCVENcIiwgXCJEQVNIXCIsIFwiRE9HRVwiLCBcIkxUQ1wiLCBcIlhNUlwiLCBcIlhSUFwiXVxuXG4gIH07XG4gIGxldCBiYXNlTWFya2V0cyA9IFtcIkJUQ1wiLCBcIkVUSFwiLCBcIlVTRFRcIl07XG4gIGJhc2VNYXJrZXRzLmZvckVhY2goKGJhc2VNa3Q6IHN0cmluZykgPT4ge1xuICAgIGNvbnNvbGUubG9nKFwiUHJvY2Vzc2luZyBiYXNlbWt0OlwiLCBiYXNlTWt0KTtcbiAgICBsZXQgYml0dHJleFRyaW1tZWQ6IGFueSA9IHt9O1xuICAgIGJpdHRyZXhKU09OLnJlc3VsdC5mb3JFYWNoKChtYXJrZXQ6IGFueSkgPT4ge1xuICAgICAgYml0dHJleEJUQ0NvaW5zW2Jhc2VNa3RdLmZvckVhY2goKGNvaW46IHN0cmluZykgPT4ge1xuICAgICAgICBsZXQgTWFya2V0TmFtZSA9IGJhc2VNa3QrXCItXCIrY29pbi50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAvL2NvbnNvbGUubG9nKFwiTWFya2V0TmFtZTpcIiwgTWFya2V0TmFtZSk7XG4gICAgICAgIGlmIChtYXJrZXQuTWFya2V0TmFtZT09PU1hcmtldE5hbWUpIHtcbiAgICAgICAgICBiaXR0cmV4VHJpbW1lZFtNYXJrZXROYW1lXSA9IG1hcmtldDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgbGV0IGJpdHRyZXhDb21wYXJlOiBhbnkgPSB7fTtcbiAgICBiaXR0cmV4Q29tcGFyZS50aW1lU3RhbXAgPSBiaXR0cmV4QUxMLnRpbWVTdGFtcDtcbiAgICBiaXR0cmV4Q29tcGFyZS5leGNoYW5nZURhdGEgPSBiaXR0cmV4VHJpbW1lZDtcbiAgICBjb21wYXJlQWxsUG9sb25pZXhCaXR0cmV4KHBvbG9uaWV4RGF0YSwgYml0dHJleENvbXBhcmUpO1xuICB9KTtcbiAgY29uc29sZS5sb2coYENvbXBhcmUgY3ljbGUgJHtudW1iZXJPZkNoZWNrc30gY29tcGxldGUuYClcbn1cblxuXG5hc3luYyBmdW5jdGlvbiBydW5Qb2xvSGl0YnRjQ29tcGFyZSgpIHtcblxuICBudW1iZXJPZkNoZWNrcysrO1xuICAvLyBQb2xvbmlleCBzZWN0aW9uIC0gQWxsIGNvaW5zIGZyb20gb25lIHJlcXVlc3RcbiAgbGV0IHBvbG9uaWV4RGF0YSA9IGF3YWl0IGdldEV4Y2hhbmdlRGF0YShwb2xvbmlleFVSTCk7XG4gIC8vIEJpdHRyZXggc2VjdGlvbiAtIEFsbCBjb2lucyBmcm9tIG9uZSByZXF1ZXN0LlxuICAvLyBCaXR0cmV4IG1hcmtldCBzdW1tYXJ5IC0gQWxsIGNvaW5zIGZyb20gb25lIHJlcXVlc3QuXG4gIGxldCBoaXRidGNEYXRhID0gYXdhaXQgZ2V0RXhjaGFuZ2VEYXRhKGhpdGJ0Y1VSTCk7ICBcbiAgbGV0IGhpdGJ0Y0pTT04gPSBKU09OLnBhcnNlKGhpdGJ0Y0RhdGEuZXhjaGFuZ2VEYXRhKTtcbiAgbGV0IGhpdGJ0Y01hcmtldHM6IEFycmF5PHN0cmluZz4gPSBbXG4gICAgXCJCQ05CVENcIiwgXCJCTlRVU0RUXCIsIFwiREFTSEJUQ1wiLCBcIkRBU0hVU0RUXCIsIFwiREdCQlRDXCIsIFwiRE9HRUJUQ1wiLCBcbiAgICBcIkRPR0VVU0RUXCIsIFwiRU9TQlRDXCIsIFwiRU9TVVNEVFwiLCBcIkVUQ1VTRFRcIiwgXCJFVEhCVENcIiwgXG4gICAgXCJFVEhVU0RUXCIsIFwiTFNLQlRDXCIsXCJNQUlEQlRDXCIsXG4gICAgXCJNQU5BQlRDXCIsIFwiT01HQlRDXCIsIFwiUFBDQlRDXCIsIFwiUVRVTVBQQ1wiLCBcIlJFUEJUQ1wiLCBcbiAgICBcIlJFUFVTRFRcIiwgXCJYRU1CVENcIiwgXCJaRUNFVEhcIiBcbiAgXTtcblxuICBsZXQgaGl0YnRjVHJpbW1lZDogYW55ID0ge307XG4gIGhpdGJ0Y01hcmtldHMuZm9yRWFjaChtYXJrZXQgPT4ge1xuICAgIGhpdGJ0Y0pTT04uZm9yRWFjaCgoZXhjaGFuZ2VEYXRhOiBhbnkpID0+IHtcbiAgICAgIGlmKGV4Y2hhbmdlRGF0YS5zeW1ib2w9PT1tYXJrZXQpXG4gICAgICAgIGhpdGJ0Y1RyaW1tZWRbbWFya2V0XSA9IGV4Y2hhbmdlRGF0YTtcbiAgICB9KTsgICAgIFxuICB9KTtcbiAgbGV0IGhpdGJ0Y0NvbXBhcmU6IGFueSA9IHt9O1xuICBoaXRidGNDb21wYXJlLnRpbWVTdGFtcCA9IGhpdGJ0Y0RhdGEudGltZVN0YW1wO1xuICBoaXRidGNDb21wYXJlLmV4Y2hhbmdlRGF0YSA9IGhpdGJ0Y1RyaW1tZWQ7XG4gIGNvbXBhcmVBbGxQb2xvbmlleEhpdGJ0Yyhwb2xvbmlleERhdGEsIGhpdGJ0Y0NvbXBhcmUpO1xufVxuXG5cbmFzeW5jIGZ1bmN0aW9uIHJ1blBvbG9Zb2JpdENvbXBhcmUoKSB7XG5cbiAgbnVtYmVyT2ZDaGVja3MrKztcbiAgLy8gUG9sb25pZXggc2VjdGlvbiAtIEFsbCBjb2lucyBmcm9tIG9uZSByZXF1ZXN0XG4gIGxldCBwb2xvbmlleERhdGEgPSBhd2FpdCBnZXRFeGNoYW5nZURhdGEocG9sb25pZXhVUkwpO1xuICAvLyBCaXR0cmV4IHNlY3Rpb24gLSBBbGwgY29pbnMgZnJvbSBvbmUgcmVxdWVzdC5cbiAgLy8gQml0dHJleCBtYXJrZXQgc3VtbWFyeSAtIEFsbCBjb2lucyBmcm9tIG9uZSByZXF1ZXN0LlxuICBsZXQgeW9iaXRNYXJrZXRzID0gW1xuICAgIFwibHRjX2J0Y1wiLCBcImV0aF9idGNcIlxuICBdO1xuICBsZXQgdGlja2VyTGlzdCA9IFwiXCI7XG4gIGZvcihsZXQgaT0wOyBpPHlvYml0TWFya2V0cy5sZW5ndGg7IGkrKykge1xuICAgIHRpY2tlckxpc3QgKz0geW9iaXRNYXJrZXRzW2ldO1xuICAgIGlmIChpIT15b2JpdE1hcmtldHMubGVuZ3RoLTEpXG4gICAgICB0aWNrZXJMaXN0ICs9IFwiLVwiO1xuICB9XG4gIGxldCB5b2JpdFVSTCA9IHlvYml0QmFzZVVSTCArIHRpY2tlckxpc3Q7XG4gIGNvbnNvbGUubG9nKFwiUnVuIHF1ZXJ5IGZvciBkYXRhIGF0OlwiLCB5b2JpdFVSTCk7XG4gIGxldCB5b2JpdERhdGEgPSBhd2FpdCBnZXRFeGNoYW5nZURhdGEoeW9iaXRVUkwpOyAgXG4gIGNvbnNvbGUubG9nKFwieW9iaXREYXRhOlwiLCB5b2JpdERhdGEpO1xuICBjb21wYXJlQWxsUG9sb25pZXhZb2JpdChwb2xvbmlleERhdGEsIHlvYml0RGF0YSk7XG59XG5cbi8qIHJ1bllvYml0SW50ZXJuYWxDb21wYXJlXG4gKiBkZXNjOiBDaGVja3MgaW50ZW5yYWwgcHJpY2VzIGZvciB0aGUgWW9iaXQgZXhjaGFuZ2UgdG8gc2VlIGlmIGFueSBjYXNlcyBleGlzdCB3aXRoXG4gKiAgICAgICB0aGUgQXJiIEZhY3RvciBpcyBncmVhdGVyIHRoYW4gb25lLlxuICovXG5mdW5jdGlvbiBydW5Zb2JpdEludGVybmFsQ29tcGFyZSgpIHtcblxuICBudW1iZXJPZkNoZWNrcysrO1xuICBsZXQgeW9iaXRNYXJrZXRzID0gW1xuICAgICAgXCJ6ZWNcIiwgXCJsc2tcIiwgXCJldGNcIiwgXCJsdGNcIiwgXCJmdG9cIiwgXCJlZHIyXCIsIFwibGJyXCIsIFwiYmFuXCIsIFwia2luXCIsIFwibmJ0XCIsXG4gICAgICBcInJudGJcIiwgXCJidW5ueVwiLCBcInRyeFwiLCBcImtiY1wiLCBcInZydG1cIiwgXCJodXJcIiwgXCJub2FoXCIsIFwieHJwXCIsIFwiZG9nZVwiLCBcbiAgICAgIFwiZWRpdFwiLCBcImV2blwiLCBcImV4bXJcIiwgXCJwYXlwXCIsIFwieW96aVwiLCBcIndhdmVzXCIsIFwibnljXCIsXG4gICAgICBcImRnYlwiLCBcImR1eFwiLCBcImRhc2hcIl07XG4gIGxldCBiYXNlTWFya2V0cyA9IFtcbiAgICAgIFwiYnRjXCIsIFwiZXRoXCJcbiAgICBdO1xuICBydW5Zb2JpdEJhc2VNa3RDb21wYXJlKGJhc2VNYXJrZXRzLCB5b2JpdE1hcmtldHMpO1xuICAvLyBsZXQgeW9iaXRNYXJrZXRzOiBBcnJheTxzdHJpbmc+ID0gWyBcImx0Y1wiLCBcIndhdmVzXCIgXTtcbiAgLy8gbGV0IGJhc2VNYXJrZXRzOiBBcnJheTxzdHJpbmc+ID0gWyBcImRvZ2VcIiwgXCJldGhcIiBdO1xuICAvLyBydW5Zb2JpdEJhc2VNa3RDb21wYXJlKGJhc2VNYXJrZXRzLCB5b2JpdE1hcmtldHMpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBydW5Zb2JpdEJhc2VNa3RDb21wYXJlKGJhc2VNYXJrZXRzOiBBcnJheTxzdHJpbmc+LCB5b2JpdE1hcmtldHM6IEFycmF5PHN0cmluZz4pIHtcblxuICAvLyBZb2JpdCBhY2NlcHRzIG11bHRpcGxlIHRpY2tlcnMgaW4gdGhlIFVSTCB1c2luZyBhIGRhc2ggc2VwZXJhdGVkIGZvcm1hdC5cbiAgLy8gRXguIGh0dHBzOi8veW9iaXQubmV0L2FwaS8zL3RpY2tlci9ldGhfYnRjLXplY19idGMtemVjX2V0aFxuICAvL1xuICAvLyBXaWxsIHJldHVybiBkYXRhIGluIHRoZSBmb3JtYXQsXG4gIC8vXG4gIC8vIHtcImV0aF9idGNcIjpcbiAgLy8gICAge1wiaGlnaFwiOjAuMDMzMDksXCJsb3dcIjowLjAzMjM1Mzg4LFwiYXZnXCI6MC4wMzI3MjE5NCxcInZvbFwiOjEwMDguMDY3MDYwNjYsXCJ2b2xfY3VyXCI6MzA2NDAuMjc4MjQ3MjgsXCJsYXN0XCI6MC4wMzI4NjI3NCxcImJ1eVwiOjAuMDMyNzgxODcsXCJzZWxsXCI6MC4wMzI5MTI1OSxcInVwZGF0ZWRcIjoxNTQ4MTY3MTcxfSxcbiAgLy8gIFwiemVjX2J0Y1wiOlxuICAvLyAgICB7XCJoaWdoXCI6MC4wMTQ3MTQwNyxcImxvd1wiOjAuMDE0NDQ0OCxcImF2Z1wiOjAuMDE0NTc5NDMsXCJ2b2xcIjo4NjYuMTIzNzA3MTIsXCJ2b2xfY3VyXCI6NTkxOTEuMTYzNzkxMzMsXCJsYXN0XCI6MC4wMTQ1OTU1NyxcImJ1eVwiOjAuMDE0NTM4NzEsXCJzZWxsXCI6MC4wMTQ2NDg4MixcInVwZGF0ZWRcIjoxNTQ4MTY3MTY4fSxcbiAgLy8gIFwiemVjX2V0aFwiOlxuICAvLyAgICB7XCJoaWdoXCI6MC40NDg1OTIzOSxcImxvd1wiOjAuNDM3MTk5MDQsXCJhdmdcIjowLjQ0Mjg5NTcxLFwidm9sXCI6My40Nzg0MzM1NCxcInZvbF9jdXJcIjo3Ljc3NzcxMTQyLFwibGFzdFwiOjAuNDQ4NTkyMzksXCJidXlcIjowLjQ0MDA4NTk2LFwic2VsbFwiOjAuNDQ4NTkyMzgsXCJ1cGRhdGVkXCI6MTU0ODE2NjA1Mn1cbiAgLy8gfVxuXG4gIC8vIENyZWF0ZSB0aWNrZXIgbGlzdCBpbiBmb3JtYXQgWW9iaXQgd2lsbCBhY2NlcHQuXG4gIGxldCB0aWNrZXJMaXN0U3RyID0gXCJcIjtcbiAgZm9yKGxldCBpPTA7IGk8eW9iaXRNYXJrZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgdGlja2VyTGlzdFN0ciArPSB5b2JpdE1hcmtldHNbaV0gKyBcIl9cIiArIGJhc2VNYXJrZXRzWzBdICsgXCItXCI7XG4gICAgdGlja2VyTGlzdFN0ciArPSB5b2JpdE1hcmtldHNbaV0gKyBcIl9cIiArIGJhc2VNYXJrZXRzWzFdO1xuICAgIGlmIChpIT15b2JpdE1hcmtldHMubGVuZ3RoLTEpXG4gICAgICB0aWNrZXJMaXN0U3RyICs9IFwiLVwiO1xuICAgIGVsc2VcbiAgICAgIHRpY2tlckxpc3RTdHIgKz0gXCItXCIgKyBiYXNlTWFya2V0c1sxXSArIFwiX1wiICsgYmFzZU1hcmtldHNbMF07XG4gIH1cbiAgbGV0IHlvYml0TWt0ID0gYXdhaXQgZ2V0RXhjaGFuZ2VEYXRhKHlvYml0QmFzZVVSTCArIHRpY2tlckxpc3RTdHIpOyAgXG4gIHRyeSB7XG4gICAgbGV0IG1rdERhdGEgPSBKU09OLnBhcnNlKHlvYml0TWt0LmV4Y2hhbmdlRGF0YSk7XG4gICAgLy8gQW5hbHl6ZSBZb2JpdCBtYXJrZXQgbG9va2luZyBmb3IgcHJpY2UgYW5vbW9saWVzXG4gICAgaW50ZXJuYWxDb21wYXJlRm9yWW9iaXQobWt0RGF0YSwgeW9iaXRNYXJrZXRzLCBiYXNlTWFya2V0cyk7XG4gIH1cbiAgY2F0Y2goZSkge1xuICAgIGNvbnNvbGUubG9nKFwiSW52YWxpZCBtYXJrZXQgZGF0YSByZXR1cm5lZCBmcm9tOlwiLCB5b2JpdEJhc2VVUkwpO1xuICAgIGNvbnNvbGUubG9nKFwiRGF0YSBvYmplY3QgcmV0dXJuZWQ6XCIsIHlvYml0TWt0KTtcbiAgfVxufVxuXG5cbi8vIFNldCB0aGUgZGVmYXVsdCBjb3BhcmUgdG8gcnVuLlxubGV0IGNvbXBhcmVUb1J1bjogUHJvbWlzZTx2b2lkPiA9ICBydW5Qb2xvQml0dHJleENvbXBhcmU7XG5pZiAocHJvY2Vzcy5hcmd2Lmxlbmd0aD49Mykge1xuICBpZiAocHJvY2Vzcy5hcmd2WzJdPT09XCJwb2xvaW50ZXJuYWxcIikge1xuICAgIGNvbnNvbGUubG9nKGBSdW5uaW5nIHBvbG9pbnRlcm5hbCBjb21wYXJlLmApO1xuICAgIGNvbXBhcmVUb1J1biA9IHBvbG9JbnRlcm5hbENvbXBhcmU7XG4gIH1cbiAgZWxzZSB7XG4gICAgaWYgKHByb2Nlc3MuYXJndlsyXT09PVwicG9sb2NvaW5iYXNlXCIpIHtcbiAgICAgIGNvbXBhcmVUb1J1biA9IHJ1blBvbG9Db2luYmFzZUNvbXBhcmU7XG4gICAgICBjb25zb2xlLmxvZyhcIlJ1bm5pbmcgUG9sb0NvaW5iYXNlQ29tcGFyZS5cIik7XG4gICAgfVxuICAgIGVsc2UgaWYgKHByb2Nlc3MuYXJndlsyXT09PVwicG9sb2hpdGJ0Y1wiKSB7XG4gICAgICBjb21wYXJlVG9SdW4gPSBydW5Qb2xvSGl0YnRjQ29tcGFyZTtcbiAgICAgIGNvbnNvbGUubG9nKFwiUnVubmluZyBQb2xvSGl0YnRjQ29tcGFyZS5cIilcbiAgICB9XG4gICAgZWxzZSBpZiAocHJvY2Vzcy5hcmd2WzJdPT09XCJwb2xveW9iaXRcIikge1xuICAgICAgY29tcGFyZVRvUnVuID0gcnVuUG9sb1lvYml0Q29tcGFyZTtcbiAgICAgIGNvbnNvbGUubG9nKFwiUnVubmluZyBydW5Qb2xvWW9iaXRDb21wYXJlLlwiKVxuICAgIH1cbiAgICBlbHNlIGlmIChwcm9jZXNzLmFyZ3ZbMl09PT1cInlvYml0aW50ZXJuYWxcIikge1xuICAgICAgY29tcGFyZVRvUnVuID0gcnVuWW9iaXRJbnRlcm5hbENvbXBhcmU7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICBjb25zb2xlLmxvZyhcIlJ1bm5pbmcgZGVmYXVsdCBwb2xvIGJpdHRyZXggY29tcGFyZS5cIik7XG4gICAgfVxuICB9XG59XG5sZXQgbmV3SW50ZXJhbCA9IDEwMDAqKHRpbWVJblNlY29uZHNCZXR3ZWVuUHJpY2VDaGVja3MgKyAyMCpNYXRoLnJhbmRvbSgpKTtcbmNvbnNvbGUubG9nKGBTZXR0aW5nIHRoZSB0aW1lciBpbnRlcnZhbCB0byAke25ld0ludGVyYWwvMTAwMH0gc2Vjb25kcy5gICk7XG5jb21wYXJlVG9SdW4oKTtcbmludGVydmFsSGFuZGVsID0gc2V0SW50ZXJ2YWwoY29tcGFyZVRvUnVuLCBuZXdJbnRlcmFsKTtcbiJdfQ==