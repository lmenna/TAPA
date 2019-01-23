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
              tradeInstructions: ""
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
              _context.next = 12;
              break;
            }

            _context.next = 12;
            return (0, _dbUtils.updateResultsInMongo)(key, dbOutput, "crypto", "marketdata.arbmon");

          case 12:
            // Check for case of Buy at Exchange1(Polo) and Sell at Exchange2
            arbOpportunity = exchange2SellAt - poloBuyAt;
            arbPercent = 100 * (exchange2SellAt - poloBuyAt) / ((exchange2SellAt + poloBuyAt) / 2);
            dbOutput.arbPercent = arbPercent;
            dbOutput.exch1BuyOrSell = "Buy";
            if (dbOutput.maxProfit < arbPercent) dbOutput.maxProfit = arbPercent;

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
              _context.next = 24;
              break;
            }

            _context.next = 24;
            return (0, _dbUtils.updateResultsInMongo)(key, dbOutput, "crypto", "marketdata.arbmon");

          case 24:
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
              exch1BuyAt: mktData[basePair].buy,
              exch1SellAt: 0,
              exch2BuyAt: 0,
              exch2SellAt: mktData[curMkt1].sell,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9jb21wYXJlUHJpY2luZ0RhdGEudHMiXSwibmFtZXMiOlsiYXJiRW1haWxUaHJlc2hvbGRQZXJjZW50IiwiYXJiUmVwb3J0aW5nVGhyZXNob2xkUGVyY2VudCIsImRiV3JpdGVFbmFibGVkIiwicmVwb3J0TG9zZXMiLCJmb3JtYXRUaW1lc3RhbXAiLCJ0aW1lU3RhbXAiLCJ0b1N0cmluZyIsInNsaWNlIiwiY29tcGFyZVBvbG9uaWV4Q29pbmJhc2UiLCJwb2xvRGF0YSIsImNiRGF0YSIsImNvaW4iLCJwb2xvSlNPTiIsIkpTT04iLCJwYXJzZSIsImV4Y2hhbmdlRGF0YSIsImNiSlNPTiIsIkRhdGUiLCJjb25zb2xlIiwibG9nIiwiZ2V0VGltZSIsImNvbXBhcmVDdXJyZW5jeVBhaXIiLCJjY3kxIiwiY2N5MiIsInBvbG9QYWlyIiwicG9sb0J1eUF0IiwibG93ZXN0QXNrIiwicG9sb1NlbGxBdCIsImhpZ2hlc3RCaWQiLCJjb2luYmFzZVNlbGxBdCIsImJpZHMiLCJjb2luYmFzZUJ1eUF0IiwiYXNrcyIsIm91dHB1dEFyYlJlc3VsdHMiLCJjb21wYXJlQWxsUG9sb25pZXhCaXR0cmV4IiwiYml0dHJleEpTT04iLCJyZXBvcnRpbmdUaW1lc3RhbXAiLCJwb2xvVGltZXN0YW1wIiwicG9sb0FsbE1hcmtldHMiLCJiaXR0cmV4VGltZXN0YW1wIiwiYml0dHJleE1rdCIsInBvbG9Na3ROYW1lIiwicG9sb01rdEZyb21CaXR0cmV4TmFtZSIsInBvbG9Na3RFbGVtZW50IiwiY29tcGFyZVBvbG9uaWV4Qml0dHJleE1rdEVsZW1lbnQiLCJiaXR0cmV4U2VsbEF0IiwiQmlkIiwiYml0dHJleEJ1eUF0IiwiQXNrIiwiZXhjaGFuZ2UyU2VsbEF0IiwiZXhjaGFuZ2UyQnV5QXQiLCJleGNoYW5nZTJOYW1lIiwiZGJPdXRwdXQiLCJrZXkiLCJleGNoMU5hbWUiLCJleGNoMk5hbWUiLCJjY3lQYWlyIiwiZXhjaDFCdXlBdCIsImV4Y2gxU2VsbEF0IiwiZXhjaDJCdXlBdCIsImV4Y2gyU2VsbEF0IiwiZ2Fpbkxvc3MiLCJ1cmdlbnRUcmFkZSIsImFyYlBlcmNlbnQiLCJleGNoMUJ1eU9yU2VsbCIsInRyYWRlSW5zdHJ1Y3Rpb25zIiwiYXJiT3Bwb3J0dW5pdHkiLCJ0b0ZpeGVkIiwia2V5U3RyIiwibWF4UHJvZml0IiwiYml0dHJleE1rdE5hbWUiLCJyZXBsYWNlIiwiY29tcGFyZUFsbFBvbG9uaWV4SGl0YnRjIiwiaGl0YnRjSlNPTiIsImhpdGJ0Y1RpbWVzdGFtcCIsImhpdGJ0Y01rdCIsInBvbG9Na3RGcm9tSGl0YnRjTmFtZSIsImNvbXBhcmVQb2xvbmlleEhpdGJ0Y01rdEVsZW1lbnQiLCJoaXRidGNNa3RFbGVtZW50IiwiaGl0YnRjU2VsbEF0IiwiYmlkIiwiaGl0YnRjQnV5QXQiLCJhc2siLCJoaXRidGNNa3ROYW1lIiwicG9sb01rdE5hbWVzIiwiQkNOQlRDIiwiQk5UVVNEVCIsIkRBU0hCVEMiLCJEQVNIVVNEVCIsIkRPR0VCVEMiLCJET0dFVVNEVCIsIkRHQkJUQyIsIkVPU0JUQyIsIkVPU1VTRFQiLCJFVENVU0RUIiwiRVRIVVNEVCIsIkxTS0JUQyIsIk1BSURCVEMiLCJNQU5BQlRDIiwiT01HQlRDIiwiUFBDQlRDIiwiUVRVTUJUQyIsIlJFUEJUQyIsIlJFUFVTRFQiLCJYRU1CVEMiLCJFVEhCVEMiLCJaRUNFVEgiLCJjb21wYXJlQWxsUG9sb25pZXhZb2JpdCIsInlvYml0RGF0YSIsInlvYml0VGltZXN0YW1wIiwieW9iaXRBbGxNYXJrZXRzIiwieW9iaXRNa3QiLCJwb2xvTWt0RnJvbVlvYml0TmFtZSIsImNvbXBhcmVQb2xvbmlleFlvYml0TWt0RWxlbWVudCIsInlvYml0TWt0RWxlbWVudCIsInlvYml0U2VsbEF0Iiwic2VsbCIsInlvYml0QnV5QXQiLCJidXkiLCJ5b2JpdE1rdE5hbWUiLCJsdGNfYnRjIiwibm1jX2J0YyIsIm5tcl9idGMiLCJldGhfYnRjIiwiaW50ZXJuYWxDb21wYXJlRm9yWW9iaXQiLCJta3REYXRhIiwieW9iaXRNYXJrZXRzIiwiYmFzZU1hcmtldHMiLCJpIiwibGVuZ3RoIiwiY3VyTWt0MSIsImN1ck1rdDIiLCJiYXNlUGFpciIsImFyYkZyYWN0aW9uIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUtBOztBQUNBOzs7Ozs7QUFFQTtBQUNBLElBQU1BLHdCQUF3QixHQUFHLElBQWpDLEMsQ0FDQTs7QUFDQSxJQUFNQyw0QkFBNEIsR0FBRyxHQUFyQyxDLENBQ0E7O0FBQ0EsSUFBSUMsY0FBYyxHQUFHLElBQXJCLEMsQ0FDQTs7QUFDQSxJQUFJQyxXQUFXLEdBQUcsS0FBbEI7QUFFQTs7OztBQUdBLFNBQVNDLGVBQVQsQ0FBeUJDLFNBQXpCLEVBQW9DO0FBQ2xDLFNBQU9BLFNBQVMsQ0FBQ0MsUUFBVixHQUFxQkMsS0FBckIsQ0FBMkIsQ0FBM0IsRUFBNkIsRUFBN0IsQ0FBUDtBQUNEO0FBRUQ7Ozs7OztBQUlBLFNBQVNDLHVCQUFULENBQWlDQyxRQUFqQyxFQUEyQ0MsTUFBM0MsRUFBbURDLElBQW5ELEVBQXlEO0FBRXZELE1BQUlDLFFBQVEsR0FBR0MsSUFBSSxDQUFDQyxLQUFMLENBQVdMLFFBQVEsQ0FBQ00sWUFBcEIsQ0FBZjtBQUNBLE1BQUlDLE1BQU0sR0FBR0gsSUFBSSxDQUFDQyxLQUFMLENBQVdKLE1BQU0sQ0FBQ0ssWUFBbEIsQ0FBYjtBQUNBLE1BQUlWLFNBQVMsR0FBRyxJQUFJWSxJQUFKLEVBQWhCO0FBQ0FDLEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixXQUFlZixlQUFlLENBQUNDLFNBQUQsQ0FBOUIsZ0NBQStESSxRQUFRLENBQUNKLFNBQVQsQ0FBbUJlLE9BQW5CLEtBQTZCVixNQUFNLENBQUNMLFNBQVAsQ0FBaUJlLE9BQWpCLEVBQTVGO0FBQ0FDLEVBQUFBLG1CQUFtQixDQUFDaEIsU0FBRCxFQUFZTyxRQUFaLEVBQXNCSSxNQUF0QixFQUE4QixNQUE5QixFQUFzQ0wsSUFBdEMsQ0FBbkI7QUFDRDtBQUVEOzs7Ozs7QUFJQSxTQUFTVSxtQkFBVCxDQUE2QmhCLFNBQTdCLEVBQXdD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bUNBQXFCbUQsR0FBckIsRUFBMEJELFFBQTFCLEVBQW9DLFFBQXBDLEVBQThDLG1CQUE5QyxDQXpDWjs7QUFBQTtBQUdzQzRFLFlBQUFBLENBQUMsRUFIdkM7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEciLCJzb3VyY2VzQ29udGVudCI6WyIvKiBjb21wYXJlUHJpY2luZ0RhdGEuanNcbiAqIENvbnNvbGlkYXRlcyBmdW5jdGlvbiB0byBjb21wYXJlIGNyeXB0byBtYXJrZXRzIGxvb2tpbmcgZm9yIHNpZ25pZmljYW50IGFyYml0cmFnZSBvcHBvcnR1bml0aWVzLlxuICogU2VuZHMgbm90aWZpY2F0aW9ucyB3aGVuIGxhcmdlIGFyYml0cmFnZSBpcyBkZXRlY3RlZC5cbiAqL1xuXG5pbXBvcnQge1NlbmRNZXNzYWdlfSBmcm9tIFwiLi9zZW5kRU1haWxcIjtcbmltcG9ydCB7d3JpdGVSZXN1bHRzVG9Nb25nbywgdXBkYXRlUmVzdWx0c0luTW9uZ299IGZyb20gXCIuL2RiVXRpbHNcIjtcblxuLy8gU2V0IHRoaXMgdG8gYmUgYSBjbGVhciB0cmFkaW5nIG9wcG9ydHVuaXR5XG5jb25zdCBhcmJFbWFpbFRocmVzaG9sZFBlcmNlbnQgPSAxLjI1O1xuLy8gU2V0IHRoaXMgdG8gYmUgdGhlIGZlZXMgYXNzb2NpYXRlZCB3aXRoIHRyYWRpbmdcbmNvbnN0IGFyYlJlcG9ydGluZ1RocmVzaG9sZFBlcmNlbnQgPSAwLjA7XG4vLyBDb250cm9sIG91dHB1dCB0byBEQlxubGV0IGRiV3JpdGVFbmFibGVkID0gdHJ1ZTtcbi8vIENvbnRyb2wgcmVwb3J0ZWQgb3V0cHV0XG5sZXQgcmVwb3J0TG9zZXMgPSBmYWxzZTtcblxuLyogZm9ybWF0VGltZXN0YW1wXG4gKiBkZXNjOiBTaW1wbGUgdXRpbGl0eSB0byB0cnVuY2F0ZSB0aGUgb3V0cHV0IG9mIGxvbmcgdGltZSBzdGFtcHMgdG8gaW5jbHVkZSBvbmx5IHRoZSBkYXRlIGFuZCB0aW1lIHBhcnRzLlxuICovXG5mdW5jdGlvbiBmb3JtYXRUaW1lc3RhbXAodGltZVN0YW1wKSB7XG4gIHJldHVybih0aW1lU3RhbXAudG9TdHJpbmcoKS5zbGljZSgwLDI1KSk7XG59XG5cbi8qIGNvbXBhcmVQb2xvbmlleENvaW5iYXNlXG4gKiBkZXNjOiBNYWluIGZ1bmN0aW9uIGNhbGxlZCB0byBjb21wYXJlIHRoZSBQb2xvbmlleCBhbmQgQ29pbmJhc2UgY3J5cHRvIG1hcmtldHMuXG4gKiAgICAgICBUaGlzIGZ1bmN0aW9uIGlzIGV4cG9ydGVkIGFuZCBjYWxsZWQgYmUgYXBwLmpzXG4gKi9cbmZ1bmN0aW9uIGNvbXBhcmVQb2xvbmlleENvaW5iYXNlKHBvbG9EYXRhLCBjYkRhdGEsIGNvaW4pIHtcblxuICB2YXIgcG9sb0pTT04gPSBKU09OLnBhcnNlKHBvbG9EYXRhLmV4Y2hhbmdlRGF0YSk7XG4gIHZhciBjYkpTT04gPSBKU09OLnBhcnNlKGNiRGF0YS5leGNoYW5nZURhdGEpO1xuICBsZXQgdGltZVN0YW1wID0gbmV3IERhdGUoKTtcbiAgY29uc29sZS5sb2coYCR7Zm9ybWF0VGltZXN0YW1wKHRpbWVTdGFtcCl9OiBQb2xvVGltZS1DQlRpbWU6ICR7cG9sb0RhdGEudGltZVN0YW1wLmdldFRpbWUoKS1jYkRhdGEudGltZVN0YW1wLmdldFRpbWUoKX0uYCk7XG4gIGNvbXBhcmVDdXJyZW5jeVBhaXIodGltZVN0YW1wLCBwb2xvSlNPTiwgY2JKU09OLCBcIlVTRENcIiwgY29pbilcbn1cblxuLyogY29tcGFyZUN1cnJlbmN5UGFpclxuICogZGVzYzogQ29tcGFyZXMgYSBjdXJyZW5jeSBwYWlyIGJldHdlZW4gUG9sb25pZXggYW5kIENvaW5iYXNlLiAgTm90aWZpZXMgd2hlbiBzaWduaWZpY2FudCBhcmJpdHJhZ2Ugb3Bwb3J0dW5pdGllc1xuICogICAgICAgb2NjdXIuXG4gKi9cbmZ1bmN0aW9uIGNvbXBhcmVDdXJyZW5jeVBhaXIodGltZVN0YW1wLCBwb2xvSlNPTiwgY2JKU09OLCBjY3kxLCBjY3kyKSB7XG4gIGxldCBwb2xvUGFpciA9IGNjeTErXCJfXCIrY2N5MjtcbiAgbGV0IHBvbG9CdXlBdCA9ICtwb2xvSlNPTltwb2xvUGFpcl0ubG93ZXN0QXNrO1xuICBsZXQgcG9sb1NlbGxBdCA9ICtwb2xvSlNPTltwb2xvUGFpcl0uaGlnaGVzdEJpZDtcbiAgbGV0IGNvaW5iYXNlU2VsbEF0ID0gK2NiSlNPTi5iaWRzWzBdWzBdO1xuICBsZXQgY29pbmJhc2VCdXlBdCA9ICtjYkpTT04uYXNrc1swXVswXTtcbiAgb3V0cHV0QXJiUmVzdWx0cyhwb2xvQnV5QXQsIHBvbG9TZWxsQXQsIGNvaW5iYXNlU2VsbEF0LCBjb2luYmFzZUJ1eUF0LCBcIkNvaW5iYXNlXCIsIHBvbG9QYWlyLCB0aW1lU3RhbXApO1xuIH1cblxuIC8qIGNvbXBhcmVBbGxQb2xvbmlleEJpdHRyZXhcbiAgKiBkZXNjOiBUYWtlcyB0aGUgcG9sb25pZXggYW5kIGJpdHRyZXggZGF0YSBpbiBKU09OIGZvcm1hdCBhbmQgY29tcGFyZXMgYWxsIG92ZXJsYXBpbmcgbWFya2V0cyBmb3IgYXJiaXRyYWdlLlxuICAqICAgICAgIEV4cG9ydGVkIGZ1bmN0aW9uIGNhbGxlZCBieSB0aGUgbWFpbiBhcHAuanNcbiAgKi9cbmZ1bmN0aW9uIGNvbXBhcmVBbGxQb2xvbmlleEJpdHRyZXgocG9sb0pTT04sIGJpdHRyZXhKU09OKSB7XG5cbiAgbGV0IHJlcG9ydGluZ1RpbWVzdGFtcCA9IG5ldyBEYXRlKCk7XG4gIGxldCBwb2xvVGltZXN0YW1wID0gcG9sb0pTT04udGltZVN0YW1wO1xuICBsZXQgcG9sb0FsbE1hcmtldHMgPSBKU09OLnBhcnNlKHBvbG9KU09OLmV4Y2hhbmdlRGF0YSk7XG4gIGxldCBiaXR0cmV4VGltZXN0YW1wID0gYml0dHJleEpTT04udGltZVN0YW1wO1xuICBjb25zb2xlLmxvZyhwb2xvVGltZXN0YW1wKTtcbiAgY29uc29sZS5sb2coYml0dHJleFRpbWVzdGFtcCk7XG4gIGZvcihsZXQgYml0dHJleE1rdCBpbiBiaXR0cmV4SlNPTi5leGNoYW5nZURhdGEpe1xuICAgIGxldCBwb2xvTWt0TmFtZSA9IHBvbG9Na3RGcm9tQml0dHJleE5hbWUoYml0dHJleE1rdCk7XG4gICAgbGV0IHBvbG9Na3RFbGVtZW50ID0gcG9sb0FsbE1hcmtldHNbcG9sb01rdE5hbWVdO1xuICAgIGlmKCFwb2xvTWt0RWxlbWVudCkge1xuICAgICAgY29uc29sZS5sb2coXCJQb2xvIG1hcmtldCBmb3IgXCIsIGJpdHRyZXhNa3QsIFwiIGRvZXNuJ3QgZXhpc3QuXCIpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGNvbXBhcmVQb2xvbmlleEJpdHRyZXhNa3RFbGVtZW50KHBvbG9Na3RFbGVtZW50LCBiaXR0cmV4SlNPTi5leGNoYW5nZURhdGFbYml0dHJleE1rdF0sIHBvbG9Na3ROYW1lLCByZXBvcnRpbmdUaW1lc3RhbXApXG4gICAgfVxuICB9XG59XG5cbi8qIGNvbXBhcmVQb2xvbmlleEJpdHRyZXhNa3RFbGVtZW50XG4gKiBkZXNjOiBDb21wYXJlcyBhIHBhcnRpY3VsYXIgbWFya2V0IGJldHdlZW4gdGhlIFBvbG9uaWV4IGFuZCBCaXR0cmV4IGV4Y2hhbmdlcy4gIFNlZG4gbm90aWZpY2F0aW9ucyB3aGVuXG4gKiAgICAgICBzaWduaWZpY2FudCBhcmJpdHJhZ2Ugb3Bwb3J0dW5pdGllcyBleGlzdC5cbiAqL1xuZnVuY3Rpb24gY29tcGFyZVBvbG9uaWV4Qml0dHJleE1rdEVsZW1lbnQocG9sb0pTT04sIGJpdHRyZXhKU09OLCBwb2xvUGFpciwgdGltZVN0YW1wKSB7XG5cbiAgbGV0IHBvbG9CdXlBdCA9ICtwb2xvSlNPTi5sb3dlc3RBc2s7XG4gIGxldCBwb2xvU2VsbEF0ID0gK3BvbG9KU09OLmhpZ2hlc3RCaWQ7XG4gIGxldCBiaXR0cmV4U2VsbEF0ID0gK2JpdHRyZXhKU09OLkJpZDtcbiAgbGV0IGJpdHRyZXhCdXlBdCA9ICtiaXR0cmV4SlNPTi5Bc2s7XG4gIG91dHB1dEFyYlJlc3VsdHMocG9sb0J1eUF0LCBwb2xvU2VsbEF0LCBiaXR0cmV4U2VsbEF0LCBiaXR0cmV4QnV5QXQsIFwiQml0dHJleFwiLCBwb2xvUGFpciwgdGltZVN0YW1wKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gb3V0cHV0QXJiUmVzdWx0cyhwb2xvQnV5QXQ6IG51bWJlciwgcG9sb1NlbGxBdDogbnVtYmVyLCBleGNoYW5nZTJTZWxsQXQ6IG51bWJlciwgZXhjaGFuZ2UyQnV5QXQ6IG51bWJlciwgZXhjaGFuZ2UyTmFtZTogc3RyaW5nLCBwb2xvUGFpciwgdGltZVN0YW1wKSB7XG5cbiAgbGV0IGRiT3V0cHV0ID0ge1xuICAgIGtleTogXCJcIixcbiAgICBleGNoMU5hbWU6IFwiUG9sb25pZXhcIixcbiAgICBleGNoMk5hbWU6IGV4Y2hhbmdlMk5hbWUsXG4gICAgdGltZVN0YW1wOiB0aW1lU3RhbXAudG9TdHJpbmcoKS5zbGljZSgwLDI1KSxcbiAgICBjY3lQYWlyOiBwb2xvUGFpcixcbiAgICBleGNoMUJ1eUF0OiBwb2xvQnV5QXQsXG4gICAgZXhjaDFTZWxsQXQ6IHBvbG9TZWxsQXQsXG4gICAgZXhjaDJCdXlBdDogZXhjaGFuZ2UyQnV5QXQsXG4gICAgZXhjaDJTZWxsQXQ6IGV4Y2hhbmdlMlNlbGxBdCxcbiAgICBnYWluTG9zczogXCJMT1NTXCIsXG4gICAgdXJnZW50VHJhZGU6IGZhbHNlLFxuICAgIGFyYlBlcmNlbnQ6IDAsXG4gICAgZXhjaDFCdXlPclNlbGw6IFwiXCIsXG4gICAgdHJhZGVJbnN0cnVjdGlvbnM6IFwiXCIsXG4gIH07XG4gLy8gQ2hlY2sgZm9yIGNhc2Ugb2YgQnV5IGF0IEV4Y2hhbmdlMiBhbmQgU2VsbCBhdCBFeGNoYW5nZTEgKFBvbG8pXG4gIGxldCBhcmJPcHBvcnR1bml0eSA9IHBvbG9TZWxsQXQtZXhjaGFuZ2UyQnV5QXQ7XG4gIGxldCBhcmJQZXJjZW50ID0gMTAwKihwb2xvU2VsbEF0LWV4Y2hhbmdlMkJ1eUF0KS8oIChwb2xvU2VsbEF0K2V4Y2hhbmdlMkJ1eUF0KSAvIDIpO1xuICBkYk91dHB1dC5hcmJQZXJjZW50ID0gYXJiUGVyY2VudDtcbiAgZGJPdXRwdXQuZXhjaDFCdXlPclNlbGwgPSBcIlNlbGxcIjtcbiAgaWYoYXJiUGVyY2VudCA+IGFyYlJlcG9ydGluZ1RocmVzaG9sZFBlcmNlbnQpIHtcbiAgICBkYk91dHB1dC5nYWluTG9zcyA9IFwiR0FJTlwiO1xuICAgIGRiT3V0cHV0LnRyYWRlSW5zdHJ1Y3Rpb25zID0gYCR7cG9sb1BhaXJ9IEJVWSBhdCAke2V4Y2hhbmdlMk5hbWV9IGZvciAke2V4Y2hhbmdlMkJ1eUF0LnRvRml4ZWQoOSl9LiBTRUxMIGF0IFBvbG8gZm9yICR7cG9sb1NlbGxBdC50b0ZpeGVkKDkpfSBHYWluICR7YXJiUGVyY2VudC50b0ZpeGVkKDYpfSVgO1xuICAgIGNvbnNvbGUubG9nKGRiT3V0cHV0LmdhaW5Mb3NzLCBcIjogXCIsIGRiT3V0cHV0LnRyYWRlSW5zdHJ1Y3Rpb25zKTtcbiAgICBpZiAoYXJiUGVyY2VudCA+IGFyYkVtYWlsVGhyZXNob2xkUGVyY2VudCkge1xuICAgICAgZGJPdXRwdXQudXJnZW50VHJhZGUgPSB0cnVlO1xuICAgICAgU2VuZE1lc3NhZ2UoYCR7cG9sb1BhaXJ9OiBCVVkgYXQgJHtleGNoYW5nZTJOYW1lfSBhbmQgU0VMTCBhdCBQb2xvbmlleGAsIGRiT3V0cHV0LnRyYWRlSW5zdHJ1Y3Rpb25zKTtcbiAgICB9XG4gIH1cbiAgZWxzZSB7IFxuICAgIGRiT3V0cHV0LmdhaW5Mb3NzID0gXCJMT1NTXCI7XG4gICAgZGJPdXRwdXQudXJnZW50VHJhZGUgPSBmYWxzZTtcbiAgICBkYk91dHB1dC50cmFkZUluc3RydWN0aW9ucyA9IGAke3BvbG9QYWlyfSBCVVkgYXQgJHtleGNoYW5nZTJOYW1lfSBmb3IgJHtleGNoYW5nZTJCdXlBdC50b0ZpeGVkKDkpfS4gU0VMTCBhdCBQb2xvIGZvciAke3BvbG9TZWxsQXQudG9GaXhlZCg5KX0gTG9zcyAke2FyYlBlcmNlbnQudG9GaXhlZCg2KX0lYDtcbiAgICBpZiAocmVwb3J0TG9zZXMpIHtcbiAgICAgIGNvbnNvbGUubG9nKGAke2Zvcm1hdFRpbWVzdGFtcCh0aW1lU3RhbXApfTogUGFpcjogJHtwb2xvUGFpcn0sIFJlc3VsdDogTE9TUywgRGVzYzogJHtleGNoYW5nZTJOYW1lfSwgJHtleGNoYW5nZTJCdXlBdC50b0ZpeGVkKDgpfSBpcyBncmVhdGVyIHRoYW4gcG9sb1NlbGxBdCwgJHtwb2xvU2VsbEF0LnRvRml4ZWQoOCl9LCBESUZGLCAke2FyYk9wcG9ydHVuaXR5LnRvRml4ZWQoNil9YCk7XG4gICAgfVxuICB9XG4gIGxldCBrZXlTdHIgPSBcIkJ1eVwiK2V4Y2hhbmdlMk5hbWUrXCJTZWxsUG9sb25pZXhcIitwb2xvUGFpcjtcbiAgbGV0IGtleSA9IHtcbiAgICBcImtleVwiOiBrZXlTdHJcbiAgfTtcbiAgZGJPdXRwdXQua2V5ID0ga2V5U3RyO1xuICBpZiAoZGJXcml0ZUVuYWJsZWQpIHtcbiAgICBhd2FpdCB1cGRhdGVSZXN1bHRzSW5Nb25nbyhrZXksIGRiT3V0cHV0LCBcImNyeXB0b1wiLCBcIm1hcmtldGRhdGEuYXJibW9uXCIpO1xuICB9XG4gIC8vIENoZWNrIGZvciBjYXNlIG9mIEJ1eSBhdCBFeGNoYW5nZTEoUG9sbykgYW5kIFNlbGwgYXQgRXhjaGFuZ2UyXG4gIGFyYk9wcG9ydHVuaXR5ID0gZXhjaGFuZ2UyU2VsbEF0LXBvbG9CdXlBdDtcbiAgYXJiUGVyY2VudCA9IDEwMCooZXhjaGFuZ2UyU2VsbEF0LXBvbG9CdXlBdCkvKCAoZXhjaGFuZ2UyU2VsbEF0K3BvbG9CdXlBdCkgLyAyKTtcbiAgZGJPdXRwdXQuYXJiUGVyY2VudCA9IGFyYlBlcmNlbnQ7XG4gIGRiT3V0cHV0LmV4Y2gxQnV5T3JTZWxsID0gXCJCdXlcIjtcbiAgaWYoZGJPdXRwdXQubWF4UHJvZml0IDwgYXJiUGVyY2VudClcbiAgICBkYk91dHB1dC5tYXhQcm9maXQgPSBhcmJQZXJjZW50O1xuICBpZihhcmJQZXJjZW50ID4gYXJiUmVwb3J0aW5nVGhyZXNob2xkUGVyY2VudCkgeyAgICBcbiAgICBkYk91dHB1dC5nYWluTG9zcyA9IFwiR0FJTlwiO1xuICAgIGRiT3V0cHV0LnRyYWRlSW5zdHJ1Y3Rpb25zID0gYCR7cG9sb1BhaXJ9IEJVWSBhdCBQb2xvIGZvciAke3BvbG9CdXlBdC50b0ZpeGVkKDkpfS4gU0VMTCAke2V4Y2hhbmdlMk5hbWV9IGZvciAke2V4Y2hhbmdlMlNlbGxBdC50b0ZpeGVkKDkpfSBHYWluICR7YXJiUGVyY2VudC50b0ZpeGVkKDYpfSVgO1xuICAgIGNvbnNvbGUubG9nKGRiT3V0cHV0LmdhaW5Mb3NzLCBcIjogXCIsIGRiT3V0cHV0LnRyYWRlSW5zdHJ1Y3Rpb25zKTtcbiAgICBpZiAoYXJiUGVyY2VudCA+IGFyYkVtYWlsVGhyZXNob2xkUGVyY2VudCkge1xuICAgICAgZGJPdXRwdXQudXJnZW50VHJhZGUgPSB0cnVlO1xuICAgICAgU2VuZE1lc3NhZ2UoYCR7cG9sb1BhaXJ9OiBCVVkgYXQgUG9sb25pZXggYW5kIFNFTEwgYXQgJHtleGNoYW5nZTJOYW1lfWAsIGRiT3V0cHV0LnRyYWRlSW5zdHJ1Y3Rpb25zKTtcbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgZGJPdXRwdXQuZ2Fpbkxvc3MgPSBcIkxPU1NcIjtcbiAgICBkYk91dHB1dC51cmdlbnRUcmFkZSA9IGZhbHNlO1xuICAgIGRiT3V0cHV0LnRyYWRlSW5zdHJ1Y3Rpb25zID0gYCR7cG9sb1BhaXJ9IEJVWSBhdCBQb2xvIGZvciAke3BvbG9CdXlBdC50b0ZpeGVkKDkpfSBTRUxMICR7ZXhjaGFuZ2UyTmFtZX0gZm9yICR7ZXhjaGFuZ2UyU2VsbEF0LnRvRml4ZWQoOSl9IExvc3MgJHthcmJQZXJjZW50LnRvRml4ZWQoNil9JWA7XG4gICAgaWYgKHJlcG9ydExvc2VzKSB7XG4gICAgICBjb25zb2xlLmxvZyhgJHtmb3JtYXRUaW1lc3RhbXAodGltZVN0YW1wKX06IFBhaXI6ICR7cG9sb1BhaXJ9LCBSZXN1bHQ6IExPU1MsIERlc2M6IHBvbG9CdXlBdCwgJHtwb2xvQnV5QXQudG9GaXhlZCg5KX0gaXMgZ3JlYXRlciB0aGFuICR7ZXhjaGFuZ2UyTmFtZX1TZWxsQXQsICR7ZXhjaGFuZ2UyU2VsbEF0LnRvRml4ZWQoOCl9LiBESUZGLCAke2FyYk9wcG9ydHVuaXR5LnRvRml4ZWQoNyl9YCk7XG4gICAgfVxuICB9XG4gIGtleVN0ciA9IFwiQnV5UG9sb25pZXhTZWxsXCIrZXhjaGFuZ2UyTmFtZStwb2xvUGFpcjtcbiAga2V5ID0ge1xuICAgIFwia2V5XCI6IGtleVN0clxuICB9O1xuICBkYk91dHB1dC5rZXkgPSBrZXlTdHI7XG4gIGlmIChkYldyaXRlRW5hYmxlZCkge1xuICAgIGF3YWl0IHVwZGF0ZVJlc3VsdHNJbk1vbmdvKGtleSwgZGJPdXRwdXQsIFwiY3J5cHRvXCIsIFwibWFya2V0ZGF0YS5hcmJtb25cIik7XG4gIH1cbn1cblxuLyogcG9sb01rdEZyb21CaXR0cmV4TmFtZVxuICogZGVzYzogQ29udmVydHMgYSBCaXR0cmV4IGNyeXB0byBjdXJyZW5jeSBwYWlyIGludG8gdGhlIFBvbG9uaWV4IHBhaXIuXG4gKi9cbmZ1bmN0aW9uIHBvbG9Na3RGcm9tQml0dHJleE5hbWUoYml0dHJleE1rdE5hbWUpIHtcbiAgaWYoYml0dHJleE1rdE5hbWU9PT1cIkJUQy1YTE1cIilcbiAgICByZXR1cm4oXCJCVENfU1RSXCIpO1xuICBpZihiaXR0cmV4TWt0TmFtZT09PVwiVVNEVC1YTE1cIilcbiAgICByZXR1cm4oXCJVU0RUX1NUUlwiKTsgICAgXG4gIHJldHVybihiaXR0cmV4TWt0TmFtZS5yZXBsYWNlKFwiLVwiLCBcIl9cIikpO1xufVxuXG4vKiBjb21wYXJlQWxsUG9sb25pZXhIaXRidGNcbiogIGRlc2M6IFRha2VzIHRoZSBwb2xvbmlleCBhbmQgaGl0YnRjIGRhdGEgaW4gSlNPTiBmb3JtYXQgYW5kIGNvbXBhcmVzIGFsbCBvdmVybGFwaW5nIG1hcmtldHMgZm9yIGFyYml0cmFnZS5cbiogICAgICAgRXhwb3J0ZWQgZnVuY3Rpb24gY2FsbGVkIGJ5IHRoZSBtYWluIGFwcC5qc1xuKi9cbmZ1bmN0aW9uIGNvbXBhcmVBbGxQb2xvbmlleEhpdGJ0Yyhwb2xvSlNPTiwgaGl0YnRjSlNPTikge1xuICBcbiAgbGV0IHJlcG9ydGluZ1RpbWVzdGFtcCA9IG5ldyBEYXRlKCk7XG4gIGxldCBwb2xvVGltZXN0YW1wID0gcG9sb0pTT04udGltZVN0YW1wO1xuICBsZXQgcG9sb0FsbE1hcmtldHMgPSBKU09OLnBhcnNlKHBvbG9KU09OLmV4Y2hhbmdlRGF0YSk7XG4gIGxldCBoaXRidGNUaW1lc3RhbXAgPSBoaXRidGNKU09OLnRpbWVTdGFtcDtcbiAgY29uc29sZS5sb2cocG9sb1RpbWVzdGFtcCk7XG4gIGNvbnNvbGUubG9nKGhpdGJ0Y1RpbWVzdGFtcCk7XG4gIGZvcihsZXQgaGl0YnRjTWt0IGluIGhpdGJ0Y0pTT04uZXhjaGFuZ2VEYXRhKXtcbiAgICBsZXQgcG9sb01rdE5hbWUgPSBwb2xvTWt0RnJvbUhpdGJ0Y05hbWUoaGl0YnRjTWt0KTtcbiAgICBsZXQgcG9sb01rdEVsZW1lbnQgPSBwb2xvQWxsTWFya2V0c1twb2xvTWt0TmFtZV07XG4gICAgY29tcGFyZVBvbG9uaWV4SGl0YnRjTWt0RWxlbWVudChwb2xvTWt0RWxlbWVudCwgaGl0YnRjSlNPTi5leGNoYW5nZURhdGFbaGl0YnRjTWt0XSwgcG9sb01rdE5hbWUsIHJlcG9ydGluZ1RpbWVzdGFtcCk7XG4gIH1cbn1cblxuLyogY29tcGFyZVBvbG9uaWV4SGl0YnRjTWt0RWxlbWVudFxuICogZGVzYzogUHVsbHMgb3V0IHRoZSBidXkgYW5kIHNlbGwgcHJpY2VzIGZvciBhIHNpbmdsZSBjdXJyZW5jeSBwYWlyIGZvciBQb2xvbmlleCBhbmQgSGl0YnRjLlxuICogICAgICAgRm9yd2FyZHMgdGhpcyB0byB0aGUgb3V0cHV0IG1ldGhvZCB0byByZWNvcmQgdGhlIGFyYml0cmFnZSByZXN1bHRzLlxuICovXG5mdW5jdGlvbiBjb21wYXJlUG9sb25pZXhIaXRidGNNa3RFbGVtZW50KHBvbG9Na3RFbGVtZW50LCBoaXRidGNNa3RFbGVtZW50LCBwb2xvTWt0TmFtZSwgcmVwb3J0aW5nVGltZXN0YW1wKSB7XG5cbiAgbGV0IHBvbG9CdXlBdCA9ICtwb2xvTWt0RWxlbWVudC5sb3dlc3RBc2s7XG4gIGxldCBwb2xvU2VsbEF0ID0gK3BvbG9Na3RFbGVtZW50LmhpZ2hlc3RCaWQ7XG4gIGxldCBoaXRidGNTZWxsQXQgPSAraGl0YnRjTWt0RWxlbWVudC5iaWQ7XG4gIGxldCBoaXRidGNCdXlBdCA9ICtoaXRidGNNa3RFbGVtZW50LmFzaztcbiAgb3V0cHV0QXJiUmVzdWx0cyhwb2xvQnV5QXQsIHBvbG9TZWxsQXQsIGhpdGJ0Y1NlbGxBdCwgaGl0YnRjQnV5QXQsIFwiSGl0YnRjXCIsIHBvbG9Na3ROYW1lLCByZXBvcnRpbmdUaW1lc3RhbXApO1xufVxuXG4vKiBwb2xvTWt0RnJvbUhpdGJ0Y05hbWVcbiAqIGRlc2M6IE1hcHMgZnJvbSBIaXRidGMgdGlja2VycyB0byBQb2xvbmlleCB0aWNrZXJzLlxuICovXG5mdW5jdGlvbiBwb2xvTWt0RnJvbUhpdGJ0Y05hbWUoaGl0YnRjTWt0TmFtZSkge1xuXG4gIGNvbnN0IHBvbG9Na3ROYW1lcyA9IHtcbiAgICBCQ05CVEM6ICAgXCJCVENfQkNOXCIsXG4gICAgQk5UVVNEVDogIFwiVVNEVF9CTlRcIixcbiAgICBEQVNIQlRDOiAgXCJCVENfREFTSFwiLFxuICAgIERBU0hVU0RUOiBcIlVTRFRfREFTSFwiLFxuICAgIERPR0VCVEM6ICBcIkJUQ19ET0dFXCIsXG4gICAgRE9HRVVTRFQ6IFwiVVNEVF9ET0dFXCIsXG4gICAgREdCQlRDOiAgIFwiQlRDX0RHQlwiLFxuICAgIEVPU0JUQzogICBcIkJUQ19FT1NcIixcbiAgICBFT1NVU0RUOiAgXCJVU0RUX0VPU1wiLFxuICAgIEVUQ1VTRFQ6ICBcIlVTRFRfRVRDXCIsXG4gICAgRVRIVVNEVDogIFwiVVNEVF9FVEhcIixcbiAgICBMU0tCVEM6ICAgXCJCVENfTFNLXCIsXG4gICAgTUFJREJUQzogIFwiQlRDX01BSURcIixcbiAgICBNQU5BQlRDOiAgXCJCVENfTUFOQVwiLFxuICAgIE9NR0JUQzogICBcIkJUQ19PTUdcIixcbiAgICBQUENCVEM6ICAgXCJCVENfUFBDXCIsXG4gICAgUVRVTUJUQzogIFwiQlRDX1FUVU1cIixcbiAgICBSRVBCVEM6ICAgXCJCVENfUkVQXCIsXG4gICAgUkVQVVNEVDogIFwiVVNEVF9SRVBcIixcbiAgICBYRU1CVEM6ICAgXCJCVENfWEVNXCIsXG4gICAgRVRIQlRDOiAgIFwiQlRDX0VUSFwiLFxuICAgIFpFQ0VUSDogICBcIkVUSF9aRUNcIlxuICB9O1xuICByZXR1cm4ocG9sb01rdE5hbWVzW2hpdGJ0Y01rdE5hbWVdKTtcbn1cblxuLyogY29tcGFyZUFsbFBvbG9uaWV4WW9iaXRcbiAqIGRlc2M6IENvbXBhcmVzIG1hcmtldCBkYXRhIGFjcm9zcyBtYW55IGN1cnJlbmN5IHBhaXJzIGJldHdlZW4gUG9sb25pZXggYW5kIFlvYml0LlxuICogICAgICAgTm90ZSB0aGF0IFlvYml0IG9mdGVucyBoYXMgbGFyZ2UgcHJjaWUgZGlzY3JlcGVuY2llcyBidXQgdGhlIHdhbGxldHMgZm9yIHRob3MgY29pbnNcbiAqICAgICAgIGFyZSBkZWFjdGl2YXRlZC4gIFNvIHlvdSBjYW4ndCBnZW5lcmF0ZSBhIHByb2ZpdC5cbiAqL1xuZnVuY3Rpb24gY29tcGFyZUFsbFBvbG9uaWV4WW9iaXQocG9sb0RhdGEsIHlvYml0RGF0YSkge1xuXG4gIGxldCByZXBvcnRpbmdUaW1lc3RhbXAgPSBuZXcgRGF0ZSgpO1xuICBsZXQgcG9sb1RpbWVzdGFtcCA9IHBvbG9EYXRhLnRpbWVTdGFtcDtcbiAgbGV0IHBvbG9BbGxNYXJrZXRzID0gSlNPTi5wYXJzZShwb2xvRGF0YS5leGNoYW5nZURhdGEpO1xuICBsZXQgeW9iaXRUaW1lc3RhbXAgPSB5b2JpdERhdGEudGltZVN0YW1wO1xuICBsZXQgeW9iaXRBbGxNYXJrZXRzID0gSlNPTi5wYXJzZSh5b2JpdERhdGEuZXhjaGFuZ2VEYXRhKTtcbiAgY29uc29sZS5sb2cocG9sb1RpbWVzdGFtcCk7XG4gIGNvbnNvbGUubG9nKHlvYml0VGltZXN0YW1wKTtcbiAgZm9yKGxldCB5b2JpdE1rdCBpbiB5b2JpdEFsbE1hcmtldHMpe1xuICAgIGNvbnNvbGUubG9nKFwieW9iaXRNa3Q6XCIsIHlvYml0TWt0LCBcIiBkYXRhOlwiLCB5b2JpdEFsbE1hcmtldHNbeW9iaXRNa3RdKTtcbiAgICBsZXQgcG9sb01rdE5hbWUgPSBwb2xvTWt0RnJvbVlvYml0TmFtZSh5b2JpdE1rdCk7XG4gICAgY29uc29sZS5sb2coXCJQb2xvTWFya2V0OlwiLCBwb2xvTWt0TmFtZSwgXCIgZGF0YTpcIiwgcG9sb0FsbE1hcmtldHNbcG9sb01rdE5hbWVdKTtcbiAgICBjb21wYXJlUG9sb25pZXhZb2JpdE1rdEVsZW1lbnQocG9sb0FsbE1hcmtldHNbcG9sb01rdE5hbWVdLCB5b2JpdEFsbE1hcmtldHNbeW9iaXRNa3RdLCBwb2xvTWt0TmFtZSwgcmVwb3J0aW5nVGltZXN0YW1wKTtcbiAgfVxufVxuXG4vKiBjb21wYXJlUG9sb25pZXhZb2JpdE1rdEVsZW1lbnRcbiAqIGRlc2M6IFB1bGxzIG91dCB0aGUgYnV5IGFuZCBzZWxsIHByaWNlcyBmb3IgYSBzaW5nbGUgY3VycmVuY3kgcGFpciBmb3IgUG9sb25pZXggYW5kIFlvYml0LlxuICogICAgICAgRm9yd2FyZHMgdGhpcyB0byB0aGUgb3V0cHV0IG1ldGhvZCB0byByZWNvcmQgdGhlIGFyYml0cmFnZSByZXN1bHRzLlxuICovXG5mdW5jdGlvbiBjb21wYXJlUG9sb25pZXhZb2JpdE1rdEVsZW1lbnQocG9sb01rdEVsZW1lbnQsIHlvYml0TWt0RWxlbWVudCwgcG9sb01rdE5hbWUsIHJlcG9ydGluZ1RpbWVzdGFtcCkge1xuXG4gIGxldCBwb2xvQnV5QXQgPSArcG9sb01rdEVsZW1lbnQubG93ZXN0QXNrO1xuICBsZXQgcG9sb1NlbGxBdCA9ICtwb2xvTWt0RWxlbWVudC5oaWdoZXN0QmlkO1xuICBsZXQgeW9iaXRTZWxsQXQgPSAreW9iaXRNa3RFbGVtZW50LnNlbGw7XG4gIGxldCB5b2JpdEJ1eUF0ID0gK3lvYml0TWt0RWxlbWVudC5idXk7XG4gIG91dHB1dEFyYlJlc3VsdHMocG9sb0J1eUF0LCBwb2xvU2VsbEF0LCB5b2JpdFNlbGxBdCwgeW9iaXRCdXlBdCwgXCJZb2JpdFwiLCBwb2xvTWt0TmFtZSwgcmVwb3J0aW5nVGltZXN0YW1wKTtcbn1cblxuLyogcG9sb01rdEZyb21Zb2JpdE5hbWVcbiAqIGRlc2M6IE1hcHMgZnJvbSBZb2JpdCB0aWNrZXJzIHRvIFBvbG9uaWV4IHRpY2tlcnMuXG4gKi9cbmZ1bmN0aW9uIHBvbG9Na3RGcm9tWW9iaXROYW1lKHlvYml0TWt0TmFtZSkge1xuXG4gIGNvbnN0IHBvbG9Na3ROYW1lcyA9IHtcbiAgICBsdGNfYnRjOiAgXCJCVENfTFRDXCIsXG4gICAgbm1jX2J0YzogIFwiQlRDX05NQ1wiLFxuICAgIG5tcl9idGM6ICBcIkJUQ19OTVJcIixcbiAgICBldGhfYnRjOiAgXCJCVENfRVRIXCJcbiAgfTtcbiAgcmV0dXJuKHBvbG9Na3ROYW1lc1t5b2JpdE1rdE5hbWVdKTtcbn1cblxuXG5hc3luYyBmdW5jdGlvbiBpbnRlcm5hbENvbXBhcmVGb3JZb2JpdChta3REYXRhIDogYW55LCB5b2JpdE1hcmtldHMgOiBBcnJheTxzdHJpbmc+LCBiYXNlTWFya2V0cyA6IEFycmF5PHN0cmluZz4pIHtcblxuICBsZXQgdGltZVN0YW1wID0gbmV3IERhdGUoKTtcbiAgZm9yKGxldCBpPTA7IGk8eW9iaXRNYXJrZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IGN1ck1rdDE6IHN0cmluZyA9IHlvYml0TWFya2V0c1tpXSArIFwiX1wiICsgYmFzZU1hcmtldHNbMF07XG4gICAgbGV0IGN1ck1rdDI6IHN0cmluZyA9IHlvYml0TWFya2V0c1tpXSArIFwiX1wiICsgYmFzZU1hcmtldHNbMV07XG4gICAgbGV0IGJhc2VQYWlyOiBzdHJpbmcgPSBiYXNlTWFya2V0c1sxXSArIFwiX1wiICsgYmFzZU1hcmtldHNbMF07XG4gICAgbGV0IGFyYkZyYWN0aW9uOiBudW1iZXIgPSBta3REYXRhW2Jhc2VQYWlyXS5idXkgKiBta3REYXRhW2N1ck1rdDJdLmJ1eSAvIG1rdERhdGFbY3VyTWt0MV0uc2VsbDtcbiAgICBjb25zb2xlLmxvZyhcIkFyYiBGcmFjdGlvbiBmb3IgXCIsIHlvYml0TWFya2V0c1tpXSwgXCI6IFwiLCBhcmJGcmFjdGlvbi50b0ZpeGVkKDYpKTtcbiAgICBsZXQga2V5U3RyID0gXCJZb2JpdEludGVybmFsX1wiICsgY3VyTWt0MSArIFwiX1wiICsgYmFzZU1hcmtldHNbMV07XG4gICAgbGV0IGRiT3V0cHV0ID0ge1xuICAgICAga2V5OiBrZXlTdHIsXG4gICAgICBleGNoMU5hbWU6IFwiWW9iaXRcIixcbiAgICAgIGV4Y2gyTmFtZTogXCJZb2JpdFwiLFxuICAgICAgdGltZVN0YW1wOiB0aW1lU3RhbXAudG9TdHJpbmcoKS5zbGljZSgwLDI1KSxcbiAgICAgIGNjeVBhaXI6IGN1ck1rdDEsXG4gICAgICBleGNoMUJ1eUF0OiBta3REYXRhW2Jhc2VQYWlyXS5idXksXG4gICAgICBleGNoMVNlbGxBdDogMCxcbiAgICAgIGV4Y2gyQnV5QXQ6IDAsXG4gICAgICBleGNoMlNlbGxBdDogbWt0RGF0YVtjdXJNa3QxXS5zZWxsLFxuICAgICAgZ2Fpbkxvc3M6IFwiTG9zc1wiLFxuICAgICAgdXJnZW50VHJhZGU6IGZhbHNlLFxuICAgICAgYXJiUGVyY2VudDogYXJiRnJhY3Rpb24sXG4gICAgICBleGNoMUJ1eU9yU2VsbDogXCJCdXlcIixcbiAgICAgIHRyYWRlSW5zdHJ1Y3Rpb25zOiBcIlwiLFxuICAgIH07XG4gICAgaWYgKGFyYkZyYWN0aW9uID4gMSkge1xuICAgICAgZGJPdXRwdXQuZ2Fpbkxvc3MgPSBcIkdhaW5cIjtcbiAgICAgIGNvbnNvbGUubG9nKFwiICAtLS0+IEdhaW5cIiwgdGltZVN0YW1wLnRvU3RyaW5nKCkuc2xpY2UoMCwyNSksIFwiIFwiLCBhcmJGcmFjdGlvbi50b0ZpeGVkKDgpLCBcbiAgICAgICAgXCJCdXkgXCIsIHlvYml0TWFya2V0c1tpXSwgXCIgd2l0aCBCVEMgYXRcIiwgbWt0RGF0YVtjdXJNa3QxXS5zZWxsLFxuICAgICAgICBcInNlbGwgdGhlXCIsIHlvYml0TWFya2V0c1tpXSwgXCJmb3JcIiwgbWt0RGF0YVtjdXJNa3QyXS5idXksIFxuICAgICAgICBcInRvIGdldCBFVEguIENvbnZlcnQgRVRIIGJhY2sgdG8gQlRDIGF0XCIsIG1rdERhdGFbYmFzZVBhaXJdLmJ1eSk7XG4gICAgICBpZiAoYXJiRnJhY3Rpb24gPiAxLjAwNSkge1xuICAgICAgICBkYk91dHB1dC51cmdlbnRUcmFkZSA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIGRiT3V0cHV0LmtleSA9IGtleVN0cjtcbiAgICBsZXQga2V5OiBhbnkgPSB7XG4gICAgICBcImtleVwiOiBrZXlTdHJcbiAgICB9O1xuICAgIGlmIChkYldyaXRlRW5hYmxlZCkge1xuICAgICAgYXdhaXQgdXBkYXRlUmVzdWx0c0luTW9uZ28oa2V5LCBkYk91dHB1dCwgXCJjcnlwdG9cIiwgXCJtYXJrZXRkYXRhLmFyYm1vblwiKTtcbiAgICB9ICAgIFxuICB9XG59XG5cbmV4cG9ydCB7Y29tcGFyZVBvbG9uaWV4Q29pbmJhc2UsIGNvbXBhcmVBbGxQb2xvbmlleEJpdHRyZXgsIGNvbXBhcmVBbGxQb2xvbmlleEhpdGJ0YywgXG4gIGNvbXBhcmVBbGxQb2xvbmlleFlvYml0LCBpbnRlcm5hbENvbXBhcmVGb3JZb2JpdH07XG4iXX0=