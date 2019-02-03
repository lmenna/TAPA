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

var _sendEMail = require("./sendEMail");

var _dbUtils = require("./dbUtils");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

// Set this to be a clear trading opportunity
var arbEmailThresholdPercent = 1.25; // Set this to be the fees associated with trading

var arbReportingThresholdPercent = 0.0; // Control output to DB

var dbWriteEnabled = true; // Control reported output

var reportLoses = false; // mongoDB - Database and collection

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
/* poloMktFromBittrexName
 * desc: Converts a Bittrex crypto currency pair into the Poloniex pair.
 */


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

            if (arbPercent > arbReportingThresholdPercent) {
              dbOutput.gainLoss = "GAIN";
              dbOutput.tradeInstructions = "".concat(ccyPair, " BUY at ").concat(exch1Name, " for ").concat(exch1BuyAt.toFixed(9), ". SELL ").concat(exch2Name, " for ").concat(exch2SellAt.toFixed(9), " Gain ").concat(arbPercent.toFixed(6), "%");
              console.log(dbOutput.gainLoss, ": ", dbOutput.tradeInstructions);

              if (arbPercent > arbEmailThresholdPercent) {
                dbOutput.urgentTrade = true;
                (0, _sendEMail.SendMessage)("".concat(ccyPair, ": BUY at ").concat(exch1Name, " and SELL at ").concat(exch2Name), dbOutput.tradeInstructions);
              }
            } else {
              dbOutput.gainLoss = "LOSS";
              dbOutput.urgentTrade = false;
              dbOutput.tradeInstructions = "".concat(ccyPair, " BUY at ").concat(exch1Name, " for ").concat(exch1BuyAt.toFixed(9), " SELL ").concat(exch2Name, " for ").concat(exch2SellAt.toFixed(9), " Loss ").concat(arbPercent.toFixed(6), "%");

              if (reportLoses) {
                console.log("".concat(formatTimestamp(timeStamp), ": Pair: ").concat(ccyPair, ", Result: LOSS, Desc: BuyAt, ").concat(exch1BuyAt.toFixed(9), " is greater than ").concat(exch2Name, "SellAt, ").concat(exch2SellAt.toFixed(8), ". DIFF, ").concat(arbOpportunity.toFixed(7)));
              }
            }

            keyStr = "Buy" + exch1Name + "Sell" + exch2Name + ccyPair;
            key = {
              "key": keyStr
            };
            dbOutput.key = keyStr;

            if (!dbWriteEnabled) {
              _context.next = 31;
              break;
            }

            _context.next = 27;
            return (0, _dbUtils.updateResultsInMongo)(key, dbOutput, mongoDBName, mongoDBCollection);

          case 27:
            if (!dbOutput.urgentTrade) {
              _context.next = 31;
              break;
            }

            dbOutput.key += new Date().getTime();
            _context.next = 31;
            return (0, _dbUtils.writeResultsToMongoSync)(dbOutput, mongoDBName, mongoDBCollectionHist);

          case 31:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _outputArbResults.apply(this, arguments);
}

function poloMktFromBittrexName(bittrexMktName) {
  if (bittrexMktName === "BTC-XLM") return "BTC_STR";
  if (bittrexMktName === "USDT-XLM") return "USDT_STR";
  return bittrexMktName.replace("-", "_");
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

function internalCompareForYobit(_x9, _x10, _x11) {
  return _internalCompareForYobit.apply(this, arguments);
}

function _internalCompareForYobit() {
  _internalCompareForYobit = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2(mktData, yobitMarkets, baseMarkets) {
    var timeStamp, i, curMkt1, curMkt2, basePair, arbFraction, keyStr, dbOutput, key;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            timeStamp = new Date();
            i = 0;

          case 2:
            if (!(i < yobitMarkets.length)) {
              _context2.next = 19;
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
              _context2.next = 16;
              break;
            }

            _context2.next = 16;
            return (0, _dbUtils.updateResultsInMongo)(key, dbOutput, mongoDBName, mongoDBCollection);

          case 16:
            i++;
            _context2.next = 2;
            break;

          case 19:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));
  return _internalCompareForYobit.apply(this, arguments);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9jb21wYXJlUHJpY2luZ0RhdGEudHMiXSwibmFtZXMiOlsiYXJiRW1haWxUaHJlc2hvbGRQZXJjZW50IiwiYXJiUmVwb3J0aW5nVGhyZXNob2xkUGVyY2VudCIsImRiV3JpdGVFbmFibGVkIiwicmVwb3J0TG9zZXMiLCJtb25nb0RCTmFtZSIsIm1vbmdvREJDb2xsZWN0aW9uIiwibW9uZ29EQkNvbGxlY3Rpb25IaXN0IiwiZm9ybWF0VGltZXN0YW1wIiwidGltZVN0YW1wIiwidG9TdHJpbmciLCJzbGljZSIsImNvbXBhcmVQb2xvbmlleENvaW5iYXNlIiwicG9sb0RhdGEiLCJjYkRhdGEiLCJjb2luIiwicG9sb0pTT04iLCJKU09OIiwicGFyc2UiLCJleGNoYW5nZURhdGEiLCJjYkpTT04iLCJEYXRlIiwiY29uc29sZSIsImxvZyIsImdldFRpbWUiLCJjb21wYXJlQ3VycmVuY3lQYWlyIiwiY2N5MSIsImNjeTIiLCJwb2xvUGFpciIsInBvbG9CdXlBdCIsImxvd2VzdEFzayIsInBvbG9TZWxsQXQiLCJoaWdoZXN0QmlkIiwiY29pbmJhc2VTZWxsQXQiLCJiaWRzIiwiY29pbmJhc2VCdXlBdCIsImFza3MiLCJvdXRwdXRBcmJSZXN1bHRzIiwiY29tcGFyZUFsbFBvbG9uaWV4Qml0dHJleCIsImJpdHRyZXhKU09OIiwicmVwb3J0aW5nVGltZXN0YW1wIiwicG9sb0FsbE1hcmtldHMiLCJiaXR0cmV4TWt0IiwicG9sb01rdE5hbWUiLCJwb2xvTWt0RnJvbUJpdHRyZXhOYW1lIiwicG9sb01rdEVsZW1lbnQiLCJjb21wYXJlUG9sb25pZXhCaXR0cmV4TWt0RWxlbWVudCIsImJpdHRyZXhTZWxsQXQiLCJCaWQiLCJiaXR0cmV4QnV5QXQiLCJBc2siLCJleGNoMUJ1eUF0IiwiZXhjaDFTZWxsQXQiLCJleGNoMU5hbWUiLCJleGNoMlNlbGxBdCIsImV4Y2gyQnV5QXQiLCJleGNoMk5hbWUiLCJjY3lQYWlyIiwiZGJPdXRwdXQiLCJrZXkiLCJnYWluTG9zcyIsInVyZ2VudFRyYWRlIiwiYXJiUGVyY2VudCIsImV4Y2gxQnV5T3JTZWxsIiwidHJhZGVJbnN0cnVjdGlvbnMiLCJ0aW1lIiwiTWF0aCIsInJvdW5kIiwiYXJiT3Bwb3J0dW5pdHkiLCJ0b0ZpeGVkIiwia2V5U3RyIiwiYml0dHJleE1rdE5hbWUiLCJyZXBsYWNlIiwiY29tcGFyZUFsbFBvbG9uaWV4SGl0YnRjIiwiaGl0YnRjSlNPTiIsImhpdGJ0Y01rdCIsInBvbG9Na3RGcm9tSGl0YnRjTmFtZSIsImNvbXBhcmVQb2xvbmlleEhpdGJ0Y01rdEVsZW1lbnQiLCJoaXRidGNNa3RFbGVtZW50IiwiaGl0YnRjU2VsbEF0IiwiYmlkIiwiaGl0YnRjQnV5QXQiLCJhc2siLCJoaXRidGNNa3ROYW1lIiwicG9sb01rdE5hbWVzIiwiQkNOQlRDIiwiREFTSEJUQyIsIkRPR0VCVEMiLCJFVEhCVEMiLCJMU0tCVEMiLCJMVENCVEMiLCJOWFRCVEMiLCJTQkRCVEMiLCJTQ0JUQyIsIlNURUVNQlRDIiwiWEVNQlRDIiwiWE1SQlRDIiwiQVJEUkJUQyIsIlpFQ0JUQyIsIk1BSURCVEMiLCJSRVBCVEMiLCJFVENCVEMiLCJCTlRCVEMiLCJTTlRFVEgiLCJPTUdFVEgiLCJFVENFVEgiLCJaRUNFVEgiLCJYUlBCVEMiLCJTVFJBVEJUQyIsIkVPU0VUSCIsIkVPU0JUQyIsIkJOVEVUSCIsIlpSWEJUQyIsIlpSWEVUSCIsIlBQQ0JUQyIsIlFUVU1FVEgiLCJER0JCVEMiLCJPTUdCVEMiLCJTTlRCVEMiLCJYUlBVU0RUIiwiTUFOQUVUSCIsIk1BTkFCVEMiLCJRVFVNQlRDIiwiTFNLRVRIIiwiUkVQRVRIIiwiUkVQVVNEVCIsIkdOVEJUQyIsIkdOVEVUSCIsIkJUU0JUQyIsIkJBVEJUQyIsIkJBVEVUSCIsIkJDSEFCQ0JUQyIsIkJDSFNWQlRDIiwiTk1SQlRDIiwiUE9MWUJUQyIsIlNUT1JKQlRDIiwiY29tcGFyZUFsbEJpdHRyZXhIaXRidGMiLCJiaXR0cmV4VGltZXN0YW1wIiwiYml0dHJleEFsbE1hcmtldHMiLCJyZXN1bHQiLCJoaXRidGNUaW1lc3RhbXAiLCJoaXRidGNBbGxNYXJrZXRzIiwiZm9yRWFjaCIsImJpdHRyZXhNa3RFbGVtIiwiaGl0QnRjTWt0RnJvbUJpdHRyZXhOYW1lIiwiTWFya2V0TmFtZSIsImZpbHRlciIsIml0ZW0iLCJzeW1ib2wiLCJsZW5ndGgiLCJiYWRNYWtlcnRzIiwiaW5jbHVkZXMiLCJjb21wYXJlQml0dHJleEhpdGJ0Y01rdEVsZW1lbnQiLCJiaXR0cmV4TWt0RWxlbWVudCIsInNwbGl0VGlja2VyIiwic3BsaXQiLCJjb21wYXJlQWxsUG9sb25pZXhZb2JpdCIsInlvYml0RGF0YSIsInBvbG9UaW1lc3RhbXAiLCJ5b2JpdFRpbWVzdGFtcCIsInlvYml0QWxsTWFya2V0cyIsInlvYml0TWt0IiwicG9sb01rdEZyb21Zb2JpdE5hbWUiLCJjb21wYXJlUG9sb25pZXhZb2JpdE1rdEVsZW1lbnQiLCJ5b2JpdE1rdEVsZW1lbnQiLCJ5b2JpdFNlbGxBdCIsInNlbGwiLCJ5b2JpdEJ1eUF0IiwiYnV5IiwieW9iaXRNa3ROYW1lIiwibHRjX2J0YyIsIm5tY19idGMiLCJubXJfYnRjIiwiZXRoX2J0YyIsImludGVybmFsQ29tcGFyZUZvcllvYml0IiwibWt0RGF0YSIsInlvYml0TWFya2V0cyIsImJhc2VNYXJrZXRzIiwiaSIsImN1ck1rdDEiLCJjdXJNa3QyIiwiYmFzZVBhaXIiLCJhcmJGcmFjdGlvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBS0E7O0FBQ0E7Ozs7OztBQUVBO0FBQ0EsSUFBTUEsd0JBQXdCLEdBQUcsSUFBakMsQyxDQUNBOztBQUNBLElBQU1DLDRCQUE0QixHQUFHLEdBQXJDLEMsQ0FDQTs7QUFDQSxJQUFJQyxjQUFjLEdBQUcsSUFBckIsQyxDQUNBOztBQUNBLElBQUlDLFdBQVcsR0FBRyxLQUFsQixDLENBQ0E7O0FBQ0EsSUFBTUMsV0FBVyxHQUFHLFFBQXBCO0FBQ0EsSUFBTUMsaUJBQWlCLEdBQUcscUJBQTFCO0FBQ0EsSUFBTUMscUJBQXFC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SSxTQW5CYztBQW9CeEJDLElBQUFBLE1BQU0sRUFBSSxTQXBCYztBQXFCeEJDLElBQUFBLE1BQU0sRUFBSSxTQXJCYztBQXNCeEJDLElBQUFBLE1BQU0sRUFBSSxTQXRCYztBQXVCeEJDLElBQUFBLE1BQU0sRUFBSSxTQXZCYztBQXdCeEJDLElBQUFBLFFBQVEsRUFBSSxXQXhCWTtBQXlCeEJDLElBQUFBLE1BQU0sRUFBSSxTQXpCYztBQTBCeEJDLElBQUFBLE1BQU0sRUFBSSxTQTFCYztBQTJCeEJDLElBQUFBLE1BQU0sRUFBSSxTQTNCYztBQTRCeEJDLElBQUFBLE1BQU0sRUFBSSxTQTVCYztBQTZCeEJDLElBQUFBLE1BQU0sRUFBSSxTQTdCYztBQThCeEJDLElBQUFBLE1BQU0sRUFBSSxTQTlCYztBQStCeEJDLElBQUFBLE9BQU8sRUFBSSxVQS9CYTtBQWdDeEJDLElBQUFBLE1BQU0sRUFBSSxTQWhDYztBQWlDeEJDLElBQUFBLE1BQU0sRUFBSSxTQWpDYztBQWtDeEJDLElBQUFBLE1BQU0sRUFBSSxTQWxDYztBQW1DeEJDLElBQUFBLE9BQU8sRUFBSSxVQW5DYTtBQW9DeEJDLElBQUFBLE9BQU8sRUFBSSxVQXBDYTtBQXFDeEJDLElBQUFBLE9BQU8sRUFBSSxVQXJDYTtBQXNDeEJDLElBQUFBLE9BQU8sRUFBSSxVQXRDYTtBQXVDeEJDLElBQUFBLE1BQU0sRUFBSSxTQXZDYztBQXdDeEJDLElBQUFBLE1BQU0sRUFBSSxTQXhDYztBQXlDeEJDLElBQUFBLE9BQU8sRUFBSSxVQXpDYTtBQTBDeEJDLElBQUFBLE1BQU0sRUFBSSxTQTFDYztBQTJDeEJDLElBQUFBLE1BQU0sRUFBSSxTQTNDYztBQTRDeEJDLElBQUFBLE1BQU0sRUFBSSxTQTVDYztBQTZDeEJDLElBQUFBLE1BQU0sRUFBSSxTQTdDYztBQThDeEJDLElBQUFBLE1BQU0sRUFBSSxTQTlDYztBQStDeEJDLElBQUFBLFNBQVMsRUFBSSxZQS9DVztBQWdEeEJDLElBQUFBLFFBQVEsRUFBSSxXQWhEWTtBQWlEeEJDLElBQUFBLE1BQU0sRUFB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cUNtQjtBQUNiLHFCQUFPVztBQURNLGFBckNuQjs7QUFBQSxpQkF3Q1FuRSxjQXhDUjtBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUFBLG1CQXlDWSxtQ0FBcUJ3RCxHQUFyQixFQUEwQkQsUUFBMUIsRUFBb0NyRCxXQUFwQyxFQUFpREMsaUJBQWpELENBekNaOztBQUFBO0FBR3NDNEssWUFBQUEsQ0FBQyxFQUh2QztBQUFBO0FBQUE7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGNvbXBhcmVQcmljaW5nRGF0YS5qc1xuICogQ29uc29saWRhdGVzIGZ1bmN0aW9uIHRvIGNvbXBhcmUgY3J5cHRvIG1hcmtldHMgbG9va2luZyBmb3Igc2lnbmlmaWNhbnQgYXJiaXRyYWdlIG9wcG9ydHVuaXRpZXMuXG4gKiBTZW5kcyBub3RpZmljYXRpb25zIHdoZW4gbGFyZ2UgYXJiaXRyYWdlIGlzIGRldGVjdGVkLlxuICovXG5cbmltcG9ydCB7U2VuZE1lc3NhZ2V9IGZyb20gXCIuL3NlbmRFTWFpbFwiO1xuaW1wb3J0IHt1cGRhdGVSZXN1bHRzSW5Nb25nbywgd3JpdGVSZXN1bHRzVG9Nb25nb1N5bmN9IGZyb20gXCIuL2RiVXRpbHNcIjtcblxuLy8gU2V0IHRoaXMgdG8gYmUgYSBjbGVhciB0cmFkaW5nIG9wcG9ydHVuaXR5XG5jb25zdCBhcmJFbWFpbFRocmVzaG9sZFBlcmNlbnQgPSAxLjI1O1xuLy8gU2V0IHRoaXMgdG8gYmUgdGhlIGZlZXMgYXNzb2NpYXRlZCB3aXRoIHRyYWRpbmdcbmNvbnN0IGFyYlJlcG9ydGluZ1RocmVzaG9sZFBlcmNlbnQgPSAwLjA7XG4vLyBDb250cm9sIG91dHB1dCB0byBEQlxubGV0IGRiV3JpdGVFbmFibGVkID0gdHJ1ZTtcbi8vIENvbnRyb2wgcmVwb3J0ZWQgb3V0cHV0XG5sZXQgcmVwb3J0TG9zZXMgPSBmYWxzZTtcbi8vIG1vbmdvREIgLSBEYXRhYmFzZSBhbmQgY29sbGVjdGlvblxuY29uc3QgbW9uZ29EQk5hbWUgPSBcImNyeXB0b1wiO1xuY29uc3QgbW9uZ29EQkNvbGxlY3Rpb24gPSBcIm1hcmtldGRhdGEuYXJibW9uLXBcIjtcbmNvbnN0IG1vbmdvREJDb2xsZWN0aW9uSGlzdCA9IFwibWFya2V0ZGF0YS5hcmJtb25oaXN0LXBcIjtcblxuLyogZm9ybWF0VGltZXN0YW1wXG4gKiBkZXNjOiBTaW1wbGUgdXRpbGl0eSB0byB0cnVuY2F0ZSB0aGUgb3V0cHV0IG9mIGxvbmcgdGltZSBzdGFtcHMgdG8gaW5jbHVkZSBvbmx5IHRoZSBkYXRlIGFuZCB0aW1lIHBhcnRzLlxuICovXG5mdW5jdGlvbiBmb3JtYXRUaW1lc3RhbXAodGltZVN0YW1wOiBEYXRlKSB7XG4gIHJldHVybih0aW1lU3RhbXAudG9TdHJpbmcoKS5zbGljZSgwLDI1KSk7XG59XG5cbi8qIGNvbXBhcmVQb2xvbmlleENvaW5iYXNlXG4gKiBkZXNjOiBNYWluIGZ1bmN0aW9uIGNhbGxlZCB0byBjb21wYXJlIHRoZSBQb2xvbmlleCBhbmQgQ29pbmJhc2UgY3J5cHRvIG1hcmtldHMuXG4gKiAgICAgICBUaGlzIGZ1bmN0aW9uIGlzIGV4cG9ydGVkIGFuZCBjYWxsZWQgYmUgYXBwLmpzXG4gKi9cbmZ1bmN0aW9uIGNvbXBhcmVQb2xvbmlleENvaW5iYXNlKHBvbG9EYXRhOiBhbnksIGNiRGF0YTogYW55LCBjb2luOiBzdHJpbmcpIHtcblxuICB2YXIgcG9sb0pTT04gPSBKU09OLnBhcnNlKHBvbG9EYXRhLmV4Y2hhbmdlRGF0YSk7XG4gIHZhciBjYkpTT04gPSBKU09OLnBhcnNlKGNiRGF0YS5leGNoYW5nZURhdGEpO1xuICBsZXQgdGltZVN0YW1wID0gbmV3IERhdGUoKTtcbiAgY29uc29sZS5sb2coYCR7Zm9ybWF0VGltZXN0YW1wKHRpbWVTdGFtcCl9OiBQb2xvVGltZS1DQlRpbWU6ICR7cG9sb0RhdGEudGltZVN0YW1wLmdldFRpbWUoKS1jYkRhdGEudGltZVN0YW1wLmdldFRpbWUoKX0uYCk7XG4gIGNvbXBhcmVDdXJyZW5jeVBhaXIodGltZVN0YW1wLCBwb2xvSlNPTiwgY2JKU09OLCBcIlVTRENcIiwgY29pbilcbn1cblxuLyogY29tcGFyZUN1cnJlbmN5UGFpclxuICogZGVzYzogQ29tcGFyZXMgYSBjdXJyZW5jeSBwYWlyIGJldHdlZW4gUG9sb25pZXggYW5kIENvaW5iYXNlLiAgTm90aWZpZXMgd2hlbiBzaWduaWZpY2FudCBhcmJpdHJhZ2Ugb3Bwb3J0dW5pdGllc1xuICogICAgICAgb2NjdXIuXG4gKi9cbmZ1bmN0aW9uIGNvbXBhcmVDdXJyZW5jeVBhaXIodGltZVN0YW1wOiBEYXRlLCBwb2xvSlNPTjogYW55LCBjYkpTT046IGFueSwgY2N5MTogc3RyaW5nLCBjY3kyOiBzdHJpbmcpIHtcbiAgbGV0IHBvbG9QYWlyID0gY2N5MStcIl9cIitjY3kyO1xuICBsZXQgcG9sb0J1eUF0ID0gK3BvbG9KU09OW3BvbG9QYWlyXS5sb3dlc3RBc2s7XG4gIGxldCBwb2xvU2VsbEF0ID0gK3BvbG9KU09OW3BvbG9QYWlyXS5oaWdoZXN0QmlkO1xuICBsZXQgY29pbmJhc2VTZWxsQXQgPSArY2JKU09OLmJpZHNbMF1bMF07XG4gIGxldCBjb2luYmFzZUJ1eUF0ID0gK2NiSlNPTi5hc2tzWzBdWzBdO1xuICBvdXRwdXRBcmJSZXN1bHRzKHBvbG9CdXlBdCwgcG9sb1NlbGxBdCwgXCJQb2xvbmlleFwiLCBjb2luYmFzZVNlbGxBdCwgY29pbmJhc2VCdXlBdCwgXCJDb2luYmFzZVwiLCBwb2xvUGFpciwgdGltZVN0YW1wKTtcbiB9XG5cbiAvKiBjb21wYXJlQWxsUG9sb25pZXhCaXR0cmV4XG4gICogZGVzYzogVGFrZXMgdGhlIHBvbG9uaWV4IGFuZCBiaXR0cmV4IGRhdGEgaW4gSlNPTiBmb3JtYXQgYW5kIGNvbXBhcmVzIGFsbCBvdmVybGFwaW5nIG1hcmtldHMgZm9yIGFyYml0cmFnZS5cbiAgKiAgICAgICBFeHBvcnRlZCBmdW5jdGlvbiBjYWxsZWQgYnkgdGhlIG1haW4gYXBwLmpzXG4gICovXG5mdW5jdGlvbiBjb21wYXJlQWxsUG9sb25pZXhCaXR0cmV4KHBvbG9KU09OOiBhbnksIGJpdHRyZXhKU09OOiBhbnkpIHtcblxuICBsZXQgcmVwb3J0aW5nVGltZXN0YW1wID0gbmV3IERhdGUoKTtcbiAgbGV0IHBvbG9BbGxNYXJrZXRzID0gSlNPTi5wYXJzZShwb2xvSlNPTi5leGNoYW5nZURhdGEpO1xuICBmb3IobGV0IGJpdHRyZXhNa3QgaW4gYml0dHJleEpTT04uZXhjaGFuZ2VEYXRhKXtcbiAgICBsZXQgcG9sb01rdE5hbWUgPSBwb2xvTWt0RnJvbUJpdHRyZXhOYW1lKGJpdHRyZXhNa3QpO1xuICAgIGxldCBwb2xvTWt0RWxlbWVudCA9IHBvbG9BbGxNYXJrZXRzW3BvbG9Na3ROYW1lXTtcbiAgICBpZighcG9sb01rdEVsZW1lbnQpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiUG9sbyBtYXJrZXQgZm9yIFwiLCBiaXR0cmV4TWt0LCBcIiBkb2Vzbid0IGV4aXN0LlwiKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjb21wYXJlUG9sb25pZXhCaXR0cmV4TWt0RWxlbWVudChwb2xvTWt0RWxlbWVudCwgYml0dHJleEpTT04uZXhjaGFuZ2VEYXRhW2JpdHRyZXhNa3RdLCBwb2xvTWt0TmFtZSwgcmVwb3J0aW5nVGltZXN0YW1wKVxuICAgIH1cbiAgfVxufVxuXG4vKiBjb21wYXJlUG9sb25pZXhCaXR0cmV4TWt0RWxlbWVudFxuICogZGVzYzogQ29tcGFyZXMgYSBwYXJ0aWN1bGFyIG1hcmtldCBiZXR3ZWVuIHRoZSBQb2xvbmlleCBhbmQgQml0dHJleCBleGNoYW5nZXMuICBTZWRuIG5vdGlmaWNhdGlvbnMgd2hlblxuICogICAgICAgc2lnbmlmaWNhbnQgYXJiaXRyYWdlIG9wcG9ydHVuaXRpZXMgZXhpc3QuXG4gKi9cbmZ1bmN0aW9uIGNvbXBhcmVQb2xvbmlleEJpdHRyZXhNa3RFbGVtZW50KHBvbG9KU09OOiBhbnksIGJpdHRyZXhKU09OOiBhbnksIHBvbG9QYWlyOiBzdHJpbmcsIHRpbWVTdGFtcDogRGF0ZSkge1xuXG4gIGxldCBwb2xvQnV5QXQgPSArcG9sb0pTT04ubG93ZXN0QXNrO1xuICBsZXQgcG9sb1NlbGxBdCA9ICtwb2xvSlNPTi5oaWdoZXN0QmlkO1xuICBsZXQgYml0dHJleFNlbGxBdCA9ICtiaXR0cmV4SlNPTi5CaWQ7XG4gIGxldCBiaXR0cmV4QnV5QXQgPSArYml0dHJleEpTT04uQXNrO1xuICBvdXRwdXRBcmJSZXN1bHRzKHBvbG9CdXlBdCwgcG9sb1NlbGxBdCwgXCJQb2xvbmlleFwiLCBiaXR0cmV4U2VsbEF0LCBiaXR0cmV4QnV5QXQsIFwiQml0dHJleFwiLCBwb2xvUGFpciwgdGltZVN0YW1wKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gb3V0cHV0QXJiUmVzdWx0cyhleGNoMUJ1eUF0OiBudW1iZXIsIGV4Y2gxU2VsbEF0OiBudW1iZXIsIGV4Y2gxTmFtZTogc3RyaW5nLCBcbiAgZXhjaDJTZWxsQXQ6IG51bWJlciwgZXhjaDJCdXlBdDogbnVtYmVyLCBleGNoMk5hbWU6IHN0cmluZywgXG4gIGNjeVBhaXI6IHN0cmluZywgdGltZVN0YW1wOiBEYXRlKSB7XG5cbiAgbGV0IGRiT3V0cHV0ID0ge1xuICAgIGtleTogXCJcIixcbiAgICBleGNoMU5hbWUsXG4gICAgZXhjaDJOYW1lLFxuICAgIHRpbWVTdGFtcDogdGltZVN0YW1wLnRvU3RyaW5nKCkuc2xpY2UoMCwyNSksXG4gICAgY2N5UGFpcixcbiAgICBleGNoMUJ1eUF0LFxuICAgIGV4Y2gxU2VsbEF0LFxuICAgIGV4Y2gyQnV5QXQsXG4gICAgZXhjaDJTZWxsQXQsXG4gICAgZ2Fpbkxvc3M6IFwiTE9TU1wiLFxuICAgIHVyZ2VudFRyYWRlOiBmYWxzZSxcbiAgICBhcmJQZXJjZW50OiAwLFxuICAgIGV4Y2gxQnV5T3JTZWxsOiBcIlwiLFxuICAgIHRyYWRlSW5zdHJ1Y3Rpb25zOiBcIlwiLFxuICAgIHRpbWU6IE1hdGgucm91bmQobmV3IERhdGUoKS5nZXRUaW1lKCkvMTAwMClcbiAgfTtcbiAvLyBDaGVjayBmb3IgY2FzZSBvZiBCdXkgYXQgRXhjaGFuZ2UyIGFuZCBTZWxsIGF0IEV4Y2hhbmdlMVxuICBsZXQgYXJiT3Bwb3J0dW5pdHkgPSBleGNoMVNlbGxBdC1leGNoMkJ1eUF0O1xuICBsZXQgYXJiUGVyY2VudCA9IDEwMCooZXhjaDFTZWxsQXQtZXhjaDJCdXlBdCkvKCAoZXhjaDFTZWxsQXQrZXhjaDJCdXlBdCkgLyAyKTtcbiAgZGJPdXRwdXQuYXJiUGVyY2VudCA9IGFyYlBlcmNlbnQ7XG4gIGRiT3V0cHV0LmV4Y2gxQnV5T3JTZWxsID0gXCJTZWxsXCI7XG4gIGlmKGFyYlBlcmNlbnQgPiBhcmJSZXBvcnRpbmdUaHJlc2hvbGRQZXJjZW50KSB7XG4gICAgZGJPdXRwdXQuZ2Fpbkxvc3MgPSBcIkdBSU5cIjtcbiAgICBkYk91dHB1dC50cmFkZUluc3RydWN0aW9ucyA9IGAke2NjeVBhaXJ9IEJVWSBhdCAke2V4Y2gyTmFtZX0gZm9yICR7ZXhjaDJCdXlBdC50b0ZpeGVkKDkpfS4gU0VMTCBhdCAke2V4Y2gxTmFtZX0gZm9yICR7ZXhjaDFTZWxsQXQudG9GaXhlZCg5KX0gR2FpbiAke2FyYlBlcmNlbnQudG9GaXhlZCg2KX0lYDtcbiAgICBjb25zb2xlLmxvZyhkYk91dHB1dC5nYWluTG9zcywgXCI6IFwiLCBkYk91dHB1dC50cmFkZUluc3RydWN0aW9ucyk7XG4gICAgaWYgKGFyYlBlcmNlbnQgPiBhcmJFbWFpbFRocmVzaG9sZFBlcmNlbnQpIHtcbiAgICAgIGRiT3V0cHV0LnVyZ2VudFRyYWRlID0gdHJ1ZTtcbiAgICAgIFNlbmRNZXNzYWdlKGAke2NjeVBhaXJ9OiBCVVkgYXQgJHtleGNoMk5hbWV9IGFuZCBTRUxMIGF0ICR7ZXhjaDFOYW1lfWAsIGRiT3V0cHV0LnRyYWRlSW5zdHJ1Y3Rpb25zKTtcbiAgICB9XG4gIH1cbiAgZWxzZSB7IFxuICAgIGRiT3V0cHV0LmdhaW5Mb3NzID0gXCJMT1NTXCI7XG4gICAgZGJPdXRwdXQudXJnZW50VHJhZGUgPSBmYWxzZTtcbiAgICBkYk91dHB1dC50cmFkZUluc3RydWN0aW9ucyA9IGAke2NjeVBhaXJ9IEJVWSBhdCAke2V4Y2gyTmFtZX0gZm9yICR7ZXhjaDJCdXlBdC50b0ZpeGVkKDkpfS4gU0VMTCBhdCAke2V4Y2gxTmFtZX0gZm9yICR7ZXhjaDFTZWxsQXQudG9GaXhlZCg5KX0gTG9zcyAke2FyYlBlcmNlbnQudG9GaXhlZCg2KX0lYDtcbiAgICBpZiAocmVwb3J0TG9zZXMpIHtcbiAgICAgIGNvbnNvbGUubG9nKGAke2Zvcm1hdFRpbWVzdGFtcCh0aW1lU3RhbXApfTogUGFpcjogJHtjY3lQYWlyfSwgUmVzdWx0OiBMT1NTLCBEZXNjOiAke2V4Y2gyTmFtZX0sICR7ZXhjaDJCdXlBdC50b0ZpeGVkKDgpfSBpcyBncmVhdGVyIHRoYW4gU2VsbEF0LCAke2V4Y2gxU2VsbEF0LnRvRml4ZWQoOCl9LCBESUZGLCAke2FyYk9wcG9ydHVuaXR5LnRvRml4ZWQoNil9YCk7XG4gICAgfVxuICB9XG4gIGxldCBrZXlTdHIgPSBcIkJ1eVwiK2V4Y2gyTmFtZStcIlNlbGxcIitleGNoMU5hbWUrY2N5UGFpcjtcbiAgbGV0IGtleSA9IHtcbiAgICBcImtleVwiOiBrZXlTdHJcbiAgfTtcbiAgZGJPdXRwdXQua2V5ID0ga2V5U3RyO1xuICBpZiAoZGJXcml0ZUVuYWJsZWQpIHtcbiAgICBhd2FpdCB1cGRhdGVSZXN1bHRzSW5Nb25nbyhrZXksIGRiT3V0cHV0LCBtb25nb0RCTmFtZSwgbW9uZ29EQkNvbGxlY3Rpb24pO1xuICAgIGlmIChkYk91dHB1dC51cmdlbnRUcmFkZSkge1xuICAgICAgZGJPdXRwdXQua2V5ICs9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICBhd2FpdCB3cml0ZVJlc3VsdHNUb01vbmdvU3luYyhkYk91dHB1dCwgbW9uZ29EQk5hbWUsIG1vbmdvREJDb2xsZWN0aW9uSGlzdCk7XG4gICAgfVxuICB9XG4gIC8vIENoZWNrIGZvciBjYXNlIG9mIEJ1eSBhdCBFeGNoYW5nZTEgYW5kIFNlbGwgYXQgRXhjaGFuZ2UyXG4gIGFyYk9wcG9ydHVuaXR5ID0gZXhjaDJTZWxsQXQtZXhjaDFCdXlBdDtcbiAgYXJiUGVyY2VudCA9IDEwMCooZXhjaDJTZWxsQXQtZXhjaDFCdXlBdCkvKCAoZXhjaDJTZWxsQXQrZXhjaDFCdXlBdCkgLyAyKTtcbiAgZGJPdXRwdXQuYXJiUGVyY2VudCA9IGFyYlBlcmNlbnQ7XG4gIGRiT3V0cHV0LmV4Y2gxQnV5T3JTZWxsID0gXCJCdXlcIjtcbiAgaWYoYXJiUGVyY2VudCA+IGFyYlJlcG9ydGluZ1RocmVzaG9sZFBlcmNlbnQpIHsgICAgXG4gICAgZGJPdXRwdXQuZ2Fpbkxvc3MgPSBcIkdBSU5cIjtcbiAgICBkYk91dHB1dC50cmFkZUluc3RydWN0aW9ucyA9IGAke2NjeVBhaXJ9IEJVWSBhdCAke2V4Y2gxTmFtZX0gZm9yICR7ZXhjaDFCdXlBdC50b0ZpeGVkKDkpfS4gU0VMTCAke2V4Y2gyTmFtZX0gZm9yICR7ZXhjaDJTZWxsQXQudG9GaXhlZCg5KX0gR2FpbiAke2FyYlBlcmNlbnQudG9GaXhlZCg2KX0lYDtcbiAgICBjb25zb2xlLmxvZyhkYk91dHB1dC5nYWluTG9zcywgXCI6IFwiLCBkYk91dHB1dC50cmFkZUluc3RydWN0aW9ucyk7XG4gICAgaWYgKGFyYlBlcmNlbnQgPiBhcmJFbWFpbFRocmVzaG9sZFBlcmNlbnQpIHtcbiAgICAgIGRiT3V0cHV0LnVyZ2VudFRyYWRlID0gdHJ1ZTtcbiAgICAgIFNlbmRNZXNzYWdlKGAke2NjeVBhaXJ9OiBCVVkgYXQgJHtleGNoMU5hbWV9IGFuZCBTRUxMIGF0ICR7ZXhjaDJOYW1lfWAsIGRiT3V0cHV0LnRyYWRlSW5zdHJ1Y3Rpb25zKTtcbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgZGJPdXRwdXQuZ2Fpbkxvc3MgPSBcIkxPU1NcIjtcbiAgICBkYk91dHB1dC51cmdlbnRUcmFkZSA9IGZhbHNlO1xuICAgIGRiT3V0cHV0LnRyYWRlSW5zdHJ1Y3Rpb25zID0gYCR7Y2N5UGFpcn0gQlVZIGF0ICR7ZXhjaDFOYW1lfSBmb3IgJHtleGNoMUJ1eUF0LnRvRml4ZWQoOSl9IFNFTEwgJHtleGNoMk5hbWV9IGZvciAke2V4Y2gyU2VsbEF0LnRvRml4ZWQoOSl9IExvc3MgJHthcmJQZXJjZW50LnRvRml4ZWQoNil9JWA7XG4gICAgaWYgKHJlcG9ydExvc2VzKSB7XG4gICAgICBjb25zb2xlLmxvZyhgJHtmb3JtYXRUaW1lc3RhbXAodGltZVN0YW1wKX06IFBhaXI6ICR7Y2N5UGFpcn0sIFJlc3VsdDogTE9TUywgRGVzYzogQnV5QXQsICR7ZXhjaDFCdXlBdC50b0ZpeGVkKDkpfSBpcyBncmVhdGVyIHRoYW4gJHtleGNoMk5hbWV9U2VsbEF0LCAke2V4Y2gyU2VsbEF0LnRvRml4ZWQoOCl9LiBESUZGLCAke2FyYk9wcG9ydHVuaXR5LnRvRml4ZWQoNyl9YCk7XG4gICAgfVxuICB9XG4gIGtleVN0ciA9IFwiQnV5XCIrZXhjaDFOYW1lK1wiU2VsbFwiK2V4Y2gyTmFtZStjY3lQYWlyO1xuICBrZXkgPSB7XG4gICAgXCJrZXlcIjoga2V5U3RyXG4gIH07XG4gIGRiT3V0cHV0LmtleSA9IGtleVN0cjtcbiAgaWYgKGRiV3JpdGVFbmFibGVkKSB7XG4gICAgYXdhaXQgdXBkYXRlUmVzdWx0c0luTW9uZ28oa2V5LCBkYk91dHB1dCwgbW9uZ29EQk5hbWUsIG1vbmdvREJDb2xsZWN0aW9uKTtcbiAgICBpZiAoZGJPdXRwdXQudXJnZW50VHJhZGUpIHtcbiAgICAgIGRiT3V0cHV0LmtleSArPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgIGF3YWl0IHdyaXRlUmVzdWx0c1RvTW9uZ29TeW5jKGRiT3V0cHV0LCBtb25nb0RCTmFtZSwgbW9uZ29EQkNvbGxlY3Rpb25IaXN0KTtcbiAgICB9XG4gIH1cbn1cblxuLyogcG9sb01rdEZyb21CaXR0cmV4TmFtZVxuICogZGVzYzogQ29udmVydHMgYSBCaXR0cmV4IGNyeXB0byBjdXJyZW5jeSBwYWlyIGludG8gdGhlIFBvbG9uaWV4IHBhaXIuXG4gKi9cbmZ1bmN0aW9uIHBvbG9Na3RGcm9tQml0dHJleE5hbWUoYml0dHJleE1rdE5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmKGJpdHRyZXhNa3ROYW1lPT09XCJCVEMtWExNXCIpXG4gICAgcmV0dXJuKFwiQlRDX1NUUlwiKTtcbiAgaWYoYml0dHJleE1rdE5hbWU9PT1cIlVTRFQtWExNXCIpXG4gICAgcmV0dXJuKFwiVVNEVF9TVFJcIik7ICAgIFxuICByZXR1cm4oYml0dHJleE1rdE5hbWUucmVwbGFjZShcIi1cIiwgXCJfXCIpKTtcbn1cblxuLyogY29tcGFyZUFsbFBvbG9uaWV4SGl0YnRjXG4qICBkZXNjOiBUYWtlcyB0aGUgcG9sb25pZXggYW5kIGhpdGJ0YyBkYXRhIGluIEpTT04gZm9ybWF0IGFuZCBjb21wYXJlcyBhbGwgb3ZlcmxhcGluZyBtYXJrZXRzIGZvciBhcmJpdHJhZ2UuXG4qICAgICAgIEV4cG9ydGVkIGZ1bmN0aW9uIGNhbGxlZCBieSB0aGUgbWFpbiBhcHAuanNcbiovXG5mdW5jdGlvbiBjb21wYXJlQWxsUG9sb25pZXhIaXRidGMocG9sb0pTT046IGFueSwgaGl0YnRjSlNPTjogYW55KSB7XG4gIFxuICBsZXQgcmVwb3J0aW5nVGltZXN0YW1wID0gbmV3IERhdGUoKTtcbiAgbGV0IHBvbG9BbGxNYXJrZXRzID0gSlNPTi5wYXJzZShwb2xvSlNPTi5leGNoYW5nZURhdGEpO1xuICBmb3IobGV0IGhpdGJ0Y01rdCBpbiBoaXRidGNKU09OLmV4Y2hhbmdlRGF0YSl7XG4gICAgbGV0IHBvbG9Na3ROYW1lID0gcG9sb01rdEZyb21IaXRidGNOYW1lKGhpdGJ0Y01rdCk7XG4gICAgbGV0IHBvbG9Na3RFbGVtZW50ID0gcG9sb0FsbE1hcmtldHNbcG9sb01rdE5hbWVdO1xuICAgIGNvbXBhcmVQb2xvbmlleEhpdGJ0Y01rdEVsZW1lbnQocG9sb01rdEVsZW1lbnQsIGhpdGJ0Y0pTT04uZXhjaGFuZ2VEYXRhW2hpdGJ0Y01rdF0sIHBvbG9Na3ROYW1lLCByZXBvcnRpbmdUaW1lc3RhbXApO1xuICB9XG59XG5cbi8qIGNvbXBhcmVQb2xvbmlleEhpdGJ0Y01rdEVsZW1lbnRcbiAqIGRlc2M6IFB1bGxzIG91dCB0aGUgYnV5IGFuZCBzZWxsIHByaWNlcyBmb3IgYSBzaW5nbGUgY3VycmVuY3kgcGFpciBmb3IgUG9sb25pZXggYW5kIEhpdGJ0Yy5cbiAqICAgICAgIEZvcndhcmRzIHRoaXMgdG8gdGhlIG91dHB1dCBtZXRob2QgdG8gcmVjb3JkIHRoZSBhcmJpdHJhZ2UgcmVzdWx0cy5cbiAqL1xuZnVuY3Rpb24gY29tcGFyZVBvbG9uaWV4SGl0YnRjTWt0RWxlbWVudChwb2xvTWt0RWxlbWVudDogYW55LCBoaXRidGNNa3RFbGVtZW50OiBhbnksIHBvbG9Na3ROYW1lOiBzdHJpbmcsIHJlcG9ydGluZ1RpbWVzdGFtcDogRGF0ZSkge1xuXG4gIGxldCBwb2xvQnV5QXQgPSArcG9sb01rdEVsZW1lbnQubG93ZXN0QXNrO1xuICBsZXQgcG9sb1NlbGxBdCA9ICtwb2xvTWt0RWxlbWVudC5oaWdoZXN0QmlkO1xuICBsZXQgaGl0YnRjU2VsbEF0ID0gK2hpdGJ0Y01rdEVsZW1lbnQuYmlkO1xuICBsZXQgaGl0YnRjQnV5QXQgPSAraGl0YnRjTWt0RWxlbWVudC5hc2s7XG4gIGlmICghaGl0YnRjU2VsbEF0IHx8ICFoaXRidGNCdXlBdCkge1xuICAgIGNvbnNvbGUubG9nKFwiR290IGJhZCByYXRlcyBmcm9tIHRoZSBoaXRidGMgZm9yOlwiLCBwb2xvTWt0TmFtZSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIG91dHB1dEFyYlJlc3VsdHMocG9sb0J1eUF0LCBwb2xvU2VsbEF0LCBcIlBvbG9uaWV4XCIsIGhpdGJ0Y1NlbGxBdCwgaGl0YnRjQnV5QXQsIFwiSGl0YnRjXCIsIHBvbG9Na3ROYW1lLCByZXBvcnRpbmdUaW1lc3RhbXApO1xufVxuXG4vKiBwb2xvTWt0RnJvbUhpdGJ0Y05hbWVcbiAqIGRlc2M6IE1hcHMgZnJvbSBIaXRidGMgdGlja2VycyB0byBQb2xvbmlleCB0aWNrZXJzLlxuICovXG5mdW5jdGlvbiBwb2xvTWt0RnJvbUhpdGJ0Y05hbWUoaGl0YnRjTWt0TmFtZTogc3RyaW5nKTogc3RyaW5nIHtcblxuICBjb25zdCBwb2xvTWt0TmFtZXM6IGFueSA9IHtcbiAgICBCQ05CVEM6ICAgXCJCVENfQkNOXCIsXG4gICAgREFTSEJUQzogICBcIkJUQ19EQVNIXCIsXG4gICAgRE9HRUJUQzogICBcIkJUQ19ET0dFXCIsXG4gICAgRVRIQlRDOiAgIFwiQlRDX0VUSFwiLFxuICAgIExTS0JUQzogICBcIkJUQ19MU0tcIixcbiAgICBMVENCVEM6ICAgXCJCVENfTFRDXCIsXG4gICAgTlhUQlRDOiAgIFwiQlRDX05YVFwiLFxuICAgIFNCREJUQzogICBcIkJUQ19TQkRcIixcbiAgICBTQ0JUQzogICBcIkJUQ19TQ1wiLFxuICAgIFNURUVNQlRDOiAgIFwiQlRDX1NURUVNXCIsXG4gICAgWEVNQlRDOiAgIFwiQlRDX1hFTVwiLFxuICAgIFhNUkJUQzogICBcIkJUQ19YTVJcIixcbiAgICBBUkRSQlRDOiAgIFwiQlRDX0FSRFJcIixcbiAgICBaRUNCVEM6ICAgXCJCVENfWkVDXCIsXG4gICAgTUFJREJUQzogICBcIkJUQ19NQUlEXCIsXG4gICAgUkVQQlRDOiAgIFwiQlRDX1JFUFwiLFxuICAgIEVUQ0JUQzogICBcIkJUQ19FVENcIixcbiAgICBCTlRCVEM6ICAgXCJCVENfQk5UXCIsXG4gICAgU05URVRIOiAgIFwiRVRIX1NOVFwiLFxuICAgIE9NR0VUSDogICBcIkVUSF9PTUdcIixcbiAgICBFVENFVEg6ICAgXCJFVEhfRVRDXCIsXG4gICAgWkVDRVRIOiAgIFwiRVRIX1pFQ1wiLFxuICAgIFhSUEJUQzogICBcIkJUQ19YUlBcIixcbiAgICBTVFJBVEJUQzogICBcIkJUQ19TVFJBVFwiLFxuICAgIEVPU0VUSDogICBcIkVUSF9FT1NcIixcbiAgICBFT1NCVEM6ICAgXCJCVENfRU9TXCIsXG4gICAgQk5URVRIOiAgIFwiRVRIX0JOVFwiLFxuICAgIFpSWEJUQzogICBcIkJUQ19aUlhcIixcbiAgICBaUlhFVEg6ICAgXCJFVEhfWlJYXCIsXG4gICAgUFBDQlRDOiAgIFwiQlRDX1BQQ1wiLFxuICAgIFFUVU1FVEg6ICAgXCJFVEhfUVRVTVwiLFxuICAgIERHQkJUQzogICBcIkJUQ19ER0JcIixcbiAgICBPTUdCVEM6ICAgXCJCVENfT01HXCIsXG4gICAgU05UQlRDOiAgIFwiQlRDX1NOVFwiLFxuICAgIFhSUFVTRFQ6ICAgXCJVU0RUX1hSUFwiLFxuICAgIE1BTkFFVEg6ICAgXCJFVEhfTUFOQVwiLFxuICAgIE1BTkFCVEM6ICAgXCJCVENfTUFOQVwiLFxuICAgIFFUVU1CVEM6ICAgXCJCVENfUVRVTVwiLFxuICAgIExTS0VUSDogICBcIkVUSF9MU0tcIixcbiAgICBSRVBFVEg6ICAgXCJFVEhfUkVQXCIsXG4gICAgUkVQVVNEVDogICBcIlVTRFRfUkVQXCIsXG4gICAgR05UQlRDOiAgIFwiQlRDX0dOVFwiLFxuICAgIEdOVEVUSDogICBcIkVUSF9HTlRcIixcbiAgICBCVFNCVEM6ICAgXCJCVENfQlRTXCIsXG4gICAgQkFUQlRDOiAgIFwiQlRDX0JBVFwiLFxuICAgIEJBVEVUSDogICBcIkVUSF9CQVRcIixcbiAgICBCQ0hBQkNCVEM6ICAgXCJCVENfQkNIQUJDXCIsXG4gICAgQkNIU1ZCVEM6ICAgXCJCVENfQkNIU1ZcIixcbiAgICBOTVJCVEM6ICAgXCJCVENfTk1SXCIsXG4gICAgUE9MWUJUQzogICBcIkJUQ19QT0xZXCIsXG4gICAgU1RPUkpCVEM6ICAgXCJCVENfU1RPUkpcIlxuICB9O1xuICByZXR1cm4ocG9sb01rdE5hbWVzW2hpdGJ0Y01rdE5hbWVdKTtcbn1cblxuLyogY29tcGFyZUFsbEJpdHRyZXhIaXRidGNcbiogIGRlc2M6IFRha2VzIHRoZSBiaXR0cmV4IGFuZCBoaXRidGMgZGF0YSBpbiBKU09OIGZvcm1hdCBhbmQgY29tcGFyZXMgYWxsIG92ZXJsYXBpbmcgbWFya2V0cyBmb3IgYXJiaXRyYWdlLlxuKiAgICAgICBFeHBvcnRlZCBmdW5jdGlvbiBjYWxsZWQgYnkgdGhlIG1haW4gYXBwLmpzXG4qL1xuZnVuY3Rpb24gY29tcGFyZUFsbEJpdHRyZXhIaXRidGMoYml0dHJleEpTT046IGFueSwgaGl0YnRjSlNPTjogYW55KSB7XG4gIFxuICBsZXQgcmVwb3J0aW5nVGltZXN0YW1wID0gbmV3IERhdGUoKTtcbiAgbGV0IGJpdHRyZXhUaW1lc3RhbXAgPSBiaXR0cmV4SlNPTi50aW1lU3RhbXA7XG4gIGxldCBiaXR0cmV4QWxsTWFya2V0cyA9IEpTT04ucGFyc2UoYml0dHJleEpTT04uZXhjaGFuZ2VEYXRhKS5yZXN1bHQ7XG4gIGxldCBoaXRidGNUaW1lc3RhbXAgPSBoaXRidGNKU09OLnRpbWVTdGFtcDtcbiAgbGV0IGhpdGJ0Y0FsbE1hcmtldHMgPSBKU09OLnBhcnNlKGhpdGJ0Y0pTT04uZXhjaGFuZ2VEYXRhKTtcbiAgY29uc29sZS5sb2coXCJJbiBjb21wYXJlQWxsQml0dHJleEhpdGJ0Y1wiKTtcbiAgY29uc29sZS5sb2coYml0dHJleFRpbWVzdGFtcCk7XG4gIGNvbnNvbGUubG9nKGhpdGJ0Y1RpbWVzdGFtcCk7XG4gIGJpdHRyZXhBbGxNYXJrZXRzLmZvckVhY2goIChiaXR0cmV4TWt0RWxlbTogYW55KSA9PiB7XG4gICAgbGV0IGhpdGJ0Y01rdE5hbWUgPSBoaXRCdGNNa3RGcm9tQml0dHJleE5hbWUoYml0dHJleE1rdEVsZW0uTWFya2V0TmFtZSk7XG4gICAgbGV0IGhpdGJ0Y01rdCA9IGhpdGJ0Y0FsbE1hcmtldHMuZmlsdGVyKChpdGVtOiBhbnkpID0+IHtcbiAgICAgIHJldHVybihpdGVtLnN5bWJvbD09PWhpdGJ0Y01rdE5hbWUpO1xuICAgIH0pO1xuICAgIGlmKGhpdGJ0Y01rdC5sZW5ndGghPTApIHtcbiAgICAgIGxldCBiYWRNYWtlcnRzID0gW1wiQlRDLUJDSFwiLCBcIkVUSC1CQ0hcIiwgXCJVU0QtQkNIXCIsIFwiQlRDLUJJVFNcIiwgXCJCVEMtWEROXCIsIFwiQlRDLVNXVFwiXTtcbiAgICAgICAgLy8gbGV0IGJhZE1ha2VydHMgPSBbXCJCVEMtQkNIXCIsIFwiRVRILUJDSFwiLCBcIlVTRC1CQ0hcIiwgXCJCVEMtQklUU1wiLCBcIkJUQy1TUENcIiwgXCJCVEMtU1dUXCIsIFwiQlRDLUNNQ1RcIixcbiAgICAgICAgLy8gXCJCVEMtTkxDMlwiLCBcIkJUQy1XQVZFU1wiXTtcbiAgICAgIGlmICghYmFkTWFrZXJ0cy5pbmNsdWRlcyhiaXR0cmV4TWt0RWxlbS5NYXJrZXROYW1lKSkge1xuICAgICAgICBjb21wYXJlQml0dHJleEhpdGJ0Y01rdEVsZW1lbnQoYml0dHJleE1rdEVsZW0sIGhpdGJ0Y01rdFswXSwgYml0dHJleE1rdEVsZW0uTWFya2V0TmFtZSwgbmV3IERhdGUoKSk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbn1cblxuLyogY29tcGFyZUJpdHRyZXhIaXRidGNNa3RFbGVtZW50XG4gKiBkZXNjOiBQdWxscyBvdXQgdGhlIGJ1eSBhbmQgc2VsbCBwcmljZXMgZm9yIGEgc2luZ2xlIGN1cnJlbmN5IHBhaXIgZm9yIFBvbG9uaWV4IGFuZCBIaXRidGMuXG4gKiAgICAgICBGb3J3YXJkcyB0aGlzIHRvIHRoZSBvdXRwdXQgbWV0aG9kIHRvIHJlY29yZCB0aGUgYXJiaXRyYWdlIHJlc3VsdHMuXG4gKi9cbmZ1bmN0aW9uIGNvbXBhcmVCaXR0cmV4SGl0YnRjTWt0RWxlbWVudChiaXR0cmV4TWt0RWxlbWVudDogYW55LCBoaXRidGNNa3RFbGVtZW50OiBhbnksIGJpdHRyZXhNa3ROYW1lOiBzdHJpbmcsIHJlcG9ydGluZ1RpbWVzdGFtcDogRGF0ZSkge1xuXG4gIGxldCBiaXR0cmV4QnV5QXQgPSArYml0dHJleE1rdEVsZW1lbnQuQXNrO1xuICBsZXQgYml0dHJleFNlbGxBdCA9ICtiaXR0cmV4TWt0RWxlbWVudC5CaWQ7XG4gIGxldCBoaXRidGNTZWxsQXQgPSAraGl0YnRjTWt0RWxlbWVudC5iaWQ7XG4gIGxldCBoaXRidGNCdXlBdCA9ICtoaXRidGNNa3RFbGVtZW50LmFzaztcbiAgaWYgKCFoaXRidGNTZWxsQXQgfHwgIWhpdGJ0Y0J1eUF0KSB7XG4gICAgY29uc29sZS5sb2coXCJHb3QgYmFkIHJhdGVzIGZyb20gdGhlIGhpdGJ0YyBmb3I6XCIsIGJpdHRyZXhNa3ROYW1lKTtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKCFiaXR0cmV4QnV5QXQgfHwgIWJpdHRyZXhTZWxsQXQpIHtcbiAgICBjb25zb2xlLmxvZyhcIkdvdCBiYWQgcmF0ZXMgZnJvbSB0aGUgYml0dHJleCBmb3I6XCIsIGJpdHRyZXhNa3ROYW1lKTtcbiAgICByZXR1cm47XG4gIH1cbiAgb3V0cHV0QXJiUmVzdWx0cyhiaXR0cmV4QnV5QXQsIGJpdHRyZXhTZWxsQXQsIFwiQml0dHJleFwiLCBcbiAgICBoaXRidGNTZWxsQXQsIGhpdGJ0Y0J1eUF0LCBcIkhpdGJ0Y1wiLCBiaXR0cmV4TWt0TmFtZSwgcmVwb3J0aW5nVGltZXN0YW1wKTtcbn1cblxuLyogaGl0QnRjTWt0RnJvbUJpdHRyZXhOYW1lXG4gKiBkZXNjOiBNYXBzIGZyb20gQml0dHJleCB0aWNrZXJzIHRvIEhpdGJ0YyB0aWNrZXJzLlxuICovXG5mdW5jdGlvbiBoaXRCdGNNa3RGcm9tQml0dHJleE5hbWUoYml0dHJleE1rdE5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG5cbiAgICBsZXQgc3BsaXRUaWNrZXIgPSBiaXR0cmV4TWt0TmFtZS5zcGxpdChcIi1cIik7XG4gICAgcmV0dXJuKHNwbGl0VGlja2VyWzFdK3NwbGl0VGlja2VyWzBdKTtcbn1cblxuXG4vKiBjb21wYXJlQWxsUG9sb25pZXhZb2JpdFxuICogZGVzYzogQ29tcGFyZXMgbWFya2V0IGRhdGEgYWNyb3NzIG1hbnkgY3VycmVuY3kgcGFpcnMgYmV0d2VlbiBQb2xvbmlleCBhbmQgWW9iaXQuXG4gKiAgICAgICBOb3RlIHRoYXQgWW9iaXQgb2Z0ZW5zIGhhcyBsYXJnZSBwcmNpZSBkaXNjcmVwZW5jaWVzIGJ1dCB0aGUgd2FsbGV0cyBmb3IgdGhvcyBjb2luc1xuICogICAgICAgYXJlIGRlYWN0aXZhdGVkLiAgU28geW91IGNhbid0IGdlbmVyYXRlIGEgcHJvZml0LlxuICovXG5mdW5jdGlvbiBjb21wYXJlQWxsUG9sb25pZXhZb2JpdChwb2xvRGF0YTogYW55LCB5b2JpdERhdGE6IGFueSkge1xuXG4gIGxldCByZXBvcnRpbmdUaW1lc3RhbXA6IERhdGUgPSBuZXcgRGF0ZSgpO1xuICBsZXQgcG9sb1RpbWVzdGFtcDogRGF0ZSA9IHBvbG9EYXRhLnRpbWVTdGFtcDtcbiAgbGV0IHBvbG9BbGxNYXJrZXRzID0gSlNPTi5wYXJzZShwb2xvRGF0YS5leGNoYW5nZURhdGEpO1xuICBsZXQgeW9iaXRUaW1lc3RhbXAgPSB5b2JpdERhdGEudGltZVN0YW1wO1xuICBsZXQgeW9iaXRBbGxNYXJrZXRzID0gSlNPTi5wYXJzZSh5b2JpdERhdGEuZXhjaGFuZ2VEYXRhKTtcbiAgY29uc29sZS5sb2cocG9sb1RpbWVzdGFtcCk7XG4gIGNvbnNvbGUubG9nKHlvYml0VGltZXN0YW1wKTtcbiAgZm9yKGxldCB5b2JpdE1rdCBpbiB5b2JpdEFsbE1hcmtldHMpe1xuICAgIGNvbnNvbGUubG9nKFwieW9iaXRNa3Q6XCIsIHlvYml0TWt0LCBcIiBkYXRhOlwiLCB5b2JpdEFsbE1hcmtldHNbeW9iaXRNa3RdKTtcbiAgICBsZXQgcG9sb01rdE5hbWUgPSBwb2xvTWt0RnJvbVlvYml0TmFtZSh5b2JpdE1rdCk7XG4gICAgY29uc29sZS5sb2coXCJQb2xvTWFya2V0OlwiLCBwb2xvTWt0TmFtZSwgXCIgZGF0YTpcIiwgcG9sb0FsbE1hcmtldHNbcG9sb01rdE5hbWVdKTtcbiAgICBjb21wYXJlUG9sb25pZXhZb2JpdE1rdEVsZW1lbnQocG9sb0FsbE1hcmtldHNbcG9sb01rdE5hbWVdLCB5b2JpdEFsbE1hcmtldHNbeW9iaXRNa3RdLCBwb2xvTWt0TmFtZSwgcmVwb3J0aW5nVGltZXN0YW1wKTtcbiAgfVxufVxuXG4vKiBjb21wYXJlUG9sb25pZXhZb2JpdE1rdEVsZW1lbnRcbiAqIGRlc2M6IFB1bGxzIG91dCB0aGUgYnV5IGFuZCBzZWxsIHByaWNlcyBmb3IgYSBzaW5nbGUgY3VycmVuY3kgcGFpciBmb3IgUG9sb25pZXggYW5kIFlvYml0LlxuICogICAgICAgRm9yd2FyZHMgdGhpcyB0byB0aGUgb3V0cHV0IG1ldGhvZCB0byByZWNvcmQgdGhlIGFyYml0cmFnZSByZXN1bHRzLlxuICovXG5mdW5jdGlvbiBjb21wYXJlUG9sb25pZXhZb2JpdE1rdEVsZW1lbnQocG9sb01rdEVsZW1lbnQ6IGFueSwgeW9iaXRNa3RFbGVtZW50OiBhbnksIHBvbG9Na3ROYW1lOiBhbnksIHJlcG9ydGluZ1RpbWVzdGFtcDogRGF0ZSkge1xuXG4gIGxldCBwb2xvQnV5QXQgPSArcG9sb01rdEVsZW1lbnQubG93ZXN0QXNrO1xuICBsZXQgcG9sb1NlbGxBdCA9ICtwb2xvTWt0RWxlbWVudC5oaWdoZXN0QmlkO1xuICBsZXQgeW9iaXRTZWxsQXQgPSAreW9iaXRNa3RFbGVtZW50LnNlbGw7XG4gIGxldCB5b2JpdEJ1eUF0ID0gK3lvYml0TWt0RWxlbWVudC5idXk7XG4gIG91dHB1dEFyYlJlc3VsdHMocG9sb0J1eUF0LCBwb2xvU2VsbEF0LCBcIlBvbG9uaWV4XCIsIHlvYml0U2VsbEF0LCB5b2JpdEJ1eUF0LCBcIllvYml0XCIsIHBvbG9Na3ROYW1lLCByZXBvcnRpbmdUaW1lc3RhbXApO1xufVxuXG4vKiBwb2xvTWt0RnJvbVlvYml0TmFtZVxuICogZGVzYzogTWFwcyBmcm9tIFlvYml0IHRpY2tlcnMgdG8gUG9sb25pZXggdGlja2Vycy5cbiAqL1xuZnVuY3Rpb24gcG9sb01rdEZyb21Zb2JpdE5hbWUoeW9iaXRNa3ROYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuXG4gIGNvbnN0IHBvbG9Na3ROYW1lczogYW55ID0ge1xuICAgIGx0Y19idGM6ICBcIkJUQ19MVENcIixcbiAgICBubWNfYnRjOiAgXCJCVENfTk1DXCIsXG4gICAgbm1yX2J0YzogIFwiQlRDX05NUlwiLFxuICAgIGV0aF9idGM6ICBcIkJUQ19FVEhcIlxuICB9O1xuICByZXR1cm4ocG9sb01rdE5hbWVzW3lvYml0TWt0TmFtZV0pO1xufVxuXG5cbmFzeW5jIGZ1bmN0aW9uIGludGVybmFsQ29tcGFyZUZvcllvYml0KG1rdERhdGEgOiBhbnksIHlvYml0TWFya2V0cyA6IEFycmF5PHN0cmluZz4sIGJhc2VNYXJrZXRzIDogQXJyYXk8c3RyaW5nPikge1xuXG4gIGxldCB0aW1lU3RhbXAgPSBuZXcgRGF0ZSgpO1xuICBmb3IobGV0IGk9MDsgaTx5b2JpdE1hcmtldHMubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgY3VyTWt0MTogc3RyaW5nID0geW9iaXRNYXJrZXRzW2ldICsgXCJfXCIgKyBiYXNlTWFya2V0c1swXTtcbiAgICBsZXQgY3VyTWt0Mjogc3RyaW5nID0geW9iaXRNYXJrZXRzW2ldICsgXCJfXCIgKyBiYXNlTWFya2V0c1sxXTtcbiAgICBsZXQgYmFzZVBhaXI6IHN0cmluZyA9IGJhc2VNYXJrZXRzWzFdICsgXCJfXCIgKyBiYXNlTWFya2V0c1swXTtcbiAgICBsZXQgYXJiRnJhY3Rpb246IG51bWJlciA9IG1rdERhdGFbYmFzZVBhaXJdLmJ1eSAqIG1rdERhdGFbY3VyTWt0Ml0uYnV5IC8gbWt0RGF0YVtjdXJNa3QxXS5zZWxsO1xuICAgIGNvbnNvbGUubG9nKFwiQXJiIEZyYWN0aW9uIGZvciBcIiwgeW9iaXRNYXJrZXRzW2ldLCBcIjogXCIsIGFyYkZyYWN0aW9uLnRvRml4ZWQoNikpO1xuICAgIGxldCBrZXlTdHIgPSBcIllvYml0SW50ZXJuYWxfXCIgKyBjdXJNa3QxICsgXCJfXCIgKyBiYXNlTWFya2V0c1sxXTtcbiAgICBsZXQgZGJPdXRwdXQgPSB7XG4gICAgICBrZXk6IGtleVN0cixcbiAgICAgIGV4Y2gxTmFtZTogXCJZb2JpdFwiLFxuICAgICAgZXhjaDJOYW1lOiBcIllvYml0XCIsXG4gICAgICB0aW1lU3RhbXA6IHRpbWVTdGFtcC50b1N0cmluZygpLnNsaWNlKDAsMjUpLFxuICAgICAgY2N5UGFpcjogY3VyTWt0MSxcbiAgICAgIGV4Y2gxQnV5QXQ6IG1rdERhdGFbY3VyTWt0MV0uc2VsbCxcbiAgICAgIGV4Y2gxU2VsbEF0OiAwLFxuICAgICAgZXhjaDJCdXlBdDogMCxcbiAgICAgIGV4Y2gyU2VsbEF0OiBta3REYXRhW2N1ck1rdDJdLmJ1eSxcbiAgICAgIGdhaW5Mb3NzOiBcIkxvc3NcIixcbiAgICAgIHVyZ2VudFRyYWRlOiBmYWxzZSxcbiAgICAgIGFyYlBlcmNlbnQ6IGFyYkZyYWN0aW9uLFxuICAgICAgZXhjaDFCdXlPclNlbGw6IFwiQnV5XCIsXG4gICAgICB0cmFkZUluc3RydWN0aW9uczogXCJcIixcbiAgICB9O1xuICAgIGlmIChhcmJGcmFjdGlvbiA+IDEpIHtcbiAgICAgIGRiT3V0cHV0LmdhaW5Mb3NzID0gXCJHYWluXCI7XG4gICAgICBjb25zb2xlLmxvZyhcIiAgLS0tPiBHYWluXCIsIHRpbWVTdGFtcC50b1N0cmluZygpLnNsaWNlKDAsMjUpLCBcIiBcIiwgYXJiRnJhY3Rpb24udG9GaXhlZCg4KSwgXG4gICAgICAgIFwiQnV5IFwiLCB5b2JpdE1hcmtldHNbaV0sIFwiIHdpdGggQlRDIGF0XCIsIG1rdERhdGFbY3VyTWt0MV0uc2VsbCxcbiAgICAgICAgXCJzZWxsIHRoZVwiLCB5b2JpdE1hcmtldHNbaV0sIFwiZm9yXCIsIG1rdERhdGFbY3VyTWt0Ml0uYnV5LCBcbiAgICAgICAgXCJ0byBnZXQgRVRILiBDb252ZXJ0IEVUSCBiYWNrIHRvIEJUQyBhdFwiLCBta3REYXRhW2Jhc2VQYWlyXS5idXkpO1xuICAgICAgaWYgKGFyYkZyYWN0aW9uID4gMS4wMDUpIHtcbiAgICAgICAgZGJPdXRwdXQudXJnZW50VHJhZGUgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICBkYk91dHB1dC5rZXkgPSBrZXlTdHI7XG4gICAgbGV0IGtleTogYW55ID0ge1xuICAgICAgXCJrZXlcIjoga2V5U3RyXG4gICAgfTtcbiAgICBpZiAoZGJXcml0ZUVuYWJsZWQpIHtcbiAgICAgIGF3YWl0IHVwZGF0ZVJlc3VsdHNJbk1vbmdvKGtleSwgZGJPdXRwdXQsIG1vbmdvREJOYW1lLCBtb25nb0RCQ29sbGVjdGlvbik7XG4gICAgfSAgICBcbiAgfVxufVxuXG5leHBvcnQge2NvbXBhcmVQb2xvbmlleENvaW5iYXNlLCBjb21wYXJlQWxsUG9sb25pZXhCaXR0cmV4LCBjb21wYXJlQWxsUG9sb25pZXhIaXRidGMsIGNvbXBhcmVBbGxCaXR0cmV4SGl0YnRjLFxuICBjb21wYXJlQWxsUG9sb25pZXhZb2JpdCwgaW50ZXJuYWxDb21wYXJlRm9yWW9iaXR9O1xuIl19