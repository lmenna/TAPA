import {SendMessage} from "./sendEMail";

// Set this to be a clear trading opportunity
const arbEmailThresholdPercent = 1.25;
// Set this to be the fees associated with trading
const arbReportingThresholdPercent = 0.25;


function formatTimestamp(timeStamp) {
  return(timeStamp.toString().slice(0,25));
}

function comparePoloniexCoinbase(poloData, cbData, coin) {

  var poloJSON = JSON.parse(poloData.exchangeData);
  var cbJSON = JSON.parse(cbData.exchangeData);
  let timeStamp = new Date();
  console.log(`${formatTimestamp(timeStamp)}: PoloTime-CBTime: ${poloData.timeStamp.getTime()-cbData.timeStamp.getTime()}.`);
  compareCurrencyPair(timeStamp, poloJSON, cbJSON, "USDC", coin)
}

function compareCurrencyPair(timeStamp, poloJSON, cbJSON, ccy1, ccy2) {
  let poloPair = ccy1+"_"+ccy2;
  let poloBuyAt = +poloJSON[poloPair].lowestAsk;
  let cbSellAt = +cbJSON.bids[0][0];
  let arbOpportunity = cbSellAt-poloBuyAt;
  let arbPercent = 100*(cbSellAt-poloBuyAt)/( (cbSellAt+poloBuyAt) / 2);
  if(arbPercent > arbReportingThresholdPercent) {
    let msg = `${formatTimestamp(timeStamp)}: Pair: ${poloPair}, Result: GAIN, Desc: ${poloPair}. BUY Polo at: poloBuyAt: ${poloBuyAt} SELL Coinbase at: ${cbSellAt}, Amount: ${arbOpportunity}`;
    if (arbPercent > arbEmailThresholdPercent)
      SendMessage(`${poloPair}: BUY ${ccy2} at Poloniex and SELL at Coinbase`, msg);
    console.log(msg);
  }
  else {
    console.log(`${formatTimestamp(timeStamp)}: Pair: ${poloPair}, Result: LOSS, Desc: poloBuyAt: ${poloBuyAt} compared to cbSellAt: ${cbSellAt}, DIFF: ${arbOpportunity.toFixed(6)}`)
  }
  let cbBuyAt = +cbJSON.asks[0][0];
  let poloSellAt = +poloJSON[poloPair].highestBid;
  arbOpportunity = poloSellAt-cbBuyAt;
  arbPercent = 100*(poloSellAt-cbBuyAt)/( (poloSellAt+cbBuyAt) / 2);
  if(arbPercent > arbReportingThresholdPercent) {
    let msg = `${formatTimestamp(timeStamp)}: Pair: ${poloPair}, Result: GAIN, Desc: ${poloPair}. BUY Coinbase at: cbBuyAt: ${cbBuyAt} SELL Polo at: ${poloSellAt}, Gain: ${arbOpportunity}`;
    if (arbPercent > arbEmailThresholdPercent) 
      SendMessage(`${poloPair}: BUY ${ccy2} at Coinbase and SELL at Poloniex`, msg);
    console.log(msg);
  }
  else {
    console.log(`${formatTimestamp(timeStamp)}: Pair: ${poloPair}, Result: LOSS, Desc: cbBuyAt: ${cbBuyAt} compared to poloSellAt: ${poloSellAt}, DIFF: ${arbOpportunity.toFixed(6)}`);
  }
 }

function comparePoloBittrexCcyPair(poloJSON, bittrexJSON, baseCcy, coin) {

  let timeStamp = new Date();
  let poloPair = baseCcy + "_" + coin.toUpperCase();
  let poloBuyAt = +poloJSON[poloPair].lowestAsk;
  let poloSellAt = +poloJSON[poloPair].highestBid;
  let bittrexSellAt = bittrexJSON.result[0].Bid;
  let bittrexBuyAt = bittrexJSON.result[0].Ask;
  let arbOpportunity = poloSellAt-bittrexBuyAt;
  if(arbOpportunity > arbReportingThreshold) {
    let msg = `${timeStamp}: Pair: ${poloPair}, Result: GAIN, Desc: ${poloPair}. BUY ${coin} at Bittrex: bittrexBuyAt, ${bittrexBuyAt} SELL Polo at, ${poloSellAt}, Gain, ${arbOpportunity}`;
    if (arbOpportunity > arbEmailThreshold)
      SendMessage(`${poloPair}: BUY ${coin} at Bittrex and SELL at Poloniex`, msg);
    console.log(msg);
  }
  else {
    console.log(`${timeStamp}: Pair: ${poloPair}, Result: LOSS, Desc: bittrexBuyAt, ${bittrexBuyAt} is greater than poloSellAt, ${poloSellAt}. DIFF, ${arbOpportunity.toFixed(6)}`);
  }
  arbOpportunity = bittrexSellAt-poloBuyAt;
  if(arbOpportunity > arbReportingThreshold) {
    let msg = `${timeStamp}: Pair: ${poloPair}, Result: GAIN, Desc: ${poloPair}. BUY ${coin} at Polo: poloBuyAt, ${poloBuyAt} SELL Bittrex at, ${bittrexSellAt}, Gain, ${arbOpportunity}`;
    if (arbOpportunity > arbEmailThreshold)
      SendMessage(`${poloPair}: BUY ${coin} at Poloniex and SELL at Bittrex`, msg);
    console.log(msg);
  }
  else {
    console.log(`${timeStamp}: Pair: ${poloPair}, Result: LOSS, Desc: poloBuyAt, ${poloBuyAt} is greater than bittrexSellAt, ${bittrexSellAt}. DIFF, ${arbOpportunity.toFixed(6)}`);
  }
} 

function comparePoloniexBittrex(poloniexData, bittrexData, basecoin, coins) {

  let timeStamp = new Date();
  var poloJSON = JSON.parse(poloniexData.exchangeData);
  coins.forEach(coin => {
    var bittrexJSON = JSON.parse(bittrexData[coin].exchangeData);
    console.log(`${timeStamp}: PoloTime-BittrexTime: ${poloniexData.timeStamp.getTime()-bittrexData[coin].timeStamp.getTime()}.`);
    comparePoloBittrexCcyPair(poloJSON, bittrexJSON, basecoin, coin);
  });
}

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

function comparePoloniexBittrexMktElement(poloJSON, bittrexJSON, poloPair, timeStamp) {

  let poloBuyAt = +poloJSON.lowestAsk;
  let poloSellAt = +poloJSON.highestBid;
  let bittrexSellAt = +bittrexJSON.Bid;
  let bittrexBuyAt = +bittrexJSON.Ask;
  let arbOpportunity = poloSellAt-bittrexBuyAt;
  let arbPercent = 100*(poloSellAt-bittrexBuyAt)/( (poloSellAt+bittrexBuyAt) / 2);
  if(arbPercent > arbReportingThresholdPercent) {
    let msg = `${formatTimestamp(timeStamp)}: Pair: ${poloPair}, Result: GAIN, Desc: ${poloPair}. BUY at Bittrex: bittrexBuyAt, ${bittrexBuyAt} SELL Polo at, ${poloSellAt}, Gain, ${arbOpportunity.toFixed(6)}, ${arbPercent.toFixed(6)}%`;
    console.log(msg);
    if (arbPercent > arbEmailThresholdPercent) {
      let msgBody = `${poloPair}\n\n${poloPair} BUY at Bittrex for ${bittrexBuyAt}.  Sell at Poloniex for ${poloSellAt}\n`;
      SendMessage(`${poloPair}: BUY at Bittrex and SELL at Poloniex`, msgBody);
    }
  }
  else {
    console.log(`${formatTimestamp(timeStamp)}: Pair: ${poloPair}, Result: LOSS, Desc: bittrexBuyAt, ${bittrexBuyAt} is greater than poloSellAt, ${poloSellAt}. DIFF, ${arbOpportunity.toFixed(6)}`);
  }
  arbOpportunity = bittrexSellAt-poloBuyAt;
  arbPercent = 100*(bittrexSellAt-poloBuyAt)/( (bittrexSellAt+poloBuyAt) / 2);
  if(arbPercent > arbReportingThresholdPercent) {
    let msg = `${formatTimestamp(timeStamp)}: Pair: ${poloPair}, Result: GAIN, Desc: ${poloPair}. BUY at Polo: poloBuyAt, ${poloBuyAt} SELL Bittrex at, ${bittrexSellAt}, Gain, ${arbOpportunity.toFixed(6)}, ${arbPercent.toFixed(6)}%`;
    console.log(msg);
    if (arbPercent > arbEmailThresholdPercent) {
      let msgBody = `${poloPair}\n\n${poloPair} BUY at Polo for ${poloBuyAt}.  Sell at Bittrex for ${bittrexSellAt}`;
      SendMessage(`${poloPair}: BUY at Poloniex and SELL at Bittrex`, msgBody);
    }
  }
  else {
    console.log(`${formatTimestamp(timeStamp)}: Pair: ${poloPair}, Result: LOSS, Desc: poloBuyAt, ${poloBuyAt} is greater than bittrexSellAt, ${bittrexSellAt}. DIFF, ${arbOpportunity.toFixed(6)}`);
  }
}

function poloMktFromBittrexName(bittrexMktName) {
  return(bittrexMktName.replace("-", "_"));
}

export {comparePoloniexCoinbase, compareAllPoloniexBittrex};
