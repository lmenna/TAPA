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

var timeInSecondsBetweenPriceChecks = 15;
var poloniexURL = "https://poloniex.com/public?command=returnTicker";
var coinbaseURL = "https://api.pro.coinbase.com/products";
var yobitBaseURL = "https://yobit.net/api/3/ticker/";
var threshold = 1.01;
var numberOfChecks = 0;
var intervalHandel = -1;
var maxBuyArb = 0;
var maxSellArb = 0;
var maxSellArbETH = 0;
var maxSellArbXMR = 0;
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
  return _poloInternalCompare.apply(this, arguments);
}
/* analyzePoloBTCPrices
 * desc: Takes the exchange prices from Poloniex and does the detailed compares to find arbitrage
 *       within this exchange.  It does this for the BTC market.
 */


function _poloInternalCompare() {
  _poloInternalCompare = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee() {
    var poloniexData, timeStamp, exchangeObject, coins, baseStableCoin;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            console.log("BEGIN: poloInternalCompare");
            _context.prev = 1;
            _context.next = 4;
            return (0, _getCryptoData.getExchangeMkt)("poloniex");

          case 4:
            poloniexData = _context.sent;
            numberOfChecks++;
            timeStamp = new Date();
            exchangeObject = JSON.parse(poloniexData.exchangeData);
            coins = ["FOAM", "ZEC", "LTC", "ETH", "XRP", "STR", "XMR", "DOGE", "BCHABC", "BCHSV"];
            baseStableCoin = "USDC";
            analyzePoloBTCPrices(exchangeObject, baseStableCoin, coins, timeStamp);
            coins = ["BAT", "BNT", "DASH", "DOGE", "EOS", "ETC", "ETH", "GNT", "KNC", "LOOM", "LSK", "LTC", "MANA", "NXT", "QTUM", "REP", "SC", "SNT", "STR", "XMR", "XRP", "ZEC", "ZRX"];
            baseStableCoin = "USDT";
            analyzePoloBTCPrices(exchangeObject, baseStableCoin, coins, timeStamp);
            analyzePoloETHPrices(exchangeObject, timeStamp);
            analyzePoloXMRPrices(exchangeObject, timeStamp);
            _context.next = 22;
            break;

          case 18:
            _context.prev = 18;
            _context.t0 = _context["catch"](1);
            console.log("Error getting Poloniex market data.");
            console.log(_context.t0);

          case 22:
            console.log("END: poloInternalCompare");

          case 23:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[1, 18]]);
  }));
  return _poloInternalCompare.apply(this, arguments);
}

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
      console.log("Something needs to happen!");
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
      console.log("Something needs to happen!");
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
  regeneratorRuntime.mark(function _callee2() {
    var poloniexData, coinbaseDataZEC, coinbaseDataETH, coinbaseDataBTC;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return (0, _getCryptoData.getExchangeMkt)("poloniex");

          case 2:
            poloniexData = _context2.sent;
            _context2.next = 5;
            return (0, _getCryptoData.getDataFromURL)(coinbaseURL + "/ZEC-USDC/book");

          case 5:
            coinbaseDataZEC = _context2.sent;
            _context2.next = 8;
            return (0, _getCryptoData.getDataFromURL)(coinbaseURL + "/ETH-USDC/book");

          case 8:
            coinbaseDataETH = _context2.sent;
            _context2.next = 11;
            return (0, _getCryptoData.getDataFromURL)(coinbaseURL + "/BTC-USDC/book");

          case 11:
            coinbaseDataBTC = _context2.sent;
            (0, _comparePricingData.comparePoloniexCoinbase)(poloniexData, coinbaseDataZEC, "ZEC");
            (0, _comparePricingData.comparePoloniexCoinbase)(poloniexData, coinbaseDataETH, "ETH");
            (0, _comparePricingData.comparePoloniexCoinbase)(poloniexData, coinbaseDataBTC, "BTC");

          case 15:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
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
  regeneratorRuntime.mark(function _callee3() {
    var _ref, _ref2, poloniexData, bittrexALL, bittrexJSON, bittrexBTCCoins, baseMarkets;

    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            numberOfChecks++;
            console.log("------>>> Begin compare cycle: ".concat(numberOfChecks, ".")); // Get market data from the exchanges

            _context3.prev = 2;
            _context3.next = 5;
            return Promise.all([(0, _getCryptoData.getExchangeMkt)("poloniex"), (0, _getCryptoData.getExchangeMkt)("bittrex")]);

          case 5:
            _ref = _context3.sent;
            _ref2 = _slicedToArray(_ref, 2);
            poloniexData = _ref2[0];
            bittrexALL = _ref2[1];
            console.log("poloTimestamp:    ".concat(formatTimestamp(poloniexData.timeStamp)));
            console.log("bittrexTimestamp: ".concat(formatTimestamp(bittrexALL.timeStamp)));
            console.log("Diff: ".concat(Math.abs(poloniexData.timeStamp - bittrexALL.timeStamp), "ms"));
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
            _context3.next = 22;
            break;

          case 18:
            _context3.prev = 18;
            _context3.t0 = _context3["catch"](2);
            console.log("Error processing Polo Bittrex compare.");
            console.log(_context3.t0);

          case 22:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, this, [[2, 18]]);
  }));
  return _runPoloBittrexCompare.apply(this, arguments);
}

function runPoloHitbtcCompare() {
  return _runPoloHitbtcCompare.apply(this, arguments);
}
/* runPoloBinanceCompare
 * desc: Loads market data from Poloniex and Binance then compares all markets they have in common.
 *       Will be called repeatedly using a setInterval timer.
 */


function _runPoloHitbtcCompare() {
  _runPoloHitbtcCompare = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee4() {
    var _ref3, _ref4, hitbtcData, poloniexData, hitbtcMarkets, hitbtcJSON, hitbtcTrimmed, hitbtcCompare;

    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            numberOfChecks++;
            console.log("------>>> Begin compare cycle: ".concat(numberOfChecks, "."));
            _context4.prev = 2;
            _context4.next = 5;
            return Promise.all([(0, _getCryptoData.getExchangeMkt)("hitbtc"), (0, _getCryptoData.getExchangeMkt)("poloniex")]);

          case 5:
            _ref3 = _context4.sent;
            _ref4 = _slicedToArray(_ref3, 2);
            hitbtcData = _ref4[0];
            poloniexData = _ref4[1];
            console.log("poloTimestamp:   ".concat(formatTimestamp(poloniexData.timeStamp)));
            console.log("hitBtcTimestamp: ".concat(formatTimestamp(hitbtcData.timeStamp)));
            console.log("Diff: ".concat(Math.abs(poloniexData.timeStamp - hitbtcData.timeStamp), "ms")); // This is the list of markets shared between Poloniex and Hitbtc.

            hitbtcMarkets = ["BCNBTC", "DASHBTC", "DOGEBTC", "ETHBTC", "LSKBTC", "LTCBTC", "NXTBTC", "SBDBTC", "SCBTC", "STEEMBTC", "XEMBTC", "XMRBTC", "ARDRBTC", "ZECBTC", "MAIDBTC", "REPBTC", "ETCBTC", "BNTBTC", "SNTETH", "OMGETH", "ETCETH", "ZECETH", "XRPBTC", "STRATBTC", "EOSETH", "EOSBTC", "BNTETH", "ZRXBTC", "ZRXETH", "PPCBTC", "QTUMETH", "DGBBTC", "OMGBTC", "SNTBTC", "XRPUSDT", "MANAETH", "MANABTC", "QTUMBTC", "LSKETH", "REPETH", "REPUSDT", "GNTBTC", "GNTETH", "BTSBTC", "BATBTC", "BATETH", "BCHABCBTC", "BCHSVBTC", "STORJBTC"]; // Get subset of Hitbtc data only including the markets which overlap with Poloniex

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
            _context4.next = 26;
            break;

          case 22:
            _context4.prev = 22;
            _context4.t0 = _context4["catch"](2);
            console.log("Error in Poloniex Hitbtc compare.");
            console.log(_context4.t0);

          case 26:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, this, [[2, 22]]);
  }));
  return _runPoloHitbtcCompare.apply(this, arguments);
}

function runPoloBinanceCompare() {
  return _runPoloBinanceCompare.apply(this, arguments);
}
/* runBittrexHitbtcCompare
 * desc: Loads market data from Bittrex and Hitbtc then compares all markets they have in common.
 *       Will be called repeatedly using a setInterval timer.
 */


function _runPoloBinanceCompare() {
  _runPoloBinanceCompare = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee5() {
    var _ref5, _ref6, binanceData, poloniexData;

    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            numberOfChecks++;
            console.log("------>>> Begin compare cycle: ".concat(numberOfChecks, "."));
            _context5.prev = 2;
            _context5.next = 5;
            return Promise.all([(0, _getCryptoData.getExchangeMkt)("binance"), (0, _getCryptoData.getExchangeMkt)("poloniex")]);

          case 5:
            _ref5 = _context5.sent;
            _ref6 = _slicedToArray(_ref5, 2);
            binanceData = _ref6[0];
            poloniexData = _ref6[1];
            console.log("poloTimestamp:   ".concat(formatTimestamp(poloniexData.timeStamp)));
            console.log("binanceTimestamp: ".concat(formatTimestamp(binanceData.timeStamp)));
            console.log("Diff: ".concat(Math.abs(poloniexData.timeStamp - binanceData.timeStamp), "ms"));
            (0, _comparePricingData.compareAllPoloniexBinance)(poloniexData, binanceData); // Get subset of Hitbtc data only including the markets which overlap with Poloniex
            // let binanceJSON = JSON.parse(binanceData.exchangeData);
            // let hitbtcTrimmed: any = {};
            // hitbtcMarkets.forEach(market => {
            //   hitbtcJSON.forEach((exchangeData: any) => {
            //     if(exchangeData.symbol===market)
            //       hitbtcTrimmed[market] = exchangeData;
            //   });     
            // });
            // let hitbtcCompare: any = {};
            // hitbtcCompare.timeStamp = hitbtcData.timeStamp;
            // hitbtcCompare.exchangeData = hitbtcTrimmed;
            // 

            _context5.next = 19;
            break;

          case 15:
            _context5.prev = 15;
            _context5.t0 = _context5["catch"](2);
            console.log("Error in Poloniex Binance compare.");
            console.log(_context5.t0);

          case 19:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5, this, [[2, 15]]);
  }));
  return _runPoloBinanceCompare.apply(this, arguments);
}

function runBittrexHitbtcCompare() {
  return _runBittrexHitbtcCompare.apply(this, arguments);
}

function _runBittrexHitbtcCompare() {
  _runBittrexHitbtcCompare = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee6() {
    var hitbtcData, bittrexData;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            numberOfChecks++; // Get market data from the two exchanges.

            _context6.next = 3;
            return (0, _getCryptoData.getExchangeMkt)("hitbtc");

          case 3:
            hitbtcData = _context6.sent;
            _context6.next = 6;
            return (0, _getCryptoData.getExchangeMkt)("bittrex");

          case 6:
            bittrexData = _context6.sent;
            (0, _comparePricingData.compareAllBittrexHitbtc)(bittrexData, hitbtcData);

          case 8:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6, this);
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
  regeneratorRuntime.mark(function _callee7() {
    var poloniexData, yobitMarkets, tickerList, i, yobitURL, yobitData;
    return regeneratorRuntime.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            numberOfChecks++; // Poloniex section - All coins from one request

            _context7.next = 3;
            return (0, _getCryptoData.getExchangeMkt)("poloniex");

          case 3:
            poloniexData = _context7.sent;
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
            _context7.next = 11;
            return (0, _getCryptoData.getDataFromURL)(yobitURL);

          case 11:
            yobitData = _context7.sent;
            console.log("yobitData:", yobitData);
            (0, _comparePricingData.compareAllPoloniexYobit)(poloniexData, yobitData);

          case 14:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7, this);
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
}

function _runYobitBaseMktCompare() {
  _runYobitBaseMktCompare = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee8(baseMarkets, yobitMarkets) {
    var tickerListStr, i, yobitMkt, mktData;
    return regeneratorRuntime.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
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

            _context8.next = 4;
            return (0, _getCryptoData.getDataFromURL)(yobitBaseURL + tickerListStr);

          case 4:
            yobitMkt = _context8.sent;

            try {
              mktData = JSON.parse(yobitMkt.exchangeData); // Analyze Yobit market looking for price anomolies

              (0, _comparePricingData.internalCompareForYobit)(mktData, yobitMarkets, baseMarkets);
            } catch (e) {
              console.log("Invalid market data returned from:", yobitBaseURL);
              console.log("Data object returned:", yobitMkt);
            }

          case 6:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8, this);
  }));
  return _runYobitBaseMktCompare.apply(this, arguments);
}

function runTest() {
  return _runTest.apply(this, arguments);
} // Set the default copare to run.


function _runTest() {
  _runTest = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee9() {
    var mktDepth;
    return regeneratorRuntime.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            _context9.prev = 0;
            _context9.next = 3;
            return (0, _getCryptoData.getExchangeMktDepth)("poloniex", "BTC_LBC", 10);

          case 3:
            mktDepth = _context9.sent;
            console.log(mktDepth);
            _context9.next = 7;
            return (0, _getCryptoData.getExchangeMktDepth)("bittrex", "BTC-LBC");

          case 7:
            mktDepth = _context9.sent;
            console.log(mktDepth);
            _context9.next = 11;
            return (0, _getCryptoData.getExchangeMktDepth)("hitbtc", "ETHBTC");

          case 11:
            mktDepth = _context9.sent;
            console.log(mktDepth);
            _context9.next = 18;
            break;

          case 15:
            _context9.prev = 15;
            _context9.t0 = _context9["catch"](0);
            console.log(_context9.t0);

          case 18:
          case "end":
            return _context9.stop();
        }
      }
    }, _callee9, this, [[0, 15]]);
  }));
  return _runTest.apply(this, arguments);
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
      console.log("Running runYobitInternalCompare.");
    } else if (process.argv[2] === "polobinance") {
      compareToRun = runPoloBinanceCompare;
      console.log("Running runPoloBinanceCompare.");
    } else {
      console.log("Running default polo bittrex compare.");
    }
  }
}

var newInteral = 1000 * (timeInSecondsBetweenPriceChecks + 5 * Math.random());
console.log("Setting the timer interval to ".concat(newInteral / 1000, " seconds."));
compareToRun();
intervalHandel = setInterval(compareToRun, newInteral); //runTest();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcHAudHMiXSwibmFtZXMiOlsicmVxdWlyZSIsIlhNTEh0dHBSZXF1ZXN0IiwidGltZUluU2Vjb25kc0JldHdlZW5QcmljZUNoZWNrcyIsInBvbG9uaWV4VVJMIiwiY29pbmJhc2VVUkwiLCJ5b2JpdEJhc2VVUkwiLCJ0aHJlc2hvbGQiLCJudW1iZXJPZkNoZWNrcyIsImludGVydmFsSGFuZGVsIiwibWF4QnV5QXJiIiwibWF4U2VsbEFyYiIsIm1heFNlbGxBcmJFVEgiLCJtYXhTZWxsQXJiWE1SIiwiZm9ybWF0VGltZXN0YW1wIiwidGltZVN0YW1wIiwidG9TdHJpbmciLCJzbGljZSIsInBvbG9JbnRlcm5hbENvbXBhcmUiLCJjb25zb2xlIiwibG9nIiwicG9sb25pZXhEYXRhIiwiRGF0ZSIsImV4Y2hhbmdlT2JqZWN0IiwiSlNPTiIsInBhcnNlIiwiZXhjaGFuZ2VEYXRhIiwiY29pbnMiLCJiYXNlU3RhYmxlQ29pbiIsImFuYWx5emVQb2xvQlRDUHJpY2VzIiwiYW5hbHl6ZVBvbG9FVEhQcmljZXMiLCJhbmFseXplUG9sb1hNUlByaWNlcyIsImV4Y2hhbmdlUHJpY2VzIiwidGltZVN0YW1wU3RyIiwiZ2V0VGltZSIsImZvckVhY2giLCJjdXJDb2luIiwibG93ZXN0QXNrQlRDIiwibG93ZXN0QXNrIiwiaGlnaGVzdEJpZFVTREMiLCJoaWdoZXN0QmlkIiwiVVNEQ19CVENsb3dlc3RBc2siLCJBcmJSYXRpbyIsInNob3dNYXgiLCJCVENfY3VyQ29pbkJpZCIsIlVTRENfQlRDQmlkIiwiVVNEQ19jdXJDb2luQXNrIiwiQW10SW5pdCIsIkFtdEZpbmFsIiwiRVRIX2N1ckNvaW5CaWQiLCJCVENfRVRIQmlkIiwiQlRDX2N1ckNvaW5Bc2siLCJpbnN0cnVjdGlvbnMiLCJiYXNlTWFya2V0IiwiYmFzZU1hcmtldF9jdXJDb2luQmlkIiwiQlRDX2Jhc2VNYXJrZXRCaWQiLCJydW5Qb2xvQ29pbmJhc2VDb21wYXJlIiwiY29pbmJhc2VEYXRhWkVDIiwiY29pbmJhc2VEYXRhRVRIIiwiY29pbmJhc2VEYXRhQlRDIiwicnVuUG9sb0JpdHRyZXhDb21wYXJlIiwiUHJvbWlzZSIsImFsbCIsImJpdHRyZXhBTEwiLCJNYXRoIiwiYWJzIiwiYml0dHJleEpTT04iLCJiaXR0cmV4QlRDQ29pbnMiLCJCVEMiLCJFVEgiLCJVU0RUIiwiYmFzZU1hcmtldHMiLCJiYXNlTWt0IiwiYml0dHJleFRyaW1tZWQiLCJyZXN1bHQiLCJtYXJrZXQiLCJjb2luIiwiTWFya2V0TmFtZSIsInRvVXBwZXJDYXNlIiwiYml0dHJleENvbXBhcmUiLCJydW5Qb2xvSGl0YnRjQ29tcGFyZSIsImhpdGJ0Y0RhdGEiLCJoaXRidGNNYXJrZXRzIiwiaGl0YnRjSlNPTiIsImhpdGJ0Y1RyaW1tZWQiLCJzeW1ib2wiLCJoaXRidGNDb21wYXJlIiwicnVuUG9sb0JpbmFuY2VDb21wYXJlIiwiYmluYW5jZURhdGEiLCJydW5CaXR0cmV4SGl0YnRjQ29tcGFyZSIsImJpdHRyZXhEYXRhIiwicnVuUG9sb1lvYml0Q29tcGFyZSIsInlvYml0TWFya2V0cyIsInRpY2tlckxpc3QiLCJpIiwibGVuZ3RoIiwieW9iaXRVUkwiLCJ5b2JpdERhdGEiLCJydW5Zb2JpdEludGVybmFsQ29tcGFyZSIsInJ1bllvYml0QmFzZU1rdENvbXBhcmUiLCJ0aWNrZXJMaXN0U3RyIiwieW9iaXRNa3QiLCJta3REYXRhIiwiZSIsInJ1blRlc3QiLCJta3REZXB0aCIsImNvbXBhcmVUb1J1biIsInByb2Nlc3MiLCJhcmd2IiwibmV3SW50ZXJhbCIsInJhbmRvbSIsInNldEludGVydmFsIl0sIm1hcHBpbmdzIjoiOztBQVFBOztBQUNBOzs7Ozs7Ozs7Ozs7OztBQVRBOzs7OztBQU1BQSxPQUFPLENBQUMsaUJBQUQsQ0FBUDs7QUFNQSxJQUFJQyxjQUFjLEdBQUdELE9BQU8sQ0FBQyxnQkFBRCxDQUFQLENBQTBCQyxjQUEvQzs7QUFFQSxJQUFNQywrQkFBK0IsR0FBRyxFQUF4QztBQUVBLElBQU1DLFdBQW1CLEdBQUcsa0RB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Y2VzQ29udGVudCI6WyIvKiBhcHAudHNcbiAqIGRlc2M6IE1haW4gZW50cnkgcG9pbnQgZm9yIHRoZSBjcnlwdG8gZXhjaGFuZ2UgcHJpY2UgYXJiaXRyYWdlIG1vbml0b3IuICBUaGUgZXZlbnQgbG9vcCB0aGF0IGNvbnRyb2xzXG4gKiAgICAgICByZWFkaW5nIGV4Y2hhbmdlIGRhdGEgcnVucyBmcm9tIGhlcmUuICBBcyBkYXRhIGlzIGxvYWRlZCBmcm9tIGV4Y2hhbmdlcyBpdCBnZXRzIHBhc3NlZCBpbnRvXG4gKiAgICAgICBjb21wYXJQcmljaW5nUmVzdWx0cy5qcyB0byBzZWUgaWYgdGhlcmUgYXJlIGFueSBtYXJrZXQgb3Bwb3J0dW5pdGllcy5cbiAqL1xuXG5yZXF1aXJlKFwiQGJhYmVsL3BvbHlmaWxsXCIpO1xuXG5pbXBvcnQge2dldEV4Y2hhbmdlTWt0LCBnZXREYXRhRnJvbVVSTCwgZ2V0RXhjaGFuZ2VNa3REZXB0aH0gZnJvbSBcIi4vdXRpbHMvZ2V0Q3J5cHRvRGF0YVwiO1xuaW1wb3J0IHtjb21wYXJlUG9sb25pZXhDb2luYmFzZSwgY29tcGFyZUFsbFBvbG9uaWV4Qml0dHJleCwgY29tcGFyZUFsbFBvbG9uaWV4SGl0YnRjLCBjb21wYXJlQWxsQml0dHJleEhpdGJ0YyxcbiAgY29tcGFyZUFsbFBvbG9uaWV4WW9iaXQsIGludGVybmFsQ29tcGFyZUZvcllvYml0LCBjb21wYXJlQWxsUG9sb25pZXhCaW5hbmNlfSBmcm9tIFwiLi91dGlscy9jb21wYXJlUHJpY2luZ0RhdGFcIjtcblxubGV0IFhNTEh0dHBSZXF1ZXN0ID0gcmVxdWlyZShcInhtbGh0dHByZXF1ZXN0XCIpLlhNTEh0dHBSZXF1ZXN0O1xuXG5jb25zdCB0aW1lSW5TZWNvbmRzQmV0d2VlblByaWNlQ2hlY2tzID0gMTU7XG5cbmNvbnN0IHBvbG9uaWV4VVJMOiBzdHJpbmcgPSBcImh0dHBzOi8vcG9sb25pZXguY29tL3B1YmxpYz9jb21tYW5kPXJldHVyblRpY2tlclwiOyBcbmNvbnN0IGNvaW5iYXNlVVJMOiBzdHJpbmcgPSBcImh0dHBzOi8vYXBpLnByby5jb2luYmFzZS5jb20vcHJvZHVjdHNcIjsgXG5jb25zdCB5b2JpdEJhc2VVUkw6IHN0cmluZyA9IFwiaHR0cHM6Ly95b2JpdC5uZXQvYXBpLzMvdGlja2VyL1wiXG5jb25zdCB0aHJlc2hvbGQ6IG51bWJlciA9IDEuMDE7XG5sZXQgbnVtYmVyT2ZDaGVja3M6IG51bWJlciA9IDA7XG5sZXQgaW50ZXJ2YWxIYW5kZWw6IG51bWJlciA9IC0xO1xubGV0IG1heEJ1eUFyYjogbnVtYmVyID0gMDtcbmxldCBtYXhTZWxsQXJiOiBudW1iZXIgPSAwO1xubGV0IG1heFNlbGxBcmJFVEg6IG51bWJlciA9IDA7XG5sZXQgbWF4U2VsbEFyYlhNUjogbnVtYmVyID0gMDtcblxuLyogZm9ybWF0VGltZXN0YW1wXG4gKiBkZXNjOiBVdGlsaXR5IHRvIHRydW5jYXRlIHRoZSBvdXRwdXQgb2YgbG9uZyB0aW1lIHN0YW1wcyB0byBpbmNsdWRlIG9ubHkgdGhlIGRhdGUgYW5kIHRpbWUgcGFydHMuXG4gKi9cbmZ1bmN0aW9uIGZvcm1hdFRpbWVzdGFtcCh0aW1lU3RhbXA6IERhdGUpIHtcbiAgcmV0dXJuKHRpbWVTdGFtcC50b1N0cmluZygpLnNsaWNlKDAsMjUpKTtcbn1cblxuLyogcG9sb0ludGVybmFsQ29tcGFyZVxuICogZGVzYzogTG9va3MgZm9yIGFyYml0cmFnZSBwcm9maXRzIGZyb20gc2NlbmFyaW9zIHdoZXJlIGEgY29pbjEgaXMgZXhjaGFuZ2VkIGZvciBjb2luMiwgY29pbjIgZXhjaGFuZ2VkIGZvciBjb2luMyBhbmQgdGhlbiBcbiAqICAgICAgIGNvaW4zIGV4Y2hhbmdlZCBiYWNrIGludG8gY29pbjEuXG4gKiAgICAgICBUaGlzIGNvbXBhcmUgbG9va3Mgb25seSB3aXRoaW4gdGhlIFBvbG9uaWV4IGV4Y2hhbmdlLlxuKi9cbmFzeW5jIGZ1bmN0aW9uIHBvbG9JbnRlcm5hbENvbXBhcmUoKSB7XG5cbiAgY29uc29sZS5sb2coXCJCRUdJTjogcG9sb0ludGVybmFsQ29tcGFyZVwiKTtcbiAgdHJ5IHtcbiAgICBsZXQgcG9sb25pZXhEYXRhID0gYXdhaXQgZ2V0RXhjaGFuZ2VNa3QoXCJwb2xvbmlleFwiKTtcbiAgICBudW1iZXJPZkNoZWNrcysrO1xuICAgIGxldCB0aW1lU3RhbXAgPSBuZXcgRGF0ZSgpO1xuICAgIGxldCBleGNoYW5nZU9iamVjdCA9IEpTT04ucGFyc2UocG9sb25pZXhEYXRhLmV4Y2hhbmdlRGF0YSk7XG4gICAgbGV0IGNvaW5zID0gW1wiRk9BTVwiLCBcIlpFQ1wiLCBcIkxUQ1wiLCBcIkVUSFwiLCBcIlhSUFwiLCBcIlNUUlwiLCBcIlhNUlwiLCBcIkRPR0VcIiwgXCJCQ0hBQkNcIiwgXCJCQ0hTVlwiXTtcbiAgICBsZXQgYmFzZVN0YWJsZUNvaW4gPSBcIlVTRENcIjtcbiAgICBhbmFseXplUG9sb0JUQ1ByaWNlcyhleGNoYW5nZU9iamVjdCwgYmFzZVN0YWJsZUNvaW4sIGNvaW5zLCB0aW1lU3RhbXApO1xuICAgIGNvaW5zID0gW1wiQkFUXCIsIFwiQk5UXCIsIFwiREFTSFwiLCBcIkRPR0VcIiwgXCJFT1NcIiwgXCJFVENcIiwgXCJFVEhcIiwgXCJHTlRcIiwgXCJLTkNcIiwgXCJMT09NXCIsIFwiTFNLXCIsXG4gICAgICBcIkxUQ1wiLCBcIk1BTkFcIiwgXCJOWFRcIiwgXCJRVFVNXCIsIFwiUkVQXCIsIFwiU0NcIiwgXCJTTlRcIiwgXCJTVFJcIiwgXCJYTVJcIiwgXCJYUlBcIiwgXCJaRUNcIiwgXCJaUlhcIl07XG4gICAgYmFzZVN0YWJsZUNvaW4gPSBcIlVTRFRcIjsgXG4gICAgYW5hbHl6ZVBvbG9CVENQcmljZXMoZXhjaGFuZ2VPYmplY3QsIGJhc2VTdGFibGVDb2luLCBjb2lucywgdGltZVN0YW1wKTtcbiAgICBhbmFseXplUG9sb0VUSFByaWNlcyhleGNoYW5nZU9iamVjdCwgdGltZVN0YW1wKTtcbiAgICBhbmFseXplUG9sb1hNUlByaWNlcyhleGNoYW5nZU9iamVjdCwgdGltZVN0YW1wKTtcbiAgfVxuICBjYXRjaChlcnIpIHtcbiAgICBjb25zb2xlLmxvZyhcIkVycm9yIGdldHRpbmcgUG9sb25pZXggbWFya2V0IGRhdGEuXCIpO1xuICAgIGNvbnNvbGUubG9nKGVycik7XG4gIH1cbiAgY29uc29sZS5sb2coXCJFTkQ6IHBvbG9JbnRlcm5hbENvbXBhcmVcIik7XG59XG5cblxuLyogYW5hbHl6ZVBvbG9CVENQcmljZXNcbiAqIGRlc2M6IFRha2VzIHRoZSBleGNoYW5nZSBwcmljZXMgZnJvbSBQb2xvbmlleCBhbmQgZG9lcyB0aGUgZGV0YWlsZWQgY29tcGFyZXMgdG8gZmluZCBhcmJpdHJhZ2VcbiAqICAgICAgIHdpdGhpbiB0aGlzIGV4Y2hhbmdlLiAgSXQgZG9lcyB0aGlzIGZvciB0aGUgQlRDIG1hcmtldC5cbiAqL1xuZnVuY3Rpb24gYW5hbHl6ZVBvbG9CVENQcmljZXMoZXhjaGFuZ2VQcmljZXM6IGFueSwgYmFzZVN0YWJsZUNvaW46IFxuICBzdHJpbmcsIGNvaW5zOiBBcnJheTxzdHJpbmc+LCB0aW1lU3RhbXA6IERhdGUpIHtcblxuICBsZXQgdGltZVN0YW1wU3RyID0gdGltZVN0YW1wLmdldFRpbWUoKTtcbiAgY29uc29sZS5sb2coYHByaWNlQ2hlY2tDb3VudDoke251bWJlck9mQ2hlY2tzfXwke2Jhc2VTdGFibGVDb2lufXxtYXhCdXlBcmI6JHttYXhCdXlBcmJ9fG1heFNlbGxBcmI6JHttYXhTZWxsQXJifWApO1xuICAvLyBDaGVjayBpZiBidXlpbmcgdGhlIGNvaW4gd2lsbCBiZSBwcm9maXRhYmxlLlxuICBjb2lucy5mb3JFYWNoKGN1ckNvaW4gPT4ge1xuICAgIGxldCBsb3dlc3RBc2tCVEMgPSBleGNoYW5nZVByaWNlc1tcIkJUQ19cIiArIGN1ckNvaW5dLmxvd2VzdEFzaztcbiAgICBsZXQgaGlnaGVzdEJpZFVTREMgPSBleGNoYW5nZVByaWNlc1tiYXNlU3RhYmxlQ29pbiArIFwiX1wiICsgY3VyQ29pbl0uaGlnaGVzdEJpZDtcbiAgICBsZXQgVVNEQ19CVENsb3dlc3RBc2sgPSBleGNoYW5nZVByaWNlc1tiYXNlU3RhYmxlQ29pbiArIFwiX1wiICsgXCJCVENcIl0ubG93ZXN0QXNrO1xuICAgIGxldCBBcmJSYXRpbyA9IGhpZ2hlc3RCaWRVU0RDIC8gKCBsb3dlc3RBc2tCVEMgKiAgVVNEQ19CVENsb3dlc3RBc2spO1xuICAgIGxldCBzaG93TWF4ID0gXCJcIjtcbiAgICBpZiAoQXJiUmF0aW8+bWF4QnV5QXJiKSB7XG4gICAgICBtYXhCdXlBcmIgPSBBcmJSYXRpbztcbiAgICAgIHNob3dNYXggPSBcIk5ld01heFwiO1xuICAgIH1cbiAgICBpZiAoQXJiUmF0aW8+MS4wKVxuICAgICAgY29uc29sZS5sb2coYFJFQ3wke3RpbWVTdGFtcH18JHt0aW1lU3RhbXBTdHJ9fEJ1eXwke2Jhc2VTdGFibGVDb2lufXwke2N1ckNvaW59fEFyYlJhdGlvOiR7QXJiUmF0aW99fCR7c2hvd01heH1gKTtcbiAgICBpZiAoQXJiUmF0aW8gPiB0aHJlc2hvbGQpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiU29tZXRoaW5nIG5lZWRzIHRvIGhhcHBlbiFcIik7XG4gICAgfVxuICB9KTtcbiAgLy8gQ2hlY2sgaWYgc2VsbGluZyB0aGUgY29pbiB3aWxsIGJlIHByb2ZpdGFibGVcbiAgY29pbnMuZm9yRWFjaChjdXJDb2luID0+IHtcbiAgICBsZXQgQlRDX2N1ckNvaW5CaWQgPSBleGNoYW5nZVByaWNlc1tcIkJUQ19cIitjdXJDb2luXS5oaWdoZXN0QmlkO1xuICAgIGxldCBVU0RDX0JUQ0JpZCA9IGV4Y2hhbmdlUHJpY2VzW2Jhc2VTdGFibGVDb2luICsgXCJfXCIgKyBcIkJUQ1wiXS5oaWdoZXN0QmlkO1xuICAgIGxldCBVU0RDX2N1ckNvaW5Bc2sgPSBleGNoYW5nZVByaWNlc1tiYXNlU3RhYmxlQ29pbiArIFwiX1wiICtjdXJDb2luXS5sb3dlc3RBc2s7XG4gICAgbGV0IEFtdEluaXQgPSAxMDAwMDtcbiAgICBsZXQgQW10RmluYWwgPSBBbXRJbml0KkJUQ19jdXJDb2luQmlkKlVTRENfQlRDQmlkL1VTRENfY3VyQ29pbkFzaztcbiAgICBsZXQgQXJiUmF0aW8gPSBBbXRGaW5hbC9BbXRJbml0O1xuICAgIGxldCBzaG93TWF4ID0gXCJcIjtcbiAgICBpZiAoQXJiUmF0aW8+bWF4U2VsbEFyYikge1xuICAgICAgbWF4U2VsbEFyYiA9IEFyYlJhdGlvO1xuICAgICAgc2hvd01heCA9IFwiTmV3TWF4XCI7XG4gICAgfVxuICAgIGlmIChBcmJSYXRpbz4xLjApXG4gICAgICBjb25zb2xlLmxvZyhgUkVDfCR7dGltZVN0YW1wfXwke3RpbWVTdGFtcFN0cn18U2VsbHwke2Jhc2VTdGFibGVDb2lufXwke2N1ckNvaW59fEFyYlJhdGlvOiR7QXJiUmF0aW99fCR7c2hvd01heH1gKTtcbiAgICBpZiAoQXJiUmF0aW8gPiB0aHJlc2hvbGQpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiU29tZXRoaW5nIG5lZWRzIHRvIGhhcHBlbiFcIik7XG4gICAgfVxuICB9KTtcbn1cblxuLyogYW5hbHl6ZVBvbG9FVEhQcmljZXNcbiAqIGRlc2M6IFRha2VzIHRoZSBleGNoYW5nZSBwcmljZXMgZnJvbSBQb2xvbmlleCBhbmQgZG9lcyB0aGUgZGV0YWlsZWQgY29tcGFyZXMgdG8gZmluZCBhcmJpdHJhZ2VcbiAqICAgICAgIHdpdGhpbiB0aGlzIGV4Y2hhbmdlIGZvciB0aGVpciBFVEggbWFya2V0LlxuICovXG5mdW5jdGlvbiBhbmFseXplUG9sb0VUSFByaWNlcyhleGNoYW5nZVByaWNlczogYW55LCB0aW1lU3RhbXA6IERhdGUpIHtcblxuICBsZXQgdGltZVN0YW1wU3RyID0gdGltZVN0YW1wLmdldFRpbWUoKTtcbiAgY29uc29sZS5sb2coYHByaWNlQ2hlY2tDb3VudDoke251bWJlck9mQ2hlY2tzfXxFVEh8bWF4QnV5QXJiOk4vQXxtYXhTZWxsQXJiRVRIOiR7bWF4U2VsbEFyYkVUSH1gKTtcbiAgbGV0IGNvaW5zID0gW1wiQkFUXCIsIFwiQk5UXCIsIFwiQ1ZDXCIsIFwiRU9TXCIsIFwiRVRDXCIsIFwiR0FTXCIsIFwiR05UXCIsIFwiS05DXCIsIFwiTE9PTVwiLCBcIkxTS1wiLCBcbiAgICBcIk1BTkFcIiwgXCJPTUdcIiwgXCJRVFVNXCIsIFwiUkVQXCIsIFwiU05UXCIsIFwiU1RFRU1cIiwgXCJaRUNcIiwgXCJaUlhcIl07XG4gIC8vIENoZWNrIGlmIHNlbGxpbmcgdGhlIGNvaW4gd2lsbCBiZSBwcm9maXRhYmxlXG4gIGNvaW5zLmZvckVhY2goY3VyQ29pbiA9PiB7XG4gICAgbGV0IEVUSF9jdXJDb2luQmlkID0gZXhjaGFuZ2VQcmljZXNbXCJFVEhfXCIrY3VyQ29pbl0uaGlnaGVzdEJpZDtcbiAgICBsZXQgQlRDX0VUSEJpZCA9IGV4Y2hhbmdlUHJpY2VzW1wiQlRDX0VUSFwiXS5oaWdoZXN0QmlkO1xuICAgIGxldCBCVENfY3VyQ29pbkFzayA9IGV4Y2hhbmdlUHJpY2VzW1wiQlRDX1wiK2N1ckNvaW5dLmxvd2VzdEFzaztcbiAgICBsZXQgQW10SW5pdCA9IDE7XG4gICAgbGV0IEFtdEZpbmFsID0gQW10SW5pdCpCVENfRVRIQmlkKkVUSF9jdXJDb2luQmlkL0JUQ19jdXJDb2luQXNrO1xuICAgIGxldCBBcmJSYXRpbyA9IEFtdEZpbmFsL0FtdEluaXQ7XG4gICAgbGV0IHNob3dNYXggPSBcIlwiO1xuICAgIGlmIChBcmJSYXRpbz5tYXhTZWxsQXJiRVRIKSB7XG4gICAgICBtYXhTZWxsQXJiRVRIID0gQXJiUmF0aW87XG4gICAgICBzaG93TWF4ID0gXCJOZXdNYXhcIjtcbiAgICB9XG4gICAgaWYgKEFyYlJhdGlvPjEuMClcbiAgICAgIGNvbnNvbGUubG9nKGBSRUN8JHt0aW1lU3RhbXB9fCR7dGltZVN0YW1wU3RyfXxTZWxsfCR7Y3VyQ29pbn18RVRIfEFyYlJhdGlvOiR7QXJiUmF0aW99fCR7c2hvd01heH1gKTtcbiAgICBpZiAoQXJiUmF0aW8gPiB0aHJlc2hvbGQpIHtcbiAgICAgIGxldCBpbnN0cnVjdGlvbnMgPSBgQUxFUlQ6IFNlbGwgJHtBbXRJbml0fSAke2N1ckNvaW59IGZvciAke0FtdEluaXQqRVRIX2N1ckNvaW5CaWR9IEVUSCwgXG4gICAgICAgIHRoZW4gc2VsbCB0aG9zZSBFVEggZm9yICR7QW10SW5pdCpFVEhfY3VyQ29pbkJpZCpCVENfRVRIQmlkfSBCVEMsXG4gICAgICAgIHRoZW4gdXNlIHRob3NlIEJUQyB0byBidXkgJHtBbXRGaW5hbH0gJHtjdXJDb2lufWA7XG4gICAgICBjb25zb2xlLmxvZyhpbnN0cnVjdGlvbnMpO1xuICAgIH1cbiAgfSk7XG59XG5cbi8qIGFuYWx5emVQb2xvWE1SUHJpY2VzXG4gKiBkZXNjOiBUYWtlcyB0aGUgZXhjaGFuZ2UgcHJpY2VzIGZyb20gUG9sb25pZXggYW5kIGRvZXMgdGhlIGRldGFpbGVkIGNvbXBhcmVzIHRvIGZpbmQgYXJiaXRyYWdlXG4gKiAgICAgICB3aXRoaW4gdGhpcyBleGNoYW5nZSBmb3IgdGhlaXIgWFJNIG1hcmtldC5cbiAqL1xuZnVuY3Rpb24gYW5hbHl6ZVBvbG9YTVJQcmljZXMoZXhjaGFuZ2VQcmljZXM6IGFueSwgdGltZVN0YW1wOiBEYXRlKSB7XG5cbiAgbGV0IHRpbWVTdGFtcFN0ciA9IHRpbWVTdGFtcC5nZXRUaW1lKCk7XG4gIGNvbnNvbGUubG9nKGBwcmljZUNoZWNrQ291bnQ6JHtudW1iZXJPZkNoZWNrc318WE1SfG1heEJ1eUFyYjpOL0F8bWF4U2VsbEFyYlhNUjoke21heFNlbGxBcmJYTVJ9YCk7XG4gIGxldCBjb2lucyA9IFtcIkxUQ1wiLCBcIlpFQ1wiLCBcIk5YVFwiLCBcIkRBU0hcIiwgXCJCQ05cIiwgXCJNQUlEXCJdO1xuICAvLyBDaGVjayBpZiBzZWxsaW5nIHRoZSBjb2luIHdpbGwgYmUgcHJvZml0YWJsZVxuICBjb2lucy5mb3JFYWNoKGN1ckNvaW4gPT4ge1xuICAgIGxldCBiYXNlTWFya2V0ID0gXCJYTVJcIjtcbiAgICBsZXQgYmFzZU1hcmtldF9jdXJDb2luQmlkID0gZXhjaGFuZ2VQcmljZXNbYmFzZU1hcmtldCArIFwiX1wiICsgY3VyQ29pbl0uaGlnaGVzdEJpZDtcbiAgICBsZXQgQlRDX2Jhc2VNYXJrZXRCaWQgPSBleGNoYW5nZVByaWNlc1tcIkJUQ1wiICsgXCJfXCIgKyBiYXNlTWFya2V0XS5oaWdoZXN0QmlkO1xuICAgIGxldCBCVENfY3VyQ29pbkFzayA9IGV4Y2hhbmdlUHJpY2VzW1wiQlRDXCIgKyBcIl9cIiArIGN1ckNvaW5dLmxvd2VzdEFzaztcbiAgICBsZXQgQW10SW5pdCA9IDE7XG4gICAgbGV0IEFtdEZpbmFsID0gQW10SW5pdCpCVENfYmFzZU1hcmtldEJpZCpiYXNlTWFya2V0X2N1ckNvaW5CaWQvQlRDX2N1ckNvaW5Bc2s7XG4gICAgbGV0IEFyYlJhdGlvID0gQW10RmluYWwvQW10SW5pdDtcbiAgICBsZXQgc2hvd01heCA9IFwiXCI7XG4gICAgaWYgKEFyYlJhdGlvPm1heFNlbGxBcmJYTVIpIHtcbiAgICAgIG1heFNlbGxBcmJYTVIgPSBBcmJSYXRpbztcbiAgICAgIHNob3dNYXggPSBcIk5ld01heFwiO1xuICAgIH1cbiAgICBpZiAoQXJiUmF0aW8+MS4wKVxuICAgICAgY29uc29sZS5sb2coYFJFQ3wke3RpbWVTdGFtcH18JHt0aW1lU3RhbXBTdHJ9fFNlbGx8JHtjdXJDb2lufXxYTVJ8QXJiUmF0aW86JHtBcmJSYXRpb318JHtzaG93TWF4fWApO1xuICAgIGlmIChBcmJSYXRpbyA+IHRocmVzaG9sZCkge1xuICAgICAgbGV0IGluc3RydWN0aW9ucyA9IGBBTEVSVDogU2VsbCAke0FtdEluaXR9ICR7Y3VyQ29pbn0gZm9yICR7QW10SW5pdCpiYXNlTWFya2V0X2N1ckNvaW5CaWR9IFhNUiwgXG4gICAgICAgIHRoZW4gc2VsbCB0aG9zZSBYTVIgZm9yICR7QW10SW5pdCpCVENfYmFzZU1hcmtldEJpZCpiYXNlTWFya2V0X2N1ckNvaW5CaWR9IEJUQyxcbiAgICAgICAgdGhlbiB1c2UgdGhvc2UgQlRDIHRvIGJ1eSAke0FtdEZpbmFsfSAke2N1ckNvaW59YDtcbiAgICAgIGNvbnNvbGUubG9nKGluc3RydWN0aW9ucyk7XG4gICAgfVxuICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcnVuUG9sb0NvaW5iYXNlQ29tcGFyZSgpIHtcbiAgbGV0IHBvbG9uaWV4RGF0YSA9IGF3YWl0IGdldEV4Y2hhbmdlTWt0KFwicG9sb25pZXhcIik7XG4gIGxldCBjb2luYmFzZURhdGFaRUMgPSBhd2FpdCBnZXREYXRhRnJvbVVSTChjb2luYmFzZVVSTCtcIi9aRUMtVVNEQy9ib29rXCIpO1xuICBsZXQgY29pbmJhc2VEYXRhRVRIID0gYXdhaXQgZ2V0RGF0YUZyb21VUkwoY29pbmJhc2VVUkwrXCIvRVRILVVTREMvYm9va1wiKTtcbiAgbGV0IGNvaW5iYXNlRGF0YUJUQyA9IGF3YWl0IGdldERhdGFGcm9tVVJMKGNvaW5iYXNlVVJMK1wiL0JUQy1VU0RDL2Jvb2tcIik7XG4gIGNvbXBhcmVQb2xvbmlleENvaW5iYXNlKHBvbG9uaWV4RGF0YSwgY29pbmJhc2VEYXRhWkVDLCBcIlpFQ1wiKTtcbiAgY29tcGFyZVBvbG9uaWV4Q29pbmJhc2UocG9sb25pZXhEYXRhLCBjb2luYmFzZURhdGFFVEgsIFwiRVRIXCIpO1xuICBjb21wYXJlUG9sb25pZXhDb2luYmFzZShwb2xvbmlleERhdGEsIGNvaW5iYXNlRGF0YUJUQywgXCJCVENcIik7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJ1blBvbG9CaXR0cmV4Q29tcGFyZSgpIHtcblxuICBudW1iZXJPZkNoZWNrcysrO1xuICBjb25zb2xlLmxvZyhgLS0tLS0tPj4+IEJlZ2luIGNvbXBhcmUgY3ljbGU6ICR7bnVtYmVyT2ZDaGVja3N9LmApXG4gIC8vIEdldCBtYXJrZXQgZGF0YSBmcm9tIHRoZSBleGNoYW5nZXNcbiAgdHJ5IHtcbiAgICBsZXQgW3BvbG9uaWV4RGF0YSwgYml0dHJleEFMTF0gPSBhd2FpdCBQcm9taXNlLmFsbChbZ2V0RXhjaGFuZ2VNa3QoXCJwb2xvbmlleFwiKSwgZ2V0RXhjaGFuZ2VNa3QoXCJiaXR0cmV4XCIpXSk7XG4gICAgY29uc29sZS5sb2coYHBvbG9UaW1lc3RhbXA6ICAgICR7Zm9ybWF0VGltZXN0YW1wKHBvbG9uaWV4RGF0YS50aW1lU3RhbXApfWApO1xuICAgIGNvbnNvbGUubG9nKGBiaXR0cmV4VGltZXN0YW1wOiAke2Zvcm1hdFRpbWVzdGFtcChiaXR0cmV4QUxMLnRpbWVTdGFtcCl9YCk7XG4gICAgY29uc29sZS5sb2coYERpZmY6ICR7TWF0aC5hYnMocG9sb25pZXhEYXRhLnRpbWVTdGFtcCAtIGJpdHRyZXhBTEwudGltZVN0YW1wKX1tc2ApO1xuICAgIGxldCBiaXR0cmV4SlNPTjogYW55ID0gSlNPTi5wYXJzZShiaXR0cmV4QUxMLmV4Y2hhbmdlRGF0YSk7XG4gICAgbGV0IGJpdHRyZXhCVENDb2luczogYW55ID0ge1xuICAgICAgQlRDOiBbXCJBUkRSXCIsXCJCQVRcIixcIkJOVFwiLFwiQlVSU1RcIixcIkNWQ1wiLFwiREFTSFwiLFwiRENSXCIsXCJER0JcIixcIkRPR0VcIixcIkVUQ1wiLFwiRVRIXCIsXCJGQ1RcIixcIkdBTUVcIixcbiAgICAgICAgXCJHTlRcIixcIkxCQ1wiLFwiTE9PTVwiLFwiTFNLXCIsXCJMVENcIixcIk1BTkFcIixcIk5BVlwiLFwiTk1SXCIsXCJOWFRcIixcIk9NR1wiLFwiUE9MWVwiLFwiUFBDXCIsXCJRVFVNXCIsXCJSRVBcIixcIlNCRFwiLFxuICAgICAgICBcIlNDXCIsXCJTTlRcIixcIlNURUVNXCIsXCJTVE9SSlwiLFwiU1RSQVRcIixcIlNZU1wiLFwiVklBXCIsXCJWVENcIixcIlhDUFwiLFwiWEVNXCIsXCJYTVJcIixcIlhSUFwiLFwiWkVDXCIsXCJaUlhcIl0sXG4gICAgICBFVEg6IFtcIkJBVFwiLFwiQk5UXCIsXCJDVkNcIixcIkVUQ1wiLFwiR05UXCIsXCJNQU5BXCIsXCJPTUdcIixcIlFUVU1cIixcIlJFUFwiLFwiU05UXCIsXCJaRUNcIixcIlpSWFwiXSxcbiAgICAgIFVTRFQ6IFtcIkJBVFwiLFwiQlRDXCIsXCJEQVNIXCIsXCJET0dFXCIsXCJFVENcIixcIkVUSFwiLFwiTFRDXCIsXCJOWFRcIixcIlNDXCIsXCJYTVJcIixcIlhSUFwiLFwiWkVDXCIsXCJaUlhcIl1cbiAgICB9O1xuICAgIC8vIFByY29lc3MgZWFjaCBiYXNlIG1hcmtldCBzZXBlcmF0ZWx5LlxuICAgIGxldCBiYXNlTWFya2V0cyA9IFtcIkJUQ1wiLCBcIkVUSFwiLCBcIlVTRFRcIl07XG4gICAgYmFzZU1hcmtldHMuZm9yRWFjaCgoYmFzZU1rdDogc3RyaW5nKSA9PiB7XG4gICAgICBsZXQgYml0dHJleFRyaW1tZWQ6IGFueSA9IHt9O1xuICAgICAgYml0dHJleEpTT04ucmVzdWx0LmZvckVhY2goKG1hcmtldDogYW55KSA9PiB7XG4gICAgICAgIGJpdHRyZXhCVENDb2luc1tiYXNlTWt0XS5mb3JFYWNoKChjb2luOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICBsZXQgTWFya2V0TmFtZSA9IGJhc2VNa3QrXCItXCIrY29pbi50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAgIGlmIChtYXJrZXQuTWFya2V0TmFtZT09PU1hcmtldE5hbWUpIHtcbiAgICAgICAgICAgIGJpdHRyZXhUcmltbWVkW01hcmtldE5hbWVdID0gbWFya2V0O1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIGxldCBiaXR0cmV4Q29tcGFyZTogYW55ID0ge307XG4gICAgICBiaXR0cmV4Q29tcGFyZS50aW1lU3RhbXAgPSBiaXR0cmV4QUxMLnRpbWVTdGFtcDtcbiAgICAgIGJpdHRyZXhDb21wYXJlLmV4Y2hhbmdlRGF0YSA9IGJpdHRyZXhUcmltbWVkO1xuICAgICAgY29tcGFyZUFsbFBvbG9uaWV4Qml0dHJleChwb2xvbmlleERhdGEsIGJpdHRyZXhDb21wYXJlKTtcbiAgICB9KTtcbiAgfVxuICBjYXRjaChlcnIpIHtcbiAgICBjb25zb2xlLmxvZyhcIkVycm9yIHByb2Nlc3NpbmcgUG9sbyBCaXR0cmV4IGNvbXBhcmUuXCIpO1xuICAgIGNvbnNvbGUubG9nKGVycik7XG4gIH1cbn1cblxuLyogcnVuUG9sb0hpdGJ0Y0NvbXBhcmVcbiAqIGRlc2M6IExvYWRzIG1hcmtldCBkYXRhIGZyb20gUG9sb25pZXggYW5kIEhpdGJ0YyB0aGVuIGNvbXBhcmVzIGFsbCBtYXJrZXRzIHRoZXkgaGF2ZSBpbiBjb21tb24uXG4gKiAgICAgICBXaWxsIGJlIGNhbGxlZCByZXBlYXRlZGx5IHVzaW5nIGEgc2V0SW50ZXJ2YWwgdGltZXIuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHJ1blBvbG9IaXRidGNDb21wYXJlKCkge1xuXG4gIG51bWJlck9mQ2hlY2tzKys7XG4gIGNvbnNvbGUubG9nKGAtLS0tLS0+Pj4gQmVnaW4gY29tcGFyZSBjeWNsZTogJHtudW1iZXJPZkNoZWNrc30uYClcbiAgdHJ5IHtcbiAgICBsZXQgW2hpdGJ0Y0RhdGEsIHBvbG9uaWV4RGF0YV0gPSBhd2FpdCBQcm9taXNlLmFsbChbZ2V0RXhjaGFuZ2VNa3QoXCJoaXRidGNcIiksIGdldEV4Y2hhbmdlTWt0KFwicG9sb25pZXhcIildKTtcbiAgICBjb25zb2xlLmxvZyhgcG9sb1RpbWVzdGFtcDogICAke2Zvcm1hdFRpbWVzdGFtcChwb2xvbmlleERhdGEudGltZVN0YW1wKX1gKTtcbiAgICBjb25zb2xlLmxvZyhgaGl0QnRjVGltZXN0YW1wOiAke2Zvcm1hdFRpbWVzdGFtcChoaXRidGNEYXRhLnRpbWVTdGFtcCl9YCk7XG4gICAgY29uc29sZS5sb2coYERpZmY6ICR7TWF0aC5hYnMocG9sb25pZXhEYXRhLnRpbWVTdGFtcCAtIGhpdGJ0Y0RhdGEudGltZVN0YW1wKX1tc2ApO1xuXG4gICAgLy8gVGhpcyBpcyB0aGUgbGlzdCBvZiBtYXJrZXRzIHNoYXJlZCBiZXR3ZWVuIFBvbG9uaWV4IGFuZCBIaXRidGMuXG4gICAgbGV0IGhpdGJ0Y01hcmtldHM6IEFycmF5PHN0cmluZz4gPSBbXCJCQ05CVENcIixcIkRBU0hCVENcIixcIkRPR0VCVENcIixcIkVUSEJUQ1wiLFwiTFNLQlRDXCIsXCJMVENCVENcIixcIk5YVEJUQ1wiLFwiU0JEQlRDXCJcbiAgICAgICxcIlNDQlRDXCIsIFwiU1RFRU1CVENcIixcIlhFTUJUQ1wiLFwiWE1SQlRDXCIsXCJBUkRSQlRDXCIsXCJaRUNCVENcIixcIk1BSURCVENcIixcIlJFUEJUQ1wiLFwiRVRDQlRDXCIsXCJCTlRCVENcIixcIlNOVEVUSFwiLFxuICAgICAgXCJPTUdFVEhcIixcIkVUQ0VUSFwiLFwiWkVDRVRIXCIsXCJYUlBCVENcIixcIlNUUkFUQlRDXCIsXCJFT1NFVEhcIixcIkVPU0JUQ1wiLFwiQk5URVRIXCIsXCJaUlhCVENcIixcIlpSWEVUSFwiLFxuICAgICAgXCJQUENCVENcIixcIlFUVU1FVEhcIixcIkRHQkJUQ1wiLFwiT01HQlRDXCIsXCJTTlRCVENcIixcIlhSUFVTRFRcIixcIk1BTkFFVEhcIixcbiAgICAgIFwiTUFOQUJUQ1wiLFwiUVRVTUJUQ1wiLFwiTFNLRVRIXCIsXCJSRVBFVEhcIixcIlJFUFVTRFRcIixcIkdOVEJUQ1wiLFwiR05URVRIXCIsXCJCVFNCVENcIixcIkJBVEJUQ1wiLFwiQkFURVRIXCIsXCJCQ0hBQkNCVENcIixcbiAgICAgIFwiQkNIU1ZCVENcIixcIlNUT1JKQlRDXCJdO1xuXG4gICAgLy8gR2V0IHN1YnNldCBvZiBIaXRidGMgZGF0YSBvbmx5IGluY2x1ZGluZyB0aGUgbWFya2V0cyB3aGljaCBvdmVybGFwIHdpdGggUG9sb25pZXhcbiAgICBsZXQgaGl0YnRjSlNPTiA9IEpTT04ucGFyc2UoaGl0YnRjRGF0YS5leGNoYW5nZURhdGEpO1xuICAgIGxldCBoaXRidGNUcmltbWVkOiBhbnkgPSB7fTtcbiAgICBoaXRidGNNYXJrZXRzLmZvckVhY2gobWFya2V0ID0+IHtcbiAgICAgIGhpdGJ0Y0pTT04uZm9yRWFjaCgoZXhjaGFuZ2VEYXRhOiBhbnkpID0+IHtcbiAgICAgICAgaWYoZXhjaGFuZ2VEYXRhLnN5bWJvbD09PW1hcmtldClcbiAgICAgICAgICBoaXRidGNUcmltbWVkW21hcmtldF0gPSBleGNoYW5nZURhdGE7XG4gICAgICB9KTsgICAgIFxuICAgIH0pO1xuICAgIGxldCBoaXRidGNDb21wYXJlOiBhbnkgPSB7fTtcbiAgICBoaXRidGNDb21wYXJlLnRpbWVTdGFtcCA9IGhpdGJ0Y0RhdGEudGltZVN0YW1wO1xuICAgIGhpdGJ0Y0NvbXBhcmUuZXhjaGFuZ2VEYXRhID0gaGl0YnRjVHJpbW1lZDtcbiAgICBjb21wYXJlQWxsUG9sb25pZXhIaXRidGMocG9sb25pZXhEYXRhLCBoaXRidGNDb21wYXJlKTtcbiAgfVxuICBjYXRjaChlcnIpIHtcbiAgICBjb25zb2xlLmxvZyhcIkVycm9yIGluIFBvbG9uaWV4IEhpdGJ0YyBjb21wYXJlLlwiKTtcbiAgICBjb25zb2xlLmxvZyhlcnIpO1xuICB9XG59XG5cblxuLyogcnVuUG9sb0JpbmFuY2VDb21wYXJlXG4gKiBkZXNjOiBMb2FkcyBtYXJrZXQgZGF0YSBmcm9tIFBvbG9uaWV4IGFuZCBCaW5hbmNlIHRoZW4gY29tcGFyZXMgYWxsIG1hcmtldHMgdGhleSBoYXZlIGluIGNvbW1vbi5cbiAqICAgICAgIFdpbGwgYmUgY2FsbGVkIHJlcGVhdGVkbHkgdXNpbmcgYSBzZXRJbnRlcnZhbCB0aW1lci5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gcnVuUG9sb0JpbmFuY2VDb21wYXJlKCkge1xuXG4gIG51bWJlck9mQ2hlY2tzKys7XG4gIGNvbnNvbGUubG9nKGAtLS0tLS0+Pj4gQmVnaW4gY29tcGFyZSBjeWNsZTogJHtudW1iZXJPZkNoZWNrc30uYClcbiAgdHJ5IHtcbiAgICBsZXQgW2JpbmFuY2VEYXRhLCBwb2xvbmlleERhdGFdID0gYXdhaXQgUHJvbWlzZS5hbGwoW2dldEV4Y2hhbmdlTWt0KFwiYmluYW5jZVwiKSwgZ2V0RXhjaGFuZ2VNa3QoXCJwb2xvbmlleFwiKV0pO1xuICAgIGNvbnNvbGUubG9nKGBwb2xvVGltZXN0YW1wOiAgICR7Zm9ybWF0VGltZXN0YW1wKHBvbG9uaWV4RGF0YS50aW1lU3RhbXApfWApO1xuICAgIGNvbnNvbGUubG9nKGBiaW5hbmNlVGltZXN0YW1wOiAke2Zvcm1hdFRpbWVzdGFtcChiaW5hbmNlRGF0YS50aW1lU3RhbXApfWApO1xuICAgIGNvbnNvbGUubG9nKGBEaWZmOiAke01hdGguYWJzKHBvbG9uaWV4RGF0YS50aW1lU3RhbXAgLSBiaW5hbmNlRGF0YS50aW1lU3RhbXApfW1zYCk7XG4gICAgY29tcGFyZUFsbFBvbG9uaWV4QmluYW5jZShwb2xvbmlleERhdGEsIGJpbmFuY2VEYXRhKTtcblxuICAgIC8vIEdldCBzdWJzZXQgb2YgSGl0YnRjIGRhdGEgb25seSBpbmNsdWRpbmcgdGhlIG1hcmtldHMgd2hpY2ggb3ZlcmxhcCB3aXRoIFBvbG9uaWV4XG4gICAgLy8gbGV0IGJpbmFuY2VKU09OID0gSlNPTi5wYXJzZShiaW5hbmNlRGF0YS5leGNoYW5nZURhdGEpO1xuICAgIC8vIGxldCBoaXRidGNUcmltbWVkOiBhbnkgPSB7fTtcbiAgICAvLyBoaXRidGNNYXJrZXRzLmZvckVhY2gobWFya2V0ID0+IHtcbiAgICAvLyAgIGhpdGJ0Y0pTT04uZm9yRWFjaCgoZXhjaGFuZ2VEYXRhOiBhbnkpID0+IHtcbiAgICAvLyAgICAgaWYoZXhjaGFuZ2VEYXRhLnN5bWJvbD09PW1hcmtldClcbiAgICAvLyAgICAgICBoaXRidGNUcmltbWVkW21hcmtldF0gPSBleGNoYW5nZURhdGE7XG4gICAgLy8gICB9KTsgICAgIFxuICAgIC8vIH0pO1xuICAgIC8vIGxldCBoaXRidGNDb21wYXJlOiBhbnkgPSB7fTtcbiAgICAvLyBoaXRidGNDb21wYXJlLnRpbWVTdGFtcCA9IGhpdGJ0Y0RhdGEudGltZVN0YW1wO1xuICAgIC8vIGhpdGJ0Y0NvbXBhcmUuZXhjaGFuZ2VEYXRhID0gaGl0YnRjVHJpbW1lZDtcbiAgICAvLyBcbiAgfVxuICBjYXRjaChlcnIpIHtcbiAgICBjb25zb2xlLmxvZyhcIkVycm9yIGluIFBvbG9uaWV4IEJpbmFuY2UgY29tcGFyZS5cIik7XG4gICAgY29uc29sZS5sb2coZXJyKTtcbiAgfVxufVxuXG4vKiBydW5CaXR0cmV4SGl0YnRjQ29tcGFyZVxuICogZGVzYzogTG9hZHMgbWFya2V0IGRhdGEgZnJvbSBCaXR0cmV4IGFuZCBIaXRidGMgdGhlbiBjb21wYXJlcyBhbGwgbWFya2V0cyB0aGV5IGhhdmUgaW4gY29tbW9uLlxuICogICAgICAgV2lsbCBiZSBjYWxsZWQgcmVwZWF0ZWRseSB1c2luZyBhIHNldEludGVydmFsIHRpbWVyLlxuICovXG5hc3luYyBmdW5jdGlvbiBydW5CaXR0cmV4SGl0YnRjQ29tcGFyZSgpIHtcblxuICBudW1iZXJPZkNoZWNrcysrO1xuICAvLyBHZXQgbWFya2V0IGRhdGEgZnJvbSB0aGUgdHdvIGV4Y2hhbmdlcy5cbiAgbGV0IGhpdGJ0Y0RhdGEgPSBhd2FpdCBnZXRFeGNoYW5nZU1rdChcImhpdGJ0Y1wiKTsgIFxuICBsZXQgYml0dHJleERhdGEgPSBhd2FpdCBnZXRFeGNoYW5nZU1rdChcImJpdHRyZXhcIik7XG4gIGNvbXBhcmVBbGxCaXR0cmV4SGl0YnRjKGJpdHRyZXhEYXRhLCBoaXRidGNEYXRhKTtcbn1cblxuXG5hc3luYyBmdW5jdGlvbiBydW5Qb2xvWW9iaXRDb21wYXJlKCkge1xuXG4gIG51bWJlck9mQ2hlY2tzKys7XG4gIC8vIFBvbG9uaWV4IHNlY3Rpb24gLSBBbGwgY29pbnMgZnJvbSBvbmUgcmVxdWVzdFxuICBsZXQgcG9sb25pZXhEYXRhID0gYXdhaXQgZ2V0RXhjaGFuZ2VNa3QoXCJwb2xvbmlleFwiKTtcbiAgLy8gQml0dHJleCBzZWN0aW9uIC0gQWxsIGNvaW5zIGZyb20gb25lIHJlcXVlc3QuXG4gIC8vIEJpdHRyZXggbWFya2V0IHN1bW1hcnkgLSBBbGwgY29pbnMgZnJvbSBvbmUgcmVxdWVzdC5cbiAgbGV0IHlvYml0TWFya2V0cyA9IFtcbiAgICBcImx0Y19idGNcIiwgXCJldGhfYnRjXCJcbiAgXTtcbiAgbGV0IHRpY2tlckxpc3QgPSBcIlwiO1xuICBmb3IobGV0IGk9MDsgaTx5b2JpdE1hcmtldHMubGVuZ3RoOyBpKyspIHtcbiAgICB0aWNrZXJMaXN0ICs9IHlvYml0TWFya2V0c1tpXTtcbiAgICBpZiAoaSE9eW9iaXRNYXJrZXRzLmxlbmd0aC0xKVxuICAgICAgdGlja2VyTGlzdCArPSBcIi1cIjtcbiAgfVxuICBsZXQgeW9iaXRVUkwgPSB5b2JpdEJhc2VVUkwgKyB0aWNrZXJMaXN0O1xuICBjb25zb2xlLmxvZyhcIlJ1biBxdWVyeSBmb3IgZGF0YSBhdDpcIiwgeW9iaXRVUkwpO1xuICBsZXQgeW9iaXREYXRhID0gYXdhaXQgZ2V0RGF0YUZyb21VUkwoeW9iaXRVUkwpOyAgXG4gIGNvbnNvbGUubG9nKFwieW9iaXREYXRhOlwiLCB5b2JpdERhdGEpO1xuICBjb21wYXJlQWxsUG9sb25pZXhZb2JpdChwb2xvbmlleERhdGEsIHlvYml0RGF0YSk7XG59XG5cbi8qIHJ1bllvYml0SW50ZXJuYWxDb21wYXJlXG4gKiBkZXNjOiBDaGVja3MgaW50ZW5yYWwgcHJpY2VzIGZvciB0aGUgWW9iaXQgZXhjaGFuZ2UgdG8gc2VlIGlmIGFueSBjYXNlcyBleGlzdCB3aXRoXG4gKiAgICAgICB0aGUgQXJiIEZhY3RvciBpcyBncmVhdGVyIHRoYW4gb25lLlxuICovXG5mdW5jdGlvbiBydW5Zb2JpdEludGVybmFsQ29tcGFyZSgpIHtcblxuICBudW1iZXJPZkNoZWNrcysrO1xuICBsZXQgeW9iaXRNYXJrZXRzID0gW1xuICAgICAgXCJ6ZWNcIiwgXCJsc2tcIiwgXCJldGNcIiwgXCJsdGNcIiwgXCJmdG9cIiwgXCJlZHIyXCIsIFwibGJyXCIsIFwiYmFuXCIsIFwia2luXCIsIFwibmJ0XCIsXG4gICAgICBcInJudGJcIiwgXCJidW5ueVwiLCBcInRyeFwiLCBcImtiY1wiLCBcInZydG1cIiwgXCJodXJcIiwgXCJub2FoXCIsIFwieHJwXCIsIFwiZG9nZVwiLCBcbiAgICAgIFwiZWRpdFwiLCBcImV2blwiLCBcImV4bXJcIiwgXCJwYXlwXCIsIFwieW96aVwiLCBcIndhdmVzXCIsIFwibnljXCIsXG4gICAgICBcImRnYlwiLCBcImR1eFwiLCBcImRhc2hcIl07XG4gIGxldCBiYXNlTWFya2V0cyA9IFtcbiAgICAgIFwiYnRjXCIsIFwiZXRoXCJcbiAgICBdO1xuICBydW5Zb2JpdEJhc2VNa3RDb21wYXJlKGJhc2VNYXJrZXRzLCB5b2JpdE1hcmtldHMpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBydW5Zb2JpdEJhc2VNa3RDb21wYXJlKGJhc2VNYXJrZXRzOiBBcnJheTxzdHJpbmc+LCB5b2JpdE1hcmtldHM6IEFycmF5PHN0cmluZz4pIHtcblxuICAvLyBZb2JpdCBhY2NlcHRzIG11bHRpcGxlIHRpY2tlcnMgaW4gdGhlIFVSTCB1c2luZyBhIGRhc2ggc2VwZXJhdGVkIGZvcm1hdC5cbiAgLy8gRXguIGh0dHBzOi8veW9iaXQubmV0L2FwaS8zL3RpY2tlci9ldGhfYnRjLXplY19idGMtemVjX2V0aFxuICAvL1xuICAvLyBXaWxsIHJldHVybiBkYXRhIGluIHRoZSBmb3JtYXQsXG4gIC8vXG4gIC8vIHtcImV0aF9idGNcIjpcbiAgLy8gICAge1wiaGlnaFwiOjAuMDMzMDksXCJsb3dcIjowLjAzMjM1Mzg4LFwiYXZnXCI6MC4wMzI3MjE5NCxcInZvbFwiOjEwMDguMDY3MDYwNjYsXCJ2b2xfY3VyXCI6MzA2NDAuMjc4MjQ3MjgsXCJsYXN0XCI6MC4wMzI4NjI3NCxcImJ1eVwiOjAuMDMyNzgxODcsXCJzZWxsXCI6MC4wMzI5MTI1OSxcInVwZGF0ZWRcIjoxNTQ4MTY3MTcxfSxcbiAgLy8gIFwiemVjX2J0Y1wiOlxuICAvLyAgICB7XCJoaWdoXCI6MC4wMTQ3MTQwNyxcImxvd1wiOjAuMDE0NDQ0OCxcImF2Z1wiOjAuMDE0NTc5NDMsXCJ2b2xcIjo4NjYuMTIzNzA3MTIsXCJ2b2xfY3VyXCI6NTkxOTEuMTYzNzkxMzMsXCJsYXN0XCI6MC4wMTQ1OTU1NyxcImJ1eVwiOjAuMDE0NTM4NzEsXCJzZWxsXCI6MC4wMTQ2NDg4MixcInVwZGF0ZWRcIjoxNTQ4MTY3MTY4fSxcbiAgLy8gIFwiemVjX2V0aFwiOlxuICAvLyAgICB7XCJoaWdoXCI6MC40NDg1OTIzOSxcImxvd1wiOjAuNDM3MTk5MDQsXCJhdmdcIjowLjQ0Mjg5NTcxLFwidm9sXCI6My40Nzg0MzM1NCxcInZvbF9jdXJcIjo3Ljc3NzcxMTQyLFwibGFzdFwiOjAuNDQ4NTkyMzksXCJidXlcIjowLjQ0MDA4NTk2LFwic2VsbFwiOjAuNDQ4NTkyMzgsXCJ1cGRhdGVkXCI6MTU0ODE2NjA1Mn1cbiAgLy8gfVxuXG4gIC8vIENyZWF0ZSB0aWNrZXIgbGlzdCBpbiBmb3JtYXQgWW9iaXQgd2lsbCBhY2NlcHQuXG4gIGxldCB0aWNrZXJMaXN0U3RyID0gXCJcIjtcbiAgZm9yKGxldCBpPTA7IGk8eW9iaXRNYXJrZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgdGlja2VyTGlzdFN0ciArPSB5b2JpdE1hcmtldHNbaV0gKyBcIl9cIiArIGJhc2VNYXJrZXRzWzBdICsgXCItXCI7XG4gICAgdGlja2VyTGlzdFN0ciArPSB5b2JpdE1hcmtldHNbaV0gKyBcIl9cIiArIGJhc2VNYXJrZXRzWzFdO1xuICAgIGlmIChpIT15b2JpdE1hcmtldHMubGVuZ3RoLTEpXG4gICAgICB0aWNrZXJMaXN0U3RyICs9IFwiLVwiO1xuICAgIGVsc2VcbiAgICAgIHRpY2tlckxpc3RTdHIgKz0gXCItXCIgKyBiYXNlTWFya2V0c1sxXSArIFwiX1wiICsgYmFzZU1hcmtldHNbMF07XG4gIH1cbiAgbGV0IHlvYml0TWt0ID0gYXdhaXQgZ2V0RGF0YUZyb21VUkwoeW9iaXRCYXNlVVJMICsgdGlja2VyTGlzdFN0cik7ICBcbiAgdHJ5IHtcbiAgICBsZXQgbWt0RGF0YSA9IEpTT04ucGFyc2UoeW9iaXRNa3QuZXhjaGFuZ2VEYXRhKTtcbiAgICAvLyBBbmFseXplIFlvYml0IG1hcmtldCBsb29raW5nIGZvciBwcmljZSBhbm9tb2xpZXNcbiAgICBpbnRlcm5hbENvbXBhcmVGb3JZb2JpdChta3REYXRhLCB5b2JpdE1hcmtldHMsIGJhc2VNYXJrZXRzKTtcbiAgfVxuICBjYXRjaChlKSB7XG4gICAgY29uc29sZS5sb2coXCJJbnZhbGlkIG1hcmtldCBkYXRhIHJldHVybmVkIGZyb206XCIsIHlvYml0QmFzZVVSTCk7XG4gICAgY29uc29sZS5sb2coXCJEYXRhIG9iamVjdCByZXR1cm5lZDpcIiwgeW9iaXRNa3QpO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJ1blRlc3QoKSB7XG5cbiAgdHJ5IHtcbiAgICBsZXQgbWt0RGVwdGggPSBhd2FpdCBnZXRFeGNoYW5nZU1rdERlcHRoKFwicG9sb25pZXhcIiwgXCJCVENfTEJDXCIsMTApO1xuICAgIGNvbnNvbGUubG9nKG1rdERlcHRoKTsgICAgXG4gICAgbWt0RGVwdGggPSBhd2FpdCBnZXRFeGNoYW5nZU1rdERlcHRoKFwiYml0dHJleFwiLCBcIkJUQy1MQkNcIik7XG4gICAgY29uc29sZS5sb2cobWt0RGVwdGgpO1xuICAgIG1rdERlcHRoID0gYXdhaXQgZ2V0RXhjaGFuZ2VNa3REZXB0aChcImhpdGJ0Y1wiLCBcIkVUSEJUQ1wiKTtcbiAgICBjb25zb2xlLmxvZyhta3REZXB0aCk7XG4gIH1cbiAgY2F0Y2goZXJyKSB7XG4gICAgY29uc29sZS5sb2coZXJyKTtcbiAgfVxufVxuXG4vLyBTZXQgdGhlIGRlZmF1bHQgY29wYXJlIHRvIHJ1bi5cbmxldCBjb21wYXJlVG9SdW46IFByb21pc2U8dm9pZD4gPSBydW5Qb2xvQml0dHJleENvbXBhcmU7XG5pZiAocHJvY2Vzcy5hcmd2Lmxlbmd0aD49Mykge1xuICBpZiAocHJvY2Vzcy5hcmd2WzJdPT09XCJwb2xvaW50ZXJuYWxcIikge1xuICAgIGNvbnNvbGUubG9nKGBSdW5uaW5nIHBvbG9pbnRlcm5hbCBjb21wYXJlLmApO1xuICAgIGNvbXBhcmVUb1J1biA9IHBvbG9JbnRlcm5hbENvbXBhcmU7XG4gIH1cbiAgZWxzZSB7XG4gICAgaWYgKHByb2Nlc3MuYXJndlsyXT09PVwicG9sb2NvaW5iYXNlXCIpIHtcbiAgICAgIGNvbXBhcmVUb1J1biA9IHJ1blBvbG9Db2luYmFzZUNvbXBhcmU7XG4gICAgICBjb25zb2xlLmxvZyhcIlJ1bm5pbmcgUG9sb0NvaW5iYXNlQ29tcGFyZS5cIik7XG4gICAgfVxuICAgIGVsc2UgaWYgKHByb2Nlc3MuYXJndlsyXT09PVwicG9sb2hpdGJ0Y1wiKSB7XG4gICAgICBjb21wYXJlVG9SdW4gPSBydW5Qb2xvSGl0YnRjQ29tcGFyZTtcbiAgICAgIGNvbnNvbGUubG9nKFwiUnVubmluZyBQb2xvSGl0YnRjQ29tcGFyZS5cIilcbiAgICB9XG4gICAgZWxzZSBpZiAocHJvY2Vzcy5hcmd2WzJdPT09XCJiaXR0cmV4aGl0YnRjXCIpIHtcbiAgICAgIGNvbXBhcmVUb1J1biA9IHJ1bkJpdHRyZXhIaXRidGNDb21wYXJlO1xuICAgICAgY29uc29sZS5sb2coXCJSdW5uaW5nIHJ1bkJpdHRyZXhIaXRidGNDb21wYXJlLlwiKVxuICAgIH1cbiAgICBlbHNlIGlmIChwcm9jZXNzLmFyZ3ZbMl09PT1cInBvbG95b2JpdFwiKSB7XG4gICAgICBjb21wYXJlVG9SdW4gPSBydW5Qb2xvWW9iaXRDb21wYXJlO1xuICAgICAgY29uc29sZS5sb2coXCJSdW5uaW5nIHJ1blBvbG9Zb2JpdENvbXBhcmUuXCIpXG4gICAgfVxuICAgIGVsc2UgaWYgKHByb2Nlc3MuYXJndlsyXT09PVwieW9iaXRpbnRlcm5hbFwiKSB7XG4gICAgICBjb21wYXJlVG9SdW4gPSBydW5Zb2JpdEludGVybmFsQ29tcGFyZTtcbiAgICAgIGNvbnNvbGUubG9nKFwiUnVubmluZyBydW5Zb2JpdEludGVybmFsQ29tcGFyZS5cIilcbiAgICB9XG4gICAgZWxzZSBpZiAocHJvY2Vzcy5hcmd2WzJdPT09XCJwb2xvYmluYW5jZVwiKSB7XG4gICAgICBjb21wYXJlVG9SdW4gPSBydW5Qb2xvQmluYW5jZUNvbXBhcmU7XG4gICAgICBjb25zb2xlLmxvZyhcIlJ1bm5pbmcgcnVuUG9sb0JpbmFuY2VDb21wYXJlLlwiKVxuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgY29uc29sZS5sb2coXCJSdW5uaW5nIGRlZmF1bHQgcG9sbyBiaXR0cmV4IGNvbXBhcmUuXCIpO1xuICAgIH1cbiAgfVxufVxubGV0IG5ld0ludGVyYWwgPSAxMDAwKih0aW1lSW5TZWNvbmRzQmV0d2VlblByaWNlQ2hlY2tzICsgNSpNYXRoLnJhbmRvbSgpKTtcbmNvbnNvbGUubG9nKGBTZXR0aW5nIHRoZSB0aW1lciBpbnRlcnZhbCB0byAke25ld0ludGVyYWwvMTAwMH0gc2Vjb25kcy5gICk7XG5jb21wYXJlVG9SdW4oKTtcbmludGVydmFsSGFuZGVsID0gc2V0SW50ZXJ2YWwoY29tcGFyZVRvUnVuLCBuZXdJbnRlcmFsKTtcblxuLy9ydW5UZXN0KCk7XG4iXX0=