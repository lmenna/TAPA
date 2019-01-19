"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.comparePoloniexCoinbase = comparePoloniexCoinbase;
exports.compareAllPoloniexBittrex = compareAllPoloniexBittrex;
exports.compareAllPoloniexHitbtc = compareAllPoloniexHitbtc;
exports.compareAllPoloniexYobit = compareAllPoloniexYobit;

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9jb21wYXJlUHJpY2luZ0RhdGEuanMiXSwibmFtZXMiOlsiYXJiRW1haWxUaHJlc2hvbGRQZXJjZW50IiwiYXJiUmVwb3J0aW5nVGhyZXNob2xkUGVyY2VudCIsImRiV3JpdGVFbmFibGVkIiwicmVwb3J0TG9zZXMiLCJmb3JtYXRUaW1lc3RhbXAiLCJ0aW1lU3RhbXAiLCJ0b1N0cmluZyIsInNsaWNlIiwiY29tcGFyZVBvbG9uaWV4Q29pbmJhc2UiLCJwb2xvRGF0YSIsImNiRGF0YSIsImNvaW4iLCJwb2xvSlNPTiIsIkpTT04iLCJwYXJzZSIsImV4Y2hhbmdlRGF0YSIsImNiSlNPTiIsIkRhdGUiLCJjb25zb2xlIiwibG9nIiwiZ2V0VGltZSIsImNvbXBhcmVDdXJyZW5jeVBhaXIiLCJjY3kxIiwiY2N5MiIsInBvbG9QYWlyIiwicG9sb0J1eUF0IiwibG93ZXN0QXNrIiwicG9sb1NlbGxBdCIsImhpZ2hlc3RCaWQiLCJjb2luYmFzZVNlbGxBdCIsImJpZHMiLCJjb2luYmFzZUJ1eUF0IiwiYXNrcyIsIm91dHB1dEFyYlJlc3VsdHMiLCJjb21wYXJlQWxsUG9sb25pZXhCaXR0cmV4IiwiYml0dHJleEpTT04iLCJyZXBvcnRpbmdUaW1lc3RhbXAiLCJwb2xvVGltZXN0YW1wIiwicG9sb0FsbE1hcmtldHMiLCJiaXR0cmV4VGltZXN0YW1wIiwiYml0dHJleE1rdCIsInBvbG9Na3ROYW1lIiwicG9sb01rdEZyb21CaXR0cmV4TmFtZSIsInBvbG9Na3RFbGVtZW50IiwiY29tcGFyZVBvbG9uaWV4Qml0dHJleE1rdEVsZW1lbnQiLCJiaXR0cmV4U2VsbEF0IiwiQmlkIiwiYml0dHJleEJ1eUF0IiwiQXNrIiwiZXhjaGFuZ2UyU2VsbEF0IiwiZXhjaGFuZ2UyQnV5QXQiLCJleGNoYW5nZTJOYW1lIiwiZGJPdXRwdXQiLCJrZXkiLCJleGNoMU5hbWUiLCJleGNoMk5hbWUiLCJjY3lQYWlyIiwiZXhjaDFCdXlBdCIsImV4Y2gxU2VsbEF0IiwiZXhjaDJCdXlBdCIsImV4Y2gyU2VsbEF0IiwiZ2Fpbkxvc3MiLCJ1cmdlbnRUcmFkZSIsImFyYlBlcmNlbnQiLCJleGNoMUJ1eU9yU2VsbCIsInRyYWRlSW5zdHJ1Y3Rpb25zIiwiYXJiT3Bwb3J0dW5pdHkiLCJ0b0ZpeGVkIiwia2V5U3RyIiwibWF4UHJvZml0IiwiYml0dHJleE1rdE5hbWUiLCJyZXBsYWNlIiwiY29tcGFyZUFsbFBvbG9uaWV4SGl0YnRjIiwiaGl0YnRjSlNPTiIsImhpdGJ0Y1RpbWVzdGFtcCIsImhpdGJ0Y01rdCIsInBvbG9Na3RGcm9tSGl0YnRjTmFtZSIsImNvbXBhcmVQb2xvbmlleEhpdGJ0Y01rdEVsZW1lbnQiLCJoaXRidGNNa3RFbGVtZW50IiwiaGl0YnRjU2VsbEF0IiwiYmlkIiwiaGl0YnRjQnV5QXQiLCJhc2siLCJoaXRidGNNa3ROYW1lIiwicG9sb01rdE5hbWVzIiwiQkNOQlRDIiwiQk5UVVNEVCIsIkRBU0hCVEMiLCJEQVNIVVNEVCIsIkRPR0VCVEMiLCJET0dFVVNEVCIsIkRHQkJUQyIsIkVPU0JUQyIsIkVPU1VTRFQiLCJFVENVU0RUIiwiRVRIVVNEVCIsIkxTS0JUQyIsIk1BSURCVEMiLCJNQU5BQlRDIiwiT01HQlRDIiwiUFBDQlRDIiwiUVRVTUJUQyIsIlJFUEJUQyIsIlJFUFVTRFQiLCJYRU1CVEMiLCJFVEhCVEMiLCJaRUNFVEgiLCJjb21wYXJlQWxsUG9sb25pZXhZb2JpdCIsInlvYml0RGF0YSIsInlvYml0VGltZXN0YW1wIiwieW9iaXRBbGxNYXJrZXRzIiwieW9iaXRNa3QiLCJwb2xvTWt0RnJvbVlvYml0TmFtZSIsImNvbXBhcmVQb2xvbmlleFlvYml0TWt0RWxlbWVudCIsInlvYml0TWt0RWxlbWVudCIsInlvYml0U2VsbEF0Iiwic2VsbCIsInlvYml0QnV5QXQiLCJidXkiLCJ5b2JpdE1rdE5hbWUiLCJsdGNfYnRjIiwibm1jX2J0YyIsIm5tcl9idGMiLCJldGhfYnRjIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBS0E7O0FBQ0E7Ozs7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SVgsU0FBUyxHQUFHLENBQUNrQixjQUFjLENBQUNqQixTQUFoQztBQUNBLE1BQUlDLFVBQVUsR0FBRyxDQUFDZ0IsY0FBYyxDQUFDZixVQUFqQztBQUNBLE1BQUl1RixXQUFXLEdBQUcsQ0FBQ0QsZUFBZSxDQUFDRSxJQUFuQztBQUNBLE1BQUlDLFVBQVUsR0FBRyxDQUFDSCxlQUFlLENBQUNJLEdBQWxDO0FBQ0FyRixFQUFBQSxnQkFBZ0IsQ0FBQ1IsU0FBRCxFQUFZRSxVQUFaLEVBQXdCd0YsV0FBeEIsRUFBcUNFLFVBQXJDLEVBQWlELE9BQWpELEVBQTBENUUsV0FBMUQsRUFBdUVMLGtCQUF2RSxDQUFoQjtBQUNEO0FBRUQ7Ozs7O0FBR0EsU0FBUzRFLG9CQUFULENBQThCTyxZQUE5QixFQUE0QztBQUUxQyxNQUFNbkMsWUFBWSxHQUFHO0FBQ25Cb0MsSUFBQUEsT0FBTyxFQUFHLFNBRFM7QUFFbkJDLElBQUFBLE9BQU8sRUFBRyxTQUZTO0FBR25CQyxJQUFBQSxPQUFPLEVBQUcsU0FIUztBQUluQkMsSUFBQUEsT0FBTyxFQUFHO0FBSlMsR0FBckI7QUFNQSxTQUFPdkMsWUFBWSxDQUFDbUMsWUFBRCxDQUFuQjtBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiLyogY29tcGFyZVByaWNpbmdEYXRhLmpzXG4gKiBDb25zb2xpZGF0ZXMgZnVuY3Rpb24gdG8gY29tcGFyZSBjcnlwdG8gbWFya2V0cyBsb29raW5nIGZvciBzaWduaWZpY2FudCBhcmJpdHJhZ2Ugb3Bwb3J0dW5pdGllcy5cbiAqIFNlbmRzIG5vdGlmaWNhdGlvbnMgd2hlbiBsYXJnZSBhcmJpdHJhZ2UgaXMgZGV0ZWN0ZWQuXG4gKi9cblxuaW1wb3J0IHtTZW5kTWVzc2FnZX0gZnJvbSBcIi4vc2VuZEVNYWlsXCI7XG5pbXBvcnQge3dyaXRlUmVzdWx0c1RvTW9uZ28sIHVwZGF0ZVJlc3VsdHNJbk1vbmdvfSBmcm9tIFwiLi9kYlV0aWxzXCI7XG5cbi8vIFNldCB0aGlzIHRvIGJlIGEgY2xlYXIgdHJhZGluZyBvcHBvcnR1bml0eVxuY29uc3QgYXJiRW1haWxUaHJlc2hvbGRQZXJjZW50ID0gMS4yNTtcbi8vIFNldCB0aGlzIHRvIGJlIHRoZSBmZWVzIGFzc29jaWF0ZWQgd2l0aCB0cmFkaW5nXG5jb25zdCBhcmJSZXBvcnRpbmdUaHJlc2hvbGRQZXJjZW50ID0gMC4wO1xuLy8gQ29udHJvbCBvdXRwdXQgdG8gREJcbmxldCBkYldyaXRlRW5hYmxlZCA9IHRydWU7XG4vLyBDb250cm9sIHJlcG9ydGVkIG91dHB1dFxubGV0IHJlcG9ydExvc2VzID0gZmFsc2U7XG5cbi8qIGZvcm1hdFRpbWVzdGFtcFxuICogZGVzYzogU2ltcGxlIHV0aWxpdHkgdG8gdHJ1bmNhdGUgdGhlIG91dHB1dCBvZiBsb25nIHRpbWUgc3RhbXBzIHRvIGluY2x1ZGUgb25seSB0aGUgZGF0ZSBhbmQgdGltZSBwYXJ0cy5cbiAqL1xuZnVuY3Rpb24gZm9ybWF0VGltZXN0YW1wKHRpbWVTdGFtcCkge1xuICByZXR1cm4odGltZVN0YW1wLnRvU3RyaW5nKCkuc2xpY2UoMCwyNSkpO1xufVxuXG4vKiBjb21wYXJlUG9sb25pZXhDb2luYmFzZVxuICogZGVzYzogTWFpbiBmdW5jdGlvbiBjYWxsZWQgdG8gY29tcGFyZSB0aGUgUG9sb25pZXggYW5kIENvaW5iYXNlIGNyeXB0byBtYXJrZXRzLlxuICogICAgICAgVGhpcyBmdW5jdGlvbiBpcyBleHBvcnRlZCBhbmQgY2FsbGVkIGJlIGFwcC5qc1xuICovXG5mdW5jdGlvbiBjb21wYXJlUG9sb25pZXhDb2luYmFzZShwb2xvRGF0YSwgY2JEYXRhLCBjb2luKSB7XG5cbiAgdmFyIHBvbG9KU09OID0gSlNPTi5wYXJzZShwb2xvRGF0YS5leGNoYW5nZURhdGEpO1xuICB2YXIgY2JKU09OID0gSlNPTi5wYXJzZShjYkRhdGEuZXhjaGFuZ2VEYXRhKTtcbiAgbGV0IHRpbWVTdGFtcCA9IG5ldyBEYXRlKCk7XG4gIGNvbnNvbGUubG9nKGAke2Zvcm1hdFRpbWVzdGFtcCh0aW1lU3RhbXApfTogUG9sb1RpbWUtQ0JUaW1lOiAke3BvbG9EYXRhLnRpbWVTdGFtcC5nZXRUaW1lKCktY2JEYXRhLnRpbWVTdGFtcC5nZXRUaW1lKCl9LmApO1xuICBjb21wYXJlQ3VycmVuY3lQYWlyKHRpbWVTdGFtcCwgcG9sb0pTT04sIGNiSlNPTiwgXCJVU0RDXCIsIGNvaW4pXG59XG5cbi8qIGNvbXBhcmVDdXJyZW5jeVBhaXJcbiAqIGRlc2M6IENvbXBhcmVzIGEgY3VycmVuY3kgcGFpciBiZXR3ZWVuIFBvbG9uaWV4IGFuZCBDb2luYmFzZS4gIE5vdGlmaWVzIHdoZW4gc2lnbmlmaWNhbnQgYXJiaXRyYWdlIG9wcG9ydHVuaXRpZXNcbiAqICAgICAgIG9jY3VyLlxuICovXG5mdW5jdGlvbiBjb21wYXJlQ3VycmVuY3lQYWlyKHRpbWVTdGFtcCwgcG9sb0pTT04sIGNiSlNPTiwgY2N5MSwgY2N5Mikge1xuICBsZXQgcG9sb1BhaXIgPSBjY3kxK1wiX1wiK2NjeTI7XG4gIGxldCBwb2xvQnV5QXQgPSArcG9sb0pTT05bcG9sb1BhaXJdLmxvd2VzdEFzaztcbiAgbGV0IHBvbG9TZWxsQXQgPSArcG9sb0pTT05bcG9sb1BhaXJdLmhpZ2hlc3RCaWQ7XG4gIGxldCBjb2luYmFzZVNlbGxBdCA9ICtjYkpTT04uYmlkc1swXVswXTtcbiAgbGV0IGNvaW5iYXNlQnV5QXQgPSArY2JKU09OLmFza3NbMF1bMF07XG4gIG91dHB1dEFyYlJlc3VsdHMocG9sb0J1eUF0LCBwb2xvU2VsbEF0LCBjb2luYmFzZVNlbGxBdCwgY29pbmJhc2VCdXlBdCwgXCJDb2luYmFzZVwiLCBwb2xvUGFpciwgdGltZVN0YW1wKTtcbiB9XG5cbiAvKiBjb21wYXJlQWxsUG9sb25pZXhCaXR0cmV4XG4gICogZGVzYzogVGFrZXMgdGhlIHBvbG9uaWV4IGFuZCBiaXR0cmV4IGRhdGEgaW4gSlNPTiBmb3JtYXQgYW5kIGNvbXBhcmVzIGFsbCBvdmVybGFwaW5nIG1hcmtldHMgZm9yIGFyYml0cmFnZS5cbiAgKiAgICAgICBFeHBvcnRlZCBmdW5jdGlvbiBjYWxsZWQgYnkgdGhlIG1haW4gYXBwLmpzXG4gICovXG5mdW5jdGlvbiBjb21wYXJlQWxsUG9sb25pZXhCaXR0cmV4KHBvbG9KU09OLCBiaXR0cmV4SlNPTikge1xuXG4gIGxldCByZXBvcnRpbmdUaW1lc3RhbXAgPSBuZXcgRGF0ZSgpO1xuICBsZXQgcG9sb1RpbWVzdGFtcCA9IHBvbG9KU09OLnRpbWVTdGFtcDtcbiAgbGV0IHBvbG9BbGxNYXJrZXRzID0gSlNPTi5wYXJzZShwb2xvSlNPTi5leGNoYW5nZURhdGEpO1xuICBsZXQgYml0dHJleFRpbWVzdGFtcCA9IGJpdHRyZXhKU09OLnRpbWVTdGFtcDtcbiAgY29uc29sZS5sb2cocG9sb1RpbWVzdGFtcCk7XG4gIGNvbnNvbGUubG9nKGJpdHRyZXhUaW1lc3RhbXApO1xuICBmb3IobGV0IGJpdHRyZXhNa3QgaW4gYml0dHJleEpTT04uZXhjaGFuZ2VEYXRhKXtcbiAgICBsZXQgcG9sb01rdE5hbWUgPSBwb2xvTWt0RnJvbUJpdHRyZXhOYW1lKGJpdHRyZXhNa3QpO1xuICAgIGxldCBwb2xvTWt0RWxlbWVudCA9IHBvbG9BbGxNYXJrZXRzW3BvbG9Na3ROYW1lXTtcbiAgICBpZighcG9sb01rdEVsZW1lbnQpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiUG9sbyBtYXJrZXQgZm9yIFwiLCBiaXR0cmV4TWt0LCBcIiBkb2Vzbid0IGV4aXN0LlwiKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjb21wYXJlUG9sb25pZXhCaXR0cmV4TWt0RWxlbWVudChwb2xvTWt0RWxlbWVudCwgYml0dHJleEpTT04uZXhjaGFuZ2VEYXRhW2JpdHRyZXhNa3RdLCBwb2xvTWt0TmFtZSwgcmVwb3J0aW5nVGltZXN0YW1wKVxuICAgIH1cbiAgfVxufVxuXG4vKiBjb21wYXJlUG9sb25pZXhCaXR0cmV4TWt0RWxlbWVudFxuICogZGVzYzogQ29tcGFyZXMgYSBwYXJ0aWN1bGFyIG1hcmtldCBiZXR3ZWVuIHRoZSBQb2xvbmlleCBhbmQgQml0dHJleCBleGNoYW5nZXMuICBTZWRuIG5vdGlmaWNhdGlvbnMgd2hlblxuICogICAgICAgc2lnbmlmaWNhbnQgYXJiaXRyYWdlIG9wcG9ydHVuaXRpZXMgZXhpc3QuXG4gKi9cbmZ1bmN0aW9uIGNvbXBhcmVQb2xvbmlleEJpdHRyZXhNa3RFbGVtZW50KHBvbG9KU09OLCBiaXR0cmV4SlNPTiwgcG9sb1BhaXIsIHRpbWVTdGFtcCkge1xuXG4gIGxldCBwb2xvQnV5QXQgPSArcG9sb0pTT04ubG93ZXN0QXNrO1xuICBsZXQgcG9sb1NlbGxBdCA9ICtwb2xvSlNPTi5oaWdoZXN0QmlkO1xuICBsZXQgYml0dHJleFNlbGxBdCA9ICtiaXR0cmV4SlNPTi5CaWQ7XG4gIGxldCBiaXR0cmV4QnV5QXQgPSArYml0dHJleEpTT04uQXNrO1xuICBvdXRwdXRBcmJSZXN1bHRzKHBvbG9CdXlBdCwgcG9sb1NlbGxBdCwgYml0dHJleFNlbGxBdCwgYml0dHJleEJ1eUF0LCBcIkJpdHRyZXhcIiwgcG9sb1BhaXIsIHRpbWVTdGFtcCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIG91dHB1dEFyYlJlc3VsdHMocG9sb0J1eUF0LCBwb2xvU2VsbEF0LCBleGNoYW5nZTJTZWxsQXQsIGV4Y2hhbmdlMkJ1eUF0LCBleGNoYW5nZTJOYW1lLCBwb2xvUGFpciwgdGltZVN0YW1wKSB7XG5cbiAgbGV0IGRiT3V0cHV0ID0ge1xuICAgIGtleTogXCJcIixcbiAgICBleGNoMU5hbWU6IFwiUG9sb25pZXhcIixcbiAgICBleGNoMk5hbWU6IGV4Y2hhbmdlMk5hbWUsXG4gICAgdGltZVN0YW1wOiB0aW1lU3RhbXAudG9TdHJpbmcoKS5zbGljZSgwLDI1KSxcbiAgICBjY3lQYWlyOiBwb2xvUGFpcixcbiAgICBleGNoMUJ1eUF0OiBwb2xvQnV5QXQsXG4gICAgZXhjaDFTZWxsQXQ6IHBvbG9TZWxsQXQsXG4gICAgZXhjaDJCdXlBdDogZXhjaGFuZ2UyQnV5QXQsXG4gICAgZXhjaDJTZWxsQXQ6IGV4Y2hhbmdlMlNlbGxBdCxcbiAgICBnYWluTG9zczogXCJMT1NTXCIsXG4gICAgdXJnZW50VHJhZGU6IGZhbHNlLFxuICAgIGFyYlBlcmNlbnQ6IDAsXG4gICAgZXhjaDFCdXlPclNlbGw6IFwiXCIsXG4gICAgdHJhZGVJbnN0cnVjdGlvbnM6IFwiXCIsXG4gIH07XG4gLy8gQ2hlY2sgZm9yIGNhc2Ugb2YgQnV5IGF0IEV4Y2hhbmdlMiBhbmQgU2VsbCBhdCBFeGNoYW5nZTEgKFBvbG8pXG4gIGxldCBhcmJPcHBvcnR1bml0eSA9IHBvbG9TZWxsQXQtZXhjaGFuZ2UyQnV5QXQ7XG4gIGxldCBhcmJQZXJjZW50ID0gMTAwKihwb2xvU2VsbEF0LWV4Y2hhbmdlMkJ1eUF0KS8oIChwb2xvU2VsbEF0K2V4Y2hhbmdlMkJ1eUF0KSAvIDIpO1xuICBkYk91dHB1dC5hcmJQZXJjZW50ID0gYXJiUGVyY2VudDtcbiAgZGJPdXRwdXQuZXhjaDFCdXlPclNlbGwgPSBcIlNlbGxcIjtcbiAgaWYoYXJiUGVyY2VudCA+IGFyYlJlcG9ydGluZ1RocmVzaG9sZFBlcmNlbnQpIHtcbiAgICBkYk91dHB1dC5nYWluTG9zcyA9IFwiR0FJTlwiO1xuICAgIGRiT3V0cHV0LnRyYWRlSW5zdHJ1Y3Rpb25zID0gYCR7cG9sb1BhaXJ9IEJVWSBhdCAke2V4Y2hhbmdlMk5hbWV9IGZvciAke2V4Y2hhbmdlMkJ1eUF0LnRvRml4ZWQoOSl9LiBTRUxMIGF0IFBvbG8gZm9yICR7cG9sb1NlbGxBdC50b0ZpeGVkKDkpfSBHYWluICR7YXJiUGVyY2VudC50b0ZpeGVkKDYpfSVgO1xuICAgIGNvbnNvbGUubG9nKGRiT3V0cHV0LmdhaW5Mb3NzLCBcIjogXCIsIGRiT3V0cHV0LnRyYWRlSW5zdHJ1Y3Rpb25zKTtcbiAgICBpZiAoYXJiUGVyY2VudCA+IGFyYkVtYWlsVGhyZXNob2xkUGVyY2VudCkge1xuICAgICAgZGJPdXRwdXQudXJnZW50VHJhZGUgPSB0cnVlO1xuICAgICAgU2VuZE1lc3NhZ2UoYCR7cG9sb1BhaXJ9OiBCVVkgYXQgJHtleGNoYW5nZTJOYW1lfSBhbmQgU0VMTCBhdCBQb2xvbmlleGAsIGRiT3V0cHV0LnRyYWRlSW5zdHJ1Y3Rpb25zKTtcbiAgICB9XG4gIH1cbiAgZWxzZSB7IFxuICAgIGRiT3V0cHV0LmdhaW5Mb3NzID0gXCJMT1NTXCI7XG4gICAgZGJPdXRwdXQudXJnZW50VHJhZGUgPSBmYWxzZTtcbiAgICBkYk91dHB1dC50cmFkZUluc3RydWN0aW9ucyA9IGAke3BvbG9QYWlyfSBCVVkgYXQgJHtleGNoYW5nZTJOYW1lfSBmb3IgJHtleGNoYW5nZTJCdXlBdC50b0ZpeGVkKDkpfS4gU0VMTCBhdCBQb2xvIGZvciAke3BvbG9TZWxsQXQudG9GaXhlZCg5KX0gTG9zcyAke2FyYlBlcmNlbnQudG9GaXhlZCg2KX0lYDtcbiAgICBpZiAocmVwb3J0TG9zZXMpIHtcbiAgICAgIGNvbnNvbGUubG9nKGAke2Zvcm1hdFRpbWVzdGFtcCh0aW1lU3RhbXApfTogUGFpcjogJHtwb2xvUGFpcn0sIFJlc3VsdDogTE9TUywgRGVzYzogJHtleGNoYW5nZTJOYW1lfSwgJHtleGNoYW5nZTJCdXlBdC50b0ZpeGVkKDgpfSBpcyBncmVhdGVyIHRoYW4gcG9sb1NlbGxBdCwgJHtwb2xvU2VsbEF0LnRvRml4ZWQoOCl9LCBESUZGLCAke2FyYk9wcG9ydHVuaXR5LnRvRml4ZWQoNil9YCk7XG4gICAgfVxuICB9XG4gIGxldCBrZXlTdHIgPSBcIkJ1eVwiK2V4Y2hhbmdlMk5hbWUrXCJTZWxsUG9sb25pZXhcIitwb2xvUGFpcjtcbiAgbGV0IGtleSA9IHtcbiAgICBcImtleVwiOiBrZXlTdHJcbiAgfTtcbiAgZGJPdXRwdXQua2V5ID0ga2V5U3RyO1xuICBpZiAoZGJXcml0ZUVuYWJsZWQpIHtcbiAgICBhd2FpdCB1cGRhdGVSZXN1bHRzSW5Nb25nbyhrZXksIGRiT3V0cHV0LCBcImNyeXB0b1wiLCBcIm1hcmtldGRhdGEuYXJibW9uXCIpO1xuICB9XG4gIC8vIENoZWNrIGZvciBjYXNlIG9mIEJ1eSBhdCBFeGNoYW5nZTEoUG9sbykgYW5kIFNlbGwgYXQgRXhjaGFuZ2UyXG4gIGFyYk9wcG9ydHVuaXR5ID0gZXhjaGFuZ2UyU2VsbEF0LXBvbG9CdXlBdDtcbiAgYXJiUGVyY2VudCA9IDEwMCooZXhjaGFuZ2UyU2VsbEF0LXBvbG9CdXlBdCkvKCAoZXhjaGFuZ2UyU2VsbEF0K3BvbG9CdXlBdCkgLyAyKTtcbiAgZGJPdXRwdXQuYXJiUGVyY2VudCA9IGFyYlBlcmNlbnQ7XG4gIGRiT3V0cHV0LmV4Y2gxQnV5T3JTZWxsID0gXCJCdXlcIjtcbiAgaWYoZGJPdXRwdXQubWF4UHJvZml0IDwgYXJiUGVyY2VudClcbiAgICBkYk91dHB1dC5tYXhQcm9maXQgPSBhcmJQZXJjZW50O1xuICBpZihhcmJQZXJjZW50ID4gYXJiUmVwb3J0aW5nVGhyZXNob2xkUGVyY2VudCkgeyAgICBcbiAgICBkYk91dHB1dC5nYWluTG9zcyA9IFwiR0FJTlwiO1xuICAgIGRiT3V0cHV0LnRyYWRlSW5zdHJ1Y3Rpb25zID0gYCR7cG9sb1BhaXJ9IEJVWSBhdCBQb2xvIGZvciAke3BvbG9CdXlBdC50b0ZpeGVkKDkpfS4gU0VMTCAke2V4Y2hhbmdlMk5hbWV9IGZvciAke2V4Y2hhbmdlMlNlbGxBdC50b0ZpeGVkKDkpfSBHYWluICR7YXJiUGVyY2VudC50b0ZpeGVkKDYpfSVgO1xuICAgIGNvbnNvbGUubG9nKGRiT3V0cHV0LmdhaW5Mb3NzLCBcIjogXCIsIGRiT3V0cHV0LnRyYWRlSW5zdHJ1Y3Rpb25zKTtcbiAgICBpZiAoYXJiUGVyY2VudCA+IGFyYkVtYWlsVGhyZXNob2xkUGVyY2VudCkge1xuICAgICAgZGJPdXRwdXQudXJnZW50VHJhZGUgPSB0cnVlO1xuICAgICAgU2VuZE1lc3NhZ2UoYCR7cG9sb1BhaXJ9OiBCVVkgYXQgUG9sb25pZXggYW5kIFNFTEwgYXQgJHtleGNoYW5nZTJOYW1lfWAsIGRiT3V0cHV0LnRyYWRlSW5zdHJ1Y3Rpb25zKTtcbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgZGJPdXRwdXQuZ2Fpbkxvc3MgPSBcIkxPU1NcIjtcbiAgICBkYk91dHB1dC51cmdlbnRUcmFkZSA9IGZhbHNlO1xuICAgIGRiT3V0cHV0LnRyYWRlSW5zdHJ1Y3Rpb25zID0gYCR7cG9sb1BhaXJ9IEJVWSBhdCBQb2xvIGZvciAke3BvbG9CdXlBdC50b0ZpeGVkKDkpfSBTRUxMICR7ZXhjaGFuZ2UyTmFtZX0gZm9yICR7ZXhjaGFuZ2UyU2VsbEF0LnRvRml4ZWQoOSl9IExvc3MgJHthcmJQZXJjZW50LnRvRml4ZWQoNil9JWA7XG4gICAgaWYgKHJlcG9ydExvc2VzKSB7XG4gICAgICBjb25zb2xlLmxvZyhgJHtmb3JtYXRUaW1lc3RhbXAodGltZVN0YW1wKX06IFBhaXI6ICR7cG9sb1BhaXJ9LCBSZXN1bHQ6IExPU1MsIERlc2M6IHBvbG9CdXlBdCwgJHtwb2xvQnV5QXQudG9GaXhlZCg5KX0gaXMgZ3JlYXRlciB0aGFuICR7ZXhjaGFuZ2UyTmFtZX1TZWxsQXQsICR7ZXhjaGFuZ2UyU2VsbEF0LnRvRml4ZWQoOCl9LiBESUZGLCAke2FyYk9wcG9ydHVuaXR5LnRvRml4ZWQoNyl9YCk7XG4gICAgfVxuICB9XG4gIGtleVN0ciA9IFwiQnV5UG9sb25pZXhTZWxsXCIrZXhjaGFuZ2UyTmFtZStwb2xvUGFpcjtcbiAga2V5ID0ge1xuICAgIFwia2V5XCI6IGtleVN0clxuICB9O1xuICBkYk91dHB1dC5rZXkgPSBrZXlTdHI7XG4gIGlmIChkYldyaXRlRW5hYmxlZCkge1xuICAgIGF3YWl0IHVwZGF0ZVJlc3VsdHNJbk1vbmdvKGtleSwgZGJPdXRwdXQsIFwiY3J5cHRvXCIsIFwibWFya2V0ZGF0YS5hcmJtb25cIik7XG4gIH1cbn1cblxuLyogcG9sb01rdEZyb21CaXR0cmV4TmFtZVxuICogZGVzYzogQ29udmVydHMgYSBCaXR0cmV4IGNyeXB0byBjdXJyZW5jeSBwYWlyIGludG8gdGhlIFBvbG9uaWV4IHBhaXIuXG4gKi9cbmZ1bmN0aW9uIHBvbG9Na3RGcm9tQml0dHJleE5hbWUoYml0dHJleE1rdE5hbWUpIHtcbiAgaWYoYml0dHJleE1rdE5hbWU9PT1cIkJUQy1YTE1cIilcbiAgICByZXR1cm4oXCJCVENfU1RSXCIpO1xuICBpZihiaXR0cmV4TWt0TmFtZT09PVwiVVNEVC1YTE1cIilcbiAgICByZXR1cm4oXCJVU0RUX1NUUlwiKTsgICAgXG4gIHJldHVybihiaXR0cmV4TWt0TmFtZS5yZXBsYWNlKFwiLVwiLCBcIl9cIikpO1xufVxuXG4vKiBjb21wYXJlQWxsUG9sb25pZXhIaXRidGNcbiogIGRlc2M6IFRha2VzIHRoZSBwb2xvbmlleCBhbmQgaGl0YnRjIGRhdGEgaW4gSlNPTiBmb3JtYXQgYW5kIGNvbXBhcmVzIGFsbCBvdmVybGFwaW5nIG1hcmtldHMgZm9yIGFyYml0cmFnZS5cbiogICAgICAgRXhwb3J0ZWQgZnVuY3Rpb24gY2FsbGVkIGJ5IHRoZSBtYWluIGFwcC5qc1xuKi9cbmZ1bmN0aW9uIGNvbXBhcmVBbGxQb2xvbmlleEhpdGJ0Yyhwb2xvSlNPTiwgaGl0YnRjSlNPTikge1xuICBcbiAgbGV0IHJlcG9ydGluZ1RpbWVzdGFtcCA9IG5ldyBEYXRlKCk7XG4gIGxldCBwb2xvVGltZXN0YW1wID0gcG9sb0pTT04udGltZVN0YW1wO1xuICBsZXQgcG9sb0FsbE1hcmtldHMgPSBKU09OLnBhcnNlKHBvbG9KU09OLmV4Y2hhbmdlRGF0YSk7XG4gIGxldCBoaXRidGNUaW1lc3RhbXAgPSBoaXRidGNKU09OLnRpbWVTdGFtcDtcbiAgY29uc29sZS5sb2cocG9sb1RpbWVzdGFtcCk7XG4gIGNvbnNvbGUubG9nKGhpdGJ0Y1RpbWVzdGFtcCk7XG4gIGZvcihsZXQgaGl0YnRjTWt0IGluIGhpdGJ0Y0pTT04uZXhjaGFuZ2VEYXRhKXtcbiAgICBsZXQgcG9sb01rdE5hbWUgPSBwb2xvTWt0RnJvbUhpdGJ0Y05hbWUoaGl0YnRjTWt0KTtcbiAgICBsZXQgcG9sb01rdEVsZW1lbnQgPSBwb2xvQWxsTWFya2V0c1twb2xvTWt0TmFtZV07XG4gICAgY29tcGFyZVBvbG9uaWV4SGl0YnRjTWt0RWxlbWVudChwb2xvTWt0RWxlbWVudCwgaGl0YnRjSlNPTi5leGNoYW5nZURhdGFbaGl0YnRjTWt0XSwgcG9sb01rdE5hbWUsIHJlcG9ydGluZ1RpbWVzdGFtcCk7XG4gIH1cbn1cblxuLyogY29tcGFyZVBvbG9uaWV4SGl0YnRjTWt0RWxlbWVudFxuICogZGVzYzogUHVsbHMgb3V0IHRoZSBidXkgYW5kIHNlbGwgcHJpY2VzIGZvciBhIHNpbmdsZSBjdXJyZW5jeSBwYWlyIGZvciBQb2xvbmlleCBhbmQgSGl0YnRjLlxuICogICAgICAgRm9yd2FyZHMgdGhpcyB0byB0aGUgb3V0cHV0IG1ldGhvZCB0byByZWNvcmQgdGhlIGFyYml0cmFnZSByZXN1bHRzLlxuICovXG5mdW5jdGlvbiBjb21wYXJlUG9sb25pZXhIaXRidGNNa3RFbGVtZW50KHBvbG9Na3RFbGVtZW50LCBoaXRidGNNa3RFbGVtZW50LCBwb2xvTWt0TmFtZSwgcmVwb3J0aW5nVGltZXN0YW1wKSB7XG5cbiAgbGV0IHBvbG9CdXlBdCA9ICtwb2xvTWt0RWxlbWVudC5sb3dlc3RBc2s7XG4gIGxldCBwb2xvU2VsbEF0ID0gK3BvbG9Na3RFbGVtZW50LmhpZ2hlc3RCaWQ7XG4gIGxldCBoaXRidGNTZWxsQXQgPSAraGl0YnRjTWt0RWxlbWVudC5iaWQ7XG4gIGxldCBoaXRidGNCdXlBdCA9ICtoaXRidGNNa3RFbGVtZW50LmFzaztcbiAgb3V0cHV0QXJiUmVzdWx0cyhwb2xvQnV5QXQsIHBvbG9TZWxsQXQsIGhpdGJ0Y1NlbGxBdCwgaGl0YnRjQnV5QXQsIFwiSGl0YnRjXCIsIHBvbG9Na3ROYW1lLCByZXBvcnRpbmdUaW1lc3RhbXApO1xufVxuXG4vKiBwb2xvTWt0RnJvbUhpdGJ0Y05hbWVcbiAqIGRlc2M6IE1hcHMgZnJvbSBIaXRidGMgdGlja2VycyB0byBQb2xvbmlleCB0aWNrZXJzLlxuICovXG5mdW5jdGlvbiBwb2xvTWt0RnJvbUhpdGJ0Y05hbWUoaGl0YnRjTWt0TmFtZSkge1xuXG4gIGNvbnN0IHBvbG9Na3ROYW1lcyA9IHtcbiAgICBCQ05CVEM6ICAgXCJCVENfQkNOXCIsXG4gICAgQk5UVVNEVDogIFwiVVNEVF9CTlRcIixcbiAgICBEQVNIQlRDOiAgXCJCVENfREFTSFwiLFxuICAgIERBU0hVU0RUOiBcIlVTRFRfREFTSFwiLFxuICAgIERPR0VCVEM6ICBcIkJUQ19ET0dFXCIsXG4gICAgRE9HRVVTRFQ6IFwiVVNEVF9ET0dFXCIsXG4gICAgREdCQlRDOiAgIFwiQlRDX0RHQlwiLFxuICAgIEVPU0JUQzogICBcIkJUQ19FT1NcIixcbiAgICBFT1NVU0RUOiAgXCJVU0RUX0VPU1wiLFxuICAgIEVUQ1VTRFQ6ICBcIlVTRFRfRVRDXCIsXG4gICAgRVRIVVNEVDogIFwiVVNEVF9FVEhcIixcbiAgICBMU0tCVEM6ICAgXCJCVENfTFNLXCIsXG4gICAgTUFJREJUQzogIFwiQlRDX01BSURcIixcbiAgICBNQU5BQlRDOiAgXCJCVENfTUFOQVwiLFxuICAgIE9NR0JUQzogICBcIkJUQ19PTUdcIixcbiAgICBQUENCVEM6ICAgXCJCVENfUFBDXCIsXG4gICAgUVRVTUJUQzogIFwiQlRDX1FUVU1cIixcbiAgICBSRVBCVEM6ICAgXCJCVENfUkVQXCIsXG4gICAgUkVQVVNEVDogIFwiVVNEVF9SRVBcIixcbiAgICBYRU1CVEM6ICAgXCJCVENfWEVNXCIsXG4gICAgRVRIQlRDOiAgIFwiQlRDX0VUSFwiLFxuICAgIFpFQ0VUSDogICBcIkVUSF9aRUNcIlxuICB9O1xuICByZXR1cm4ocG9sb01rdE5hbWVzW2hpdGJ0Y01rdE5hbWVdKTtcbn1cblxuLyogY29tcGFyZUFsbFBvbG9uaWV4WW9iaXRcbiAqIGRlc2M6IENvbXBhcmVzIG1hcmtldCBkYXRhIGFjcm9zcyBtYW55IGN1cnJlbmN5IHBhaXJzIGJldHdlZW4gUG9sb25pZXggYW5kIFlvYml0LlxuICogICAgICAgTm90ZSB0aGF0IFlvYml0IG9mdGVucyBoYXMgbGFyZ2UgcHJjaWUgZGlzY3JlcGVuY2llcyBidXQgdGhlIHdhbGxldHMgZm9yIHRob3MgY29pbnNcbiAqICAgICAgIGFyZSBkZWFjdGl2YXRlZC4gIFNvIHlvdSBjYW4ndCBnZW5lcmF0ZSBhIHByb2ZpdC5cbiAqL1xuZnVuY3Rpb24gY29tcGFyZUFsbFBvbG9uaWV4WW9iaXQocG9sb0RhdGEsIHlvYml0RGF0YSkge1xuXG4gIGxldCByZXBvcnRpbmdUaW1lc3RhbXAgPSBuZXcgRGF0ZSgpO1xuICBsZXQgcG9sb1RpbWVzdGFtcCA9IHBvbG9EYXRhLnRpbWVTdGFtcDtcbiAgbGV0IHBvbG9BbGxNYXJrZXRzID0gSlNPTi5wYXJzZShwb2xvRGF0YS5leGNoYW5nZURhdGEpO1xuICBsZXQgeW9iaXRUaW1lc3RhbXAgPSB5b2JpdERhdGEudGltZVN0YW1wO1xuICBsZXQgeW9iaXRBbGxNYXJrZXRzID0gSlNPTi5wYXJzZSh5b2JpdERhdGEuZXhjaGFuZ2VEYXRhKTtcbiAgY29uc29sZS5sb2cocG9sb1RpbWVzdGFtcCk7XG4gIGNvbnNvbGUubG9nKHlvYml0VGltZXN0YW1wKTtcbiAgZm9yKGxldCB5b2JpdE1rdCBpbiB5b2JpdEFsbE1hcmtldHMpe1xuICAgIGNvbnNvbGUubG9nKFwieW9iaXRNa3Q6XCIsIHlvYml0TWt0LCBcIiBkYXRhOlwiLCB5b2JpdEFsbE1hcmtldHNbeW9iaXRNa3RdKTtcbiAgICBsZXQgcG9sb01rdE5hbWUgPSBwb2xvTWt0RnJvbVlvYml0TmFtZSh5b2JpdE1rdCk7XG4gICAgY29uc29sZS5sb2coXCJQb2xvTWFya2V0OlwiLCBwb2xvTWt0TmFtZSwgXCIgZGF0YTpcIiwgcG9sb0FsbE1hcmtldHNbcG9sb01rdE5hbWVdKTtcbiAgICBjb21wYXJlUG9sb25pZXhZb2JpdE1rdEVsZW1lbnQocG9sb0FsbE1hcmtldHNbcG9sb01rdE5hbWVdLCB5b2JpdEFsbE1hcmtldHNbeW9iaXRNa3RdLCBwb2xvTWt0TmFtZSwgcmVwb3J0aW5nVGltZXN0YW1wKTtcbiAgfVxufVxuXG4vKiBjb21wYXJlUG9sb25pZXhZb2JpdE1rdEVsZW1lbnRcbiAqIGRlc2M6IFB1bGxzIG91dCB0aGUgYnV5IGFuZCBzZWxsIHByaWNlcyBmb3IgYSBzaW5nbGUgY3VycmVuY3kgcGFpciBmb3IgUG9sb25pZXggYW5kIFlvYml0LlxuICogICAgICAgRm9yd2FyZHMgdGhpcyB0byB0aGUgb3V0cHV0IG1ldGhvZCB0byByZWNvcmQgdGhlIGFyYml0cmFnZSByZXN1bHRzLlxuICovXG5mdW5jdGlvbiBjb21wYXJlUG9sb25pZXhZb2JpdE1rdEVsZW1lbnQocG9sb01rdEVsZW1lbnQsIHlvYml0TWt0RWxlbWVudCwgcG9sb01rdE5hbWUsIHJlcG9ydGluZ1RpbWVzdGFtcCkge1xuXG4gIGxldCBwb2xvQnV5QXQgPSArcG9sb01rdEVsZW1lbnQubG93ZXN0QXNrO1xuICBsZXQgcG9sb1NlbGxBdCA9ICtwb2xvTWt0RWxlbWVudC5oaWdoZXN0QmlkO1xuICBsZXQgeW9iaXRTZWxsQXQgPSAreW9iaXRNa3RFbGVtZW50LnNlbGw7XG4gIGxldCB5b2JpdEJ1eUF0ID0gK3lvYml0TWt0RWxlbWVudC5idXk7XG4gIG91dHB1dEFyYlJlc3VsdHMocG9sb0J1eUF0LCBwb2xvU2VsbEF0LCB5b2JpdFNlbGxBdCwgeW9iaXRCdXlBdCwgXCJZb2JpdFwiLCBwb2xvTWt0TmFtZSwgcmVwb3J0aW5nVGltZXN0YW1wKTtcbn1cblxuLyogcG9sb01rdEZyb21Zb2JpdE5hbWVcbiAqIGRlc2M6IE1hcHMgZnJvbSBZb2JpdCB0aWNrZXJzIHRvIFBvbG9uaWV4IHRpY2tlcnMuXG4gKi9cbmZ1bmN0aW9uIHBvbG9Na3RGcm9tWW9iaXROYW1lKHlvYml0TWt0TmFtZSkge1xuXG4gIGNvbnN0IHBvbG9Na3ROYW1lcyA9IHtcbiAgICBsdGNfYnRjOiAgXCJCVENfTFRDXCIsXG4gICAgbm1jX2J0YzogIFwiQlRDX05NQ1wiLFxuICAgIG5tcl9idGM6ICBcIkJUQ19OTVJcIixcbiAgICBldGhfYnRjOiAgXCJCVENfRVRIXCJcbiAgfTtcbiAgcmV0dXJuKHBvbG9Na3ROYW1lc1t5b2JpdE1rdE5hbWVdKTtcbn1cblxuZXhwb3J0IHtjb21wYXJlUG9sb25pZXhDb2luYmFzZSwgY29tcGFyZUFsbFBvbG9uaWV4Qml0dHJleCwgY29tcGFyZUFsbFBvbG9uaWV4SGl0YnRjLCBjb21wYXJlQWxsUG9sb25pZXhZb2JpdH07XG4iXX0=