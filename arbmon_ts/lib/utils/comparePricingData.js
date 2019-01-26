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

var reportLoses = false;
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
            return (0, _dbUtils.updateResultsInMongo)(key, dbOutput, "crypto", "marketdata.arbmon");

          case 12:
            if (!dbOutput.urgentTrade) {
              _context.next = 16;
              break;
            }

            dbOutput.key += new Date().getTime();
            _context.next = 16;
            return (0, _dbUtils.writeResultsToMongoSync)(dbOutput, "crypto", "marketdata.arbmonhist");

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
            return (0, _dbUtils.updateResultsInMongo)(key, dbOutput, "crypto", "marketdata.arbmon");

          case 27:
            if (!dbOutput.urgentTrade) {
              _context.next = 31;
              break;
            }

            dbOutput.key += new Date().getTime();
            _context.next = 31;
            return (0, _dbUtils.writeResultsToMongoSync)(dbOutput, "crypto", "marketdata.arbmonhist");

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
            return (0, _dbUtils.updateResultsInMongo)(key, dbOutput, "crypto", "marketdata.arbmon");

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9jb21wYXJlUHJpY2luZ0RhdGEudHMiXSwibmFtZXMiOlsiYXJiRW1haWxUaHJlc2hvbGRQZXJjZW50IiwiYXJiUmVwb3J0aW5nVGhyZXNob2xkUGVyY2VudCIsImRiV3JpdGVFbmFibGVkIiwicmVwb3J0TG9zZXMiLCJmb3JtYXRUaW1lc3RhbXAiLCJ0aW1lU3RhbXAiLCJ0b1N0cmluZyIsInNsaWNlIiwiY29tcGFyZVBvbG9uaWV4Q29pbmJhc2UiLCJwb2xvRGF0YSIsImNiRGF0YSIsImNvaW4iLCJwb2xvSlNPTiIsIkpTT04iLCJwYXJzZSIsImV4Y2hhbmdlRGF0YSIsImNiSlNPTiIsIkRhdGUiLCJjb25zb2xlIiwibG9nIiwiZ2V0VGltZSIsImNvbXBhcmVDdXJyZW5jeVBhaXIiLCJjY3kxIiwiY2N5MiIsInBvbG9QYWlyIiwicG9sb0J1eUF0IiwibG93ZXN0QXNrIiwicG9sb1NlbGxBdCIsImhpZ2hlc3RCaWQiLCJjb2luYmFzZVNlbGxBdCIsImJpZHMiLCJjb2luYmFzZUJ1eUF0IiwiYXNrcyIsIm91dHB1dEFyYlJlc3VsdHMiLCJjb21wYXJlQWxsUG9sb25pZXhCaXR0cmV4IiwiYml0dHJleEpTT04iLCJyZXBvcnRpbmdUaW1lc3RhbXAiLCJwb2xvVGltZXN0YW1wIiwicG9sb0FsbE1hcmtldHMiLCJiaXR0cmV4VGltZXN0YW1wIiwiYml0dHJleE1rdCIsInBvbG9Na3ROYW1lIiwicG9sb01rdEZyb21CaXR0cmV4TmFtZSIsInBvbG9Na3RFbGVtZW50IiwiY29tcGFyZVBvbG9uaWV4Qml0dHJleE1rdEVsZW1lbnQiLCJiaXR0cmV4U2VsbEF0IiwiQmlkIiwiYml0dHJleEJ1eUF0IiwiQXNrIiwiZXhjaGFuZ2UyU2VsbEF0IiwiZXhjaGFuZ2UyQnV5QXQiLCJleGNoYW5nZTJOYW1lIiwiZGJPdXRwdXQiLCJrZXkiLCJleGNoMU5hbWUiLCJleGNoMk5hbWUiLCJjY3lQYWlyIiwiZXhjaDFCdXlBdCIsImV4Y2gxU2VsbEF0IiwiZXhjaDJCdXlBdCIsImV4Y2gyU2VsbEF0IiwiZ2Fpbkxvc3MiLCJ1cmdlbnRUcmFkZSIsImFyYlBlcmNlbnQiLCJleGNoMUJ1eU9yU2VsbCIsInRyYWRlSW5zdHJ1Y3Rpb25zIiwidGltZSIsIk1hdGgiLCJyb3VuZCIsImFyYk9wcG9ydHVuaXR5IiwidG9GaXhlZCIsImtleVN0ciIsImJpdHRyZXhNa3ROYW1lIiwicmVwbGFjZSIsImNvbXBhcmVBbGxQb2xvbmlleEhpdGJ0YyIsImhpdGJ0Y0pTT04iLCJoaXRidGNUaW1lc3RhbXAiLCJoaXRidGNNa3QiLCJwb2xvTWt0RnJvbUhpdGJ0Y05hbWUiLCJjb21wYXJlUG9sb25pZXhIaXRidGNNa3RFbGVtZW50IiwiaGl0YnRjTWt0RWxlbWVudCIsImhpdGJ0Y1NlbGxBdCIsImJpZCIsImhpdGJ0Y0J1eUF0IiwiYXNrIiwiaGl0YnRjTWt0TmFtZSIsInBvbG9Na3ROYW1lcyIsIkJDTkJUQyIsIkJOVFVTRFQiLCJEQVNIQlRDIiwiREFTSFVTRFQiLCJET0dFQlRDIiwiRE9HRVVTRFQiLCJER0JCVEMiLCJFT1NCVEMiLCJFT1NVU0RUIiwiRVRDVVNEVCIsIkVUSFVTRFQiLCJMU0tCVEMiLCJNQUlEQlRDIiwiTUFOQUJUQyIsIk9NR0JUQyIsIlBQQ0JUQyIsIlFUVU1CVEMiLCJSRVBCVEMiLCJSRVBVU0RUIiwiWEVNQlRDIiwiRVRIQlRDIiwiWkVDRVRIIiwiY29tcGFyZUFsbFBvbG9uaWV4WW9iaXQiLCJ5b2JpdERhdGEiLCJ5b2JpdFRpbWVzdGFtcCIsInlvYml0QWxsTWFya2V0cyIsInlvYml0TWt0IiwicG9sb01rdEZyb21Zb2JpdE5hbWUiLCJjb21wYXJlUG9sb25pZXhZb2JpdE1rdEVsZW1lbnQiLCJ5b2JpdE1rdEVsZW1lbnQiLCJ5b2JpdFNlbGxBdCIsInNlbGwiLCJ5b2JpdEJ1eUF0IiwiYnV5IiwieW9iaXRNa3ROYW1lIiwibHRjX2J0YyIsIm5tY19idGMiLCJubXJfYnRjIiwiZXRoX2J0YyIsImludGVybmFsQ29tcGFyZUZvcllvYml0IiwibWt0RGF0YSIsInlvYml0TWFya2V0cyIsImJhc2VNYXJrZXRzIiwiaSIsImxlbmd0aCIsImN1ck1rdDEiLCJjdXJNa3QyIiwiYmFzZVBhaXIiLCJhcmJGcmFjdGlvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFLQTs7QUFDQTs7Ozs7O0FBRUE7QUFDQSxJQUFNQSx3QkFBd0IsR0FBRyxJQUFqQyxDLENBQ0E7O0FBQ0EsSUFBTUMsNEJBQTRCLEdBQUcsR0FBckMsQyxDQUNBOztBQUNBLElBQUlDLGNBQWMsR0FBRyxJQUFyQixDLENBQ0E7O0FBQ0EsSUFBSUMsV0FBVyxHQUFHLEtBQWxCO0FBRUE7Ozs7QUFHQSxTQUFTQyxlQUFULENBQXlCQyxTQUF6QixFQUEwQztBQUN4QyxTQUFPQSxTQUFTLENBQUNDLFFBQVYsR0FBcUJDLEtBQXJCLENBQTJCLENBQTNCLEVBQTZCLEVBQTdCLENBQVA7QUFDRDtBQUVEOzs7Ozs7QUFJQSxTQUFTQyx1QkFBVCxDQUFpQ0MsUUFBakMsRUFBZ0RDLE1BQWhELEVBQTZEQyxJQUE3RCxFQUEyRTtBQUV6RSxNQUFJQyxRQUFRLEdBQUdDLElBQUksQ0FBQ0MsS0FBTCxDQUFXTCxRQUFRLENBQUNNLFlBQXBCLENBQWY7QUFDQSxNQUFJQyxNQUFNLEdBQUdILElBQUksQ0FBQ0MsS0FBTCxDQUFXSixNQUFNLENBQUNLLFlBQWxCLENBQWI7QUFDQSxNQUFJVixTQUFTLEdBQUcsSUFBSVksSUFBSixFQUFoQjtBQUNBQyxFQUFBQSxPQUFPLENBQUNDLEdBQVIsV0FBZWYsZUFBZSxDQUFDQyxTQUFELENBQTlCLGdDQUErREksUUFBUSxDQUFDSixTQUFULENBQW1CZSxPQUFuQixLQUE2QlYsTUFBTSxDQUFDTCxTQUFQLENBQWlCZSxPQUFqQixFQUE1RjtBQUNBQyxFQUFBQSxtQkFBbUIsQ0FBQ2hCLFNBQUQsRUFBWU8sUUFBWixFQUFzQkksTUFBdEIsRUFBOEIsTUFBOUIsRUFBc0NMLElBQXRDLENBQW5CO0FBQ0Q7QUFFRDs7Ozs7O0FBSUEsU0FBU1UsbUJBQVQsQ0FBNkJoQixT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Q0FBQ2pFLE9BQVosQ0FBb0IsQ0FBcEIsQ0FBbEUsRUFDRSxNQURGLEVBQ1UwRCxZQUFZLENBQUNFLENBQUQsQ0FEdEIsRUFDMkIsY0FEM0IsRUFDMkNILE9BQU8sQ0FBQ0ssT0FBRCxDQUFQLENBQWlCZCxJQUQ1RCxFQUVFLFVBRkYsRUFFY1UsWUFBWSxDQUFDRSxDQUFELENBRjFCLEVBRStCLEtBRi9CLEVBRXNDSCxPQUFPLENBQUNNLE9BQUQsQ0FBUCxDQUFpQmIsR0FGdkQsRUFHRSx3Q0FIRixFQUc0Q08sT0FBTyxDQUFDTyxRQUFELENBQVAsQ0FBa0JkLEdBSDlEOztBQUlBLGtCQUFJZSxXQUFXLEdBQUcsS0FBbEIsRUFBeUI7QUFDdkJuRixnQkFBQUEsUUFBUSxDQUFDVSxXQUFULEdBQXVCLElBQXZCO0FBQ0Q7QUFDRjs7QUFDRFYsWUFBQUEsUUFBUSxDQUFDQyxHQUFULEdBQWVrQixNQUFmO0FBQ0lsQixZQUFBQSxHQXJDUixHQXFDbUI7QUFDYixxQkFBT2tCO0FBRE0sYUFyQ25COztBQUFBLGlCQXdDUXJFLGNBeENSO0FBQUE7QUFBQTtBQUFBOztBQUFBO0FBQUEsbUJBeUNZLG1DQUFxQm1ELEdBQXJCLEVBQTBCRCxRQUExQixFQUFvQyxRQUFwQyxFQUE4QyxtQkFBOUMsQ0F6Q1o7O0FBQUE7QUFHc0M4RSxZQUFBQSxDQUFDLEVBSHZDO0FBQUE7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxHIiwic291cmNlc0NvbnRlbnQiOlsiLyogY29tcGFyZVByaWNpbmdEYXRhLmpzXG4gKiBDb25zb2xpZGF0ZXMgZnVuY3Rpb24gdG8gY29tcGFyZSBjcnlwdG8gbWFya2V0cyBsb29raW5nIGZvciBzaWduaWZpY2FudCBhcmJpdHJhZ2Ugb3Bwb3J0dW5pdGllcy5cbiAqIFNlbmRzIG5vdGlmaWNhdGlvbnMgd2hlbiBsYXJnZSBhcmJpdHJhZ2UgaXMgZGV0ZWN0ZWQuXG4gKi9cblxuaW1wb3J0IHtTZW5kTWVzc2FnZX0gZnJvbSBcIi4vc2VuZEVNYWlsXCI7XG5pbXBvcnQge3VwZGF0ZVJlc3VsdHNJbk1vbmdvLCB3cml0ZVJlc3VsdHNUb01vbmdvU3luY30gZnJvbSBcIi4vZGJVdGlsc1wiO1xuXG4vLyBTZXQgdGhpcyB0byBiZSBhIGNsZWFyIHRyYWRpbmcgb3Bwb3J0dW5pdHlcbmNvbnN0IGFyYkVtYWlsVGhyZXNob2xkUGVyY2VudCA9IDEuMjU7XG4vLyBTZXQgdGhpcyB0byBiZSB0aGUgZmVlcyBhc3NvY2lhdGVkIHdpdGggdHJhZGluZ1xuY29uc3QgYXJiUmVwb3J0aW5nVGhyZXNob2xkUGVyY2VudCA9IDAuMDtcbi8vIENvbnRyb2wgb3V0cHV0IHRvIERCXG5sZXQgZGJXcml0ZUVuYWJsZWQgPSB0cnVlO1xuLy8gQ29udHJvbCByZXBvcnRlZCBvdXRwdXRcbmxldCByZXBvcnRMb3NlcyA9IGZhbHNlO1xuXG4vKiBmb3JtYXRUaW1lc3RhbXBcbiAqIGRlc2M6IFNpbXBsZSB1dGlsaXR5IHRvIHRydW5jYXRlIHRoZSBvdXRwdXQgb2YgbG9uZyB0aW1lIHN0YW1wcyB0byBpbmNsdWRlIG9ubHkgdGhlIGRhdGUgYW5kIHRpbWUgcGFydHMuXG4gKi9cbmZ1bmN0aW9uIGZvcm1hdFRpbWVzdGFtcCh0aW1lU3RhbXA6IERhdGUpIHtcbiAgcmV0dXJuKHRpbWVTdGFtcC50b1N0cmluZygpLnNsaWNlKDAsMjUpKTtcbn1cblxuLyogY29tcGFyZVBvbG9uaWV4Q29pbmJhc2VcbiAqIGRlc2M6IE1haW4gZnVuY3Rpb24gY2FsbGVkIHRvIGNvbXBhcmUgdGhlIFBvbG9uaWV4IGFuZCBDb2luYmFzZSBjcnlwdG8gbWFya2V0cy5cbiAqICAgICAgIFRoaXMgZnVuY3Rpb24gaXMgZXhwb3J0ZWQgYW5kIGNhbGxlZCBiZSBhcHAuanNcbiAqL1xuZnVuY3Rpb24gY29tcGFyZVBvbG9uaWV4Q29pbmJhc2UocG9sb0RhdGE6IGFueSwgY2JEYXRhOiBhbnksIGNvaW46IHN0cmluZykge1xuXG4gIHZhciBwb2xvSlNPTiA9IEpTT04ucGFyc2UocG9sb0RhdGEuZXhjaGFuZ2VEYXRhKTtcbiAgdmFyIGNiSlNPTiA9IEpTT04ucGFyc2UoY2JEYXRhLmV4Y2hhbmdlRGF0YSk7XG4gIGxldCB0aW1lU3RhbXAgPSBuZXcgRGF0ZSgpO1xuICBjb25zb2xlLmxvZyhgJHtmb3JtYXRUaW1lc3RhbXAodGltZVN0YW1wKX06IFBvbG9UaW1lLUNCVGltZTogJHtwb2xvRGF0YS50aW1lU3RhbXAuZ2V0VGltZSgpLWNiRGF0YS50aW1lU3RhbXAuZ2V0VGltZSgpfS5gKTtcbiAgY29tcGFyZUN1cnJlbmN5UGFpcih0aW1lU3RhbXAsIHBvbG9KU09OLCBjYkpTT04sIFwiVVNEQ1wiLCBjb2luKVxufVxuXG4vKiBjb21wYXJlQ3VycmVuY3lQYWlyXG4gKiBkZXNjOiBDb21wYXJlcyBhIGN1cnJlbmN5IHBhaXIgYmV0d2VlbiBQb2xvbmlleCBhbmQgQ29pbmJhc2UuICBOb3RpZmllcyB3aGVuIHNpZ25pZmljYW50IGFyYml0cmFnZSBvcHBvcnR1bml0aWVzXG4gKiAgICAgICBvY2N1ci5cbiAqL1xuZnVuY3Rpb24gY29tcGFyZUN1cnJlbmN5UGFpcih0aW1lU3RhbXA6IERhdGUsIHBvbG9KU09OOiBhbnksIGNiSlNPTjogYW55LCBjY3kxOiBzdHJpbmcsIGNjeTI6IHN0cmluZykge1xuICBsZXQgcG9sb1BhaXIgPSBjY3kxK1wiX1wiK2NjeTI7XG4gIGxldCBwb2xvQnV5QXQgPSArcG9sb0pTT05bcG9sb1BhaXJdLmxvd2VzdEFzaztcbiAgbGV0IHBvbG9TZWxsQXQgPSArcG9sb0pTT05bcG9sb1BhaXJdLmhpZ2hlc3RCaWQ7XG4gIGxldCBjb2luYmFzZVNlbGxBdCA9ICtjYkpTT04uYmlkc1swXVswXTtcbiAgbGV0IGNvaW5iYXNlQnV5QXQgPSArY2JKU09OLmFza3NbMF1bMF07XG4gIG91dHB1dEFyYlJlc3VsdHMocG9sb0J1eUF0LCBwb2xvU2VsbEF0LCBjb2luYmFzZVNlbGxBdCwgY29pbmJhc2VCdXlBdCwgXCJDb2luYmFzZVwiLCBwb2xvUGFpciwgdGltZVN0YW1wKTtcbiB9XG5cbiAvKiBjb21wYXJlQWxsUG9sb25pZXhCaXR0cmV4XG4gICogZGVzYzogVGFrZXMgdGhlIHBvbG9uaWV4IGFuZCBiaXR0cmV4IGRhdGEgaW4gSlNPTiBmb3JtYXQgYW5kIGNvbXBhcmVzIGFsbCBvdmVybGFwaW5nIG1hcmtldHMgZm9yIGFyYml0cmFnZS5cbiAgKiAgICAgICBFeHBvcnRlZCBmdW5jdGlvbiBjYWxsZWQgYnkgdGhlIG1haW4gYXBwLmpzXG4gICovXG5mdW5jdGlvbiBjb21wYXJlQWxsUG9sb25pZXhCaXR0cmV4KHBvbG9KU09OOiBhbnksIGJpdHRyZXhKU09OOiBhbnkpIHtcblxuICBsZXQgcmVwb3J0aW5nVGltZXN0YW1wID0gbmV3IERhdGUoKTtcbiAgbGV0IHBvbG9UaW1lc3RhbXAgPSBwb2xvSlNPTi50aW1lU3RhbXA7XG4gIGxldCBwb2xvQWxsTWFya2V0cyA9IEpTT04ucGFyc2UocG9sb0pTT04uZXhjaGFuZ2VEYXRhKTtcbiAgbGV0IGJpdHRyZXhUaW1lc3RhbXAgPSBiaXR0cmV4SlNPTi50aW1lU3RhbXA7XG4gIGNvbnNvbGUubG9nKHBvbG9UaW1lc3RhbXApO1xuICBjb25zb2xlLmxvZyhiaXR0cmV4VGltZXN0YW1wKTtcbiAgZm9yKGxldCBiaXR0cmV4TWt0IGluIGJpdHRyZXhKU09OLmV4Y2hhbmdlRGF0YSl7XG4gICAgbGV0IHBvbG9Na3ROYW1lID0gcG9sb01rdEZyb21CaXR0cmV4TmFtZShiaXR0cmV4TWt0KTtcbiAgICBsZXQgcG9sb01rdEVsZW1lbnQgPSBwb2xvQWxsTWFya2V0c1twb2xvTWt0TmFtZV07XG4gICAgaWYoIXBvbG9Na3RFbGVtZW50KSB7XG4gICAgICBjb25zb2xlLmxvZyhcIlBvbG8gbWFya2V0IGZvciBcIiwgYml0dHJleE1rdCwgXCIgZG9lc24ndCBleGlzdC5cIik7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY29tcGFyZVBvbG9uaWV4Qml0dHJleE1rdEVsZW1lbnQocG9sb01rdEVsZW1lbnQsIGJpdHRyZXhKU09OLmV4Y2hhbmdlRGF0YVtiaXR0cmV4TWt0XSwgcG9sb01rdE5hbWUsIHJlcG9ydGluZ1RpbWVzdGFtcClcbiAgICB9XG4gIH1cbn1cblxuLyogY29tcGFyZVBvbG9uaWV4Qml0dHJleE1rdEVsZW1lbnRcbiAqIGRlc2M6IENvbXBhcmVzIGEgcGFydGljdWxhciBtYXJrZXQgYmV0d2VlbiB0aGUgUG9sb25pZXggYW5kIEJpdHRyZXggZXhjaGFuZ2VzLiAgU2VkbiBub3RpZmljYXRpb25zIHdoZW5cbiAqICAgICAgIHNpZ25pZmljYW50IGFyYml0cmFnZSBvcHBvcnR1bml0aWVzIGV4aXN0LlxuICovXG5mdW5jdGlvbiBjb21wYXJlUG9sb25pZXhCaXR0cmV4TWt0RWxlbWVudChwb2xvSlNPTjogYW55LCBiaXR0cmV4SlNPTjogYW55LCBwb2xvUGFpcjogc3RyaW5nLCB0aW1lU3RhbXA6IERhdGUpIHtcblxuICBsZXQgcG9sb0J1eUF0ID0gK3BvbG9KU09OLmxvd2VzdEFzaztcbiAgbGV0IHBvbG9TZWxsQXQgPSArcG9sb0pTT04uaGlnaGVzdEJpZDtcbiAgbGV0IGJpdHRyZXhTZWxsQXQgPSArYml0dHJleEpTT04uQmlkO1xuICBsZXQgYml0dHJleEJ1eUF0ID0gK2JpdHRyZXhKU09OLkFzaztcbiAgb3V0cHV0QXJiUmVzdWx0cyhwb2xvQnV5QXQsIHBvbG9TZWxsQXQsIGJpdHRyZXhTZWxsQXQsIGJpdHRyZXhCdXlBdCwgXCJCaXR0cmV4XCIsIHBvbG9QYWlyLCB0aW1lU3RhbXApO1xufVxuXG5hc3luYyBmdW5jdGlvbiBvdXRwdXRBcmJSZXN1bHRzKHBvbG9CdXlBdDogbnVtYmVyLCBwb2xvU2VsbEF0OiBudW1iZXIsIFxuICBleGNoYW5nZTJTZWxsQXQ6IG51bWJlciwgZXhjaGFuZ2UyQnV5QXQ6IG51bWJlciwgZXhjaGFuZ2UyTmFtZTogc3RyaW5nLCBcbiAgcG9sb1BhaXI6IHN0cmluZywgdGltZVN0YW1wOiBEYXRlKSB7XG5cbiAgbGV0IGRiT3V0cHV0ID0ge1xuICAgIGtleTogXCJcIixcbiAgICBleGNoMU5hbWU6IFwiUG9sb25pZXhcIixcbiAgICBleGNoMk5hbWU6IGV4Y2hhbmdlMk5hbWUsXG4gICAgdGltZVN0YW1wOiB0aW1lU3RhbXAudG9TdHJpbmcoKS5zbGljZSgwLDI1KSxcbiAgICBjY3lQYWlyOiBwb2xvUGFpcixcbiAgICBleGNoMUJ1eUF0OiBwb2xvQnV5QXQsXG4gICAgZXhjaDFTZWxsQXQ6IHBvbG9TZWxsQXQsXG4gICAgZXhjaDJCdXlBdDogZXhjaGFuZ2UyQnV5QXQsXG4gICAgZXhjaDJTZWxsQXQ6IGV4Y2hhbmdlMlNlbGxBdCxcbiAgICBnYWluTG9zczogXCJMT1NTXCIsXG4gICAgdXJnZW50VHJhZGU6IGZhbHNlLFxuICAgIGFyYlBlcmNlbnQ6IDAsXG4gICAgZXhjaDFCdXlPclNlbGw6IFwiXCIsXG4gICAgdHJhZGVJbnN0cnVjdGlvbnM6IFwiXCIsXG4gICAgdGltZTogTWF0aC5yb3VuZChuZXcgRGF0ZSgpLmdldFRpbWUoKS8xMDAwKVxuICB9O1xuIC8vIENoZWNrIGZvciBjYXNlIG9mIEJ1eSBhdCBFeGNoYW5nZTIgYW5kIFNlbGwgYXQgRXhjaGFuZ2UxIChQb2xvKVxuICBsZXQgYXJiT3Bwb3J0dW5pdHkgPSBwb2xvU2VsbEF0LWV4Y2hhbmdlMkJ1eUF0O1xuICBsZXQgYXJiUGVyY2VudCA9IDEwMCoocG9sb1NlbGxBdC1leGNoYW5nZTJCdXlBdCkvKCAocG9sb1NlbGxBdCtleGNoYW5nZTJCdXlBdCkgLyAyKTtcbiAgZGJPdXRwdXQuYXJiUGVyY2VudCA9IGFyYlBlcmNlbnQ7XG4gIGRiT3V0cHV0LmV4Y2gxQnV5T3JTZWxsID0gXCJTZWxsXCI7XG4gIGlmKGFyYlBlcmNlbnQgPiBhcmJSZXBvcnRpbmdUaHJlc2hvbGRQZXJjZW50KSB7XG4gICAgZGJPdXRwdXQuZ2Fpbkxvc3MgPSBcIkdBSU5cIjtcbiAgICBkYk91dHB1dC50cmFkZUluc3RydWN0aW9ucyA9IGAke3BvbG9QYWlyfSBCVVkgYXQgJHtleGNoYW5nZTJOYW1lfSBmb3IgJHtleGNoYW5nZTJCdXlBdC50b0ZpeGVkKDkpfS4gU0VMTCBhdCBQb2xvIGZvciAke3BvbG9TZWxsQXQudG9GaXhlZCg5KX0gR2FpbiAke2FyYlBlcmNlbnQudG9GaXhlZCg2KX0lYDtcbiAgICBjb25zb2xlLmxvZyhkYk91dHB1dC5nYWluTG9zcywgXCI6IFwiLCBkYk91dHB1dC50cmFkZUluc3RydWN0aW9ucyk7XG4gICAgaWYgKGFyYlBlcmNlbnQgPiBhcmJFbWFpbFRocmVzaG9sZFBlcmNlbnQpIHtcbiAgICAgIGRiT3V0cHV0LnVyZ2VudFRyYWRlID0gdHJ1ZTtcbiAgICAgIFNlbmRNZXNzYWdlKGAke3BvbG9QYWlyfTogQlVZIGF0ICR7ZXhjaGFuZ2UyTmFtZX0gYW5kIFNFTEwgYXQgUG9sb25pZXhgLCBkYk91dHB1dC50cmFkZUluc3RydWN0aW9ucyk7XG4gICAgfVxuICB9XG4gIGVsc2UgeyBcbiAgICBkYk91dHB1dC5nYWluTG9zcyA9IFwiTE9TU1wiO1xuICAgIGRiT3V0cHV0LnVyZ2VudFRyYWRlID0gZmFsc2U7XG4gICAgZGJPdXRwdXQudHJhZGVJbnN0cnVjdGlvbnMgPSBgJHtwb2xvUGFpcn0gQlVZIGF0ICR7ZXhjaGFuZ2UyTmFtZX0gZm9yICR7ZXhjaGFuZ2UyQnV5QXQudG9GaXhlZCg5KX0uIFNFTEwgYXQgUG9sbyBmb3IgJHtwb2xvU2VsbEF0LnRvRml4ZWQoOSl9IExvc3MgJHthcmJQZXJjZW50LnRvRml4ZWQoNil9JWA7XG4gICAgaWYgKHJlcG9ydExvc2VzKSB7XG4gICAgICBjb25zb2xlLmxvZyhgJHtmb3JtYXRUaW1lc3RhbXAodGltZVN0YW1wKX06IFBhaXI6ICR7cG9sb1BhaXJ9LCBSZXN1bHQ6IExPU1MsIERlc2M6ICR7ZXhjaGFuZ2UyTmFtZX0sICR7ZXhjaGFuZ2UyQnV5QXQudG9GaXhlZCg4KX0gaXMgZ3JlYXRlciB0aGFuIHBvbG9TZWxsQXQsICR7cG9sb1NlbGxBdC50b0ZpeGVkKDgpfSwgRElGRiwgJHthcmJPcHBvcnR1bml0eS50b0ZpeGVkKDYpfWApO1xuICAgIH1cbiAgfVxuICBsZXQga2V5U3RyID0gXCJCdXlcIitleGNoYW5nZTJOYW1lK1wiU2VsbFBvbG9uaWV4XCIrcG9sb1BhaXI7XG4gIGxldCBrZXkgPSB7XG4gICAgXCJrZXlcIjoga2V5U3RyXG4gIH07XG4gIGRiT3V0cHV0LmtleSA9IGtleVN0cjtcbiAgaWYgKGRiV3JpdGVFbmFibGVkKSB7XG4gICAgYXdhaXQgdXBkYXRlUmVzdWx0c0luTW9uZ28oa2V5LCBkYk91dHB1dCwgXCJjcnlwdG9cIiwgXCJtYXJrZXRkYXRhLmFyYm1vblwiKTtcbiAgICBpZiAoZGJPdXRwdXQudXJnZW50VHJhZGUpIHtcbiAgICAgIGRiT3V0cHV0LmtleSArPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgYXdhaXQgd3JpdGVSZXN1bHRzVG9Nb25nb1N5bmMoZGJPdXRwdXQsIFwiY3J5cHRvXCIsIFwibWFya2V0ZGF0YS5hcmJtb25oaXN0XCIpO1xuICAgIH1cbiAgfVxuICAvLyBDaGVjayBmb3IgY2FzZSBvZiBCdXkgYXQgRXhjaGFuZ2UxKFBvbG8pIGFuZCBTZWxsIGF0IEV4Y2hhbmdlMlxuICBhcmJPcHBvcnR1bml0eSA9IGV4Y2hhbmdlMlNlbGxBdC1wb2xvQnV5QXQ7XG4gIGFyYlBlcmNlbnQgPSAxMDAqKGV4Y2hhbmdlMlNlbGxBdC1wb2xvQnV5QXQpLyggKGV4Y2hhbmdlMlNlbGxBdCtwb2xvQnV5QXQpIC8gMik7XG4gIGRiT3V0cHV0LmFyYlBlcmNlbnQgPSBhcmJQZXJjZW50O1xuICBkYk91dHB1dC5leGNoMUJ1eU9yU2VsbCA9IFwiQnV5XCI7XG4gIGlmKGFyYlBlcmNlbnQgPiBhcmJSZXBvcnRpbmdUaHJlc2hvbGRQZXJjZW50KSB7ICAgIFxuICAgIGRiT3V0cHV0LmdhaW5Mb3NzID0gXCJHQUlOXCI7XG4gICAgZGJPdXRwdXQudHJhZGVJbnN0cnVjdGlvbnMgPSBgJHtwb2xvUGFpcn0gQlVZIGF0IFBvbG8gZm9yICR7cG9sb0J1eUF0LnRvRml4ZWQoOSl9LiBTRUxMICR7ZXhjaGFuZ2UyTmFtZX0gZm9yICR7ZXhjaGFuZ2UyU2VsbEF0LnRvRml4ZWQoOSl9IEdhaW4gJHthcmJQZXJjZW50LnRvRml4ZWQoNil9JWA7XG4gICAgY29uc29sZS5sb2coZGJPdXRwdXQuZ2Fpbkxvc3MsIFwiOiBcIiwgZGJPdXRwdXQudHJhZGVJbnN0cnVjdGlvbnMpO1xuICAgIGlmIChhcmJQZXJjZW50ID4gYXJiRW1haWxUaHJlc2hvbGRQZXJjZW50KSB7XG4gICAgICBkYk91dHB1dC51cmdlbnRUcmFkZSA9IHRydWU7XG4gICAgICBTZW5kTWVzc2FnZShgJHtwb2xvUGFpcn06IEJVWSBhdCBQb2xvbmlleCBhbmQgU0VMTCBhdCAke2V4Y2hhbmdlMk5hbWV9YCwgZGJPdXRwdXQudHJhZGVJbnN0cnVjdGlvbnMpO1xuICAgIH1cbiAgfVxuICBlbHNlIHtcbiAgICBkYk91dHB1dC5nYWluTG9zcyA9IFwiTE9TU1wiO1xuICAgIGRiT3V0cHV0LnVyZ2VudFRyYWRlID0gZmFsc2U7XG4gICAgZGJPdXRwdXQudHJhZGVJbnN0cnVjdGlvbnMgPSBgJHtwb2xvUGFpcn0gQlVZIGF0IFBvbG8gZm9yICR7cG9sb0J1eUF0LnRvRml4ZWQoOSl9IFNFTEwgJHtleGNoYW5nZTJOYW1lfSBmb3IgJHtleGNoYW5nZTJTZWxsQXQudG9GaXhlZCg5KX0gTG9zcyAke2FyYlBlcmNlbnQudG9GaXhlZCg2KX0lYDtcbiAgICBpZiAocmVwb3J0TG9zZXMpIHtcbiAgICAgIGNvbnNvbGUubG9nKGAke2Zvcm1hdFRpbWVzdGFtcCh0aW1lU3RhbXApfTogUGFpcjogJHtwb2xvUGFpcn0sIFJlc3VsdDogTE9TUywgRGVzYzogcG9sb0J1eUF0LCAke3BvbG9CdXlBdC50b0ZpeGVkKDkpfSBpcyBncmVhdGVyIHRoYW4gJHtleGNoYW5nZTJOYW1lfVNlbGxBdCwgJHtleGNoYW5nZTJTZWxsQXQudG9GaXhlZCg4KX0uIERJRkYsICR7YXJiT3Bwb3J0dW5pdHkudG9GaXhlZCg3KX1gKTtcbiAgICB9XG4gIH1cbiAga2V5U3RyID0gXCJCdXlQb2xvbmlleFNlbGxcIitleGNoYW5nZTJOYW1lK3BvbG9QYWlyO1xuICBrZXkgPSB7XG4gICAgXCJrZXlcIjoga2V5U3RyXG4gIH07XG4gIGRiT3V0cHV0LmtleSA9IGtleVN0cjtcbiAgaWYgKGRiV3JpdGVFbmFibGVkKSB7XG4gICAgYXdhaXQgdXBkYXRlUmVzdWx0c0luTW9uZ28oa2V5LCBkYk91dHB1dCwgXCJjcnlwdG9cIiwgXCJtYXJrZXRkYXRhLmFyYm1vblwiKTtcbiAgICBpZiAoZGJPdXRwdXQudXJnZW50VHJhZGUpIHtcbiAgICAgIGRiT3V0cHV0LmtleSArPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgIGF3YWl0IHdyaXRlUmVzdWx0c1RvTW9uZ29TeW5jKGRiT3V0cHV0LCBcImNyeXB0b1wiLCBcIm1hcmtldGRhdGEuYXJibW9uaGlzdFwiKTtcbiAgICB9XG4gIH1cbn1cblxuLyogcG9sb01rdEZyb21CaXR0cmV4TmFtZVxuICogZGVzYzogQ29udmVydHMgYSBCaXR0cmV4IGNyeXB0byBjdXJyZW5jeSBwYWlyIGludG8gdGhlIFBvbG9uaWV4IHBhaXIuXG4gKi9cbmZ1bmN0aW9uIHBvbG9Na3RGcm9tQml0dHJleE5hbWUoYml0dHJleE1rdE5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmKGJpdHRyZXhNa3ROYW1lPT09XCJCVEMtWExNXCIpXG4gICAgcmV0dXJuKFwiQlRDX1NUUlwiKTtcbiAgaWYoYml0dHJleE1rdE5hbWU9PT1cIlVTRFQtWExNXCIpXG4gICAgcmV0dXJuKFwiVVNEVF9TVFJcIik7ICAgIFxuICByZXR1cm4oYml0dHJleE1rdE5hbWUucmVwbGFjZShcIi1cIiwgXCJfXCIpKTtcbn1cblxuLyogY29tcGFyZUFsbFBvbG9uaWV4SGl0YnRjXG4qICBkZXNjOiBUYWtlcyB0aGUgcG9sb25pZXggYW5kIGhpdGJ0YyBkYXRhIGluIEpTT04gZm9ybWF0IGFuZCBjb21wYXJlcyBhbGwgb3ZlcmxhcGluZyBtYXJrZXRzIGZvciBhcmJpdHJhZ2UuXG4qICAgICAgIEV4cG9ydGVkIGZ1bmN0aW9uIGNhbGxlZCBieSB0aGUgbWFpbiBhcHAuanNcbiovXG5mdW5jdGlvbiBjb21wYXJlQWxsUG9sb25pZXhIaXRidGMocG9sb0pTT046IGFueSwgaGl0YnRjSlNPTjogYW55KSB7XG4gIFxuICBsZXQgcmVwb3J0aW5nVGltZXN0YW1wID0gbmV3IERhdGUoKTtcbiAgbGV0IHBvbG9UaW1lc3RhbXAgPSBwb2xvSlNPTi50aW1lU3RhbXA7XG4gIGxldCBwb2xvQWxsTWFya2V0cyA9IEpTT04ucGFyc2UocG9sb0pTT04uZXhjaGFuZ2VEYXRhKTtcbiAgbGV0IGhpdGJ0Y1RpbWVzdGFtcCA9IGhpdGJ0Y0pTT04udGltZVN0YW1wO1xuICBjb25zb2xlLmxvZyhwb2xvVGltZXN0YW1wKTtcbiAgY29uc29sZS5sb2coaGl0YnRjVGltZXN0YW1wKTtcbiAgZm9yKGxldCBoaXRidGNNa3QgaW4gaGl0YnRjSlNPTi5leGNoYW5nZURhdGEpe1xuICAgIGxldCBwb2xvTWt0TmFtZSA9IHBvbG9Na3RGcm9tSGl0YnRjTmFtZShoaXRidGNNa3QpO1xuICAgIGxldCBwb2xvTWt0RWxlbWVudCA9IHBvbG9BbGxNYXJrZXRzW3BvbG9Na3ROYW1lXTtcbiAgICBjb21wYXJlUG9sb25pZXhIaXRidGNNa3RFbGVtZW50KHBvbG9Na3RFbGVtZW50LCBoaXRidGNKU09OLmV4Y2hhbmdlRGF0YVtoaXRidGNNa3RdLCBwb2xvTWt0TmFtZSwgcmVwb3J0aW5nVGltZXN0YW1wKTtcbiAgfVxufVxuXG4vKiBjb21wYXJlUG9sb25pZXhIaXRidGNNa3RFbGVtZW50XG4gKiBkZXNjOiBQdWxscyBvdXQgdGhlIGJ1eSBhbmQgc2VsbCBwcmljZXMgZm9yIGEgc2luZ2xlIGN1cnJlbmN5IHBhaXIgZm9yIFBvbG9uaWV4IGFuZCBIaXRidGMuXG4gKiAgICAgICBGb3J3YXJkcyB0aGlzIHRvIHRoZSBvdXRwdXQgbWV0aG9kIHRvIHJlY29yZCB0aGUgYXJiaXRyYWdlIHJlc3VsdHMuXG4gKi9cbmZ1bmN0aW9uIGNvbXBhcmVQb2xvbmlleEhpdGJ0Y01rdEVsZW1lbnQocG9sb01rdEVsZW1lbnQ6IGFueSwgaGl0YnRjTWt0RWxlbWVudDogYW55LCBwb2xvTWt0TmFtZTogc3RyaW5nLCByZXBvcnRpbmdUaW1lc3RhbXA6IERhdGUpIHtcblxuICBsZXQgcG9sb0J1eUF0ID0gK3BvbG9Na3RFbGVtZW50Lmxvd2VzdEFzaztcbiAgbGV0IHBvbG9TZWxsQXQgPSArcG9sb01rdEVsZW1lbnQuaGlnaGVzdEJpZDtcbiAgbGV0IGhpdGJ0Y1NlbGxBdCA9ICtoaXRidGNNa3RFbGVtZW50LmJpZDtcbiAgbGV0IGhpdGJ0Y0J1eUF0ID0gK2hpdGJ0Y01rdEVsZW1lbnQuYXNrO1xuICBpZiAoIWhpdGJ0Y1NlbGxBdCB8fCAhaGl0YnRjQnV5QXQpIHtcbiAgICBjb25zb2xlLmxvZyhcIkdvdCBiYWQgcmF0ZXMgZnJvbSB0aGUgaGl0YnRjIGZvcjpcIiwgcG9sb01rdE5hbWUpO1xuICAgIHJldHVybjtcbiAgfVxuICBvdXRwdXRBcmJSZXN1bHRzKHBvbG9CdXlBdCwgcG9sb1NlbGxBdCwgaGl0YnRjU2VsbEF0LCBoaXRidGNCdXlBdCwgXCJIaXRidGNcIiwgcG9sb01rdE5hbWUsIHJlcG9ydGluZ1RpbWVzdGFtcCk7XG59XG5cbi8qIHBvbG9Na3RGcm9tSGl0YnRjTmFtZVxuICogZGVzYzogTWFwcyBmcm9tIEhpdGJ0YyB0aWNrZXJzIHRvIFBvbG9uaWV4IHRpY2tlcnMuXG4gKi9cbmZ1bmN0aW9uIHBvbG9Na3RGcm9tSGl0YnRjTmFtZShoaXRidGNNa3ROYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuXG4gIGNvbnN0IHBvbG9Na3ROYW1lczogYW55ID0ge1xuICAgIEJDTkJUQzogICBcIkJUQ19CQ05cIixcbiAgICBCTlRVU0RUOiAgXCJVU0RUX0JOVFwiLFxuICAgIERBU0hCVEM6ICBcIkJUQ19EQVNIXCIsXG4gICAgREFTSFVTRFQ6IFwiVVNEVF9EQVNIXCIsXG4gICAgRE9HRUJUQzogIFwiQlRDX0RPR0VcIixcbiAgICBET0dFVVNEVDogXCJVU0RUX0RPR0VcIixcbiAgICBER0JCVEM6ICAgXCJCVENfREdCXCIsXG4gICAgRU9TQlRDOiAgIFwiQlRDX0VPU1wiLFxuICAgIEVPU1VTRFQ6ICBcIlVTRFRfRU9TXCIsXG4gICAgRVRDVVNEVDogIFwiVVNEVF9FVENcIixcbiAgICBFVEhVU0RUOiAgXCJVU0RUX0VUSFwiLFxuICAgIExTS0JUQzogICBcIkJUQ19MU0tcIixcbiAgICBNQUlEQlRDOiAgXCJCVENfTUFJRFwiLFxuICAgIE1BTkFCVEM6ICBcIkJUQ19NQU5BXCIsXG4gICAgT01HQlRDOiAgIFwiQlRDX09NR1wiLFxuICAgIFBQQ0JUQzogICBcIkJUQ19QUENcIixcbiAgICBRVFVNQlRDOiAgXCJCVENfUVRVTVwiLFxuICAgIFJFUEJUQzogICBcIkJUQ19SRVBcIixcbiAgICBSRVBVU0RUOiAgXCJVU0RUX1JFUFwiLFxuICAgIFhFTUJUQzogICBcIkJUQ19YRU1cIixcbiAgICBFVEhCVEM6ICAgXCJCVENfRVRIXCIsXG4gICAgWkVDRVRIOiAgIFwiRVRIX1pFQ1wiXG4gIH07XG4gIHJldHVybihwb2xvTWt0TmFtZXNbaGl0YnRjTWt0TmFtZV0pO1xufVxuXG4vKiBjb21wYXJlQWxsUG9sb25pZXhZb2JpdFxuICogZGVzYzogQ29tcGFyZXMgbWFya2V0IGRhdGEgYWNyb3NzIG1hbnkgY3VycmVuY3kgcGFpcnMgYmV0d2VlbiBQb2xvbmlleCBhbmQgWW9iaXQuXG4gKiAgICAgICBOb3RlIHRoYXQgWW9iaXQgb2Z0ZW5zIGhhcyBsYXJnZSBwcmNpZSBkaXNjcmVwZW5jaWVzIGJ1dCB0aGUgd2FsbGV0cyBmb3IgdGhvcyBjb2luc1xuICogICAgICAgYXJlIGRlYWN0aXZhdGVkLiAgU28geW91IGNhbid0IGdlbmVyYXRlIGEgcHJvZml0LlxuICovXG5mdW5jdGlvbiBjb21wYXJlQWxsUG9sb25pZXhZb2JpdChwb2xvRGF0YTogYW55LCB5b2JpdERhdGE6IGFueSkge1xuXG4gIGxldCByZXBvcnRpbmdUaW1lc3RhbXA6IERhdGUgPSBuZXcgRGF0ZSgpO1xuICBsZXQgcG9sb1RpbWVzdGFtcDogRGF0ZSA9IHBvbG9EYXRhLnRpbWVTdGFtcDtcbiAgbGV0IHBvbG9BbGxNYXJrZXRzID0gSlNPTi5wYXJzZShwb2xvRGF0YS5leGNoYW5nZURhdGEpO1xuICBsZXQgeW9iaXRUaW1lc3RhbXAgPSB5b2JpdERhdGEudGltZVN0YW1wO1xuICBsZXQgeW9iaXRBbGxNYXJrZXRzID0gSlNPTi5wYXJzZSh5b2JpdERhdGEuZXhjaGFuZ2VEYXRhKTtcbiAgY29uc29sZS5sb2cocG9sb1RpbWVzdGFtcCk7XG4gIGNvbnNvbGUubG9nKHlvYml0VGltZXN0YW1wKTtcbiAgZm9yKGxldCB5b2JpdE1rdCBpbiB5b2JpdEFsbE1hcmtldHMpe1xuICAgIGNvbnNvbGUubG9nKFwieW9iaXRNa3Q6XCIsIHlvYml0TWt0LCBcIiBkYXRhOlwiLCB5b2JpdEFsbE1hcmtldHNbeW9iaXRNa3RdKTtcbiAgICBsZXQgcG9sb01rdE5hbWUgPSBwb2xvTWt0RnJvbVlvYml0TmFtZSh5b2JpdE1rdCk7XG4gICAgY29uc29sZS5sb2coXCJQb2xvTWFya2V0OlwiLCBwb2xvTWt0TmFtZSwgXCIgZGF0YTpcIiwgcG9sb0FsbE1hcmtldHNbcG9sb01rdE5hbWVdKTtcbiAgICBjb21wYXJlUG9sb25pZXhZb2JpdE1rdEVsZW1lbnQocG9sb0FsbE1hcmtldHNbcG9sb01rdE5hbWVdLCB5b2JpdEFsbE1hcmtldHNbeW9iaXRNa3RdLCBwb2xvTWt0TmFtZSwgcmVwb3J0aW5nVGltZXN0YW1wKTtcbiAgfVxufVxuXG4vKiBjb21wYXJlUG9sb25pZXhZb2JpdE1rdEVsZW1lbnRcbiAqIGRlc2M6IFB1bGxzIG91dCB0aGUgYnV5IGFuZCBzZWxsIHByaWNlcyBmb3IgYSBzaW5nbGUgY3VycmVuY3kgcGFpciBmb3IgUG9sb25pZXggYW5kIFlvYml0LlxuICogICAgICAgRm9yd2FyZHMgdGhpcyB0byB0aGUgb3V0cHV0IG1ldGhvZCB0byByZWNvcmQgdGhlIGFyYml0cmFnZSByZXN1bHRzLlxuICovXG5mdW5jdGlvbiBjb21wYXJlUG9sb25pZXhZb2JpdE1rdEVsZW1lbnQocG9sb01rdEVsZW1lbnQ6IGFueSwgeW9iaXRNa3RFbGVtZW50OiBhbnksIHBvbG9Na3ROYW1lOiBhbnksIHJlcG9ydGluZ1RpbWVzdGFtcDogRGF0ZSkge1xuXG4gIGxldCBwb2xvQnV5QXQgPSArcG9sb01rdEVsZW1lbnQubG93ZXN0QXNrO1xuICBsZXQgcG9sb1NlbGxBdCA9ICtwb2xvTWt0RWxlbWVudC5oaWdoZXN0QmlkO1xuICBsZXQgeW9iaXRTZWxsQXQgPSAreW9iaXRNa3RFbGVtZW50LnNlbGw7XG4gIGxldCB5b2JpdEJ1eUF0ID0gK3lvYml0TWt0RWxlbWVudC5idXk7XG4gIG91dHB1dEFyYlJlc3VsdHMocG9sb0J1eUF0LCBwb2xvU2VsbEF0LCB5b2JpdFNlbGxBdCwgeW9iaXRCdXlBdCwgXCJZb2JpdFwiLCBwb2xvTWt0TmFtZSwgcmVwb3J0aW5nVGltZXN0YW1wKTtcbn1cblxuLyogcG9sb01rdEZyb21Zb2JpdE5hbWVcbiAqIGRlc2M6IE1hcHMgZnJvbSBZb2JpdCB0aWNrZXJzIHRvIFBvbG9uaWV4IHRpY2tlcnMuXG4gKi9cbmZ1bmN0aW9uIHBvbG9Na3RGcm9tWW9iaXROYW1lKHlvYml0TWt0TmFtZTogc3RyaW5nKTogc3RyaW5nIHtcblxuICBjb25zdCBwb2xvTWt0TmFtZXM6IGFueSA9IHtcbiAgICBsdGNfYnRjOiAgXCJCVENfTFRDXCIsXG4gICAgbm1jX2J0YzogIFwiQlRDX05NQ1wiLFxuICAgIG5tcl9idGM6ICBcIkJUQ19OTVJcIixcbiAgICBldGhfYnRjOiAgXCJCVENfRVRIXCJcbiAgfTtcbiAgcmV0dXJuKHBvbG9Na3ROYW1lc1t5b2JpdE1rdE5hbWVdKTtcbn1cblxuXG5hc3luYyBmdW5jdGlvbiBpbnRlcm5hbENvbXBhcmVGb3JZb2JpdChta3REYXRhIDogYW55LCB5b2JpdE1hcmtldHMgOiBBcnJheTxzdHJpbmc+LCBiYXNlTWFya2V0cyA6IEFycmF5PHN0cmluZz4pIHtcblxuICBsZXQgdGltZVN0YW1wID0gbmV3IERhdGUoKTtcbiAgZm9yKGxldCBpPTA7IGk8eW9iaXRNYXJrZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IGN1ck1rdDE6IHN0cmluZyA9IHlvYml0TWFya2V0c1tpXSArIFwiX1wiICsgYmFzZU1hcmtldHNbMF07XG4gICAgbGV0IGN1ck1rdDI6IHN0cmluZyA9IHlvYml0TWFya2V0c1tpXSArIFwiX1wiICsgYmFzZU1hcmtldHNbMV07XG4gICAgbGV0IGJhc2VQYWlyOiBzdHJpbmcgPSBiYXNlTWFya2V0c1sxXSArIFwiX1wiICsgYmFzZU1hcmtldHNbMF07XG4gICAgbGV0IGFyYkZyYWN0aW9uOiBudW1iZXIgPSBta3REYXRhW2Jhc2VQYWlyXS5idXkgKiBta3REYXRhW2N1ck1rdDJdLmJ1eSAvIG1rdERhdGFbY3VyTWt0MV0uc2VsbDtcbiAgICBjb25zb2xlLmxvZyhcIkFyYiBGcmFjdGlvbiBmb3IgXCIsIHlvYml0TWFya2V0c1tpXSwgXCI6IFwiLCBhcmJGcmFjdGlvbi50b0ZpeGVkKDYpKTtcbiAgICBsZXQga2V5U3RyID0gXCJZb2JpdEludGVybmFsX1wiICsgY3VyTWt0MSArIFwiX1wiICsgYmFzZU1hcmtldHNbMV07XG4gICAgbGV0IGRiT3V0cHV0ID0ge1xuICAgICAga2V5OiBrZXlTdHIsXG4gICAgICBleGNoMU5hbWU6IFwiWW9iaXRcIixcbiAgICAgIGV4Y2gyTmFtZTogXCJZb2JpdFwiLFxuICAgICAgdGltZVN0YW1wOiB0aW1lU3RhbXAudG9TdHJpbmcoKS5zbGljZSgwLDI1KSxcbiAgICAgIGNjeVBhaXI6IGN1ck1rdDEsXG4gICAgICBleGNoMUJ1eUF0OiBta3REYXRhW2N1ck1rdDFdLnNlbGwsXG4gICAgICBleGNoMVNlbGxBdDogMCxcbiAgICAgIGV4Y2gyQnV5QXQ6IDAsXG4gICAgICBleGNoMlNlbGxBdDogbWt0RGF0YVtjdXJNa3QyXS5idXksXG4gICAgICBnYWluTG9zczogXCJMb3NzXCIsXG4gICAgICB1cmdlbnRUcmFkZTogZmFsc2UsXG4gICAgICBhcmJQZXJjZW50OiBhcmJGcmFjdGlvbixcbiAgICAgIGV4Y2gxQnV5T3JTZWxsOiBcIkJ1eVwiLFxuICAgICAgdHJhZGVJbnN0cnVjdGlvbnM6IFwiXCIsXG4gICAgfTtcbiAgICBpZiAoYXJiRnJhY3Rpb24gPiAxKSB7XG4gICAgICBkYk91dHB1dC5nYWluTG9zcyA9IFwiR2FpblwiO1xuICAgICAgY29uc29sZS5sb2coXCIgIC0tLT4gR2FpblwiLCB0aW1lU3RhbXAudG9TdHJpbmcoKS5zbGljZSgwLDI1KSwgXCIgXCIsIGFyYkZyYWN0aW9uLnRvRml4ZWQoOCksIFxuICAgICAgICBcIkJ1eSBcIiwgeW9iaXRNYXJrZXRzW2ldLCBcIiB3aXRoIEJUQyBhdFwiLCBta3REYXRhW2N1ck1rdDFdLnNlbGwsXG4gICAgICAgIFwic2VsbCB0aGVcIiwgeW9iaXRNYXJrZXRzW2ldLCBcImZvclwiLCBta3REYXRhW2N1ck1rdDJdLmJ1eSwgXG4gICAgICAgIFwidG8gZ2V0IEVUSC4gQ29udmVydCBFVEggYmFjayB0byBCVEMgYXRcIiwgbWt0RGF0YVtiYXNlUGFpcl0uYnV5KTtcbiAgICAgIGlmIChhcmJGcmFjdGlvbiA+IDEuMDA1KSB7XG4gICAgICAgIGRiT3V0cHV0LnVyZ2VudFRyYWRlID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgZGJPdXRwdXQua2V5ID0ga2V5U3RyO1xuICAgIGxldCBrZXk6IGFueSA9IHtcbiAgICAgIFwia2V5XCI6IGtleVN0clxuICAgIH07XG4gICAgaWYgKGRiV3JpdGVFbmFibGVkKSB7XG4gICAgICBhd2FpdCB1cGRhdGVSZXN1bHRzSW5Nb25nbyhrZXksIGRiT3V0cHV0LCBcImNyeXB0b1wiLCBcIm1hcmtldGRhdGEuYXJibW9uXCIpO1xuICAgIH0gICAgXG4gIH1cbn1cblxuZXhwb3J0IHtjb21wYXJlUG9sb25pZXhDb2luYmFzZSwgY29tcGFyZUFsbFBvbG9uaWV4Qml0dHJleCwgY29tcGFyZUFsbFBvbG9uaWV4SGl0YnRjLCBcbiAgY29tcGFyZUFsbFBvbG9uaWV4WW9iaXQsIGludGVybmFsQ29tcGFyZUZvcllvYml0fTtcbiJdfQ==