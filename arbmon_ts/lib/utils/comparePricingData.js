"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.comparePoloniexCoinbase = comparePoloniexCoinbase;
exports.compareAllPoloniexBittrex = compareAllPoloniexBittrex;
exports.compareAllPoloniexHitbtc = compareAllPoloniexHitbtc;
exports.compareAllBittrexHitbtc = compareAllBittrexHitbtc;
exports.compareAllPoloniexYobit = compareAllPoloniexYobit;
exports.internalCompareForYobit = internalCompareForYobit;
exports.compareAllPoloniexBinance = compareAllPoloniexBinance;

var _sendEMail = require("./sendEMail");

var _dbUtils = require("./dbUtils");

var _getCryptoData = require("./getCryptoData");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

// Set this to be a clear trading opportunity
var arbEmailThresholdPercent = 1.25; // Set this to be the fees associated with trading

var arbReportingThresholdPercent = 0.0; // Control output to DB

var dbWriteEnabled = true; // Control reported output

var reportLoses = false; // Control activation of new features

var orderBookOn = false; // mongoDB - Database and collection

var mongoDBName = "crypto";
var mongoDBCollection = "marketdata.arbmon-p";
var mongoDBCollectionHist = "marketdata.arbmonhist-p";
/* formatTimestamp
 * desc: Simple utility to truncate the output of long time stamps to include only the date and time parts.
 */

function formatTimestamp(timeStamp) {
  return timeStamp.toString().slice(0, 25);
}
/* comparePoloniexCoinbase
 * desc: Main function called to compare the Poloniex and Coinbase crypto markets.
 *       This function is exported and called be app.js
 */


function comparePoloniexCoinbase(poloData, cbData, coin) {
  var poloJSON = JSON.parse(poloData.exchangeData);
  var cbJSON = JSON.parse(cbData.exchangeData);
  var timeStamp = new Date();
  console.log("".concat(formatTimestamp(timeStamp), ": PoloTime-CBTime: ").concat(poloData.timeStamp.getTime() - cbData.timeStamp.getTime(), "."));
  compareCurrencyPair(timeStamp, poloJSON, cbJSON, "USDC", coin);
}
/* compareCurrencyPair
 * desc: Compares a currency pair between Poloniex and Coinbase.  Notifies when significant arbitrage opportunities
 *       occur.
 */


function compareCurrencyPair(timeStamp, poloJSON, cbJSON, ccy1, ccy2) {
  var poloPair = ccy1 + "_" + ccy2;
  var poloBuyAt = +poloJSON[poloPair].lowestAsk;
  var poloSellAt = +poloJSON[poloPair].highestBid;
  var coinbaseSellAt = +cbJSON.bids[0][0];
  var coinbaseBuyAt = +cbJSON.asks[0][0];
  outputArbResults(poloBuyAt, poloSellAt, "Poloniex", coinbaseSellAt, coinbaseBuyAt, "Coinbase", poloPair, timeStamp);
}
/* compareAllPoloniexBittrex
 * desc: Takes the poloniex and bittrex data in JSON format and compares all overlaping markets for arbitrage.
 *       Exported function called by the main app.js
 */


function compareAllPoloniexBittrex(poloJSON, bittrexJSON) {
  var reportingTimestamp = new Date();
  var poloAllMarkets = JSON.parse(poloJSON.exchangeData);

  for (var bittrexMkt in bittrexJSON.exchangeData) {
    var poloMktName = poloMktFromBittrexName(bittrexMkt);
    var poloMktElement = poloAllMarkets[poloMktName];

    if (!poloMktElement) {
      console.log("Polo market for ", bittrexMkt, " doesn't exist.");
    } else {
      comparePoloniexBittrexMktElement(poloMktElement, bittrexJSON.exchangeData[bittrexMkt], poloMktName, reportingTimestamp);
    }
  }
}
/* comparePoloniexBittrexMktElement
 * desc: Compares a particular market between the Poloniex and Bittrex exchanges.  Sedn notifications when
 *       significant arbitrage opportunities exist.
 */


function comparePoloniexBittrexMktElement(poloJSON, bittrexJSON, poloPair, timeStamp) {
  var poloBuyAt = +poloJSON.lowestAsk;
  var poloSellAt = +poloJSON.highestBid;
  var bittrexSellAt = +bittrexJSON.Bid;
  var bittrexBuyAt = +bittrexJSON.Ask;
  outputArbResults(poloBuyAt, poloSellAt, "Poloniex", bittrexSellAt, bittrexBuyAt, "Bittrex", poloPair, timeStamp);
}

function outputArbResults(_x, _x2, _x3, _x4, _x5, _x6, _x7, _x8) {
  return _outputArbResults.apply(this, arguments);
}

function _outputArbResults() {
  _outputArbResults = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee(exch1BuyAt, exch1SellAt, exch1Name, exch2SellAt, exch2BuyAt, exch2Name, ccyPair, timeStamp) {
    var dbOutput, arbOpportunity, arbPercent, keyStr, key;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            dbOutput = {
              key: "",
              exch1Name: exch1Name,
              exch2Name: exch2Name,
              timeStamp: timeStamp.toString().slice(0, 25),
              ccyPair: ccyPair,
              exch1BuyAt: exch1BuyAt,
              exch1SellAt: exch1SellAt,
              exch2BuyAt: exch2BuyAt,
              exch2SellAt: exch2SellAt,
              gainLoss: "LOSS",
              urgentTrade: false,
              arbPercent: 0,
              exch1BuyOrSell: "",
              tradeInstructions: "",
              time: Math.round(new Date().getTime() / 1000)
            }; // Check for case of Buy at Exchange2 and Sell at Exchange1

            arbOpportunity = exch1SellAt - exch2BuyAt;
            arbPercent = 100 * (exch1SellAt - exch2BuyAt) / ((exch1SellAt + exch2BuyAt) / 2);
            dbOutput.arbPercent = arbPercent;
            dbOutput.exch1BuyOrSell = "Sell";

            if (arbPercent > arbReportingThresholdPercent) {
              dbOutput.gainLoss = "GAIN";
              dbOutput.tradeInstructions = "".concat(ccyPair, " BUY at ").concat(exch2Name, " for ").concat(exch2BuyAt.toFixed(9), ". SELL at ").concat(exch1Name, " for ").concat(exch1SellAt.toFixed(9), " Gain ").concat(arbPercent.toFixed(6), "%");
              console.log(dbOutput.gainLoss, ": ", dbOutput.tradeInstructions);

              if (arbPercent > arbEmailThresholdPercent) {
                dbOutput.urgentTrade = true;
                (0, _sendEMail.SendMessage)("".concat(ccyPair, ": BUY at ").concat(exch2Name, " and SELL at ").concat(exch1Name), dbOutput.tradeInstructions);
              }
            } else {
              dbOutput.gainLoss = "LOSS";
              dbOutput.urgentTrade = false;
              dbOutput.tradeInstructions = "".concat(ccyPair, " BUY at ").concat(exch2Name, " for ").concat(exch2BuyAt.toFixed(9), ". SELL at ").concat(exch1Name, " for ").concat(exch1SellAt.toFixed(9), " Loss ").concat(arbPercent.toFixed(6), "%");

              if (reportLoses) {
                console.log("".concat(formatTimestamp(timeStamp), ": Pair: ").concat(ccyPair, ", Result: LOSS, Desc: ").concat(exch2Name, ", ").concat(exch2BuyAt.toFixed(8), " is greater than SellAt, ").concat(exch1SellAt.toFixed(8), ", DIFF, ").concat(arbOpportunity.toFixed(6)));
              }
            }

            keyStr = "Buy" + exch2Name + "Sell" + exch1Name + ccyPair;
            key = {
              "key": keyStr
            };
            dbOutput.key = keyStr;

            if (!dbWriteEnabled) {
              _context.next = 16;
              break;
            }

            _context.next = 12;
            return (0, _dbUtils.updateResultsInMongo)(key, dbOutput, mongoDBName, mongoDBCollection);

          case 12:
            if (!dbOutput.urgentTrade) {
              _context.next = 16;
              break;
            }

            dbOutput.key += new Date().getTime();
            _context.next = 16;
            return (0, _dbUtils.writeResultsToMongoSync)(dbOutput, mongoDBName, mongoDBCollectionHist);

          case 16:
            // Check for case of Buy at Exchange1 and Sell at Exchange2
            arbOpportunity = exch2SellAt - exch1BuyAt;
            arbPercent = 100 * (exch2SellAt - exch1BuyAt) / ((exch2SellAt + exch1BuyAt) / 2);
            dbOutput.arbPercent = arbPercent;
            dbOutput.exch1BuyOrSell = "Buy";

            if (!(arbPercent > arbReportingThresholdPercent)) {
              _context.next = 32;
              break;
            }

            dbOutput.gainLoss = "GAIN";
            dbOutput.tradeInstructions = "".concat(ccyPair, " BUY at ").concat(exch1Name, " for ").concat(exch1BuyAt.toFixed(9), ". SELL ").concat(exch2Name, " for ").concat(exch2SellAt.toFixed(9), " Gain ").concat(arbPercent.toFixed(6), "%");
            console.log(dbOutput.gainLoss, ": ", dbOutput.tradeInstructions); // Experimental code

            if (!orderBookOn) {
              _context.next = 29;
              break;
            }

            _context.next = 27;
            return outputOrderBook(exch1Name, ccyPair, "buy");

          case 27:
            _context.next = 29;
            return outputOrderBook(exch2Name, ccyPair, "sell");

          case 29:
            if (arbPercent > arbEmailThresholdPercent) {
              dbOutput.urgentTrade = true;
              (0, _sendEMail.SendMessage)("".concat(ccyPair, ": BUY at ").concat(exch1Name, " and SELL at ").concat(exch2Name), dbOutput.tradeInstructions);
            }

            _context.next = 36;
            break;

          case 32:
            dbOutput.gainLoss = "LOSS";
            dbOutput.urgentTrade = false;
            dbOutput.tradeInstructions = "".concat(ccyPair, " BUY at ").concat(exch1Name, " for ").concat(exch1BuyAt.toFixed(9), " SELL ").concat(exch2Name, " for ").concat(exch2SellAt.toFixed(9), " Loss ").concat(arbPercent.toFixed(6), "%");

            if (reportLoses) {
              console.log("".concat(formatTimestamp(timeStamp), ": Pair: ").concat(ccyPair, ", Result: LOSS, Desc: BuyAt, ").concat(exch1BuyAt.toFixed(9), " is greater than ").concat(exch2Name, "SellAt, ").concat(exch2SellAt.toFixed(8), ". DIFF, ").concat(arbOpportunity.toFixed(7)));
            }

          case 36:
            keyStr = "Buy" + exch1Name + "Sell" + exch2Name + ccyPair;
            key = {
              "key": keyStr
            };
            dbOutput.key = keyStr;

            if (!dbWriteEnabled) {
              _context.next = 46;
              break;
            }

            _context.next = 42;
            return (0, _dbUtils.updateResultsInMongo)(key, dbOutput, mongoDBName, mongoDBCollection);

          case 42:
            if (!dbOutput.urgentTrade) {
              _context.next = 46;
              break;
            }

            dbOutput.key += new Date().getTime();
            _context.next = 46;
            return (0, _dbUtils.writeResultsToMongoSync)(dbOutput, mongoDBName, mongoDBCollectionHist);

          case 46:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _outputArbResults.apply(this, arguments);
}

function outputOrderBook(_x9, _x10, _x11) {
  return _outputOrderBook.apply(this, arguments);
}
/* poloMktFromBittrexName
 * desc: Converts a Bittrex crypto currency pair into the Poloniex pair.
 */


function _outputOrderBook() {
  _outputOrderBook = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2(exchangeName, ccyPair, exch1BuyOrSell) {
    var orderBook, exchangeData, mktSide, orders, _orderBook, _exchangeData, _mktSide, _orders;

    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            if (!(exchangeName === "Poloniex")) {
              _context2.next = 11;
              break;
            }

            _context2.next = 3;
            return (0, _getCryptoData.getExchangeMktDepth)("poloniex", ccyPair);

          case 3:
            orderBook = _context2.sent;
            exchangeData = JSON.parse(orderBook.exchangeData);
            mktSide = exch1BuyOrSell === "buy" ? "asks" : "bids";
            orders = exchangeData[mktSide];
            orders.forEach(function (value) {
              console.log("".concat(exchangeName, " ").concat(ccyPair, " price: ").concat(value[0], " size: ").concat(value[1]));
            });
            console.log("poloniex: ".concat(ccyPair, " ").concat(exchangeData["asks"]));
            _context2.next = 19;
            break;

          case 11:
            if (!(exchangeName === "Bittrex")) {
              _context2.next = 19;
              break;
            }

            _context2.next = 14;
            return (0, _getCryptoData.getExchangeMktDepth)("bittrex", bittrexMktFromPoloName(ccyPair));

          case 14:
            _orderBook = _context2.sent;
            _exchangeData = JSON.parse(_orderBook.exchangeData);
            _mktSide = exch1BuyOrSell === "buy" ? "sell" : "buy";
            _orders = _exchangeData["result"][_mktSide];

            _orders.forEach(function (value, idx) {
              console.log("bittrex: ".concat(ccyPair, " ").concat(value.Rate, " ").concat(value.Quantity));
            });

          case 19:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));
  return _outputOrderBook.apply(this, arguments);
}

function poloMktFromBittrexName(bittrexMktName) {
  if (bittrexMktName === "BTC-XLM") return "BTC_STR";
  if (bittrexMktName === "USDT-XLM") return "USDT_STR";
  return bittrexMktName.replace("-", "_");
}
/* bittrexMktFromPoloName
 * desc: Converts a Bittrex crypto currency pair into the Poloniex pair.
 */


function bittrexMktFromPoloName(poloMktName) {
  if (poloMktName === "BTC_STR") return "BTC-XLM";
  if (poloMktName === "USDT_STR") return "USDT-XLM";
  return poloMktName.replace("_", "-");
}
/* compareAllPoloniexHitbtc
*  desc: Takes the poloniex and hitbtc data in JSON format and compares all overlaping markets for arbitrage.
*       Exported function called by the main app.js
*/


function compareAllPoloniexHitbtc(poloJSON, hitbtcJSON) {
  var reportingTimestamp = new Date();
  var poloAllMarkets = JSON.parse(poloJSON.exchangeData);

  for (var hitbtcMkt in hitbtcJSON.exchangeData) {
    var poloMktName = poloMktFromHitbtcName(hitbtcMkt);
    var poloMktElement = poloAllMarkets[poloMktName];
    comparePoloniexHitbtcMktElement(poloMktElement, hitbtcJSON.exchangeData[hitbtcMkt], poloMktName, reportingTimestamp);
  }
}
/* comparePoloniexHitbtcMktElement
 * desc: Pulls out the buy and sell prices for a single currency pair for Poloniex and Hitbtc.
 *       Forwards this to the output method to record the arbitrage results.
 */


function comparePoloniexHitbtcMktElement(poloMktElement, hitbtcMktElement, poloMktName, reportingTimestamp) {
  var poloBuyAt = +poloMktElement.lowestAsk;
  var poloSellAt = +poloMktElement.highestBid;
  var hitbtcSellAt = +hitbtcMktElement.bid;
  var hitbtcBuyAt = +hitbtcMktElement.ask;

  if (!hitbtcSellAt || !hitbtcBuyAt) {
    console.log("Got bad rates from the hitbtc for:", poloMktName);
    return;
  }

  outputArbResults(poloBuyAt, poloSellAt, "Poloniex", hitbtcSellAt, hitbtcBuyAt, "Hitbtc", poloMktName, reportingTimestamp);
}
/* poloMktFromHitbtcName
 * desc: Maps from Hitbtc tickers to Poloniex tickers.
 */


function poloMktFromHitbtcName(hitbtcMktName) {
  var poloMktNames = {
    BCNBTC: "BTC_BCN",
    DASHBTC: "BTC_DASH",
    DOGEBTC: "BTC_DOGE",
    ETHBTC: "BTC_ETH",
    LSKBTC: "BTC_LSK",
    LTCBTC: "BTC_LTC",
    NXTBTC: "BTC_NXT",
    SBDBTC: "BTC_SBD",
    SCBTC: "BTC_SC",
    STEEMBTC: "BTC_STEEM",
    XEMBTC: "BTC_XEM",
    XMRBTC: "BTC_XMR",
    ARDRBTC: "BTC_ARDR",
    ZECBTC: "BTC_ZEC",
    MAIDBTC: "BTC_MAID",
    REPBTC: "BTC_REP",
    ETCBTC: "BTC_ETC",
    BNTBTC: "BTC_BNT",
    SNTETH: "ETH_SNT",
    OMGETH: "ETH_OMG",
    ETCETH: "ETH_ETC",
    ZECETH: "ETH_ZEC",
    XRPBTC: "BTC_XRP",
    STRATBTC: "BTC_STRAT",
    EOSETH: "ETH_EOS",
    EOSBTC: "BTC_EOS",
    BNTETH: "ETH_BNT",
    ZRXBTC: "BTC_ZRX",
    ZRXETH: "ETH_ZRX",
    PPCBTC: "BTC_PPC",
    QTUMETH: "ETH_QTUM",
    DGBBTC: "BTC_DGB",
    OMGBTC: "BTC_OMG",
    SNTBTC: "BTC_SNT",
    XRPUSDT: "USDT_XRP",
    MANAETH: "ETH_MANA",
    MANABTC: "BTC_MANA",
    QTUMBTC: "BTC_QTUM",
    LSKETH: "ETH_LSK",
    REPETH: "ETH_REP",
    REPUSDT: "USDT_REP",
    GNTBTC: "BTC_GNT",
    GNTETH: "ETH_GNT",
    BTSBTC: "BTC_BTS",
    BATBTC: "BTC_BAT",
    BATETH: "ETH_BAT",
    BCHABCBTC: "BTC_BCHABC",
    BCHSVBTC: "BTC_BCHSV",
    NMRBTC: "BTC_NMR",
    POLYBTC: "BTC_POLY",
    STORJBTC: "BTC_STORJ"
  };
  return poloMktNames[hitbtcMktName];
}
/* compareAllBittrexHitbtc
*  desc: Takes the bittrex and hitbtc data in JSON format and compares all overlaping markets for arbitrage.
*       Exported function called by the main app.js
*/


function compareAllBittrexHitbtc(bittrexJSON, hitbtcJSON) {
  var reportingTimestamp = new Date();
  var bittrexTimestamp = bittrexJSON.timeStamp;
  var bittrexAllMarkets = JSON.parse(bittrexJSON.exchangeData).result;
  var hitbtcTimestamp = hitbtcJSON.timeStamp;
  var hitbtcAllMarkets = JSON.parse(hitbtcJSON.exchangeData);
  console.log("In compareAllBittrexHitbtc");
  console.log(bittrexTimestamp);
  console.log(hitbtcTimestamp);
  bittrexAllMarkets.forEach(function (bittrexMktElem) {
    var hitbtcMktName = hitBtcMktFromBittrexName(bittrexMktElem.MarketName);
    var hitbtcMkt = hitbtcAllMarkets.filter(function (item) {
      return item.symbol === hitbtcMktName;
    });

    if (hitbtcMkt.length != 0) {
      var badMakerts = ["BTC-BCH", "ETH-BCH", "USD-BCH", "BTC-BITS", "BTC-XDN", "BTC-SWT"]; // let badMakerts = ["BTC-BCH", "ETH-BCH", "USD-BCH", "BTC-BITS", "BTC-SPC", "BTC-SWT", "BTC-CMCT",
      // "BTC-NLC2", "BTC-WAVES"];

      if (!badMakerts.includes(bittrexMktElem.MarketName)) {
        compareBittrexHitbtcMktElement(bittrexMktElem, hitbtcMkt[0], bittrexMktElem.MarketName, new Date());
      }
    }
  });
}
/* compareBittrexHitbtcMktElement
 * desc: Pulls out the buy and sell prices for a single currency pair for Poloniex and Hitbtc.
 *       Forwards this to the output method to record the arbitrage results.
 */


function compareBittrexHitbtcMktElement(bittrexMktElement, hitbtcMktElement, bittrexMktName, reportingTimestamp) {
  var bittrexBuyAt = +bittrexMktElement.Ask;
  var bittrexSellAt = +bittrexMktElement.Bid;
  var hitbtcSellAt = +hitbtcMktElement.bid;
  var hitbtcBuyAt = +hitbtcMktElement.ask;

  if (!hitbtcSellAt || !hitbtcBuyAt) {
    console.log("Got bad rates from the hitbtc for:", bittrexMktName);
    return;
  }

  if (!bittrexBuyAt || !bittrexSellAt) {
    console.log("Got bad rates from the bittrex for:", bittrexMktName);
    return;
  }

  outputArbResults(bittrexBuyAt, bittrexSellAt, "Bittrex", hitbtcSellAt, hitbtcBuyAt, "Hitbtc", bittrexMktName, reportingTimestamp);
}
/* hitBtcMktFromBittrexName
 * desc: Maps from Bittrex tickers to Hitbtc tickers.
 */


function hitBtcMktFromBittrexName(bittrexMktName) {
  var splitTicker = bittrexMktName.split("-");
  return splitTicker[1] + splitTicker[0];
}
/* compareAllPoloniexYobit
 * desc: Compares market data across many currency pairs between Poloniex and Yobit.
 *       Note that Yobit oftens has large prcie discrepencies but the wallets for thos coins
 *       are deactivated.  So you can't generate a profit.
 */


function compareAllPoloniexYobit(poloData, yobitData) {
  var reportingTimestamp = new Date();
  var poloTimestamp = poloData.timeStamp;
  var poloAllMarkets = JSON.parse(poloData.exchangeData);
  var yobitTimestamp = yobitData.timeStamp;
  var yobitAllMarkets = JSON.parse(yobitData.exchangeData);
  console.log(poloTimestamp);
  console.log(yobitTimestamp);

  for (var yobitMkt in yobitAllMarkets) {
    console.log("yobitMkt:", yobitMkt, " data:", yobitAllMarkets[yobitMkt]);
    var poloMktName = poloMktFromYobitName(yobitMkt);
    console.log("PoloMarket:", poloMktName, " data:", poloAllMarkets[poloMktName]);
    comparePoloniexYobitMktElement(poloAllMarkets[poloMktName], yobitAllMarkets[yobitMkt], poloMktName, reportingTimestamp);
  }
}
/* comparePoloniexYobitMktElement
 * desc: Pulls out the buy and sell prices for a single currency pair for Poloniex and Yobit.
 *       Forwards this to the output method to record the arbitrage results.
 */


function comparePoloniexYobitMktElement(poloMktElement, yobitMktElement, poloMktName, reportingTimestamp) {
  var poloBuyAt = +poloMktElement.lowestAsk;
  var poloSellAt = +poloMktElement.highestBid;
  var yobitSellAt = +yobitMktElement.sell;
  var yobitBuyAt = +yobitMktElement.buy;
  outputArbResults(poloBuyAt, poloSellAt, "Poloniex", yobitSellAt, yobitBuyAt, "Yobit", poloMktName, reportingTimestamp);
}
/* poloMktFromYobitName
 * desc: Maps from Yobit tickers to Poloniex tickers.
 */


function poloMktFromYobitName(yobitMktName) {
  var poloMktNames = {
    ltc_btc: "BTC_LTC",
    nmc_btc: "BTC_NMC",
    nmr_btc: "BTC_NMR",
    eth_btc: "BTC_ETH"
  };
  return poloMktNames[yobitMktName];
}

function internalCompareForYobit(_x12, _x13, _x14) {
  return _internalCompareForYobit.apply(this, arguments);
}

function _internalCompareForYobit() {
  _internalCompareForYobit = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee3(mktData, yobitMarkets, baseMarkets) {
    var timeStamp, i, curMkt1, curMkt2, basePair, arbFraction, keyStr, dbOutput, key;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            timeStamp = new Date();
            i = 0;

          case 2:
            if (!(i < yobitMarkets.length)) {
              _context3.next = 19;
              break;
            }

            curMkt1 = yobitMarkets[i] + "_" + baseMarkets[0];
            curMkt2 = yobitMarkets[i] + "_" + baseMarkets[1];
            basePair = baseMarkets[1] + "_" + baseMarkets[0];
            arbFraction = mktData[basePair].buy * mktData[curMkt2].buy / mktData[curMkt1].sell;
            console.log("Arb Fraction for ", yobitMarkets[i], ": ", arbFraction.toFixed(6));
            keyStr = "YobitInternal_" + curMkt1 + "_" + baseMarkets[1];
            dbOutput = {
              key: keyStr,
              exch1Name: "Yobit",
              exch2Name: "Yobit",
              timeStamp: timeStamp.toString().slice(0, 25),
              ccyPair: curMkt1,
              exch1BuyAt: mktData[curMkt1].sell,
              exch1SellAt: 0,
              exch2BuyAt: 0,
              exch2SellAt: mktData[curMkt2].buy,
              gainLoss: "Loss",
              urgentTrade: false,
              arbPercent: arbFraction,
              exch1BuyOrSell: "Buy",
              tradeInstructions: ""
            };

            if (arbFraction > 1) {
              dbOutput.gainLoss = "Gain";
              console.log("  ---> Gain", timeStamp.toString().slice(0, 25), " ", arbFraction.toFixed(8), "Buy ", yobitMarkets[i], " with BTC at", mktData[curMkt1].sell, "sell the", yobitMarkets[i], "for", mktData[curMkt2].buy, "to get ETH. Convert ETH back to BTC at", mktData[basePair].buy);

              if (arbFraction > 1.005) {
                dbOutput.urgentTrade = true;
              }
            }

            dbOutput.key = keyStr;
            key = {
              "key": keyStr
            };

            if (!dbWriteEnabled) {
              _context3.next = 16;
              break;
            }

            _context3.next = 16;
            return (0, _dbUtils.updateResultsInMongo)(key, dbOutput, mongoDBName, mongoDBCollection);

          case 16:
            i++;
            _context3.next = 2;
            break;

          case 19:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));
  return _internalCompareForYobit.apply(this, arguments);
}

function compareAllPoloniexBinance(poloniexData, binanceData) {
  // Array of strings containing the poloniex markets to exclude from the compare
  var excludeList = ["BTC_BCN"];
  var poloJSON = JSON.parse(poloniexData.exchangeData);
  var binanceJSON = JSON.parse(binanceData.exchangeData);
  binanceJSON.forEach(function (binanceElement) {
    var poloTicker = getPoloTickerFromBinance(binanceElement.symbol);

    if (poloJSON[poloTicker] && excludeList.indexOf(poloTicker) === -1) {
      comparePoloniexBinanceMktElement(poloJSON[poloTicker], binanceElement, poloTicker, new Date());
    }
  });
}

function getPoloTickerFromBinance(binanceTicker) {
  // Special cases
  if (binanceTicker === "XLMBTC") return "BTC_STR";
  if (binanceTicker === "XLMETH") return "ETH_STR";
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
/* comparePoloniexBinanceMktElement
 * desc: Pulls out the buy and sell prices for a single currency pair for Poloniex and Yobit.
 *       Forwards this to the output method to record the arbitrage results.
 */


function comparePoloniexBinanceMktElement(poloMktElement, binanceMktElement, poloMktName, reportingTimestamp) {
  var poloBuyAt = +poloMktElement.lowestAsk;
  var poloSellAt = +poloMktElement.highestBid;
  var binanceSellAt = +binanceMktElement.bidPrice;
  var binanceBuyAt = +binanceMktElement.askPrice;
  outputArbResults(poloBuyAt, poloSellAt, "Poloniex", binanceSellAt, binanceBuyAt, "Binance", poloMktName, reportingTimestamp);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9jb21wYXJlUHJpY2luZ0RhdGEudHMiXSwibmFtZXMiOlsiYXJiRW1haWxUaHJlc2hvbGRQZXJjZW50IiwiYXJiUmVwb3J0aW5nVGhyZXNob2xkUGVyY2VudCIsImRiV3JpdGVFbmFibGVkIiwicmVwb3J0TG9zZXMiLCJvcmRlckJvb2tPbiIsIm1vbmdvREJOYW1lIiwibW9uZ29EQkNvbGxlY3Rpb24iLCJtb25nb0RCQ29sbGVjdGlvbkhpc3QiLCJmb3JtYXRUaW1lc3RhbXAiLCJ0aW1lU3RhbXAiLCJ0b1N0cmluZyIsInNsaWNlIiwiY29tcGFyZVBvbG9uaWV4Q29pbmJhc2UiLCJwb2xvRGF0YSIsImNiRGF0YSIsImNvaW4iLCJwb2xvSlNPTiIsIkpTT04iLCJwYXJzZSIsImV4Y2hhbmdlRGF0YSIsImNiSlNPTiIsIkRhdGUiLCJjb25zb2xlIiwibG9nIiwiZ2V0VGltZSIsImNvbXBhcmVDdXJyZW5jeVBhaXIiLCJjY3kxIiwiY2N5MiIsInBvbG9QYWlyIiwicG9sb0J1eUF0IiwibG93ZXN0QXNrIiwicG9sb1NlbGxBdCIsImhpZ2hlc3RCaWQiLCJjb2luYmFzZVNlbGxBdCIsImJpZHMiLCJjb2luYmFzZUJ1eUF0IiwiYXNrcyIsIm91dHB1dEFyYlJlc3VsdHMiLCJjb21wYXJlQWxsUG9sb25pZXhCaXR0cmV4IiwiYml0dHJleEpTT04iLCJyZXBvcnRpbmdUaW1lc3RhbXAiLCJwb2xvQWxsTWFya2V0cyIsImJpdHRyZXhNa3QiLCJwb2xvTWt0TmFtZSIsInBvbG9Na3RGcm9tQml0dHJleE5hbWUiLCJwb2xvTWt0RWxlbWVudCIsImNvbXBhcmVQb2xvbmlleEJpdHRyZXhNa3RFbGVtZW50IiwiYml0dHJleFNlbGxBdCIsIkJpZCIsImJpdHRyZXhCdXlBdCIsIkFzayIsImV4Y2gxQnV5QXQiLCJleGNoMVNlbGxBdCIsImV4Y2gxTmFtZSIsImV4Y2gyU2VsbEF0IiwiZXhjaDJCdXlBdCIsImV4Y2gyTmFtZSIsImNjeVBhaXIiLCJkYk91dHB1dCIsImtleSIsImdhaW5Mb3NzIiwidXJnZW50VHJhZGUiLCJhcmJQZXJjZW50IiwiZXhjaDFCdXlPclNlbGwiLCJ0cmFkZUluc3RydWN0aW9ucyIsInRpbWUiLCJNYXRoIiwicm91bmQiLCJhcmJPcHBvcnR1bml0eSIsInRvRml4ZWQiLCJrZXlTdHIiLCJvdXRwdXRPcmRlckJvb2siLCJleGNoYW5nZU5hbWUiLCJvcmRlckJvb2siLCJta3RTaWRlIiwib3JkZXJzIiwiZm9yRWFjaCIsInZhbHVlIiwiYml0dHJleE1rdEZyb21Qb2xvTmFtZSIsImlkeCIsIlJhdGUiLCJRdWFudGl0eSIsImJpdHRyZXhNa3ROYW1lIiwicmVwbGFjZSIsImNvbXBhcmVBbGxQb2xvbmlleEhpdGJ0YyIsImhpdGJ0Y0pTT04iLCJoaXRidGNNa3QiLCJwb2xvTWt0RnJvbUhpdGJ0Y05hbWUiLCJjb21wYXJlUG9sb25pZXhIaXRidGNNa3RFbGVtZW50IiwiaGl0YnRjTWt0RWxlbWVudCIsImhpdGJ0Y1NlbGxBdCIsImJpZCIsImhpdGJ0Y0J1eUF0IiwiYXNrIiwiaGl0YnRjTWt0TmFtZSIsInBvbG9Na3ROYW1lcyIsIkJDTkJUQyIsIkRBU0hCVEMiLCJET0dFQlRDIiwiRVRIQlRDIiwiTFNLQlRDIiwiTFRDQlRDIiwiTlhUQlRDIiwiU0JEQlRDIiwiU0NCVEMiLCJTVEVFTUJUQyIsIlhFTUJUQyIsIlhNUkJUQyIsIkFSRFJCVEMiLCJaRUNCVEMiLCJNQUlEQlRDIiwiUkVQQlRDIiwiRVRDQlRDIiwiQk5UQlRDIiwiU05URVRIIiwiT01HRVRIIiwiRVRDRVRIIiwiWkVDRVRIIiwiWFJQQlRDIiwiU1RSQVRCVEMiLCJFT1NFVEgiLCJFT1NCVEMiLCJCTlRFVEgiLCJaUlhCVEMiLCJaUlhFVEgiLCJQUENCVEMiLCJRVFVNRVRIIiwiREdCQlRDIiwiT01HQlRDIiwiU05UQlRDIiwiWFJQVVNEVCIsIk1BTkFFVEgiLCJNQU5BQlRDIiwiUVRVTUJUQyIsIkxTS0VUSCIsIlJFUEVUSCIsIlJFUFVTRFQiLCJHTlRCVEMiLCJHTlRFVEgiLCJCVFNCVEMiLCJCQVRCVEMiLCJCQVRFVEgiLCJCQ0hBQkNCVEMiLCJCQ0hTVkJUQyIsIk5NUkJUQyIsIlBPTFlCVEMiLCJTVE9SSkJUQyIsImNvbXBhcmVBbGxCaXR0cmV4SGl0YnRjIiwiYml0dHJleFRpbWVzdGFtcCIsImJpdHRyZXhBbGxNYXJrZXRzIiwicmVzdWx0IiwiaGl0YnRjVGltZXN0YW1wIiwiaGl0YnRjQWxsTWFya2V0cyIsImJpdHRyZXhNa3RFbGVtIiwiaGl0QnRjTWt0RnJvbUJpdHRyZXhOYW1lIiwiTWFya2V0TmFtZSIsImZpbHRlciIsIml0ZW0iLCJzeW1ib2wiLCJsZW5ndGgiLCJiYWRNYWtlcnRzIiwiaW5jbHVkZXMiLCJjb21wYXJlQml0dHJleEhpdGJ0Y01rdEVsZW1lbnQiLCJiaXR0cmV4TWt0RWxlbWVudCIsInNwbGl0VGlja2VyIiwic3BsaXQiLCJjb21wYXJlQWxsUG9sb25pZXhZb2JpdCIsInlvYml0RGF0YSIsInBvbG9UaW1lc3RhbXAiLCJ5b2JpdFRpbWVzdGFtcCIsInlvYml0QWxsTWFya2V0cyIsInlvYml0TWt0IiwicG9sb01rdEZyb21Zb2JpdE5hbWUiLCJjb21wYXJlUG9sb25pZXhZb2JpdE1rdEVsZW1lbnQiLCJ5b2JpdE1rdEVsZW1lbnQiLCJ5b2JpdFNlbGxBdCIsInNlbGwiLCJ5b2JpdEJ1eUF0IiwiYnV5IiwieW9iaXRNa3ROYW1lIiwibHRjX2J0YyIsIm5tY19idGMiLCJubXJfYnRjIiwiZXRoX2J0YyIsImludGVybmFsQ29tcGFyZUZvcllvYml0IiwibWt0RGF0YSIsInlvYml0TWFya2V0cyIsImJhc2VNYXJrZXRzIiwiaSIsImN1ck1rdDEiLCJjdXJNa3QyIiwiYmFzZVBhaXIiLCJhcmJGcmFjdGlvbiIsImNvbXBhcmVBbGxQb2xvbmlleEJpbmFuY2UiLCJwb2xvbmlleERhdGEiLCJiaW5hbmNlRGF0YSIsImV4Y2x1ZGVMaXN0IiwiYmluYW5jZUpTT04iLCJiaW5hbmNlRWxlbWVudCIsInBvbG9UaWNrZXIiLCJnZXRQb2xvVGlja2VyRnJvbUJpbmFuY2UiLCJpbmRleE9mIiwiY29tcGFyZVBvbG9uaWV4QmluYW5jZU1rdEVsZW1lbnQiLCJiaW5hbmNlVGlja2VyIiwiYmFzZVRpY2tlcnMiLCJiYXNlSWR4IiwiYmFzZVRpY2tlckZvdW5kIiwic2VhcmNoIiwic2Vjb25kYXJ5VGlja2VyIiwiYmluYW5jZU1rdEVsZW1lbnQiLCJiaW5hbmNlU2VsbEF0IiwiYmlkUHJpY2UiLCJiaW5hbmNlQnV5QXQiLCJhc2tQcmljZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQUtBOztBQUNBOztBQUNBOzs7Ozs7QUFFQTtBQUNBLElBQU1BLHdCQUF3QixHQUFHLElBQWpDLEMsQ0FDQTs7QUFDQSxJQUFNQyw0QkFBNEIsR0FBRyxHQUFyQyxDLENBQ0E7O0FBQ0EsSUFBSUMsY0FBYyxHQUFHLElBQXJCLEMsQ0FDQTs7QUFDQSxJQUFJQyxXQUFXLEdBQUcsS0FBbEIsQyxDQUNBOztBQUNBLElBQUlDLFdBQVcsR0FBRyxLQUFsQixDLENBQ0E7O0FBQ0EsSUFBTUMsV0FBVyxHQUFHLFFBQXBCO0FBQ0EsSUFBTUMsaUJBQWlCLEdBQUcscUJBQTFCO0FBQ0EsSUFBTUMscUJBQXFCLEdBQUcseUJBQTlCO0FBRUE7Ozs7QUFHQSxTQUFTQyxlQUFULENBQXlCQyxTQUF6QixFQUEwQztBQUN4QyxTQUFPQSxTQUFTLENBQUNDLFFBQVYsR0FBcUJDLEtBQXJCLENBQTJCLENBQTNCLEVBQTZCLEVBQTdCLENBQVA7QUFDRDtBQUVEOzs7Ozs7QUFJQSxTQUFTQyx1QkFBVCxDQUFpQ0MsUUFBakMsRUFBZ0RDLE1BQWhELEVBQTZEQyxJQUE3RCxFQUEyRTtBQUV6RSxNQUFJQyxRQUFRLEdBQUdDLElBQUksQ0FBQ0MsS0FBTCxDQUFXTCxRQUFRLENBQUNNLFlBQXBCLENBQWY7QUFDQSxNQUFJQyxNQUFNLEdBQUdILElBQUksQ0FBQ0MsS0FBTCxDQUFXSixNQUFNLENBQUNLLFlBQWxCLENBQWI7QUFDQSxNQUFJVixTQUFTLEdBQUcsSUFBSVksSUFBSixFQUFoQjtBQUNB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a0JBQXpHLEVBQW1JO0FBRWpJLE1BQUlYLFNBQVMsR0FBRyxDQUFDZ0IsY0FBYyxDQUFDZixTQUFoQztBQUNBLE1BQUlDLFVBQVUsR0FBRyxDQUFDYyxjQUFjLENBQUNiLFVBQWpDO0FBQ0EsTUFBSWtMLGFBQWEsR0FBRyxDQUFDRCxpQkFBaUIsQ0FBQ0UsUUFBdkM7QUFDQSxNQUFJQyxZQUFZLEdBQUcsQ0FBQ0gsaUJBQWlCLENBQUNJLFFBQXRDO0FBQ0FoTCxFQUFBQSxnQkFBZ0IsQ0FBQ1IsU0FBRCxFQUFZRSxVQUFaLEVBQXdCLFVBQXhCLEVBQW9DbUwsYUFBcEMsRUFBbURFLFlBQW5ELEVBQWlFLFNBQWpFLEVBQTRFekssV0FBNUUsRUFBeUZILGtCQUF6RixDQUFoQjtBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiLyogY29tcGFyZVByaWNpbmdEYXRhLmpzXG4gKiBDb25zb2xpZGF0ZXMgZnVuY3Rpb24gdG8gY29tcGFyZSBjcnlwdG8gbWFya2V0cyBsb29raW5nIGZvciBzaWduaWZpY2FudCBhcmJpdHJhZ2Ugb3Bwb3J0dW5pdGllcy5cbiAqIFNlbmRzIG5vdGlmaWNhdGlvbnMgd2hlbiBsYXJnZSBhcmJpdHJhZ2UgaXMgZGV0ZWN0ZWQuXG4gKi9cblxuaW1wb3J0IHtTZW5kTWVzc2FnZX0gZnJvbSBcIi4vc2VuZEVNYWlsXCI7XG5pbXBvcnQge3VwZGF0ZVJlc3VsdHNJbk1vbmdvLCB3cml0ZVJlc3VsdHNUb01vbmdvU3luY30gZnJvbSBcIi4vZGJVdGlsc1wiO1xuaW1wb3J0IHtnZXRFeGNoYW5nZU1rdERlcHRofSBmcm9tIFwiLi9nZXRDcnlwdG9EYXRhXCI7XG5cbi8vIFNldCB0aGlzIHRvIGJlIGEgY2xlYXIgdHJhZGluZyBvcHBvcnR1bml0eVxuY29uc3QgYXJiRW1haWxUaHJlc2hvbGRQZXJjZW50ID0gMS4yNTtcbi8vIFNldCB0aGlzIHRvIGJlIHRoZSBmZWVzIGFzc29jaWF0ZWQgd2l0aCB0cmFkaW5nXG5jb25zdCBhcmJSZXBvcnRpbmdUaHJlc2hvbGRQZXJjZW50ID0gMC4wO1xuLy8gQ29udHJvbCBvdXRwdXQgdG8gREJcbmxldCBkYldyaXRlRW5hYmxlZCA9IHRydWU7XG4vLyBDb250cm9sIHJlcG9ydGVkIG91dHB1dFxubGV0IHJlcG9ydExvc2VzID0gZmFsc2U7XG4vLyBDb250cm9sIGFjdGl2YXRpb24gb2YgbmV3IGZlYXR1cmVzXG5sZXQgb3JkZXJCb29rT24gPSBmYWxzZTtcbi8vIG1vbmdvREIgLSBEYXRhYmFzZSBhbmQgY29sbGVjdGlvblxuY29uc3QgbW9uZ29EQk5hbWUgPSBcImNyeXB0b1wiO1xuY29uc3QgbW9uZ29EQkNvbGxlY3Rpb24gPSBcIm1hcmtldGRhdGEuYXJibW9uLXBcIjtcbmNvbnN0IG1vbmdvREJDb2xsZWN0aW9uSGlzdCA9IFwibWFya2V0ZGF0YS5hcmJtb25oaXN0LXBcIjtcblxuLyogZm9ybWF0VGltZXN0YW1wXG4gKiBkZXNjOiBTaW1wbGUgdXRpbGl0eSB0byB0cnVuY2F0ZSB0aGUgb3V0cHV0IG9mIGxvbmcgdGltZSBzdGFtcHMgdG8gaW5jbHVkZSBvbmx5IHRoZSBkYXRlIGFuZCB0aW1lIHBhcnRzLlxuICovXG5mdW5jdGlvbiBmb3JtYXRUaW1lc3RhbXAodGltZVN0YW1wOiBEYXRlKSB7XG4gIHJldHVybih0aW1lU3RhbXAudG9TdHJpbmcoKS5zbGljZSgwLDI1KSk7XG59XG5cbi8qIGNvbXBhcmVQb2xvbmlleENvaW5iYXNlXG4gKiBkZXNjOiBNYWluIGZ1bmN0aW9uIGNhbGxlZCB0byBjb21wYXJlIHRoZSBQb2xvbmlleCBhbmQgQ29pbmJhc2UgY3J5cHRvIG1hcmtldHMuXG4gKiAgICAgICBUaGlzIGZ1bmN0aW9uIGlzIGV4cG9ydGVkIGFuZCBjYWxsZWQgYmUgYXBwLmpzXG4gKi9cbmZ1bmN0aW9uIGNvbXBhcmVQb2xvbmlleENvaW5iYXNlKHBvbG9EYXRhOiBhbnksIGNiRGF0YTogYW55LCBjb2luOiBzdHJpbmcpIHtcblxuICB2YXIgcG9sb0pTT04gPSBKU09OLnBhcnNlKHBvbG9EYXRhLmV4Y2hhbmdlRGF0YSk7XG4gIHZhciBjYkpTT04gPSBKU09OLnBhcnNlKGNiRGF0YS5leGNoYW5nZURhdGEpO1xuICBsZXQgdGltZVN0YW1wID0gbmV3IERhdGUoKTtcbiAgY29uc29sZS5sb2coYCR7Zm9ybWF0VGltZXN0YW1wKHRpbWVTdGFtcCl9OiBQb2xvVGltZS1DQlRpbWU6ICR7cG9sb0RhdGEudGltZVN0YW1wLmdldFRpbWUoKS1jYkRhdGEudGltZVN0YW1wLmdldFRpbWUoKX0uYCk7XG4gIGNvbXBhcmVDdXJyZW5jeVBhaXIodGltZVN0YW1wLCBwb2xvSlNPTiwgY2JKU09OLCBcIlVTRENcIiwgY29pbilcbn1cblxuLyogY29tcGFyZUN1cnJlbmN5UGFpclxuICogZGVzYzogQ29tcGFyZXMgYSBjdXJyZW5jeSBwYWlyIGJldHdlZW4gUG9sb25pZXggYW5kIENvaW5iYXNlLiAgTm90aWZpZXMgd2hlbiBzaWduaWZpY2FudCBhcmJpdHJhZ2Ugb3Bwb3J0dW5pdGllc1xuICogICAgICAgb2NjdXIuXG4gKi9cbmZ1bmN0aW9uIGNvbXBhcmVDdXJyZW5jeVBhaXIodGltZVN0YW1wOiBEYXRlLCBwb2xvSlNPTjogYW55LCBjYkpTT046IGFueSwgY2N5MTogc3RyaW5nLCBjY3kyOiBzdHJpbmcpIHtcbiAgbGV0IHBvbG9QYWlyID0gY2N5MStcIl9cIitjY3kyO1xuICBsZXQgcG9sb0J1eUF0ID0gK3BvbG9KU09OW3BvbG9QYWlyXS5sb3dlc3RBc2s7XG4gIGxldCBwb2xvU2VsbEF0ID0gK3BvbG9KU09OW3BvbG9QYWlyXS5oaWdoZXN0QmlkO1xuICBsZXQgY29pbmJhc2VTZWxsQXQgPSArY2JKU09OLmJpZHNbMF1bMF07XG4gIGxldCBjb2luYmFzZUJ1eUF0ID0gK2NiSlNPTi5hc2tzWzBdWzBdO1xuICBvdXRwdXRBcmJSZXN1bHRzKHBvbG9CdXlBdCwgcG9sb1NlbGxBdCwgXCJQb2xvbmlleFwiLCBjb2luYmFzZVNlbGxBdCwgY29pbmJhc2VCdXlBdCwgXCJDb2luYmFzZVwiLCBwb2xvUGFpciwgdGltZVN0YW1wKTtcbiB9XG5cbiAvKiBjb21wYXJlQWxsUG9sb25pZXhCaXR0cmV4XG4gICogZGVzYzogVGFrZXMgdGhlIHBvbG9uaWV4IGFuZCBiaXR0cmV4IGRhdGEgaW4gSlNPTiBmb3JtYXQgYW5kIGNvbXBhcmVzIGFsbCBvdmVybGFwaW5nIG1hcmtldHMgZm9yIGFyYml0cmFnZS5cbiAgKiAgICAgICBFeHBvcnRlZCBmdW5jdGlvbiBjYWxsZWQgYnkgdGhlIG1haW4gYXBwLmpzXG4gICovXG5mdW5jdGlvbiBjb21wYXJlQWxsUG9sb25pZXhCaXR0cmV4KHBvbG9KU09OOiBhbnksIGJpdHRyZXhKU09OOiBhbnkpIHtcblxuICBsZXQgcmVwb3J0aW5nVGltZXN0YW1wID0gbmV3IERhdGUoKTtcbiAgbGV0IHBvbG9BbGxNYXJrZXRzID0gSlNPTi5wYXJzZShwb2xvSlNPTi5leGNoYW5nZURhdGEpO1xuICBmb3IobGV0IGJpdHRyZXhNa3QgaW4gYml0dHJleEpTT04uZXhjaGFuZ2VEYXRhKXtcbiAgICBsZXQgcG9sb01rdE5hbWUgPSBwb2xvTWt0RnJvbUJpdHRyZXhOYW1lKGJpdHRyZXhNa3QpO1xuICAgIGxldCBwb2xvTWt0RWxlbWVudCA9IHBvbG9BbGxNYXJrZXRzW3BvbG9Na3ROYW1lXTtcbiAgICBpZighcG9sb01rdEVsZW1lbnQpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiUG9sbyBtYXJrZXQgZm9yIFwiLCBiaXR0cmV4TWt0LCBcIiBkb2Vzbid0IGV4aXN0LlwiKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjb21wYXJlUG9sb25pZXhCaXR0cmV4TWt0RWxlbWVudChwb2xvTWt0RWxlbWVudCwgYml0dHJleEpTT04uZXhjaGFuZ2VEYXRhW2JpdHRyZXhNa3RdLCBwb2xvTWt0TmFtZSwgcmVwb3J0aW5nVGltZXN0YW1wKVxuICAgIH1cbiAgfVxufVxuXG4vKiBjb21wYXJlUG9sb25pZXhCaXR0cmV4TWt0RWxlbWVudFxuICogZGVzYzogQ29tcGFyZXMgYSBwYXJ0aWN1bGFyIG1hcmtldCBiZXR3ZWVuIHRoZSBQb2xvbmlleCBhbmQgQml0dHJleCBleGNoYW5nZXMuICBTZWRuIG5vdGlmaWNhdGlvbnMgd2hlblxuICogICAgICAgc2lnbmlmaWNhbnQgYXJiaXRyYWdlIG9wcG9ydHVuaXRpZXMgZXhpc3QuXG4gKi9cbmZ1bmN0aW9uIGNvbXBhcmVQb2xvbmlleEJpdHRyZXhNa3RFbGVtZW50KHBvbG9KU09OOiBhbnksIGJpdHRyZXhKU09OOiBhbnksIHBvbG9QYWlyOiBzdHJpbmcsIHRpbWVTdGFtcDogRGF0ZSkge1xuXG4gIGxldCBwb2xvQnV5QXQgPSArcG9sb0pTT04ubG93ZXN0QXNrO1xuICBsZXQgcG9sb1NlbGxBdCA9ICtwb2xvSlNPTi5oaWdoZXN0QmlkO1xuICBsZXQgYml0dHJleFNlbGxBdCA9ICtiaXR0cmV4SlNPTi5CaWQ7XG4gIGxldCBiaXR0cmV4QnV5QXQgPSArYml0dHJleEpTT04uQXNrO1xuICBvdXRwdXRBcmJSZXN1bHRzKHBvbG9CdXlBdCwgcG9sb1NlbGxBdCwgXCJQb2xvbmlleFwiLCBiaXR0cmV4U2VsbEF0LCBiaXR0cmV4QnV5QXQsIFwiQml0dHJleFwiLCBwb2xvUGFpciwgdGltZVN0YW1wKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gb3V0cHV0QXJiUmVzdWx0cyhleGNoMUJ1eUF0OiBudW1iZXIsIGV4Y2gxU2VsbEF0OiBudW1iZXIsIGV4Y2gxTmFtZTogc3RyaW5nLCBcbiAgZXhjaDJTZWxsQXQ6IG51bWJlciwgZXhjaDJCdXlBdDogbnVtYmVyLCBleGNoMk5hbWU6IHN0cmluZywgXG4gIGNjeVBhaXI6IHN0cmluZywgdGltZVN0YW1wOiBEYXRlKSB7XG5cbiAgbGV0IGRiT3V0cHV0ID0ge1xuICAgIGtleTogXCJcIixcbiAgICBleGNoMU5hbWUsXG4gICAgZXhjaDJOYW1lLFxuICAgIHRpbWVTdGFtcDogdGltZVN0YW1wLnRvU3RyaW5nKCkuc2xpY2UoMCwyNSksXG4gICAgY2N5UGFpcixcbiAgICBleGNoMUJ1eUF0LFxuICAgIGV4Y2gxU2VsbEF0LFxuICAgIGV4Y2gyQnV5QXQsXG4gICAgZXhjaDJTZWxsQXQsXG4gICAgZ2Fpbkxvc3M6IFwiTE9TU1wiLFxuICAgIHVyZ2VudFRyYWRlOiBmYWxzZSxcbiAgICBhcmJQZXJjZW50OiAwLFxuICAgIGV4Y2gxQnV5T3JTZWxsOiBcIlwiLFxuICAgIHRyYWRlSW5zdHJ1Y3Rpb25zOiBcIlwiLFxuICAgIHRpbWU6IE1hdGgucm91bmQobmV3IERhdGUoKS5nZXRUaW1lKCkvMTAwMClcbiAgfTtcbiAvLyBDaGVjayBmb3IgY2FzZSBvZiBCdXkgYXQgRXhjaGFuZ2UyIGFuZCBTZWxsIGF0IEV4Y2hhbmdlMVxuICBsZXQgYXJiT3Bwb3J0dW5pdHkgPSBleGNoMVNlbGxBdC1leGNoMkJ1eUF0O1xuICBsZXQgYXJiUGVyY2VudCA9IDEwMCooZXhjaDFTZWxsQXQtZXhjaDJCdXlBdCkvKCAoZXhjaDFTZWxsQXQrZXhjaDJCdXlBdCkgLyAyKTtcbiAgZGJPdXRwdXQuYXJiUGVyY2VudCA9IGFyYlBlcmNlbnQ7XG4gIGRiT3V0cHV0LmV4Y2gxQnV5T3JTZWxsID0gXCJTZWxsXCI7XG4gIGlmKGFyYlBlcmNlbnQgPiBhcmJSZXBvcnRpbmdUaHJlc2hvbGRQZXJjZW50KSB7XG4gICAgZGJPdXRwdXQuZ2Fpbkxvc3MgPSBcIkdBSU5cIjtcbiAgICBkYk91dHB1dC50cmFkZUluc3RydWN0aW9ucyA9IGAke2NjeVBhaXJ9IEJVWSBhdCAke2V4Y2gyTmFtZX0gZm9yICR7ZXhjaDJCdXlBdC50b0ZpeGVkKDkpfS4gU0VMTCBhdCAke2V4Y2gxTmFtZX0gZm9yICR7ZXhjaDFTZWxsQXQudG9GaXhlZCg5KX0gR2FpbiAke2FyYlBlcmNlbnQudG9GaXhlZCg2KX0lYDtcbiAgICBjb25zb2xlLmxvZyhkYk91dHB1dC5nYWluTG9zcywgXCI6IFwiLCBkYk91dHB1dC50cmFkZUluc3RydWN0aW9ucyk7XG4gICAgaWYgKGFyYlBlcmNlbnQgPiBhcmJFbWFpbFRocmVzaG9sZFBlcmNlbnQpIHtcbiAgICAgIGRiT3V0cHV0LnVyZ2VudFRyYWRlID0gdHJ1ZTtcbiAgICAgIFNlbmRNZXNzYWdlKGAke2NjeVBhaXJ9OiBCVVkgYXQgJHtleGNoMk5hbWV9IGFuZCBTRUxMIGF0ICR7ZXhjaDFOYW1lfWAsIGRiT3V0cHV0LnRyYWRlSW5zdHJ1Y3Rpb25zKTtcbiAgICB9XG4gIH1cbiAgZWxzZSB7IFxuICAgIGRiT3V0cHV0LmdhaW5Mb3NzID0gXCJMT1NTXCI7XG4gICAgZGJPdXRwdXQudXJnZW50VHJhZGUgPSBmYWxzZTtcbiAgICBkYk91dHB1dC50cmFkZUluc3RydWN0aW9ucyA9IGAke2NjeVBhaXJ9IEJVWSBhdCAke2V4Y2gyTmFtZX0gZm9yICR7ZXhjaDJCdXlBdC50b0ZpeGVkKDkpfS4gU0VMTCBhdCAke2V4Y2gxTmFtZX0gZm9yICR7ZXhjaDFTZWxsQXQudG9GaXhlZCg5KX0gTG9zcyAke2FyYlBlcmNlbnQudG9GaXhlZCg2KX0lYDtcbiAgICBpZiAocmVwb3J0TG9zZXMpIHtcbiAgICAgIGNvbnNvbGUubG9nKGAke2Zvcm1hdFRpbWVzdGFtcCh0aW1lU3RhbXApfTogUGFpcjogJHtjY3lQYWlyfSwgUmVzdWx0OiBMT1NTLCBEZXNjOiAke2V4Y2gyTmFtZX0sICR7ZXhjaDJCdXlBdC50b0ZpeGVkKDgpfSBpcyBncmVhdGVyIHRoYW4gU2VsbEF0LCAke2V4Y2gxU2VsbEF0LnRvRml4ZWQoOCl9LCBESUZGLCAke2FyYk9wcG9ydHVuaXR5LnRvRml4ZWQoNil9YCk7XG4gICAgfVxuICB9XG4gIGxldCBrZXlTdHIgPSBcIkJ1eVwiK2V4Y2gyTmFtZStcIlNlbGxcIitleGNoMU5hbWUrY2N5UGFpcjtcbiAgbGV0IGtleSA9IHtcbiAgICBcImtleVwiOiBrZXlTdHJcbiAgfTtcbiAgZGJPdXRwdXQua2V5ID0ga2V5U3RyO1xuICBpZiAoZGJXcml0ZUVuYWJsZWQpIHtcbiAgICBhd2FpdCB1cGRhdGVSZXN1bHRzSW5Nb25nbyhrZXksIGRiT3V0cHV0LCBtb25nb0RCTmFtZSwgbW9uZ29EQkNvbGxlY3Rpb24pO1xuICAgIGlmIChkYk91dHB1dC51cmdlbnRUcmFkZSkge1xuICAgICAgZGJPdXRwdXQua2V5ICs9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgYXdhaXQgd3JpdGVSZXN1bHRzVG9Nb25nb1N5bmMoZGJPdXRwdXQsIG1vbmdvREJOYW1lLCBtb25nb0RCQ29sbGVjdGlvbkhpc3QpO1xuICAgIH1cbiAgfVxuICAvLyBDaGVjayBmb3IgY2FzZSBvZiBCdXkgYXQgRXhjaGFuZ2UxIGFuZCBTZWxsIGF0IEV4Y2hhbmdlMlxuICBhcmJPcHBvcnR1bml0eSA9IGV4Y2gyU2VsbEF0LWV4Y2gxQnV5QXQ7XG4gIGFyYlBlcmNlbnQgPSAxMDAqKGV4Y2gyU2VsbEF0LWV4Y2gxQnV5QXQpLyggKGV4Y2gyU2VsbEF0K2V4Y2gxQnV5QXQpIC8gMik7XG4gIGRiT3V0cHV0LmFyYlBlcmNlbnQgPSBhcmJQZXJjZW50O1xuICBkYk91dHB1dC5leGNoMUJ1eU9yU2VsbCA9IFwiQnV5XCI7XG4gIGlmKGFyYlBlcmNlbnQgPiBhcmJSZXBvcnRpbmdUaHJlc2hvbGRQZXJjZW50KSB7ICAgIFxuICAgIGRiT3V0cHV0LmdhaW5Mb3NzID0gXCJHQUlOXCI7XG4gICAgZGJPdXRwdXQudHJhZGVJbnN0cnVjdGlvbnMgPSBgJHtjY3lQYWlyfSBCVVkgYXQgJHtleGNoMU5hbWV9IGZvciAke2V4Y2gxQnV5QXQudG9GaXhlZCg5KX0uIFNFTEwgJHtleGNoMk5hbWV9IGZvciAke2V4Y2gyU2VsbEF0LnRvRml4ZWQoOSl9IEdhaW4gJHthcmJQZXJjZW50LnRvRml4ZWQoNil9JWA7XG4gICAgY29uc29sZS5sb2coZGJPdXRwdXQuZ2Fpbkxvc3MsIFwiOiBcIiwgZGJPdXRwdXQudHJhZGVJbnN0cnVjdGlvbnMpO1xuICAgIC8vIEV4cGVyaW1lbnRhbCBjb2RlXG4gICAgaWYob3JkZXJCb29rT24pIHtcbiAgICAgIGF3YWl0IG91dHB1dE9yZGVyQm9vayhleGNoMU5hbWUsIGNjeVBhaXIsIFwiYnV5XCIpO1xuICAgICAgYXdhaXQgb3V0cHV0T3JkZXJCb29rKGV4Y2gyTmFtZSwgY2N5UGFpciwgXCJzZWxsXCIpO1xuICAgIH1cbiAgICBpZiAoYXJiUGVyY2VudCA+IGFyYkVtYWlsVGhyZXNob2xkUGVyY2VudCkge1xuICAgICAgZGJPdXRwdXQudXJnZW50VHJhZGUgPSB0cnVlO1xuICAgICAgU2VuZE1lc3NhZ2UoYCR7Y2N5UGFpcn06IEJVWSBhdCAke2V4Y2gxTmFtZX0gYW5kIFNFTEwgYXQgJHtleGNoMk5hbWV9YCwgZGJPdXRwdXQudHJhZGVJbnN0cnVjdGlvbnMpO1xuICAgIH1cbiAgfVxuICBlbHNlIHtcbiAgICBkYk91dHB1dC5nYWluTG9zcyA9IFwiTE9TU1wiO1xuICAgIGRiT3V0cHV0LnVyZ2VudFRyYWRlID0gZmFsc2U7XG4gICAgZGJPdXRwdXQudHJhZGVJbnN0cnVjdGlvbnMgPSBgJHtjY3lQYWlyfSBCVVkgYXQgJHtleGNoMU5hbWV9IGZvciAke2V4Y2gxQnV5QXQudG9GaXhlZCg5KX0gU0VMTCAke2V4Y2gyTmFtZX0gZm9yICR7ZXhjaDJTZWxsQXQudG9GaXhlZCg5KX0gTG9zcyAke2FyYlBlcmNlbnQudG9GaXhlZCg2KX0lYDtcbiAgICBpZiAocmVwb3J0TG9zZXMpIHtcbiAgICAgIGNvbnNvbGUubG9nKGAke2Zvcm1hdFRpbWVzdGFtcCh0aW1lU3RhbXApfTogUGFpcjogJHtjY3lQYWlyfSwgUmVzdWx0OiBMT1NTLCBEZXNjOiBCdXlBdCwgJHtleGNoMUJ1eUF0LnRvRml4ZWQoOSl9IGlzIGdyZWF0ZXIgdGhhbiAke2V4Y2gyTmFtZX1TZWxsQXQsICR7ZXhjaDJTZWxsQXQudG9GaXhlZCg4KX0uIERJRkYsICR7YXJiT3Bwb3J0dW5pdHkudG9GaXhlZCg3KX1gKTtcbiAgICB9XG4gIH1cbiAga2V5U3RyID0gXCJCdXlcIitleGNoMU5hbWUrXCJTZWxsXCIrZXhjaDJOYW1lK2NjeVBhaXI7XG4gIGtleSA9IHtcbiAgICBcImtleVwiOiBrZXlTdHJcbiAgfTtcbiAgZGJPdXRwdXQua2V5ID0ga2V5U3RyO1xuICBpZiAoZGJXcml0ZUVuYWJsZWQpIHtcbiAgICBhd2FpdCB1cGRhdGVSZXN1bHRzSW5Nb25nbyhrZXksIGRiT3V0cHV0LCBtb25nb0RCTmFtZSwgbW9uZ29EQkNvbGxlY3Rpb24pO1xuICAgIGlmIChkYk91dHB1dC51cmdlbnRUcmFkZSkge1xuICAgICAgZGJPdXRwdXQua2V5ICs9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgYXdhaXQgd3JpdGVSZXN1bHRzVG9Nb25nb1N5bmMoZGJPdXRwdXQsIG1vbmdvREJOYW1lLCBtb25nb0RCQ29sbGVjdGlvbkhpc3QpO1xuICAgIH1cbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBvdXRwdXRPcmRlckJvb2soZXhjaGFuZ2VOYW1lOiBzdHJpbmcsIGNjeVBhaXI6IHN0cmluZywgZXhjaDFCdXlPclNlbGw6IHN0cmluZykge1xuXG4gIGlmIChleGNoYW5nZU5hbWU9PT1cIlBvbG9uaWV4XCIpIHtcbiAgICBjb25zdCBvcmRlckJvb2sgPSBhd2FpdCBnZXRFeGNoYW5nZU1rdERlcHRoKFwicG9sb25pZXhcIiwgY2N5UGFpcik7XG4gICAgbGV0IGV4Y2hhbmdlRGF0YSA9IEpTT04ucGFyc2Uob3JkZXJCb29rLmV4Y2hhbmdlRGF0YSk7XG4gICAgbGV0IG1rdFNpZGUgPSAoZXhjaDFCdXlPclNlbGw9PT1cImJ1eVwiKSA/IFwiYXNrc1wiOiBcImJpZHNcIjtcbiAgICBsZXQgb3JkZXJzOiBBcnJheTxhbnk+ID0gZXhjaGFuZ2VEYXRhW21rdFNpZGVdO1xuICAgIG9yZGVycy5mb3JFYWNoKCh2YWx1ZSkgPT4ge1xuICAgICAgY29uc29sZS5sb2coYCR7ZXhjaGFuZ2VOYW1lfSAke2NjeVBhaXJ9IHByaWNlOiAke3ZhbHVlWzBdfSBzaXplOiAke3ZhbHVlWzFdfWApO1xuICAgIH0pO1xuICAgIGNvbnNvbGUubG9nKGBwb2xvbmlleDogJHtjY3lQYWlyfSAke2V4Y2hhbmdlRGF0YVtcImFza3NcIl19YCk7XG4gIH1cbiAgZWxzZSBpZiAoZXhjaGFuZ2VOYW1lPT09XCJCaXR0cmV4XCIpe1xuICAgIGNvbnN0IG9yZGVyQm9vayA9IGF3YWl0IGdldEV4Y2hhbmdlTWt0RGVwdGgoXCJiaXR0cmV4XCIsIGJpdHRyZXhNa3RGcm9tUG9sb05hbWUoY2N5UGFpcikpO1xuICAgIGxldCBleGNoYW5nZURhdGEgPSBKU09OLnBhcnNlKG9yZGVyQm9vay5leGNoYW5nZURhdGEpO1xuICAgIGxldCBta3RTaWRlID0gKGV4Y2gxQnV5T3JTZWxsPT09XCJidXlcIikgPyBcInNlbGxcIjogXCJidXlcIjtcbiAgICBsZXQgb3JkZXJzOiBBcnJheTxhbnk+ID0gZXhjaGFuZ2VEYXRhW1wicmVzdWx0XCJdW21rdFNpZGVdO1xuICAgIG9yZGVycy5mb3JFYWNoKCh2YWx1ZSwgaWR4KSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhgYml0dHJleDogJHtjY3lQYWlyfSAke3ZhbHVlLlJhdGV9ICR7dmFsdWUuUXVhbnRpdHl9YCk7XG4gICAgfSk7XG4gIH1cbn1cblxuLyogcG9sb01rdEZyb21CaXR0cmV4TmFtZVxuICogZGVzYzogQ29udmVydHMgYSBCaXR0cmV4IGNyeXB0byBjdXJyZW5jeSBwYWlyIGludG8gdGhlIFBvbG9uaWV4IHBhaXIuXG4gKi9cbmZ1bmN0aW9uIHBvbG9Na3RGcm9tQml0dHJleE5hbWUoYml0dHJleE1rdE5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmKGJpdHRyZXhNa3ROYW1lPT09XCJCVEMtWExNXCIpXG4gICAgcmV0dXJuKFwiQlRDX1NUUlwiKTtcbiAgaWYoYml0dHJleE1rdE5hbWU9PT1cIlVTRFQtWExNXCIpXG4gICAgcmV0dXJuKFwiVVNEVF9TVFJcIik7ICAgIFxuICByZXR1cm4oYml0dHJleE1rdE5hbWUucmVwbGFjZShcIi1cIiwgXCJfXCIpKTtcbn1cblxuXG4vKiBiaXR0cmV4TWt0RnJvbVBvbG9OYW1lXG4gKiBkZXNjOiBDb252ZXJ0cyBhIEJpdHRyZXggY3J5cHRvIGN1cnJlbmN5IHBhaXIgaW50byB0aGUgUG9sb25pZXggcGFpci5cbiAqL1xuZnVuY3Rpb24gYml0dHJleE1rdEZyb21Qb2xvTmFtZShwb2xvTWt0TmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYocG9sb01rdE5hbWU9PT1cIkJUQ19TVFJcIilcbiAgICByZXR1cm4oXCJCVEMtWExNXCIpO1xuICBpZihwb2xvTWt0TmFtZT09PVwiVVNEVF9TVFJcIilcbiAgICByZXR1cm4oXCJVU0RULVhMTVwiKTsgICAgXG4gIHJldHVybihwb2xvTWt0TmFtZS5yZXBsYWNlKFwiX1wiLFwiLVwiKSk7XG59XG5cbi8qIGNvbXBhcmVBbGxQb2xvbmlleEhpdGJ0Y1xuKiAgZGVzYzogVGFrZXMgdGhlIHBvbG9uaWV4IGFuZCBoaXRidGMgZGF0YSBpbiBKU09OIGZvcm1hdCBhbmQgY29tcGFyZXMgYWxsIG92ZXJsYXBpbmcgbWFya2V0cyBmb3IgYXJiaXRyYWdlLlxuKiAgICAgICBFeHBvcnRlZCBmdW5jdGlvbiBjYWxsZWQgYnkgdGhlIG1haW4gYXBwLmpzXG4qL1xuZnVuY3Rpb24gY29tcGFyZUFsbFBvbG9uaWV4SGl0YnRjKHBvbG9KU09OOiBhbnksIGhpdGJ0Y0pTT046IGFueSkge1xuICBcbiAgbGV0IHJlcG9ydGluZ1RpbWVzdGFtcCA9IG5ldyBEYXRlKCk7XG4gIGxldCBwb2xvQWxsTWFya2V0cyA9IEpTT04ucGFyc2UocG9sb0pTT04uZXhjaGFuZ2VEYXRhKTtcbiAgZm9yKGxldCBoaXRidGNNa3QgaW4gaGl0YnRjSlNPTi5leGNoYW5nZURhdGEpe1xuICAgIGxldCBwb2xvTWt0TmFtZSA9IHBvbG9Na3RGcm9tSGl0YnRjTmFtZShoaXRidGNNa3QpO1xuICAgIGxldCBwb2xvTWt0RWxlbWVudCA9IHBvbG9BbGxNYXJrZXRzW3BvbG9Na3ROYW1lXTtcbiAgICBjb21wYXJlUG9sb25pZXhIaXRidGNNa3RFbGVtZW50KHBvbG9Na3RFbGVtZW50LCBoaXRidGNKU09OLmV4Y2hhbmdlRGF0YVtoaXRidGNNa3RdLCBwb2xvTWt0TmFtZSwgcmVwb3J0aW5nVGltZXN0YW1wKTtcbiAgfVxufVxuXG4vKiBjb21wYXJlUG9sb25pZXhIaXRidGNNa3RFbGVtZW50XG4gKiBkZXNjOiBQdWxscyBvdXQgdGhlIGJ1eSBhbmQgc2VsbCBwcmljZXMgZm9yIGEgc2luZ2xlIGN1cnJlbmN5IHBhaXIgZm9yIFBvbG9uaWV4IGFuZCBIaXRidGMuXG4gKiAgICAgICBGb3J3YXJkcyB0aGlzIHRvIHRoZSBvdXRwdXQgbWV0aG9kIHRvIHJlY29yZCB0aGUgYXJiaXRyYWdlIHJlc3VsdHMuXG4gKi9cbmZ1bmN0aW9uIGNvbXBhcmVQb2xvbmlleEhpdGJ0Y01rdEVsZW1lbnQocG9sb01rdEVsZW1lbnQ6IGFueSwgaGl0YnRjTWt0RWxlbWVudDogYW55LCBwb2xvTWt0TmFtZTogc3RyaW5nLCByZXBvcnRpbmdUaW1lc3RhbXA6IERhdGUpIHtcblxuICBsZXQgcG9sb0J1eUF0ID0gK3BvbG9Na3RFbGVtZW50Lmxvd2VzdEFzaztcbiAgbGV0IHBvbG9TZWxsQXQgPSArcG9sb01rdEVsZW1lbnQuaGlnaGVzdEJpZDtcbiAgbGV0IGhpdGJ0Y1NlbGxBdCA9ICtoaXRidGNNa3RFbGVtZW50LmJpZDtcbiAgbGV0IGhpdGJ0Y0J1eUF0ID0gK2hpdGJ0Y01rdEVsZW1lbnQuYXNrO1xuICBpZiAoIWhpdGJ0Y1NlbGxBdCB8fCAhaGl0YnRjQnV5QXQpIHtcbiAgICBjb25zb2xlLmxvZyhcIkdvdCBiYWQgcmF0ZXMgZnJvbSB0aGUgaGl0YnRjIGZvcjpcIiwgcG9sb01rdE5hbWUpO1xuICAgIHJldHVybjtcbiAgfVxuICBvdXRwdXRBcmJSZXN1bHRzKHBvbG9CdXlBdCwgcG9sb1NlbGxBdCwgXCJQb2xvbmlleFwiLCBoaXRidGNTZWxsQXQsIGhpdGJ0Y0J1eUF0LCBcIkhpdGJ0Y1wiLCBwb2xvTWt0TmFtZSwgcmVwb3J0aW5nVGltZXN0YW1wKTtcbn1cblxuLyogcG9sb01rdEZyb21IaXRidGNOYW1lXG4gKiBkZXNjOiBNYXBzIGZyb20gSGl0YnRjIHRpY2tlcnMgdG8gUG9sb25pZXggdGlja2Vycy5cbiAqL1xuZnVuY3Rpb24gcG9sb01rdEZyb21IaXRidGNOYW1lKGhpdGJ0Y01rdE5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG5cbiAgY29uc3QgcG9sb01rdE5hbWVzOiBhbnkgPSB7XG4gICAgQkNOQlRDOiAgIFwiQlRDX0JDTlwiLFxuICAgIERBU0hCVEM6ICAgXCJCVENfREFTSFwiLFxuICAgIERPR0VCVEM6ICAgXCJCVENfRE9HRVwiLFxuICAgIEVUSEJUQzogICBcIkJUQ19FVEhcIixcbiAgICBMU0tCVEM6ICAgXCJCVENfTFNLXCIsXG4gICAgTFRDQlRDOiAgIFwiQlRDX0xUQ1wiLFxuICAgIE5YVEJUQzogICBcIkJUQ19OWFRcIixcbiAgICBTQkRCVEM6ICAgXCJCVENfU0JEXCIsXG4gICAgU0NCVEM6ICAgXCJCVENfU0NcIixcbiAgICBTVEVFTUJUQzogICBcIkJUQ19TVEVFTVwiLFxuICAgIFhFTUJUQzogICBcIkJUQ19YRU1cIixcbiAgICBYTVJCVEM6ICAgXCJCVENfWE1SXCIsXG4gICAgQVJEUkJUQzogICBcIkJUQ19BUkRSXCIsXG4gICAgWkVDQlRDOiAgIFwiQlRDX1pFQ1wiLFxuICAgIE1BSURCVEM6ICAgXCJCVENfTUFJRFwiLFxuICAgIFJFUEJUQzogICBcIkJUQ19SRVBcIixcbiAgICBFVENCVEM6ICAgXCJCVENfRVRDXCIsXG4gICAgQk5UQlRDOiAgIFwiQlRDX0JOVFwiLFxuICAgIFNOVEVUSDogICBcIkVUSF9TTlRcIixcbiAgICBPTUdFVEg6ICAgXCJFVEhfT01HXCIsXG4gICAgRVRDRVRIOiAgIFwiRVRIX0VUQ1wiLFxuICAgIFpFQ0VUSDogICBcIkVUSF9aRUNcIixcbiAgICBYUlBCVEM6ICAgXCJCVENfWFJQXCIsXG4gICAgU1RSQVRCVEM6ICAgXCJCVENfU1RSQVRcIixcbiAgICBFT1NFVEg6ICAgXCJFVEhfRU9TXCIsXG4gICAgRU9TQlRDOiAgIFwiQlRDX0VPU1wiLFxuICAgIEJOVEVUSDogICBcIkVUSF9CTlRcIixcbiAgICBaUlhCVEM6ICAgXCJCVENfWlJYXCIsXG4gICAgWlJYRVRIOiAgIFwiRVRIX1pSWFwiLFxuICAgIFBQQ0JUQzogICBcIkJUQ19QUENcIixcbiAgICBRVFVNRVRIOiAgIFwiRVRIX1FUVU1cIixcbiAgICBER0JCVEM6ICAgXCJCVENfREdCXCIsXG4gICAgT01HQlRDOiAgIFwiQlRDX09NR1wiLFxuICAgIFNOVEJUQzogICBcIkJUQ19TTlRcIixcbiAgICBYUlBVU0RUOiAgIFwiVVNEVF9YUlBcIixcbiAgICBNQU5BRVRIOiAgIFwiRVRIX01BTkFcIixcbiAgICBNQU5BQlRDOiAgIFwiQlRDX01BTkFcIixcbiAgICBRVFVNQlRDOiAgIFwiQlRDX1FUVU1cIixcbiAgICBMU0tFVEg6ICAgXCJFVEhfTFNLXCIsXG4gICAgUkVQRVRIOiAgIFwiRVRIX1JFUFwiLFxuICAgIFJFUFVTRFQ6ICAgXCJVU0RUX1JFUFwiLFxuICAgIEdOVEJUQzogICBcIkJUQ19HTlRcIixcbiAgICBHTlRFVEg6ICAgXCJFVEhfR05UXCIsXG4gICAgQlRTQlRDOiAgIFwiQlRDX0JUU1wiLFxuICAgIEJBVEJUQzogICBcIkJUQ19CQVRcIixcbiAgICBCQVRFVEg6ICAgXCJFVEhfQkFUXCIsXG4gICAgQkNIQUJDQlRDOiAgIFwiQlRDX0JDSEFCQ1wiLFxuICAgIEJDSFNWQlRDOiAgIFwiQlRDX0JDSFNWXCIsXG4gICAgTk1SQlRDOiAgIFwiQlRDX05NUlwiLFxuICAgIFBPTFlCVEM6ICAgXCJCVENfUE9MWVwiLFxuICAgIFNUT1JKQlRDOiAgIFwiQlRDX1NUT1JKXCJcbiAgfTtcbiAgcmV0dXJuKHBvbG9Na3ROYW1lc1toaXRidGNNa3ROYW1lXSk7XG59XG5cbi8qIGNvbXBhcmVBbGxCaXR0cmV4SGl0YnRjXG4qICBkZXNjOiBUYWtlcyB0aGUgYml0dHJleCBhbmQgaGl0YnRjIGRhdGEgaW4gSlNPTiBmb3JtYXQgYW5kIGNvbXBhcmVzIGFsbCBvdmVybGFwaW5nIG1hcmtldHMgZm9yIGFyYml0cmFnZS5cbiogICAgICAgRXhwb3J0ZWQgZnVuY3Rpb24gY2FsbGVkIGJ5IHRoZSBtYWluIGFwcC5qc1xuKi9cbmZ1bmN0aW9uIGNvbXBhcmVBbGxCaXR0cmV4SGl0YnRjKGJpdHRyZXhKU09OOiBhbnksIGhpdGJ0Y0pTT046IGFueSkge1xuICBcbiAgbGV0IHJlcG9ydGluZ1RpbWVzdGFtcCA9IG5ldyBEYXRlKCk7XG4gIGxldCBiaXR0cmV4VGltZXN0YW1wID0gYml0dHJleEpTT04udGltZVN0YW1wO1xuICBsZXQgYml0dHJleEFsbE1hcmtldHMgPSBKU09OLnBhcnNlKGJpdHRyZXhKU09OLmV4Y2hhbmdlRGF0YSkucmVzdWx0O1xuICBsZXQgaGl0YnRjVGltZXN0YW1wID0gaGl0YnRjSlNPTi50aW1lU3RhbXA7XG4gIGxldCBoaXRidGNBbGxNYXJrZXRzID0gSlNPTi5wYXJzZShoaXRidGNKU09OLmV4Y2hhbmdlRGF0YSk7XG4gIGNvbnNvbGUubG9nKFwiSW4gY29tcGFyZUFsbEJpdHRyZXhIaXRidGNcIik7XG4gIGNvbnNvbGUubG9nKGJpdHRyZXhUaW1lc3RhbXApO1xuICBjb25zb2xlLmxvZyhoaXRidGNUaW1lc3RhbXApO1xuICBiaXR0cmV4QWxsTWFya2V0cy5mb3JFYWNoKCAoYml0dHJleE1rdEVsZW06IGFueSkgPT4ge1xuICAgIGxldCBoaXRidGNNa3ROYW1lID0gaGl0QnRjTWt0RnJvbUJpdHRyZXhOYW1lKGJpdHRyZXhNa3RFbGVtLk1hcmtldE5hbWUpO1xuICAgIGxldCBoaXRidGNNa3QgPSBoaXRidGNBbGxNYXJrZXRzLmZpbHRlcigoaXRlbTogYW55KSA9PiB7XG4gICAgICByZXR1cm4oaXRlbS5zeW1ib2w9PT1oaXRidGNNa3ROYW1lKTtcbiAgICB9KTtcbiAgICBpZihoaXRidGNNa3QubGVuZ3RoIT0wKSB7XG4gICAgICBsZXQgYmFkTWFrZXJ0cyA9IFtcIkJUQy1CQ0hcIiwgXCJFVEgtQkNIXCIsIFwiVVNELUJDSFwiLCBcIkJUQy1CSVRTXCIsIFwiQlRDLVhETlwiLCBcIkJUQy1TV1RcIl07XG4gICAgICAgIC8vIGxldCBiYWRNYWtlcnRzID0gW1wiQlRDLUJDSFwiLCBcIkVUSC1CQ0hcIiwgXCJVU0QtQkNIXCIsIFwiQlRDLUJJVFNcIiwgXCJCVEMtU1BDXCIsIFwiQlRDLVNXVFwiLCBcIkJUQy1DTUNUXCIsXG4gICAgICAgIC8vIFwiQlRDLU5MQzJcIiwgXCJCVEMtV0FWRVNcIl07XG4gICAgICBpZiAoIWJhZE1ha2VydHMuaW5jbHVkZXMoYml0dHJleE1rdEVsZW0uTWFya2V0TmFtZSkpIHtcbiAgICAgICAgY29tcGFyZUJpdHRyZXhIaXRidGNNa3RFbGVtZW50KGJpdHRyZXhNa3RFbGVtLCBoaXRidGNNa3RbMF0sIGJpdHRyZXhNa3RFbGVtLk1hcmtldE5hbWUsIG5ldyBEYXRlKCkpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG59XG5cbi8qIGNvbXBhcmVCaXR0cmV4SGl0YnRjTWt0RWxlbWVudFxuICogZGVzYzogUHVsbHMgb3V0IHRoZSBidXkgYW5kIHNlbGwgcHJpY2VzIGZvciBhIHNpbmdsZSBjdXJyZW5jeSBwYWlyIGZvciBQb2xvbmlleCBhbmQgSGl0YnRjLlxuICogICAgICAgRm9yd2FyZHMgdGhpcyB0byB0aGUgb3V0cHV0IG1ldGhvZCB0byByZWNvcmQgdGhlIGFyYml0cmFnZSByZXN1bHRzLlxuICovXG5mdW5jdGlvbiBjb21wYXJlQml0dHJleEhpdGJ0Y01rdEVsZW1lbnQoYml0dHJleE1rdEVsZW1lbnQ6IGFueSwgaGl0YnRjTWt0RWxlbWVudDogYW55LCBiaXR0cmV4TWt0TmFtZTogc3RyaW5nLCByZXBvcnRpbmdUaW1lc3RhbXA6IERhdGUpIHtcblxuICBsZXQgYml0dHJleEJ1eUF0ID0gK2JpdHRyZXhNa3RFbGVtZW50LkFzaztcbiAgbGV0IGJpdHRyZXhTZWxsQXQgPSArYml0dHJleE1rdEVsZW1lbnQuQmlkO1xuICBsZXQgaGl0YnRjU2VsbEF0ID0gK2hpdGJ0Y01rdEVsZW1lbnQuYmlkO1xuICBsZXQgaGl0YnRjQnV5QXQgPSAraGl0YnRjTWt0RWxlbWVudC5hc2s7XG4gIGlmICghaGl0YnRjU2VsbEF0IHx8ICFoaXRidGNCdXlBdCkge1xuICAgIGNvbnNvbGUubG9nKFwiR290IGJhZCByYXRlcyBmcm9tIHRoZSBoaXRidGMgZm9yOlwiLCBiaXR0cmV4TWt0TmFtZSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmICghYml0dHJleEJ1eUF0IHx8ICFiaXR0cmV4U2VsbEF0KSB7XG4gICAgY29uc29sZS5sb2coXCJHb3QgYmFkIHJhdGVzIGZyb20gdGhlIGJpdHRyZXggZm9yOlwiLCBiaXR0cmV4TWt0TmFtZSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIG91dHB1dEFyYlJlc3VsdHMoYml0dHJleEJ1eUF0LCBiaXR0cmV4U2VsbEF0LCBcIkJpdHRyZXhcIiwgXG4gICAgaGl0YnRjU2VsbEF0LCBoaXRidGNCdXlBdCwgXCJIaXRidGNcIiwgYml0dHJleE1rdE5hbWUsIHJlcG9ydGluZ1RpbWVzdGFtcCk7XG59XG5cbi8qIGhpdEJ0Y01rdEZyb21CaXR0cmV4TmFtZVxuICogZGVzYzogTWFwcyBmcm9tIEJpdHRyZXggdGlja2VycyB0byBIaXRidGMgdGlja2Vycy5cbiAqL1xuZnVuY3Rpb24gaGl0QnRjTWt0RnJvbUJpdHRyZXhOYW1lKGJpdHRyZXhNa3ROYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuXG4gICAgbGV0IHNwbGl0VGlja2VyID0gYml0dHJleE1rdE5hbWUuc3BsaXQoXCItXCIpO1xuICAgIHJldHVybihzcGxpdFRpY2tlclsxXStzcGxpdFRpY2tlclswXSk7XG59XG5cblxuLyogY29tcGFyZUFsbFBvbG9uaWV4WW9iaXRcbiAqIGRlc2M6IENvbXBhcmVzIG1hcmtldCBkYXRhIGFjcm9zcyBtYW55IGN1cnJlbmN5IHBhaXJzIGJldHdlZW4gUG9sb25pZXggYW5kIFlvYml0LlxuICogICAgICAgTm90ZSB0aGF0IFlvYml0IG9mdGVucyBoYXMgbGFyZ2UgcHJjaWUgZGlzY3JlcGVuY2llcyBidXQgdGhlIHdhbGxldHMgZm9yIHRob3MgY29pbnNcbiAqICAgICAgIGFyZSBkZWFjdGl2YXRlZC4gIFNvIHlvdSBjYW4ndCBnZW5lcmF0ZSBhIHByb2ZpdC5cbiAqL1xuZnVuY3Rpb24gY29tcGFyZUFsbFBvbG9uaWV4WW9iaXQocG9sb0RhdGE6IGFueSwgeW9iaXREYXRhOiBhbnkpIHtcblxuICBsZXQgcmVwb3J0aW5nVGltZXN0YW1wOiBEYXRlID0gbmV3IERhdGUoKTtcbiAgbGV0IHBvbG9UaW1lc3RhbXA6IERhdGUgPSBwb2xvRGF0YS50aW1lU3RhbXA7XG4gIGxldCBwb2xvQWxsTWFya2V0cyA9IEpTT04ucGFyc2UocG9sb0RhdGEuZXhjaGFuZ2VEYXRhKTtcbiAgbGV0IHlvYml0VGltZXN0YW1wID0geW9iaXREYXRhLnRpbWVTdGFtcDtcbiAgbGV0IHlvYml0QWxsTWFya2V0cyA9IEpTT04ucGFyc2UoeW9iaXREYXRhLmV4Y2hhbmdlRGF0YSk7XG4gIGNvbnNvbGUubG9nKHBvbG9UaW1lc3RhbXApO1xuICBjb25zb2xlLmxvZyh5b2JpdFRpbWVzdGFtcCk7XG4gIGZvcihsZXQgeW9iaXRNa3QgaW4geW9iaXRBbGxNYXJrZXRzKXtcbiAgICBjb25zb2xlLmxvZyhcInlvYml0TWt0OlwiLCB5b2JpdE1rdCwgXCIgZGF0YTpcIiwgeW9iaXRBbGxNYXJrZXRzW3lvYml0TWt0XSk7XG4gICAgbGV0IHBvbG9Na3ROYW1lID0gcG9sb01rdEZyb21Zb2JpdE5hbWUoeW9iaXRNa3QpO1xuICAgIGNvbnNvbGUubG9nKFwiUG9sb01hcmtldDpcIiwgcG9sb01rdE5hbWUsIFwiIGRhdGE6XCIsIHBvbG9BbGxNYXJrZXRzW3BvbG9Na3ROYW1lXSk7XG4gICAgY29tcGFyZVBvbG9uaWV4WW9iaXRNa3RFbGVtZW50KHBvbG9BbGxNYXJrZXRzW3BvbG9Na3ROYW1lXSwgeW9iaXRBbGxNYXJrZXRzW3lvYml0TWt0XSwgcG9sb01rdE5hbWUsIHJlcG9ydGluZ1RpbWVzdGFtcCk7XG4gIH1cbn1cblxuLyogY29tcGFyZVBvbG9uaWV4WW9iaXRNa3RFbGVtZW50XG4gKiBkZXNjOiBQdWxscyBvdXQgdGhlIGJ1eSBhbmQgc2VsbCBwcmljZXMgZm9yIGEgc2luZ2xlIGN1cnJlbmN5IHBhaXIgZm9yIFBvbG9uaWV4IGFuZCBZb2JpdC5cbiAqICAgICAgIEZvcndhcmRzIHRoaXMgdG8gdGhlIG91dHB1dCBtZXRob2QgdG8gcmVjb3JkIHRoZSBhcmJpdHJhZ2UgcmVzdWx0cy5cbiAqL1xuZnVuY3Rpb24gY29tcGFyZVBvbG9uaWV4WW9iaXRNa3RFbGVtZW50KHBvbG9Na3RFbGVtZW50OiBhbnksIHlvYml0TWt0RWxlbWVudDogYW55LCBwb2xvTWt0TmFtZTogYW55LCByZXBvcnRpbmdUaW1lc3RhbXA6IERhdGUpIHtcblxuICBsZXQgcG9sb0J1eUF0ID0gK3BvbG9Na3RFbGVtZW50Lmxvd2VzdEFzaztcbiAgbGV0IHBvbG9TZWxsQXQgPSArcG9sb01rdEVsZW1lbnQuaGlnaGVzdEJpZDtcbiAgbGV0IHlvYml0U2VsbEF0ID0gK3lvYml0TWt0RWxlbWVudC5zZWxsO1xuICBsZXQgeW9iaXRCdXlBdCA9ICt5b2JpdE1rdEVsZW1lbnQuYnV5O1xuICBvdXRwdXRBcmJSZXN1bHRzKHBvbG9CdXlBdCwgcG9sb1NlbGxBdCwgXCJQb2xvbmlleFwiLCB5b2JpdFNlbGxBdCwgeW9iaXRCdXlBdCwgXCJZb2JpdFwiLCBwb2xvTWt0TmFtZSwgcmVwb3J0aW5nVGltZXN0YW1wKTtcbn1cblxuLyogcG9sb01rdEZyb21Zb2JpdE5hbWVcbiAqIGRlc2M6IE1hcHMgZnJvbSBZb2JpdCB0aWNrZXJzIHRvIFBvbG9uaWV4IHRpY2tlcnMuXG4gKi9cbmZ1bmN0aW9uIHBvbG9Na3RGcm9tWW9iaXROYW1lKHlvYml0TWt0TmFtZTogc3RyaW5nKTogc3RyaW5nIHtcblxuICBjb25zdCBwb2xvTWt0TmFtZXM6IGFueSA9IHtcbiAgICBsdGNfYnRjOiAgXCJCVENfTFRDXCIsXG4gICAgbm1jX2J0YzogIFwiQlRDX05NQ1wiLFxuICAgIG5tcl9idGM6ICBcIkJUQ19OTVJcIixcbiAgICBldGhfYnRjOiAgXCJCVENfRVRIXCJcbiAgfTtcbiAgcmV0dXJuKHBvbG9Na3ROYW1lc1t5b2JpdE1rdE5hbWVdKTtcbn1cblxuXG5hc3luYyBmdW5jdGlvbiBpbnRlcm5hbENvbXBhcmVGb3JZb2JpdChta3REYXRhIDogYW55LCB5b2JpdE1hcmtldHMgOiBBcnJheTxzdHJpbmc+LCBiYXNlTWFya2V0cyA6IEFycmF5PHN0cmluZz4pIHtcblxuICBsZXQgdGltZVN0YW1wID0gbmV3IERhdGUoKTtcbiAgZm9yKGxldCBpPTA7IGk8eW9iaXRNYXJrZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IGN1ck1rdDE6IHN0cmluZyA9IHlvYml0TWFya2V0c1tpXSArIFwiX1wiICsgYmFzZU1hcmtldHNbMF07XG4gICAgbGV0IGN1ck1rdDI6IHN0cmluZyA9IHlvYml0TWFya2V0c1tpXSArIFwiX1wiICsgYmFzZU1hcmtldHNbMV07XG4gICAgbGV0IGJhc2VQYWlyOiBzdHJpbmcgPSBiYXNlTWFya2V0c1sxXSArIFwiX1wiICsgYmFzZU1hcmtldHNbMF07XG4gICAgbGV0IGFyYkZyYWN0aW9uOiBudW1iZXIgPSBta3REYXRhW2Jhc2VQYWlyXS5idXkgKiBta3REYXRhW2N1ck1rdDJdLmJ1eSAvIG1rdERhdGFbY3VyTWt0MV0uc2VsbDtcbiAgICBjb25zb2xlLmxvZyhcIkFyYiBGcmFjdGlvbiBmb3IgXCIsIHlvYml0TWFya2V0c1tpXSwgXCI6IFwiLCBhcmJGcmFjdGlvbi50b0ZpeGVkKDYpKTtcbiAgICBsZXQga2V5U3RyID0gXCJZb2JpdEludGVybmFsX1wiICsgY3VyTWt0MSArIFwiX1wiICsgYmFzZU1hcmtldHNbMV07XG4gICAgbGV0IGRiT3V0cHV0ID0ge1xuICAgICAga2V5OiBrZXlTdHIsXG4gICAgICBleGNoMU5hbWU6IFwiWW9iaXRcIixcbiAgICAgIGV4Y2gyTmFtZTogXCJZb2JpdFwiLFxuICAgICAgdGltZVN0YW1wOiB0aW1lU3RhbXAudG9TdHJpbmcoKS5zbGljZSgwLDI1KSxcbiAgICAgIGNjeVBhaXI6IGN1ck1rdDEsXG4gICAgICBleGNoMUJ1eUF0OiBta3REYXRhW2N1ck1rdDFdLnNlbGwsXG4gICAgICBleGNoMVNlbGxBdDogMCxcbiAgICAgIGV4Y2gyQnV5QXQ6IDAsXG4gICAgICBleGNoMlNlbGxBdDogbWt0RGF0YVtjdXJNa3QyXS5idXksXG4gICAgICBnYWluTG9zczogXCJMb3NzXCIsXG4gICAgICB1cmdlbnRUcmFkZTogZmFsc2UsXG4gICAgICBhcmJQZXJjZW50OiBhcmJGcmFjdGlvbixcbiAgICAgIGV4Y2gxQnV5T3JTZWxsOiBcIkJ1eVwiLFxuICAgICAgdHJhZGVJbnN0cnVjdGlvbnM6IFwiXCIsXG4gICAgfTtcbiAgICBpZiAoYXJiRnJhY3Rpb24gPiAxKSB7XG4gICAgICBkYk91dHB1dC5nYWluTG9zcyA9IFwiR2FpblwiO1xuICAgICAgY29uc29sZS5sb2coXCIgIC0tLT4gR2FpblwiLCB0aW1lU3RhbXAudG9TdHJpbmcoKS5zbGljZSgwLDI1KSwgXCIgXCIsIGFyYkZyYWN0aW9uLnRvRml4ZWQoOCksIFxuICAgICAgICBcIkJ1eSBcIiwgeW9iaXRNYXJrZXRzW2ldLCBcIiB3aXRoIEJUQyBhdFwiLCBta3REYXRhW2N1ck1rdDFdLnNlbGwsXG4gICAgICAgIFwic2VsbCB0aGVcIiwgeW9iaXRNYXJrZXRzW2ldLCBcImZvclwiLCBta3REYXRhW2N1ck1rdDJdLmJ1eSwgXG4gICAgICAgIFwidG8gZ2V0IEVUSC4gQ29udmVydCBFVEggYmFjayB0byBCVEMgYXRcIiwgbWt0RGF0YVtiYXNlUGFpcl0uYnV5KTtcbiAgICAgIGlmIChhcmJGcmFjdGlvbiA+IDEuMDA1KSB7XG4gICAgICAgIGRiT3V0cHV0LnVyZ2VudFRyYWRlID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgZGJPdXRwdXQua2V5ID0ga2V5U3RyO1xuICAgIGxldCBrZXk6IGFueSA9IHtcbiAgICAgIFwia2V5XCI6IGtleVN0clxuICAgIH07XG4gICAgaWYgKGRiV3JpdGVFbmFibGVkKSB7XG4gICAgICBhd2FpdCB1cGRhdGVSZXN1bHRzSW5Nb25nbyhrZXksIGRiT3V0cHV0LCBtb25nb0RCTmFtZSwgbW9uZ29EQkNvbGxlY3Rpb24pO1xuICAgIH0gICAgXG4gIH1cbn1cblxuZnVuY3Rpb24gY29tcGFyZUFsbFBvbG9uaWV4QmluYW5jZShwb2xvbmlleERhdGE6IGFueSwgYmluYW5jZURhdGE6IGFueSkge1xuXG4gIC8vIEFycmF5IG9mIHN0cmluZ3MgY29udGFpbmluZyB0aGUgcG9sb25pZXggbWFya2V0cyB0byBleGNsdWRlIGZyb20gdGhlIGNvbXBhcmVcbiAgY29uc3QgZXhjbHVkZUxpc3Q6QXJyYXk8c3RyaW5nPiA9IFtcIkJUQ19CQ05cIl07XG4gIGNvbnN0IHBvbG9KU09OID0gSlNPTi5wYXJzZShwb2xvbmlleERhdGEuZXhjaGFuZ2VEYXRhKTtcbiAgY29uc3QgYmluYW5jZUpTT04gPSBKU09OLnBhcnNlKGJpbmFuY2VEYXRhLmV4Y2hhbmdlRGF0YSk7XG4gIGJpbmFuY2VKU09OLmZvckVhY2goIChiaW5hbmNlRWxlbWVudDogYW55KSA9PiB7XG4gICAgY29uc3QgcG9sb1RpY2tlciA9IGdldFBvbG9UaWNrZXJGcm9tQmluYW5jZShiaW5hbmNlRWxlbWVudC5zeW1ib2wpO1xuICAgIGlmKHBvbG9KU09OW3BvbG9UaWNrZXJdICYmIGV4Y2x1ZGVMaXN0LmluZGV4T2YocG9sb1RpY2tlcik9PT0tMSkge1xuICAgICAgY29tcGFyZVBvbG9uaWV4QmluYW5jZU1rdEVsZW1lbnQocG9sb0pTT05bcG9sb1RpY2tlcl0sIGJpbmFuY2VFbGVtZW50LCBwb2xvVGlja2VyLCBuZXcgRGF0ZSgpKTtcbiAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGdldFBvbG9UaWNrZXJGcm9tQmluYW5jZShiaW5hbmNlVGlja2VyIDogc3RyaW5nKTogc3RyaW5nIHtcblxuICAvLyBTcGVjaWFsIGNhc2VzXG4gIGlmKGJpbmFuY2VUaWNrZXI9PT1cIlhMTUJUQ1wiKVxuICAgIHJldHVybihcIkJUQ19TVFJcIik7XG4gIGlmKGJpbmFuY2VUaWNrZXI9PT1cIlhMTUVUSFwiKVxuICAgIHJldHVybihcIkVUSF9TVFJcIik7ICAgICBcbiAgbGV0IHBvbG9UaWNrZXIgPSBcIlwiO1xuICBjb25zdCBiYXNlVGlja2VycyA9IFtcIkJUQ1wiLCBcIkVUSFwiLCBcIlVTRENcIiwgXCJVU0RUXCJdO1xuICBmb3IobGV0IGJhc2VJZHggPSAwOyBiYXNlSWR4PGJhc2VUaWNrZXJzLmxlbmd0aDsgYmFzZUlkeCsrKSB7XG4gICAgY29uc3QgYmFzZVRpY2tlckZvdW5kID0gYmluYW5jZVRpY2tlci5zZWFyY2goYmFzZVRpY2tlcnNbYmFzZUlkeF0pO1xuICAgIGlmIChiYXNlVGlja2VyRm91bmQgPj0gMikge1xuICAgICAgY29uc3Qgc2Vjb25kYXJ5VGlja2VyID0gYmluYW5jZVRpY2tlci5zbGljZSgwLCBiYXNlVGlja2VyRm91bmQpO1xuICAgICAgcG9sb1RpY2tlciA9IGAke2Jhc2VUaWNrZXJzW2Jhc2VJZHhdfV8ke3NlY29uZGFyeVRpY2tlcn1gO1xuICAgICAgYnJlYWs7XG4gICAgfSAgXG4gIH1cbiAgcmV0dXJuKHBvbG9UaWNrZXIpO1xufVxuXG5cbi8qIGNvbXBhcmVQb2xvbmlleEJpbmFuY2VNa3RFbGVtZW50XG4gKiBkZXNjOiBQdWxscyBvdXQgdGhlIGJ1eSBhbmQgc2VsbCBwcmljZXMgZm9yIGEgc2luZ2xlIGN1cnJlbmN5IHBhaXIgZm9yIFBvbG9uaWV4IGFuZCBZb2JpdC5cbiAqICAgICAgIEZvcndhcmRzIHRoaXMgdG8gdGhlIG91dHB1dCBtZXRob2QgdG8gcmVjb3JkIHRoZSBhcmJpdHJhZ2UgcmVzdWx0cy5cbiAqL1xuZnVuY3Rpb24gY29tcGFyZVBvbG9uaWV4QmluYW5jZU1rdEVsZW1lbnQocG9sb01rdEVsZW1lbnQ6IGFueSwgYmluYW5jZU1rdEVsZW1lbnQ6IGFueSwgcG9sb01rdE5hbWU6IGFueSwgcmVwb3J0aW5nVGltZXN0YW1wOiBEYXRlKSB7XG5cbiAgbGV0IHBvbG9CdXlBdCA9ICtwb2xvTWt0RWxlbWVudC5sb3dlc3RBc2s7XG4gIGxldCBwb2xvU2VsbEF0ID0gK3BvbG9Na3RFbGVtZW50LmhpZ2hlc3RCaWQ7XG4gIGxldCBiaW5hbmNlU2VsbEF0ID0gK2JpbmFuY2VNa3RFbGVtZW50LmJpZFByaWNlO1xuICBsZXQgYmluYW5jZUJ1eUF0ID0gK2JpbmFuY2VNa3RFbGVtZW50LmFza1ByaWNlO1xuICBvdXRwdXRBcmJSZXN1bHRzKHBvbG9CdXlBdCwgcG9sb1NlbGxBdCwgXCJQb2xvbmlleFwiLCBiaW5hbmNlU2VsbEF0LCBiaW5hbmNlQnV5QXQsIFwiQmluYW5jZVwiLCBwb2xvTWt0TmFtZSwgcmVwb3J0aW5nVGltZXN0YW1wKTtcbn1cblxuXG5leHBvcnQge2NvbXBhcmVQb2xvbmlleENvaW5iYXNlLCBjb21wYXJlQWxsUG9sb25pZXhCaXR0cmV4LCBjb21wYXJlQWxsUG9sb25pZXhIaXRidGMsIGNvbXBhcmVBbGxCaXR0cmV4SGl0YnRjLFxuICBjb21wYXJlQWxsUG9sb25pZXhZb2JpdCwgaW50ZXJuYWxDb21wYXJlRm9yWW9iaXQsIGNvbXBhcmVBbGxQb2xvbmlleEJpbmFuY2V9O1xuIl19