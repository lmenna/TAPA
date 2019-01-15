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
  var poloPair = ccy1 + "_" + ccy2; // let poloBuyAt = +poloJSON[poloPair].lowestAsk;
  // let cbSellAt = +cbJSON.bids[0][0];
  // let arbOpportunity = cbSellAt-poloBuyAt;

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
    var dbOutput, arbOpportunity, arbPercent, msg, msgBody, keyStr, key, _msg, _msgBody;

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
              msg = "".concat(formatTimestamp(timeStamp), ": Pair: ").concat(poloPair, ", Result: GAIN, Desc: ").concat(poloPair, ". BUY at ").concat(exchange2Name, ": ").concat(exchange2BuyAt.toFixed(8), " SELL Polo at, ").concat(poloSellAt.toFixed(8), ", Gain, ").concat(arbOpportunity.toFixed(7), ", ").concat(arbPercent.toFixed(6), "%");
              console.log(msg);
              dbOutput.gainLoss = "GAIN";
              dbOutput.tradeInstructions = "No trade. ".concat(poloPair, " BUY at ").concat(exchange2Name, " for ").concat(exchange2BuyAt.toFixed(8), ".  SELL at Polo for ").concat(poloSellAt.toFixed(8), " small gain ").concat(arbPercent.toFixed(6), "%");

              if (arbPercent > arbEmailThresholdPercent) {
                msgBody = "".concat(poloPair, " BUY at ").concat(exchange2Name, " for ").concat(exchange2BuyAt.toFixed(8), ". SELL at Polo for ").concat(poloSellAt.toFixed(8), ", Gain: ").concat(arbPercent.toFixed(6), "%");
                dbOutput.tradeInstructions = "TRADE NOW. ".concat(poloPair, " BUY at ").concat(exchange2Name, " for ").concat(exchange2BuyAt.toFixed(8), ". SELL at Polo for ").concat(poloSellAt.toFixed(8), ", Gain: ").concat(arbPercent.toFixed(6), "%");
                dbOutput.urgentTrade = true;
                (0, _sendEMail.SendMessage)("".concat(poloPair, ": BUY at ").concat(exchange2Name, " and SELL at Poloniex"), msgBody);
              }
            } else {
              dbOutput.gainLoss = "LOSS";
              dbOutput.urgentTrade = false;
              dbOutput.tradeInstructions = "No trade. ".concat(poloPair, ", BUY at ").concat(exchange2Name, " for ").concat(exchange2BuyAt.toFixed(8), ".  SELL at Polo for ").concat(poloSellAt.toFixed(8), " results in a loss of ").concat(arbPercent.toFixed(6), "%");

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
            dbOutput.exch1BuyOrSell = "Sell";
            if (dbOutput.maxProfit < arbPercent) dbOutput.maxProfit = arbPercent;

            if (arbPercent > arbReportingThresholdPercent) {
              _msg = "".concat(formatTimestamp(timeStamp), ": Pair: ").concat(poloPair, ", Result: GAIN, Desc: ").concat(poloPair, ". BUY at Polo for ").concat(poloBuyAt.toFixed(8), " SELL ").concat(exchange2Name, " at, ").concat(exchange2SellAt.toFixed(8), ", Gain, ").concat(arbOpportunity.toFixed(7), ", ").concat(arbPercent.toFixed(6), "%");
              console.log(_msg);
              dbOutput.gainLoss = "GAIN";
              dbOutput.tradeInstructions = "No trade. ".concat(poloPair, " BUY at Polo for ").concat(poloBuyAt.toFixed(8), ". SELL at ").concat(exchange2Name, " for ").concat(exchange2SellAt.toFixed(8), " small gain ").concat(arbPercent.toFixed(6), "%");

              if (arbPercent > arbEmailThresholdPercent) {
                _msgBody = "".concat(poloPair, " BUY at Polo for ").concat(poloBuyAt.toFixed(8), ".  SELL at ").concat(exchange2Name, " for ").concat(exchange2SellAt.toFixed(8), ", Gain: ").concat(arbPercent.toFixed(6), "%");
                dbOutput.tradeInstructions = "TRADE NOW. ".concat(poloPair, " BUY at Polo for ").concat(poloBuyAt.toFixed(8), ". SELL ").concat(exchange2Name, " for ").concat(exchange2SellAt.toFixed(8), ", Gain: ").concat(arbPercent.toFixed(6), "%");
                dbOutput.urgentTrade = true;
                (0, _sendEMail.SendMessage)("".concat(poloPair, ": BUY at Poloniex and SELL at ").concat(exchange2Name), _msgBody);
              }
            } else {
              dbOutput.gainLoss = "LOSS";
              dbOutput.urgentTrade = false;
              dbOutput.tradeInstructions = "No trade. ".concat(poloPair, ", BUY at Polo for ").concat(poloBuyAt.toFixed(8), " SELL ").concat(exchange2Name, " for ").concat(exchange2SellAt.toFixed(8), " results in a loss of ").concat(arbPercent.toFixed(6), "%");

              if (reportLoses) {
                console.log("".concat(formatTimestamp(timeStamp), ": Pair: ").concat(poloPair, ", Result: LOSS, Desc: poloBuyAt, ").concat(poloBuyAt.toFixed(8), " is greater than ").concat(exchange2Name, "SellAt, ").concat(exchange2SellAt.toFixed(8), ". DIFF, ").concat(arbOpportunity.toFixed(7)));
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

function comparePoloniexHitbtcMktElement(poloMktElement, hitbtcMktElement, poloMktName, reportingTimestamp) {
  var poloBuyAt = +poloMktElement.lowestAsk;
  var poloSellAt = +poloMktElement.highestBid;
  var hitbtcSellAt = +hitbtcMktElement.bid;
  var hitbtcBuyAt = +hitbtcMktElement.ask;
  outputArbResults(poloBuyAt, poloSellAt, hitbtcSellAt, hitbtcBuyAt, "Hitbtc", poloMktName, reportingTimestamp);
}

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

function comparePoloniexYobitMktElement(poloMktElement, yobitMktElement, poloMktName, reportingTimestamp) {
  var poloBuyAt = +poloMktElement.lowestAsk;
  var poloSellAt = +poloMktElement.highestBid;
  var yobitSellAt = +yobitMktElement.sell;
  var yobitBuyAt = +yobitMktElement.buy;
  outputArbResults(poloBuyAt, poloSellAt, yobitSellAt, yobitBuyAt, "Yobit", poloMktName, reportingTimestamp);
}

function poloMktFromYobitName(yobitMktName) {
  var poloMktNames = {
    ltc_btc: "BTC_LTC",
    nmc_btc: "BTC_NMC",
    nmr_btc: "BTC_NMR"
  };
  return poloMktNames[yobitMktName];
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9jb21wYXJlUHJpY2luZ0RhdGEuanMiXSwibmFtZXMiOlsiYXJiRW1haWxUaHJlc2hvbGRQZXJjZW50IiwiYXJiUmVwb3J0aW5nVGhyZXNob2xkUGVyY2VudCIsImRiV3JpdGVFbmFibGVkIiwicmVwb3J0TG9zZXMiLCJmb3JtYXRUaW1lc3RhbXAiLCJ0aW1lU3RhbXAiLCJ0b1N0cmluZyIsInNsaWNlIiwiY29tcGFyZVBvbG9uaWV4Q29pbmJhc2UiLCJwb2xvRGF0YSIsImNiRGF0YSIsImNvaW4iLCJwb2xvSlNPTiIsIkpTT04iLCJwYXJzZSIsImV4Y2hhbmdlRGF0YSIsImNiSlNPTiIsIkRhdGUiLCJjb25zb2xlIiwibG9nIiwiZ2V0VGltZSIsImNvbXBhcmVDdXJyZW5jeVBhaXIiLCJjY3kxIiwiY2N5MiIsInBvbG9QYWlyIiwicG9sb0J1eUF0IiwibG93ZXN0QXNrIiwicG9sb1NlbGxBdCIsImhpZ2hlc3RCaWQiLCJjb2luYmFzZVNlbGxBdCIsImJpZHMiLCJjb2luYmFzZUJ1eUF0IiwiYXNrcyIsIm91dHB1dEFyYlJlc3VsdHMiLCJjb21wYXJlQWxsUG9sb25pZXhCaXR0cmV4IiwiYml0dHJleEpTT04iLCJyZXBvcnRpbmdUaW1lc3RhbXAiLCJwb2xvVGltZXN0YW1wIiwicG9sb0FsbE1hcmtldHMiLCJiaXR0cmV4VGltZXN0YW1wIiwiYml0dHJleE1rdCIsInBvbG9Na3ROYW1lIiwicG9sb01rdEZyb21CaXR0cmV4TmFtZSIsInBvbG9Na3RFbGVtZW50IiwiY29tcGFyZVBvbG9uaWV4Qml0dHJleE1rdEVsZW1lbnQiLCJiaXR0cmV4U2VsbEF0IiwiQmlkIiwiYml0dHJleEJ1eUF0IiwiQXNrIiwiZXhjaGFuZ2UyU2VsbEF0IiwiZXhjaGFuZ2UyQnV5QXQiLCJleGNoYW5nZTJOYW1lIiwiZGJPdXRwdXQiLCJrZXkiLCJleGNoMU5hbWUiLCJleGNoMk5hbWUiLCJjY3lQYWlyIiwiZXhjaDFCdXlBdCIsImV4Y2gxU2VsbEF0IiwiZXhjaDJCdXlBdCIsImV4Y2gyU2VsbEF0IiwiZ2Fpbkxvc3MiLCJ1cmdlbnRUcmFkZSIsImFyYlBlcmNlbnQiLCJleGNoMUJ1eU9yU2VsbCIsInRyYWRlSW5zdHJ1Y3Rpb25zIiwiYXJiT3Bwb3J0dW5pdHkiLCJtc2ciLCJ0b0ZpeGVkIiwibXNnQm9keSIsImtleVN0ciIsIm1heFByb2ZpdCIsImJpdHRyZXhNa3ROYW1lIiwicmVwbGFjZSIsImNvbXBhcmVBbGxQb2xvbmlleEhpdGJ0YyIsImhpdGJ0Y0pTT04iLCJoaXRidGNUaW1lc3RhbXAiLCJoaXRidGNNa3QiLCJwb2xvTWt0RnJvbUhpdGJ0Y05hbWUiLCJjb21wYXJlUG9sb25pZXhIaXRidGNNa3RFbGVtZW50IiwiaGl0YnRjTWt0RWxlbWVudCIsImhpdGJ0Y1NlbGxBdCIsImJpZCIsImhpdGJ0Y0J1eUF0IiwiYXNrIiwiaGl0YnRjTWt0TmFtZSIsInBvbG9Na3ROYW1lcyIsIkJDTkJUQyIsIkJOVFVTRFQiLCJEQVNIQlRDIiwiREFTSFVTRFQiLCJET0dFQlRDIiwiRE9HRVVTRFQiLCJER0JCVEMiLCJFT1NCVEMiLCJFT1NVU0RUIiwiRVRDVVNEVCIsIkVUSFVTRFQiLCJMU0tCVEMiLCJNQUlEQlRDIiwiTUFOQUJUQyIsIk9NR0JUQyIsIlBQQ0JUQyIsIlFUVU1CVEMiLCJSRVBCVEMiLCJSRVBVU0RUIiwiWEVNQlRDIiwiRVRIQlRDIiwiWkVDRVRIIiwiY29tcGFyZUFsbFBvbG9uaWV4WW9iaXQiLCJ5b2JpdERhdGEiLCJ5b2JpdFRpbWVzdGFtcCIsInlvYml0QWxsTWFya2V0cyIsInlvYml0TWt0IiwicG9sb01rdEZyb21Zb2JpdE5hbWUiLCJjb21wYXJlUG9sb25pZXhZb2JpdE1rdEVsZW1lbnQiLCJ5b2JpdE1rdEVsZW1lbnQiLCJ5b2JpdFNlbGxBdCIsInNlbGwiLCJ5b2JpdEJ1eUF0IiwiYnV5IiwieW9iaXRNa3ROYW1lIiwibHRjX2J0YyIsIm5tY19idGMiLCJubXJfYnRjIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBSUE7O0FB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QWtESCxjQUFjLENBQUNHLFdBQUQsQ0FBaEU7QUFDQTBFLElBQUFBLDhCQUE4QixDQUFDN0UsY0FBYyxDQUFDRyxXQUFELENBQWYsRUFBOEJ1RSxlQUFlLENBQUNDLFFBQUQsQ0FBN0MsRUFBeUR4RSxXQUF6RCxFQUFzRUwsa0JBQXRFLENBQTlCO0FBQ0Q7QUFDRjs7QUFFRCxTQUFTK0UsOEJBQVQsQ0FBd0N4RSxjQUF4QyxFQUF3RHlFLGVBQXhELEVBQXlFM0UsV0FBekUsRUFBc0ZMLGtCQUF0RixFQUEwRztBQUV4RyxNQUFJWCxTQUFTLEdBQUcsQ0FBQ2tCLGNBQWMsQ0FBQ2pCLFNBQWhDO0FBQ0EsTUFBSUMsVUFBVSxHQUFHLENBQUNnQixjQUFjLENBQUNmLFVBQWpDO0FBQ0EsTUFBSXlGLFdBQVcsR0FBRyxDQUFDRCxlQUFlLENBQUNFLElBQW5DO0FBQ0EsTUFBSUMsVUFBVSxHQUFHLENBQUNILGVBQWUsQ0FBQ0ksR0FBbEM7QUFDQXZGLEVBQUFBLGdCQUFnQixDQUFDUixTQUFELEVBQVlFLFVBQVosRUFBd0IwRixXQUF4QixFQUFxQ0UsVUFBckMsRUFBaUQsT0FBakQsRUFBMEQ5RSxXQUExRCxFQUF1RUwsa0JBQXZFLENBQWhCO0FBQ0Q7O0FBRUQsU0FBUzhFLG9CQUFULENBQThCTyxZQUE5QixFQUE0QztBQUUxQyxNQUFNbkMsWUFBWSxHQUFHO0FBQ25Cb0MsSUFBQUEsT0FBTyxFQUFHLFNBRFM7QUFFbkJDLElBQUFBLE9BQU8sRUFBRyxTQUZTO0FBR25CQyxJQUFBQSxPQUFPLEVBQUc7QUFIUyxHQUFyQjtBQUtBLFNBQU90QyxZQUFZLENBQUNtQyxZQUFELENBQW5CO0FBQ0QiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBjb21wYXJlUHJpY2luZ0RhdGEuanNcbiAqIENvbnNvbGlkYXRlcyBmdW5jdGlvbiB0byBjb21wYXJlIGNyeXB0byBtYXJrZXRzIGxvb2tpbmcgZm9yIHNpZ25pZmljYW50IGFyYml0cmFnZSBvcHBvcnR1bml0aWVzLlxuICogU2VuZHMgbm90aWZpY2F0aW9ucyB3aGVuIGxhcmdlIGFyYml0cmFnZSBpcyBkZXRlY3RlZC5cbiAqL1xuaW1wb3J0IHtTZW5kTWVzc2FnZX0gZnJvbSBcIi4vc2VuZEVNYWlsXCI7XG5pbXBvcnQge3dyaXRlUmVzdWx0c1RvTW9uZ28sIHVwZGF0ZVJlc3VsdHNJbk1vbmdvfSBmcm9tIFwiLi9kYlV0aWxzXCI7XG5cbi8vIFNldCB0aGlzIHRvIGJlIGEgY2xlYXIgdHJhZGluZyBvcHBvcnR1bml0eVxuY29uc3QgYXJiRW1haWxUaHJlc2hvbGRQZXJjZW50ID0gMS4yNTtcbi8vIFNldCB0aGlzIHRvIGJlIHRoZSBmZWVzIGFzc29jaWF0ZWQgd2l0aCB0cmFkaW5nXG5jb25zdCBhcmJSZXBvcnRpbmdUaHJlc2hvbGRQZXJjZW50ID0gMC4wO1xuLy8gQ29udHJvbCBvdXRwdXQgdG8gREJcbmxldCBkYldyaXRlRW5hYmxlZCA9IHRydWU7XG4vLyBDb250cm9sIHJlcG9ydGVkIG91dHB1dFxubGV0IHJlcG9ydExvc2VzID0gZmFsc2U7XG5cbi8qIGZvcm1hdFRpbWVzdGFtcFxuICogZGVzYzogU2ltcGxlIHV0aWxpdHkgdG8gdHJ1bmNhdGUgdGhlIG91dHB1dCBvZiBsb25nIHRpbWUgc3RhbXBzIHRvIGluY2x1ZGUgb25seSB0aGUgZGF0ZSBhbmQgdGltZSBwYXJ0cy5cbiAqL1xuZnVuY3Rpb24gZm9ybWF0VGltZXN0YW1wKHRpbWVTdGFtcCkge1xuICByZXR1cm4odGltZVN0YW1wLnRvU3RyaW5nKCkuc2xpY2UoMCwyNSkpO1xufVxuXG4vKiBjb21wYXJlUG9sb25pZXhDb2luYmFzZVxuICogZGVzYzogTWFpbiBmdW5jdGlvbiBjYWxsZWQgdG8gY29tcGFyZSB0aGUgUG9sb25pZXggYW5kIENvaW5iYXNlIGNyeXB0byBtYXJrZXRzLlxuICogICAgICAgVGhpcyBmdW5jdGlvbiBpcyBleHBvcnRlZCBhbmQgY2FsbGVkIGJlIGFwcC5qc1xuICovXG5mdW5jdGlvbiBjb21wYXJlUG9sb25pZXhDb2luYmFzZShwb2xvRGF0YSwgY2JEYXRhLCBjb2luKSB7XG5cbiAgdmFyIHBvbG9KU09OID0gSlNPTi5wYXJzZShwb2xvRGF0YS5leGNoYW5nZURhdGEpO1xuICB2YXIgY2JKU09OID0gSlNPTi5wYXJzZShjYkRhdGEuZXhjaGFuZ2VEYXRhKTtcbiAgbGV0IHRpbWVTdGFtcCA9IG5ldyBEYXRlKCk7XG4gIGNvbnNvbGUubG9nKGAke2Zvcm1hdFRpbWVzdGFtcCh0aW1lU3RhbXApfTogUG9sb1RpbWUtQ0JUaW1lOiAke3BvbG9EYXRhLnRpbWVTdGFtcC5nZXRUaW1lKCktY2JEYXRhLnRpbWVTdGFtcC5nZXRUaW1lKCl9LmApO1xuICBjb21wYXJlQ3VycmVuY3lQYWlyKHRpbWVTdGFtcCwgcG9sb0pTT04sIGNiSlNPTiwgXCJVU0RDXCIsIGNvaW4pXG59XG5cbi8qIGNvbXBhcmVDdXJyZW5jeVBhaXJcbiAqIGRlc2M6IENvbXBhcmVzIGEgY3VycmVuY3kgcGFpciBiZXR3ZWVuIFBvbG9uaWV4IGFuZCBDb2luYmFzZS4gIE5vdGlmaWVzIHdoZW4gc2lnbmlmaWNhbnQgYXJiaXRyYWdlIG9wcG9ydHVuaXRpZXNcbiAqICAgICAgIG9jY3VyLlxuICovXG5mdW5jdGlvbiBjb21wYXJlQ3VycmVuY3lQYWlyKHRpbWVTdGFtcCwgcG9sb0pTT04sIGNiSlNPTiwgY2N5MSwgY2N5Mikge1xuICBsZXQgcG9sb1BhaXIgPSBjY3kxK1wiX1wiK2NjeTI7XG4gIC8vIGxldCBwb2xvQnV5QXQgPSArcG9sb0pTT05bcG9sb1BhaXJdLmxvd2VzdEFzaztcbiAgLy8gbGV0IGNiU2VsbEF0ID0gK2NiSlNPTi5iaWRzWzBdWzBdO1xuICAvLyBsZXQgYXJiT3Bwb3J0dW5pdHkgPSBjYlNlbGxBdC1wb2xvQnV5QXQ7XG5cbiAgbGV0IHBvbG9CdXlBdCA9ICtwb2xvSlNPTltwb2xvUGFpcl0ubG93ZXN0QXNrO1xuICBsZXQgcG9sb1NlbGxBdCA9ICtwb2xvSlNPTltwb2xvUGFpcl0uaGlnaGVzdEJpZDtcbiAgbGV0IGNvaW5iYXNlU2VsbEF0ID0gK2NiSlNPTi5iaWRzWzBdWzBdO1xuICBsZXQgY29pbmJhc2VCdXlBdCA9ICtjYkpTT04uYXNrc1swXVswXTtcbiAgb3V0cHV0QXJiUmVzdWx0cyhwb2xvQnV5QXQsIHBvbG9TZWxsQXQsIGNvaW5iYXNlU2VsbEF0LCBjb2luYmFzZUJ1eUF0LCBcIkNvaW5iYXNlXCIsIHBvbG9QYWlyLCB0aW1lU3RhbXApO1xuIH1cblxuIC8qIGNvbXBhcmVBbGxQb2xvbmlleEJpdHRyZXhcbiAgKiBkZXNjOiBUYWtlcyB0aGUgcG9sb25pZXggYW5kIGJpdHRyZXggZGF0YSBpbiBKU09OIGZvcm1hdCBhbmQgY29tcGFyZXMgYWxsIG92ZXJsYXBpbmcgbWFya2V0cyBmb3IgYXJiaXRyYWdlLlxuICAqICAgICAgIEV4cG9ydGVkIGZ1bmN0aW9uIGNhbGxlZCBieSB0aGUgbWFpbiBhcHAuanNcbiAgKi9cbmZ1bmN0aW9uIGNvbXBhcmVBbGxQb2xvbmlleEJpdHRyZXgocG9sb0pTT04sIGJpdHRyZXhKU09OKSB7XG5cbiAgbGV0IHJlcG9ydGluZ1RpbWVzdGFtcCA9IG5ldyBEYXRlKCk7XG4gIGxldCBwb2xvVGltZXN0YW1wID0gcG9sb0pTT04udGltZVN0YW1wO1xuICBsZXQgcG9sb0FsbE1hcmtldHMgPSBKU09OLnBhcnNlKHBvbG9KU09OLmV4Y2hhbmdlRGF0YSk7XG4gIGxldCBiaXR0cmV4VGltZXN0YW1wID0gYml0dHJleEpTT04udGltZVN0YW1wO1xuICBjb25zb2xlLmxvZyhwb2xvVGltZXN0YW1wKTtcbiAgY29uc29sZS5sb2coYml0dHJleFRpbWVzdGFtcCk7XG4gIGZvcihsZXQgYml0dHJleE1rdCBpbiBiaXR0cmV4SlNPTi5leGNoYW5nZURhdGEpe1xuICAgIGxldCBwb2xvTWt0TmFtZSA9IHBvbG9Na3RGcm9tQml0dHJleE5hbWUoYml0dHJleE1rdCk7XG4gICAgbGV0IHBvbG9Na3RFbGVtZW50ID0gcG9sb0FsbE1hcmtldHNbcG9sb01rdE5hbWVdO1xuICAgIGlmKCFwb2xvTWt0RWxlbWVudCkge1xuICAgICAgY29uc29sZS5sb2coXCJQb2xvIG1hcmtldCBmb3IgXCIsIGJpdHRyZXhNa3QsIFwiIGRvZXNuJ3QgZXhpc3QuXCIpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGNvbXBhcmVQb2xvbmlleEJpdHRyZXhNa3RFbGVtZW50KHBvbG9Na3RFbGVtZW50LCBiaXR0cmV4SlNPTi5leGNoYW5nZURhdGFbYml0dHJleE1rdF0sIHBvbG9Na3ROYW1lLCByZXBvcnRpbmdUaW1lc3RhbXApXG4gICAgfVxuICB9XG59XG5cbi8qIGNvbXBhcmVQb2xvbmlleEJpdHRyZXhNa3RFbGVtZW50XG4gKiBkZXNjOiBDb21wYXJlcyBhIHBhcnRpY3VsYXIgbWFya2V0IGJldHdlZW4gdGhlIFBvbG9uaWV4IGFuZCBCaXR0cmV4IGV4Y2hhbmdlcy4gIFNlZG4gbm90aWZpY2F0aW9ucyB3aGVuXG4gKiAgICAgICBzaWduaWZpY2FudCBhcmJpdHJhZ2Ugb3Bwb3J0dW5pdGllcyBleGlzdC5cbiAqL1xuZnVuY3Rpb24gY29tcGFyZVBvbG9uaWV4Qml0dHJleE1rdEVsZW1lbnQocG9sb0pTT04sIGJpdHRyZXhKU09OLCBwb2xvUGFpciwgdGltZVN0YW1wKSB7XG5cbiAgbGV0IHBvbG9CdXlBdCA9ICtwb2xvSlNPTi5sb3dlc3RBc2s7XG4gIGxldCBwb2xvU2VsbEF0ID0gK3BvbG9KU09OLmhpZ2hlc3RCaWQ7XG4gIGxldCBiaXR0cmV4U2VsbEF0ID0gK2JpdHRyZXhKU09OLkJpZDtcbiAgbGV0IGJpdHRyZXhCdXlBdCA9ICtiaXR0cmV4SlNPTi5Bc2s7XG4gIG91dHB1dEFyYlJlc3VsdHMocG9sb0J1eUF0LCBwb2xvU2VsbEF0LCBiaXR0cmV4U2VsbEF0LCBiaXR0cmV4QnV5QXQsIFwiQml0dHJleFwiLCBwb2xvUGFpciwgdGltZVN0YW1wKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gb3V0cHV0QXJiUmVzdWx0cyhwb2xvQnV5QXQsIHBvbG9TZWxsQXQsIGV4Y2hhbmdlMlNlbGxBdCwgZXhjaGFuZ2UyQnV5QXQsIGV4Y2hhbmdlMk5hbWUsIHBvbG9QYWlyLCB0aW1lU3RhbXApIHtcblxuICBsZXQgZGJPdXRwdXQgPSB7XG4gICAga2V5OiBcIlwiLFxuICAgIGV4Y2gxTmFtZTogXCJQb2xvbmlleFwiLFxuICAgIGV4Y2gyTmFtZTogZXhjaGFuZ2UyTmFtZSxcbiAgICB0aW1lU3RhbXA6IHRpbWVTdGFtcC50b1N0cmluZygpLnNsaWNlKDAsMjUpLFxuICAgIGNjeVBhaXI6IHBvbG9QYWlyLFxuICAgIGV4Y2gxQnV5QXQ6IHBvbG9CdXlBdCxcbiAgICBleGNoMVNlbGxBdDogcG9sb1NlbGxBdCxcbiAgICBleGNoMkJ1eUF0OiBleGNoYW5nZTJCdXlBdCxcbiAgICBleGNoMlNlbGxBdDogZXhjaGFuZ2UyU2VsbEF0LFxuICAgIGdhaW5Mb3NzOiBcIkxPU1NcIixcbiAgICB1cmdlbnRUcmFkZTogZmFsc2UsXG4gICAgYXJiUGVyY2VudDogMCxcbiAgICBleGNoMUJ1eU9yU2VsbDogXCJcIixcbiAgICB0cmFkZUluc3RydWN0aW9uczogXCJcIixcbiAgfTtcbiAvLyBDaGVjayBmb3IgY2FzZSBvZiBCdXkgYXQgRXhjaGFuZ2UyIGFuZCBTZWxsIGF0IEV4Y2hhbmdlMSAoUG9sbylcbiBsZXQgYXJiT3Bwb3J0dW5pdHkgPSBwb2xvU2VsbEF0LWV4Y2hhbmdlMkJ1eUF0O1xuICBsZXQgYXJiUGVyY2VudCA9IDEwMCoocG9sb1NlbGxBdC1leGNoYW5nZTJCdXlBdCkvKCAocG9sb1NlbGxBdCtleGNoYW5nZTJCdXlBdCkgLyAyKTtcbiAgZGJPdXRwdXQuYXJiUGVyY2VudCA9IGFyYlBlcmNlbnQ7XG4gIGRiT3V0cHV0LmV4Y2gxQnV5T3JTZWxsID0gXCJTZWxsXCI7XG4gIGlmKGFyYlBlcmNlbnQgPiBhcmJSZXBvcnRpbmdUaHJlc2hvbGRQZXJjZW50KSB7XG4gICAgbGV0IG1zZyA9IGAke2Zvcm1hdFRpbWVzdGFtcCh0aW1lU3RhbXApfTogUGFpcjogJHtwb2xvUGFpcn0sIFJlc3VsdDogR0FJTiwgRGVzYzogJHtwb2xvUGFpcn0uIEJVWSBhdCAke2V4Y2hhbmdlMk5hbWV9OiAke2V4Y2hhbmdlMkJ1eUF0LnRvRml4ZWQoOCl9IFNFTEwgUG9sbyBhdCwgJHtwb2xvU2VsbEF0LnRvRml4ZWQoOCl9LCBHYWluLCAke2FyYk9wcG9ydHVuaXR5LnRvRml4ZWQoNyl9LCAke2FyYlBlcmNlbnQudG9GaXhlZCg2KX0lYDtcbiAgICBjb25zb2xlLmxvZyhtc2cpO1xuICAgIGRiT3V0cHV0LmdhaW5Mb3NzID0gXCJHQUlOXCI7XG4gICAgZGJPdXRwdXQudHJhZGVJbnN0cnVjdGlvbnMgPSBgTm8gdHJhZGUuICR7cG9sb1BhaXJ9IEJVWSBhdCAke2V4Y2hhbmdlMk5hbWV9IGZvciAke2V4Y2hhbmdlMkJ1eUF0LnRvRml4ZWQoOCl9LiAgU0VMTCBhdCBQb2xvIGZvciAke3BvbG9TZWxsQXQudG9GaXhlZCg4KX0gc21hbGwgZ2FpbiAke2FyYlBlcmNlbnQudG9GaXhlZCg2KX0lYDtcbiAgICBpZiAoYXJiUGVyY2VudCA+IGFyYkVtYWlsVGhyZXNob2xkUGVyY2VudCkge1xuICAgICAgbGV0IG1zZ0JvZHkgPSBgJHtwb2xvUGFpcn0gQlVZIGF0ICR7ZXhjaGFuZ2UyTmFtZX0gZm9yICR7ZXhjaGFuZ2UyQnV5QXQudG9GaXhlZCg4KX0uIFNFTEwgYXQgUG9sbyBmb3IgJHtwb2xvU2VsbEF0LnRvRml4ZWQoOCl9LCBHYWluOiAke2FyYlBlcmNlbnQudG9GaXhlZCg2KX0lYDtcbiAgICAgIGRiT3V0cHV0LnRyYWRlSW5zdHJ1Y3Rpb25zID0gYFRSQURFIE5PVy4gJHtwb2xvUGFpcn0gQlVZIGF0ICR7ZXhjaGFuZ2UyTmFtZX0gZm9yICR7ZXhjaGFuZ2UyQnV5QXQudG9GaXhlZCg4KX0uIFNFTEwgYXQgUG9sbyBmb3IgJHtwb2xvU2VsbEF0LnRvRml4ZWQoOCl9LCBHYWluOiAke2FyYlBlcmNlbnQudG9GaXhlZCg2KX0lYDtcbiAgICAgIGRiT3V0cHV0LnVyZ2VudFRyYWRlID0gdHJ1ZTtcbiAgICAgIFNlbmRNZXNzYWdlKGAke3BvbG9QYWlyfTogQlVZIGF0ICR7ZXhjaGFuZ2UyTmFtZX0gYW5kIFNFTEwgYXQgUG9sb25pZXhgLCBtc2dCb2R5KTtcbiAgICB9XG4gIH1cbiAgZWxzZSB7IFxuICAgIGRiT3V0cHV0LmdhaW5Mb3NzID0gXCJMT1NTXCI7XG4gICAgZGJPdXRwdXQudXJnZW50VHJhZGUgPSBmYWxzZTtcbiAgICBkYk91dHB1dC50cmFkZUluc3RydWN0aW9ucyA9IGBObyB0cmFkZS4gJHtwb2xvUGFpcn0sIEJVWSBhdCAke2V4Y2hhbmdlMk5hbWV9IGZvciAke2V4Y2hhbmdlMkJ1eUF0LnRvRml4ZWQoOCl9LiAgU0VMTCBhdCBQb2xvIGZvciAke3BvbG9TZWxsQXQudG9GaXhlZCg4KX0gcmVzdWx0cyBpbiBhIGxvc3Mgb2YgJHthcmJQZXJjZW50LnRvRml4ZWQoNil9JWA7XG4gICAgaWYgKHJlcG9ydExvc2VzKSB7XG4gICAgICBjb25zb2xlLmxvZyhgJHtmb3JtYXRUaW1lc3RhbXAodGltZVN0YW1wKX06IFBhaXI6ICR7cG9sb1BhaXJ9LCBSZXN1bHQ6IExPU1MsIERlc2M6ICR7ZXhjaGFuZ2UyTmFtZX0sICR7ZXhjaGFuZ2UyQnV5QXQudG9GaXhlZCg4KX0gaXMgZ3JlYXRlciB0aGFuIHBvbG9TZWxsQXQsICR7cG9sb1NlbGxBdC50b0ZpeGVkKDgpfSwgRElGRiwgJHthcmJPcHBvcnR1bml0eS50b0ZpeGVkKDYpfWApO1xuICAgIH1cbiAgfVxuICBsZXQga2V5U3RyID0gXCJCdXlcIitleGNoYW5nZTJOYW1lK1wiU2VsbFBvbG9uaWV4XCIrcG9sb1BhaXI7XG4gIGxldCBrZXkgPSB7XG4gICAgXCJrZXlcIjoga2V5U3RyXG4gIH07XG4gIGRiT3V0cHV0LmtleSA9IGtleVN0cjtcbiAgaWYgKGRiV3JpdGVFbmFibGVkKSB7XG4gICAgYXdhaXQgdXBkYXRlUmVzdWx0c0luTW9uZ28oa2V5LCBkYk91dHB1dCwgXCJjcnlwdG9cIiwgXCJtYXJrZXRkYXRhLmFyYm1vblwiKTtcbiAgfVxuICAvLyBDaGVjayBmb3IgY2FzZSBvZiBCdXkgYXQgRXhjaGFuZ2UxKFBvbG8pIGFuZCBTZWxsIGF0IEV4Y2hhbmdlMlxuICBhcmJPcHBvcnR1bml0eSA9IGV4Y2hhbmdlMlNlbGxBdC1wb2xvQnV5QXQ7XG4gIGFyYlBlcmNlbnQgPSAxMDAqKGV4Y2hhbmdlMlNlbGxBdC1wb2xvQnV5QXQpLyggKGV4Y2hhbmdlMlNlbGxBdCtwb2xvQnV5QXQpIC8gMik7XG4gIGRiT3V0cHV0LmFyYlBlcmNlbnQgPSBhcmJQZXJjZW50O1xuICBkYk91dHB1dC5leGNoMUJ1eU9yU2VsbCA9IFwiU2VsbFwiO1xuICBpZihkYk91dHB1dC5tYXhQcm9maXQgPCBhcmJQZXJjZW50KVxuICAgIGRiT3V0cHV0Lm1heFByb2ZpdCA9IGFyYlBlcmNlbnQ7XG4gIGlmKGFyYlBlcmNlbnQgPiBhcmJSZXBvcnRpbmdUaHJlc2hvbGRQZXJjZW50KSB7ICAgIFxuICAgIGxldCBtc2cgPSBgJHtmb3JtYXRUaW1lc3RhbXAodGltZVN0YW1wKX06IFBhaXI6ICR7cG9sb1BhaXJ9LCBSZXN1bHQ6IEdBSU4sIERlc2M6ICR7cG9sb1BhaXJ9LiBCVVkgYXQgUG9sbyBmb3IgJHtwb2xvQnV5QXQudG9GaXhlZCg4KX0gU0VMTCAke2V4Y2hhbmdlMk5hbWV9IGF0LCAke2V4Y2hhbmdlMlNlbGxBdC50b0ZpeGVkKDgpfSwgR2FpbiwgJHthcmJPcHBvcnR1bml0eS50b0ZpeGVkKDcpfSwgJHthcmJQZXJjZW50LnRvRml4ZWQoNil9JWA7XG4gICAgY29uc29sZS5sb2cobXNnKTtcbiAgICBkYk91dHB1dC5nYWluTG9zcyA9IFwiR0FJTlwiO1xuICAgIGRiT3V0cHV0LnRyYWRlSW5zdHJ1Y3Rpb25zID0gYE5vIHRyYWRlLiAke3BvbG9QYWlyfSBCVVkgYXQgUG9sbyBmb3IgJHtwb2xvQnV5QXQudG9GaXhlZCg4KX0uIFNFTEwgYXQgJHtleGNoYW5nZTJOYW1lfSBmb3IgJHtleGNoYW5nZTJTZWxsQXQudG9GaXhlZCg4KX0gc21hbGwgZ2FpbiAke2FyYlBlcmNlbnQudG9GaXhlZCg2KX0lYDtcbiAgICBpZiAoYXJiUGVyY2VudCA+IGFyYkVtYWlsVGhyZXNob2xkUGVyY2VudCkge1xuICAgICAgbGV0IG1zZ0JvZHkgPSBgJHtwb2xvUGFpcn0gQlVZIGF0IFBvbG8gZm9yICR7cG9sb0J1eUF0LnRvRml4ZWQoOCl9LiAgU0VMTCBhdCAke2V4Y2hhbmdlMk5hbWV9IGZvciAke2V4Y2hhbmdlMlNlbGxBdC50b0ZpeGVkKDgpfSwgR2FpbjogJHthcmJQZXJjZW50LnRvRml4ZWQoNil9JWA7XG4gICAgICBkYk91dHB1dC50cmFkZUluc3RydWN0aW9ucyA9IGBUUkFERSBOT1cuICR7cG9sb1BhaXJ9IEJVWSBhdCBQb2xvIGZvciAke3BvbG9CdXlBdC50b0ZpeGVkKDgpfS4gU0VMTCAke2V4Y2hhbmdlMk5hbWV9IGZvciAke2V4Y2hhbmdlMlNlbGxBdC50b0ZpeGVkKDgpfSwgR2FpbjogJHthcmJQZXJjZW50LnRvRml4ZWQoNil9JWA7XG4gICAgICBkYk91dHB1dC51cmdlbnRUcmFkZSA9IHRydWU7XG4gICAgICBTZW5kTWVzc2FnZShgJHtwb2xvUGFpcn06IEJVWSBhdCBQb2xvbmlleCBhbmQgU0VMTCBhdCAke2V4Y2hhbmdlMk5hbWV9YCwgbXNnQm9keSk7XG4gICAgfVxuICB9XG4gIGVsc2Uge1xuICAgIGRiT3V0cHV0LmdhaW5Mb3NzID0gXCJMT1NTXCI7XG4gICAgZGJPdXRwdXQudXJnZW50VHJhZGUgPSBmYWxzZTtcbiAgICBkYk91dHB1dC50cmFkZUluc3RydWN0aW9ucyA9IGBObyB0cmFkZS4gJHtwb2xvUGFpcn0sIEJVWSBhdCBQb2xvIGZvciAke3BvbG9CdXlBdC50b0ZpeGVkKDgpfSBTRUxMICR7ZXhjaGFuZ2UyTmFtZX0gZm9yICR7ZXhjaGFuZ2UyU2VsbEF0LnRvRml4ZWQoOCl9IHJlc3VsdHMgaW4gYSBsb3NzIG9mICR7YXJiUGVyY2VudC50b0ZpeGVkKDYpfSVgO1xuICAgIGlmIChyZXBvcnRMb3Nlcykge1xuICAgICAgY29uc29sZS5sb2coYCR7Zm9ybWF0VGltZXN0YW1wKHRpbWVTdGFtcCl9OiBQYWlyOiAke3BvbG9QYWlyfSwgUmVzdWx0OiBMT1NTLCBEZXNjOiBwb2xvQnV5QXQsICR7cG9sb0J1eUF0LnRvRml4ZWQoOCl9IGlzIGdyZWF0ZXIgdGhhbiAke2V4Y2hhbmdlMk5hbWV9U2VsbEF0LCAke2V4Y2hhbmdlMlNlbGxBdC50b0ZpeGVkKDgpfS4gRElGRiwgJHthcmJPcHBvcnR1bml0eS50b0ZpeGVkKDcpfWApO1xuICAgIH1cbiAgfVxuICBrZXlTdHIgPSBcIkJ1eVBvbG9uaWV4U2VsbFwiK2V4Y2hhbmdlMk5hbWUrcG9sb1BhaXI7XG4gIGtleSA9IHtcbiAgICBcImtleVwiOiBrZXlTdHJcbiAgfTtcbiAgZGJPdXRwdXQua2V5ID0ga2V5U3RyO1xuICBpZiAoZGJXcml0ZUVuYWJsZWQpIHtcbiAgICBhd2FpdCB1cGRhdGVSZXN1bHRzSW5Nb25nbyhrZXksIGRiT3V0cHV0LCBcImNyeXB0b1wiLCBcIm1hcmtldGRhdGEuYXJibW9uXCIpO1xuICB9XG59XG5cbi8qIHBvbG9Na3RGcm9tQml0dHJleE5hbWVcbiAqIGRlc2M6IENvbnZlcnRzIGEgQml0dHJleCBjcnlwdG8gY3VycmVuY3kgcGFpciBpbnRvIHRoZSBQb2xvbmlleCBwYWlyLlxuICovXG5mdW5jdGlvbiBwb2xvTWt0RnJvbUJpdHRyZXhOYW1lKGJpdHRyZXhNa3ROYW1lKSB7XG4gIGlmKGJpdHRyZXhNa3ROYW1lPT09XCJCVEMtWExNXCIpXG4gICAgcmV0dXJuKFwiQlRDX1NUUlwiKTtcbiAgaWYoYml0dHJleE1rdE5hbWU9PT1cIlVTRFQtWExNXCIpXG4gICAgcmV0dXJuKFwiVVNEVF9TVFJcIik7ICAgIFxuICByZXR1cm4oYml0dHJleE1rdE5hbWUucmVwbGFjZShcIi1cIiwgXCJfXCIpKTtcbn1cblxuLyogY29tcGFyZUFsbFBvbG9uaWV4SGl0YnRjXG4qICBkZXNjOiBUYWtlcyB0aGUgcG9sb25pZXggYW5kIGhpdGJ0YyBkYXRhIGluIEpTT04gZm9ybWF0IGFuZCBjb21wYXJlcyBhbGwgb3ZlcmxhcGluZyBtYXJrZXRzIGZvciBhcmJpdHJhZ2UuXG4qICAgICAgIEV4cG9ydGVkIGZ1bmN0aW9uIGNhbGxlZCBieSB0aGUgbWFpbiBhcHAuanNcbiovXG5mdW5jdGlvbiBjb21wYXJlQWxsUG9sb25pZXhIaXRidGMocG9sb0pTT04sIGhpdGJ0Y0pTT04pIHtcbiAgXG4gIGxldCByZXBvcnRpbmdUaW1lc3RhbXAgPSBuZXcgRGF0ZSgpO1xuICBsZXQgcG9sb1RpbWVzdGFtcCA9IHBvbG9KU09OLnRpbWVTdGFtcDtcbiAgbGV0IHBvbG9BbGxNYXJrZXRzID0gSlNPTi5wYXJzZShwb2xvSlNPTi5leGNoYW5nZURhdGEpO1xuICBsZXQgaGl0YnRjVGltZXN0YW1wID0gaGl0YnRjSlNPTi50aW1lU3RhbXA7XG4gIGNvbnNvbGUubG9nKHBvbG9UaW1lc3RhbXApO1xuICBjb25zb2xlLmxvZyhoaXRidGNUaW1lc3RhbXApO1xuICBmb3IobGV0IGhpdGJ0Y01rdCBpbiBoaXRidGNKU09OLmV4Y2hhbmdlRGF0YSl7XG4gICAgbGV0IHBvbG9Na3ROYW1lID0gcG9sb01rdEZyb21IaXRidGNOYW1lKGhpdGJ0Y01rdCk7XG4gICAgbGV0IHBvbG9Na3RFbGVtZW50ID0gcG9sb0FsbE1hcmtldHNbcG9sb01rdE5hbWVdO1xuICAgIGNvbXBhcmVQb2xvbmlleEhpdGJ0Y01rdEVsZW1lbnQocG9sb01rdEVsZW1lbnQsIGhpdGJ0Y0pTT04uZXhjaGFuZ2VEYXRhW2hpdGJ0Y01rdF0sIHBvbG9Na3ROYW1lLCByZXBvcnRpbmdUaW1lc3RhbXApO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNvbXBhcmVQb2xvbmlleEhpdGJ0Y01rdEVsZW1lbnQocG9sb01rdEVsZW1lbnQsIGhpdGJ0Y01rdEVsZW1lbnQsIHBvbG9Na3ROYW1lLCByZXBvcnRpbmdUaW1lc3RhbXApIHtcblxuICBsZXQgcG9sb0J1eUF0ID0gK3BvbG9Na3RFbGVtZW50Lmxvd2VzdEFzaztcbiAgbGV0IHBvbG9TZWxsQXQgPSArcG9sb01rdEVsZW1lbnQuaGlnaGVzdEJpZDtcbiAgbGV0IGhpdGJ0Y1NlbGxBdCA9ICtoaXRidGNNa3RFbGVtZW50LmJpZDtcbiAgbGV0IGhpdGJ0Y0J1eUF0ID0gK2hpdGJ0Y01rdEVsZW1lbnQuYXNrO1xuICBvdXRwdXRBcmJSZXN1bHRzKHBvbG9CdXlBdCwgcG9sb1NlbGxBdCwgaGl0YnRjU2VsbEF0LCBoaXRidGNCdXlBdCwgXCJIaXRidGNcIiwgcG9sb01rdE5hbWUsIHJlcG9ydGluZ1RpbWVzdGFtcCk7XG59XG5cbmZ1bmN0aW9uIHBvbG9Na3RGcm9tSGl0YnRjTmFtZShoaXRidGNNa3ROYW1lKSB7XG5cbiAgY29uc3QgcG9sb01rdE5hbWVzID0ge1xuICAgIEJDTkJUQzogICBcIkJUQ19CQ05cIixcbiAgICBCTlRVU0RUOiAgXCJVU0RUX0JOVFwiLFxuICAgIERBU0hCVEM6ICBcIkJUQ19EQVNIXCIsXG4gICAgREFTSFVTRFQ6IFwiVVNEVF9EQVNIXCIsXG4gICAgRE9HRUJUQzogIFwiQlRDX0RPR0VcIixcbiAgICBET0dFVVNEVDogXCJVU0RUX0RPR0VcIixcbiAgICBER0JCVEM6ICAgXCJCVENfREdCXCIsXG4gICAgRU9TQlRDOiAgIFwiQlRDX0VPU1wiLFxuICAgIEVPU1VTRFQ6ICBcIlVTRFRfRU9TXCIsXG4gICAgRVRDVVNEVDogIFwiVVNEVF9FVENcIixcbiAgICBFVEhVU0RUOiAgXCJVU0RUX0VUSFwiLFxuICAgIExTS0JUQzogICBcIkJUQ19MU0tcIixcbiAgICBNQUlEQlRDOiAgXCJCVENfTUFJRFwiLFxuICAgIE1BTkFCVEM6ICBcIkJUQ19NQU5BXCIsXG4gICAgT01HQlRDOiAgIFwiQlRDX09NR1wiLFxuICAgIFBQQ0JUQzogICBcIkJUQ19QUENcIixcbiAgICBRVFVNQlRDOiAgXCJCVENfUVRVTVwiLFxuICAgIFJFUEJUQzogICBcIkJUQ19SRVBcIixcbiAgICBSRVBVU0RUOiAgXCJVU0RUX1JFUFwiLFxuICAgIFhFTUJUQzogICBcIkJUQ19YRU1cIixcbiAgICBFVEhCVEM6ICAgXCJCVENfRVRIXCIsXG4gICAgWkVDRVRIOiAgIFwiRVRIX1pFQ1wiXG4gIH07XG4gIHJldHVybihwb2xvTWt0TmFtZXNbaGl0YnRjTWt0TmFtZV0pO1xufVxuXG5mdW5jdGlvbiBjb21wYXJlQWxsUG9sb25pZXhZb2JpdChwb2xvRGF0YSwgeW9iaXREYXRhKSB7XG5cbiAgbGV0IHJlcG9ydGluZ1RpbWVzdGFtcCA9IG5ldyBEYXRlKCk7XG4gIGxldCBwb2xvVGltZXN0YW1wID0gcG9sb0RhdGEudGltZVN0YW1wO1xuICBsZXQgcG9sb0FsbE1hcmtldHMgPSBKU09OLnBhcnNlKHBvbG9EYXRhLmV4Y2hhbmdlRGF0YSk7XG4gIGxldCB5b2JpdFRpbWVzdGFtcCA9IHlvYml0RGF0YS50aW1lU3RhbXA7XG4gIGxldCB5b2JpdEFsbE1hcmtldHMgPSBKU09OLnBhcnNlKHlvYml0RGF0YS5leGNoYW5nZURhdGEpO1xuICBjb25zb2xlLmxvZyhwb2xvVGltZXN0YW1wKTtcbiAgY29uc29sZS5sb2coeW9iaXRUaW1lc3RhbXApO1xuICBmb3IobGV0IHlvYml0TWt0IGluIHlvYml0QWxsTWFya2V0cyl7XG4gICAgY29uc29sZS5sb2coXCJ5b2JpdE1rdDpcIiwgeW9iaXRNa3QsIFwiIGRhdGE6XCIsIHlvYml0QWxsTWFya2V0c1t5b2JpdE1rdF0pO1xuICAgIGxldCBwb2xvTWt0TmFtZSA9IHBvbG9Na3RGcm9tWW9iaXROYW1lKHlvYml0TWt0KTtcbiAgICBjb25zb2xlLmxvZyhcIlBvbG9NYXJrZXQ6XCIsIHBvbG9Na3ROYW1lLCBcIiBkYXRhOlwiLCBwb2xvQWxsTWFya2V0c1twb2xvTWt0TmFtZV0pO1xuICAgIGNvbXBhcmVQb2xvbmlleFlvYml0TWt0RWxlbWVudChwb2xvQWxsTWFya2V0c1twb2xvTWt0TmFtZV0sIHlvYml0QWxsTWFya2V0c1t5b2JpdE1rdF0sIHBvbG9Na3ROYW1lLCByZXBvcnRpbmdUaW1lc3RhbXApO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNvbXBhcmVQb2xvbmlleFlvYml0TWt0RWxlbWVudChwb2xvTWt0RWxlbWVudCwgeW9iaXRNa3RFbGVtZW50LCBwb2xvTWt0TmFtZSwgcmVwb3J0aW5nVGltZXN0YW1wKSB7XG5cbiAgbGV0IHBvbG9CdXlBdCA9ICtwb2xvTWt0RWxlbWVudC5sb3dlc3RBc2s7XG4gIGxldCBwb2xvU2VsbEF0ID0gK3BvbG9Na3RFbGVtZW50LmhpZ2hlc3RCaWQ7XG4gIGxldCB5b2JpdFNlbGxBdCA9ICt5b2JpdE1rdEVsZW1lbnQuc2VsbDtcbiAgbGV0IHlvYml0QnV5QXQgPSAreW9iaXRNa3RFbGVtZW50LmJ1eTtcbiAgb3V0cHV0QXJiUmVzdWx0cyhwb2xvQnV5QXQsIHBvbG9TZWxsQXQsIHlvYml0U2VsbEF0LCB5b2JpdEJ1eUF0LCBcIllvYml0XCIsIHBvbG9Na3ROYW1lLCByZXBvcnRpbmdUaW1lc3RhbXApO1xufVxuXG5mdW5jdGlvbiBwb2xvTWt0RnJvbVlvYml0TmFtZSh5b2JpdE1rdE5hbWUpIHtcblxuICBjb25zdCBwb2xvTWt0TmFtZXMgPSB7XG4gICAgbHRjX2J0YzogIFwiQlRDX0xUQ1wiLFxuICAgIG5tY19idGM6ICBcIkJUQ19OTUNcIixcbiAgICBubXJfYnRjOiAgXCJCVENfTk1SXCJcbiAgfTtcbiAgcmV0dXJuKHBvbG9Na3ROYW1lc1t5b2JpdE1rdE5hbWVdKTtcbn1cblxuZXhwb3J0IHtjb21wYXJlUG9sb25pZXhDb2luYmFzZSwgY29tcGFyZUFsbFBvbG9uaWV4Qml0dHJleCwgY29tcGFyZUFsbFBvbG9uaWV4SGl0YnRjLCBjb21wYXJlQWxsUG9sb25pZXhZb2JpdH07XG4iXX0=