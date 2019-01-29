"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.comparePoloniexCoinbase = comparePoloniexCoinbase;
exports.compareAllPoloniexBittrex = compareAllPoloniexBittrex;
exports.compareAllPoloniexHitbtc = compareAllPoloniexHitbtc;
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
  outputArbResults(poloBuyAt, poloSellAt, coinbaseSellAt, coinbaseBuyAt, "Coinbase", poloPair, timeStamp);
}
/* compareAllPoloniexBittrex
 * desc: Takes the poloniex and bittrex data in JSON format and compares all overlaping markets for arbitrage.
 *       Exported function called by the main app.js
 */


function compareAllPoloniexBittrex(poloJSON, bittrexJSON) {
  var reportingTimestamp = new Date();
  var poloTimestamp = poloJSON.timeStamp;
  var poloAllMarkets = JSON.parse(poloJSON.exchangeData);
  var bittrexTimestamp = bittrexJSON.timeStamp;
  console.log(poloTimestamp);
  console.log(bittrexTimestamp);

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
  outputArbResults(poloBuyAt, poloSellAt, bittrexSellAt, bittrexBuyAt, "Bittrex", poloPair, timeStamp);
}

function outputArbResults(_x, _x2, _x3, _x4, _x5, _x6, _x7) {
  return _outputArbResults.apply(this, arguments);
}
/* poloMktFromBittrexName
 * desc: Converts a Bittrex crypto currency pair into the Poloniex pair.
 */


function _outputArbResults() {
  _outputArbResults = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee(poloBuyAt, poloSellAt, exchange2SellAt, exchange2BuyAt, exchange2Name, poloPair, timeStamp) {
    var dbOutput, arbOpportunity, arbPercent, keyStr, key;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            dbOutput = {
              key: "",
              exch1Name: "Poloniex",
              exch2Name: exchange2Name,
              timeStamp: timeStamp.toString().slice(0, 25),
              ccyPair: poloPair,
              exch1BuyAt: poloBuyAt,
              exch1SellAt: poloSellAt,
              exch2BuyAt: exchange2BuyAt,
              exch2SellAt: exchange2SellAt,
              gainLoss: "LOSS",
              urgentTrade: false,
              arbPercent: 0,
              exch1BuyOrSell: "",
              tradeInstructions: "",
              time: Math.round(new Date().getTime() / 1000)
            }; // Check for case of Buy at Exchange2 and Sell at Exchange1 (Polo)

            arbOpportunity = poloSellAt - exchange2BuyAt;
            arbPercent = 100 * (poloSellAt - exchange2BuyAt) / ((poloSellAt + exchange2BuyAt) / 2);
            dbOutput.arbPercent = arbPercent;
            dbOutput.exch1BuyOrSell = "Sell";

            if (arbPercent > arbReportingThresholdPercent) {
              dbOutput.gainLoss = "GAIN";
              dbOutput.tradeInstructions = "".concat(poloPair, " BUY at ").concat(exchange2Name, " for ").concat(exchange2BuyAt.toFixed(9), ". SELL at Polo for ").concat(poloSellAt.toFixed(9), " Gain ").concat(arbPercent.toFixed(6), "%");
              console.log(dbOutput.gainLoss, ": ", dbOutput.tradeInstructions);

              if (arbPercent > arbEmailThresholdPercent) {
                dbOutput.urgentTrade = true;
                (0, _sendEMail.SendMessage)("".concat(poloPair, ": BUY at ").concat(exchange2Name, " and SELL at Poloniex"), dbOutput.tradeInstructions);
              }
            } else {
              dbOutput.gainLoss = "LOSS";
              dbOutput.urgentTrade = false;
              dbOutput.tradeInstructions = "".concat(poloPair, " BUY at ").concat(exchange2Name, " for ").concat(exchange2BuyAt.toFixed(9), ". SELL at Polo for ").concat(poloSellAt.toFixed(9), " Loss ").concat(arbPercent.toFixed(6), "%");

              if (reportLoses) {
                console.log("".concat(formatTimestamp(timeStamp), ": Pair: ").concat(poloPair, ", Result: LOSS, Desc: ").concat(exchange2Name, ", ").concat(exchange2BuyAt.toFixed(8), " is greater than poloSellAt, ").concat(poloSellAt.toFixed(8), ", DIFF, ").concat(arbOpportunity.toFixed(6)));
              }
            }

            keyStr = "Buy" + exchange2Name + "SellPoloniex" + poloPair;
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
            // Check for case of Buy at Exchange1(Polo) and Sell at Exchange2
            arbOpportunity = exchange2SellAt - poloBuyAt;
            arbPercent = 100 * (exchange2SellAt - poloBuyAt) / ((exchange2SellAt + poloBuyAt) / 2);
            dbOutput.arbPercent = arbPercent;
            dbOutput.exch1BuyOrSell = "Buy";

            if (arbPercent > arbReportingThresholdPercent) {
              dbOutput.gainLoss = "GAIN";
              dbOutput.tradeInstructions = "".concat(poloPair, " BUY at Polo for ").concat(poloBuyAt.toFixed(9), ". SELL ").concat(exchange2Name, " for ").concat(exchange2SellAt.toFixed(9), " Gain ").concat(arbPercent.toFixed(6), "%");
              console.log(dbOutput.gainLoss, ": ", dbOutput.tradeInstructions);

              if (arbPercent > arbEmailThresholdPercent) {
                dbOutput.urgentTrade = true;
                (0, _sendEMail.SendMessage)("".concat(poloPair, ": BUY at Poloniex and SELL at ").concat(exchange2Name), dbOutput.tradeInstructions);
              }
            } else {
              dbOutput.gainLoss = "LOSS";
              dbOutput.urgentTrade = false;
              dbOutput.tradeInstructions = "".concat(poloPair, " BUY at Polo for ").concat(poloBuyAt.toFixed(9), " SELL ").concat(exchange2Name, " for ").concat(exchange2SellAt.toFixed(9), " Loss ").concat(arbPercent.toFixed(6), "%");

              if (reportLoses) {
                console.log("".concat(formatTimestamp(timeStamp), ": Pair: ").concat(poloPair, ", Result: LOSS, Desc: poloBuyAt, ").concat(poloBuyAt.toFixed(9), " is greater than ").concat(exchange2Name, "SellAt, ").concat(exchange2SellAt.toFixed(8), ". DIFF, ").concat(arbOpportunity.toFixed(7)));
              }
            }

            keyStr = "BuyPoloniexSell" + exchange2Name + poloPair;
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
  var poloTimestamp = poloJSON.timeStamp;
  var poloAllMarkets = JSON.parse(poloJSON.exchangeData);
  var hitbtcTimestamp = hitbtcJSON.timeStamp;
  console.log(poloTimestamp);
  console.log(hitbtcTimestamp);

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

  outputArbResults(poloBuyAt, poloSellAt, hitbtcSellAt, hitbtcBuyAt, "Hitbtc", poloMktName, reportingTimestamp);
}
/* poloMktFromHitbtcName
 * desc: Maps from Hitbtc tickers to Poloniex tickers.
 */


function poloMktFromHitbtcName(hitbtcMktName) {
  var poloMktNames = {
    BCNBTC: "BTC_BCN",
    BNTUSDT: "USDT_BNT",
    DASHBTC: "BTC_DASH",
    DASHUSDT: "USDT_DASH",
    DOGEBTC: "BTC_DOGE",
    DOGEUSDT: "USDT_DOGE",
    DGBBTC: "BTC_DGB",
    EOSBTC: "BTC_EOS",
    EOSUSDT: "USDT_EOS",
    ETCUSDT: "USDT_ETC",
    ETHUSDT: "USDT_ETH",
    LSKBTC: "BTC_LSK",
    MAIDBTC: "BTC_MAID",
    MANABTC: "BTC_MANA",
    OMGBTC: "BTC_OMG",
    PPCBTC: "BTC_PPC",
    QTUMBTC: "BTC_QTUM",
    REPBTC: "BTC_REP",
    REPUSDT: "USDT_REP",
    XEMBTC: "BTC_XEM",
    ETHBTC: "BTC_ETH",
    ZECETH: "ETH_ZEC"
  };
  return poloMktNames[hitbtcMktName];
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
  outputArbResults(poloBuyAt, poloSellAt, yobitSellAt, yobitBuyAt, "Yobit", poloMktName, reportingTimestamp);
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

function internalCompareForYobit(_x8, _x9, _x10) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9jb21wYXJlUHJpY2luZ0RhdGEudHMiXSwibmFtZXMiOlsiYXJiRW1haWxUaHJlc2hvbGRQZXJjZW50IiwiYXJiUmVwb3J0aW5nVGhyZXNob2xkUGVyY2VudCIsImRiV3JpdGVFbmFibGVkIiwicmVwb3J0TG9zZXMiLCJtb25nb0RCTmFtZSIsIm1vbmdvREJDb2xsZWN0aW9uIiwibW9uZ29EQkNvbGxlY3Rpb25IaXN0IiwiZm9ybWF0VGltZXN0YW1wIiwidGltZVN0YW1wIiwidG9TdHJpbmciLCJzbGljZSIsImNvbXBhcmVQb2xvbmlleENvaW5iYXNlIiwicG9sb0RhdGEiLCJjYkRhdGEiLCJjb2luIiwicG9sb0pTT04iLCJKU09OIiwicGFyc2UiLCJleGNoYW5nZURhdGEiLCJjYkpTT04iLCJEYXRlIiwiY29uc29sZSIsImxvZyIsImdldFRpbWUiLCJjb21wYXJlQ3VycmVuY3lQYWlyIiwiY2N5MSIsImNjeTIiLCJwb2xvUGFpciIsInBvbG9CdXlBdCIsImxvd2VzdEFzayIsInBvbG9TZWxsQXQiLCJoaWdoZXN0QmlkIiwiY29pbmJhc2VTZWxsQXQiLCJiaWRzIiwiY29pbmJhc2VCdXlBdCIsImFza3MiLCJvdXRwdXRBcmJSZXN1bHRzIiwiY29tcGFyZUFsbFBvbG9uaWV4Qml0dHJleCIsImJpdHRyZXhKU09OIiwicmVwb3J0aW5nVGltZXN0YW1wIiwicG9sb1RpbWVzdGFtcCIsInBvbG9BbGxNYXJrZXRzIiwiYml0dHJleFRpbWVzdGFtcCIsImJpdHRyZXhNa3QiLCJwb2xvTWt0TmFtZSIsInBvbG9Na3RGcm9tQml0dHJleE5hbWUiLCJwb2xvTWt0RWxlbWVudCIsImNvbXBhcmVQb2xvbmlleEJpdHRyZXhNa3RFbGVtZW50IiwiYml0dHJleFNlbGxBdCIsIkJpZCIsImJpdHRyZXhCdXlBdCIsIkFzayIsImV4Y2hhbmdlMlNlbGxBdCIsImV4Y2hhbmdlMkJ1eUF0IiwiZXhjaGFuZ2UyTmFtZSIsImRiT3V0cHV0Iiwia2V5IiwiZXhjaDFOYW1lIiwiZXhjaDJOYW1lIiwiY2N5UGFpciIsImV4Y2gxQnV5QXQiLCJleGNoMVNlbGxBdCIsImV4Y2gyQnV5QXQiLCJleGNoMlNlbGxBdCIsImdhaW5Mb3NzIiwidXJnZW50VHJhZGUiLCJhcmJQZXJjZW50IiwiZXhjaDFCdXlPclNlbGwiLCJ0cmFkZUluc3RydWN0aW9ucyIsInRpbWUiLCJNYXRoIiwicm91bmQiLCJhcmJPcHBvcnR1bml0eSIsInRvRml4ZWQiLCJrZXlTdHIiLCJiaXR0cmV4TWt0TmFtZSIsInJlcGxhY2UiLCJjb21wYXJlQWxsUG9sb25pZXhIaXRidGMiLCJoaXRidGNKU09OIiwiaGl0YnRjVGltZXN0YW1wIiwiaGl0YnRjTWt0IiwicG9sb01rdEZyb21IaXRidGNOYW1lIiwiY29tcGFyZVBvbG9uaWV4SGl0YnRjTWt0RWxlbWVudCIsImhpdGJ0Y01rdEVsZW1lbnQiLCJoaXRidGNTZWxsQXQiLCJiaWQiLCJoaXRidGNCdXlBdCIsImFzayIsImhpdGJ0Y01rdE5hbWUiLCJwb2xvTWt0TmFtZXMiLCJCQ05CVEMiLCJCTlRVU0RUIiwiREFTSEJUQyIsIkRBU0hVU0RUIiwiRE9HRUJUQyIsIkRPR0VVU0RUIiwiREdCQlRDIiwiRU9TQlRDIiwiRU9TVVNEVCIsIkVUQ1VTRFQiLCJFVEhVU0RUIiwiTFNLQlRDIiwiTUFJREJUQyIsIk1BTkFCVEMiLCJPTUdCVEMiLCJQUENCVEMiLCJRVFVNQlRDIiwiUkVQQlRDIiwiUkVQVVNEVCIsIlhFTUJUQyIsIkVUSEJUQyIsIlpFQ0VUSCIsImNvbXBhcmVBbGxQb2xvbmlleFlvYml0IiwieW9iaXREYXRhIiwieW9iaXRUaW1lc3RhbXAiLCJ5b2JpdEFsbE1hcmtldHMiLCJ5b2JpdE1rdCIsInBvbG9Na3RGcm9tWW9iaXROYW1lIiwiY29tcGFyZVBvbG9uaWV4WW9iaXRNa3RFbGVtZW50IiwieW9iaXRNa3RFbGVtZW50IiwieW9iaXRTZWxsQXQiLCJzZWxsIiwieW9iaXRCdXlBdCIsImJ1eSIsInlvYml0TWt0TmFtZSIsImx0Y19idGMiLCJubWNfYnRjIiwibm1yX2J0YyIsImV0aF9idGMiLCJpbnRlcm5hbENvbXBhcmVGb3JZb2JpdCIsIm1rdERhdGEiLCJ5b2JpdE1hcmtldHMiLCJiYXNlTWFya2V0cyIsImkiLCJsZW5ndGgiLCJjdXJNa3QxIiwiY3VyTWt0MiIsImJhc2VQYWlyIiwiYXJiRnJhY3Rpb24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBS0E7O0FBQ0E7Ozs7OztBQUVBO0FBQ0EsSUFBTUEsd0JBQXdCLEdBQUcsSUFBakMsQyxDQUNBOztBQUNBLElBQU1DLDRCQUE0QixHQUFHLEdBQXJDLEMsQ0FDQTs7QUFDQSxJQUFJQyxjQUFjLEdBQUcsSUFBckIsQyxDQUNBOztBQUNBLElBQUlDLFdBQVcsR0FBRyxLQUFsQixDLENBQ0E7O0FBQ0EsSUFBTUMsV0FBVyxHQUFHLFFBQXBCO0FBQ0EsSUFBTUMsaUJBQWlCLEdBQUcscUJBQTFCO0FBQ0EsSUFBTUMscUJBQXFCLEdBQUcseUJBQTlCO0FBRUE7Ozs7QUFHQSxTQUFTQyxlQUFULENBQXlCQyxTQUF6QixFQUEwQztBQUN4QyxTQUFPQSxTQUFTLENBQUNDLFFBQVYsR0FBcUJDLEtBQXJCLENBQTJCLENBQTNCLEVBQTZCLEVBQTdCLENBQVA7QUFDRDtBQUVEOzs7Ozs7QUFJQSxTQUFTQyx1QkFBVCxDQUFpQ0MsUUFBakMsRUFBZ0RDLE1BQWhELEVBQTZEQyxJQUE3RCxFQUEyRTtBQUV6RSxNQUFJQyxRQUFRLEdBQUdDLElBQUksQ0FBQ0MsS0FBTCxDQUFXTCxRQUFRLENBQUNNLFlBQXBCLENBQWY7QUFDQSxNQUFJQyxNQUFNLEdBQUdILElBQUksQ0FBQ0MsS0FBTCxDQUFXSixNQUFNLENBQUNLLFlBQWxCLENBQWI7QUFDQSxNQUFJVixTQUFTLEdBQUcsSUFBSVksSUFBSixFQUFoQjtBQUNBQyxFQUFBQSxPQUFPLENBQUNDLEdBQVIsV0FBZWYsZUFBZSxDQUFDQyxTQUFELENBQTlCLGdDQUErREksUUFBUSxDQUFDSixTQUFULENBQW1CZSxPQUFuQixLQUE2QlYsTUFBTSxDQUFDTCxTQUFQLENBQWlCZSxPQUFqQixFQUE1RjtBQUNBQyxFQUFBQSxtQkFBbUIsQ0FBQ2hCLFNBQUQsRUFBWU8sUUFBWixFQUFzQkksTUFBdEIsRUFBOEIsTUFBOUIsRUFBc0NMLElBQXRDLENBQW5CO0FBQ0Q7QUFFRDs7Ozs7O0FBSUEsU0FBU1UsbUJBQVQsQ0FBNkJoQixTQUE3QixFQUE4Q08sUUFBOUMsRUFBNkRJLE1BQTdELEVBQTBFTSxJQUExRSxFQUF3RkMsSUFBeEYsRUFBc0c7QUFDcEcsTUFBSUMsUUFBUSxHQUFHRixJQUFJLEdBQUMsR0FBTCxHQUFTQyxJQUF4QjtBQUNBLE1BQUlFLFNBQVMsR0FBRyxDQUFDYixRQUFRLENBQUNZLFFBQUQsQ0FBUixDQUFtQkUsU0FBcEM7QUFDQSxNQUFJQyxVQUFVLEdBQUcsQ0FBQ2YsUUFBUSxDQUFDWSxRQUFELENBQVIsQ0FBbUJJLFVBQXJDO0FBQ0EsTUFBSUMsY0FBYyxHQUFHLENBQUNiLE1BQU0sQ0FBQ2MsSUFBUCxDQUFZLENBQVosRUFBZSxDQUFmLENBQXRCO0FBQ0EsTUFBSUMsYUFBYSxHQUFHLENBQUNmLE1BQU0sQ0FBQ2dCLElBQVAsQ0FBWSxDQUFaLEVBQWUsQ0FBZixDQUFyQjtBQUNBQyxFQUFBQSxnQkFBZ0IsQ0FBQ1IsU0FBRCxFQUFZRSxVQUFaLEVBQXdCRSxjQUF4QixFQUF3Q0UsYUFBeEMsRUFBdUQsVUFBdkQsRUFBbUVQLFFBQW5FLEVBQTZFbkIsU0FBN0UsQ0FBaEI7QUFDQTtBQUVEOzs7Ozs7QUFJRCxTQUFTNkIseUJBQVQsQ0FBbUN0QixRQUFuQyxFQUFrRHVCLFdBQWxELEVBQW9FO0FBRWxFLE1BQUlDLGtCQUFrQixHQUFHLElBQUluQixJQUFKLEVBQXpCO0FBQ0EsTUFBSW9CLGFBQWEsR0FBR3pCLFFBQVEsQ0FBQ1AsU0FBN0I7QUFDQSxNQUFJaUMsY0FBYyxHQUFHekIsSUFBSSxDQUFDQyxLQUFMLENBQVdGLFFBQVEsQ0FBQ0csWUFBcEIsQ0FBckI7QUFDQSxNQUFJd0IsZ0JBQWdCLEdBQUdKLFdBQVcsQ0FBQzlCLFNBQW5DO0FBQ0FhLEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZa0IsYUFBWjtBQUNBbkIsRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVlvQixnQkFBWjs7QUFDQSxPQUFJLElBQUlDLFVBQVIsSUFBc0JMLFdBQVcsQ0FBQ3BCLFlBQWxDLEVBQStDO0FBQzdDLFFBQUkwQixXQUFXLEdBQUdDLHNCQUFzQixDQUFDRixVQUFELENBQXhDO0FBQ0EsUUFBSUcsY0FBYyxHQUFHTCxjQUFjLENBQUNHLFdBQUQsQ0FBbkM7O0FBQ0EsUUFBRyxDQUFDRSxjQUFKLEVBQW9CO0FBQ2xCekIsTUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksa0JBQVosRUFBZ0NxQixVQUFoQyxFQUE0QyxpQkFBNUM7QUFDRCxLQUZELE1BR0s7QUFDSEksTUFBQUEsZ0NBQWdDLENBQUNELGNBQUQsRUFBaUJSLFdBQVcsQ0FBQ3BCLFlBQVosQ0FBeUJ5QixVQUF6QixDQUFqQixFQUF1REMsV0FBdkQsRUFBb0VMLGtCQUFwRSxDQUFoQztBQUNEO0FBQ0Y7QUFDRjtBQUVEOzs7Ozs7QUFJQSxTQUFTUSxnQ0FBVCxDQUEwQ2hDLFFBQTFDLEVBQXlEdUIsV0FBekQsRUFBMkVYLFFBQTNFLEVBQTZGbkIsU0FBN0YsRUFBOEc7QUFFNUcsTUFBSW9CLFNBQVMsR0FBRyxDQUFDYixRQUFRLENBQUNjLFNBQTFCO0FBQ0EsTUFBSUMsVUFBVSxHQUFHLENBQUNmLFFBQVEsQ0FBQ2dCLFVBQTNCO0FBQ0EsTUFBSWlCLGFBQWEsR0FBRyxDQUFDVixXQUFXLENBQUNXLEdBQWpDO0FBQ0EsTUFBSUMsWUFBWSxHQUFHLENBQUNaLFdBQVcsQ0FBQ2EsR0FBaEM7QUFDQWYsRUFBQUEsZ0JBQWdCLENBQUNSLFNBQUQsRUFBWUUsVUFBWixFQUF3QmtCLGFBQXhCLEVBQXVDRSxZQUF2QyxFQUFxRCxTQUFyRCxFQUFnRXZCLFFBQWhFLEVBQTBFbkIsU0FBMUUsQ0FBaEI7QUFDRDs7U0FFYzRCLGdCOzs7QUEyRmY7Ozs7Ozs7OzBCQTNGQSxpQkFBZ0NSLFNBQWhDLEVBQW1ERSxVQUFuRCxFQUNFc0IsZUFERixFQUMyQkMsY0FEM0IsRUFDbURDLGFBRG5ELEVBRUUzQixRQUZGLEVBRW9CbkIsU0FGcEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBSU0rQyxZQUFBQSxRQUpOLEdBSWlCO0FBQ2JDLGNBQUFBLEdBQUcsRUFBRSxFQURRO0FBRWJDLGNBQUFBLFNBQVMsRUFBRSxVQUZFO0FBR2JDLGNBQUFBLFNBQVMsRUFBRUosYUFIRTtBQUliOUMsY0FBQUEsU0FBUyxFQUFFQSxTQUFTLENBQUNDLFFBQVYsR0FBcUJDLEtBQXJCLENBQTJCLENBQTNCLEVBQTZCLEVBQTdCLENBSkU7QUFLYmlELGNBQUFBLE9BQU8sRUFBRWhDLFFBTEk7QUFNYmlDLGNBQUFBLFVBQVUsRUFBRWhDLFNBTkM7QUFPYmlDLGNBQUFBLFdBQVcsRUFBRS9CLFVBUEE7QUFRYmdDLGNBQUFBLFVBQVUsRUFBRVQsY0FSQztBQVNiVSxjQUFBQSxXQUFXLEVBQUVYLGVBVEE7QUFVYlksY0FBQUEsUUFBUSxFQUFFLE1BVkc7QUFXYkMsY0FBQUEsV0FBVyxFQUFFLEtBWEE7QUFZYkMsY0FBQUEsVUFBVSxFQUFFLENBWkM7QUFhYkMsY0FBQUEsY0FBYyxFQUFFLEVBYkg7QUFjYkMsY0FBQUEsaUJBQWlCLEVBQUUsRUFkTjtBQWViQyxjQUFBQSxJQUFJLEVBQUVDLElBQUksQ0FBQ0MsS0FBTCxDQUFXLElBQUluRCxJQUFKLEdBQVdHLE9BQVgsS0FBcUIsSUFBaEM7QUFmTyxhQUpqQixFQXFCQzs7QUFDS2lELFlBQUFBLGNBdEJOLEdBc0J1QjFDLFVBQVUsR0FBQ3VCLGNBdEJsQztBQXVCTWEsWUFBQUEsVUF2Qk4sR0F1Qm1CLE9BQUtwQyxVQUFVLEdBQUN1QixjQUFoQixLQUFrQyxDQUFDdkIsVUFBVSxHQUFDdUIsY0FBWixJQUE4QixDQUFoRSxDQXZCbkI7QUF3QkVFLFlBQUFBLFFBQVEsQ0FBQ1csVUFBVCxHQUFzQkEsVUFBdEI7QUFDQVgsWUFBQUEsUUFBUSxDQUFDWSxjQUFULEdBQTBCLE1BQTFCOztBQUNBLGdCQUFHRCxVQUFVLEdBQUdqRSw0QkFBaEIsRUFBOEM7QUFDNUNzRCxjQUFBQSxRQUFRLENBQUNTLFFBQVQsR0FBb0IsTUFBcEI7QUFDQVQsY0FBQUEsUUFBUSxDQUFDYSxpQkFBVCxhQUFnQ3pDLFFBQWhDLHFCQUFtRDJCLGFBQW5ELGtCQUF3RUQsY0FBYyxDQUFDb0IsT0FBZixDQUF1QixDQUF2QixDQUF4RSxnQ0FBdUgzQyxVQUFVLENBQUMyQyxPQUFYLENBQW1CLENBQW5CLENBQXZILG1CQUFxSlAsVUFBVSxDQUFDTyxPQUFYLENBQW1CLENBQW5CLENBQXJKO0FBQ0FwRCxjQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWWlDLFFBQVEsQ0FBQ1MsUUFBckIsRUFBK0IsSUFBL0IsRUFBcUNULFFBQVEsQ0FBQ2EsaUJBQTlDOztBQUNBLGtCQUFJRixVQUFVLEdBQUdsRSx3QkFBakIsRUFBMkM7QUFDekN1RCxnQkFBQUEsUUFBUSxDQUFDVSxXQUFULEdBQXVCLElBQXZCO0FBQ0Esc0RBQWV0QyxRQUFmLHNCQUFtQzJCLGFBQW5DLDRCQUF5RUMsUUFBUSxDQUFDYSxpQkFBbEY7QUFDRDtBQUNGLGFBUkQsTUFTSztBQUNIYixjQUFBQSxRQUFRLENBQUNTLFFBQVQsR0FBb0IsTUFBcEI7QUFDQVQsY0FBQUEsUUFBUSxDQUFDVSxXQUFULEdBQXVCLEtBQXZCO0FBQ0FWLGNBQUFBLFFBQVEsQ0FBQ2EsaUJBQVQsYUFBZ0N6QyxRQUFoQyxxQkFBbUQyQixhQUFuRCxrQkFBd0VELGNBQWMsQ0FBQ29CLE9BQWYsQ0FBdUIsQ0FBdkIsQ0FBeEUsZ0NBQXVIM0MsVUFBVSxDQUFDMkMsT0FBWCxDQUFtQixDQUFuQixDQUF2SCxtQkFBcUpQLFVBQVUsQ0FBQ08sT0FBWCxDQUFtQixDQUFuQixDQUFySjs7QUFDQSxrQkFBSXRFLFdBQUosRUFBaUI7QUFDZmtCLGdCQUFBQSxPQUFPLENBQUNDLEdBQVIsV0FBZWYsZUFBZSxDQUFDQyxTQUFELENBQTlCLHFCQUFvRG1CLFFBQXBELG1DQUFxRjJCLGFBQXJGLGVBQXVHRCxjQUFjLENBQUNvQixPQUFmLENBQXVCLENBQXZCLENBQXZHLDBDQUFnSzNDLFVBQVUsQ0FBQzJDLE9BQVgsQ0FBbUIsQ0FBbkIsQ0FBaEsscUJBQWdNRCxjQUFjLENBQUNDLE9BQWYsQ0FBdUIsQ0FBdkIsQ0FBaE07QUFDRDtBQUNGOztBQUNHQyxZQUFBQSxNQTNDTixHQTJDZSxRQUFNcEIsYUFBTixHQUFvQixjQUFwQixHQUFtQzNCLFFBM0NsRDtBQTRDTTZCLFlBQUFBLEdBNUNOLEdBNENZO0FBQ1IscUJBQU9rQjtBQURDLGFBNUNaO0FBK0NFbkIsWUFBQUEsUUFBUSxDQUFDQyxHQUFULEdBQWVrQixNQUFmOztBQS9DRixpQkFnRE14RSxjQWhETjtBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUFBLG1CQWlEVSxtQ0FBcUJzRCxHQUFyQixFQUEwQkQsUUFBMUIsRUFBb0NuRCxXQUFwQyxFQUFpREMsaUJBQWpELENBakRWOztBQUFBO0FBQUEsaUJBa0RRa0QsUUFBUSxDQUFDVSxXQWxEakI7QUFBQTtBQUFBO0FBQUE7O0FBbURNVixZQUFBQSxRQUFRLENBQUNDLEdBQVQsSUFBZ0IsSUFBSXBDLElBQUosR0FBV0csT0FBWCxFQUFoQjtBQW5ETjtBQUFBLG1CQW9EVyxzQ0FBd0JnQyxRQUF4QixFQUFrQ25ELFdBQWxDLEVBQStDRSxxQkFBL0MsQ0FwRFg7O0FBQUE7QUF1REU7QUFDQWtFLFlBQUFBLGNBQWMsR0FBR3BCLGVBQWUsR0FBQ3hCLFNBQWpDO0FBQ0FzQyxZQUFBQSxVQUFVLEdBQUcsT0FBS2QsZUFBZSxHQUFDeEIsU0FBckIsS0FBa0MsQ0FBQ3dCLGVBQWUsR0FBQ3hCLFNBQWpCLElBQThCLENBQWhFLENBQWI7QUFDQTJCLFlBQUFBLFFBQVEsQ0FBQ1csVUFBVCxHQUFzQkEsVUFBdEI7QUFDQVgsWUFBQUEsUUFBUSxDQUFDWSxjQUFULEdBQTBCLEtBQTFCOztBQUNBLGdCQUFHRCxVQUFVLEdBQUdqRSw0QkFBaEIsRUFBOEM7QUFDNUNzRCxjQUFBQSxRQUFRLENBQUNTLFFBQVQsR0FBb0IsTUFBcEI7QUFDQVQsY0FBQUEsUUFBUSxDQUFDYSxpQkFBVCxhQUFnQ3pDLFFBQWhDLDhCQUE0REMsU0FBUyxDQUFDNkMsT0FBVixDQUFrQixDQUFsQixDQUE1RCxvQkFBMEZuQixhQUExRixrQkFBK0dGLGVBQWUsQ0FBQ3FCLE9BQWhCLENBQXdCLENBQXhCLENBQS9HLG1CQUFrSlAsVUFBVSxDQUFDTyxPQUFYLENBQW1CLENBQW5CLENBQWxKO0FBQ0FwRCxjQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWWlDLFFBQVEsQ0FBQ1MsUUFBckIsRUFBK0IsSUFBL0IsRUFBcUNULFFBQVEsQ0FBQ2EsaUJBQTlDOztBQUNBLGtCQUFJRixVQUFVLEdBQUdsRSx3QkFBakIsRUFBMkM7QUFDekN1RCxnQkFBQUEsUUFBUSxDQUFDVSxXQUFULEdBQXVCLElBQXZCO0FBQ0Esc0RBQWV0QyxRQUFmLDJDQUF3RDJCLGFBQXhELEdBQXlFQyxRQUFRLENBQUNhLGlCQUFsRjtBQUNEO0FBQ0YsYUFSRCxNQVNLO0FBQ0hiLGNBQUFBLFFBQVEsQ0FBQ1MsUUFBVCxHQUFvQixNQUFwQjtBQUNBVCxjQUFBQSxRQUFRLENBQUNVLFdBQVQsR0FBdUIsS0FBdkI7QUFDQVYsY0FBQUEsUUFBUSxDQUFDYSxpQkFBVCxhQUFnQ3pDLFFBQWhDLDhCQUE0REMsU0FBUyxDQUFDNkMsT0FBVixDQUFrQixDQUFsQixDQUE1RCxtQkFBeUZuQixhQUF6RixrQkFBOEdGLGVBQWUsQ0FBQ3FCLE9BQWhCLENBQXdCLENBQXhCLENBQTlHLG1CQUFpSlAsVUFBVSxDQUFDTyxPQUFYLENBQW1CLENBQW5CLENBQWpKOztBQUNBLGtCQUFJdEUsV0FBSixFQUFpQjtBQUNma0IsZ0JBQUFBLE9BQU8sQ0FBQ0MsR0FBUixXQUFlZixlQUFlLENBQUNDLFNBQUQsQ0FBOUIscUJBQW9EbUIsUUFBcEQsOENBQWdHQyxTQUFTLENBQUM2QyxPQUFWLENBQWtCLENBQWxCLENBQWhHLDhCQUF3SW5CLGFBQXhJLHFCQUFnS0YsZUFBZSxDQUFDcUIsT0FBaEIsQ0FBd0IsQ0FBeEIsQ0FBaEsscUJBQXFNRCxjQUFjLENBQUNDLE9BQWYsQ0FBdUIsQ0FBdkIsQ0FBck07QUFDRDtBQUNGOztBQUNEQyxZQUFBQSxNQUFNLEdBQUcsb0JBQWtCcEIsYUFBbEIsR0FBZ0MzQixRQUF6QztBQUNBNkIsWUFBQUEsR0FBRyxHQUFHO0FBQ0oscUJBQU9rQjtBQURILGFBQU47QUFHQW5CLFlBQUFBLFFBQVEsQ0FBQ0MsR0FBVCxHQUFla0IsTUFBZjs7QUFqRkYsaUJBa0ZNeEUsY0FsRk47QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFBQSxtQkFtRlUsbUNBQXFCc0QsR0FBckIsRUFBMEJELFFBQTFCLEVBQW9DbkQsV0FBcEMsRUFBaURDLGlCQUFqRCxDQW5GVjs7QUFBQTtBQUFBLGlCQW9GUWtELFFBQVEsQ0FBQ1UsV0FwRmpCO0FBQUE7QUFBQTtBQUFBOztBQXFGTVYsWUFBQUEsUUFBUSxDQUFDQyxHQUFULElBQWdCLElBQUlwQyxJQUFKLEdBQVdHLE9BQVgsRUFBaEI7QUFyRk47QUFBQSxtQkFzRlksc0NBQXdCZ0MsUUFBeEIsRUFBa0NuRCxXQUFsQyxFQUErQ0UscUJBQS9DLENBdEZaOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEc7Ozs7QUE4RkEsU0FBU3VDLHNCQUFULENBQWdDOEIsY0FBaEMsRUFBZ0U7QUFDOUQsTUFBR0EsY0FBYyxLQUFHLFNBQXBCLEVBQ0UsT0FBTyxTQUFQO0FBQ0YsTUFBR0EsY0FBYyxLQUFHLFVBQXBCLEVBQ0UsT0FBTyxVQUFQO0FBQ0YsU0FBT0EsY0FBYyxDQUFDQyxPQUFmLENBQXVCLEdBQXZCLEVBQTRCLEdBQTVCLENBQVA7QUFDRDtBQUVEOzs7Ozs7QUFJQSxTQUFTQyx3QkFBVCxDQUFrQzlELFFBQWxDLEVBQWlEK0QsVUFBakQsRUFBa0U7QUFFaEUsTUFBSXZDLGtCQUFrQixHQUFHLElBQUluQixJQUFKLEVBQXpCO0FBQ0EsTUFBSW9CLGFBQWEsR0FBR3pCLFFBQVEsQ0FBQ1AsU0FBN0I7QUFDQSxNQUFJaUMsY0FBYyxHQUFHekIsSUFBSSxDQUFDQyxLQUFMLENBQVdGLFFBQVEsQ0FBQ0csWUFBcEIsQ0FBckI7QUFDQSxNQUFJNkQsZUFBZSxHQUFHRCxVQUFVLENBQUN0RSxTQUFqQztBQUNBYSxFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWWtCLGFBQVo7QUFDQW5CLEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZeUQsZUFBWjs7QUFDQSxPQUFJLElBQUlDLFNBQVIsSUFBcUJGLFVBQVUsQ0FBQzVELFlBQWhDLEVBQTZDO0FBQzNDLFFBQUkwQixXQUFXLEdBQUdxQyxxQkFBcUIsQ0FBQ0QsU0FBRCxDQUF2QztBQUNBLFFBQUlsQyxjQUFjLEdBQUdMLGNBQWMsQ0FBQ0csV0FBRCxDQUFuQztBQUNBc0MsSUFBQUEsK0JBQStCLENBQUNwQyxjQUFELEVBQWlCZ0MsVUFBVSxDQUFDNUQsWUFBWCxDQUF3QjhELFNBQXhCLENBQWpCLEVBQXFEcEMsV0FBckQsRUFBa0VMLGtCQUFsRSxDQUEvQjtBQUNEO0FBQ0Y7QUFFRDs7Ozs7O0FBSUEsU0FBUzJDLCtCQUFULENBQXlDcEMsY0FBekMsRUFBOERxQyxnQkFBOUQsRUFBcUZ2QyxXQUFyRixFQUEwR0wsa0JBQTFHLEVBQW9JO0FBRWxJLE1BQUlYLFNBQVMsR0FBRyxDQUFDa0IsY0FBYyxDQUFDakIsU0FBaEM7QUFDQSxNQUFJQyxVQUFVLEdBQUcsQ0FBQ2dCLGNBQWMsQ0FBQ2YsVUFBakM7QUFDQSxNQUFJcUQsWUFBWSxHQUFHLENBQUNELGdCQUFnQixDQUFDRSxHQUFyQztBQUNBLE1BQUlDLFdBQVcsR0FBRyxDQUFDSCxnQkFBZ0IsQ0FBQ0ksR0FBcEM7O0FBQ0EsTUFBSSxDQUFDSCxZQUFELElBQWlCLENBQUNFLFdBQXRCLEVBQW1DO0FBQ2pDakUsSUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksb0NBQVosRUFBa0RzQixXQUFsRDtBQUNBO0FBQ0Q7O0FBQ0RSLEVBQUFBLGdCQUFnQixDQUFDUixTQUFELEVBQVlFLFVBQVosRUFBd0JzRCxZQUF4QixFQUFzQ0UsV0FBdEMsRUFBbUQsUUFBbkQsRUFBNkQxQyxXQUE3RCxFQUEwRUwsa0JBQTFFLENBQWhCO0FBQ0Q7QUFFRDs7Ozs7QUFHQSxTQUFTMEMscUJBQVQsQ0FBK0JPLGFBQS9CLEVBQThEO0FBRTVELE1BQU1DLFlBQWlCLEdBQUc7QUFDeEJDLElBQUFBLE1BQU0sRUFBSSxTQURjO0FBRXhCQyxJQUFBQSxPQUFPLEVBQUcsVUFGYztBQUd4QkMsSUFBQUEsT0FBTyxFQUFHLFVBSGM7QUFJeEJDLElBQUFBLFFBQVEsRUFBRSxXQUpjO0FBS3hCQyxJQUFBQSxPQUFPLEVBQUcsVUFMYztBQU14QkMsSUFBQUEsUUFBUSxFQUFFLFdBTmM7QUFPeEJDLElBQUFBLE1BQU0sRUFBSSxTQVBjO0FBUXhCQyxJQUFBQSxNQUFNLEVBQUksU0FSYztBQVN4QkMsSUFBQUEsT0FBTyxFQUFHLFVBVGM7QUFVeEJDLElBQUFBLE9BQU8sRUFBRyxVQVZjO0FBV3hCQyxJQUFBQSxPQUFPLEVBQUcsVUFYYztBQVl4QkMsSUFBQUEsTUFBTSxFQUFJLFNBWmM7QUFheEJDLElBQUFBLE9BQU8sRUFBRyxVQWJjO0FBY3hCQyxJQUFBQSxPQUFPLEVBQUcsVUFkYztBQWV4QkMsSUFBQUEsTUFBTSxFQUFJLFNBZmM7QUFnQnhCQyxJQUFBQSxNQUFNLEVBQUksU0FoQmM7QUFpQnhCQyxJQUFBQSxPQUFPLEVBQUcsVUFqQmM7QUFrQnhCQyxJQUFBQSxNQUFNLEVBQUksU0FsQmM7QUFtQnhCQyxJQUFBQSxPQUFPLEVBQUcsVUFuQmM7QUFvQnhCQyxJQUFBQSxNQUFNLEVBQUksU0FwQmM7QUFxQnhCQyxJQUFBQSxNQUFNLEVBQUksU0FyQmM7QUFzQnhCQyxJQUFBQSxNQUFNLEVBQUk7QUF0QmMsR0FBMUI7QUF3QkEsU0FBT3RCLFlBQVksQ0FBQ0QsYUFBRCxDQUFuQjtBQUNEO0FBRUQ7Ozs7Ozs7QUFLQSxTQUFTd0IsdUJBQVQsQ0FBaUNwRyxRQUFqQyxFQUFnRHFHLFNBQWhELEVBQWdFO0FBRTlELE1BQUkxRSxrQkFBd0IsR0FBRyxJQUFJbkIsSUFBSixFQUEvQjtBQUNBLE1BQUlvQixhQUFtQixHQUFHNUIsUUFBUSxDQUFDSixTQUFuQztBQUNBLE1BQUlpQyxjQUFjLEdBQUd6QixJQUFJLENBQUNDLEtBQUwsQ0FBV0wsUUFBUSxDQUFDTSxZQUFwQixDQUFyQjtBQUNBLE1BQUlnRyxjQUFjLEdBQUdELFNBQVMsQ0FBQ3pHLFNBQS9CO0FBQ0EsTUFBSTJHLGVBQWUsR0FBR25HLElBQUksQ0FBQ0MsS0FBTCxDQUFXZ0csU0FBUyxDQUFDL0YsWUFBckIsQ0FBdEI7QUFDQUcsRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVlrQixhQUFaO0FBQ0FuQixFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWTRGLGNBQVo7O0FBQ0EsT0FBSSxJQUFJRSxRQUFSLElBQW9CRCxlQUFwQixFQUFvQztBQUNsQzlGLElBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLFdBQVosRUFBeUI4RixRQUF6QixFQUFtQyxRQUFuQyxFQUE2Q0QsZUFBZSxDQUFDQyxRQUFELENBQTVEO0FBQ0EsUUFBSXhFLFdBQVcsR0FBR3lFLG9CQUFvQixDQUFDRCxRQUFELENBQXRDO0FBQ0EvRixJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxhQUFaLEVBQTJCc0IsV0FBM0IsRUFBd0MsUUFBeEMsRUFBa0RILGNBQWMsQ0FBQ0csV0FBRCxDQUFoRTtBQUNBMEUsSUFBQUEsOEJBQThCLENBQUM3RSxjQUFjLENBQUNHLFdBQUQsQ0FBZixFQUE4QnVFLGVBQWUsQ0FBQ0MsUUFBRCxDQUE3QyxFQUF5RHhFLFdBQXpELEVBQXNFTCxrQkFBdEUsQ0FBOUI7QUFDRDtBQUNGO0FBRUQ7Ozs7OztBQUlBLFNBQVMrRSw4QkFBVCxDQUF3Q3hFLGNBQXhDLEVBQTZEeUUsZUFBN0QsRUFBbUYzRSxXQUFuRixFQUFxR0wsa0JBQXJHLEVBQStIO0FBRTdILE1BQUlYLFNBQVMsR0FBRyxDQUFDa0IsY0FBYyxDQUFDakIsU0FBaEM7QUFDQSxNQUFJQyxVQUFVLEdBQUcsQ0FBQ2dCLGNBQWMsQ0FBQ2YsVUFBakM7QUFDQSxNQUFJeUYsV0FBVyxHQUFHLENBQUNELGVBQWUsQ0FBQ0UsSUFBbkM7QUFDQSxNQUFJQyxVQUFVLEdBQUcsQ0FBQ0gsZUFBZSxDQUFDSSxHQUFsQztBQUNBdkYsRUFBQUEsZ0JBQWdCLENBQUNSLFNBQUQsRUFBWUUsVUFBWixFQUF3QjBGLFdBQXhCLEVBQXFDRSxVQUFyQyxFQUFpRCxPQUFqRCxFQUEwRDlFLFdBQTFELEVBQXVFTCxrQkFBdkUsQ0FBaEI7QUFDRDtBQUVEOzs7OztBQUdBLFNBQVM4RSxvQkFBVCxDQUE4Qk8sWUFBOUIsRUFBNEQ7QUFFMUQsTUFBTW5DLFlBQWlCLEdBQUc7QUFDeEJvQyxJQUFBQSxPQUFPLEVBQUcsU0FEYztBQUV4QkMsSUFBQUEsT0FBTyxFQUFHLFNBRmM7QUFHeEJDLElBQUFBLE9BQU8sRUFBRyxTQUhjO0FBSXhCQyxJQUFBQSxPQUFPLEVBQUc7QUFKYyxHQUExQjtBQU1BLFNBQU92QyxZQUFZLENBQUNtQyxZQUFELENBQW5CO0FBQ0Q7O1NBR2NLLHVCOzs7Ozs7OzBCQUFmLGtCQUF1Q0MsT0FBdkMsRUFBc0RDLFlBQXRELEVBQW9GQyxXQUFwRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFFTTVILFlBQUFBLFNBRk4sR0FFa0IsSUFBSVksSUFBSixFQUZsQjtBQUdVaUgsWUFBQUEsQ0FIVixHQUdZLENBSFo7O0FBQUE7QUFBQSxrQkFHZUEsQ0FBQyxHQUFDRixZQUFZLENBQUNHLE1BSDlCO0FBQUE7QUFBQTtBQUFBOztBQUlRQyxZQUFBQSxPQUpSLEdBSTBCSixZQUFZLENBQUNFLENBQUQsQ0FBWixHQUFrQixHQUFsQixHQUF3QkQsV0FBVyxDQUFDLENBQUQsQ0FKN0Q7QUFLUUksWUFBQUEsT0FMUixHQUswQkwsWUFBWSxDQUFDRSxDQUFELENBQVosR0FBa0IsR0FBbEIsR0FBd0JELFdBQVcsQ0FBQyxDQUFELENBTDdEO0FBTVFLLFlBQUFBLFFBTlIsR0FNMkJMLFdBQVcsQ0FBQyxDQUFELENBQVgsR0FBaUIsR0FBakIsR0FBdUJBLFdBQVcsQ0FBQyxDQUFELENBTjdEO0FBT1FNLFlBQUFBLFdBUFIsR0FPOEJSLE9BQU8sQ0FBQ08sUUFBRCxDQUFQLENBQWtCZCxHQUFsQixHQUF3Qk8sT0FBTyxDQUFDTSxPQUFELENBQVAsQ0FBaUJiLEdBQXpDLEdBQStDTyxPQUFPLENBQUNLLE9BQUQsQ0FBUCxDQUFpQmQsSUFQOUY7QUFRSXBHLFlBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLG1CQUFaLEVBQWlDNkcsWUFBWSxDQUFDRSxDQUFELENBQTdDLEVBQWtELElBQWxELEVBQXdESyxXQUFXLENBQUNqRSxPQUFaLENBQW9CLENBQXBCLENBQXhEO0FBQ0lDLFlBQUFBLE1BVFIsR0FTaUIsbUJBQW1CNkQsT0FBbkIsR0FBNkIsR0FBN0IsR0FBbUNILFdBQVcsQ0FBQyxDQUFELENBVC9EO0FBVVE3RSxZQUFBQSxRQVZSLEdBVW1CO0FBQ2JDLGNBQUFBLEdBQUcsRUFBRWtCLE1BRFE7QUFFYmpCLGNBQUFBLFNBQVMsRUFBRSxPQUZFO0FBR2JDLGNBQUFBLFNBQVMsRUFBRSxPQUhFO0FBSWJsRCxjQUFBQSxTQUFTLEVBQUVBLFNBQVMsQ0FBQ0MsUUFBVixHQUFxQkMsS0FBckIsQ0FBMkIsQ0FBM0IsRUFBNkIsRUFBN0IsQ0FKRTtBQUtiaUQsY0FBQUEsT0FBTyxFQUFFNEUsT0FMSTtBQU1iM0UsY0FBQUEsVUFBVSxFQUFFc0UsT0FBTyxDQUFDSyxPQUFELENBQVAsQ0FBaUJkLElBTmhCO0FBT2I1RCxjQUFBQSxXQUFXLEVBQUUsQ0FQQTtBQVFiQyxjQUFBQSxVQUFVLEVBQUUsQ0FSQztBQVNiQyxjQUFBQSxXQUFXLEVBQUVtRSxPQUFPLENBQUNNLE9BQUQsQ0FBUCxDQUFpQmIsR0FUakI7QUFVYjNELGNBQUFBLFFBQVEsRUFBRSxNQVZHO0FBV2JDLGNBQUFBLFdBQVcsRUFBRSxLQVhBO0FBWWJDLGNBQUFBLFVBQVUsRUFBRXdFLFdBWkM7QUFhYnZFLGNBQUFBLGNBQWMsRUFBRSxLQWJIO0FBY2JDLGNBQUFBLGlCQUFpQixFQUFFO0FBZE4sYUFWbkI7O0FBMEJJLGdCQUFJc0UsV0FBVyxHQUFHLENBQWxCLEVBQXFCO0FBQ25CbkYsY0FBQUEsUUFBUSxDQUFDUyxRQUFULEdBQW9CLE1BQXBCO0FBQ0EzQyxjQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxhQUFaLEVBQTJCZCxTQUFTLENBQUNDLFFBQVYsR0FBcUJDLEtBQXJCLENBQTJCLENBQTNCLEVBQTZCLEVBQTdCLENBQTNCLEVBQTZELEdBQTdELEVBQWtFZ0ksV0FBVyxDQUFDakUsT0FBWixDQUFvQixDQUFwQixDQUFsRSxFQUNFLE1BREYsRUFDVTBELFlBQVksQ0FBQ0UsQ0FBRCxDQUR0QixFQUMyQixjQUQzQixFQUMyQ0gsT0FBTyxDQUFDSyxPQUFELENBQVAsQ0FBaUJkLElBRDVELEVBRUUsVUFGRixFQUVjVSxZQUFZLENBQUNFLENBQUQsQ0FGMUIsRUFFK0IsS0FGL0IsRUFFc0NILE9BQU8sQ0FBQ00sT0FBRCxDQUFQLENBQWlCYixHQUZ2RCxFQUdFLHdDQUhGLEVBRzRDTyxPQUFPLENBQUNPLFFBQUQsQ0FBUCxDQUFrQmQsR0FIOUQ7O0FBSUEsa0JBQUllLFdBQVcsR0FBRyxLQUFsQixFQUF5QjtBQUN2Qm5GLGdCQUFBQSxRQUFRLENBQUNVLFdBQVQsR0FBdUIsSUFBdkI7QUFDRDtBQUNGOztBQUNEVixZQUFBQSxRQUFRLENBQUNDLEdBQVQsR0FBZWtCLE1BQWY7QUFDSWxCLFlBQUFBLEdBckNSLEdBcUNtQjtBQUNiLHFCQUFPa0I7QUFETSxhQXJDbkI7O0FBQUEsaUJBd0NReEUsY0F4Q1I7QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFBQSxtQkF5Q1ksbUNBQXFCc0QsR0FBckIsRUFBMEJELFFBQTFCLEVBQW9DbkQsV0FBcEMsRUFBaURDLGlCQUFqRCxDQXpDWjs7QUFBQTtBQUdzQ2dJLFlBQUFBLENBQUMsRUFIdkM7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEciLCJzb3VyY2VzQ29udGVudCI6WyIvKiBjb21wYXJlUHJpY2luZ0RhdGEuanNcbiAqIENvbnNvbGlkYXRlcyBmdW5jdGlvbiB0byBjb21wYXJlIGNyeXB0byBtYXJrZXRzIGxvb2tpbmcgZm9yIHNpZ25pZmljYW50IGFyYml0cmFnZSBvcHBvcnR1bml0aWVzLlxuICogU2VuZHMgbm90aWZpY2F0aW9ucyB3aGVuIGxhcmdlIGFyYml0cmFnZSBpcyBkZXRlY3RlZC5cbiAqL1xuXG5pbXBvcnQge1NlbmRNZXNzYWdlfSBmcm9tIFwiLi9zZW5kRU1haWxcIjtcbmltcG9ydCB7dXBkYXRlUmVzdWx0c0luTW9uZ28sIHdyaXRlUmVzdWx0c1RvTW9uZ29TeW5jfSBmcm9tIFwiLi9kYlV0aWxzXCI7XG5cbi8vIFNldCB0aGlzIHRvIGJlIGEgY2xlYXIgdHJhZGluZyBvcHBvcnR1bml0eVxuY29uc3QgYXJiRW1haWxUaHJlc2hvbGRQZXJjZW50ID0gMS4yNTtcbi8vIFNldCB0aGlzIHRvIGJlIHRoZSBmZWVzIGFzc29jaWF0ZWQgd2l0aCB0cmFkaW5nXG5jb25zdCBhcmJSZXBvcnRpbmdUaHJlc2hvbGRQZXJjZW50ID0gMC4wO1xuLy8gQ29udHJvbCBvdXRwdXQgdG8gREJcbmxldCBkYldyaXRlRW5hYmxlZCA9IHRydWU7XG4vLyBDb250cm9sIHJlcG9ydGVkIG91dHB1dFxubGV0IHJlcG9ydExvc2VzID0gZmFsc2U7XG4vLyBtb25nb0RCIC0gRGF0YWJhc2UgYW5kIGNvbGxlY3Rpb25cbmNvbnN0IG1vbmdvREJOYW1lID0gXCJjcnlwdG9cIjtcbmNvbnN0IG1vbmdvREJDb2xsZWN0aW9uID0gXCJtYXJrZXRkYXRhLmFyYm1vbi1wXCI7XG5jb25zdCBtb25nb0RCQ29sbGVjdGlvbkhpc3QgPSBcIm1hcmtldGRhdGEuYXJibW9uaGlzdC1wXCI7XG5cbi8qIGZvcm1hdFRpbWVzdGFtcFxuICogZGVzYzogU2ltcGxlIHV0aWxpdHkgdG8gdHJ1bmNhdGUgdGhlIG91dHB1dCBvZiBsb25nIHRpbWUgc3RhbXBzIHRvIGluY2x1ZGUgb25seSB0aGUgZGF0ZSBhbmQgdGltZSBwYXJ0cy5cbiAqL1xuZnVuY3Rpb24gZm9ybWF0VGltZXN0YW1wKHRpbWVTdGFtcDogRGF0ZSkge1xuICByZXR1cm4odGltZVN0YW1wLnRvU3RyaW5nKCkuc2xpY2UoMCwyNSkpO1xufVxuXG4vKiBjb21wYXJlUG9sb25pZXhDb2luYmFzZVxuICogZGVzYzogTWFpbiBmdW5jdGlvbiBjYWxsZWQgdG8gY29tcGFyZSB0aGUgUG9sb25pZXggYW5kIENvaW5iYXNlIGNyeXB0byBtYXJrZXRzLlxuICogICAgICAgVGhpcyBmdW5jdGlvbiBpcyBleHBvcnRlZCBhbmQgY2FsbGVkIGJlIGFwcC5qc1xuICovXG5mdW5jdGlvbiBjb21wYXJlUG9sb25pZXhDb2luYmFzZShwb2xvRGF0YTogYW55LCBjYkRhdGE6IGFueSwgY29pbjogc3RyaW5nKSB7XG5cbiAgdmFyIHBvbG9KU09OID0gSlNPTi5wYXJzZShwb2xvRGF0YS5leGNoYW5nZURhdGEpO1xuICB2YXIgY2JKU09OID0gSlNPTi5wYXJzZShjYkRhdGEuZXhjaGFuZ2VEYXRhKTtcbiAgbGV0IHRpbWVTdGFtcCA9IG5ldyBEYXRlKCk7XG4gIGNvbnNvbGUubG9nKGAke2Zvcm1hdFRpbWVzdGFtcCh0aW1lU3RhbXApfTogUG9sb1RpbWUtQ0JUaW1lOiAke3BvbG9EYXRhLnRpbWVTdGFtcC5nZXRUaW1lKCktY2JEYXRhLnRpbWVTdGFtcC5nZXRUaW1lKCl9LmApO1xuICBjb21wYXJlQ3VycmVuY3lQYWlyKHRpbWVTdGFtcCwgcG9sb0pTT04sIGNiSlNPTiwgXCJVU0RDXCIsIGNvaW4pXG59XG5cbi8qIGNvbXBhcmVDdXJyZW5jeVBhaXJcbiAqIGRlc2M6IENvbXBhcmVzIGEgY3VycmVuY3kgcGFpciBiZXR3ZWVuIFBvbG9uaWV4IGFuZCBDb2luYmFzZS4gIE5vdGlmaWVzIHdoZW4gc2lnbmlmaWNhbnQgYXJiaXRyYWdlIG9wcG9ydHVuaXRpZXNcbiAqICAgICAgIG9jY3VyLlxuICovXG5mdW5jdGlvbiBjb21wYXJlQ3VycmVuY3lQYWlyKHRpbWVTdGFtcDogRGF0ZSwgcG9sb0pTT046IGFueSwgY2JKU09OOiBhbnksIGNjeTE6IHN0cmluZywgY2N5Mjogc3RyaW5nKSB7XG4gIGxldCBwb2xvUGFpciA9IGNjeTErXCJfXCIrY2N5MjtcbiAgbGV0IHBvbG9CdXlBdCA9ICtwb2xvSlNPTltwb2xvUGFpcl0ubG93ZXN0QXNrO1xuICBsZXQgcG9sb1NlbGxBdCA9ICtwb2xvSlNPTltwb2xvUGFpcl0uaGlnaGVzdEJpZDtcbiAgbGV0IGNvaW5iYXNlU2VsbEF0ID0gK2NiSlNPTi5iaWRzWzBdWzBdO1xuICBsZXQgY29pbmJhc2VCdXlBdCA9ICtjYkpTT04uYXNrc1swXVswXTtcbiAgb3V0cHV0QXJiUmVzdWx0cyhwb2xvQnV5QXQsIHBvbG9TZWxsQXQsIGNvaW5iYXNlU2VsbEF0LCBjb2luYmFzZUJ1eUF0LCBcIkNvaW5iYXNlXCIsIHBvbG9QYWlyLCB0aW1lU3RhbXApO1xuIH1cblxuIC8qIGNvbXBhcmVBbGxQb2xvbmlleEJpdHRyZXhcbiAgKiBkZXNjOiBUYWtlcyB0aGUgcG9sb25pZXggYW5kIGJpdHRyZXggZGF0YSBpbiBKU09OIGZvcm1hdCBhbmQgY29tcGFyZXMgYWxsIG92ZXJsYXBpbmcgbWFya2V0cyBmb3IgYXJiaXRyYWdlLlxuICAqICAgICAgIEV4cG9ydGVkIGZ1bmN0aW9uIGNhbGxlZCBieSB0aGUgbWFpbiBhcHAuanNcbiAgKi9cbmZ1bmN0aW9uIGNvbXBhcmVBbGxQb2xvbmlleEJpdHRyZXgocG9sb0pTT046IGFueSwgYml0dHJleEpTT046IGFueSkge1xuXG4gIGxldCByZXBvcnRpbmdUaW1lc3RhbXAgPSBuZXcgRGF0ZSgpO1xuICBsZXQgcG9sb1RpbWVzdGFtcCA9IHBvbG9KU09OLnRpbWVTdGFtcDtcbiAgbGV0IHBvbG9BbGxNYXJrZXRzID0gSlNPTi5wYXJzZShwb2xvSlNPTi5leGNoYW5nZURhdGEpO1xuICBsZXQgYml0dHJleFRpbWVzdGFtcCA9IGJpdHRyZXhKU09OLnRpbWVTdGFtcDtcbiAgY29uc29sZS5sb2cocG9sb1RpbWVzdGFtcCk7XG4gIGNvbnNvbGUubG9nKGJpdHRyZXhUaW1lc3RhbXApO1xuICBmb3IobGV0IGJpdHRyZXhNa3QgaW4gYml0dHJleEpTT04uZXhjaGFuZ2VEYXRhKXtcbiAgICBsZXQgcG9sb01rdE5hbWUgPSBwb2xvTWt0RnJvbUJpdHRyZXhOYW1lKGJpdHRyZXhNa3QpO1xuICAgIGxldCBwb2xvTWt0RWxlbWVudCA9IHBvbG9BbGxNYXJrZXRzW3BvbG9Na3ROYW1lXTtcbiAgICBpZighcG9sb01rdEVsZW1lbnQpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiUG9sbyBtYXJrZXQgZm9yIFwiLCBiaXR0cmV4TWt0LCBcIiBkb2Vzbid0IGV4aXN0LlwiKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjb21wYXJlUG9sb25pZXhCaXR0cmV4TWt0RWxlbWVudChwb2xvTWt0RWxlbWVudCwgYml0dHJleEpTT04uZXhjaGFuZ2VEYXRhW2JpdHRyZXhNa3RdLCBwb2xvTWt0TmFtZSwgcmVwb3J0aW5nVGltZXN0YW1wKVxuICAgIH1cbiAgfVxufVxuXG4vKiBjb21wYXJlUG9sb25pZXhCaXR0cmV4TWt0RWxlbWVudFxuICogZGVzYzogQ29tcGFyZXMgYSBwYXJ0aWN1bGFyIG1hcmtldCBiZXR3ZWVuIHRoZSBQb2xvbmlleCBhbmQgQml0dHJleCBleGNoYW5nZXMuICBTZWRuIG5vdGlmaWNhdGlvbnMgd2hlblxuICogICAgICAgc2lnbmlmaWNhbnQgYXJiaXRyYWdlIG9wcG9ydHVuaXRpZXMgZXhpc3QuXG4gKi9cbmZ1bmN0aW9uIGNvbXBhcmVQb2xvbmlleEJpdHRyZXhNa3RFbGVtZW50KHBvbG9KU09OOiBhbnksIGJpdHRyZXhKU09OOiBhbnksIHBvbG9QYWlyOiBzdHJpbmcsIHRpbWVTdGFtcDogRGF0ZSkge1xuXG4gIGxldCBwb2xvQnV5QXQgPSArcG9sb0pTT04ubG93ZXN0QXNrO1xuICBsZXQgcG9sb1NlbGxBdCA9ICtwb2xvSlNPTi5oaWdoZXN0QmlkO1xuICBsZXQgYml0dHJleFNlbGxBdCA9ICtiaXR0cmV4SlNPTi5CaWQ7XG4gIGxldCBiaXR0cmV4QnV5QXQgPSArYml0dHJleEpTT04uQXNrO1xuICBvdXRwdXRBcmJSZXN1bHRzKHBvbG9CdXlBdCwgcG9sb1NlbGxBdCwgYml0dHJleFNlbGxBdCwgYml0dHJleEJ1eUF0LCBcIkJpdHRyZXhcIiwgcG9sb1BhaXIsIHRpbWVTdGFtcCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIG91dHB1dEFyYlJlc3VsdHMocG9sb0J1eUF0OiBudW1iZXIsIHBvbG9TZWxsQXQ6IG51bWJlciwgXG4gIGV4Y2hhbmdlMlNlbGxBdDogbnVtYmVyLCBleGNoYW5nZTJCdXlBdDogbnVtYmVyLCBleGNoYW5nZTJOYW1lOiBzdHJpbmcsIFxuICBwb2xvUGFpcjogc3RyaW5nLCB0aW1lU3RhbXA6IERhdGUpIHtcblxuICBsZXQgZGJPdXRwdXQgPSB7XG4gICAga2V5OiBcIlwiLFxuICAgIGV4Y2gxTmFtZTogXCJQb2xvbmlleFwiLFxuICAgIGV4Y2gyTmFtZTogZXhjaGFuZ2UyTmFtZSxcbiAgICB0aW1lU3RhbXA6IHRpbWVTdGFtcC50b1N0cmluZygpLnNsaWNlKDAsMjUpLFxuICAgIGNjeVBhaXI6IHBvbG9QYWlyLFxuICAgIGV4Y2gxQnV5QXQ6IHBvbG9CdXlBdCxcbiAgICBleGNoMVNlbGxBdDogcG9sb1NlbGxBdCxcbiAgICBleGNoMkJ1eUF0OiBleGNoYW5nZTJCdXlBdCxcbiAgICBleGNoMlNlbGxBdDogZXhjaGFuZ2UyU2VsbEF0LFxuICAgIGdhaW5Mb3NzOiBcIkxPU1NcIixcbiAgICB1cmdlbnRUcmFkZTogZmFsc2UsXG4gICAgYXJiUGVyY2VudDogMCxcbiAgICBleGNoMUJ1eU9yU2VsbDogXCJcIixcbiAgICB0cmFkZUluc3RydWN0aW9uczogXCJcIixcbiAgICB0aW1lOiBNYXRoLnJvdW5kKG5ldyBEYXRlKCkuZ2V0VGltZSgpLzEwMDApXG4gIH07XG4gLy8gQ2hlY2sgZm9yIGNhc2Ugb2YgQnV5IGF0IEV4Y2hhbmdlMiBhbmQgU2VsbCBhdCBFeGNoYW5nZTEgKFBvbG8pXG4gIGxldCBhcmJPcHBvcnR1bml0eSA9IHBvbG9TZWxsQXQtZXhjaGFuZ2UyQnV5QXQ7XG4gIGxldCBhcmJQZXJjZW50ID0gMTAwKihwb2xvU2VsbEF0LWV4Y2hhbmdlMkJ1eUF0KS8oIChwb2xvU2VsbEF0K2V4Y2hhbmdlMkJ1eUF0KSAvIDIpO1xuICBkYk91dHB1dC5hcmJQZXJjZW50ID0gYXJiUGVyY2VudDtcbiAgZGJPdXRwdXQuZXhjaDFCdXlPclNlbGwgPSBcIlNlbGxcIjtcbiAgaWYoYXJiUGVyY2VudCA+IGFyYlJlcG9ydGluZ1RocmVzaG9sZFBlcmNlbnQpIHtcbiAgICBkYk91dHB1dC5nYWluTG9zcyA9IFwiR0FJTlwiO1xuICAgIGRiT3V0cHV0LnRyYWRlSW5zdHJ1Y3Rpb25zID0gYCR7cG9sb1BhaXJ9IEJVWSBhdCAke2V4Y2hhbmdlMk5hbWV9IGZvciAke2V4Y2hhbmdlMkJ1eUF0LnRvRml4ZWQoOSl9LiBTRUxMIGF0IFBvbG8gZm9yICR7cG9sb1NlbGxBdC50b0ZpeGVkKDkpfSBHYWluICR7YXJiUGVyY2VudC50b0ZpeGVkKDYpfSVgO1xuICAgIGNvbnNvbGUubG9nKGRiT3V0cHV0LmdhaW5Mb3NzLCBcIjogXCIsIGRiT3V0cHV0LnRyYWRlSW5zdHJ1Y3Rpb25zKTtcbiAgICBpZiAoYXJiUGVyY2VudCA+IGFyYkVtYWlsVGhyZXNob2xkUGVyY2VudCkge1xuICAgICAgZGJPdXRwdXQudXJnZW50VHJhZGUgPSB0cnVlO1xuICAgICAgU2VuZE1lc3NhZ2UoYCR7cG9sb1BhaXJ9OiBCVVkgYXQgJHtleGNoYW5nZTJOYW1lfSBhbmQgU0VMTCBhdCBQb2xvbmlleGAsIGRiT3V0cHV0LnRyYWRlSW5zdHJ1Y3Rpb25zKTtcbiAgICB9XG4gIH1cbiAgZWxzZSB7IFxuICAgIGRiT3V0cHV0LmdhaW5Mb3NzID0gXCJMT1NTXCI7XG4gICAgZGJPdXRwdXQudXJnZW50VHJhZGUgPSBmYWxzZTtcbiAgICBkYk91dHB1dC50cmFkZUluc3RydWN0aW9ucyA9IGAke3BvbG9QYWlyfSBCVVkgYXQgJHtleGNoYW5nZTJOYW1lfSBmb3IgJHtleGNoYW5nZTJCdXlBdC50b0ZpeGVkKDkpfS4gU0VMTCBhdCBQb2xvIGZvciAke3BvbG9TZWxsQXQudG9GaXhlZCg5KX0gTG9zcyAke2FyYlBlcmNlbnQudG9GaXhlZCg2KX0lYDtcbiAgICBpZiAocmVwb3J0TG9zZXMpIHtcbiAgICAgIGNvbnNvbGUubG9nKGAke2Zvcm1hdFRpbWVzdGFtcCh0aW1lU3RhbXApfTogUGFpcjogJHtwb2xvUGFpcn0sIFJlc3VsdDogTE9TUywgRGVzYzogJHtleGNoYW5nZTJOYW1lfSwgJHtleGNoYW5nZTJCdXlBdC50b0ZpeGVkKDgpfSBpcyBncmVhdGVyIHRoYW4gcG9sb1NlbGxBdCwgJHtwb2xvU2VsbEF0LnRvRml4ZWQoOCl9LCBESUZGLCAke2FyYk9wcG9ydHVuaXR5LnRvRml4ZWQoNil9YCk7XG4gICAgfVxuICB9XG4gIGxldCBrZXlTdHIgPSBcIkJ1eVwiK2V4Y2hhbmdlMk5hbWUrXCJTZWxsUG9sb25pZXhcIitwb2xvUGFpcjtcbiAgbGV0IGtleSA9IHtcbiAgICBcImtleVwiOiBrZXlTdHJcbiAgfTtcbiAgZGJPdXRwdXQua2V5ID0ga2V5U3RyO1xuICBpZiAoZGJXcml0ZUVuYWJsZWQpIHtcbiAgICBhd2FpdCB1cGRhdGVSZXN1bHRzSW5Nb25nbyhrZXksIGRiT3V0cHV0LCBtb25nb0RCTmFtZSwgbW9uZ29EQkNvbGxlY3Rpb24pO1xuICAgIGlmIChkYk91dHB1dC51cmdlbnRUcmFkZSkge1xuICAgICAgZGJPdXRwdXQua2V5ICs9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICBhd2FpdCB3cml0ZVJlc3VsdHNUb01vbmdvU3luYyhkYk91dHB1dCwgbW9uZ29EQk5hbWUsIG1vbmdvREJDb2xsZWN0aW9uSGlzdCk7XG4gICAgfVxuICB9XG4gIC8vIENoZWNrIGZvciBjYXNlIG9mIEJ1eSBhdCBFeGNoYW5nZTEoUG9sbykgYW5kIFNlbGwgYXQgRXhjaGFuZ2UyXG4gIGFyYk9wcG9ydHVuaXR5ID0gZXhjaGFuZ2UyU2VsbEF0LXBvbG9CdXlBdDtcbiAgYXJiUGVyY2VudCA9IDEwMCooZXhjaGFuZ2UyU2VsbEF0LXBvbG9CdXlBdCkvKCAoZXhjaGFuZ2UyU2VsbEF0K3BvbG9CdXlBdCkgLyAyKTtcbiAgZGJPdXRwdXQuYXJiUGVyY2VudCA9IGFyYlBlcmNlbnQ7XG4gIGRiT3V0cHV0LmV4Y2gxQnV5T3JTZWxsID0gXCJCdXlcIjtcbiAgaWYoYXJiUGVyY2VudCA+IGFyYlJlcG9ydGluZ1RocmVzaG9sZFBlcmNlbnQpIHsgICAgXG4gICAgZGJPdXRwdXQuZ2Fpbkxvc3MgPSBcIkdBSU5cIjtcbiAgICBkYk91dHB1dC50cmFkZUluc3RydWN0aW9ucyA9IGAke3BvbG9QYWlyfSBCVVkgYXQgUG9sbyBmb3IgJHtwb2xvQnV5QXQudG9GaXhlZCg5KX0uIFNFTEwgJHtleGNoYW5nZTJOYW1lfSBmb3IgJHtleGNoYW5nZTJTZWxsQXQudG9GaXhlZCg5KX0gR2FpbiAke2FyYlBlcmNlbnQudG9GaXhlZCg2KX0lYDtcbiAgICBjb25zb2xlLmxvZyhkYk91dHB1dC5nYWluTG9zcywgXCI6IFwiLCBkYk91dHB1dC50cmFkZUluc3RydWN0aW9ucyk7XG4gICAgaWYgKGFyYlBlcmNlbnQgPiBhcmJFbWFpbFRocmVzaG9sZFBlcmNlbnQpIHtcbiAgICAgIGRiT3V0cHV0LnVyZ2VudFRyYWRlID0gdHJ1ZTtcbiAgICAgIFNlbmRNZXNzYWdlKGAke3BvbG9QYWlyfTogQlVZIGF0IFBvbG9uaWV4IGFuZCBTRUxMIGF0ICR7ZXhjaGFuZ2UyTmFtZX1gLCBkYk91dHB1dC50cmFkZUluc3RydWN0aW9ucyk7XG4gICAgfVxuICB9XG4gIGVsc2Uge1xuICAgIGRiT3V0cHV0LmdhaW5Mb3NzID0gXCJMT1NTXCI7XG4gICAgZGJPdXRwdXQudXJnZW50VHJhZGUgPSBmYWxzZTtcbiAgICBkYk91dHB1dC50cmFkZUluc3RydWN0aW9ucyA9IGAke3BvbG9QYWlyfSBCVVkgYXQgUG9sbyBmb3IgJHtwb2xvQnV5QXQudG9GaXhlZCg5KX0gU0VMTCAke2V4Y2hhbmdlMk5hbWV9IGZvciAke2V4Y2hhbmdlMlNlbGxBdC50b0ZpeGVkKDkpfSBMb3NzICR7YXJiUGVyY2VudC50b0ZpeGVkKDYpfSVgO1xuICAgIGlmIChyZXBvcnRMb3Nlcykge1xuICAgICAgY29uc29sZS5sb2coYCR7Zm9ybWF0VGltZXN0YW1wKHRpbWVTdGFtcCl9OiBQYWlyOiAke3BvbG9QYWlyfSwgUmVzdWx0OiBMT1NTLCBEZXNjOiBwb2xvQnV5QXQsICR7cG9sb0J1eUF0LnRvRml4ZWQoOSl9IGlzIGdyZWF0ZXIgdGhhbiAke2V4Y2hhbmdlMk5hbWV9U2VsbEF0LCAke2V4Y2hhbmdlMlNlbGxBdC50b0ZpeGVkKDgpfS4gRElGRiwgJHthcmJPcHBvcnR1bml0eS50b0ZpeGVkKDcpfWApO1xuICAgIH1cbiAgfVxuICBrZXlTdHIgPSBcIkJ1eVBvbG9uaWV4U2VsbFwiK2V4Y2hhbmdlMk5hbWUrcG9sb1BhaXI7XG4gIGtleSA9IHtcbiAgICBcImtleVwiOiBrZXlTdHJcbiAgfTtcbiAgZGJPdXRwdXQua2V5ID0ga2V5U3RyO1xuICBpZiAoZGJXcml0ZUVuYWJsZWQpIHtcbiAgICBhd2FpdCB1cGRhdGVSZXN1bHRzSW5Nb25nbyhrZXksIGRiT3V0cHV0LCBtb25nb0RCTmFtZSwgbW9uZ29EQkNvbGxlY3Rpb24pO1xuICAgIGlmIChkYk91dHB1dC51cmdlbnRUcmFkZSkge1xuICAgICAgZGJPdXRwdXQua2V5ICs9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgYXdhaXQgd3JpdGVSZXN1bHRzVG9Nb25nb1N5bmMoZGJPdXRwdXQsIG1vbmdvREJOYW1lLCBtb25nb0RCQ29sbGVjdGlvbkhpc3QpO1xuICAgIH1cbiAgfVxufVxuXG4vKiBwb2xvTWt0RnJvbUJpdHRyZXhOYW1lXG4gKiBkZXNjOiBDb252ZXJ0cyBhIEJpdHRyZXggY3J5cHRvIGN1cnJlbmN5IHBhaXIgaW50byB0aGUgUG9sb25pZXggcGFpci5cbiAqL1xuZnVuY3Rpb24gcG9sb01rdEZyb21CaXR0cmV4TmFtZShiaXR0cmV4TWt0TmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYoYml0dHJleE1rdE5hbWU9PT1cIkJUQy1YTE1cIilcbiAgICByZXR1cm4oXCJCVENfU1RSXCIpO1xuICBpZihiaXR0cmV4TWt0TmFtZT09PVwiVVNEVC1YTE1cIilcbiAgICByZXR1cm4oXCJVU0RUX1NUUlwiKTsgICAgXG4gIHJldHVybihiaXR0cmV4TWt0TmFtZS5yZXBsYWNlKFwiLVwiLCBcIl9cIikpO1xufVxuXG4vKiBjb21wYXJlQWxsUG9sb25pZXhIaXRidGNcbiogIGRlc2M6IFRha2VzIHRoZSBwb2xvbmlleCBhbmQgaGl0YnRjIGRhdGEgaW4gSlNPTiBmb3JtYXQgYW5kIGNvbXBhcmVzIGFsbCBvdmVybGFwaW5nIG1hcmtldHMgZm9yIGFyYml0cmFnZS5cbiogICAgICAgRXhwb3J0ZWQgZnVuY3Rpb24gY2FsbGVkIGJ5IHRoZSBtYWluIGFwcC5qc1xuKi9cbmZ1bmN0aW9uIGNvbXBhcmVBbGxQb2xvbmlleEhpdGJ0Yyhwb2xvSlNPTjogYW55LCBoaXRidGNKU09OOiBhbnkpIHtcbiAgXG4gIGxldCByZXBvcnRpbmdUaW1lc3RhbXAgPSBuZXcgRGF0ZSgpO1xuICBsZXQgcG9sb1RpbWVzdGFtcCA9IHBvbG9KU09OLnRpbWVTdGFtcDtcbiAgbGV0IHBvbG9BbGxNYXJrZXRzID0gSlNPTi5wYXJzZShwb2xvSlNPTi5leGNoYW5nZURhdGEpO1xuICBsZXQgaGl0YnRjVGltZXN0YW1wID0gaGl0YnRjSlNPTi50aW1lU3RhbXA7XG4gIGNvbnNvbGUubG9nKHBvbG9UaW1lc3RhbXApO1xuICBjb25zb2xlLmxvZyhoaXRidGNUaW1lc3RhbXApO1xuICBmb3IobGV0IGhpdGJ0Y01rdCBpbiBoaXRidGNKU09OLmV4Y2hhbmdlRGF0YSl7XG4gICAgbGV0IHBvbG9Na3ROYW1lID0gcG9sb01rdEZyb21IaXRidGNOYW1lKGhpdGJ0Y01rdCk7XG4gICAgbGV0IHBvbG9Na3RFbGVtZW50ID0gcG9sb0FsbE1hcmtldHNbcG9sb01rdE5hbWVdO1xuICAgIGNvbXBhcmVQb2xvbmlleEhpdGJ0Y01rdEVsZW1lbnQocG9sb01rdEVsZW1lbnQsIGhpdGJ0Y0pTT04uZXhjaGFuZ2VEYXRhW2hpdGJ0Y01rdF0sIHBvbG9Na3ROYW1lLCByZXBvcnRpbmdUaW1lc3RhbXApO1xuICB9XG59XG5cbi8qIGNvbXBhcmVQb2xvbmlleEhpdGJ0Y01rdEVsZW1lbnRcbiAqIGRlc2M6IFB1bGxzIG91dCB0aGUgYnV5IGFuZCBzZWxsIHByaWNlcyBmb3IgYSBzaW5nbGUgY3VycmVuY3kgcGFpciBmb3IgUG9sb25pZXggYW5kIEhpdGJ0Yy5cbiAqICAgICAgIEZvcndhcmRzIHRoaXMgdG8gdGhlIG91dHB1dCBtZXRob2QgdG8gcmVjb3JkIHRoZSBhcmJpdHJhZ2UgcmVzdWx0cy5cbiAqL1xuZnVuY3Rpb24gY29tcGFyZVBvbG9uaWV4SGl0YnRjTWt0RWxlbWVudChwb2xvTWt0RWxlbWVudDogYW55LCBoaXRidGNNa3RFbGVtZW50OiBhbnksIHBvbG9Na3ROYW1lOiBzdHJpbmcsIHJlcG9ydGluZ1RpbWVzdGFtcDogRGF0ZSkge1xuXG4gIGxldCBwb2xvQnV5QXQgPSArcG9sb01rdEVsZW1lbnQubG93ZXN0QXNrO1xuICBsZXQgcG9sb1NlbGxBdCA9ICtwb2xvTWt0RWxlbWVudC5oaWdoZXN0QmlkO1xuICBsZXQgaGl0YnRjU2VsbEF0ID0gK2hpdGJ0Y01rdEVsZW1lbnQuYmlkO1xuICBsZXQgaGl0YnRjQnV5QXQgPSAraGl0YnRjTWt0RWxlbWVudC5hc2s7XG4gIGlmICghaGl0YnRjU2VsbEF0IHx8ICFoaXRidGNCdXlBdCkge1xuICAgIGNvbnNvbGUubG9nKFwiR290IGJhZCByYXRlcyBmcm9tIHRoZSBoaXRidGMgZm9yOlwiLCBwb2xvTWt0TmFtZSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIG91dHB1dEFyYlJlc3VsdHMocG9sb0J1eUF0LCBwb2xvU2VsbEF0LCBoaXRidGNTZWxsQXQsIGhpdGJ0Y0J1eUF0LCBcIkhpdGJ0Y1wiLCBwb2xvTWt0TmFtZSwgcmVwb3J0aW5nVGltZXN0YW1wKTtcbn1cblxuLyogcG9sb01rdEZyb21IaXRidGNOYW1lXG4gKiBkZXNjOiBNYXBzIGZyb20gSGl0YnRjIHRpY2tlcnMgdG8gUG9sb25pZXggdGlja2Vycy5cbiAqL1xuZnVuY3Rpb24gcG9sb01rdEZyb21IaXRidGNOYW1lKGhpdGJ0Y01rdE5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG5cbiAgY29uc3QgcG9sb01rdE5hbWVzOiBhbnkgPSB7XG4gICAgQkNOQlRDOiAgIFwiQlRDX0JDTlwiLFxuICAgIEJOVFVTRFQ6ICBcIlVTRFRfQk5UXCIsXG4gICAgREFTSEJUQzogIFwiQlRDX0RBU0hcIixcbiAgICBEQVNIVVNEVDogXCJVU0RUX0RBU0hcIixcbiAgICBET0dFQlRDOiAgXCJCVENfRE9HRVwiLFxuICAgIERPR0VVU0RUOiBcIlVTRFRfRE9HRVwiLFxuICAgIERHQkJUQzogICBcIkJUQ19ER0JcIixcbiAgICBFT1NCVEM6ICAgXCJCVENfRU9TXCIsXG4gICAgRU9TVVNEVDogIFwiVVNEVF9FT1NcIixcbiAgICBFVENVU0RUOiAgXCJVU0RUX0VUQ1wiLFxuICAgIEVUSFVTRFQ6ICBcIlVTRFRfRVRIXCIsXG4gICAgTFNLQlRDOiAgIFwiQlRDX0xTS1wiLFxuICAgIE1BSURCVEM6ICBcIkJUQ19NQUlEXCIsXG4gICAgTUFOQUJUQzogIFwiQlRDX01BTkFcIixcbiAgICBPTUdCVEM6ICAgXCJCVENfT01HXCIsXG4gICAgUFBDQlRDOiAgIFwiQlRDX1BQQ1wiLFxuICAgIFFUVU1CVEM6ICBcIkJUQ19RVFVNXCIsXG4gICAgUkVQQlRDOiAgIFwiQlRDX1JFUFwiLFxuICAgIFJFUFVTRFQ6ICBcIlVTRFRfUkVQXCIsXG4gICAgWEVNQlRDOiAgIFwiQlRDX1hFTVwiLFxuICAgIEVUSEJUQzogICBcIkJUQ19FVEhcIixcbiAgICBaRUNFVEg6ICAgXCJFVEhfWkVDXCJcbiAgfTtcbiAgcmV0dXJuKHBvbG9Na3ROYW1lc1toaXRidGNNa3ROYW1lXSk7XG59XG5cbi8qIGNvbXBhcmVBbGxQb2xvbmlleFlvYml0XG4gKiBkZXNjOiBDb21wYXJlcyBtYXJrZXQgZGF0YSBhY3Jvc3MgbWFueSBjdXJyZW5jeSBwYWlycyBiZXR3ZWVuIFBvbG9uaWV4IGFuZCBZb2JpdC5cbiAqICAgICAgIE5vdGUgdGhhdCBZb2JpdCBvZnRlbnMgaGFzIGxhcmdlIHByY2llIGRpc2NyZXBlbmNpZXMgYnV0IHRoZSB3YWxsZXRzIGZvciB0aG9zIGNvaW5zXG4gKiAgICAgICBhcmUgZGVhY3RpdmF0ZWQuICBTbyB5b3UgY2FuJ3QgZ2VuZXJhdGUgYSBwcm9maXQuXG4gKi9cbmZ1bmN0aW9uIGNvbXBhcmVBbGxQb2xvbmlleFlvYml0KHBvbG9EYXRhOiBhbnksIHlvYml0RGF0YTogYW55KSB7XG5cbiAgbGV0IHJlcG9ydGluZ1RpbWVzdGFtcDogRGF0ZSA9IG5ldyBEYXRlKCk7XG4gIGxldCBwb2xvVGltZXN0YW1wOiBEYXRlID0gcG9sb0RhdGEudGltZVN0YW1wO1xuICBsZXQgcG9sb0FsbE1hcmtldHMgPSBKU09OLnBhcnNlKHBvbG9EYXRhLmV4Y2hhbmdlRGF0YSk7XG4gIGxldCB5b2JpdFRpbWVzdGFtcCA9IHlvYml0RGF0YS50aW1lU3RhbXA7XG4gIGxldCB5b2JpdEFsbE1hcmtldHMgPSBKU09OLnBhcnNlKHlvYml0RGF0YS5leGNoYW5nZURhdGEpO1xuICBjb25zb2xlLmxvZyhwb2xvVGltZXN0YW1wKTtcbiAgY29uc29sZS5sb2coeW9iaXRUaW1lc3RhbXApO1xuICBmb3IobGV0IHlvYml0TWt0IGluIHlvYml0QWxsTWFya2V0cyl7XG4gICAgY29uc29sZS5sb2coXCJ5b2JpdE1rdDpcIiwgeW9iaXRNa3QsIFwiIGRhdGE6XCIsIHlvYml0QWxsTWFya2V0c1t5b2JpdE1rdF0pO1xuICAgIGxldCBwb2xvTWt0TmFtZSA9IHBvbG9Na3RGcm9tWW9iaXROYW1lKHlvYml0TWt0KTtcbiAgICBjb25zb2xlLmxvZyhcIlBvbG9NYXJrZXQ6XCIsIHBvbG9Na3ROYW1lLCBcIiBkYXRhOlwiLCBwb2xvQWxsTWFya2V0c1twb2xvTWt0TmFtZV0pO1xuICAgIGNvbXBhcmVQb2xvbmlleFlvYml0TWt0RWxlbWVudChwb2xvQWxsTWFya2V0c1twb2xvTWt0TmFtZV0sIHlvYml0QWxsTWFya2V0c1t5b2JpdE1rdF0sIHBvbG9Na3ROYW1lLCByZXBvcnRpbmdUaW1lc3RhbXApO1xuICB9XG59XG5cbi8qIGNvbXBhcmVQb2xvbmlleFlvYml0TWt0RWxlbWVudFxuICogZGVzYzogUHVsbHMgb3V0IHRoZSBidXkgYW5kIHNlbGwgcHJpY2VzIGZvciBhIHNpbmdsZSBjdXJyZW5jeSBwYWlyIGZvciBQb2xvbmlleCBhbmQgWW9iaXQuXG4gKiAgICAgICBGb3J3YXJkcyB0aGlzIHRvIHRoZSBvdXRwdXQgbWV0aG9kIHRvIHJlY29yZCB0aGUgYXJiaXRyYWdlIHJlc3VsdHMuXG4gKi9cbmZ1bmN0aW9uIGNvbXBhcmVQb2xvbmlleFlvYml0TWt0RWxlbWVudChwb2xvTWt0RWxlbWVudDogYW55LCB5b2JpdE1rdEVsZW1lbnQ6IGFueSwgcG9sb01rdE5hbWU6IGFueSwgcmVwb3J0aW5nVGltZXN0YW1wOiBEYXRlKSB7XG5cbiAgbGV0IHBvbG9CdXlBdCA9ICtwb2xvTWt0RWxlbWVudC5sb3dlc3RBc2s7XG4gIGxldCBwb2xvU2VsbEF0ID0gK3BvbG9Na3RFbGVtZW50LmhpZ2hlc3RCaWQ7XG4gIGxldCB5b2JpdFNlbGxBdCA9ICt5b2JpdE1rdEVsZW1lbnQuc2VsbDtcbiAgbGV0IHlvYml0QnV5QXQgPSAreW9iaXRNa3RFbGVtZW50LmJ1eTtcbiAgb3V0cHV0QXJiUmVzdWx0cyhwb2xvQnV5QXQsIHBvbG9TZWxsQXQsIHlvYml0U2VsbEF0LCB5b2JpdEJ1eUF0LCBcIllvYml0XCIsIHBvbG9Na3ROYW1lLCByZXBvcnRpbmdUaW1lc3RhbXApO1xufVxuXG4vKiBwb2xvTWt0RnJvbVlvYml0TmFtZVxuICogZGVzYzogTWFwcyBmcm9tIFlvYml0IHRpY2tlcnMgdG8gUG9sb25pZXggdGlja2Vycy5cbiAqL1xuZnVuY3Rpb24gcG9sb01rdEZyb21Zb2JpdE5hbWUoeW9iaXRNa3ROYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuXG4gIGNvbnN0IHBvbG9Na3ROYW1lczogYW55ID0ge1xuICAgIGx0Y19idGM6ICBcIkJUQ19MVENcIixcbiAgICBubWNfYnRjOiAgXCJCVENfTk1DXCIsXG4gICAgbm1yX2J0YzogIFwiQlRDX05NUlwiLFxuICAgIGV0aF9idGM6ICBcIkJUQ19FVEhcIlxuICB9O1xuICByZXR1cm4ocG9sb01rdE5hbWVzW3lvYml0TWt0TmFtZV0pO1xufVxuXG5cbmFzeW5jIGZ1bmN0aW9uIGludGVybmFsQ29tcGFyZUZvcllvYml0KG1rdERhdGEgOiBhbnksIHlvYml0TWFya2V0cyA6IEFycmF5PHN0cmluZz4sIGJhc2VNYXJrZXRzIDogQXJyYXk8c3RyaW5nPikge1xuXG4gIGxldCB0aW1lU3RhbXAgPSBuZXcgRGF0ZSgpO1xuICBmb3IobGV0IGk9MDsgaTx5b2JpdE1hcmtldHMubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgY3VyTWt0MTogc3RyaW5nID0geW9iaXRNYXJrZXRzW2ldICsgXCJfXCIgKyBiYXNlTWFya2V0c1swXTtcbiAgICBsZXQgY3VyTWt0Mjogc3RyaW5nID0geW9iaXRNYXJrZXRzW2ldICsgXCJfXCIgKyBiYXNlTWFya2V0c1sxXTtcbiAgICBsZXQgYmFzZVBhaXI6IHN0cmluZyA9IGJhc2VNYXJrZXRzWzFdICsgXCJfXCIgKyBiYXNlTWFya2V0c1swXTtcbiAgICBsZXQgYXJiRnJhY3Rpb246IG51bWJlciA9IG1rdERhdGFbYmFzZVBhaXJdLmJ1eSAqIG1rdERhdGFbY3VyTWt0Ml0uYnV5IC8gbWt0RGF0YVtjdXJNa3QxXS5zZWxsO1xuICAgIGNvbnNvbGUubG9nKFwiQXJiIEZyYWN0aW9uIGZvciBcIiwgeW9iaXRNYXJrZXRzW2ldLCBcIjogXCIsIGFyYkZyYWN0aW9uLnRvRml4ZWQoNikpO1xuICAgIGxldCBrZXlTdHIgPSBcIllvYml0SW50ZXJuYWxfXCIgKyBjdXJNa3QxICsgXCJfXCIgKyBiYXNlTWFya2V0c1sxXTtcbiAgICBsZXQgZGJPdXRwdXQgPSB7XG4gICAgICBrZXk6IGtleVN0cixcbiAgICAgIGV4Y2gxTmFtZTogXCJZb2JpdFwiLFxuICAgICAgZXhjaDJOYW1lOiBcIllvYml0XCIsXG4gICAgICB0aW1lU3RhbXA6IHRpbWVTdGFtcC50b1N0cmluZygpLnNsaWNlKDAsMjUpLFxuICAgICAgY2N5UGFpcjogY3VyTWt0MSxcbiAgICAgIGV4Y2gxQnV5QXQ6IG1rdERhdGFbY3VyTWt0MV0uc2VsbCxcbiAgICAgIGV4Y2gxU2VsbEF0OiAwLFxuICAgICAgZXhjaDJCdXlBdDogMCxcbiAgICAgIGV4Y2gyU2VsbEF0OiBta3REYXRhW2N1ck1rdDJdLmJ1eSxcbiAgICAgIGdhaW5Mb3NzOiBcIkxvc3NcIixcbiAgICAgIHVyZ2VudFRyYWRlOiBmYWxzZSxcbiAgICAgIGFyYlBlcmNlbnQ6IGFyYkZyYWN0aW9uLFxuICAgICAgZXhjaDFCdXlPclNlbGw6IFwiQnV5XCIsXG4gICAgICB0cmFkZUluc3RydWN0aW9uczogXCJcIixcbiAgICB9O1xuICAgIGlmIChhcmJGcmFjdGlvbiA+IDEpIHtcbiAgICAgIGRiT3V0cHV0LmdhaW5Mb3NzID0gXCJHYWluXCI7XG4gICAgICBjb25zb2xlLmxvZyhcIiAgLS0tPiBHYWluXCIsIHRpbWVTdGFtcC50b1N0cmluZygpLnNsaWNlKDAsMjUpLCBcIiBcIiwgYXJiRnJhY3Rpb24udG9GaXhlZCg4KSwgXG4gICAgICAgIFwiQnV5IFwiLCB5b2JpdE1hcmtldHNbaV0sIFwiIHdpdGggQlRDIGF0XCIsIG1rdERhdGFbY3VyTWt0MV0uc2VsbCxcbiAgICAgICAgXCJzZWxsIHRoZVwiLCB5b2JpdE1hcmtldHNbaV0sIFwiZm9yXCIsIG1rdERhdGFbY3VyTWt0Ml0uYnV5LCBcbiAgICAgICAgXCJ0byBnZXQgRVRILiBDb252ZXJ0IEVUSCBiYWNrIHRvIEJUQyBhdFwiLCBta3REYXRhW2Jhc2VQYWlyXS5idXkpO1xuICAgICAgaWYgKGFyYkZyYWN0aW9uID4gMS4wMDUpIHtcbiAgICAgICAgZGJPdXRwdXQudXJnZW50VHJhZGUgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICBkYk91dHB1dC5rZXkgPSBrZXlTdHI7XG4gICAgbGV0IGtleTogYW55ID0ge1xuICAgICAgXCJrZXlcIjoga2V5U3RyXG4gICAgfTtcbiAgICBpZiAoZGJXcml0ZUVuYWJsZWQpIHtcbiAgICAgIGF3YWl0IHVwZGF0ZVJlc3VsdHNJbk1vbmdvKGtleSwgZGJPdXRwdXQsIG1vbmdvREJOYW1lLCBtb25nb0RCQ29sbGVjdGlvbik7XG4gICAgfSAgICBcbiAgfVxufVxuXG5leHBvcnQge2NvbXBhcmVQb2xvbmlleENvaW5iYXNlLCBjb21wYXJlQWxsUG9sb25pZXhCaXR0cmV4LCBjb21wYXJlQWxsUG9sb25pZXhIaXRidGMsIFxuICBjb21wYXJlQWxsUG9sb25pZXhZb2JpdCwgaW50ZXJuYWxDb21wYXJlRm9yWW9iaXR9O1xuIl19