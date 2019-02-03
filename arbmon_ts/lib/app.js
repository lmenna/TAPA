"use strict";

var _getCryptoData = require("./utils/getCryptoData");

var _comparePricingData = require("./utils/comparePricingData");

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

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
/* formatTimestamp
 * desc: Utility to truncate the output of long time stamps to include only the date and time parts.
 */

function formatTimestamp(timeStamp) {
  return timeStamp.toString().slice(0, 25);
}
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
/* runPoloHitbtcCompare
 * desc: Loads market data from Poloniex and Hitbtc then compares all markets they have in common.
 *       Will be called repeatedly using a setInterval timer.
 */


function _runPoloBittrexCompare() {
  _runPoloBittrexCompare = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2() {
    var _ref, _ref2, poloniexData, bittrexALL, bittrexJSON, bittrexBTCCoins, baseMarkets;

    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            numberOfChecks++;
            console.log("------>>> Begin compare cycle: ".concat(numberOfChecks, ".")); // Get market data from the exchanges

            _context2.prev = 2;
            _context2.next = 5;
            return Promise.all([(0, _getCryptoData.getExchangeData)(poloniexURL), (0, _getCryptoData.getExchangeData)(bittrexURLAll)]);

          case 5:
            _ref = _context2.sent;
            _ref2 = _slicedToArray(_ref, 2);
            poloniexData = _ref2[0];
            bittrexALL = _ref2[1];
            console.log("poloTimestamp:    ".concat(formatTimestamp(poloniexData.timeStamp)));
            console.log("bittrexTimestamp: ".concat(formatTimestamp(bittrexALL.timeStamp)));
            console.log("Diff: ".concat(Math.abs(poloniexData.timeStamp - bittrexALL.timeStamp), "ms")); // Poloniex section - All coins from one request
            // let poloniexData = await getExchangeData(poloniexURL);
            // Bittrex section - All coins from one request.
            // let bittrexALL = await getExchangeData(bittrexURLAll);

            bittrexJSON = JSON.parse(bittrexALL.exchangeData);
            bittrexBTCCoins = {
              BTC: ["ARDR", "BAT", "BNT", "BURST", "CVC", "DASH", "DCR", "DGB", "DOGE", "ETC", "ETH", "FCT", "GAME", "GNT", "LBC", "LOOM", "LSK", "LTC", "MANA", "NAV", "NMR", "NXT", "OMG", "POLY", "PPC", "QTUM", "REP", "SBD", "SC", "SNT", "STEEM", "STORJ", "STRAT", "SYS", "VIA", "VTC", "XCP", "XEM", "XMR", "XRP", "ZEC", "ZRX"],
              ETH: ["BAT", "BNT", "CVC", "ETC", "GNT", "MANA", "OMG", "QTUM", "REP", "SNT", "ZEC", "ZRX"],
              USDT: ["BAT", "BTC", "DASH", "DOGE", "ETC", "ETH", "LTC", "NXT", "SC", "XMR", "XRP", "ZEC", "ZRX"]
            }; // Prcoess each base market seperately.

            baseMarkets = ["BTC", "ETH", "USDT"];
            baseMarkets.forEach(function (baseMkt) {
              var bittrexTrimmed = {};
              bittrexJSON.result.forEach(function (market) {
                bittrexBTCCoins[baseMkt].forEach(function (coin) {
                  var MarketName = baseMkt + "-" + coin.toUpperCase();

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
            _context2.next = 21;
            break;

          case 18:
            _context2.prev = 18;
            _context2.t0 = _context2["catch"](2);
            console.log("Error processing Polo Bittrex compare.");

          case 21:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this, [[2, 18]]);
  }));
  return _runPoloBittrexCompare.apply(this, arguments);
}

function runPoloHitbtcCompare() {
  return _runPoloHitbtcCompare.apply(this, arguments);
}
/* runBittrexHitbtcCompare
 * desc: Loads market data from Bittrex and Hitbtc then compares all markets they have in common.
 *       Will be called repeatedly using a setInterval timer.
 */


function _runPoloHitbtcCompare() {
  _runPoloHitbtcCompare = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee3() {
    var _ref3, _ref4, hitbtcData, poloniexData, hitbtcMarkets, hitbtcJSON, hitbtcTrimmed, hitbtcCompare;

    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            numberOfChecks++;
            console.log("------>>> Begin compare cycle: ".concat(numberOfChecks, "."));
            _context3.prev = 2;
            _context3.next = 5;
            return Promise.all([(0, _getCryptoData.getExchangeData)(hitbtcURL), (0, _getCryptoData.getExchangeData)(poloniexURL)]);

          case 5:
            _ref3 = _context3.sent;
            _ref4 = _slicedToArray(_ref3, 2);
            hitbtcData = _ref4[0];
            poloniexData = _ref4[1];
            console.log("poloTimestamp:   ".concat(formatTimestamp(poloniexData.timeStamp)));
            console.log("hitBtcTimestamp: ".concat(formatTimestamp(hitbtcData.timeStamp)));
            console.log("Diff: ".concat(Math.abs(poloniexData.timeStamp - hitbtcData.timeStamp), "ms")); // Get data from the exchanges
            // Hitbtc section - All coins from one request.
            //let hitbtcData = await getExchangeData(hitbtcURL);  
            // Poloniex section - All coins from one request
            // let poloniexData = await getExchangeData(poloniexURL);
            // This is the list of markets shared between Poloniex and Hitbtc.

            hitbtcMarkets = ["BCNBTC", "DASHBTC", "DOGEBTC", "ETHBTC", "LSKBTC", "LTCBTC", "NXTBTC", "SBDBTC", "SCBTC", "STEEMBTC", "XEMBTC", "XMRBTC", "ARDRBTC", "ZECBTC", "MAIDBTC", "REPBTC", "ETCBTC", "BNTBTC", "SNTETH", "OMGETH", "ETCETH", "ZECETH", "XRPBTC", "STRATBTC", "EOSETH", "EOSBTC", "BNTETH", "ZRXBTC", "ZRXETH", "PPCBTC", "QTUMETH", "DGBBTC", "OMGBTC", "SNTBTC", "XRPUSDT", "MANAETH", "MANABTC", "QTUMBTC", "LSKETH", "REPETH", "REPUSDT", "GNTBTC", "GNTETH", "BTSBTC", "BATBTC", "BATETH", "BCHABCBTC", "BCHSVBTC", "NMRBTC", "POLYBTC", "STORJBTC"]; // Get subset of Hitbtc data only including the markets which overlap with Poloniex

            hitbtcJSON = JSON.parse(hitbtcData.exchangeData);
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
            _context3.next = 26;
            break;

          case 22:
            _context3.prev = 22;
            _context3.t0 = _context3["catch"](2);
            console.log("Error in Poloniex Hitbtc compare.");
            console.log(_context3.t0);

          case 26:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, this, [[2, 22]]);
  }));
  return _runPoloHitbtcCompare.apply(this, arguments);
}

function runBittrexHitbtcCompare() {
  return _runBittrexHitbtcCompare.apply(this, arguments);
}

function _runBittrexHitbtcCompare() {
  _runBittrexHitbtcCompare = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee4() {
    var hitbtcData, bittrexData;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            numberOfChecks++; // Get market data from the two exchanges.

            _context4.next = 3;
            return (0, _getCryptoData.getExchangeData)(hitbtcURL);

          case 3:
            hitbtcData = _context4.sent;
            _context4.next = 6;
            return (0, _getCryptoData.getExchangeData)(bittrexURLAll);

          case 6:
            bittrexData = _context4.sent;
            (0, _comparePricingData.compareAllBittrexHitbtc)(bittrexData, hitbtcData);

          case 8:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));
  return _runBittrexHitbtcCompare.apply(this, arguments);
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
  regeneratorRuntime.mark(function _callee5() {
    var poloniexData, yobitMarkets, tickerList, i, yobitURL, yobitData;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            numberOfChecks++; // Poloniex section - All coins from one request

            _context5.next = 3;
            return (0, _getCryptoData.getExchangeData)(poloniexURL);

          case 3:
            poloniexData = _context5.sent;
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
            _context5.next = 11;
            return (0, _getCryptoData.getExchangeData)(yobitURL);

          case 11:
            yobitData = _context5.sent;
            console.log("yobitData:", yobitData);
            (0, _comparePricingData.compareAllPoloniexYobit)(poloniexData, yobitData);

          case 14:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5, this);
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
  regeneratorRuntime.mark(function _callee6(baseMarkets, yobitMarkets) {
    var tickerListStr, i, yobitMkt, mktData;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
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

            _context6.next = 4;
            return (0, _getCryptoData.getExchangeData)(yobitBaseURL + tickerListStr);

          case 4:
            yobitMkt = _context6.sent;

            try {
              mktData = JSON.parse(yobitMkt.exchangeData); // Analyze Yobit market looking for price anomolies

              (0, _comparePricingData.internalCompareForYobit)(mktData, yobitMarkets, baseMarkets);
            } catch (e) {
              console.log("Invalid market data returned from:", yobitBaseURL);
              console.log("Data object returned:", yobitMkt);
            }

          case 6:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6, this);
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
    } else if (process.argv[2] === "bittrexhitbtc") {
      compareToRun = runBittrexHitbtcCompare;
      console.log("Running runBittrexHitbtcCompare.");
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

var newInteral = 1000 * (timeInSecondsBetweenPriceChecks + 5 * Math.random());
console.log("Setting the timer interval to ".concat(newInteral / 1000, " seconds."));
compareToRun();
intervalHandel = setInterval(compareToRun, newInteral);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcHAudHMiXSwibmFtZXMiOlsicmVxdWlyZSIsIlhNTEh0dHBSZXF1ZXN0IiwicG9sb25pZXhVUkwiLCJjb2luYmFzZVVSTCIsImJpdHRyZXhVUkxBbGwiLCJoaXRidGNVUkwiLCJ5b2JpdEJhc2VVUkwiLCJ0aHJlc2hvbGQiLCJudW1iZXJPZkNoZWNrcyIsImludGVydmFsSGFuZGVsIiwibWF4QnV5QXJiIiwibWF4U2VsbEFyYiIsIm1heFNlbGxBcmJFVEgiLCJtYXhTZWxsQXJiWE1SIiwidGltZUluU2Vjb25kc0JldHdlZW5QcmljZUNoZWNrcyIsImZvcm1hdFRpbWVzdGFtcCIsInRpbWVTdGFtcCIsInRvU3RyaW5nIiwic2xpY2UiLCJwb2xvSW50ZXJuYWxDb21wYXJlIiwiY29uc29sZSIsImxvZyIsInhtbGh0dHAiLCJtZXRob2QiLCJ1cmwiLCJvcGVuIiwib25lcnJvciIsIm9ucmVhZHlzdGF0ZWNoYW5nZSIsInJlYWR5U3RhdGUiLCJzdGF0dXMiLCJleGNoYW5nZURhdGEiLCJyZXNwb25zZVRleHQiLCJEYXRlIiwiZXhjaGFuZ2VPYmplY3QiLCJKU09OIiwicGFyc2UiLCJjb2lucyIsImJhc2VTdGFibGVDb2luIiwiYW5hbHl6ZVBvbG9CVENQcmljZXMiLCJhbmFseXplUG9sb0VUSFByaWNlcyIsImFuYWx5emVQb2xvWE1SUHJpY2VzIiwic2VuZCIsImV4Y2hhbmdlUHJpY2VzIiwidGltZVN0YW1wU3RyIiwiZ2V0VGltZSIsImZvckVhY2giLCJjdXJDb2luIiwibG93ZXN0QXNrQlRDIiwibG93ZXN0QXNrIiwiaGlnaGVzdEJpZFVTREMiLCJoaWdoZXN0QmlkIiwiVVNEQ19CVENsb3dlc3RBc2siLCJBcmJSYXRpbyIsInNob3dNYXgiLCJCVENfY3VyQ29pbkJpZCIsIlVTRENfQlRDQmlkIiwiVVNEQ19jdXJDb2luQXNrIiwiQW10SW5pdCIsIkFtdEZpbmFsIiwiRVRIX2N1ckNvaW5CaWQiLCJCVENfRVRIQmlkIiwiQlRDX2N1ckNvaW5Bc2siLCJpbnN0cnVjdGlvbnMiLCJiYXNlTWFya2V0IiwiYmFzZU1hcmtldF9jdXJDb2luQmlkIiwiQlRDX2Jhc2VNYXJrZXRCaWQiLCJydW5Qb2xvQ29pbmJhc2VDb21wYXJlIiwicG9sb25pZXhEYXRhIiwiY29pbmJhc2VEYXRhWkVDIiwiY29pbmJhc2VEYXRhRVRIIiwiY29pbmJhc2VEYXRhQlRDIiwicnVuUG9sb0JpdHRyZXhDb21wYXJlIiwiUHJvbWlzZSIsImFsbCIsImJpdHRyZXhBTEwiLCJNYXRoIiwiYWJzIiwiYml0dHJleEpTT04iLCJiaXR0cmV4QlRDQ29pbnMiLCJCVEMiLCJFVEgiLCJVU0RUIiwiYmFzZU1hcmtldHMiLCJiYXNlTWt0IiwiYml0dHJleFRyaW1tZWQiLCJyZXN1bHQiLCJtYXJrZXQiLCJjb2luIiwiTWFya2V0TmFtZSIsInRvVXBwZXJDYXNlIiwiYml0dHJleENvbXBhcmUiLCJydW5Qb2xvSGl0YnRjQ29tcGFyZSIsImhpdGJ0Y0RhdGEiLCJoaXRidGNNYXJrZXRzIiwiaGl0YnRjSlNPTiIsImhpdGJ0Y1RyaW1tZWQiLCJzeW1ib2wiLCJoaXRidGNDb21wYXJlIiwicnVuQml0dHJleEhpdGJ0Y0NvbXBhcmUiLCJiaXR0cmV4RGF0YSIsInJ1blBvbG9Zb2JpdENvbXBhcmUiLCJ5b2JpdE1hcmtldHMiLCJ0aWNrZXJMaXN0IiwiaSIsImxlbmd0aCIsInlvYml0VVJMIiwieW9iaXREYXRhIiwicnVuWW9iaXRJbnRlcm5hbENvbXBhcmUiLCJydW5Zb2JpdEJhc2VNa3RDb21wYXJlIiwidGlja2VyTGlzdFN0ciIsInlvYml0TWt0IiwibWt0RGF0YSIsImUiLCJjb21wYXJlVG9SdW4iLCJwcm9jZXNzIiwiYXJndiIsIm5ld0ludGVyYWwiLCJyYW5kb20iLCJzZXRJbnRlcnZhbCJdLCJtYXBwaW5ncyI6Ijs7QUFRQTs7QUFDQTs7Ozs7Ozs7Ozs7Ozs7QUFUQTs7Ozs7QUFNQUEsT0FBTyxDQUFDLGlCQUFELENBQVA7O0FBTUEsSUFBSUMsY0FBYyxHQUFHRCxPQUFPLENBQUMsZ0JB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b3IgdGhlIGNyeXB0byBleGNoYW5nZSBwcmljZSBhcmJpdHJhZ2UgbW9uaXRvci4gIFRoZSBldmVudCBsb29wIHRoYXQgY29udHJvbHNcbiAqICAgICAgIHJlYWRpbmcgZXhjaGFuZ2UgZGF0YSBydW5zIGZyb20gaGVyZS4gIEFzIGRhdGEgaXMgbG9hZGVkIGZyb20gZXhjaGFuZ2VzIGl0IGdldHMgcGFzc2VkIGludG9cbiAqICAgICAgIGNvbXBhclByaWNpbmdSZXN1bHRzLmpzIHRvIHNlZSBpZiB0aGVyZSBhcmUgYW55IG1hcmtldCBvcHBvcnR1bml0aWVzLlxuICovXG5cbnJlcXVpcmUoXCJAYmFiZWwvcG9seWZpbGxcIik7XG5cbmltcG9ydCB7Z2V0RXhjaGFuZ2VEYXRhfSBmcm9tIFwiLi91dGlscy9nZXRDcnlwdG9EYXRhXCI7XG5pbXBvcnQge2NvbXBhcmVQb2xvbmlleENvaW5iYXNlLCBjb21wYXJlQWxsUG9sb25pZXhCaXR0cmV4LCBjb21wYXJlQWxsUG9sb25pZXhIaXRidGMsIGNvbXBhcmVBbGxCaXR0cmV4SGl0YnRjLFxuICBjb21wYXJlQWxsUG9sb25pZXhZb2JpdCwgaW50ZXJuYWxDb21wYXJlRm9yWW9iaXR9IGZyb20gXCIuL3V0aWxzL2NvbXBhcmVQcmljaW5nRGF0YVwiO1xuXG5sZXQgWE1MSHR0cFJlcXVlc3QgPSByZXF1aXJlKFwieG1saHR0cHJlcXVlc3RcIikuWE1MSHR0cFJlcXVlc3Q7XG5cbmNvbnN0IHBvbG9uaWV4VVJMOiBzdHJpbmcgPSBcImh0dHBzOi8vcG9sb25pZXguY29tL3B1YmxpYz9jb21tYW5kPXJldHVyblRpY2tlclwiOyBcbmNvbnN0IGNvaW5iYXNlVVJMOiBzdHJpbmcgPSBcImh0dHBzOi8vYXBpLnByby5jb2luYmFzZS5jb20vcHJvZHVjdHNcIjsgXG5jb25zdCBiaXR0cmV4VVJMQWxsOiBzdHJpbmcgPSBcImh0dHBzOi8vYml0dHJleC5jb20vYXBpL3YxLjEvcHVibGljL2dldG1hcmtldHN1bW1hcmllc1wiO1xuY29uc3QgaGl0YnRjVVJMOiBzdHJpbmcgPSBcImh0dHBzOi8vYXBpLmhpdGJ0Yy5jb20vYXBpLzIvcHVibGljL3RpY2tlclwiO1xuY29uc3QgeW9iaXRCYXNlVVJMOiBzdHJpbmcgPSBcImh0dHBzOi8veW9iaXQubmV0L2FwaS8zL3RpY2tlci9cIlxuY29uc3QgdGhyZXNob2xkOiBudW1iZXIgPSAxLjAxO1xubGV0IG51bWJlck9mQ2hlY2tzOiBudW1iZXIgPSAwO1xubGV0IGludGVydmFsSGFuZGVsOiBudW1iZXIgPSAtMTtcbmxldCBtYXhCdXlBcmI6IG51bWJlciA9IDA7XG5sZXQgbWF4U2VsbEFyYjogbnVtYmVyID0gMDtcbmxldCBtYXhTZWxsQXJiRVRIOiBudW1iZXIgPSAwO1xubGV0IG1heFNlbGxBcmJYTVI6IG51bWJlciA9IDA7XG5cbmNvbnN0IHRpbWVJblNlY29uZHNCZXR3ZWVuUHJpY2VDaGVja3MgPSAxNTtcblxuLyogZm9ybWF0VGltZXN0YW1wXG4gKiBkZXNjOiBVdGlsaXR5IHRvIHRydW5jYXRlIHRoZSBvdXRwdXQgb2YgbG9uZyB0aW1lIHN0YW1wcyB0byBpbmNsdWRlIG9ubHkgdGhlIGRhdGUgYW5kIHRpbWUgcGFydHMuXG4gKi9cbmZ1bmN0aW9uIGZvcm1hdFRpbWVzdGFtcCh0aW1lU3RhbXA6IERhdGUpIHtcbiAgcmV0dXJuKHRpbWVTdGFtcC50b1N0cmluZygpLnNsaWNlKDAsMjUpKTtcbn1cblxuLyogcG9sb0ludGVybmFsQ29tcGFyZVxuICogZGVzYzogTG9va3MgZm9yIGFyYml0cmFnZSBwcm9maXRzIGZyb20gc2NlbmFyaW9zIHdoZXJlIGEgY29pbjEgaXMgZXhjaGFuZ2VkIGZvciBjb2luMiwgY29pbjIgZXhjaGFuZ2VkIGZvciBjb2luMyBhbmQgdGhlbiBcbiAqICAgICAgIGNvaW4zIGV4Y2hhbmdlZCBiYWNrIGludG8gY29pbjEuXG4gKiAgICAgICBUaGlzIGNvbXBhcmUgbG9va3Mgb25seSB3aXRoaW4gdGhlIFBvbG9uaWV4IGV4Y2hhbmdlLlxuKi9cbmZ1bmN0aW9uIHBvbG9JbnRlcm5hbENvbXBhcmUoKSB7XG5cbiAgY29uc29sZS5sb2coXCJCRUdJTjogcG9sb0ludGVybmFsQ29tcGFyZVwiKTtcbiAgbGV0IHhtbGh0dHAgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKSxcbiAgICBtZXRob2QgPSBcIkdFVFwiLFxuICAgIHVybCA9IHBvbG9uaWV4VVJMO1xuXG4gIGNvbnNvbGUubG9nKFwiTG9hZGluZyBkYXRhIGZyb20gOiBIdHRwLnNlbmQoXCIsIHVybCwgXCIpXCIpO1xuICB4bWxodHRwLm9wZW4obWV0aG9kLCB1cmwsIHRydWUpO1xuICB4bWxodHRwLm9uZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgY29uc29sZS5sb2coXCIqKiBBbiBlcnJvciBvY2N1cnJlZCBkdXJpbmcgdGhlIHRyYW5zYWN0aW9uXCIpO1xuICB9O1xuICB4bWxodHRwLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLnJlYWR5U3RhdGU9PT00ICYmIHRoaXMuc3RhdHVzPT09MjAwKSB7XG4gICAgICBsZXQgZXhjaGFuZ2VEYXRhID0geG1saHR0cC5yZXNwb25zZVRleHQ7XG4gICAgICBudW1iZXJPZkNoZWNrcysrO1xuICAgICAgbGV0IHRpbWVTdGFtcCA9IG5ldyBEYXRlKCk7XG4gICAgICBsZXQgZXhjaGFuZ2VPYmplY3QgPSBKU09OLnBhcnNlKGV4Y2hhbmdlRGF0YSk7XG4gICAgICBsZXQgY29pbnMgPSBbXCJGT0FNXCIsIFwiWkVDXCIsIFwiTFRDXCIsIFwiRVRIXCIsIFwiWFJQXCIsIFwiU1RSXCIsIFwiWE1SXCIsIFwiRE9HRVwiLCBcIkJDSEFCQ1wiLCBcIkJDSFNWXCJdO1xuICAgICAgbGV0IGJhc2VTdGFibGVDb2luID0gXCJVU0RDXCI7XG4gICAgICBhbmFseXplUG9sb0JUQ1ByaWNlcyhleGNoYW5nZU9iamVjdCwgYmFzZVN0YWJsZUNvaW4sIGNvaW5zLCB0aW1lU3RhbXApO1xuICAgICAgY29pbnMgPSBbXCJCQVRcIiwgXCJCTlRcIiwgXCJEQVNIXCIsIFwiRE9HRVwiLCBcIkVPU1wiLCBcIkVUQ1wiLCBcIkVUSFwiLCBcIkdOVFwiLCBcIktOQ1wiLCBcIkxPT01cIiwgXCJMU0tcIixcbiAgICAgICAgXCJMVENcIiwgXCJNQU5BXCIsIFwiTlhUXCIsIFwiUVRVTVwiLCBcIlJFUFwiLCBcIlNDXCIsIFwiU05UXCIsIFwiU1RSXCIsIFwiWE1SXCIsIFwiWFJQXCIsIFwiWkVDXCIsIFwiWlJYXCJdO1xuICAgICAgYmFzZVN0YWJsZUNvaW4gPSBcIlVTRFRcIjsgXG4gICAgICBhbmFseXplUG9sb0JUQ1ByaWNlcyhleGNoYW5nZU9iamVjdCwgYmFzZVN0YWJsZUNvaW4sIGNvaW5zLCB0aW1lU3RhbXApO1xuICAgICAgYW5hbHl6ZVBvbG9FVEhQcmljZXMoZXhjaGFuZ2VPYmplY3QsIHRpbWVTdGFtcCk7XG4gICAgICBhbmFseXplUG9sb1hNUlByaWNlcyhleGNoYW5nZU9iamVjdCwgdGltZVN0YW1wKTtcbiAgICB9XG4gIH1cbiAgeG1saHR0cC5zZW5kKCk7XG4gIGNvbnNvbGUubG9nKFwiRU5EOiBwb2xvSW50ZXJuYWxDb21wYXJlXCIpO1xufVxuXG4vKiBhbmFseXplUG9sb0JUQ1ByaWNlc1xuICogZGVzYzogVGFrZXMgdGhlIGV4Y2hhbmdlIHByaWNlcyBmcm9tIFBvbG9uaWV4IGFuZCBkb2VzIHRoZSBkZXRhaWxlZCBjb21wYXJlcyB0byBmaW5kIGFyYml0cmFnZVxuICogICAgICAgd2l0aGluIHRoaXMgZXhjaGFuZ2UuICBJdCBkb2VzIHRoaXMgZm9yIHRoZSBCVEMgbWFya2V0LlxuICovXG5mdW5jdGlvbiBhbmFseXplUG9sb0JUQ1ByaWNlcyhleGNoYW5nZVByaWNlczogYW55LCBiYXNlU3RhYmxlQ29pbjogXG4gIHN0cmluZywgY29pbnM6IEFycmF5PHN0cmluZz4sIHRpbWVTdGFtcDogRGF0ZSkge1xuXG4gIGxldCB0aW1lU3RhbXBTdHIgPSB0aW1lU3RhbXAuZ2V0VGltZSgpO1xuICBjb25zb2xlLmxvZyhgcHJpY2VDaGVja0NvdW50OiR7bnVtYmVyT2ZDaGVja3N9fCR7YmFzZVN0YWJsZUNvaW59fG1heEJ1eUFyYjoke21heEJ1eUFyYn18bWF4U2VsbEFyYjoke21heFNlbGxBcmJ9YCk7XG4gIC8vIENoZWNrIGlmIGJ1eWluZyB0aGUgY29pbiB3aWxsIGJlIHByb2ZpdGFibGUuXG4gIGNvaW5zLmZvckVhY2goY3VyQ29pbiA9PiB7XG4gICAgbGV0IGxvd2VzdEFza0JUQyA9IGV4Y2hhbmdlUHJpY2VzW1wiQlRDX1wiICsgY3VyQ29pbl0ubG93ZXN0QXNrO1xuICAgIGxldCBoaWdoZXN0QmlkVVNEQyA9IGV4Y2hhbmdlUHJpY2VzW2Jhc2VTdGFibGVDb2luICsgXCJfXCIgKyBjdXJDb2luXS5oaWdoZXN0QmlkO1xuICAgIGxldCBVU0RDX0JUQ2xvd2VzdEFzayA9IGV4Y2hhbmdlUHJpY2VzW2Jhc2VTdGFibGVDb2luICsgXCJfXCIgKyBcIkJUQ1wiXS5sb3dlc3RBc2s7XG4gICAgbGV0IEFyYlJhdGlvID0gaGlnaGVzdEJpZFVTREMgLyAoIGxvd2VzdEFza0JUQyAqICBVU0RDX0JUQ2xvd2VzdEFzayk7XG4gICAgbGV0IHNob3dNYXggPSBcIlwiO1xuICAgIGlmIChBcmJSYXRpbz5tYXhCdXlBcmIpIHtcbiAgICAgIG1heEJ1eUFyYiA9IEFyYlJhdGlvO1xuICAgICAgc2hvd01heCA9IFwiTmV3TWF4XCI7XG4gICAgfVxuICAgIGlmIChBcmJSYXRpbz4xLjApXG4gICAgICBjb25zb2xlLmxvZyhgUkVDfCR7dGltZVN0YW1wfXwke3RpbWVTdGFtcFN0cn18QnV5fCR7YmFzZVN0YWJsZUNvaW59fCR7Y3VyQ29pbn18QXJiUmF0aW86JHtBcmJSYXRpb318JHtzaG93TWF4fWApO1xuICAgIGlmIChBcmJSYXRpbyA+IHRocmVzaG9sZCkge1xuICAgICAgY29uc29sZS5sb2coXCJTb21ldGhpbmcgZHJhbWF0aWMgbmVlZHMgdG8gaGFwcGVuIVwiKTtcbiAgICB9XG4gIH0pO1xuICAvLyBDaGVjayBpZiBzZWxsaW5nIHRoZSBjb2luIHdpbGwgYmUgcHJvZml0YWJsZVxuICBjb2lucy5mb3JFYWNoKGN1ckNvaW4gPT4ge1xuICAgIGxldCBCVENfY3VyQ29pbkJpZCA9IGV4Y2hhbmdlUHJpY2VzW1wiQlRDX1wiK2N1ckNvaW5dLmhpZ2hlc3RCaWQ7XG4gICAgbGV0IFVTRENfQlRDQmlkID0gZXhjaGFuZ2VQcmljZXNbYmFzZVN0YWJsZUNvaW4gKyBcIl9cIiArIFwiQlRDXCJdLmhpZ2hlc3RCaWQ7XG4gICAgbGV0IFVTRENfY3VyQ29pbkFzayA9IGV4Y2hhbmdlUHJpY2VzW2Jhc2VTdGFibGVDb2luICsgXCJfXCIgK2N1ckNvaW5dLmxvd2VzdEFzaztcbiAgICBsZXQgQW10SW5pdCA9IDEwMDAwO1xuICAgIGxldCBBbXRGaW5hbCA9IEFtdEluaXQqQlRDX2N1ckNvaW5CaWQqVVNEQ19CVENCaWQvVVNEQ19jdXJDb2luQXNrO1xuICAgIGxldCBBcmJSYXRpbyA9IEFtdEZpbmFsL0FtdEluaXQ7XG4gICAgbGV0IHNob3dNYXggPSBcIlwiO1xuICAgIGlmIChBcmJSYXRpbz5tYXhTZWxsQXJiKSB7XG4gICAgICBtYXhTZWxsQXJiID0gQXJiUmF0aW87XG4gICAgICBzaG93TWF4ID0gXCJOZXdNYXhcIjtcbiAgICB9XG4gICAgaWYgKEFyYlJhdGlvPjEuMClcbiAgICAgIGNvbnNvbGUubG9nKGBSRUN8JHt0aW1lU3RhbXB9fCR7dGltZVN0YW1wU3RyfXxTZWxsfCR7YmFzZVN0YWJsZUNvaW59fCR7Y3VyQ29pbn18QXJiUmF0aW86JHtBcmJSYXRpb318JHtzaG93TWF4fWApO1xuICAgIGlmIChBcmJSYXRpbyA+IHRocmVzaG9sZCkge1xuICAgICAgY29uc29sZS5sb2coXCJTb21ldGhpbmcgZHJhbWF0aWMgbmVlZHMgdG8gaGFwcGVuIVwiKTtcbiAgICB9XG4gIH0pO1xufVxuXG4vKiBhbmFseXplUG9sb0VUSFByaWNlc1xuICogZGVzYzogVGFrZXMgdGhlIGV4Y2hhbmdlIHByaWNlcyBmcm9tIFBvbG9uaWV4IGFuZCBkb2VzIHRoZSBkZXRhaWxlZCBjb21wYXJlcyB0byBmaW5kIGFyYml0cmFnZVxuICogICAgICAgd2l0aGluIHRoaXMgZXhjaGFuZ2UgZm9yIHRoZWlyIEVUSCBtYXJrZXQuXG4gKi9cbmZ1bmN0aW9uIGFuYWx5emVQb2xvRVRIUHJpY2VzKGV4Y2hhbmdlUHJpY2VzOiBhbnksIHRpbWVTdGFtcDogRGF0ZSkge1xuXG4gIGxldCB0aW1lU3RhbXBTdHIgPSB0aW1lU3RhbXAuZ2V0VGltZSgpO1xuICBjb25zb2xlLmxvZyhgcHJpY2VDaGVja0NvdW50OiR7bnVtYmVyT2ZDaGVja3N9fEVUSHxtYXhCdXlBcmI6Ti9BfG1heFNlbGxBcmJFVEg6JHttYXhTZWxsQXJiRVRIfWApO1xuICBsZXQgY29pbnMgPSBbXCJCQVRcIiwgXCJCTlRcIiwgXCJDVkNcIiwgXCJFT1NcIiwgXCJFVENcIiwgXCJHQVNcIiwgXCJHTlRcIiwgXCJLTkNcIiwgXCJMT09NXCIsIFwiTFNLXCIsIFxuICAgIFwiTUFOQVwiLCBcIk9NR1wiLCBcIlFUVU1cIiwgXCJSRVBcIiwgXCJTTlRcIiwgXCJTVEVFTVwiLCBcIlpFQ1wiLCBcIlpSWFwiXTtcbiAgLy8gQ2hlY2sgaWYgc2VsbGluZyB0aGUgY29pbiB3aWxsIGJlIHByb2ZpdGFibGVcbiAgY29pbnMuZm9yRWFjaChjdXJDb2luID0+IHtcbiAgICBsZXQgRVRIX2N1ckNvaW5CaWQgPSBleGNoYW5nZVByaWNlc1tcIkVUSF9cIitjdXJDb2luXS5oaWdoZXN0QmlkO1xuICAgIGxldCBCVENfRVRIQmlkID0gZXhjaGFuZ2VQcmljZXNbXCJCVENfRVRIXCJdLmhpZ2hlc3RCaWQ7XG4gICAgbGV0IEJUQ19jdXJDb2luQXNrID0gZXhjaGFuZ2VQcmljZXNbXCJCVENfXCIrY3VyQ29pbl0ubG93ZXN0QXNrO1xuICAgIGxldCBBbXRJbml0ID0gMTtcbiAgICBsZXQgQW10RmluYWwgPSBBbXRJbml0KkJUQ19FVEhCaWQqRVRIX2N1ckNvaW5CaWQvQlRDX2N1ckNvaW5Bc2s7XG4gICAgbGV0IEFyYlJhdGlvID0gQW10RmluYWwvQW10SW5pdDtcbiAgICBsZXQgc2hvd01heCA9IFwiXCI7XG4gICAgaWYgKEFyYlJhdGlvPm1heFNlbGxBcmJFVEgpIHtcbiAgICAgIG1heFNlbGxBcmJFVEggPSBBcmJSYXRpbztcbiAgICAgIHNob3dNYXggPSBcIk5ld01heFwiO1xuICAgIH1cbiAgICBpZiAoQXJiUmF0aW8+MS4wKVxuICAgICAgY29uc29sZS5sb2coYFJFQ3wke3RpbWVTdGFtcH18JHt0aW1lU3RhbXBTdHJ9fFNlbGx8JHtjdXJDb2lufXxFVEh8QXJiUmF0aW86JHtBcmJSYXRpb318JHtzaG93TWF4fWApO1xuICAgIGlmIChBcmJSYXRpbyA+IHRocmVzaG9sZCkge1xuICAgICAgbGV0IGluc3RydWN0aW9ucyA9IGBBTEVSVDogU2VsbCAke0FtdEluaXR9ICR7Y3VyQ29pbn0gZm9yICR7QW10SW5pdCpFVEhfY3VyQ29pbkJpZH0gRVRILCBcbiAgICAgICAgdGhlbiBzZWxsIHRob3NlIEVUSCBmb3IgJHtBbXRJbml0KkVUSF9jdXJDb2luQmlkKkJUQ19FVEhCaWR9IEJUQyxcbiAgICAgICAgdGhlbiB1c2UgdGhvc2UgQlRDIHRvIGJ1eSAke0FtdEZpbmFsfSAke2N1ckNvaW59YDtcbiAgICAgIGNvbnNvbGUubG9nKGluc3RydWN0aW9ucyk7XG4gICAgfVxuICB9KTtcbn1cblxuLyogYW5hbHl6ZVBvbG9YTVJQcmljZXNcbiAqIGRlc2M6IFRha2VzIHRoZSBleGNoYW5nZSBwcmljZXMgZnJvbSBQb2xvbmlleCBhbmQgZG9lcyB0aGUgZGV0YWlsZWQgY29tcGFyZXMgdG8gZmluZCBhcmJpdHJhZ2VcbiAqICAgICAgIHdpdGhpbiB0aGlzIGV4Y2hhbmdlIGZvciB0aGVpciBYUk0gbWFya2V0LlxuICovXG5mdW5jdGlvbiBhbmFseXplUG9sb1hNUlByaWNlcyhleGNoYW5nZVByaWNlczogYW55LCB0aW1lU3RhbXA6IERhdGUpIHtcblxuICBsZXQgdGltZVN0YW1wU3RyID0gdGltZVN0YW1wLmdldFRpbWUoKTtcbiAgY29uc29sZS5sb2coYHByaWNlQ2hlY2tDb3VudDoke251bWJlck9mQ2hlY2tzfXxYTVJ8bWF4QnV5QXJiOk4vQXxtYXhTZWxsQXJiWE1SOiR7bWF4U2VsbEFyYlhNUn1gKTtcbiAgbGV0IGNvaW5zID0gW1wiTFRDXCIsIFwiWkVDXCIsIFwiTlhUXCIsIFwiREFTSFwiLCBcIkJDTlwiLCBcIk1BSURcIl07XG4gIC8vIENoZWNrIGlmIHNlbGxpbmcgdGhlIGNvaW4gd2lsbCBiZSBwcm9maXRhYmxlXG4gIGNvaW5zLmZvckVhY2goY3VyQ29pbiA9PiB7XG4gICAgbGV0IGJhc2VNYXJrZXQgPSBcIlhNUlwiO1xuICAgIGxldCBiYXNlTWFya2V0X2N1ckNvaW5CaWQgPSBleGNoYW5nZVByaWNlc1tiYXNlTWFya2V0ICsgXCJfXCIgKyBjdXJDb2luXS5oaWdoZXN0QmlkO1xuICAgIGxldCBCVENfYmFzZU1hcmtldEJpZCA9IGV4Y2hhbmdlUHJpY2VzW1wiQlRDXCIgKyBcIl9cIiArIGJhc2VNYXJrZXRdLmhpZ2hlc3RCaWQ7XG4gICAgbGV0IEJUQ19jdXJDb2luQXNrID0gZXhjaGFuZ2VQcmljZXNbXCJCVENcIiArIFwiX1wiICsgY3VyQ29pbl0ubG93ZXN0QXNrO1xuICAgIGxldCBBbXRJbml0ID0gMTtcbiAgICBsZXQgQW10RmluYWwgPSBBbXRJbml0KkJUQ19iYXNlTWFya2V0QmlkKmJhc2VNYXJrZXRfY3VyQ29pbkJpZC9CVENfY3VyQ29pbkFzaztcbiAgICBsZXQgQXJiUmF0aW8gPSBBbXRGaW5hbC9BbXRJbml0O1xuICAgIGxldCBzaG93TWF4ID0gXCJcIjtcbiAgICBpZiAoQXJiUmF0aW8+bWF4U2VsbEFyYlhNUikge1xuICAgICAgbWF4U2VsbEFyYlhNUiA9IEFyYlJhdGlvO1xuICAgICAgc2hvd01heCA9IFwiTmV3TWF4XCI7XG4gICAgfVxuICAgIGlmIChBcmJSYXRpbz4xLjApXG4gICAgICBjb25zb2xlLmxvZyhgUkVDfCR7dGltZVN0YW1wfXwke3RpbWVTdGFtcFN0cn18U2VsbHwke2N1ckNvaW59fFhNUnxBcmJSYXRpbzoke0FyYlJhdGlvfXwke3Nob3dNYXh9YCk7XG4gICAgaWYgKEFyYlJhdGlvID4gdGhyZXNob2xkKSB7XG4gICAgICBsZXQgaW5zdHJ1Y3Rpb25zID0gYEFMRVJUOiBTZWxsICR7QW10SW5pdH0gJHtjdXJDb2lufSBmb3IgJHtBbXRJbml0KmJhc2VNYXJrZXRfY3VyQ29pbkJpZH0gWE1SLCBcbiAgICAgICAgdGhlbiBzZWxsIHRob3NlIFhNUiBmb3IgJHtBbXRJbml0KkJUQ19iYXNlTWFya2V0QmlkKmJhc2VNYXJrZXRfY3VyQ29pbkJpZH0gQlRDLFxuICAgICAgICB0aGVuIHVzZSB0aG9zZSBCVEMgdG8gYnV5ICR7QW10RmluYWx9ICR7Y3VyQ29pbn1gO1xuICAgICAgY29uc29sZS5sb2coaW5zdHJ1Y3Rpb25zKTtcbiAgICB9XG4gIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBydW5Qb2xvQ29pbmJhc2VDb21wYXJlKCkge1xuICBsZXQgcG9sb25pZXhEYXRhID0gYXdhaXQgZ2V0RXhjaGFuZ2VEYXRhKHBvbG9uaWV4VVJMKTtcbiAgbGV0IGNvaW5iYXNlRGF0YVpFQyA9IGF3YWl0IGdldEV4Y2hhbmdlRGF0YShjb2luYmFzZVVSTCtcIi9aRUMtVVNEQy9ib29rXCIpO1xuICBsZXQgY29pbmJhc2VEYXRhRVRIID0gYXdhaXQgZ2V0RXhjaGFuZ2VEYXRhKGNvaW5iYXNlVVJMK1wiL0VUSC1VU0RDL2Jvb2tcIik7XG4gIGxldCBjb2luYmFzZURhdGFCVEMgPSBhd2FpdCBnZXRFeGNoYW5nZURhdGEoY29pbmJhc2VVUkwrXCIvQlRDLVVTREMvYm9va1wiKTtcbiAgY29tcGFyZVBvbG9uaWV4Q29pbmJhc2UocG9sb25pZXhEYXRhLCBjb2luYmFzZURhdGFaRUMsIFwiWkVDXCIpO1xuICBjb21wYXJlUG9sb25pZXhDb2luYmFzZShwb2xvbmlleERhdGEsIGNvaW5iYXNlRGF0YUVUSCwgXCJFVEhcIik7XG4gIGNvbXBhcmVQb2xvbmlleENvaW5iYXNlKHBvbG9uaWV4RGF0YSwgY29pbmJhc2VEYXRhQlRDLCBcIkJUQ1wiKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcnVuUG9sb0JpdHRyZXhDb21wYXJlKCkge1xuXG4gIG51bWJlck9mQ2hlY2tzKys7XG4gIGNvbnNvbGUubG9nKGAtLS0tLS0+Pj4gQmVnaW4gY29tcGFyZSBjeWNsZTogJHtudW1iZXJPZkNoZWNrc30uYClcbiAgLy8gR2V0IG1hcmtldCBkYXRhIGZyb20gdGhlIGV4Y2hhbmdlc1xuICB0cnkge1xuICAgIGxldCBbcG9sb25pZXhEYXRhLCBiaXR0cmV4QUxMXSA9IGF3YWl0IFByb21pc2UuYWxsKFtnZXRFeGNoYW5nZURhdGEocG9sb25pZXhVUkwpLCBnZXRFeGNoYW5nZURhdGEoYml0dHJleFVSTEFsbCldKTtcbiAgICBjb25zb2xlLmxvZyhgcG9sb1RpbWVzdGFtcDogICAgJHtmb3JtYXRUaW1lc3RhbXAocG9sb25pZXhEYXRhLnRpbWVTdGFtcCl9YCk7XG4gICAgY29uc29sZS5sb2coYGJpdHRyZXhUaW1lc3RhbXA6ICR7Zm9ybWF0VGltZXN0YW1wKGJpdHRyZXhBTEwudGltZVN0YW1wKX1gKTtcbiAgICBjb25zb2xlLmxvZyhgRGlmZjogJHtNYXRoLmFicyhwb2xvbmlleERhdGEudGltZVN0YW1wIC0gYml0dHJleEFMTC50aW1lU3RhbXApfW1zYCk7XG4gICAgLy8gUG9sb25pZXggc2VjdGlvbiAtIEFsbCBjb2lucyBmcm9tIG9uZSByZXF1ZXN0XG4gICAgLy8gbGV0IHBvbG9uaWV4RGF0YSA9IGF3YWl0IGdldEV4Y2hhbmdlRGF0YShwb2xvbmlleFVSTCk7XG4gICAgLy8gQml0dHJleCBzZWN0aW9uIC0gQWxsIGNvaW5zIGZyb20gb25lIHJlcXVlc3QuXG4gICAgLy8gbGV0IGJpdHRyZXhBTEwgPSBhd2FpdCBnZXRFeGNoYW5nZURhdGEoYml0dHJleFVSTEFsbCk7XG4gICAgbGV0IGJpdHRyZXhKU09OOiBhbnkgPSBKU09OLnBhcnNlKGJpdHRyZXhBTEwuZXhjaGFuZ2VEYXRhKTtcbiAgICBsZXQgYml0dHJleEJUQ0NvaW5zOiBhbnkgPSB7XG4gICAgICBCVEM6IFtcIkFSRFJcIixcIkJBVFwiLFwiQk5UXCIsXCJCVVJTVFwiLFwiQ1ZDXCIsXCJEQVNIXCIsXCJEQ1JcIixcIkRHQlwiLFwiRE9HRVwiLFwiRVRDXCIsXCJFVEhcIixcIkZDVFwiLFwiR0FNRVwiLFxuICAgICAgICBcIkdOVFwiLFwiTEJDXCIsXCJMT09NXCIsXCJMU0tcIixcIkxUQ1wiLFwiTUFOQVwiLFwiTkFWXCIsXCJOTVJcIixcIk5YVFwiLFwiT01HXCIsXCJQT0xZXCIsXCJQUENcIixcIlFUVU1cIixcIlJFUFwiLFwiU0JEXCIsXG4gICAgICAgIFwiU0NcIixcIlNOVFwiLFwiU1RFRU1cIixcIlNUT1JKXCIsXCJTVFJBVFwiLFwiU1lTXCIsXCJWSUFcIixcIlZUQ1wiLFwiWENQXCIsXCJYRU1cIixcIlhNUlwiLFwiWFJQXCIsXCJaRUNcIixcIlpSWFwiXSxcbiAgICAgIEVUSDogW1wiQkFUXCIsXCJCTlRcIixcIkNWQ1wiLFwiRVRDXCIsXCJHTlRcIixcIk1BTkFcIixcIk9NR1wiLFwiUVRVTVwiLFwiUkVQXCIsXCJTTlRcIixcIlpFQ1wiLFwiWlJYXCJdLFxuICAgICAgVVNEVDogW1wiQkFUXCIsXCJCVENcIixcIkRBU0hcIixcIkRPR0VcIixcIkVUQ1wiLFwiRVRIXCIsXCJMVENcIixcIk5YVFwiLFwiU0NcIixcIlhNUlwiLFwiWFJQXCIsXCJaRUNcIixcIlpSWFwiXVxuICAgIH07XG4gICAgLy8gUHJjb2VzcyBlYWNoIGJhc2UgbWFya2V0IHNlcGVyYXRlbHkuXG4gICAgbGV0IGJhc2VNYXJrZXRzID0gW1wiQlRDXCIsIFwiRVRIXCIsIFwiVVNEVFwiXTtcbiAgICBiYXNlTWFya2V0cy5mb3JFYWNoKChiYXNlTWt0OiBzdHJpbmcpID0+IHtcbiAgICAgIGxldCBiaXR0cmV4VHJpbW1lZDogYW55ID0ge307XG4gICAgICBiaXR0cmV4SlNPTi5yZXN1bHQuZm9yRWFjaCgobWFya2V0OiBhbnkpID0+IHtcbiAgICAgICAgYml0dHJleEJUQ0NvaW5zW2Jhc2VNa3RdLmZvckVhY2goKGNvaW46IHN0cmluZykgPT4ge1xuICAgICAgICAgIGxldCBNYXJrZXROYW1lID0gYmFzZU1rdCtcIi1cIitjb2luLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgICAgaWYgKG1hcmtldC5NYXJrZXROYW1lPT09TWFya2V0TmFtZSkge1xuICAgICAgICAgICAgYml0dHJleFRyaW1tZWRbTWFya2V0TmFtZV0gPSBtYXJrZXQ7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgbGV0IGJpdHRyZXhDb21wYXJlOiBhbnkgPSB7fTtcbiAgICAgIGJpdHRyZXhDb21wYXJlLnRpbWVTdGFtcCA9IGJpdHRyZXhBTEwudGltZVN0YW1wO1xuICAgICAgYml0dHJleENvbXBhcmUuZXhjaGFuZ2VEYXRhID0gYml0dHJleFRyaW1tZWQ7XG4gICAgICBjb21wYXJlQWxsUG9sb25pZXhCaXR0cmV4KHBvbG9uaWV4RGF0YSwgYml0dHJleENvbXBhcmUpO1xuICAgIH0pO1xuICB9XG4gIGNhdGNoKGVycikge1xuICAgIGNvbnNvbGUubG9nKFwiRXJyb3IgcHJvY2Vzc2luZyBQb2xvIEJpdHRyZXggY29tcGFyZS5cIik7XG4gIH1cbn1cblxuLyogcnVuUG9sb0hpdGJ0Y0NvbXBhcmVcbiAqIGRlc2M6IExvYWRzIG1hcmtldCBkYXRhIGZyb20gUG9sb25pZXggYW5kIEhpdGJ0YyB0aGVuIGNvbXBhcmVzIGFsbCBtYXJrZXRzIHRoZXkgaGF2ZSBpbiBjb21tb24uXG4gKiAgICAgICBXaWxsIGJlIGNhbGxlZCByZXBlYXRlZGx5IHVzaW5nIGEgc2V0SW50ZXJ2YWwgdGltZXIuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHJ1blBvbG9IaXRidGNDb21wYXJlKCkge1xuXG4gIG51bWJlck9mQ2hlY2tzKys7XG4gIGNvbnNvbGUubG9nKGAtLS0tLS0+Pj4gQmVnaW4gY29tcGFyZSBjeWNsZTogJHtudW1iZXJPZkNoZWNrc30uYClcbiAgdHJ5IHtcbiAgICBsZXQgW2hpdGJ0Y0RhdGEsIHBvbG9uaWV4RGF0YV0gPSBhd2FpdCBQcm9taXNlLmFsbChbZ2V0RXhjaGFuZ2VEYXRhKGhpdGJ0Y1VSTCksIGdldEV4Y2hhbmdlRGF0YShwb2xvbmlleFVSTCldKTtcbiAgICBjb25zb2xlLmxvZyhgcG9sb1RpbWVzdGFtcDogICAke2Zvcm1hdFRpbWVzdGFtcChwb2xvbmlleERhdGEudGltZVN0YW1wKX1gKTtcbiAgICBjb25zb2xlLmxvZyhgaGl0QnRjVGltZXN0YW1wOiAke2Zvcm1hdFRpbWVzdGFtcChoaXRidGNEYXRhLnRpbWVTdGFtcCl9YCk7XG4gICAgY29uc29sZS5sb2coYERpZmY6ICR7TWF0aC5hYnMocG9sb25pZXhEYXRhLnRpbWVTdGFtcCAtIGhpdGJ0Y0RhdGEudGltZVN0YW1wKX1tc2ApO1xuXG4gICAgLy8gR2V0IGRhdGEgZnJvbSB0aGUgZXhjaGFuZ2VzXG4gICAgLy8gSGl0YnRjIHNlY3Rpb24gLSBBbGwgY29pbnMgZnJvbSBvbmUgcmVxdWVzdC5cbiAgICAvL2xldCBoaXRidGNEYXRhID0gYXdhaXQgZ2V0RXhjaGFuZ2VEYXRhKGhpdGJ0Y1VSTCk7ICBcbiAgICAvLyBQb2xvbmlleCBzZWN0aW9uIC0gQWxsIGNvaW5zIGZyb20gb25lIHJlcXVlc3RcbiAgICAvLyBsZXQgcG9sb25pZXhEYXRhID0gYXdhaXQgZ2V0RXhjaGFuZ2VEYXRhKHBvbG9uaWV4VVJMKTtcblxuICAgIC8vIFRoaXMgaXMgdGhlIGxpc3Qgb2YgbWFya2V0cyBzaGFyZWQgYmV0d2VlbiBQb2xvbmlleCBhbmQgSGl0YnRjLlxuICAgIGxldCBoaXRidGNNYXJrZXRzOiBBcnJheTxzdHJpbmc+ID0gW1wiQkNOQlRDXCIsXCJEQVNIQlRDXCIsXCJET0dFQlRDXCIsXCJFVEhCVENcIixcIkxTS0JUQ1wiLFwiTFRDQlRDXCIsXCJOWFRCVENcIixcIlNCREJUQ1wiLFwiU0NCVENcIixcbiAgICAgIFwiU1RFRU1CVENcIixcIlhFTUJUQ1wiLFwiWE1SQlRDXCIsXCJBUkRSQlRDXCIsXCJaRUNCVENcIixcIk1BSURCVENcIixcIlJFUEJUQ1wiLFwiRVRDQlRDXCIsXCJCTlRCVENcIixcIlNOVEVUSFwiLFxuICAgICAgXCJPTUdFVEhcIixcIkVUQ0VUSFwiLFwiWkVDRVRIXCIsXCJYUlBCVENcIixcIlNUUkFUQlRDXCIsXCJFT1NFVEhcIixcIkVPU0JUQ1wiLFwiQk5URVRIXCIsXCJaUlhCVENcIixcIlpSWEVUSFwiLFxuICAgICAgXCJQUENCVENcIixcIlFUVU1FVEhcIixcIkRHQkJUQ1wiLFwiT01HQlRDXCIsXCJTTlRCVENcIixcIlhSUFVTRFRcIixcIk1BTkFFVEhcIixcbiAgICAgIFwiTUFOQUJUQ1wiLFwiUVRVTUJUQ1wiLFwiTFNLRVRIXCIsXCJSRVBFVEhcIixcIlJFUFVTRFRcIixcIkdOVEJUQ1wiLFwiR05URVRIXCIsXCJCVFNCVENcIixcIkJBVEJUQ1wiLFwiQkFURVRIXCIsXCJCQ0hBQkNCVENcIixcbiAgICAgIFwiQkNIU1ZCVENcIixcIk5NUkJUQ1wiLFwiUE9MWUJUQ1wiLFwiU1RPUkpCVENcIl07XG5cbiAgICAvLyBHZXQgc3Vic2V0IG9mIEhpdGJ0YyBkYXRhIG9ubHkgaW5jbHVkaW5nIHRoZSBtYXJrZXRzIHdoaWNoIG92ZXJsYXAgd2l0aCBQb2xvbmlleFxuICAgIGxldCBoaXRidGNKU09OID0gSlNPTi5wYXJzZShoaXRidGNEYXRhLmV4Y2hhbmdlRGF0YSk7XG4gICAgbGV0IGhpdGJ0Y1RyaW1tZWQ6IGFueSA9IHt9O1xuICAgIGhpdGJ0Y01hcmtldHMuZm9yRWFjaChtYXJrZXQgPT4ge1xuICAgICAgaGl0YnRjSlNPTi5mb3JFYWNoKChleGNoYW5nZURhdGE6IGFueSkgPT4ge1xuICAgICAgICBpZihleGNoYW5nZURhdGEuc3ltYm9sPT09bWFya2V0KVxuICAgICAgICAgIGhpdGJ0Y1RyaW1tZWRbbWFya2V0XSA9IGV4Y2hhbmdlRGF0YTtcbiAgICAgIH0pOyAgICAgXG4gICAgfSk7XG4gICAgbGV0IGhpdGJ0Y0NvbXBhcmU6IGFueSA9IHt9O1xuICAgIGhpdGJ0Y0NvbXBhcmUudGltZVN0YW1wID0gaGl0YnRjRGF0YS50aW1lU3RhbXA7XG4gICAgaGl0YnRjQ29tcGFyZS5leGNoYW5nZURhdGEgPSBoaXRidGNUcmltbWVkO1xuICAgIGNvbXBhcmVBbGxQb2xvbmlleEhpdGJ0Yyhwb2xvbmlleERhdGEsIGhpdGJ0Y0NvbXBhcmUpO1xuICB9XG4gIGNhdGNoKGVycikge1xuICAgIGNvbnNvbGUubG9nKFwiRXJyb3IgaW4gUG9sb25pZXggSGl0YnRjIGNvbXBhcmUuXCIpO1xuICAgIGNvbnNvbGUubG9nKGVycik7XG4gIH1cbn1cblxuLyogcnVuQml0dHJleEhpdGJ0Y0NvbXBhcmVcbiAqIGRlc2M6IExvYWRzIG1hcmtldCBkYXRhIGZyb20gQml0dHJleCBhbmQgSGl0YnRjIHRoZW4gY29tcGFyZXMgYWxsIG1hcmtldHMgdGhleSBoYXZlIGluIGNvbW1vbi5cbiAqICAgICAgIFdpbGwgYmUgY2FsbGVkIHJlcGVhdGVkbHkgdXNpbmcgYSBzZXRJbnRlcnZhbCB0aW1lci5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gcnVuQml0dHJleEhpdGJ0Y0NvbXBhcmUoKSB7XG5cbiAgbnVtYmVyT2ZDaGVja3MrKztcbiAgLy8gR2V0IG1hcmtldCBkYXRhIGZyb20gdGhlIHR3byBleGNoYW5nZXMuXG4gIGxldCBoaXRidGNEYXRhID0gYXdhaXQgZ2V0RXhjaGFuZ2VEYXRhKGhpdGJ0Y1VSTCk7ICBcbiAgbGV0IGJpdHRyZXhEYXRhID0gYXdhaXQgZ2V0RXhjaGFuZ2VEYXRhKGJpdHRyZXhVUkxBbGwpO1xuICBjb21wYXJlQWxsQml0dHJleEhpdGJ0YyhiaXR0cmV4RGF0YSwgaGl0YnRjRGF0YSk7XG59XG5cblxuYXN5bmMgZnVuY3Rpb24gcnVuUG9sb1lvYml0Q29tcGFyZSgpIHtcblxuICBudW1iZXJPZkNoZWNrcysrO1xuICAvLyBQb2xvbmlleCBzZWN0aW9uIC0gQWxsIGNvaW5zIGZyb20gb25lIHJlcXVlc3RcbiAgbGV0IHBvbG9uaWV4RGF0YSA9IGF3YWl0IGdldEV4Y2hhbmdlRGF0YShwb2xvbmlleFVSTCk7XG4gIC8vIEJpdHRyZXggc2VjdGlvbiAtIEFsbCBjb2lucyBmcm9tIG9uZSByZXF1ZXN0LlxuICAvLyBCaXR0cmV4IG1hcmtldCBzdW1tYXJ5IC0gQWxsIGNvaW5zIGZyb20gb25lIHJlcXVlc3QuXG4gIGxldCB5b2JpdE1hcmtldHMgPSBbXG4gICAgXCJsdGNfYnRjXCIsIFwiZXRoX2J0Y1wiXG4gIF07XG4gIGxldCB0aWNrZXJMaXN0ID0gXCJcIjtcbiAgZm9yKGxldCBpPTA7IGk8eW9iaXRNYXJrZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgdGlja2VyTGlzdCArPSB5b2JpdE1hcmtldHNbaV07XG4gICAgaWYgKGkhPXlvYml0TWFya2V0cy5sZW5ndGgtMSlcbiAgICAgIHRpY2tlckxpc3QgKz0gXCItXCI7XG4gIH1cbiAgbGV0IHlvYml0VVJMID0geW9iaXRCYXNlVVJMICsgdGlja2VyTGlzdDtcbiAgY29uc29sZS5sb2coXCJSdW4gcXVlcnkgZm9yIGRhdGEgYXQ6XCIsIHlvYml0VVJMKTtcbiAgbGV0IHlvYml0RGF0YSA9IGF3YWl0IGdldEV4Y2hhbmdlRGF0YSh5b2JpdFVSTCk7ICBcbiAgY29uc29sZS5sb2coXCJ5b2JpdERhdGE6XCIsIHlvYml0RGF0YSk7XG4gIGNvbXBhcmVBbGxQb2xvbmlleFlvYml0KHBvbG9uaWV4RGF0YSwgeW9iaXREYXRhKTtcbn1cblxuLyogcnVuWW9iaXRJbnRlcm5hbENvbXBhcmVcbiAqIGRlc2M6IENoZWNrcyBpbnRlbnJhbCBwcmljZXMgZm9yIHRoZSBZb2JpdCBleGNoYW5nZSB0byBzZWUgaWYgYW55IGNhc2VzIGV4aXN0IHdpdGhcbiAqICAgICAgIHRoZSBBcmIgRmFjdG9yIGlzIGdyZWF0ZXIgdGhhbiBvbmUuXG4gKi9cbmZ1bmN0aW9uIHJ1bllvYml0SW50ZXJuYWxDb21wYXJlKCkge1xuXG4gIG51bWJlck9mQ2hlY2tzKys7XG4gIGxldCB5b2JpdE1hcmtldHMgPSBbXG4gICAgICBcInplY1wiLCBcImxza1wiLCBcImV0Y1wiLCBcImx0Y1wiLCBcImZ0b1wiLCBcImVkcjJcIiwgXCJsYnJcIiwgXCJiYW5cIiwgXCJraW5cIiwgXCJuYnRcIixcbiAgICAgIFwicm50YlwiLCBcImJ1bm55XCIsIFwidHJ4XCIsIFwia2JjXCIsIFwidnJ0bVwiLCBcImh1clwiLCBcIm5vYWhcIiwgXCJ4cnBcIiwgXCJkb2dlXCIsIFxuICAgICAgXCJlZGl0XCIsIFwiZXZuXCIsIFwiZXhtclwiLCBcInBheXBcIiwgXCJ5b3ppXCIsIFwid2F2ZXNcIiwgXCJueWNcIixcbiAgICAgIFwiZGdiXCIsIFwiZHV4XCIsIFwiZGFzaFwiXTtcbiAgbGV0IGJhc2VNYXJrZXRzID0gW1xuICAgICAgXCJidGNcIiwgXCJldGhcIlxuICAgIF07XG4gIHJ1bllvYml0QmFzZU1rdENvbXBhcmUoYmFzZU1hcmtldHMsIHlvYml0TWFya2V0cyk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJ1bllvYml0QmFzZU1rdENvbXBhcmUoYmFzZU1hcmtldHM6IEFycmF5PHN0cmluZz4sIHlvYml0TWFya2V0czogQXJyYXk8c3RyaW5nPikge1xuXG4gIC8vIFlvYml0IGFjY2VwdHMgbXVsdGlwbGUgdGlja2VycyBpbiB0aGUgVVJMIHVzaW5nIGEgZGFzaCBzZXBlcmF0ZWQgZm9ybWF0LlxuICAvLyBFeC4gaHR0cHM6Ly95b2JpdC5uZXQvYXBpLzMvdGlja2VyL2V0aF9idGMtemVjX2J0Yy16ZWNfZXRoXG4gIC8vXG4gIC8vIFdpbGwgcmV0dXJuIGRhdGEgaW4gdGhlIGZvcm1hdCxcbiAgLy9cbiAgLy8ge1wiZXRoX2J0Y1wiOlxuICAvLyAgICB7XCJoaWdoXCI6MC4wMzMwOSxcImxvd1wiOjAuMDMyMzUzODgsXCJhdmdcIjowLjAzMjcyMTk0LFwidm9sXCI6MTAwOC4wNjcwNjA2NixcInZvbF9jdXJcIjozMDY0MC4yNzgyNDcyOCxcImxhc3RcIjowLjAzMjg2Mjc0LFwiYnV5XCI6MC4wMzI3ODE4NyxcInNlbGxcIjowLjAzMjkxMjU5LFwidXBkYXRlZFwiOjE1NDgxNjcxNzF9LFxuICAvLyAgXCJ6ZWNfYnRjXCI6XG4gIC8vICAgIHtcImhpZ2hcIjowLjAxNDcxNDA3LFwibG93XCI6MC4wMTQ0NDQ4LFwiYXZnXCI6MC4wMTQ1Nzk0MyxcInZvbFwiOjg2Ni4xMjM3MDcxMixcInZvbF9jdXJcIjo1OTE5MS4xNjM3OTEzMyxcImxhc3RcIjowLjAxNDU5NTU3LFwiYnV5XCI6MC4wMTQ1Mzg3MSxcInNlbGxcIjowLjAxNDY0ODgyLFwidXBkYXRlZFwiOjE1NDgxNjcxNjh9LFxuICAvLyAgXCJ6ZWNfZXRoXCI6XG4gIC8vICAgIHtcImhpZ2hcIjowLjQ0ODU5MjM5LFwibG93XCI6MC40MzcxOTkwNCxcImF2Z1wiOjAuNDQyODk1NzEsXCJ2b2xcIjozLjQ3ODQzMzU0LFwidm9sX2N1clwiOjcuNzc3NzExNDIsXCJsYXN0XCI6MC40NDg1OTIzOSxcImJ1eVwiOjAuNDQwMDg1OTYsXCJzZWxsXCI6MC40NDg1OTIzOCxcInVwZGF0ZWRcIjoxNTQ4MTY2MDUyfVxuICAvLyB9XG5cbiAgLy8gQ3JlYXRlIHRpY2tlciBsaXN0IGluIGZvcm1hdCBZb2JpdCB3aWxsIGFjY2VwdC5cbiAgbGV0IHRpY2tlckxpc3RTdHIgPSBcIlwiO1xuICBmb3IobGV0IGk9MDsgaTx5b2JpdE1hcmtldHMubGVuZ3RoOyBpKyspIHtcbiAgICB0aWNrZXJMaXN0U3RyICs9IHlvYml0TWFya2V0c1tpXSArIFwiX1wiICsgYmFzZU1hcmtldHNbMF0gKyBcIi1cIjtcbiAgICB0aWNrZXJMaXN0U3RyICs9IHlvYml0TWFya2V0c1tpXSArIFwiX1wiICsgYmFzZU1hcmtldHNbMV07XG4gICAgaWYgKGkhPXlvYml0TWFya2V0cy5sZW5ndGgtMSlcbiAgICAgIHRpY2tlckxpc3RTdHIgKz0gXCItXCI7XG4gICAgZWxzZVxuICAgICAgdGlja2VyTGlzdFN0ciArPSBcIi1cIiArIGJhc2VNYXJrZXRzWzFdICsgXCJfXCIgKyBiYXNlTWFya2V0c1swXTtcbiAgfVxuICBsZXQgeW9iaXRNa3QgPSBhd2FpdCBnZXRFeGNoYW5nZURhdGEoeW9iaXRCYXNlVVJMICsgdGlja2VyTGlzdFN0cik7ICBcbiAgdHJ5IHtcbiAgICBsZXQgbWt0RGF0YSA9IEpTT04ucGFyc2UoeW9iaXRNa3QuZXhjaGFuZ2VEYXRhKTtcbiAgICAvLyBBbmFseXplIFlvYml0IG1hcmtldCBsb29raW5nIGZvciBwcmljZSBhbm9tb2xpZXNcbiAgICBpbnRlcm5hbENvbXBhcmVGb3JZb2JpdChta3REYXRhLCB5b2JpdE1hcmtldHMsIGJhc2VNYXJrZXRzKTtcbiAgfVxuICBjYXRjaChlKSB7XG4gICAgY29uc29sZS5sb2coXCJJbnZhbGlkIG1hcmtldCBkYXRhIHJldHVybmVkIGZyb206XCIsIHlvYml0QmFzZVVSTCk7XG4gICAgY29uc29sZS5sb2coXCJEYXRhIG9iamVjdCByZXR1cm5lZDpcIiwgeW9iaXRNa3QpO1xuICB9XG59XG5cblxuLy8gU2V0IHRoZSBkZWZhdWx0IGNvcGFyZSB0byBydW4uXG5sZXQgY29tcGFyZVRvUnVuOiBQcm9taXNlPHZvaWQ+ID0gcnVuUG9sb0JpdHRyZXhDb21wYXJlO1xuaWYgKHByb2Nlc3MuYXJndi5sZW5ndGg+PTMpIHtcbiAgaWYgKHByb2Nlc3MuYXJndlsyXT09PVwicG9sb2ludGVybmFsXCIpIHtcbiAgICBjb25zb2xlLmxvZyhgUnVubmluZyBwb2xvaW50ZXJuYWwgY29tcGFyZS5gKTtcbiAgICBjb21wYXJlVG9SdW4gPSBwb2xvSW50ZXJuYWxDb21wYXJlO1xuICB9XG4gIGVsc2Uge1xuICAgIGlmIChwcm9jZXNzLmFyZ3ZbMl09PT1cInBvbG9jb2luYmFzZVwiKSB7XG4gICAgICBjb21wYXJlVG9SdW4gPSBydW5Qb2xvQ29pbmJhc2VDb21wYXJlO1xuICAgICAgY29uc29sZS5sb2coXCJSdW5uaW5nIFBvbG9Db2luYmFzZUNvbXBhcmUuXCIpO1xuICAgIH1cbiAgICBlbHNlIGlmIChwcm9jZXNzLmFyZ3ZbMl09PT1cInBvbG9oaXRidGNcIikge1xuICAgICAgY29tcGFyZVRvUnVuID0gcnVuUG9sb0hpdGJ0Y0NvbXBhcmU7XG4gICAgICBjb25zb2xlLmxvZyhcIlJ1bm5pbmcgUG9sb0hpdGJ0Y0NvbXBhcmUuXCIpXG4gICAgfVxuICAgIGVsc2UgaWYgKHByb2Nlc3MuYXJndlsyXT09PVwiYml0dHJleGhpdGJ0Y1wiKSB7XG4gICAgICBjb21wYXJlVG9SdW4gPSBydW5CaXR0cmV4SGl0YnRjQ29tcGFyZTtcbiAgICAgIGNvbnNvbGUubG9nKFwiUnVubmluZyBydW5CaXR0cmV4SGl0YnRjQ29tcGFyZS5cIilcbiAgICB9XG4gICAgZWxzZSBpZiAocHJvY2Vzcy5hcmd2WzJdPT09XCJwb2xveW9iaXRcIikge1xuICAgICAgY29tcGFyZVRvUnVuID0gcnVuUG9sb1lvYml0Q29tcGFyZTtcbiAgICAgIGNvbnNvbGUubG9nKFwiUnVubmluZyBydW5Qb2xvWW9iaXRDb21wYXJlLlwiKVxuICAgIH1cbiAgICBlbHNlIGlmIChwcm9jZXNzLmFyZ3ZbMl09PT1cInlvYml0aW50ZXJuYWxcIikge1xuICAgICAgY29tcGFyZVRvUnVuID0gcnVuWW9iaXRJbnRlcm5hbENvbXBhcmU7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICBjb25zb2xlLmxvZyhcIlJ1bm5pbmcgZGVmYXVsdCBwb2xvIGJpdHRyZXggY29tcGFyZS5cIik7XG4gICAgfVxuICB9XG59XG5sZXQgbmV3SW50ZXJhbCA9IDEwMDAqKHRpbWVJblNlY29uZHNCZXR3ZWVuUHJpY2VDaGVja3MgKyA1Kk1hdGgucmFuZG9tKCkpO1xuY29uc29sZS5sb2coYFNldHRpbmcgdGhlIHRpbWVyIGludGVydmFsIHRvICR7bmV3SW50ZXJhbC8xMDAwfSBzZWNvbmRzLmAgKTtcbmNvbXBhcmVUb1J1bigpO1xuaW50ZXJ2YWxIYW5kZWwgPSBzZXRJbnRlcnZhbChjb21wYXJlVG9SdW4sIG5ld0ludGVyYWwpO1xuIl19