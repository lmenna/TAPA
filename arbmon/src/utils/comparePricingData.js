/* comparePricingData.js
 * Consolidates function to compare crypto markets looking for significant arbitrage opportunities.
 * Sends notifications when large arbitrage is detected.
 */
import {SendMessage} from "./sendEMail";

// Set this to be a clear trading opportunity
const arbEmailThresholdPercent = 1.25;
// Set this to be the fees associated with trading
const arbReportingThresholdPercent = 0.0;

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
  let cbSellAt = +cbJSON.bids[0][0];
  let arbOpportunity = cbSellAt-poloBuyAt;
  let arbPercent = 100*(cbSellAt-poloBuyAt)/( (cbSellAt+poloBuyAt) / 2);
  if(arbPercent > arbReportingThresholdPercent) {
    let msg = `${formatTimestamp(timeStamp)}: Pair: ${poloPair}, Result: GAIN, Desc: ${poloPair}. BUY Polo at: poloBuyAt: ${poloBuyAt.toFixed(8)} SELL Coinbase at: ${cbSellAt.toFixed(8)}, Amount: ${arbOpportunity.toFixed(7)}, ${arbPercent.toFixed(6)}%`;
    if (arbPercent > arbEmailThresholdPercent)
      SendMessage(`${poloPair}: BUY ${ccy2} at Poloniex and SELL at Coinbase`, msg);
    console.log(msg);
  }
  else {
    console.log(`${formatTimestamp(timeStamp)}: Pair: ${poloPair}, Result: LOSS, Desc: poloBuyAt: ${poloBuyAt.toFixed(8)} compared to cbSellAt: ${cbSellAt.toFixed(8)}, DIFF: ${arbOpportunity.toFixed(7)}`)
  }
  let cbBuyAt = +cbJSON.asks[0][0];
  let poloSellAt = +poloJSON[poloPair].highestBid;
  arbOpportunity = poloSellAt-cbBuyAt;
  arbPercent = 100*(poloSellAt-cbBuyAt)/( (poloSellAt+cbBuyAt) / 2);
  if(arbPercent > arbReportingThresholdPercent) {
    let msg = `${formatTimestamp(timeStamp)}: Pair: ${poloPair}, Result: GAIN, Desc: ${poloPair}. BUY Coinbase at: cbBuyAt: ${cbBuyAt.toFixed(7)} SELL Polo at: ${poloSellAt.toFixed(7)}, Gain: ${arbOpportunity.toFixed(7)}, ${arbPercent.toFixed(6)}%`;
    if (arbPercent > arbEmailThresholdPercent) 
      SendMessage(`${poloPair}: BUY ${ccy2} at Coinbase and SELL at Poloniex`, msg);
    console.log(msg);
  }
  else {
    console.log(`${formatTimestamp(timeStamp)}: Pair: ${poloPair}, Result: LOSS, Desc: cbBuyAt: ${cbBuyAt.toFixed(7)} compared to poloSellAt: ${poloSellAt.toFixed(7)}, DIFF: ${arbOpportunity.toFixed(7)}`);
  }
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
    comparePoloniexBittrexMktElement(poloMktElement, bittrexJSON.exchangeData[bittrexMkt], poloMktName, reportingTimestamp)
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
  let arbOpportunity = poloSellAt-bittrexBuyAt;
  let arbPercent = 100*(poloSellAt-bittrexBuyAt)/( (poloSellAt+bittrexBuyAt) / 2);
  if(arbPercent > arbReportingThresholdPercent) {
    let msg = `${formatTimestamp(timeStamp)}: Pair: ${poloPair}, Result: GAIN, Desc: ${poloPair}. BUY at Bittrex: bittrexBuyAt, ${bittrexBuyAt.toFixed(8)} SELL Polo at, ${poloSellAt.toFixed(8)}, Gain, ${arbOpportunity.toFixed(7)}, ${arbPercent.toFixed(6)}%`;
    console.log(msg);
    if (arbPercent > arbEmailThresholdPercent) {
      let msgBody = `${poloPair}\n\n${poloPair} BUY at Bittrex for ${bittrexBuyAt.toFixed(8)}.  Sell at Poloniex for ${poloSellAt.toFixed(8)}\n`;
      SendMessage(`${poloPair}: BUY at Bittrex and SELL at Poloniex`, msgBody);
    }
  }
  else {
    console.log(`${formatTimestamp(timeStamp)}: Pair: ${poloPair}, Result: LOSS, Desc: bittrexBuyAt, ${bittrexBuyAt.toFixed(8)} is greater than poloSellAt, ${poloSellAt.toFixed(8)}, DIFF, ${arbOpportunity.toFixed(6)}`);
  }
  arbOpportunity = bittrexSellAt-poloBuyAt;
  arbPercent = 100*(bittrexSellAt-poloBuyAt)/( (bittrexSellAt+poloBuyAt) / 2);
  if(arbPercent > arbReportingThresholdPercent) {
    let msg = `${formatTimestamp(timeStamp)}: Pair: ${poloPair}, Result: GAIN, Desc: ${poloPair}. BUY at Polo: poloBuyAt, ${poloBuyAt.toFixed(8)} SELL Bittrex at, ${bittrexSellAt.toFixed(8)}, Gain, ${arbOpportunity.toFixed(7)}, ${arbPercent.toFixed(6)}%`;
    console.log(msg);
    if (arbPercent > arbEmailThresholdPercent) {
      let msgBody = `${poloPair}\n\n${poloPair} BUY at Polo for ${poloBuyAt.toFixed(8)}.  Sell at Bittrex for ${bittrexSellAt.toFixed(8)}`;
      SendMessage(`${poloPair}: BUY at Poloniex and SELL at Bittrex`, msgBody);
    }
  }
  else {
    console.log(`${formatTimestamp(timeStamp)}: Pair: ${poloPair}, Result: LOSS, Desc: poloBuyAt, ${poloBuyAt.toFixed(8)} is greater than bittrexSellAt, ${bittrexSellAt.toFixed(8)}. DIFF, ${arbOpportunity.toFixed(7)}`);
  }
}

/* poloMktFromBittrexName
 * desc: Converts a Bittrex crypto currency pair into the Poloniex pair.
 */
function poloMktFromBittrexName(bittrexMktName) {
  return(bittrexMktName.replace("-", "_"));
}

export {comparePoloniexCoinbase, compareAllPoloniexBittrex};
