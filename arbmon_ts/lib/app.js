"use strict";

var _getCryptoData = require("./utils/getCryptoData");

var _comparePricingData = require("./utils/comparePricingData");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

/* app.ts
 * desc: Main entry point for the crypto exchange price arbitrage monitor.  The event loop that controls
 *       reading exchange data runs from here.  As data is loaded from exchanges it gets passed into
 *       comparPricingResults.js to see if there are any market opportunities.
 */
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
            bittrexJSON = JSON.parse(bittrexALL.exchangeData); // let bittrexBTCCoins: any = {
            //   BTC: ["ardr", "bat", "bnt", "burst", "cvc", "dash", "dcr", "dgb", "doge", "etc", 
            //   "eth", "fct", "game", "gnt", "lbc", "loom", "lsk", "ltc", "mana", "nav", 
            //   "nmr", "nxt", "omg", "poly", "ppc", "qtum", "rep", "sbd", "sc", "snt", 
            //   "steem", "storj", "strat", "sys", "via", "vtc", "xcp", "xem", "xlm", "xmr", 
            //   "xrp", "zec", "zrx"],
            //   ETH: ["BAT", "BNT", "CVC", "ETC", "GNT", "MANA", "OMG", "QTUM", 
            //     "REP", "SNT", "ZEC", "ZRX"],
            //   USDT: ["BAT", "BTC", "DASH", "DOGE", "LTC", "XMR", "XRP"]
            // };

            bittrexBTCCoins = {
              BTC: ["ARDR", "BAT", "BNT", "BURST", "CVC", "DASH", "DCR", "DGB", "DOGE", "ETC", "ETH", "FCT", "GAME", "GNT", "LBC", "LOOM", "LSK", "LTC", "MANA", "NAV", "NMR", "NXT", "OMG", "POLY", "PPC", "QTUM", "REP", "SBD", "SC", "SNT", "STEEM", "STORJ", "STRAT", "SYS", "VIA", "VTC", "XCP", "XEM", "XMR", "XRP", "ZEC", "ZRX"],
              ETH: ["BAT", "BNT", "CVC", "ETC", "GNT", "MANA", "OMG", "QTUM", "REP", "SNT", "ZEC", "ZRX"],
              USDT: ["BAT", "BTC", "DASH", "DOGE", "ETC", "ETH", "LTC", "NXT", "SC", "XMR", "XRP", "ZEC", "ZRX"]
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcHAudHMiXSwibmFtZXMiOlsicmVxdWlyZSIsIlhNTEh0dHBSZXF1ZXN0IiwicG9sb25pZXhVUkwiLCJjb2luYmFzZVVSTCIsImJpdHRyZXhVUkxBbGwiLCJoaXRidGNVUkwiLCJ5b2JpdEJhc2VVUkwiLCJ0aHJlc2hvbGQiLCJudW1iZXJPZkNoZWNrcyIsImludGVydmFsSGFuZGVsIiwibWF4QnV5QXJiIiwibWF4U2VsbEFyYiIsIm1heFNlbGxBcmJFVEgiLCJtYXhTZWxsQXJiWE1SIiwidGltZUluU2Vjb25kc0JldHdlZW5QcmljZUNoZWNrcyIsInBvbG9JbnRlcm5hbENvbXBhcmUiLCJjb25zb2xlIiwibG9nIiwieG1saHR0cCIsIm1ldGhvZCIsInVybCIsIm9wZW4iLCJvbmVycm9yIiwib25yZWFkeXN0YXRlY2hhbmdlIiwicmVhZHlTdGF0ZSIsInN0YXR1cyIsImV4Y2hhbmdlRGF0YSIsInJlc3BvbnNlVGV4dCIsInRpbWVTdGFtcCIsIkRhdGUiLCJleGNoYW5nZU9iamVjdCIsIkpTT04iLCJwYXJzZSIsImNvaW5zIiwiYmFzZVN0YWJsZUNvaW4iLCJhbmFseXplUG9sb0JUQ1ByaWNlcyIsImFuYWx5emVQb2xvRVRIUHJpY2VzIiwiYW5hbHl6ZVBvbG9YTVJQcmljZXMiLCJzZW5kIiwiZXhjaGFuZ2VQcmljZXMiLCJ0aW1lU3RhbXBTdHIiLCJnZXRUaW1lIiwiZm9yRWFjaCIsImN1ckNvaW4iLCJsb3dlc3RBc2tCVEMiLCJsb3dlc3RBc2siLCJoaWdoZXN0QmlkVVNEQyIsImhpZ2hlc3RCaWQiLCJVU0RDX0JUQ2xvd2VzdEFzayIsIkFyYlJhdGlvIiwic2hvd01heCIsIkJUQ19jdXJDb2luQmlkIiwiVVNEQ19CVENCaWQiLCJVU0RDX2N1ckNvaW5Bc2siLCJBbXRJbml0IiwiQW10RmluYWwiLCJFVEhfY3VyQ29pbkJpZCIsIkJUQ19FVEhCaWQiLCJCVENfY3VyQ29pbkFzayIsImluc3RydWN0aW9ucyIsImJhc2VNYXJrZXQiLCJiYXNlTWFya2V0X2N1ckNvaW5CaWQiLCJCVENfYmFzZU1hcmtldEJpZCIsInJ1blBvbG9Db2luYmFzZUNvbXBhcmUiLCJwb2xvbmlleERhdGEiLCJjb2luYmFzZURhdGFaRUMiLCJjb2luYmFzZURhdGFFVEgiLCJjb2luYmFzZURhdGFCVEMiLCJydW5Qb2xvQml0dHJleENvbXBhcmUiLCJiaXR0cmV4QUxMIiwiYml0dHJleEpTT04iLCJiaXR0cmV4QlRDQ29pbnMiLCJCVEMiLCJFVEgiLCJVU0RUIiwiYmFzZU1hcmtldHMiLCJiYXNlTWt0IiwiYml0dHJleFRyaW1tZWQiLCJyZXN1bHQiLCJtYXJrZXQiLCJjb2luIiwiTWFya2V0TmFtZSIsInRvVXBwZXJDYXNlIiwiYml0dHJleENvbXBhcmUiLCJydW5Qb2xvSGl0YnRjQ29tcGFyZSIsImhpdGJ0Y0RhdGEiLCJoaXRidGNKU09OIiwiaGl0YnRjTWFya2V0cyIsImhpdGJ0Y1RyaW1tZWQiLCJzeW1ib2wiLCJoaXRidGNDb21wYXJlIiwicnVuUG9sb1lvYml0Q29tcGFyZSIsInlvYml0TWFya2V0cyIsInRpY2tlckxpc3QiLCJpIiwibGVuZ3RoIiwieW9iaXRVUkwiLCJ5b2JpdERhdGEiLCJydW5Zb2JpdEludGVybmFsQ29tcGFyZSIsInJ1bllvYml0QmFzZU1rdENvbXBhcmUiLCJ0aWNrZXJMaXN0U3RyIiwieW9iaXRNa3QiLCJta3REYXRhIiwiZSIsImNvbXBhcmVUb1J1biIsInByb2Nlc3MiLCJhcmd2IiwibmV3SW50ZXJhbCIsIk1hdGgiLCJyYW5kb20iLCJzZXRJbnRlcnZhbCJdLCJtYXBwaW5ncyI6Ijs7QUFRQTs7QUFDQTs7Ozs7O0FBVEE7Ozs7O0FBTUFBLE9BQU8sQ0FBQyxpQkFBRCxDQUFQOztBQU1BLElBQUlDLGNBQWMsR0FBR0QsT0FBTyxDQUFDLGdCQUFELENBQVAsQ0FBMEJDLGNBQS9DOztBQUVBLElBQU1DLFdBQVcsR0FBRyxrREFBcEI7QUFDQSxJQUFNQyxXQUFXLEdBQUcsdUNBQXBCO0FBQ0EsSUFBTUMsYUFBYSxHQUFHLHdEQUF0QjtB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ZW50IjpbIi8qIGFwcC50c1xuICogZGVzYzogTWFpbiBlbnRyeSBwb2ludCBmb3IgdGhlIGNyeXB0byBleGNoYW5nZSBwcmljZSBhcmJpdHJhZ2UgbW9uaXRvci4gIFRoZSBldmVudCBsb29wIHRoYXQgY29udHJvbHNcbiAqICAgICAgIHJlYWRpbmcgZXhjaGFuZ2UgZGF0YSBydW5zIGZyb20gaGVyZS4gIEFzIGRhdGEgaXMgbG9hZGVkIGZyb20gZXhjaGFuZ2VzIGl0IGdldHMgcGFzc2VkIGludG9cbiAqICAgICAgIGNvbXBhclByaWNpbmdSZXN1bHRzLmpzIHRvIHNlZSBpZiB0aGVyZSBhcmUgYW55IG1hcmtldCBvcHBvcnR1bml0aWVzLlxuICovXG5cbnJlcXVpcmUoXCJAYmFiZWwvcG9seWZpbGxcIik7XG5cbmltcG9ydCB7Z2V0RXhjaGFuZ2VEYXRhfSBmcm9tIFwiLi91dGlscy9nZXRDcnlwdG9EYXRhXCI7XG5pbXBvcnQge2NvbXBhcmVQb2xvbmlleENvaW5iYXNlLCBjb21wYXJlQWxsUG9sb25pZXhCaXR0cmV4LCBjb21wYXJlQWxsUG9sb25pZXhIaXRidGMsXG4gIGNvbXBhcmVBbGxQb2xvbmlleFlvYml0LCBpbnRlcm5hbENvbXBhcmVGb3JZb2JpdH0gZnJvbSBcIi4vdXRpbHMvY29tcGFyZVByaWNpbmdEYXRhXCI7XG5cbmxldCBYTUxIdHRwUmVxdWVzdCA9IHJlcXVpcmUoXCJ4bWxodHRwcmVxdWVzdFwiKS5YTUxIdHRwUmVxdWVzdDtcblxuY29uc3QgcG9sb25pZXhVUkwgPSBcImh0dHBzOi8vcG9sb25pZXguY29tL3B1YmxpYz9jb21tYW5kPXJldHVyblRpY2tlclwiOyBcbmNvbnN0IGNvaW5iYXNlVVJMID0gXCJodHRwczovL2FwaS5wcm8uY29pbmJhc2UuY29tL3Byb2R1Y3RzXCI7IFxuY29uc3QgYml0dHJleFVSTEFsbCA9IFwiaHR0cHM6Ly9iaXR0cmV4LmNvbS9hcGkvdjEuMS9wdWJsaWMvZ2V0bWFya2V0c3VtbWFyaWVzXCI7XG5jb25zdCBoaXRidGNVUkwgPSBcImh0dHBzOi8vYXBpLmhpdGJ0Yy5jb20vYXBpLzIvcHVibGljL3RpY2tlclwiO1xuY29uc3QgeW9iaXRCYXNlVVJMID0gXCJodHRwczovL3lvYml0Lm5ldC9hcGkvMy90aWNrZXIvXCJcbmNvbnN0IHRocmVzaG9sZCA9IDEuMDE7XG5sZXQgbnVtYmVyT2ZDaGVja3MgPSAwO1xubGV0IGludGVydmFsSGFuZGVsID0gLTE7XG5sZXQgbWF4QnV5QXJiID0gMDtcbmxldCBtYXhTZWxsQXJiID0gMDtcbmxldCBtYXhTZWxsQXJiRVRIID0gMDtcbmxldCBtYXhTZWxsQXJiWE1SID0gMDtcblxuY29uc3QgdGltZUluU2Vjb25kc0JldHdlZW5QcmljZUNoZWNrcyA9IDE1O1xuXG4vKiBwb2xvSW50ZXJuYWxDb21wYXJlXG4gKiBkZXNjOiBMb29rcyBmb3IgYXJiaXRyYWdlIHByb2ZpdHMgZnJvbSBzY2VuYXJpb3Mgd2hlcmUgYSBjb2luMSBpcyBleGNoYW5nZWQgZm9yIGNvaW4yLCBjb2luMiBleGNoYW5nZWQgZm9yIGNvaW4zIGFuZCB0aGVuIFxuICogICAgICAgY29pbjMgZXhjaGFuZ2VkIGJhY2sgaW50byBjb2luMS5cbiAqICAgICAgIFRoaXMgY29tcGFyZSBsb29rcyBvbmx5IHdpdGhpbiB0aGUgUG9sb25pZXggZXhjaGFuZ2UuXG4qL1xuZnVuY3Rpb24gcG9sb0ludGVybmFsQ29tcGFyZSgpIHtcblxuICBjb25zb2xlLmxvZyhcIkJFR0lOOiBwb2xvSW50ZXJuYWxDb21wYXJlXCIpO1xuICBsZXQgeG1saHR0cCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpLFxuICAgIG1ldGhvZCA9IFwiR0VUXCIsXG4gICAgdXJsID0gcG9sb25pZXhVUkw7XG5cbiAgY29uc29sZS5sb2coXCJMb2FkaW5nIGRhdGEgZnJvbSA6IEh0dHAuc2VuZChcIiwgdXJsLCBcIilcIik7XG4gIHhtbGh0dHAub3BlbihtZXRob2QsIHVybCwgdHJ1ZSk7XG4gIHhtbGh0dHAub25lcnJvciA9IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zb2xlLmxvZyhcIioqIEFuIGVycm9yIG9jY3VycmVkIGR1cmluZyB0aGUgdHJhbnNhY3Rpb25cIik7XG4gIH07XG4gIHhtbGh0dHAub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMucmVhZHlTdGF0ZT09PTQgJiYgdGhpcy5zdGF0dXM9PT0yMDApIHtcbiAgICAgIGxldCBleGNoYW5nZURhdGEgPSB4bWxodHRwLnJlc3BvbnNlVGV4dDtcbiAgICAgIG51bWJlck9mQ2hlY2tzKys7XG4gICAgICBsZXQgdGltZVN0YW1wID0gbmV3IERhdGUoKTtcbiAgICAgIGxldCBleGNoYW5nZU9iamVjdCA9IEpTT04ucGFyc2UoZXhjaGFuZ2VEYXRhKTtcbiAgICAgIGxldCBjb2lucyA9IFtcIkZPQU1cIiwgXCJaRUNcIiwgXCJMVENcIiwgXCJFVEhcIiwgXCJYUlBcIiwgXCJTVFJcIiwgXCJYTVJcIiwgXCJET0dFXCIsIFwiQkNIQUJDXCIsIFwiQkNIU1ZcIl07XG4gICAgICBsZXQgYmFzZVN0YWJsZUNvaW4gPSBcIlVTRENcIjtcbiAgICAgIGFuYWx5emVQb2xvQlRDUHJpY2VzKGV4Y2hhbmdlT2JqZWN0LCBiYXNlU3RhYmxlQ29pbiwgY29pbnMsIHRpbWVTdGFtcCk7XG4gICAgICBjb2lucyA9IFtcIkJBVFwiLCBcIkJOVFwiLCBcIkRBU0hcIiwgXCJET0dFXCIsIFwiRU9TXCIsIFwiRVRDXCIsIFwiRVRIXCIsIFwiR05UXCIsIFwiS05DXCIsIFwiTE9PTVwiLCBcIkxTS1wiLFxuICAgICAgICBcIkxUQ1wiLCBcIk1BTkFcIiwgXCJOWFRcIiwgXCJRVFVNXCIsIFwiUkVQXCIsIFwiU0NcIiwgXCJTTlRcIiwgXCJTVFJcIiwgXCJYTVJcIiwgXCJYUlBcIiwgXCJaRUNcIiwgXCJaUlhcIl07XG4gICAgICBiYXNlU3RhYmxlQ29pbiA9IFwiVVNEVFwiOyBcbiAgICAgIGFuYWx5emVQb2xvQlRDUHJpY2VzKGV4Y2hhbmdlT2JqZWN0LCBiYXNlU3RhYmxlQ29pbiwgY29pbnMsIHRpbWVTdGFtcCk7XG4gICAgICBhbmFseXplUG9sb0VUSFByaWNlcyhleGNoYW5nZU9iamVjdCwgdGltZVN0YW1wKTtcbiAgICAgIGFuYWx5emVQb2xvWE1SUHJpY2VzKGV4Y2hhbmdlT2JqZWN0LCB0aW1lU3RhbXApO1xuICAgIH1cbiAgfVxuICB4bWxodHRwLnNlbmQoKTtcbiAgY29uc29sZS5sb2coXCJFTkQ6IHBvbG9JbnRlcm5hbENvbXBhcmVcIik7XG59XG5cbi8qIGFuYWx5emVQb2xvQlRDUHJpY2VzXG4gKiBkZXNjOiBUYWtlcyB0aGUgZXhjaGFuZ2UgcHJpY2VzIGZyb20gUG9sb25pZXggYW5kIGRvZXMgdGhlIGRldGFpbGVkIGNvbXBhcmVzIHRvIGZpbmQgYXJiaXRyYWdlXG4gKiAgICAgICB3aXRoaW4gdGhpcyBleGNoYW5nZS4gIEl0IGRvZXMgdGhpcyBmb3IgdGhlIEJUQyBtYXJrZXQuXG4gKi9cbmZ1bmN0aW9uIGFuYWx5emVQb2xvQlRDUHJpY2VzKGV4Y2hhbmdlUHJpY2VzOiBhbnksIGJhc2VTdGFibGVDb2luOiBcbiAgc3RyaW5nLCBjb2luczogQXJyYXk8c3RyaW5nPiwgdGltZVN0YW1wOiBEYXRlKSB7XG5cbiAgbGV0IHRpbWVTdGFtcFN0ciA9IHRpbWVTdGFtcC5nZXRUaW1lKCk7XG4gIGNvbnNvbGUubG9nKGBwcmljZUNoZWNrQ291bnQ6JHtudW1iZXJPZkNoZWNrc318JHtiYXNlU3RhYmxlQ29pbn18bWF4QnV5QXJiOiR7bWF4QnV5QXJifXxtYXhTZWxsQXJiOiR7bWF4U2VsbEFyYn1gKTtcbiAgLy8gQ2hlY2sgaWYgYnV5aW5nIHRoZSBjb2luIHdpbGwgYmUgcHJvZml0YWJsZS5cbiAgY29pbnMuZm9yRWFjaChjdXJDb2luID0+IHtcbiAgICBsZXQgbG93ZXN0QXNrQlRDID0gZXhjaGFuZ2VQcmljZXNbXCJCVENfXCIgKyBjdXJDb2luXS5sb3dlc3RBc2s7XG4gICAgbGV0IGhpZ2hlc3RCaWRVU0RDID0gZXhjaGFuZ2VQcmljZXNbYmFzZVN0YWJsZUNvaW4gKyBcIl9cIiArIGN1ckNvaW5dLmhpZ2hlc3RCaWQ7XG4gICAgbGV0IFVTRENfQlRDbG93ZXN0QXNrID0gZXhjaGFuZ2VQcmljZXNbYmFzZVN0YWJsZUNvaW4gKyBcIl9cIiArIFwiQlRDXCJdLmxvd2VzdEFzaztcbiAgICBsZXQgQXJiUmF0aW8gPSBoaWdoZXN0QmlkVVNEQyAvICggbG93ZXN0QXNrQlRDICogIFVTRENfQlRDbG93ZXN0QXNrKTtcbiAgICBsZXQgc2hvd01heCA9IFwiXCI7XG4gICAgaWYgKEFyYlJhdGlvPm1heEJ1eUFyYikge1xuICAgICAgbWF4QnV5QXJiID0gQXJiUmF0aW87XG4gICAgICBzaG93TWF4ID0gXCJOZXdNYXhcIjtcbiAgICB9XG4gICAgaWYgKEFyYlJhdGlvPjEuMClcbiAgICAgIGNvbnNvbGUubG9nKGBSRUN8JHt0aW1lU3RhbXB9fCR7dGltZVN0YW1wU3RyfXxCdXl8JHtiYXNlU3RhYmxlQ29pbn18JHtjdXJDb2lufXxBcmJSYXRpbzoke0FyYlJhdGlvfXwke3Nob3dNYXh9YCk7XG4gICAgaWYgKEFyYlJhdGlvID4gdGhyZXNob2xkKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIlNvbWV0aGluZyBkcmFtYXRpYyBuZWVkcyB0byBoYXBwZW4hXCIpO1xuICAgIH1cbiAgfSk7XG4gIC8vIENoZWNrIGlmIHNlbGxpbmcgdGhlIGNvaW4gd2lsbCBiZSBwcm9maXRhYmxlXG4gIGNvaW5zLmZvckVhY2goY3VyQ29pbiA9PiB7XG4gICAgbGV0IEJUQ19jdXJDb2luQmlkID0gZXhjaGFuZ2VQcmljZXNbXCJCVENfXCIrY3VyQ29pbl0uaGlnaGVzdEJpZDtcbiAgICBsZXQgVVNEQ19CVENCaWQgPSBleGNoYW5nZVByaWNlc1tiYXNlU3RhYmxlQ29pbiArIFwiX1wiICsgXCJCVENcIl0uaGlnaGVzdEJpZDtcbiAgICBsZXQgVVNEQ19jdXJDb2luQXNrID0gZXhjaGFuZ2VQcmljZXNbYmFzZVN0YWJsZUNvaW4gKyBcIl9cIiArY3VyQ29pbl0ubG93ZXN0QXNrO1xuICAgIGxldCBBbXRJbml0ID0gMTAwMDA7XG4gICAgbGV0IEFtdEZpbmFsID0gQW10SW5pdCpCVENfY3VyQ29pbkJpZCpVU0RDX0JUQ0JpZC9VU0RDX2N1ckNvaW5Bc2s7XG4gICAgbGV0IEFyYlJhdGlvID0gQW10RmluYWwvQW10SW5pdDtcbiAgICBsZXQgc2hvd01heCA9IFwiXCI7XG4gICAgaWYgKEFyYlJhdGlvPm1heFNlbGxBcmIpIHtcbiAgICAgIG1heFNlbGxBcmIgPSBBcmJSYXRpbztcbiAgICAgIHNob3dNYXggPSBcIk5ld01heFwiO1xuICAgIH1cbiAgICBpZiAoQXJiUmF0aW8+MS4wKVxuICAgICAgY29uc29sZS5sb2coYFJFQ3wke3RpbWVTdGFtcH18JHt0aW1lU3RhbXBTdHJ9fFNlbGx8JHtiYXNlU3RhYmxlQ29pbn18JHtjdXJDb2lufXxBcmJSYXRpbzoke0FyYlJhdGlvfXwke3Nob3dNYXh9YCk7XG4gICAgaWYgKEFyYlJhdGlvID4gdGhyZXNob2xkKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIlNvbWV0aGluZyBkcmFtYXRpYyBuZWVkcyB0byBoYXBwZW4hXCIpO1xuICAgIH1cbiAgfSk7XG59XG5cbi8qIGFuYWx5emVQb2xvRVRIUHJpY2VzXG4gKiBkZXNjOiBUYWtlcyB0aGUgZXhjaGFuZ2UgcHJpY2VzIGZyb20gUG9sb25pZXggYW5kIGRvZXMgdGhlIGRldGFpbGVkIGNvbXBhcmVzIHRvIGZpbmQgYXJiaXRyYWdlXG4gKiAgICAgICB3aXRoaW4gdGhpcyBleGNoYW5nZSBmb3IgdGhlaXIgRVRIIG1hcmtldC5cbiAqL1xuZnVuY3Rpb24gYW5hbHl6ZVBvbG9FVEhQcmljZXMoZXhjaGFuZ2VQcmljZXM6IGFueSwgdGltZVN0YW1wOiBEYXRlKSB7XG5cbiAgbGV0IHRpbWVTdGFtcFN0ciA9IHRpbWVTdGFtcC5nZXRUaW1lKCk7XG4gIGNvbnNvbGUubG9nKGBwcmljZUNoZWNrQ291bnQ6JHtudW1iZXJPZkNoZWNrc318RVRIfG1heEJ1eUFyYjpOL0F8bWF4U2VsbEFyYkVUSDoke21heFNlbGxBcmJFVEh9YCk7XG4gIGxldCBjb2lucyA9IFtcIkJBVFwiLCBcIkJOVFwiLCBcIkNWQ1wiLCBcIkVPU1wiLCBcIkVUQ1wiLCBcIkdBU1wiLCBcIkdOVFwiLCBcIktOQ1wiLCBcIkxPT01cIiwgXCJMU0tcIiwgXG4gICAgXCJNQU5BXCIsIFwiT01HXCIsIFwiUVRVTVwiLCBcIlJFUFwiLCBcIlNOVFwiLCBcIlNURUVNXCIsIFwiWkVDXCIsIFwiWlJYXCJdO1xuICAvLyBDaGVjayBpZiBzZWxsaW5nIHRoZSBjb2luIHdpbGwgYmUgcHJvZml0YWJsZVxuICBjb2lucy5mb3JFYWNoKGN1ckNvaW4gPT4ge1xuICAgIGxldCBFVEhfY3VyQ29pbkJpZCA9IGV4Y2hhbmdlUHJpY2VzW1wiRVRIX1wiK2N1ckNvaW5dLmhpZ2hlc3RCaWQ7XG4gICAgbGV0IEJUQ19FVEhCaWQgPSBleGNoYW5nZVByaWNlc1tcIkJUQ19FVEhcIl0uaGlnaGVzdEJpZDtcbiAgICBsZXQgQlRDX2N1ckNvaW5Bc2sgPSBleGNoYW5nZVByaWNlc1tcIkJUQ19cIitjdXJDb2luXS5sb3dlc3RBc2s7XG4gICAgbGV0IEFtdEluaXQgPSAxO1xuICAgIGxldCBBbXRGaW5hbCA9IEFtdEluaXQqQlRDX0VUSEJpZCpFVEhfY3VyQ29pbkJpZC9CVENfY3VyQ29pbkFzaztcbiAgICBsZXQgQXJiUmF0aW8gPSBBbXRGaW5hbC9BbXRJbml0O1xuICAgIGxldCBzaG93TWF4ID0gXCJcIjtcbiAgICBpZiAoQXJiUmF0aW8+bWF4U2VsbEFyYkVUSCkge1xuICAgICAgbWF4U2VsbEFyYkVUSCA9IEFyYlJhdGlvO1xuICAgICAgc2hvd01heCA9IFwiTmV3TWF4XCI7XG4gICAgfVxuICAgIGlmIChBcmJSYXRpbz4xLjApXG4gICAgICBjb25zb2xlLmxvZyhgUkVDfCR7dGltZVN0YW1wfXwke3RpbWVTdGFtcFN0cn18U2VsbHwke2N1ckNvaW59fEVUSHxBcmJSYXRpbzoke0FyYlJhdGlvfXwke3Nob3dNYXh9YCk7XG4gICAgaWYgKEFyYlJhdGlvID4gdGhyZXNob2xkKSB7XG4gICAgICBsZXQgaW5zdHJ1Y3Rpb25zID0gYEFMRVJUOiBTZWxsICR7QW10SW5pdH0gJHtjdXJDb2lufSBmb3IgJHtBbXRJbml0KkVUSF9jdXJDb2luQmlkfSBFVEgsIFxuICAgICAgICB0aGVuIHNlbGwgdGhvc2UgRVRIIGZvciAke0FtdEluaXQqRVRIX2N1ckNvaW5CaWQqQlRDX0VUSEJpZH0gQlRDLFxuICAgICAgICB0aGVuIHVzZSB0aG9zZSBCVEMgdG8gYnV5ICR7QW10RmluYWx9ICR7Y3VyQ29pbn1gO1xuICAgICAgY29uc29sZS5sb2coaW5zdHJ1Y3Rpb25zKTtcbiAgICB9XG4gIH0pO1xufVxuXG4vKiBhbmFseXplUG9sb1hNUlByaWNlc1xuICogZGVzYzogVGFrZXMgdGhlIGV4Y2hhbmdlIHByaWNlcyBmcm9tIFBvbG9uaWV4IGFuZCBkb2VzIHRoZSBkZXRhaWxlZCBjb21wYXJlcyB0byBmaW5kIGFyYml0cmFnZVxuICogICAgICAgd2l0aGluIHRoaXMgZXhjaGFuZ2UgZm9yIHRoZWlyIFhSTSBtYXJrZXQuXG4gKi9cbmZ1bmN0aW9uIGFuYWx5emVQb2xvWE1SUHJpY2VzKGV4Y2hhbmdlUHJpY2VzOiBhbnksIHRpbWVTdGFtcDogRGF0ZSkge1xuXG4gIGxldCB0aW1lU3RhbXBTdHIgPSB0aW1lU3RhbXAuZ2V0VGltZSgpO1xuICBjb25zb2xlLmxvZyhgcHJpY2VDaGVja0NvdW50OiR7bnVtYmVyT2ZDaGVja3N9fFhNUnxtYXhCdXlBcmI6Ti9BfG1heFNlbGxBcmJYTVI6JHttYXhTZWxsQXJiWE1SfWApO1xuICBsZXQgY29pbnMgPSBbXCJMVENcIiwgXCJaRUNcIiwgXCJOWFRcIiwgXCJEQVNIXCIsIFwiQkNOXCIsIFwiTUFJRFwiXTtcbiAgLy8gQ2hlY2sgaWYgc2VsbGluZyB0aGUgY29pbiB3aWxsIGJlIHByb2ZpdGFibGVcbiAgY29pbnMuZm9yRWFjaChjdXJDb2luID0+IHtcbiAgICBsZXQgYmFzZU1hcmtldCA9IFwiWE1SXCI7XG4gICAgbGV0IGJhc2VNYXJrZXRfY3VyQ29pbkJpZCA9IGV4Y2hhbmdlUHJpY2VzW2Jhc2VNYXJrZXQgKyBcIl9cIiArIGN1ckNvaW5dLmhpZ2hlc3RCaWQ7XG4gICAgbGV0IEJUQ19iYXNlTWFya2V0QmlkID0gZXhjaGFuZ2VQcmljZXNbXCJCVENcIiArIFwiX1wiICsgYmFzZU1hcmtldF0uaGlnaGVzdEJpZDtcbiAgICBsZXQgQlRDX2N1ckNvaW5Bc2sgPSBleGNoYW5nZVByaWNlc1tcIkJUQ1wiICsgXCJfXCIgKyBjdXJDb2luXS5sb3dlc3RBc2s7XG4gICAgbGV0IEFtdEluaXQgPSAxO1xuICAgIGxldCBBbXRGaW5hbCA9IEFtdEluaXQqQlRDX2Jhc2VNYXJrZXRCaWQqYmFzZU1hcmtldF9jdXJDb2luQmlkL0JUQ19jdXJDb2luQXNrO1xuICAgIGxldCBBcmJSYXRpbyA9IEFtdEZpbmFsL0FtdEluaXQ7XG4gICAgbGV0IHNob3dNYXggPSBcIlwiO1xuICAgIGlmIChBcmJSYXRpbz5tYXhTZWxsQXJiWE1SKSB7XG4gICAgICBtYXhTZWxsQXJiWE1SID0gQXJiUmF0aW87XG4gICAgICBzaG93TWF4ID0gXCJOZXdNYXhcIjtcbiAgICB9XG4gICAgaWYgKEFyYlJhdGlvPjEuMClcbiAgICAgIGNvbnNvbGUubG9nKGBSRUN8JHt0aW1lU3RhbXB9fCR7dGltZVN0YW1wU3RyfXxTZWxsfCR7Y3VyQ29pbn18WE1SfEFyYlJhdGlvOiR7QXJiUmF0aW99fCR7c2hvd01heH1gKTtcbiAgICBpZiAoQXJiUmF0aW8gPiB0aHJlc2hvbGQpIHtcbiAgICAgIGxldCBpbnN0cnVjdGlvbnMgPSBgQUxFUlQ6IFNlbGwgJHtBbXRJbml0fSAke2N1ckNvaW59IGZvciAke0FtdEluaXQqYmFzZU1hcmtldF9jdXJDb2luQmlkfSBYTVIsIFxuICAgICAgICB0aGVuIHNlbGwgdGhvc2UgWE1SIGZvciAke0FtdEluaXQqQlRDX2Jhc2VNYXJrZXRCaWQqYmFzZU1hcmtldF9jdXJDb2luQmlkfSBCVEMsXG4gICAgICAgIHRoZW4gdXNlIHRob3NlIEJUQyB0byBidXkgJHtBbXRGaW5hbH0gJHtjdXJDb2lufWA7XG4gICAgICBjb25zb2xlLmxvZyhpbnN0cnVjdGlvbnMpO1xuICAgIH1cbiAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJ1blBvbG9Db2luYmFzZUNvbXBhcmUoKSB7XG4gIGxldCBwb2xvbmlleERhdGEgPSBhd2FpdCBnZXRFeGNoYW5nZURhdGEocG9sb25pZXhVUkwpO1xuICBsZXQgY29pbmJhc2VEYXRhWkVDID0gYXdhaXQgZ2V0RXhjaGFuZ2VEYXRhKGNvaW5iYXNlVVJMK1wiL1pFQy1VU0RDL2Jvb2tcIik7XG4gIGxldCBjb2luYmFzZURhdGFFVEggPSBhd2FpdCBnZXRFeGNoYW5nZURhdGEoY29pbmJhc2VVUkwrXCIvRVRILVVTREMvYm9va1wiKTtcbiAgbGV0IGNvaW5iYXNlRGF0YUJUQyA9IGF3YWl0IGdldEV4Y2hhbmdlRGF0YShjb2luYmFzZVVSTCtcIi9CVEMtVVNEQy9ib29rXCIpO1xuICBjb21wYXJlUG9sb25pZXhDb2luYmFzZShwb2xvbmlleERhdGEsIGNvaW5iYXNlRGF0YVpFQywgXCJaRUNcIik7XG4gIGNvbXBhcmVQb2xvbmlleENvaW5iYXNlKHBvbG9uaWV4RGF0YSwgY29pbmJhc2VEYXRhRVRILCBcIkVUSFwiKTtcbiAgY29tcGFyZVBvbG9uaWV4Q29pbmJhc2UocG9sb25pZXhEYXRhLCBjb2luYmFzZURhdGFCVEMsIFwiQlRDXCIpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBydW5Qb2xvQml0dHJleENvbXBhcmUoKSB7XG5cbiAgbnVtYmVyT2ZDaGVja3MrKztcbiAgLy8gUG9sb25pZXggc2VjdGlvbiAtIEFsbCBjb2lucyBmcm9tIG9uZSByZXF1ZXN0XG4gIGxldCBwb2xvbmlleERhdGEgPSBhd2FpdCBnZXRFeGNoYW5nZURhdGEocG9sb25pZXhVUkwpO1xuICAvLyBCaXR0cmV4IHNlY3Rpb24gLSBBbGwgY29pbnMgZnJvbSBvbmUgcmVxdWVzdC5cbiAgbGV0IGJpdHRyZXhBTEwgPSBhd2FpdCBnZXRFeGNoYW5nZURhdGEoYml0dHJleFVSTEFsbCk7XG4gIGxldCBiaXR0cmV4SlNPTjogYW55ID0gSlNPTi5wYXJzZShiaXR0cmV4QUxMLmV4Y2hhbmdlRGF0YSk7XG4gIC8vIGxldCBiaXR0cmV4QlRDQ29pbnM6IGFueSA9IHtcbiAgLy8gICBCVEM6IFtcImFyZHJcIiwgXCJiYXRcIiwgXCJibnRcIiwgXCJidXJzdFwiLCBcImN2Y1wiLCBcImRhc2hcIiwgXCJkY3JcIiwgXCJkZ2JcIiwgXCJkb2dlXCIsIFwiZXRjXCIsIFxuICAvLyAgIFwiZXRoXCIsIFwiZmN0XCIsIFwiZ2FtZVwiLCBcImdudFwiLCBcImxiY1wiLCBcImxvb21cIiwgXCJsc2tcIiwgXCJsdGNcIiwgXCJtYW5hXCIsIFwibmF2XCIsIFxuICAvLyAgIFwibm1yXCIsIFwibnh0XCIsIFwib21nXCIsIFwicG9seVwiLCBcInBwY1wiLCBcInF0dW1cIiwgXCJyZXBcIiwgXCJzYmRcIiwgXCJzY1wiLCBcInNudFwiLCBcbiAgLy8gICBcInN0ZWVtXCIsIFwic3RvcmpcIiwgXCJzdHJhdFwiLCBcInN5c1wiLCBcInZpYVwiLCBcInZ0Y1wiLCBcInhjcFwiLCBcInhlbVwiLCBcInhsbVwiLCBcInhtclwiLCBcbiAgLy8gICBcInhycFwiLCBcInplY1wiLCBcInpyeFwiXSxcbiAgLy8gICBFVEg6IFtcIkJBVFwiLCBcIkJOVFwiLCBcIkNWQ1wiLCBcIkVUQ1wiLCBcIkdOVFwiLCBcIk1BTkFcIiwgXCJPTUdcIiwgXCJRVFVNXCIsIFxuICAvLyAgICAgXCJSRVBcIiwgXCJTTlRcIiwgXCJaRUNcIiwgXCJaUlhcIl0sXG4gIC8vICAgVVNEVDogW1wiQkFUXCIsIFwiQlRDXCIsIFwiREFTSFwiLCBcIkRPR0VcIiwgXCJMVENcIiwgXCJYTVJcIiwgXCJYUlBcIl1cbiAgLy8gfTtcbiAgbGV0IGJpdHRyZXhCVENDb2luczogYW55ID0ge1xuICAgIEJUQzogW1wiQVJEUlwiLFwiQkFUXCIsXCJCTlRcIixcIkJVUlNUXCIsXCJDVkNcIixcIkRBU0hcIixcIkRDUlwiLFwiREdCXCIsXCJET0dFXCIsXCJFVENcIixcIkVUSFwiLFwiRkNUXCIsXCJHQU1FXCIsXG4gICAgICBcIkdOVFwiLFwiTEJDXCIsXCJMT09NXCIsXCJMU0tcIixcIkxUQ1wiLFwiTUFOQVwiLFwiTkFWXCIsXCJOTVJcIixcIk5YVFwiLFwiT01HXCIsXCJQT0xZXCIsXCJQUENcIixcIlFUVU1cIixcIlJFUFwiLFwiU0JEXCIsXG4gICAgICBcIlNDXCIsXCJTTlRcIixcIlNURUVNXCIsXCJTVE9SSlwiLFwiU1RSQVRcIixcIlNZU1wiLFwiVklBXCIsXCJWVENcIixcIlhDUFwiLFwiWEVNXCIsXCJYTVJcIixcIlhSUFwiLFwiWkVDXCIsXCJaUlhcIl0sXG4gICAgRVRIOiBbXCJCQVRcIixcIkJOVFwiLFwiQ1ZDXCIsXCJFVENcIixcIkdOVFwiLFwiTUFOQVwiLFwiT01HXCIsXCJRVFVNXCIsXCJSRVBcIixcIlNOVFwiLFwiWkVDXCIsXCJaUlhcIl0sXG4gICAgVVNEVDogW1wiQkFUXCIsXCJCVENcIixcIkRBU0hcIixcIkRPR0VcIixcIkVUQ1wiLFwiRVRIXCIsXCJMVENcIixcIk5YVFwiLFwiU0NcIixcIlhNUlwiLFwiWFJQXCIsXCJaRUNcIixcIlpSWFwiXVxuICB9O1xuXG4gIGxldCBiYXNlTWFya2V0cyA9IFtcIkJUQ1wiLCBcIkVUSFwiLCBcIlVTRFRcIl07XG4gIGJhc2VNYXJrZXRzLmZvckVhY2goKGJhc2VNa3Q6IHN0cmluZykgPT4ge1xuICAgIGNvbnNvbGUubG9nKFwiUHJvY2Vzc2luZyBiYXNlbWt0OlwiLCBiYXNlTWt0KTtcbiAgICBsZXQgYml0dHJleFRyaW1tZWQ6IGFueSA9IHt9O1xuICAgIGJpdHRyZXhKU09OLnJlc3VsdC5mb3JFYWNoKChtYXJrZXQ6IGFueSkgPT4ge1xuICAgICAgYml0dHJleEJUQ0NvaW5zW2Jhc2VNa3RdLmZvckVhY2goKGNvaW46IHN0cmluZykgPT4ge1xuICAgICAgICBsZXQgTWFya2V0TmFtZSA9IGJhc2VNa3QrXCItXCIrY29pbi50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAvL2NvbnNvbGUubG9nKFwiTWFya2V0TmFtZTpcIiwgTWFya2V0TmFtZSk7XG4gICAgICAgIGlmIChtYXJrZXQuTWFya2V0TmFtZT09PU1hcmtldE5hbWUpIHtcbiAgICAgICAgICBiaXR0cmV4VHJpbW1lZFtNYXJrZXROYW1lXSA9IG1hcmtldDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgbGV0IGJpdHRyZXhDb21wYXJlOiBhbnkgPSB7fTtcbiAgICBiaXR0cmV4Q29tcGFyZS50aW1lU3RhbXAgPSBiaXR0cmV4QUxMLnRpbWVTdGFtcDtcbiAgICBiaXR0cmV4Q29tcGFyZS5leGNoYW5nZURhdGEgPSBiaXR0cmV4VHJpbW1lZDtcbiAgICBjb21wYXJlQWxsUG9sb25pZXhCaXR0cmV4KHBvbG9uaWV4RGF0YSwgYml0dHJleENvbXBhcmUpO1xuICB9KTtcbiAgY29uc29sZS5sb2coYENvbXBhcmUgY3ljbGUgJHtudW1iZXJPZkNoZWNrc30gY29tcGxldGUuYClcbn1cblxuXG5hc3luYyBmdW5jdGlvbiBydW5Qb2xvSGl0YnRjQ29tcGFyZSgpIHtcblxuICBudW1iZXJPZkNoZWNrcysrO1xuICAvLyBQb2xvbmlleCBzZWN0aW9uIC0gQWxsIGNvaW5zIGZyb20gb25lIHJlcXVlc3RcbiAgbGV0IHBvbG9uaWV4RGF0YSA9IGF3YWl0IGdldEV4Y2hhbmdlRGF0YShwb2xvbmlleFVSTCk7XG4gIC8vIEJpdHRyZXggc2VjdGlvbiAtIEFsbCBjb2lucyBmcm9tIG9uZSByZXF1ZXN0LlxuICAvLyBCaXR0cmV4IG1hcmtldCBzdW1tYXJ5IC0gQWxsIGNvaW5zIGZyb20gb25lIHJlcXVlc3QuXG4gIGxldCBoaXRidGNEYXRhID0gYXdhaXQgZ2V0RXhjaGFuZ2VEYXRhKGhpdGJ0Y1VSTCk7ICBcbiAgbGV0IGhpdGJ0Y0pTT04gPSBKU09OLnBhcnNlKGhpdGJ0Y0RhdGEuZXhjaGFuZ2VEYXRhKTtcbiAgbGV0IGhpdGJ0Y01hcmtldHM6IEFycmF5PHN0cmluZz4gPSBbXG4gICAgXCJCQ05CVENcIiwgXCJCTlRVU0RUXCIsIFwiREFTSEJUQ1wiLCBcIkRBU0hVU0RUXCIsIFwiREdCQlRDXCIsIFwiRE9HRUJUQ1wiLCBcbiAgICBcIkRPR0VVU0RUXCIsIFwiRU9TQlRDXCIsIFwiRU9TVVNEVFwiLCBcIkVUQ1VTRFRcIiwgXCJFVEhCVENcIiwgXG4gICAgXCJFVEhVU0RUXCIsIFwiTFNLQlRDXCIsIFwiTUFJREJUQ1wiLCBcIk1BTkFCVENcIiwgXG4gICAgXCJPTUdCVENcIiwgXCJQUENCVENcIiwgXCJRVFVNUFBDXCIsIFwiUkVQQlRDXCIsIFwiUkVQVVNEVFwiLCBcbiAgICBcIlhFTUJUQ1wiLCBcIlpFQ0VUSFwiIFxuICBdO1xuXG4gIGxldCBoaXRidGNUcmltbWVkOiBhbnkgPSB7fTtcbiAgaGl0YnRjTWFya2V0cy5mb3JFYWNoKG1hcmtldCA9PiB7XG4gICAgaGl0YnRjSlNPTi5mb3JFYWNoKChleGNoYW5nZURhdGE6IGFueSkgPT4ge1xuICAgICAgaWYoZXhjaGFuZ2VEYXRhLnN5bWJvbD09PW1hcmtldClcbiAgICAgICAgaGl0YnRjVHJpbW1lZFttYXJrZXRdID0gZXhjaGFuZ2VEYXRhO1xuICAgIH0pOyAgICAgXG4gIH0pO1xuICBsZXQgaGl0YnRjQ29tcGFyZTogYW55ID0ge307XG4gIGhpdGJ0Y0NvbXBhcmUudGltZVN0YW1wID0gaGl0YnRjRGF0YS50aW1lU3RhbXA7XG4gIGhpdGJ0Y0NvbXBhcmUuZXhjaGFuZ2VEYXRhID0gaGl0YnRjVHJpbW1lZDtcbiAgY29tcGFyZUFsbFBvbG9uaWV4SGl0YnRjKHBvbG9uaWV4RGF0YSwgaGl0YnRjQ29tcGFyZSk7XG59XG5cblxuYXN5bmMgZnVuY3Rpb24gcnVuUG9sb1lvYml0Q29tcGFyZSgpIHtcblxuICBudW1iZXJPZkNoZWNrcysrO1xuICAvLyBQb2xvbmlleCBzZWN0aW9uIC0gQWxsIGNvaW5zIGZyb20gb25lIHJlcXVlc3RcbiAgbGV0IHBvbG9uaWV4RGF0YSA9IGF3YWl0IGdldEV4Y2hhbmdlRGF0YShwb2xvbmlleFVSTCk7XG4gIC8vIEJpdHRyZXggc2VjdGlvbiAtIEFsbCBjb2lucyBmcm9tIG9uZSByZXF1ZXN0LlxuICAvLyBCaXR0cmV4IG1hcmtldCBzdW1tYXJ5IC0gQWxsIGNvaW5zIGZyb20gb25lIHJlcXVlc3QuXG4gIGxldCB5b2JpdE1hcmtldHMgPSBbXG4gICAgXCJsdGNfYnRjXCIsIFwiZXRoX2J0Y1wiXG4gIF07XG4gIGxldCB0aWNrZXJMaXN0ID0gXCJcIjtcbiAgZm9yKGxldCBpPTA7IGk8eW9iaXRNYXJrZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgdGlja2VyTGlzdCArPSB5b2JpdE1hcmtldHNbaV07XG4gICAgaWYgKGkhPXlvYml0TWFya2V0cy5sZW5ndGgtMSlcbiAgICAgIHRpY2tlckxpc3QgKz0gXCItXCI7XG4gIH1cbiAgbGV0IHlvYml0VVJMID0geW9iaXRCYXNlVVJMICsgdGlja2VyTGlzdDtcbiAgY29uc29sZS5sb2coXCJSdW4gcXVlcnkgZm9yIGRhdGEgYXQ6XCIsIHlvYml0VVJMKTtcbiAgbGV0IHlvYml0RGF0YSA9IGF3YWl0IGdldEV4Y2hhbmdlRGF0YSh5b2JpdFVSTCk7ICBcbiAgY29uc29sZS5sb2coXCJ5b2JpdERhdGE6XCIsIHlvYml0RGF0YSk7XG4gIGNvbXBhcmVBbGxQb2xvbmlleFlvYml0KHBvbG9uaWV4RGF0YSwgeW9iaXREYXRhKTtcbn1cblxuLyogcnVuWW9iaXRJbnRlcm5hbENvbXBhcmVcbiAqIGRlc2M6IENoZWNrcyBpbnRlbnJhbCBwcmljZXMgZm9yIHRoZSBZb2JpdCBleGNoYW5nZSB0byBzZWUgaWYgYW55IGNhc2VzIGV4aXN0IHdpdGhcbiAqICAgICAgIHRoZSBBcmIgRmFjdG9yIGlzIGdyZWF0ZXIgdGhhbiBvbmUuXG4gKi9cbmZ1bmN0aW9uIHJ1bllvYml0SW50ZXJuYWxDb21wYXJlKCkge1xuXG4gIG51bWJlck9mQ2hlY2tzKys7XG4gIGxldCB5b2JpdE1hcmtldHMgPSBbXG4gICAgICBcInplY1wiLCBcImxza1wiLCBcImV0Y1wiLCBcImx0Y1wiLCBcImZ0b1wiLCBcImVkcjJcIiwgXCJsYnJcIiwgXCJiYW5cIiwgXCJraW5cIiwgXCJuYnRcIixcbiAgICAgIFwicm50YlwiLCBcImJ1bm55XCIsIFwidHJ4XCIsIFwia2JjXCIsIFwidnJ0bVwiLCBcImh1clwiLCBcIm5vYWhcIiwgXCJ4cnBcIiwgXCJkb2dlXCIsIFxuICAgICAgXCJlZGl0XCIsIFwiZXZuXCIsIFwiZXhtclwiLCBcInBheXBcIiwgXCJ5b3ppXCIsIFwid2F2ZXNcIiwgXCJueWNcIixcbiAgICAgIFwiZGdiXCIsIFwiZHV4XCIsIFwiZGFzaFwiXTtcbiAgbGV0IGJhc2VNYXJrZXRzID0gW1xuICAgICAgXCJidGNcIiwgXCJldGhcIlxuICAgIF07XG4gIHJ1bllvYml0QmFzZU1rdENvbXBhcmUoYmFzZU1hcmtldHMsIHlvYml0TWFya2V0cyk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJ1bllvYml0QmFzZU1rdENvbXBhcmUoYmFzZU1hcmtldHM6IEFycmF5PHN0cmluZz4sIHlvYml0TWFya2V0czogQXJyYXk8c3RyaW5nPikge1xuXG4gIC8vIFlvYml0IGFjY2VwdHMgbXVsdGlwbGUgdGlja2VycyBpbiB0aGUgVVJMIHVzaW5nIGEgZGFzaCBzZXBlcmF0ZWQgZm9ybWF0LlxuICAvLyBFeC4gaHR0cHM6Ly95b2JpdC5uZXQvYXBpLzMvdGlja2VyL2V0aF9idGMtemVjX2J0Yy16ZWNfZXRoXG4gIC8vXG4gIC8vIFdpbGwgcmV0dXJuIGRhdGEgaW4gdGhlIGZvcm1hdCxcbiAgLy9cbiAgLy8ge1wiZXRoX2J0Y1wiOlxuICAvLyAgICB7XCJoaWdoXCI6MC4wMzMwOSxcImxvd1wiOjAuMDMyMzUzODgsXCJhdmdcIjowLjAzMjcyMTk0LFwidm9sXCI6MTAwOC4wNjcwNjA2NixcInZvbF9jdXJcIjozMDY0MC4yNzgyNDcyOCxcImxhc3RcIjowLjAzMjg2Mjc0LFwiYnV5XCI6MC4wMzI3ODE4NyxcInNlbGxcIjowLjAzMjkxMjU5LFwidXBkYXRlZFwiOjE1NDgxNjcxNzF9LFxuICAvLyAgXCJ6ZWNfYnRjXCI6XG4gIC8vICAgIHtcImhpZ2hcIjowLjAxNDcxNDA3LFwibG93XCI6MC4wMTQ0NDQ4LFwiYXZnXCI6MC4wMTQ1Nzk0MyxcInZvbFwiOjg2Ni4xMjM3MDcxMixcInZvbF9jdXJcIjo1OTE5MS4xNjM3OTEzMyxcImxhc3RcIjowLjAxNDU5NTU3LFwiYnV5XCI6MC4wMTQ1Mzg3MSxcInNlbGxcIjowLjAxNDY0ODgyLFwidXBkYXRlZFwiOjE1NDgxNjcxNjh9LFxuICAvLyAgXCJ6ZWNfZXRoXCI6XG4gIC8vICAgIHtcImhpZ2hcIjowLjQ0ODU5MjM5LFwibG93XCI6MC40MzcxOTkwNCxcImF2Z1wiOjAuNDQyODk1NzEsXCJ2b2xcIjozLjQ3ODQzMzU0LFwidm9sX2N1clwiOjcuNzc3NzExNDIsXCJsYXN0XCI6MC40NDg1OTIzOSxcImJ1eVwiOjAuNDQwMDg1OTYsXCJzZWxsXCI6MC40NDg1OTIzOCxcInVwZGF0ZWRcIjoxNTQ4MTY2MDUyfVxuICAvLyB9XG5cbiAgLy8gQ3JlYXRlIHRpY2tlciBsaXN0IGluIGZvcm1hdCBZb2JpdCB3aWxsIGFjY2VwdC5cbiAgbGV0IHRpY2tlckxpc3RTdHIgPSBcIlwiO1xuICBmb3IobGV0IGk9MDsgaTx5b2JpdE1hcmtldHMubGVuZ3RoOyBpKyspIHtcbiAgICB0aWNrZXJMaXN0U3RyICs9IHlvYml0TWFya2V0c1tpXSArIFwiX1wiICsgYmFzZU1hcmtldHNbMF0gKyBcIi1cIjtcbiAgICB0aWNrZXJMaXN0U3RyICs9IHlvYml0TWFya2V0c1tpXSArIFwiX1wiICsgYmFzZU1hcmtldHNbMV07XG4gICAgaWYgKGkhPXlvYml0TWFya2V0cy5sZW5ndGgtMSlcbiAgICAgIHRpY2tlckxpc3RTdHIgKz0gXCItXCI7XG4gICAgZWxzZVxuICAgICAgdGlja2VyTGlzdFN0ciArPSBcIi1cIiArIGJhc2VNYXJrZXRzWzFdICsgXCJfXCIgKyBiYXNlTWFya2V0c1swXTtcbiAgfVxuICBsZXQgeW9iaXRNa3QgPSBhd2FpdCBnZXRFeGNoYW5nZURhdGEoeW9iaXRCYXNlVVJMICsgdGlja2VyTGlzdFN0cik7ICBcbiAgdHJ5IHtcbiAgICBsZXQgbWt0RGF0YSA9IEpTT04ucGFyc2UoeW9iaXRNa3QuZXhjaGFuZ2VEYXRhKTtcbiAgICAvLyBBbmFseXplIFlvYml0IG1hcmtldCBsb29raW5nIGZvciBwcmljZSBhbm9tb2xpZXNcbiAgICBpbnRlcm5hbENvbXBhcmVGb3JZb2JpdChta3REYXRhLCB5b2JpdE1hcmtldHMsIGJhc2VNYXJrZXRzKTtcbiAgfVxuICBjYXRjaChlKSB7XG4gICAgY29uc29sZS5sb2coXCJJbnZhbGlkIG1hcmtldCBkYXRhIHJldHVybmVkIGZyb206XCIsIHlvYml0QmFzZVVSTCk7XG4gICAgY29uc29sZS5sb2coXCJEYXRhIG9iamVjdCByZXR1cm5lZDpcIiwgeW9iaXRNa3QpO1xuICB9XG59XG5cblxuLy8gU2V0IHRoZSBkZWZhdWx0IGNvcGFyZSB0byBydW4uXG5sZXQgY29tcGFyZVRvUnVuOiBQcm9taXNlPHZvaWQ+ID0gcnVuUG9sb0JpdHRyZXhDb21wYXJlO1xuaWYgKHByb2Nlc3MuYXJndi5sZW5ndGg+PTMpIHtcbiAgaWYgKHByb2Nlc3MuYXJndlsyXT09PVwicG9sb2ludGVybmFsXCIpIHtcbiAgICBjb25zb2xlLmxvZyhgUnVubmluZyBwb2xvaW50ZXJuYWwgY29tcGFyZS5gKTtcbiAgICBjb21wYXJlVG9SdW4gPSBwb2xvSW50ZXJuYWxDb21wYXJlO1xuICB9XG4gIGVsc2Uge1xuICAgIGlmIChwcm9jZXNzLmFyZ3ZbMl09PT1cInBvbG9jb2luYmFzZVwiKSB7XG4gICAgICBjb21wYXJlVG9SdW4gPSBydW5Qb2xvQ29pbmJhc2VDb21wYXJlO1xuICAgICAgY29uc29sZS5sb2coXCJSdW5uaW5nIFBvbG9Db2luYmFzZUNvbXBhcmUuXCIpO1xuICAgIH1cbiAgICBlbHNlIGlmIChwcm9jZXNzLmFyZ3ZbMl09PT1cInBvbG9oaXRidGNcIikge1xuICAgICAgY29tcGFyZVRvUnVuID0gcnVuUG9sb0hpdGJ0Y0NvbXBhcmU7XG4gICAgICBjb25zb2xlLmxvZyhcIlJ1bm5pbmcgUG9sb0hpdGJ0Y0NvbXBhcmUuXCIpXG4gICAgfVxuICAgIGVsc2UgaWYgKHByb2Nlc3MuYXJndlsyXT09PVwicG9sb3lvYml0XCIpIHtcbiAgICAgIGNvbXBhcmVUb1J1biA9IHJ1blBvbG9Zb2JpdENvbXBhcmU7XG4gICAgICBjb25zb2xlLmxvZyhcIlJ1bm5pbmcgcnVuUG9sb1lvYml0Q29tcGFyZS5cIilcbiAgICB9XG4gICAgZWxzZSBpZiAocHJvY2Vzcy5hcmd2WzJdPT09XCJ5b2JpdGludGVybmFsXCIpIHtcbiAgICAgIGNvbXBhcmVUb1J1biA9IHJ1bllvYml0SW50ZXJuYWxDb21wYXJlO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgY29uc29sZS5sb2coXCJSdW5uaW5nIGRlZmF1bHQgcG9sbyBiaXR0cmV4IGNvbXBhcmUuXCIpO1xuICAgIH1cbiAgfVxufVxubGV0IG5ld0ludGVyYWwgPSAxMDAwKih0aW1lSW5TZWNvbmRzQmV0d2VlblByaWNlQ2hlY2tzICsgMjAqTWF0aC5yYW5kb20oKSk7XG5jb25zb2xlLmxvZyhgU2V0dGluZyB0aGUgdGltZXIgaW50ZXJ2YWwgdG8gJHtuZXdJbnRlcmFsLzEwMDB9IHNlY29uZHMuYCApO1xuY29tcGFyZVRvUnVuKCk7XG5pbnRlcnZhbEhhbmRlbCA9IHNldEludGVydmFsKGNvbXBhcmVUb1J1biwgbmV3SW50ZXJhbCk7XG4iXX0=