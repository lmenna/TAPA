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
  var excludeList = ["BTC_BCN", "BTC_GAS"];
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9jb21wYXJlUHJpY2luZ0RhdGEudHMiXSwibmFtZXMiOlsiYXJiRW1haWxUaHJlc2hvbGRQZXJjZW50IiwiYXJiUmVwb3J0aW5nVGhyZXNob2xkUGVyY2VudCIsImRiV3JpdGVFbmFibGVkIiwicmVwb3J0TG9zZXMiLCJvcmRlckJvb2tPbiIsIm1vbmdvREJOYW1lIiwibW9uZ29EQkNvbGxlY3Rpb24iLCJtb25nb0RCQ29sbGVjdGlvbkhpc3QiLCJmb3JtYXRUaW1lc3RhbXAiLCJ0aW1lU3RhbXAiLCJ0b1N0cmluZyIsInNsaWNlIiwiY29tcGFyZVBvbG9uaWV4Q29pbmJhc2UiLCJwb2xvRGF0YSIsImNiRGF0YSIsImNvaW4iLCJwb2xvSlNPTiIsIkpTT04iLCJwYXJzZSIsImV4Y2hhbmdlRGF0YSIsImNiSlNPTiIsIkRhdGUiLCJjb25zb2xlIiwibG9nIiwiZ2V0VGltZSIsImNvbXBhcmVDdXJyZW5jeVBhaXIiLCJjY3kxIiwiY2N5MiIsInBvbG9QYWlyIiwicG9sb0J1eUF0IiwibG93ZXN0QXNrIiwicG9sb1NlbGxBdCIsImhpZ2hlc3RCaWQiLCJjb2luYmFzZVNlbGxBdCIsImJpZHMiLCJjb2luYmFzZUJ1eUF0IiwiYXNrcyIsIm91dHB1dEFyYlJlc3VsdHMiLCJjb21wYXJlQWxsUG9sb25pZXhCaXR0cmV4IiwiYml0dHJleEpTT04iLCJyZXBvcnRpbmdUaW1lc3RhbXAiLCJwb2xvQWxsTWFya2V0cyIsImJpdHRyZXhNa3QiLCJwb2xvTWt0TmFtZSIsInBvbG9Na3RGcm9tQml0dHJleE5hbWUiLCJwb2xvTWt0RWxlbWVudCIsImNvbXBhcmVQb2xvbmlleEJpdHRyZXhNa3RFbGVtZW50IiwiYml0dHJleFNlbGxBdCIsIkJpZCIsImJpdHRyZXhCdXlBdCIsIkFzayIsImV4Y2gxQnV5QXQiLCJleGNoMVNlbGxBdCIsImV4Y2gxTmFtZSIsImV4Y2gyU2VsbEF0IiwiZXhjaDJCdXlBdCIsImV4Y2gyTmFtZSIsImNjeVBhaXIiLCJkYk91dHB1dCIsImtleSIsImdhaW5Mb3NzIiwidXJnZW50VHJhZGUiLCJhcmJQZXJjZW50IiwiZXhjaDFCdXlPclNlbGwiLCJ0cmFkZUluc3RydWN0aW9ucyIsInRpbWUiLCJNYXRoIiwicm91bmQiLCJhcmJPcHBvcnR1bml0eSIsInRvRml4ZWQiLCJrZXlTdHIiLCJvdXRwdXRPcmRlckJvb2siLCJleGNoYW5nZU5hbWUiLCJvcmRlckJvb2siLCJta3RTaWRlIiwib3JkZXJzIiwiZm9yRWFjaCIsInZhbHVlIiwiYml0dHJleE1rdEZyb21Qb2xvTmFtZSIsImlkeCIsIlJhdGUiLCJRdWFudGl0eSIsImJpdHRyZXhNa3ROYW1lIiwicmVwbGFjZSIsImNvbXBhcmVBbGxQb2xvbmlleEhpdGJ0YyIsImhpdGJ0Y0pTT04iLCJoaXRidGNNa3QiLCJwb2xvTWt0RnJvbUhpdGJ0Y05hbWUiLCJjb21wYXJlUG9sb25pZXhIaXRidGNNa3RFbGVtZW50IiwiaGl0YnRjTWt0RWxlbWVudCIsImhpdGJ0Y1NlbGxBdCIsImJpZCIsImhpdGJ0Y0J1eUF0IiwiYXNrIiwiaGl0YnRjTWt0TmFtZSIsInBvbG9Na3ROYW1lcyIsIkJDTkJUQyIsIkRBU0hCVEMiLCJET0dFQlRDIiwiRVRIQlRDIiwiTFNLQlRDIiwiTFRDQlRDIiwiTlhUQlRDIiwiU0JEQlRDIiwiU0NCVEMiLCJTVEVFTUJUQyIsIlhFTUJUQyIsIlhNUkJUQyIsIkFSRFJCVEMiLCJaRUNCVEMiLCJNQUlEQlRDIiwiUkVQQlRDIiwiRVRDQlRDIiwiQk5UQlRDIiwiU05URVRIIiwiT01HRVRIIiwiRVRDRVRIIiwiWkVDRVRIIiwiWFJQQlRDIiwiU1RSQVRCVEMiLCJFT1NFVEgiLCJFT1NCVEMiLCJCTlRFVEgiLCJaUlhCVEMiLCJaUlhFVEgiLCJQUENCVEMiLCJRVFVNRVRIIiwiREdCQlRDIiwiT01HQlRDIiwiU05UQlRDIiwiWFJQVVNEVCIsIk1BTkFFVEgiLCJNQU5BQlRDIiwiUVRVTUJUQyIsIkxTS0VUSCIsIlJFUEVUSCIsIlJFUFVTRFQiLCJHTlRCVEMiLCJHTlRFVEgiLCJCVFNCVEMiLCJCQVRCVEMiLCJCQVRFVEgiLCJCQ0hBQkNCVEMiLCJCQ0hTVkJUQyIsIk5NUkJUQyIsIlBPTFlCVEMiLCJTVE9SSkJUQyIsImNvbXBhcmVBbGxCaXR0cmV4SGl0YnRjIiwiYml0dHJleFRpbWVzdGFtcCIsImJpdHRyZXhBbGxNYXJrZXRzIiwicmVzdWx0IiwiaGl0YnRjVGltZXN0YW1wIiwiaGl0YnRjQWxsTWFya2V0cyIsImJpdHRyZXhNa3RFbGVtIiwiaGl0QnRjTWt0RnJvbUJpdHRyZXhOYW1lIiwiTWFya2V0TmFtZSIsImZpbHRlciIsIml0ZW0iLCJzeW1ib2wiLCJsZW5ndGgiLCJiYWRNYWtlcnRzIiwiaW5jbHVkZXMiLCJjb21wYXJlQml0dHJleEhpdGJ0Y01rdEVsZW1lbnQiLCJiaXR0cmV4TWt0RWxlbWVudCIsInNwbGl0VGlja2VyIiwic3BsaXQiLCJjb21wYXJlQWxsUG9sb25pZXhZb2JpdCIsInlvYml0RGF0YSIsInBvbG9UaW1lc3RhbXAiLCJ5b2JpdFRpbWVzdGFtcCIsInlvYml0QWxsTWFya2V0cyIsInlvYml0TWt0IiwicG9sb01rdEZyb21Zb2JpdE5hbWUiLCJjb21wYXJlUG9sb25pZXhZb2JpdE1rdEVsZW1lbnQiLCJ5b2JpdE1rdEVsZW1lbnQiLCJ5b2JpdFNlbGxBdCIsInNlbGwiLCJ5b2JpdEJ1eUF0IiwiYnV5IiwieW9iaXRNa3ROYW1lIiwibHRjX2J0YyIsIm5tY19idGMiLCJubXJfYnRjIiwiZXRoX2J0YyIsImludGVybmFsQ29tcGFyZUZvcllvYml0IiwibWt0RGF0YSIsInlvYml0TWFya2V0cyIsImJhc2VNYXJrZXRzIiwiaSIsImN1ck1rdDEiLCJjdXJNa3QyIiwiYmFzZVBhaXIiLCJhcmJGcmFjdGlvbiIsImNvbXBhcmVBbGxQb2xvbmlleEJpbmFuY2UiLCJwb2xvbmlleERhdGEiLCJiaW5hbmNlRGF0YSIsImV4Y2x1ZGVMaXN0IiwiYmluYW5jZUpTT04iLCJiaW5hbmNlRWxlbWVudCIsInBvbG9UaWNrZXIiLCJnZXRQb2xvVGlja2VyRnJvbUJpbmFuY2UiLCJpbmRleE9mIiwiY29tcGFyZVBvbG9uaWV4QmluYW5jZU1rdEVsZW1lbnQiLCJiaW5hbmNlVGlja2VyIiwiYmFzZVRpY2tlcnMiLCJiYXNlSWR4IiwiYmFzZVRpY2tlckZvdW5kIiwic2VhcmNoIiwic2Vjb25kYXJ5VGlja2VyIiwiYmluYW5jZU1rdEVsZW1lbnQiLCJiaW5hbmNlU2VsbEF0IiwiYmlkUHJpY2UiLCJiaW5hbmNlQnV5QXQiLCJhc2tQcmljZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQUtBOztBQUNBOztBQUNBOzs7Ozs7QUFFQTtBQUNBLElBQU1BLHdCQUF3QixHQUFHLElBQWpDLEMsQ0FDQTs7QUFDQSxJQUFNQyw0QkFBNEIsR0FBRyxHQUFyQyxDLENBQ0E7O0FBQ0EsSUFBSUMsY0FBYyxHQUFHLElBQXJCLEMsQ0FDQTs7QUFDQSxJQUFJQyxXQUFXLEdBQUcsS0FBbEIsQyxDQUNBOztBQUNBLElBQUlDLFdBQVcsR0FBRyxLQUFsQixDLENBQ0E7O0FBQ0EsSUFBTUMsV0FBVyxHQUFHLFFBQXBCO0FBQ0EsSUFBTUMsaUJBQWlCLEdBQUcscUJBQTFCO0FBQ0EsSUFBTUMscUJBQXFCLEdBQUcseUJBQTlCO0FBRUE7Ozs7QUFHQSxTQUFTQyxlQUFULENBQXlCQyxTQUF6QixFQUEwQztBQUN4QyxTQUFPQSxTQUFTLENBQUNDLFFBQVYsR0FBcUJDLEtBQXJCLENBQTJCLENBQTNCLEVBQTZCLEVBQTdCLENBQVA7QUFDRDtBQUVEOzs7Ozs7QUFJQSxTQUFTQyx1QkFBVCxDQUFpQ0MsUUFBakMsRUFBZ0RDLE1BQWhELEVBQTZEQyxJQUE3RCxFQUEyRTtBQUV6RSxNQUFJQyxRQUFRLEdBQUdDLElBQUksQ0FBQ0MsS0FBTCxDQUFXTCxRQUFRLENBQUNNLFlBQXBCLENBQWY7QUFDQSxNQUFJQyxNQUFNLEdBQUdILElBQUksQ0FBQ0MsS0FBTCxDQUFXSixNQUFNLENBQUNLLFlBQWxCLENBQWI7QUFDQSxNQUFJVixTQUFTLEdBQUcsSUFBSVksSUFBSixFQUFoQjtBQUNB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dkYsRUFBeUdILGtCQUF6RyxFQUFtSTtBQUVqSSxNQUFJWCxTQUFTLEdBQUcsQ0FBQ2dCLGNBQWMsQ0FBQ2YsU0FBaEM7QUFDQSxNQUFJQyxVQUFVLEdBQUcsQ0FBQ2MsY0FBYyxDQUFDYixVQUFqQztBQUNBLE1BQUlrTCxhQUFhLEdBQUcsQ0FBQ0QsaUJBQWlCLENBQUNFLFFBQXZDO0FBQ0EsTUFBSUMsWUFBWSxHQUFHLENBQUNILGlCQUFpQixDQUFDSSxRQUF0QztBQUNBaEwsRUFBQUEsZ0JBQWdCLENBQUNSLFNBQUQsRUFBWUUsVUFBWixFQUF3QixVQUF4QixFQUFvQ21MLGFBQXBDLEVBQW1ERSxZQUFuRCxFQUFpRSxTQUFqRSxFQUE0RXpLLFdBQTVFLEVBQXlGSCxrQkFBekYsQ0FBaEI7QUFDRCIsInNvdXJjZXNDb250ZW50IjpbIi8qIGNvbXBhcmVQcmljaW5nRGF0YS5qc1xuICogQ29uc29saWRhdGVzIGZ1bmN0aW9uIHRvIGNvbXBhcmUgY3J5cHRvIG1hcmtldHMgbG9va2luZyBmb3Igc2lnbmlmaWNhbnQgYXJiaXRyYWdlIG9wcG9ydHVuaXRpZXMuXG4gKiBTZW5kcyBub3RpZmljYXRpb25zIHdoZW4gbGFyZ2UgYXJiaXRyYWdlIGlzIGRldGVjdGVkLlxuICovXG5cbmltcG9ydCB7U2VuZE1lc3NhZ2V9IGZyb20gXCIuL3NlbmRFTWFpbFwiO1xuaW1wb3J0IHt1cGRhdGVSZXN1bHRzSW5Nb25nbywgd3JpdGVSZXN1bHRzVG9Nb25nb1N5bmN9IGZyb20gXCIuL2RiVXRpbHNcIjtcbmltcG9ydCB7Z2V0RXhjaGFuZ2VNa3REZXB0aH0gZnJvbSBcIi4vZ2V0Q3J5cHRvRGF0YVwiO1xuXG4vLyBTZXQgdGhpcyB0byBiZSBhIGNsZWFyIHRyYWRpbmcgb3Bwb3J0dW5pdHlcbmNvbnN0IGFyYkVtYWlsVGhyZXNob2xkUGVyY2VudCA9IDEuMjU7XG4vLyBTZXQgdGhpcyB0byBiZSB0aGUgZmVlcyBhc3NvY2lhdGVkIHdpdGggdHJhZGluZ1xuY29uc3QgYXJiUmVwb3J0aW5nVGhyZXNob2xkUGVyY2VudCA9IDAuMDtcbi8vIENvbnRyb2wgb3V0cHV0IHRvIERCXG5sZXQgZGJXcml0ZUVuYWJsZWQgPSB0cnVlO1xuLy8gQ29udHJvbCByZXBvcnRlZCBvdXRwdXRcbmxldCByZXBvcnRMb3NlcyA9IGZhbHNlO1xuLy8gQ29udHJvbCBhY3RpdmF0aW9uIG9mIG5ldyBmZWF0dXJlc1xubGV0IG9yZGVyQm9va09uID0gZmFsc2U7XG4vLyBtb25nb0RCIC0gRGF0YWJhc2UgYW5kIGNvbGxlY3Rpb25cbmNvbnN0IG1vbmdvREJOYW1lID0gXCJjcnlwdG9cIjtcbmNvbnN0IG1vbmdvREJDb2xsZWN0aW9uID0gXCJtYXJrZXRkYXRhLmFyYm1vbi1wXCI7XG5jb25zdCBtb25nb0RCQ29sbGVjdGlvbkhpc3QgPSBcIm1hcmtldGRhdGEuYXJibW9uaGlzdC1wXCI7XG5cbi8qIGZvcm1hdFRpbWVzdGFtcFxuICogZGVzYzogU2ltcGxlIHV0aWxpdHkgdG8gdHJ1bmNhdGUgdGhlIG91dHB1dCBvZiBsb25nIHRpbWUgc3RhbXBzIHRvIGluY2x1ZGUgb25seSB0aGUgZGF0ZSBhbmQgdGltZSBwYXJ0cy5cbiAqL1xuZnVuY3Rpb24gZm9ybWF0VGltZXN0YW1wKHRpbWVTdGFtcDogRGF0ZSkge1xuICByZXR1cm4odGltZVN0YW1wLnRvU3RyaW5nKCkuc2xpY2UoMCwyNSkpO1xufVxuXG4vKiBjb21wYXJlUG9sb25pZXhDb2luYmFzZVxuICogZGVzYzogTWFpbiBmdW5jdGlvbiBjYWxsZWQgdG8gY29tcGFyZSB0aGUgUG9sb25pZXggYW5kIENvaW5iYXNlIGNyeXB0byBtYXJrZXRzLlxuICogICAgICAgVGhpcyBmdW5jdGlvbiBpcyBleHBvcnRlZCBhbmQgY2FsbGVkIGJlIGFwcC5qc1xuICovXG5mdW5jdGlvbiBjb21wYXJlUG9sb25pZXhDb2luYmFzZShwb2xvRGF0YTogYW55LCBjYkRhdGE6IGFueSwgY29pbjogc3RyaW5nKSB7XG5cbiAgdmFyIHBvbG9KU09OID0gSlNPTi5wYXJzZShwb2xvRGF0YS5leGNoYW5nZURhdGEpO1xuICB2YXIgY2JKU09OID0gSlNPTi5wYXJzZShjYkRhdGEuZXhjaGFuZ2VEYXRhKTtcbiAgbGV0IHRpbWVTdGFtcCA9IG5ldyBEYXRlKCk7XG4gIGNvbnNvbGUubG9nKGAke2Zvcm1hdFRpbWVzdGFtcCh0aW1lU3RhbXApfTogUG9sb1RpbWUtQ0JUaW1lOiAke3BvbG9EYXRhLnRpbWVTdGFtcC5nZXRUaW1lKCktY2JEYXRhLnRpbWVTdGFtcC5nZXRUaW1lKCl9LmApO1xuICBjb21wYXJlQ3VycmVuY3lQYWlyKHRpbWVTdGFtcCwgcG9sb0pTT04sIGNiSlNPTiwgXCJVU0RDXCIsIGNvaW4pXG59XG5cbi8qIGNvbXBhcmVDdXJyZW5jeVBhaXJcbiAqIGRlc2M6IENvbXBhcmVzIGEgY3VycmVuY3kgcGFpciBiZXR3ZWVuIFBvbG9uaWV4IGFuZCBDb2luYmFzZS4gIE5vdGlmaWVzIHdoZW4gc2lnbmlmaWNhbnQgYXJiaXRyYWdlIG9wcG9ydHVuaXRpZXNcbiAqICAgICAgIG9jY3VyLlxuICovXG5mdW5jdGlvbiBjb21wYXJlQ3VycmVuY3lQYWlyKHRpbWVTdGFtcDogRGF0ZSwgcG9sb0pTT046IGFueSwgY2JKU09OOiBhbnksIGNjeTE6IHN0cmluZywgY2N5Mjogc3RyaW5nKSB7XG4gIGxldCBwb2xvUGFpciA9IGNjeTErXCJfXCIrY2N5MjtcbiAgbGV0IHBvbG9CdXlBdCA9ICtwb2xvSlNPTltwb2xvUGFpcl0ubG93ZXN0QXNrO1xuICBsZXQgcG9sb1NlbGxBdCA9ICtwb2xvSlNPTltwb2xvUGFpcl0uaGlnaGVzdEJpZDtcbiAgbGV0IGNvaW5iYXNlU2VsbEF0ID0gK2NiSlNPTi5iaWRzWzBdWzBdO1xuICBsZXQgY29pbmJhc2VCdXlBdCA9ICtjYkpTT04uYXNrc1swXVswXTtcbiAgb3V0cHV0QXJiUmVzdWx0cyhwb2xvQnV5QXQsIHBvbG9TZWxsQXQsIFwiUG9sb25pZXhcIiwgY29pbmJhc2VTZWxsQXQsIGNvaW5iYXNlQnV5QXQsIFwiQ29pbmJhc2VcIiwgcG9sb1BhaXIsIHRpbWVTdGFtcCk7XG4gfVxuXG4gLyogY29tcGFyZUFsbFBvbG9uaWV4Qml0dHJleFxuICAqIGRlc2M6IFRha2VzIHRoZSBwb2xvbmlleCBhbmQgYml0dHJleCBkYXRhIGluIEpTT04gZm9ybWF0IGFuZCBjb21wYXJlcyBhbGwgb3ZlcmxhcGluZyBtYXJrZXRzIGZvciBhcmJpdHJhZ2UuXG4gICogICAgICAgRXhwb3J0ZWQgZnVuY3Rpb24gY2FsbGVkIGJ5IHRoZSBtYWluIGFwcC5qc1xuICAqL1xuZnVuY3Rpb24gY29tcGFyZUFsbFBvbG9uaWV4Qml0dHJleChwb2xvSlNPTjogYW55LCBiaXR0cmV4SlNPTjogYW55KSB7XG5cbiAgbGV0IHJlcG9ydGluZ1RpbWVzdGFtcCA9IG5ldyBEYXRlKCk7XG4gIGxldCBwb2xvQWxsTWFya2V0cyA9IEpTT04ucGFyc2UocG9sb0pTT04uZXhjaGFuZ2VEYXRhKTtcbiAgZm9yKGxldCBiaXR0cmV4TWt0IGluIGJpdHRyZXhKU09OLmV4Y2hhbmdlRGF0YSl7XG4gICAgbGV0IHBvbG9Na3ROYW1lID0gcG9sb01rdEZyb21CaXR0cmV4TmFtZShiaXR0cmV4TWt0KTtcbiAgICBsZXQgcG9sb01rdEVsZW1lbnQgPSBwb2xvQWxsTWFya2V0c1twb2xvTWt0TmFtZV07XG4gICAgaWYoIXBvbG9Na3RFbGVtZW50KSB7XG4gICAgICBjb25zb2xlLmxvZyhcIlBvbG8gbWFya2V0IGZvciBcIiwgYml0dHJleE1rdCwgXCIgZG9lc24ndCBleGlzdC5cIik7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY29tcGFyZVBvbG9uaWV4Qml0dHJleE1rdEVsZW1lbnQocG9sb01rdEVsZW1lbnQsIGJpdHRyZXhKU09OLmV4Y2hhbmdlRGF0YVtiaXR0cmV4TWt0XSwgcG9sb01rdE5hbWUsIHJlcG9ydGluZ1RpbWVzdGFtcClcbiAgICB9XG4gIH1cbn1cblxuLyogY29tcGFyZVBvbG9uaWV4Qml0dHJleE1rdEVsZW1lbnRcbiAqIGRlc2M6IENvbXBhcmVzIGEgcGFydGljdWxhciBtYXJrZXQgYmV0d2VlbiB0aGUgUG9sb25pZXggYW5kIEJpdHRyZXggZXhjaGFuZ2VzLiAgU2VkbiBub3RpZmljYXRpb25zIHdoZW5cbiAqICAgICAgIHNpZ25pZmljYW50IGFyYml0cmFnZSBvcHBvcnR1bml0aWVzIGV4aXN0LlxuICovXG5mdW5jdGlvbiBjb21wYXJlUG9sb25pZXhCaXR0cmV4TWt0RWxlbWVudChwb2xvSlNPTjogYW55LCBiaXR0cmV4SlNPTjogYW55LCBwb2xvUGFpcjogc3RyaW5nLCB0aW1lU3RhbXA6IERhdGUpIHtcblxuICBsZXQgcG9sb0J1eUF0ID0gK3BvbG9KU09OLmxvd2VzdEFzaztcbiAgbGV0IHBvbG9TZWxsQXQgPSArcG9sb0pTT04uaGlnaGVzdEJpZDtcbiAgbGV0IGJpdHRyZXhTZWxsQXQgPSArYml0dHJleEpTT04uQmlkO1xuICBsZXQgYml0dHJleEJ1eUF0ID0gK2JpdHRyZXhKU09OLkFzaztcbiAgb3V0cHV0QXJiUmVzdWx0cyhwb2xvQnV5QXQsIHBvbG9TZWxsQXQsIFwiUG9sb25pZXhcIiwgYml0dHJleFNlbGxBdCwgYml0dHJleEJ1eUF0LCBcIkJpdHRyZXhcIiwgcG9sb1BhaXIsIHRpbWVTdGFtcCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIG91dHB1dEFyYlJlc3VsdHMoZXhjaDFCdXlBdDogbnVtYmVyLCBleGNoMVNlbGxBdDogbnVtYmVyLCBleGNoMU5hbWU6IHN0cmluZywgXG4gIGV4Y2gyU2VsbEF0OiBudW1iZXIsIGV4Y2gyQnV5QXQ6IG51bWJlciwgZXhjaDJOYW1lOiBzdHJpbmcsIFxuICBjY3lQYWlyOiBzdHJpbmcsIHRpbWVTdGFtcDogRGF0ZSkge1xuXG4gIGxldCBkYk91dHB1dCA9IHtcbiAgICBrZXk6IFwiXCIsXG4gICAgZXhjaDFOYW1lLFxuICAgIGV4Y2gyTmFtZSxcbiAgICB0aW1lU3RhbXA6IHRpbWVTdGFtcC50b1N0cmluZygpLnNsaWNlKDAsMjUpLFxuICAgIGNjeVBhaXIsXG4gICAgZXhjaDFCdXlBdCxcbiAgICBleGNoMVNlbGxBdCxcbiAgICBleGNoMkJ1eUF0LFxuICAgIGV4Y2gyU2VsbEF0LFxuICAgIGdhaW5Mb3NzOiBcIkxPU1NcIixcbiAgICB1cmdlbnRUcmFkZTogZmFsc2UsXG4gICAgYXJiUGVyY2VudDogMCxcbiAgICBleGNoMUJ1eU9yU2VsbDogXCJcIixcbiAgICB0cmFkZUluc3RydWN0aW9uczogXCJcIixcbiAgICB0aW1lOiBNYXRoLnJvdW5kKG5ldyBEYXRlKCkuZ2V0VGltZSgpLzEwMDApXG4gIH07XG4gLy8gQ2hlY2sgZm9yIGNhc2Ugb2YgQnV5IGF0IEV4Y2hhbmdlMiBhbmQgU2VsbCBhdCBFeGNoYW5nZTFcbiAgbGV0IGFyYk9wcG9ydHVuaXR5ID0gZXhjaDFTZWxsQXQtZXhjaDJCdXlBdDtcbiAgbGV0IGFyYlBlcmNlbnQgPSAxMDAqKGV4Y2gxU2VsbEF0LWV4Y2gyQnV5QXQpLyggKGV4Y2gxU2VsbEF0K2V4Y2gyQnV5QXQpIC8gMik7XG4gIGRiT3V0cHV0LmFyYlBlcmNlbnQgPSBhcmJQZXJjZW50O1xuICBkYk91dHB1dC5leGNoMUJ1eU9yU2VsbCA9IFwiU2VsbFwiO1xuICBpZihhcmJQZXJjZW50ID4gYXJiUmVwb3J0aW5nVGhyZXNob2xkUGVyY2VudCkge1xuICAgIGRiT3V0cHV0LmdhaW5Mb3NzID0gXCJHQUlOXCI7XG4gICAgZGJPdXRwdXQudHJhZGVJbnN0cnVjdGlvbnMgPSBgJHtjY3lQYWlyfSBCVVkgYXQgJHtleGNoMk5hbWV9IGZvciAke2V4Y2gyQnV5QXQudG9GaXhlZCg5KX0uIFNFTEwgYXQgJHtleGNoMU5hbWV9IGZvciAke2V4Y2gxU2VsbEF0LnRvRml4ZWQoOSl9IEdhaW4gJHthcmJQZXJjZW50LnRvRml4ZWQoNil9JWA7XG4gICAgY29uc29sZS5sb2coZGJPdXRwdXQuZ2Fpbkxvc3MsIFwiOiBcIiwgZGJPdXRwdXQudHJhZGVJbnN0cnVjdGlvbnMpO1xuICAgIGlmIChhcmJQZXJjZW50ID4gYXJiRW1haWxUaHJlc2hvbGRQZXJjZW50KSB7XG4gICAgICBkYk91dHB1dC51cmdlbnRUcmFkZSA9IHRydWU7XG4gICAgICBTZW5kTWVzc2FnZShgJHtjY3lQYWlyfTogQlVZIGF0ICR7ZXhjaDJOYW1lfSBhbmQgU0VMTCBhdCAke2V4Y2gxTmFtZX1gLCBkYk91dHB1dC50cmFkZUluc3RydWN0aW9ucyk7XG4gICAgfVxuICB9XG4gIGVsc2UgeyBcbiAgICBkYk91dHB1dC5nYWluTG9zcyA9IFwiTE9TU1wiO1xuICAgIGRiT3V0cHV0LnVyZ2VudFRyYWRlID0gZmFsc2U7XG4gICAgZGJPdXRwdXQudHJhZGVJbnN0cnVjdGlvbnMgPSBgJHtjY3lQYWlyfSBCVVkgYXQgJHtleGNoMk5hbWV9IGZvciAke2V4Y2gyQnV5QXQudG9GaXhlZCg5KX0uIFNFTEwgYXQgJHtleGNoMU5hbWV9IGZvciAke2V4Y2gxU2VsbEF0LnRvRml4ZWQoOSl9IExvc3MgJHthcmJQZXJjZW50LnRvRml4ZWQoNil9JWA7XG4gICAgaWYgKHJlcG9ydExvc2VzKSB7XG4gICAgICBjb25zb2xlLmxvZyhgJHtmb3JtYXRUaW1lc3RhbXAodGltZVN0YW1wKX06IFBhaXI6ICR7Y2N5UGFpcn0sIFJlc3VsdDogTE9TUywgRGVzYzogJHtleGNoMk5hbWV9LCAke2V4Y2gyQnV5QXQudG9GaXhlZCg4KX0gaXMgZ3JlYXRlciB0aGFuIFNlbGxBdCwgJHtleGNoMVNlbGxBdC50b0ZpeGVkKDgpfSwgRElGRiwgJHthcmJPcHBvcnR1bml0eS50b0ZpeGVkKDYpfWApO1xuICAgIH1cbiAgfVxuICBsZXQga2V5U3RyID0gXCJCdXlcIitleGNoMk5hbWUrXCJTZWxsXCIrZXhjaDFOYW1lK2NjeVBhaXI7XG4gIGxldCBrZXkgPSB7XG4gICAgXCJrZXlcIjoga2V5U3RyXG4gIH07XG4gIGRiT3V0cHV0LmtleSA9IGtleVN0cjtcbiAgaWYgKGRiV3JpdGVFbmFibGVkKSB7XG4gICAgYXdhaXQgdXBkYXRlUmVzdWx0c0luTW9uZ28oa2V5LCBkYk91dHB1dCwgbW9uZ29EQk5hbWUsIG1vbmdvREJDb2xsZWN0aW9uKTtcbiAgICBpZiAoZGJPdXRwdXQudXJnZW50VHJhZGUpIHtcbiAgICAgIGRiT3V0cHV0LmtleSArPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgIGF3YWl0IHdyaXRlUmVzdWx0c1RvTW9uZ29TeW5jKGRiT3V0cHV0LCBtb25nb0RCTmFtZSwgbW9uZ29EQkNvbGxlY3Rpb25IaXN0KTtcbiAgICB9XG4gIH1cbiAgLy8gQ2hlY2sgZm9yIGNhc2Ugb2YgQnV5IGF0IEV4Y2hhbmdlMSBhbmQgU2VsbCBhdCBFeGNoYW5nZTJcbiAgYXJiT3Bwb3J0dW5pdHkgPSBleGNoMlNlbGxBdC1leGNoMUJ1eUF0O1xuICBhcmJQZXJjZW50ID0gMTAwKihleGNoMlNlbGxBdC1leGNoMUJ1eUF0KS8oIChleGNoMlNlbGxBdCtleGNoMUJ1eUF0KSAvIDIpO1xuICBkYk91dHB1dC5hcmJQZXJjZW50ID0gYXJiUGVyY2VudDtcbiAgZGJPdXRwdXQuZXhjaDFCdXlPclNlbGwgPSBcIkJ1eVwiO1xuICBpZihhcmJQZXJjZW50ID4gYXJiUmVwb3J0aW5nVGhyZXNob2xkUGVyY2VudCkgeyAgICBcbiAgICBkYk91dHB1dC5nYWluTG9zcyA9IFwiR0FJTlwiO1xuICAgIGRiT3V0cHV0LnRyYWRlSW5zdHJ1Y3Rpb25zID0gYCR7Y2N5UGFpcn0gQlVZIGF0ICR7ZXhjaDFOYW1lfSBmb3IgJHtleGNoMUJ1eUF0LnRvRml4ZWQoOSl9LiBTRUxMICR7ZXhjaDJOYW1lfSBmb3IgJHtleGNoMlNlbGxBdC50b0ZpeGVkKDkpfSBHYWluICR7YXJiUGVyY2VudC50b0ZpeGVkKDYpfSVgO1xuICAgIGNvbnNvbGUubG9nKGRiT3V0cHV0LmdhaW5Mb3NzLCBcIjogXCIsIGRiT3V0cHV0LnRyYWRlSW5zdHJ1Y3Rpb25zKTtcbiAgICAvLyBFeHBlcmltZW50YWwgY29kZVxuICAgIGlmKG9yZGVyQm9va09uKSB7XG4gICAgICBhd2FpdCBvdXRwdXRPcmRlckJvb2soZXhjaDFOYW1lLCBjY3lQYWlyLCBcImJ1eVwiKTtcbiAgICAgIGF3YWl0IG91dHB1dE9yZGVyQm9vayhleGNoMk5hbWUsIGNjeVBhaXIsIFwic2VsbFwiKTtcbiAgICB9XG4gICAgaWYgKGFyYlBlcmNlbnQgPiBhcmJFbWFpbFRocmVzaG9sZFBlcmNlbnQpIHtcbiAgICAgIGRiT3V0cHV0LnVyZ2VudFRyYWRlID0gdHJ1ZTtcbiAgICAgIFNlbmRNZXNzYWdlKGAke2NjeVBhaXJ9OiBCVVkgYXQgJHtleGNoMU5hbWV9IGFuZCBTRUxMIGF0ICR7ZXhjaDJOYW1lfWAsIGRiT3V0cHV0LnRyYWRlSW5zdHJ1Y3Rpb25zKTtcbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgZGJPdXRwdXQuZ2Fpbkxvc3MgPSBcIkxPU1NcIjtcbiAgICBkYk91dHB1dC51cmdlbnRUcmFkZSA9IGZhbHNlO1xuICAgIGRiT3V0cHV0LnRyYWRlSW5zdHJ1Y3Rpb25zID0gYCR7Y2N5UGFpcn0gQlVZIGF0ICR7ZXhjaDFOYW1lfSBmb3IgJHtleGNoMUJ1eUF0LnRvRml4ZWQoOSl9IFNFTEwgJHtleGNoMk5hbWV9IGZvciAke2V4Y2gyU2VsbEF0LnRvRml4ZWQoOSl9IExvc3MgJHthcmJQZXJjZW50LnRvRml4ZWQoNil9JWA7XG4gICAgaWYgKHJlcG9ydExvc2VzKSB7XG4gICAgICBjb25zb2xlLmxvZyhgJHtmb3JtYXRUaW1lc3RhbXAodGltZVN0YW1wKX06IFBhaXI6ICR7Y2N5UGFpcn0sIFJlc3VsdDogTE9TUywgRGVzYzogQnV5QXQsICR7ZXhjaDFCdXlBdC50b0ZpeGVkKDkpfSBpcyBncmVhdGVyIHRoYW4gJHtleGNoMk5hbWV9U2VsbEF0LCAke2V4Y2gyU2VsbEF0LnRvRml4ZWQoOCl9LiBESUZGLCAke2FyYk9wcG9ydHVuaXR5LnRvRml4ZWQoNyl9YCk7XG4gICAgfVxuICB9XG4gIGtleVN0ciA9IFwiQnV5XCIrZXhjaDFOYW1lK1wiU2VsbFwiK2V4Y2gyTmFtZStjY3lQYWlyO1xuICBrZXkgPSB7XG4gICAgXCJrZXlcIjoga2V5U3RyXG4gIH07XG4gIGRiT3V0cHV0LmtleSA9IGtleVN0cjtcbiAgaWYgKGRiV3JpdGVFbmFibGVkKSB7XG4gICAgYXdhaXQgdXBkYXRlUmVzdWx0c0luTW9uZ28oa2V5LCBkYk91dHB1dCwgbW9uZ29EQk5hbWUsIG1vbmdvREJDb2xsZWN0aW9uKTtcbiAgICBpZiAoZGJPdXRwdXQudXJnZW50VHJhZGUpIHtcbiAgICAgIGRiT3V0cHV0LmtleSArPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgIGF3YWl0IHdyaXRlUmVzdWx0c1RvTW9uZ29TeW5jKGRiT3V0cHV0LCBtb25nb0RCTmFtZSwgbW9uZ29EQkNvbGxlY3Rpb25IaXN0KTtcbiAgICB9XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gb3V0cHV0T3JkZXJCb29rKGV4Y2hhbmdlTmFtZTogc3RyaW5nLCBjY3lQYWlyOiBzdHJpbmcsIGV4Y2gxQnV5T3JTZWxsOiBzdHJpbmcpIHtcblxuICBpZiAoZXhjaGFuZ2VOYW1lPT09XCJQb2xvbmlleFwiKSB7XG4gICAgY29uc3Qgb3JkZXJCb29rID0gYXdhaXQgZ2V0RXhjaGFuZ2VNa3REZXB0aChcInBvbG9uaWV4XCIsIGNjeVBhaXIpO1xuICAgIGxldCBleGNoYW5nZURhdGEgPSBKU09OLnBhcnNlKG9yZGVyQm9vay5leGNoYW5nZURhdGEpO1xuICAgIGxldCBta3RTaWRlID0gKGV4Y2gxQnV5T3JTZWxsPT09XCJidXlcIikgPyBcImFza3NcIjogXCJiaWRzXCI7XG4gICAgbGV0IG9yZGVyczogQXJyYXk8YW55PiA9IGV4Y2hhbmdlRGF0YVtta3RTaWRlXTtcbiAgICBvcmRlcnMuZm9yRWFjaCgodmFsdWUpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGAke2V4Y2hhbmdlTmFtZX0gJHtjY3lQYWlyfSBwcmljZTogJHt2YWx1ZVswXX0gc2l6ZTogJHt2YWx1ZVsxXX1gKTtcbiAgICB9KTtcbiAgICBjb25zb2xlLmxvZyhgcG9sb25pZXg6ICR7Y2N5UGFpcn0gJHtleGNoYW5nZURhdGFbXCJhc2tzXCJdfWApO1xuICB9XG4gIGVsc2UgaWYgKGV4Y2hhbmdlTmFtZT09PVwiQml0dHJleFwiKXtcbiAgICBjb25zdCBvcmRlckJvb2sgPSBhd2FpdCBnZXRFeGNoYW5nZU1rdERlcHRoKFwiYml0dHJleFwiLCBiaXR0cmV4TWt0RnJvbVBvbG9OYW1lKGNjeVBhaXIpKTtcbiAgICBsZXQgZXhjaGFuZ2VEYXRhID0gSlNPTi5wYXJzZShvcmRlckJvb2suZXhjaGFuZ2VEYXRhKTtcbiAgICBsZXQgbWt0U2lkZSA9IChleGNoMUJ1eU9yU2VsbD09PVwiYnV5XCIpID8gXCJzZWxsXCI6IFwiYnV5XCI7XG4gICAgbGV0IG9yZGVyczogQXJyYXk8YW55PiA9IGV4Y2hhbmdlRGF0YVtcInJlc3VsdFwiXVtta3RTaWRlXTtcbiAgICBvcmRlcnMuZm9yRWFjaCgodmFsdWUsIGlkeCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coYGJpdHRyZXg6ICR7Y2N5UGFpcn0gJHt2YWx1ZS5SYXRlfSAke3ZhbHVlLlF1YW50aXR5fWApO1xuICAgIH0pO1xuICB9XG59XG5cbi8qIHBvbG9Na3RGcm9tQml0dHJleE5hbWVcbiAqIGRlc2M6IENvbnZlcnRzIGEgQml0dHJleCBjcnlwdG8gY3VycmVuY3kgcGFpciBpbnRvIHRoZSBQb2xvbmlleCBwYWlyLlxuICovXG5mdW5jdGlvbiBwb2xvTWt0RnJvbUJpdHRyZXhOYW1lKGJpdHRyZXhNa3ROYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZihiaXR0cmV4TWt0TmFtZT09PVwiQlRDLVhMTVwiKVxuICAgIHJldHVybihcIkJUQ19TVFJcIik7XG4gIGlmKGJpdHRyZXhNa3ROYW1lPT09XCJVU0RULVhMTVwiKVxuICAgIHJldHVybihcIlVTRFRfU1RSXCIpOyAgICBcbiAgcmV0dXJuKGJpdHRyZXhNa3ROYW1lLnJlcGxhY2UoXCItXCIsIFwiX1wiKSk7XG59XG5cblxuLyogYml0dHJleE1rdEZyb21Qb2xvTmFtZVxuICogZGVzYzogQ29udmVydHMgYSBCaXR0cmV4IGNyeXB0byBjdXJyZW5jeSBwYWlyIGludG8gdGhlIFBvbG9uaWV4IHBhaXIuXG4gKi9cbmZ1bmN0aW9uIGJpdHRyZXhNa3RGcm9tUG9sb05hbWUocG9sb01rdE5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmKHBvbG9Na3ROYW1lPT09XCJCVENfU1RSXCIpXG4gICAgcmV0dXJuKFwiQlRDLVhMTVwiKTtcbiAgaWYocG9sb01rdE5hbWU9PT1cIlVTRFRfU1RSXCIpXG4gICAgcmV0dXJuKFwiVVNEVC1YTE1cIik7ICAgIFxuICByZXR1cm4ocG9sb01rdE5hbWUucmVwbGFjZShcIl9cIixcIi1cIikpO1xufVxuXG4vKiBjb21wYXJlQWxsUG9sb25pZXhIaXRidGNcbiogIGRlc2M6IFRha2VzIHRoZSBwb2xvbmlleCBhbmQgaGl0YnRjIGRhdGEgaW4gSlNPTiBmb3JtYXQgYW5kIGNvbXBhcmVzIGFsbCBvdmVybGFwaW5nIG1hcmtldHMgZm9yIGFyYml0cmFnZS5cbiogICAgICAgRXhwb3J0ZWQgZnVuY3Rpb24gY2FsbGVkIGJ5IHRoZSBtYWluIGFwcC5qc1xuKi9cbmZ1bmN0aW9uIGNvbXBhcmVBbGxQb2xvbmlleEhpdGJ0Yyhwb2xvSlNPTjogYW55LCBoaXRidGNKU09OOiBhbnkpIHtcbiAgXG4gIGxldCByZXBvcnRpbmdUaW1lc3RhbXAgPSBuZXcgRGF0ZSgpO1xuICBsZXQgcG9sb0FsbE1hcmtldHMgPSBKU09OLnBhcnNlKHBvbG9KU09OLmV4Y2hhbmdlRGF0YSk7XG4gIGZvcihsZXQgaGl0YnRjTWt0IGluIGhpdGJ0Y0pTT04uZXhjaGFuZ2VEYXRhKXtcbiAgICBsZXQgcG9sb01rdE5hbWUgPSBwb2xvTWt0RnJvbUhpdGJ0Y05hbWUoaGl0YnRjTWt0KTtcbiAgICBsZXQgcG9sb01rdEVsZW1lbnQgPSBwb2xvQWxsTWFya2V0c1twb2xvTWt0TmFtZV07XG4gICAgY29tcGFyZVBvbG9uaWV4SGl0YnRjTWt0RWxlbWVudChwb2xvTWt0RWxlbWVudCwgaGl0YnRjSlNPTi5leGNoYW5nZURhdGFbaGl0YnRjTWt0XSwgcG9sb01rdE5hbWUsIHJlcG9ydGluZ1RpbWVzdGFtcCk7XG4gIH1cbn1cblxuLyogY29tcGFyZVBvbG9uaWV4SGl0YnRjTWt0RWxlbWVudFxuICogZGVzYzogUHVsbHMgb3V0IHRoZSBidXkgYW5kIHNlbGwgcHJpY2VzIGZvciBhIHNpbmdsZSBjdXJyZW5jeSBwYWlyIGZvciBQb2xvbmlleCBhbmQgSGl0YnRjLlxuICogICAgICAgRm9yd2FyZHMgdGhpcyB0byB0aGUgb3V0cHV0IG1ldGhvZCB0byByZWNvcmQgdGhlIGFyYml0cmFnZSByZXN1bHRzLlxuICovXG5mdW5jdGlvbiBjb21wYXJlUG9sb25pZXhIaXRidGNNa3RFbGVtZW50KHBvbG9Na3RFbGVtZW50OiBhbnksIGhpdGJ0Y01rdEVsZW1lbnQ6IGFueSwgcG9sb01rdE5hbWU6IHN0cmluZywgcmVwb3J0aW5nVGltZXN0YW1wOiBEYXRlKSB7XG5cbiAgbGV0IHBvbG9CdXlBdCA9ICtwb2xvTWt0RWxlbWVudC5sb3dlc3RBc2s7XG4gIGxldCBwb2xvU2VsbEF0ID0gK3BvbG9Na3RFbGVtZW50LmhpZ2hlc3RCaWQ7XG4gIGxldCBoaXRidGNTZWxsQXQgPSAraGl0YnRjTWt0RWxlbWVudC5iaWQ7XG4gIGxldCBoaXRidGNCdXlBdCA9ICtoaXRidGNNa3RFbGVtZW50LmFzaztcbiAgaWYgKCFoaXRidGNTZWxsQXQgfHwgIWhpdGJ0Y0J1eUF0KSB7XG4gICAgY29uc29sZS5sb2coXCJHb3QgYmFkIHJhdGVzIGZyb20gdGhlIGhpdGJ0YyBmb3I6XCIsIHBvbG9Na3ROYW1lKTtcbiAgICByZXR1cm47XG4gIH1cbiAgb3V0cHV0QXJiUmVzdWx0cyhwb2xvQnV5QXQsIHBvbG9TZWxsQXQsIFwiUG9sb25pZXhcIiwgaGl0YnRjU2VsbEF0LCBoaXRidGNCdXlBdCwgXCJIaXRidGNcIiwgcG9sb01rdE5hbWUsIHJlcG9ydGluZ1RpbWVzdGFtcCk7XG59XG5cbi8qIHBvbG9Na3RGcm9tSGl0YnRjTmFtZVxuICogZGVzYzogTWFwcyBmcm9tIEhpdGJ0YyB0aWNrZXJzIHRvIFBvbG9uaWV4IHRpY2tlcnMuXG4gKi9cbmZ1bmN0aW9uIHBvbG9Na3RGcm9tSGl0YnRjTmFtZShoaXRidGNNa3ROYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuXG4gIGNvbnN0IHBvbG9Na3ROYW1lczogYW55ID0ge1xuICAgIEJDTkJUQzogICBcIkJUQ19CQ05cIixcbiAgICBEQVNIQlRDOiAgIFwiQlRDX0RBU0hcIixcbiAgICBET0dFQlRDOiAgIFwiQlRDX0RPR0VcIixcbiAgICBFVEhCVEM6ICAgXCJCVENfRVRIXCIsXG4gICAgTFNLQlRDOiAgIFwiQlRDX0xTS1wiLFxuICAgIExUQ0JUQzogICBcIkJUQ19MVENcIixcbiAgICBOWFRCVEM6ICAgXCJCVENfTlhUXCIsXG4gICAgU0JEQlRDOiAgIFwiQlRDX1NCRFwiLFxuICAgIFNDQlRDOiAgIFwiQlRDX1NDXCIsXG4gICAgU1RFRU1CVEM6ICAgXCJCVENfU1RFRU1cIixcbiAgICBYRU1CVEM6ICAgXCJCVENfWEVNXCIsXG4gICAgWE1SQlRDOiAgIFwiQlRDX1hNUlwiLFxuICAgIEFSRFJCVEM6ICAgXCJCVENfQVJEUlwiLFxuICAgIFpFQ0JUQzogICBcIkJUQ19aRUNcIixcbiAgICBNQUlEQlRDOiAgIFwiQlRDX01BSURcIixcbiAgICBSRVBCVEM6ICAgXCJCVENfUkVQXCIsXG4gICAgRVRDQlRDOiAgIFwiQlRDX0VUQ1wiLFxuICAgIEJOVEJUQzogICBcIkJUQ19CTlRcIixcbiAgICBTTlRFVEg6ICAgXCJFVEhfU05UXCIsXG4gICAgT01HRVRIOiAgIFwiRVRIX09NR1wiLFxuICAgIEVUQ0VUSDogICBcIkVUSF9FVENcIixcbiAgICBaRUNFVEg6ICAgXCJFVEhfWkVDXCIsXG4gICAgWFJQQlRDOiAgIFwiQlRDX1hSUFwiLFxuICAgIFNUUkFUQlRDOiAgIFwiQlRDX1NUUkFUXCIsXG4gICAgRU9TRVRIOiAgIFwiRVRIX0VPU1wiLFxuICAgIEVPU0JUQzogICBcIkJUQ19FT1NcIixcbiAgICBCTlRFVEg6ICAgXCJFVEhfQk5UXCIsXG4gICAgWlJYQlRDOiAgIFwiQlRDX1pSWFwiLFxuICAgIFpSWEVUSDogICBcIkVUSF9aUlhcIixcbiAgICBQUENCVEM6ICAgXCJCVENfUFBDXCIsXG4gICAgUVRVTUVUSDogICBcIkVUSF9RVFVNXCIsXG4gICAgREdCQlRDOiAgIFwiQlRDX0RHQlwiLFxuICAgIE9NR0JUQzogICBcIkJUQ19PTUdcIixcbiAgICBTTlRCVEM6ICAgXCJCVENfU05UXCIsXG4gICAgWFJQVVNEVDogICBcIlVTRFRfWFJQXCIsXG4gICAgTUFOQUVUSDogICBcIkVUSF9NQU5BXCIsXG4gICAgTUFOQUJUQzogICBcIkJUQ19NQU5BXCIsXG4gICAgUVRVTUJUQzogICBcIkJUQ19RVFVNXCIsXG4gICAgTFNLRVRIOiAgIFwiRVRIX0xTS1wiLFxuICAgIFJFUEVUSDogICBcIkVUSF9SRVBcIixcbiAgICBSRVBVU0RUOiAgIFwiVVNEVF9SRVBcIixcbiAgICBHTlRCVEM6ICAgXCJCVENfR05UXCIsXG4gICAgR05URVRIOiAgIFwiRVRIX0dOVFwiLFxuICAgIEJUU0JUQzogICBcIkJUQ19CVFNcIixcbiAgICBCQVRCVEM6ICAgXCJCVENfQkFUXCIsXG4gICAgQkFURVRIOiAgIFwiRVRIX0JBVFwiLFxuICAgIEJDSEFCQ0JUQzogICBcIkJUQ19CQ0hBQkNcIixcbiAgICBCQ0hTVkJUQzogICBcIkJUQ19CQ0hTVlwiLFxuICAgIE5NUkJUQzogICBcIkJUQ19OTVJcIixcbiAgICBQT0xZQlRDOiAgIFwiQlRDX1BPTFlcIixcbiAgICBTVE9SSkJUQzogICBcIkJUQ19TVE9SSlwiXG4gIH07XG4gIHJldHVybihwb2xvTWt0TmFtZXNbaGl0YnRjTWt0TmFtZV0pO1xufVxuXG4vKiBjb21wYXJlQWxsQml0dHJleEhpdGJ0Y1xuKiAgZGVzYzogVGFrZXMgdGhlIGJpdHRyZXggYW5kIGhpdGJ0YyBkYXRhIGluIEpTT04gZm9ybWF0IGFuZCBjb21wYXJlcyBhbGwgb3ZlcmxhcGluZyBtYXJrZXRzIGZvciBhcmJpdHJhZ2UuXG4qICAgICAgIEV4cG9ydGVkIGZ1bmN0aW9uIGNhbGxlZCBieSB0aGUgbWFpbiBhcHAuanNcbiovXG5mdW5jdGlvbiBjb21wYXJlQWxsQml0dHJleEhpdGJ0YyhiaXR0cmV4SlNPTjogYW55LCBoaXRidGNKU09OOiBhbnkpIHtcbiAgXG4gIGxldCByZXBvcnRpbmdUaW1lc3RhbXAgPSBuZXcgRGF0ZSgpO1xuICBsZXQgYml0dHJleFRpbWVzdGFtcCA9IGJpdHRyZXhKU09OLnRpbWVTdGFtcDtcbiAgbGV0IGJpdHRyZXhBbGxNYXJrZXRzID0gSlNPTi5wYXJzZShiaXR0cmV4SlNPTi5leGNoYW5nZURhdGEpLnJlc3VsdDtcbiAgbGV0IGhpdGJ0Y1RpbWVzdGFtcCA9IGhpdGJ0Y0pTT04udGltZVN0YW1wO1xuICBsZXQgaGl0YnRjQWxsTWFya2V0cyA9IEpTT04ucGFyc2UoaGl0YnRjSlNPTi5leGNoYW5nZURhdGEpO1xuICBjb25zb2xlLmxvZyhcIkluIGNvbXBhcmVBbGxCaXR0cmV4SGl0YnRjXCIpO1xuICBjb25zb2xlLmxvZyhiaXR0cmV4VGltZXN0YW1wKTtcbiAgY29uc29sZS5sb2coaGl0YnRjVGltZXN0YW1wKTtcbiAgYml0dHJleEFsbE1hcmtldHMuZm9yRWFjaCggKGJpdHRyZXhNa3RFbGVtOiBhbnkpID0+IHtcbiAgICBsZXQgaGl0YnRjTWt0TmFtZSA9IGhpdEJ0Y01rdEZyb21CaXR0cmV4TmFtZShiaXR0cmV4TWt0RWxlbS5NYXJrZXROYW1lKTtcbiAgICBsZXQgaGl0YnRjTWt0ID0gaGl0YnRjQWxsTWFya2V0cy5maWx0ZXIoKGl0ZW06IGFueSkgPT4ge1xuICAgICAgcmV0dXJuKGl0ZW0uc3ltYm9sPT09aGl0YnRjTWt0TmFtZSk7XG4gICAgfSk7XG4gICAgaWYoaGl0YnRjTWt0Lmxlbmd0aCE9MCkge1xuICAgICAgbGV0IGJhZE1ha2VydHMgPSBbXCJCVEMtQkNIXCIsIFwiRVRILUJDSFwiLCBcIlVTRC1CQ0hcIiwgXCJCVEMtQklUU1wiLCBcIkJUQy1YRE5cIiwgXCJCVEMtU1dUXCJdO1xuICAgICAgICAvLyBsZXQgYmFkTWFrZXJ0cyA9IFtcIkJUQy1CQ0hcIiwgXCJFVEgtQkNIXCIsIFwiVVNELUJDSFwiLCBcIkJUQy1CSVRTXCIsIFwiQlRDLVNQQ1wiLCBcIkJUQy1TV1RcIiwgXCJCVEMtQ01DVFwiLFxuICAgICAgICAvLyBcIkJUQy1OTEMyXCIsIFwiQlRDLVdBVkVTXCJdO1xuICAgICAgaWYgKCFiYWRNYWtlcnRzLmluY2x1ZGVzKGJpdHRyZXhNa3RFbGVtLk1hcmtldE5hbWUpKSB7XG4gICAgICAgIGNvbXBhcmVCaXR0cmV4SGl0YnRjTWt0RWxlbWVudChiaXR0cmV4TWt0RWxlbSwgaGl0YnRjTWt0WzBdLCBiaXR0cmV4TWt0RWxlbS5NYXJrZXROYW1lLCBuZXcgRGF0ZSgpKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufVxuXG4vKiBjb21wYXJlQml0dHJleEhpdGJ0Y01rdEVsZW1lbnRcbiAqIGRlc2M6IFB1bGxzIG91dCB0aGUgYnV5IGFuZCBzZWxsIHByaWNlcyBmb3IgYSBzaW5nbGUgY3VycmVuY3kgcGFpciBmb3IgUG9sb25pZXggYW5kIEhpdGJ0Yy5cbiAqICAgICAgIEZvcndhcmRzIHRoaXMgdG8gdGhlIG91dHB1dCBtZXRob2QgdG8gcmVjb3JkIHRoZSBhcmJpdHJhZ2UgcmVzdWx0cy5cbiAqL1xuZnVuY3Rpb24gY29tcGFyZUJpdHRyZXhIaXRidGNNa3RFbGVtZW50KGJpdHRyZXhNa3RFbGVtZW50OiBhbnksIGhpdGJ0Y01rdEVsZW1lbnQ6IGFueSwgYml0dHJleE1rdE5hbWU6IHN0cmluZywgcmVwb3J0aW5nVGltZXN0YW1wOiBEYXRlKSB7XG5cbiAgbGV0IGJpdHRyZXhCdXlBdCA9ICtiaXR0cmV4TWt0RWxlbWVudC5Bc2s7XG4gIGxldCBiaXR0cmV4U2VsbEF0ID0gK2JpdHRyZXhNa3RFbGVtZW50LkJpZDtcbiAgbGV0IGhpdGJ0Y1NlbGxBdCA9ICtoaXRidGNNa3RFbGVtZW50LmJpZDtcbiAgbGV0IGhpdGJ0Y0J1eUF0ID0gK2hpdGJ0Y01rdEVsZW1lbnQuYXNrO1xuICBpZiAoIWhpdGJ0Y1NlbGxBdCB8fCAhaGl0YnRjQnV5QXQpIHtcbiAgICBjb25zb2xlLmxvZyhcIkdvdCBiYWQgcmF0ZXMgZnJvbSB0aGUgaGl0YnRjIGZvcjpcIiwgYml0dHJleE1rdE5hbWUpO1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAoIWJpdHRyZXhCdXlBdCB8fCAhYml0dHJleFNlbGxBdCkge1xuICAgIGNvbnNvbGUubG9nKFwiR290IGJhZCByYXRlcyBmcm9tIHRoZSBiaXR0cmV4IGZvcjpcIiwgYml0dHJleE1rdE5hbWUpO1xuICAgIHJldHVybjtcbiAgfVxuICBvdXRwdXRBcmJSZXN1bHRzKGJpdHRyZXhCdXlBdCwgYml0dHJleFNlbGxBdCwgXCJCaXR0cmV4XCIsIFxuICAgIGhpdGJ0Y1NlbGxBdCwgaGl0YnRjQnV5QXQsIFwiSGl0YnRjXCIsIGJpdHRyZXhNa3ROYW1lLCByZXBvcnRpbmdUaW1lc3RhbXApO1xufVxuXG4vKiBoaXRCdGNNa3RGcm9tQml0dHJleE5hbWVcbiAqIGRlc2M6IE1hcHMgZnJvbSBCaXR0cmV4IHRpY2tlcnMgdG8gSGl0YnRjIHRpY2tlcnMuXG4gKi9cbmZ1bmN0aW9uIGhpdEJ0Y01rdEZyb21CaXR0cmV4TmFtZShiaXR0cmV4TWt0TmFtZTogc3RyaW5nKTogc3RyaW5nIHtcblxuICAgIGxldCBzcGxpdFRpY2tlciA9IGJpdHRyZXhNa3ROYW1lLnNwbGl0KFwiLVwiKTtcbiAgICByZXR1cm4oc3BsaXRUaWNrZXJbMV0rc3BsaXRUaWNrZXJbMF0pO1xufVxuXG5cbi8qIGNvbXBhcmVBbGxQb2xvbmlleFlvYml0XG4gKiBkZXNjOiBDb21wYXJlcyBtYXJrZXQgZGF0YSBhY3Jvc3MgbWFueSBjdXJyZW5jeSBwYWlycyBiZXR3ZWVuIFBvbG9uaWV4IGFuZCBZb2JpdC5cbiAqICAgICAgIE5vdGUgdGhhdCBZb2JpdCBvZnRlbnMgaGFzIGxhcmdlIHByY2llIGRpc2NyZXBlbmNpZXMgYnV0IHRoZSB3YWxsZXRzIGZvciB0aG9zIGNvaW5zXG4gKiAgICAgICBhcmUgZGVhY3RpdmF0ZWQuICBTbyB5b3UgY2FuJ3QgZ2VuZXJhdGUgYSBwcm9maXQuXG4gKi9cbmZ1bmN0aW9uIGNvbXBhcmVBbGxQb2xvbmlleFlvYml0KHBvbG9EYXRhOiBhbnksIHlvYml0RGF0YTogYW55KSB7XG5cbiAgbGV0IHJlcG9ydGluZ1RpbWVzdGFtcDogRGF0ZSA9IG5ldyBEYXRlKCk7XG4gIGxldCBwb2xvVGltZXN0YW1wOiBEYXRlID0gcG9sb0RhdGEudGltZVN0YW1wO1xuICBsZXQgcG9sb0FsbE1hcmtldHMgPSBKU09OLnBhcnNlKHBvbG9EYXRhLmV4Y2hhbmdlRGF0YSk7XG4gIGxldCB5b2JpdFRpbWVzdGFtcCA9IHlvYml0RGF0YS50aW1lU3RhbXA7XG4gIGxldCB5b2JpdEFsbE1hcmtldHMgPSBKU09OLnBhcnNlKHlvYml0RGF0YS5leGNoYW5nZURhdGEpO1xuICBjb25zb2xlLmxvZyhwb2xvVGltZXN0YW1wKTtcbiAgY29uc29sZS5sb2coeW9iaXRUaW1lc3RhbXApO1xuICBmb3IobGV0IHlvYml0TWt0IGluIHlvYml0QWxsTWFya2V0cyl7XG4gICAgY29uc29sZS5sb2coXCJ5b2JpdE1rdDpcIiwgeW9iaXRNa3QsIFwiIGRhdGE6XCIsIHlvYml0QWxsTWFya2V0c1t5b2JpdE1rdF0pO1xuICAgIGxldCBwb2xvTWt0TmFtZSA9IHBvbG9Na3RGcm9tWW9iaXROYW1lKHlvYml0TWt0KTtcbiAgICBjb25zb2xlLmxvZyhcIlBvbG9NYXJrZXQ6XCIsIHBvbG9Na3ROYW1lLCBcIiBkYXRhOlwiLCBwb2xvQWxsTWFya2V0c1twb2xvTWt0TmFtZV0pO1xuICAgIGNvbXBhcmVQb2xvbmlleFlvYml0TWt0RWxlbWVudChwb2xvQWxsTWFya2V0c1twb2xvTWt0TmFtZV0sIHlvYml0QWxsTWFya2V0c1t5b2JpdE1rdF0sIHBvbG9Na3ROYW1lLCByZXBvcnRpbmdUaW1lc3RhbXApO1xuICB9XG59XG5cbi8qIGNvbXBhcmVQb2xvbmlleFlvYml0TWt0RWxlbWVudFxuICogZGVzYzogUHVsbHMgb3V0IHRoZSBidXkgYW5kIHNlbGwgcHJpY2VzIGZvciBhIHNpbmdsZSBjdXJyZW5jeSBwYWlyIGZvciBQb2xvbmlleCBhbmQgWW9iaXQuXG4gKiAgICAgICBGb3J3YXJkcyB0aGlzIHRvIHRoZSBvdXRwdXQgbWV0aG9kIHRvIHJlY29yZCB0aGUgYXJiaXRyYWdlIHJlc3VsdHMuXG4gKi9cbmZ1bmN0aW9uIGNvbXBhcmVQb2xvbmlleFlvYml0TWt0RWxlbWVudChwb2xvTWt0RWxlbWVudDogYW55LCB5b2JpdE1rdEVsZW1lbnQ6IGFueSwgcG9sb01rdE5hbWU6IGFueSwgcmVwb3J0aW5nVGltZXN0YW1wOiBEYXRlKSB7XG5cbiAgbGV0IHBvbG9CdXlBdCA9ICtwb2xvTWt0RWxlbWVudC5sb3dlc3RBc2s7XG4gIGxldCBwb2xvU2VsbEF0ID0gK3BvbG9Na3RFbGVtZW50LmhpZ2hlc3RCaWQ7XG4gIGxldCB5b2JpdFNlbGxBdCA9ICt5b2JpdE1rdEVsZW1lbnQuc2VsbDtcbiAgbGV0IHlvYml0QnV5QXQgPSAreW9iaXRNa3RFbGVtZW50LmJ1eTtcbiAgb3V0cHV0QXJiUmVzdWx0cyhwb2xvQnV5QXQsIHBvbG9TZWxsQXQsIFwiUG9sb25pZXhcIiwgeW9iaXRTZWxsQXQsIHlvYml0QnV5QXQsIFwiWW9iaXRcIiwgcG9sb01rdE5hbWUsIHJlcG9ydGluZ1RpbWVzdGFtcCk7XG59XG5cbi8qIHBvbG9Na3RGcm9tWW9iaXROYW1lXG4gKiBkZXNjOiBNYXBzIGZyb20gWW9iaXQgdGlja2VycyB0byBQb2xvbmlleCB0aWNrZXJzLlxuICovXG5mdW5jdGlvbiBwb2xvTWt0RnJvbVlvYml0TmFtZSh5b2JpdE1rdE5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG5cbiAgY29uc3QgcG9sb01rdE5hbWVzOiBhbnkgPSB7XG4gICAgbHRjX2J0YzogIFwiQlRDX0xUQ1wiLFxuICAgIG5tY19idGM6ICBcIkJUQ19OTUNcIixcbiAgICBubXJfYnRjOiAgXCJCVENfTk1SXCIsXG4gICAgZXRoX2J0YzogIFwiQlRDX0VUSFwiXG4gIH07XG4gIHJldHVybihwb2xvTWt0TmFtZXNbeW9iaXRNa3ROYW1lXSk7XG59XG5cblxuYXN5bmMgZnVuY3Rpb24gaW50ZXJuYWxDb21wYXJlRm9yWW9iaXQobWt0RGF0YSA6IGFueSwgeW9iaXRNYXJrZXRzIDogQXJyYXk8c3RyaW5nPiwgYmFzZU1hcmtldHMgOiBBcnJheTxzdHJpbmc+KSB7XG5cbiAgbGV0IHRpbWVTdGFtcCA9IG5ldyBEYXRlKCk7XG4gIGZvcihsZXQgaT0wOyBpPHlvYml0TWFya2V0cy5sZW5ndGg7IGkrKykge1xuICAgIGxldCBjdXJNa3QxOiBzdHJpbmcgPSB5b2JpdE1hcmtldHNbaV0gKyBcIl9cIiArIGJhc2VNYXJrZXRzWzBdO1xuICAgIGxldCBjdXJNa3QyOiBzdHJpbmcgPSB5b2JpdE1hcmtldHNbaV0gKyBcIl9cIiArIGJhc2VNYXJrZXRzWzFdO1xuICAgIGxldCBiYXNlUGFpcjogc3RyaW5nID0gYmFzZU1hcmtldHNbMV0gKyBcIl9cIiArIGJhc2VNYXJrZXRzWzBdO1xuICAgIGxldCBhcmJGcmFjdGlvbjogbnVtYmVyID0gbWt0RGF0YVtiYXNlUGFpcl0uYnV5ICogbWt0RGF0YVtjdXJNa3QyXS5idXkgLyBta3REYXRhW2N1ck1rdDFdLnNlbGw7XG4gICAgY29uc29sZS5sb2coXCJBcmIgRnJhY3Rpb24gZm9yIFwiLCB5b2JpdE1hcmtldHNbaV0sIFwiOiBcIiwgYXJiRnJhY3Rpb24udG9GaXhlZCg2KSk7XG4gICAgbGV0IGtleVN0ciA9IFwiWW9iaXRJbnRlcm5hbF9cIiArIGN1ck1rdDEgKyBcIl9cIiArIGJhc2VNYXJrZXRzWzFdO1xuICAgIGxldCBkYk91dHB1dCA9IHtcbiAgICAgIGtleToga2V5U3RyLFxuICAgICAgZXhjaDFOYW1lOiBcIllvYml0XCIsXG4gICAgICBleGNoMk5hbWU6IFwiWW9iaXRcIixcbiAgICAgIHRpbWVTdGFtcDogdGltZVN0YW1wLnRvU3RyaW5nKCkuc2xpY2UoMCwyNSksXG4gICAgICBjY3lQYWlyOiBjdXJNa3QxLFxuICAgICAgZXhjaDFCdXlBdDogbWt0RGF0YVtjdXJNa3QxXS5zZWxsLFxuICAgICAgZXhjaDFTZWxsQXQ6IDAsXG4gICAgICBleGNoMkJ1eUF0OiAwLFxuICAgICAgZXhjaDJTZWxsQXQ6IG1rdERhdGFbY3VyTWt0Ml0uYnV5LFxuICAgICAgZ2Fpbkxvc3M6IFwiTG9zc1wiLFxuICAgICAgdXJnZW50VHJhZGU6IGZhbHNlLFxuICAgICAgYXJiUGVyY2VudDogYXJiRnJhY3Rpb24sXG4gICAgICBleGNoMUJ1eU9yU2VsbDogXCJCdXlcIixcbiAgICAgIHRyYWRlSW5zdHJ1Y3Rpb25zOiBcIlwiLFxuICAgIH07XG4gICAgaWYgKGFyYkZyYWN0aW9uID4gMSkge1xuICAgICAgZGJPdXRwdXQuZ2Fpbkxvc3MgPSBcIkdhaW5cIjtcbiAgICAgIGNvbnNvbGUubG9nKFwiICAtLS0+IEdhaW5cIiwgdGltZVN0YW1wLnRvU3RyaW5nKCkuc2xpY2UoMCwyNSksIFwiIFwiLCBhcmJGcmFjdGlvbi50b0ZpeGVkKDgpLCBcbiAgICAgICAgXCJCdXkgXCIsIHlvYml0TWFya2V0c1tpXSwgXCIgd2l0aCBCVEMgYXRcIiwgbWt0RGF0YVtjdXJNa3QxXS5zZWxsLFxuICAgICAgICBcInNlbGwgdGhlXCIsIHlvYml0TWFya2V0c1tpXSwgXCJmb3JcIiwgbWt0RGF0YVtjdXJNa3QyXS5idXksIFxuICAgICAgICBcInRvIGdldCBFVEguIENvbnZlcnQgRVRIIGJhY2sgdG8gQlRDIGF0XCIsIG1rdERhdGFbYmFzZVBhaXJdLmJ1eSk7XG4gICAgICBpZiAoYXJiRnJhY3Rpb24gPiAxLjAwNSkge1xuICAgICAgICBkYk91dHB1dC51cmdlbnRUcmFkZSA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIGRiT3V0cHV0LmtleSA9IGtleVN0cjtcbiAgICBsZXQga2V5OiBhbnkgPSB7XG4gICAgICBcImtleVwiOiBrZXlTdHJcbiAgICB9O1xuICAgIGlmIChkYldyaXRlRW5hYmxlZCkge1xuICAgICAgYXdhaXQgdXBkYXRlUmVzdWx0c0luTW9uZ28oa2V5LCBkYk91dHB1dCwgbW9uZ29EQk5hbWUsIG1vbmdvREJDb2xsZWN0aW9uKTtcbiAgICB9ICAgIFxuICB9XG59XG5cbmZ1bmN0aW9uIGNvbXBhcmVBbGxQb2xvbmlleEJpbmFuY2UocG9sb25pZXhEYXRhOiBhbnksIGJpbmFuY2VEYXRhOiBhbnkpIHtcblxuICAvLyBBcnJheSBvZiBzdHJpbmdzIGNvbnRhaW5pbmcgdGhlIHBvbG9uaWV4IG1hcmtldHMgdG8gZXhjbHVkZSBmcm9tIHRoZSBjb21wYXJlXG4gIGNvbnN0IGV4Y2x1ZGVMaXN0OkFycmF5PHN0cmluZz4gPSBbXCJCVENfQkNOXCIsIFwiQlRDX0dBU1wiXTtcbiAgY29uc3QgcG9sb0pTT04gPSBKU09OLnBhcnNlKHBvbG9uaWV4RGF0YS5leGNoYW5nZURhdGEpO1xuICBjb25zdCBiaW5hbmNlSlNPTiA9IEpTT04ucGFyc2UoYmluYW5jZURhdGEuZXhjaGFuZ2VEYXRhKTtcbiAgYmluYW5jZUpTT04uZm9yRWFjaCggKGJpbmFuY2VFbGVtZW50OiBhbnkpID0+IHtcbiAgICBjb25zdCBwb2xvVGlja2VyID0gZ2V0UG9sb1RpY2tlckZyb21CaW5hbmNlKGJpbmFuY2VFbGVtZW50LnN5bWJvbCk7XG4gICAgaWYocG9sb0pTT05bcG9sb1RpY2tlcl0gJiYgZXhjbHVkZUxpc3QuaW5kZXhPZihwb2xvVGlja2VyKT09PS0xKSB7XG4gICAgICBjb21wYXJlUG9sb25pZXhCaW5hbmNlTWt0RWxlbWVudChwb2xvSlNPTltwb2xvVGlja2VyXSwgYmluYW5jZUVsZW1lbnQsIHBvbG9UaWNrZXIsIG5ldyBEYXRlKCkpO1xuICAgfVxuICB9KTtcbn1cblxuZnVuY3Rpb24gZ2V0UG9sb1RpY2tlckZyb21CaW5hbmNlKGJpbmFuY2VUaWNrZXIgOiBzdHJpbmcpOiBzdHJpbmcge1xuXG4gIC8vIFNwZWNpYWwgY2FzZXNcbiAgaWYoYmluYW5jZVRpY2tlcj09PVwiWExNQlRDXCIpXG4gICAgcmV0dXJuKFwiQlRDX1NUUlwiKTtcbiAgaWYoYmluYW5jZVRpY2tlcj09PVwiWExNRVRIXCIpXG4gICAgcmV0dXJuKFwiRVRIX1NUUlwiKTsgICAgIFxuICBsZXQgcG9sb1RpY2tlciA9IFwiXCI7XG4gIGNvbnN0IGJhc2VUaWNrZXJzID0gW1wiQlRDXCIsIFwiRVRIXCIsIFwiVVNEQ1wiLCBcIlVTRFRcIl07XG4gIGZvcihsZXQgYmFzZUlkeCA9IDA7IGJhc2VJZHg8YmFzZVRpY2tlcnMubGVuZ3RoOyBiYXNlSWR4KyspIHtcbiAgICBjb25zdCBiYXNlVGlja2VyRm91bmQgPSBiaW5hbmNlVGlja2VyLnNlYXJjaChiYXNlVGlja2Vyc1tiYXNlSWR4XSk7XG4gICAgaWYgKGJhc2VUaWNrZXJGb3VuZCA+PSAyKSB7XG4gICAgICBjb25zdCBzZWNvbmRhcnlUaWNrZXIgPSBiaW5hbmNlVGlja2VyLnNsaWNlKDAsIGJhc2VUaWNrZXJGb3VuZCk7XG4gICAgICBwb2xvVGlja2VyID0gYCR7YmFzZVRpY2tlcnNbYmFzZUlkeF19XyR7c2Vjb25kYXJ5VGlja2VyfWA7XG4gICAgICBicmVhaztcbiAgICB9ICBcbiAgfVxuICByZXR1cm4ocG9sb1RpY2tlcik7XG59XG5cblxuLyogY29tcGFyZVBvbG9uaWV4QmluYW5jZU1rdEVsZW1lbnRcbiAqIGRlc2M6IFB1bGxzIG91dCB0aGUgYnV5IGFuZCBzZWxsIHByaWNlcyBmb3IgYSBzaW5nbGUgY3VycmVuY3kgcGFpciBmb3IgUG9sb25pZXggYW5kIFlvYml0LlxuICogICAgICAgRm9yd2FyZHMgdGhpcyB0byB0aGUgb3V0cHV0IG1ldGhvZCB0byByZWNvcmQgdGhlIGFyYml0cmFnZSByZXN1bHRzLlxuICovXG5mdW5jdGlvbiBjb21wYXJlUG9sb25pZXhCaW5hbmNlTWt0RWxlbWVudChwb2xvTWt0RWxlbWVudDogYW55LCBiaW5hbmNlTWt0RWxlbWVudDogYW55LCBwb2xvTWt0TmFtZTogYW55LCByZXBvcnRpbmdUaW1lc3RhbXA6IERhdGUpIHtcblxuICBsZXQgcG9sb0J1eUF0ID0gK3BvbG9Na3RFbGVtZW50Lmxvd2VzdEFzaztcbiAgbGV0IHBvbG9TZWxsQXQgPSArcG9sb01rdEVsZW1lbnQuaGlnaGVzdEJpZDtcbiAgbGV0IGJpbmFuY2VTZWxsQXQgPSArYmluYW5jZU1rdEVsZW1lbnQuYmlkUHJpY2U7XG4gIGxldCBiaW5hbmNlQnV5QXQgPSArYmluYW5jZU1rdEVsZW1lbnQuYXNrUHJpY2U7XG4gIG91dHB1dEFyYlJlc3VsdHMocG9sb0J1eUF0LCBwb2xvU2VsbEF0LCBcIlBvbG9uaWV4XCIsIGJpbmFuY2VTZWxsQXQsIGJpbmFuY2VCdXlBdCwgXCJCaW5hbmNlXCIsIHBvbG9Na3ROYW1lLCByZXBvcnRpbmdUaW1lc3RhbXApO1xufVxuXG5cbmV4cG9ydCB7Y29tcGFyZVBvbG9uaWV4Q29pbmJhc2UsIGNvbXBhcmVBbGxQb2xvbmlleEJpdHRyZXgsIGNvbXBhcmVBbGxQb2xvbmlleEhpdGJ0YywgY29tcGFyZUFsbEJpdHRyZXhIaXRidGMsXG4gIGNvbXBhcmVBbGxQb2xvbmlleFlvYml0LCBpbnRlcm5hbENvbXBhcmVGb3JZb2JpdCwgY29tcGFyZUFsbFBvbG9uaWV4QmluYW5jZX07XG4iXX0=