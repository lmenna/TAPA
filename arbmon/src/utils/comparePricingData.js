/* comparePricingData.js
 * Consolidates function to compare crypto markets looking for significant arbitrage opportunities.
 * Sends notifications when large arbitrage is detected.
 */

import {SendMessage} from "./sendEMail";
import {writeResultsToMongo, updateResultsInMongo} from "./dbUtils";

// Set this to be a clear trading opportunity
const arbEmailThresholdPercent = 1.25;
// Set this to be the fees associated with trading
const arbReportingThresholdPercent = 0.0;
// Control output to DB
let dbWriteEnabled = true;
// Control reported output
let reportLoses = false;

/* formatTimestamp
 * desc: Simple utility to truncate the output of long time stamps to include only the date and time parts.
 */
function formatTimestamp(timeStamp) {
  return(timeStamp.toString().slice(0,25));
}

/* comparePoloniexCoinbase
 * desc: Main function called to compare the Poloniex and Coinbase crypto markets.
 *       This function is exported and called be app.js
 */
function comparePoloniexCoinbase(poloData, cbData, coin) {

  var poloJSON = JSON.parse(poloData.exchangeData);
  var cbJSON = JSON.parse(cbData.exchangeData);
  let timeStamp = new Date();
  console.log(`${formatTimestamp(timeStamp)}: PoloTime-CBTime: ${poloData.timeStamp.getTime()-cbData.timeStamp.getTime()}.`);
  compareCurrencyPair(timeStamp, poloJSON, cbJSON, "USDC", coin)
}

/* compareCurrencyPair
 * desc: Compares a currency pair between Poloniex and Coinbase.  Notifies when significant arbitrage opportunities
 *       occur.
 */
function compareCurrencyPair(timeStamp, poloJSON, cbJSON, ccy1, ccy2) {
  let poloPair = ccy1+"_"+ccy2;
  let poloBuyAt = +poloJSON[poloPair].lowestAsk;
  let poloSellAt = +poloJSON[poloPair].highestBid;
  let coinbaseSellAt = +cbJSON.bids[0][0];
  let coinbaseBuyAt = +cbJSON.asks[0][0];
  outputArbResults(poloBuyAt, poloSellAt, coinbaseSellAt, coinbaseBuyAt, "Coinbase", poloPair, timeStamp);
 }

 /* compareAllPoloniexBittrex
  * desc: Takes the poloniex and bittrex data in JSON format and compares all overlaping markets for arbitrage.
  *       Exported function called by the main app.js
  */
function compareAllPoloniexBittrex(poloJSON, bittrexJSON) {

  let reportingTimestamp = new Date();
  let poloTimestamp = poloJSON.timeStamp;
  let poloAllMarkets = JSON.parse(poloJSON.exchangeData);
  let bittrexTimestamp = bittrexJSON.timeStamp;
  console.log(poloTimestamp);
  console.log(bittrexTimestamp);
  for(let bittrexMkt in bittrexJSON.exchangeData){
    let poloMktName = poloMktFromBittrexName(bittrexMkt);
    let poloMktElement = poloAllMarkets[poloMktName];
    if(!poloMktElement) {
      console.log("Polo market for ", bittrexMkt, " doesn't exist.");
    }
    else {
      comparePoloniexBittrexMktElement(poloMktElement, bittrexJSON.exchangeData[bittrexMkt], poloMktName, reportingTimestamp)
    }
  }
}

/* comparePoloniexBittrexMktElement
 * desc: Compares a particular market between the Poloniex and Bittrex exchanges.  Sedn notifications when
 *       significant arbitrage opportunities exist.
 */
function comparePoloniexBittrexMktElement(poloJSON, bittrexJSON, poloPair, timeStamp) {

  let poloBuyAt = +poloJSON.lowestAsk;
  let poloSellAt = +poloJSON.highestBid;
  let bittrexSellAt = +bittrexJSON.Bid;
  let bittrexBuyAt = +bittrexJSON.Ask;
  outputArbResults(poloBuyAt, poloSellAt, bittrexSellAt, bittrexBuyAt, "Bittrex", poloPair, timeStamp);
}

async function outputArbResults(poloBuyAt, poloSellAt, exchange2SellAt, exchange2BuyAt, exchange2Name, poloPair, timeStamp) {

  let dbOutput = {
    key: "",
    exch1Name: "Poloniex",
    exch2Name: exchange2Name,
    timeStamp: timeStamp.toString().slice(0,25),
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
  };
 // Check for case of Buy at Exchange2 and Sell at Exchange1 (Polo)
  let arbOpportunity = poloSellAt-exchange2BuyAt;
  let arbPercent = 100*(poloSellAt-exchange2BuyAt)/( (poloSellAt+exchange2BuyAt) / 2);
  dbOutput.arbPercent = arbPercent;
  dbOutput.exch1BuyOrSell = "Sell";
  if(arbPercent > arbReportingThresholdPercent) {
    let msg = `${formatTimestamp(timeStamp)}: Pair: ${poloPair}, Result: GAIN, Desc: ${poloPair}. BUY at ${exchange2Name}: ${exchange2BuyAt.toFixed(8)} SELL Polo at, ${poloSellAt.toFixed(8)}, Gain, ${arbOpportunity.toFixed(7)}, ${arbPercent.toFixed(6)}%`;
    console.log(msg);
    dbOutput.gainLoss = "GAIN";
    dbOutput.tradeInstructions = `No trade. ${poloPair} BUY at ${exchange2Name} for ${exchange2BuyAt.toFixed(8)}.  SELL at Polo for ${poloSellAt.toFixed(8)} small gain ${arbPercent.toFixed(6)}%`;
    if (arbPercent > arbEmailThresholdPercent) {
      let msgBody = `${poloPair} BUY at ${exchange2Name} for ${exchange2BuyAt.toFixed(8)}. SELL at Polo for ${poloSellAt.toFixed(8)}, Gain: ${arbPercent.toFixed(6)}%`;
      dbOutput.tradeInstructions = `TRADE NOW. ${poloPair} BUY at ${exchange2Name} for ${exchange2BuyAt.toFixed(8)}. SELL at Polo for ${poloSellAt.toFixed(8)}, Gain: ${arbPercent.toFixed(6)}%`;
      dbOutput.urgentTrade = true;
      SendMessage(`${poloPair}: BUY at ${exchange2Name} and SELL at Poloniex`, msgBody);
    }
  }
  else { 
    dbOutput.gainLoss = "LOSS";
    dbOutput.urgentTrade = false;
    dbOutput.tradeInstructions = `No trade. ${poloPair}, BUY at ${exchange2Name} for ${exchange2BuyAt.toFixed(8)}.  SELL at Polo for ${poloSellAt.toFixed(8)} results in a loss of ${arbPercent.toFixed(6)}%`;
    if (reportLoses) {
      console.log(`${formatTimestamp(timeStamp)}: Pair: ${poloPair}, Result: LOSS, Desc: ${exchange2Name}, ${exchange2BuyAt.toFixed(8)} is greater than poloSellAt, ${poloSellAt.toFixed(8)}, DIFF, ${arbOpportunity.toFixed(6)}`);
    }
  }
  let keyStr = "Buy"+exchange2Name+"SellPoloniex"+poloPair;
  let key = {
    "key": keyStr
  };
  dbOutput.key = keyStr;
  if (dbWriteEnabled) {
    await updateResultsInMongo(key, dbOutput, "crypto", "marketdata.arbmon");
  }
  // Check for case of Buy at Exchange1(Polo) and Sell at Exchange2
  arbOpportunity = exchange2SellAt-poloBuyAt;
  arbPercent = 100*(exchange2SellAt-poloBuyAt)/( (exchange2SellAt+poloBuyAt) / 2);
  dbOutput.arbPercent = arbPercent;
  dbOutput.exch1BuyOrSell = "Sell";
  if(dbOutput.maxProfit < arbPercent)
    dbOutput.maxProfit = arbPercent;
  if(arbPercent > arbReportingThresholdPercent) {    
    let msg = `${formatTimestamp(timeStamp)}: Pair: ${poloPair}, Result: GAIN, Desc: ${poloPair}. BUY at Polo for ${poloBuyAt.toFixed(8)} SELL ${exchange2Name} at, ${exchange2SellAt.toFixed(8)}, Gain, ${arbOpportunity.toFixed(7)}, ${arbPercent.toFixed(6)}%`;
    console.log(msg);
    dbOutput.gainLoss = "GAIN";
    dbOutput.tradeInstructions = `No trade. ${poloPair} BUY at Polo for ${poloBuyAt.toFixed(8)}. SELL at ${exchange2Name} for ${exchange2SellAt.toFixed(8)} small gain ${arbPercent.toFixed(6)}%`;
    if (arbPercent > arbEmailThresholdPercent) {
      let msgBody = `${poloPair} BUY at Polo for ${poloBuyAt.toFixed(8)}.  SELL at ${exchange2Name} for ${exchange2SellAt.toFixed(8)}, Gain: ${arbPercent.toFixed(6)}%`;
      dbOutput.tradeInstructions = `TRADE NOW. ${poloPair} BUY at Polo for ${poloBuyAt.toFixed(8)}. SELL ${exchange2Name} for ${exchange2SellAt.toFixed(8)}, Gain: ${arbPercent.toFixed(6)}%`;
      dbOutput.urgentTrade = true;
      SendMessage(`${poloPair}: BUY at Poloniex and SELL at ${exchange2Name}`, msgBody);
    }
  }
  else {
    dbOutput.gainLoss = "LOSS";
    dbOutput.urgentTrade = false;
    dbOutput.tradeInstructions = `No trade. ${poloPair}, BUY at Polo for ${poloBuyAt.toFixed(8)} SELL ${exchange2Name} for ${exchange2SellAt.toFixed(8)} results in a loss of ${arbPercent.toFixed(6)}%`;
    if (reportLoses) {
      console.log(`${formatTimestamp(timeStamp)}: Pair: ${poloPair}, Result: LOSS, Desc: poloBuyAt, ${poloBuyAt.toFixed(8)} is greater than ${exchange2Name}SellAt, ${exchange2SellAt.toFixed(8)}. DIFF, ${arbOpportunity.toFixed(7)}`);
    }
  }
  keyStr = "BuyPoloniexSell"+exchange2Name+poloPair;
  key = {
    "key": keyStr
  };
  dbOutput.key = keyStr;
  if (dbWriteEnabled) {
    await updateResultsInMongo(key, dbOutput, "crypto", "marketdata.arbmon");
  }
}

/* poloMktFromBittrexName
 * desc: Converts a Bittrex crypto currency pair into the Poloniex pair.
 */
function poloMktFromBittrexName(bittrexMktName) {
  if(bittrexMktName==="BTC-XLM")
    return("BTC_STR");
  if(bittrexMktName==="USDT-XLM")
    return("USDT_STR");    
  return(bittrexMktName.replace("-", "_"));
}

/* compareAllPoloniexHitbtc
*  desc: Takes the poloniex and hitbtc data in JSON format and compares all overlaping markets for arbitrage.
*       Exported function called by the main app.js
*/
function compareAllPoloniexHitbtc(poloJSON, hitbtcJSON) {
  
  let reportingTimestamp = new Date();
  let poloTimestamp = poloJSON.timeStamp;
  let poloAllMarkets = JSON.parse(poloJSON.exchangeData);
  let hitbtcTimestamp = hitbtcJSON.timeStamp;
  console.log(poloTimestamp);
  console.log(hitbtcTimestamp);
  for(let hitbtcMkt in hitbtcJSON.exchangeData){
    let poloMktName = poloMktFromHitbtcName(hitbtcMkt);
    let poloMktElement = poloAllMarkets[poloMktName];
    comparePoloniexHitbtcMktElement(poloMktElement, hitbtcJSON.exchangeData[hitbtcMkt], poloMktName, reportingTimestamp);
  }
}

/* comparePoloniexHitbtcMktElement
 * desc: Pulls out the buy and sell prices for a single currency pair for Poloniex and Hitbtc.
 *       Forwards this to the output method to record the arbitrage results.
 */
function comparePoloniexHitbtcMktElement(poloMktElement, hitbtcMktElement, poloMktName, reportingTimestamp) {

  let poloBuyAt = +poloMktElement.lowestAsk;
  let poloSellAt = +poloMktElement.highestBid;
  let hitbtcSellAt = +hitbtcMktElement.bid;
  let hitbtcBuyAt = +hitbtcMktElement.ask;
  outputArbResults(poloBuyAt, poloSellAt, hitbtcSellAt, hitbtcBuyAt, "Hitbtc", poloMktName, reportingTimestamp);
}

/* poloMktFromHitbtcName
 * desc: Maps from Hitbtc tickers to Poloniex tickers.
 */
function poloMktFromHitbtcName(hitbtcMktName) {

  const poloMktNames = {
    BCNBTC:   "BTC_BCN",
    BNTUSDT:  "USDT_BNT",
    DASHBTC:  "BTC_DASH",
    DASHUSDT: "USDT_DASH",
    DOGEBTC:  "BTC_DOGE",
    DOGEUSDT: "USDT_DOGE",
    DGBBTC:   "BTC_DGB",
    EOSBTC:   "BTC_EOS",
    EOSUSDT:  "USDT_EOS",
    ETCUSDT:  "USDT_ETC",
    ETHUSDT:  "USDT_ETH",
    LSKBTC:   "BTC_LSK",
    MAIDBTC:  "BTC_MAID",
    MANABTC:  "BTC_MANA",
    OMGBTC:   "BTC_OMG",
    PPCBTC:   "BTC_PPC",
    QTUMBTC:  "BTC_QTUM",
    REPBTC:   "BTC_REP",
    REPUSDT:  "USDT_REP",
    XEMBTC:   "BTC_XEM",
    ETHBTC:   "BTC_ETH",
    ZECETH:   "ETH_ZEC"
  };
  return(poloMktNames[hitbtcMktName]);
}

/* compareAllPoloniexYobit
 * desc: Compares market data across many currency pairs between Poloniex and Yobit.
 *       Note that Yobit oftens has large prcie discrepencies but the wallets for thos coins
 *       are deactivated.  So you can't generate a profit.
 */
function compareAllPoloniexYobit(poloData, yobitData) {

  let reportingTimestamp = new Date();
  let poloTimestamp = poloData.timeStamp;
  let poloAllMarkets = JSON.parse(poloData.exchangeData);
  let yobitTimestamp = yobitData.timeStamp;
  let yobitAllMarkets = JSON.parse(yobitData.exchangeData);
  console.log(poloTimestamp);
  console.log(yobitTimestamp);
  for(let yobitMkt in yobitAllMarkets){
    console.log("yobitMkt:", yobitMkt, " data:", yobitAllMarkets[yobitMkt]);
    let poloMktName = poloMktFromYobitName(yobitMkt);
    console.log("PoloMarket:", poloMktName, " data:", poloAllMarkets[poloMktName]);
    comparePoloniexYobitMktElement(poloAllMarkets[poloMktName], yobitAllMarkets[yobitMkt], poloMktName, reportingTimestamp);
  }
}

/* comparePoloniexYobitMktElement
 * desc: Pulls out the buy and sell prices for a single currency pair for Poloniex and Yobit.
 *       Forwards this to the output method to record the arbitrage results.
 */
function comparePoloniexYobitMktElement(poloMktElement, yobitMktElement, poloMktName, reportingTimestamp) {

  let poloBuyAt = +poloMktElement.lowestAsk;
  let poloSellAt = +poloMktElement.highestBid;
  let yobitSellAt = +yobitMktElement.sell;
  let yobitBuyAt = +yobitMktElement.buy;
  outputArbResults(poloBuyAt, poloSellAt, yobitSellAt, yobitBuyAt, "Yobit", poloMktName, reportingTimestamp);
}

/* poloMktFromYobitName
 * desc: Maps from Yobit tickers to Poloniex tickers.
 */
function poloMktFromYobitName(yobitMktName) {

  const poloMktNames = {
    ltc_btc:  "BTC_LTC",
    nmc_btc:  "BTC_NMC",
    nmr_btc:  "BTC_NMR"
  };
  return(poloMktNames[yobitMktName]);
}

export {comparePoloniexCoinbase, compareAllPoloniexBittrex, compareAllPoloniexHitbtc, compareAllPoloniexYobit};
