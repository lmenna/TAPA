/* comparePricingData.js
 * Consolidates function to compare crypto markets looking for significant arbitrage opportunities.
 * Sends notifications when large arbitrage is detected.
 */

import {SendMessage} from "./sendEMail";
import {updateResultsInMongo, writeResultsToMongoSync} from "./dbUtils";
import {getExchangeMktDepth} from "./getCryptoData";

// Set this to be a clear trading opportunity
const arbEmailThresholdPercent = 1.25;
// Set this to be the fees associated with trading
const arbReportingThresholdPercent = 0.0;
// Control output to DB
let dbWriteEnabled = true;
// Control reported output
let reportLoses = false;
// Control activation of new features
let orderBookOn = false;
// mongoDB - Database and collection
const mongoDBName = "crypto";
const mongoDBCollection = "marketdata.arbmon-p";
const mongoDBCollectionHist = "marketdata.arbmonhist-p";

/* formatTimestamp
 * desc: Simple utility to truncate the output of long time stamps to include only the date and time parts.
 */
function formatTimestamp(timeStamp: Date) {
  return(timeStamp.toString().slice(0,25));
}

/* comparePoloniexCoinbase
 * desc: Main function called to compare the Poloniex and Coinbase crypto markets.
 *       This function is exported and called be app.js
 */
function comparePoloniexCoinbase(poloData: any, cbData: any, coin: string) {

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
function compareCurrencyPair(timeStamp: Date, poloJSON: any, cbJSON: any, ccy1: string, ccy2: string) {
  let poloPair = ccy1+"_"+ccy2;
  let poloBuyAt = +poloJSON[poloPair].lowestAsk;
  let poloSellAt = +poloJSON[poloPair].highestBid;
  let coinbaseSellAt = +cbJSON.bids[0][0];
  let coinbaseBuyAt = +cbJSON.asks[0][0];
  outputArbResults(poloBuyAt, poloSellAt, "Poloniex", coinbaseSellAt, coinbaseBuyAt, "Coinbase", poloPair, timeStamp);
 }

 /* compareAllPoloniexBittrex
  * desc: Takes the poloniex and bittrex data in JSON format and compares all overlaping markets for arbitrage.
  *       Exported function called by the main app.js
  */
function compareAllPoloniexBittrex(poloJSON: any, bittrexJSON: any) {

  let reportingTimestamp = new Date();
  let poloAllMarkets = JSON.parse(poloJSON.exchangeData);
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
function comparePoloniexBittrexMktElement(poloJSON: any, bittrexJSON: any, poloPair: string, timeStamp: Date) {

  let poloBuyAt = +poloJSON.lowestAsk;
  let poloSellAt = +poloJSON.highestBid;
  let bittrexSellAt = +bittrexJSON.Bid;
  let bittrexBuyAt = +bittrexJSON.Ask;
  outputArbResults(poloBuyAt, poloSellAt, "Poloniex", bittrexSellAt, bittrexBuyAt, "Bittrex", poloPair, timeStamp);
}

async function outputArbResults(exch1BuyAt: number, exch1SellAt: number, exch1Name: string, 
  exch2SellAt: number, exch2BuyAt: number, exch2Name: string, 
  ccyPair: string, timeStamp: Date) {

  let dbOutput = {
    key: "",
    exch1Name,
    exch2Name,
    timeStamp: timeStamp.toString().slice(0,25),
    ccyPair,
    exch1BuyAt,
    exch1SellAt,
    exch2BuyAt,
    exch2SellAt,
    gainLoss: "LOSS",
    urgentTrade: false,
    arbPercent: 0,
    exch1BuyOrSell: "",
    tradeInstructions: "",
    time: Math.round(new Date().getTime()/1000)
  };
 // Check for case of Buy at Exchange2 and Sell at Exchange1
  let arbOpportunity = exch1SellAt-exch2BuyAt;
  let arbPercent = 100*(exch1SellAt-exch2BuyAt)/( (exch1SellAt+exch2BuyAt) / 2);
  dbOutput.arbPercent = arbPercent;
  dbOutput.exch1BuyOrSell = "Sell";
  if(arbPercent > arbReportingThresholdPercent) {
    dbOutput.gainLoss = "GAIN";
    dbOutput.tradeInstructions = `${ccyPair} BUY at ${exch2Name} for ${exch2BuyAt.toFixed(9)}. SELL at ${exch1Name} for ${exch1SellAt.toFixed(9)} Gain ${arbPercent.toFixed(6)}%`;
    console.log(dbOutput.gainLoss, ": ", dbOutput.tradeInstructions);
    if (arbPercent > arbEmailThresholdPercent) {
      dbOutput.urgentTrade = true;
      SendMessage(`${ccyPair}: BUY at ${exch2Name} and SELL at ${exch1Name}`, dbOutput.tradeInstructions);
    }
  }
  else { 
    dbOutput.gainLoss = "LOSS";
    dbOutput.urgentTrade = false;
    dbOutput.tradeInstructions = `${ccyPair} BUY at ${exch2Name} for ${exch2BuyAt.toFixed(9)}. SELL at ${exch1Name} for ${exch1SellAt.toFixed(9)} Loss ${arbPercent.toFixed(6)}%`;
    if (reportLoses) {
      console.log(`${formatTimestamp(timeStamp)}: Pair: ${ccyPair}, Result: LOSS, Desc: ${exch2Name}, ${exch2BuyAt.toFixed(8)} is greater than SellAt, ${exch1SellAt.toFixed(8)}, DIFF, ${arbOpportunity.toFixed(6)}`);
    }
  }
  let keyStr = "Buy"+exch2Name+"Sell"+exch1Name+ccyPair;
  let key = {
    "key": keyStr
  };
  dbOutput.key = keyStr;
  if (dbWriteEnabled) {
    await updateResultsInMongo(key, dbOutput, mongoDBName, mongoDBCollection);
    if (dbOutput.urgentTrade) {
      dbOutput.key += new Date().getTime();
      await writeResultsToMongoSync(dbOutput, mongoDBName, mongoDBCollectionHist);
    }
  }
  // Check for case of Buy at Exchange1 and Sell at Exchange2
  arbOpportunity = exch2SellAt-exch1BuyAt;
  arbPercent = 100*(exch2SellAt-exch1BuyAt)/( (exch2SellAt+exch1BuyAt) / 2);
  dbOutput.arbPercent = arbPercent;
  dbOutput.exch1BuyOrSell = "Buy";
  if(arbPercent > arbReportingThresholdPercent) {    
    dbOutput.gainLoss = "GAIN";
    dbOutput.tradeInstructions = `${ccyPair} BUY at ${exch1Name} for ${exch1BuyAt.toFixed(9)}. SELL ${exch2Name} for ${exch2SellAt.toFixed(9)} Gain ${arbPercent.toFixed(6)}%`;
    console.log(dbOutput.gainLoss, ": ", dbOutput.tradeInstructions);
    // Experimental code
    if(orderBookOn) {
      await outputOrderBook(exch1Name, ccyPair, "buy");
      await outputOrderBook(exch2Name, ccyPair, "sell");
    }
    if (arbPercent > arbEmailThresholdPercent) {
      dbOutput.urgentTrade = true;
      SendMessage(`${ccyPair}: BUY at ${exch1Name} and SELL at ${exch2Name}`, dbOutput.tradeInstructions);
    }
  }
  else {
    dbOutput.gainLoss = "LOSS";
    dbOutput.urgentTrade = false;
    dbOutput.tradeInstructions = `${ccyPair} BUY at ${exch1Name} for ${exch1BuyAt.toFixed(9)} SELL ${exch2Name} for ${exch2SellAt.toFixed(9)} Loss ${arbPercent.toFixed(6)}%`;
    if (reportLoses) {
      console.log(`${formatTimestamp(timeStamp)}: Pair: ${ccyPair}, Result: LOSS, Desc: BuyAt, ${exch1BuyAt.toFixed(9)} is greater than ${exch2Name}SellAt, ${exch2SellAt.toFixed(8)}. DIFF, ${arbOpportunity.toFixed(7)}`);
    }
  }
  keyStr = "Buy"+exch1Name+"Sell"+exch2Name+ccyPair;
  key = {
    "key": keyStr
  };
  dbOutput.key = keyStr;
  if (dbWriteEnabled) {
    await updateResultsInMongo(key, dbOutput, mongoDBName, mongoDBCollection);
    if (dbOutput.urgentTrade) {
      dbOutput.key += new Date().getTime();
      await writeResultsToMongoSync(dbOutput, mongoDBName, mongoDBCollectionHist);
    }
  }
}

async function outputOrderBook(exchangeName: string, ccyPair: string, exch1BuyOrSell: string) {

  if (exchangeName==="Poloniex") {
    const orderBook = await getExchangeMktDepth("poloniex", ccyPair);
    let exchangeData = JSON.parse(orderBook.exchangeData);
    let mktSide = (exch1BuyOrSell==="buy") ? "asks": "bids";
    let orders: Array<any> = exchangeData[mktSide];
    orders.forEach((value) => {
      console.log(`${exchangeName} ${ccyPair} price: ${value[0]} size: ${value[1]}`);
    });
    console.log(`poloniex: ${ccyPair} ${exchangeData["asks"]}`);
  }
  else if (exchangeName==="Bittrex"){
    const orderBook = await getExchangeMktDepth("bittrex", bittrexMktFromPoloName(ccyPair));
    let exchangeData = JSON.parse(orderBook.exchangeData);
    let mktSide = (exch1BuyOrSell==="buy") ? "sell": "buy";
    let orders: Array<any> = exchangeData["result"][mktSide];
    orders.forEach((value, idx) => {
      console.log(`bittrex: ${ccyPair} ${value.Rate} ${value.Quantity}`);
    });
  }
}

/* poloMktFromBittrexName
 * desc: Converts a Bittrex crypto currency pair into the Poloniex pair.
 */
function poloMktFromBittrexName(bittrexMktName: string): string {
  if(bittrexMktName==="BTC-XLM")
    return("BTC_STR");
  if(bittrexMktName==="USDT-XLM")
    return("USDT_STR");    
  return(bittrexMktName.replace("-", "_"));
}


/* bittrexMktFromPoloName
 * desc: Converts a Bittrex crypto currency pair into the Poloniex pair.
 */
function bittrexMktFromPoloName(poloMktName: string): string {
  if(poloMktName==="BTC_STR")
    return("BTC-XLM");
  if(poloMktName==="USDT_STR")
    return("USDT-XLM");    
  return(poloMktName.replace("_","-"));
}

/* compareAllPoloniexHitbtc
*  desc: Takes the poloniex and hitbtc data in JSON format and compares all overlaping markets for arbitrage.
*       Exported function called by the main app.js
*/
function compareAllPoloniexHitbtc(poloJSON: any, hitbtcJSON: any) {
  
  let reportingTimestamp = new Date();
  let poloAllMarkets = JSON.parse(poloJSON.exchangeData);
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
function comparePoloniexHitbtcMktElement(poloMktElement: any, hitbtcMktElement: any, poloMktName: string, reportingTimestamp: Date) {

  let poloBuyAt = +poloMktElement.lowestAsk;
  let poloSellAt = +poloMktElement.highestBid;
  let hitbtcSellAt = +hitbtcMktElement.bid;
  let hitbtcBuyAt = +hitbtcMktElement.ask;
  if (!hitbtcSellAt || !hitbtcBuyAt) {
    console.log("Got bad rates from the hitbtc for:", poloMktName);
    return;
  }
  outputArbResults(poloBuyAt, poloSellAt, "Poloniex", hitbtcSellAt, hitbtcBuyAt, "Hitbtc", poloMktName, reportingTimestamp);
}

/* poloMktFromHitbtcName
 * desc: Maps from Hitbtc tickers to Poloniex tickers.
 */
function poloMktFromHitbtcName(hitbtcMktName: string): string {

  const poloMktNames: any = {
    BCNBTC:   "BTC_BCN",
    DASHBTC:   "BTC_DASH",
    DOGEBTC:   "BTC_DOGE",
    ETHBTC:   "BTC_ETH",
    LSKBTC:   "BTC_LSK",
    LTCBTC:   "BTC_LTC",
    NXTBTC:   "BTC_NXT",
    SBDBTC:   "BTC_SBD",
    SCBTC:   "BTC_SC",
    STEEMBTC:   "BTC_STEEM",
    XEMBTC:   "BTC_XEM",
    XMRBTC:   "BTC_XMR",
    ARDRBTC:   "BTC_ARDR",
    ZECBTC:   "BTC_ZEC",
    MAIDBTC:   "BTC_MAID",
    REPBTC:   "BTC_REP",
    ETCBTC:   "BTC_ETC",
    BNTBTC:   "BTC_BNT",
    SNTETH:   "ETH_SNT",
    OMGETH:   "ETH_OMG",
    ETCETH:   "ETH_ETC",
    ZECETH:   "ETH_ZEC",
    XRPBTC:   "BTC_XRP",
    STRATBTC:   "BTC_STRAT",
    EOSETH:   "ETH_EOS",
    EOSBTC:   "BTC_EOS",
    BNTETH:   "ETH_BNT",
    ZRXBTC:   "BTC_ZRX",
    ZRXETH:   "ETH_ZRX",
    PPCBTC:   "BTC_PPC",
    QTUMETH:   "ETH_QTUM",
    DGBBTC:   "BTC_DGB",
    OMGBTC:   "BTC_OMG",
    SNTBTC:   "BTC_SNT",
    XRPUSDT:   "USDT_XRP",
    MANAETH:   "ETH_MANA",
    MANABTC:   "BTC_MANA",
    QTUMBTC:   "BTC_QTUM",
    LSKETH:   "ETH_LSK",
    REPETH:   "ETH_REP",
    REPUSDT:   "USDT_REP",
    GNTBTC:   "BTC_GNT",
    GNTETH:   "ETH_GNT",
    BTSBTC:   "BTC_BTS",
    BATBTC:   "BTC_BAT",
    BATETH:   "ETH_BAT",
    BCHABCBTC:   "BTC_BCHABC",
    BCHSVBTC:   "BTC_BCHSV",
    NMRBTC:   "BTC_NMR",
    POLYBTC:   "BTC_POLY",
    STORJBTC:   "BTC_STORJ"
  };
  return(poloMktNames[hitbtcMktName]);
}

/* compareAllBittrexHitbtc
*  desc: Takes the bittrex and hitbtc data in JSON format and compares all overlaping markets for arbitrage.
*       Exported function called by the main app.js
*/
function compareAllBittrexHitbtc(bittrexJSON: any, hitbtcJSON: any) {
  
  let reportingTimestamp = new Date();
  let bittrexTimestamp = bittrexJSON.timeStamp;
  let bittrexAllMarkets = JSON.parse(bittrexJSON.exchangeData).result;
  let hitbtcTimestamp = hitbtcJSON.timeStamp;
  let hitbtcAllMarkets = JSON.parse(hitbtcJSON.exchangeData);
  console.log("In compareAllBittrexHitbtc");
  console.log(bittrexTimestamp);
  console.log(hitbtcTimestamp);
  bittrexAllMarkets.forEach( (bittrexMktElem: any) => {
    let hitbtcMktName = hitBtcMktFromBittrexName(bittrexMktElem.MarketName);
    let hitbtcMkt = hitbtcAllMarkets.filter((item: any) => {
      return(item.symbol===hitbtcMktName);
    });
    if(hitbtcMkt.length!=0) {
      let badMakerts = ["BTC-BCH", "ETH-BCH", "USD-BCH", "BTC-BITS", "BTC-XDN", "BTC-SWT"];
        // let badMakerts = ["BTC-BCH", "ETH-BCH", "USD-BCH", "BTC-BITS", "BTC-SPC", "BTC-SWT", "BTC-CMCT",
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
function compareBittrexHitbtcMktElement(bittrexMktElement: any, hitbtcMktElement: any, bittrexMktName: string, reportingTimestamp: Date) {

  let bittrexBuyAt = +bittrexMktElement.Ask;
  let bittrexSellAt = +bittrexMktElement.Bid;
  let hitbtcSellAt = +hitbtcMktElement.bid;
  let hitbtcBuyAt = +hitbtcMktElement.ask;
  if (!hitbtcSellAt || !hitbtcBuyAt) {
    console.log("Got bad rates from the hitbtc for:", bittrexMktName);
    return;
  }
  if (!bittrexBuyAt || !bittrexSellAt) {
    console.log("Got bad rates from the bittrex for:", bittrexMktName);
    return;
  }
  outputArbResults(bittrexBuyAt, bittrexSellAt, "Bittrex", 
    hitbtcSellAt, hitbtcBuyAt, "Hitbtc", bittrexMktName, reportingTimestamp);
}

/* hitBtcMktFromBittrexName
 * desc: Maps from Bittrex tickers to Hitbtc tickers.
 */
function hitBtcMktFromBittrexName(bittrexMktName: string): string {

    let splitTicker = bittrexMktName.split("-");
    return(splitTicker[1]+splitTicker[0]);
}


/* compareAllPoloniexYobit
 * desc: Compares market data across many currency pairs between Poloniex and Yobit.
 *       Note that Yobit oftens has large prcie discrepencies but the wallets for thos coins
 *       are deactivated.  So you can't generate a profit.
 */
function compareAllPoloniexYobit(poloData: any, yobitData: any) {

  let reportingTimestamp: Date = new Date();
  let poloTimestamp: Date = poloData.timeStamp;
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
function comparePoloniexYobitMktElement(poloMktElement: any, yobitMktElement: any, poloMktName: any, reportingTimestamp: Date) {

  let poloBuyAt = +poloMktElement.lowestAsk;
  let poloSellAt = +poloMktElement.highestBid;
  let yobitSellAt = +yobitMktElement.sell;
  let yobitBuyAt = +yobitMktElement.buy;
  outputArbResults(poloBuyAt, poloSellAt, "Poloniex", yobitSellAt, yobitBuyAt, "Yobit", poloMktName, reportingTimestamp);
}

/* poloMktFromYobitName
 * desc: Maps from Yobit tickers to Poloniex tickers.
 */
function poloMktFromYobitName(yobitMktName: string): string {

  const poloMktNames: any = {
    ltc_btc:  "BTC_LTC",
    nmc_btc:  "BTC_NMC",
    nmr_btc:  "BTC_NMR",
    eth_btc:  "BTC_ETH"
  };
  return(poloMktNames[yobitMktName]);
}


async function internalCompareForYobit(mktData : any, yobitMarkets : Array<string>, baseMarkets : Array<string>) {

  let timeStamp = new Date();
  for(let i=0; i<yobitMarkets.length; i++) {
    let curMkt1: string = yobitMarkets[i] + "_" + baseMarkets[0];
    let curMkt2: string = yobitMarkets[i] + "_" + baseMarkets[1];
    let basePair: string = baseMarkets[1] + "_" + baseMarkets[0];
    let arbFraction: number = mktData[basePair].buy * mktData[curMkt2].buy / mktData[curMkt1].sell;
    console.log("Arb Fraction for ", yobitMarkets[i], ": ", arbFraction.toFixed(6));
    let keyStr = "YobitInternal_" + curMkt1 + "_" + baseMarkets[1];
    let dbOutput = {
      key: keyStr,
      exch1Name: "Yobit",
      exch2Name: "Yobit",
      timeStamp: timeStamp.toString().slice(0,25),
      ccyPair: curMkt1,
      exch1BuyAt: mktData[curMkt1].sell,
      exch1SellAt: 0,
      exch2BuyAt: 0,
      exch2SellAt: mktData[curMkt2].buy,
      gainLoss: "Loss",
      urgentTrade: false,
      arbPercent: arbFraction,
      exch1BuyOrSell: "Buy",
      tradeInstructions: "",
    };
    if (arbFraction > 1) {
      dbOutput.gainLoss = "Gain";
      console.log("  ---> Gain", timeStamp.toString().slice(0,25), " ", arbFraction.toFixed(8), 
        "Buy ", yobitMarkets[i], " with BTC at", mktData[curMkt1].sell,
        "sell the", yobitMarkets[i], "for", mktData[curMkt2].buy, 
        "to get ETH. Convert ETH back to BTC at", mktData[basePair].buy);
      if (arbFraction > 1.005) {
        dbOutput.urgentTrade = true;
      }
    }
    dbOutput.key = keyStr;
    let key: any = {
      "key": keyStr
    };
    if (dbWriteEnabled) {
      await updateResultsInMongo(key, dbOutput, mongoDBName, mongoDBCollection);
    }    
  }
}

function compareAllPoloniexBinance(poloniexData: any, binanceData: any) {

  // Array of strings containing the poloniex markets to exclude from the compare
  const excludeList:Array<string> = ["BTC_BCN"];
  const poloJSON = JSON.parse(poloniexData.exchangeData);
  const binanceJSON = JSON.parse(binanceData.exchangeData);
  binanceJSON.forEach( (binanceElement: any) => {
    const poloTicker = getPoloTickerFromBinance(binanceElement.symbol);
    if(poloJSON[poloTicker] && excludeList.indexOf(poloTicker)===-1) {
      comparePoloniexBinanceMktElement(poloJSON[poloTicker], binanceElement, poloTicker, new Date());
   }
  });
}

function getPoloTickerFromBinance(binanceTicker : string): string {

  // Special cases
  if(binanceTicker==="XLMBTC")
    return("BTC_STR");
  if(binanceTicker==="XLMETH")
    return("ETH_STR");     
  let poloTicker = "";
  const baseTickers = ["BTC", "ETH", "USDC", "USDT"];
  for(let baseIdx = 0; baseIdx<baseTickers.length; baseIdx++) {
    const baseTickerFound = binanceTicker.search(baseTickers[baseIdx]);
    if (baseTickerFound >= 2) {
      const secondaryTicker = binanceTicker.slice(0, baseTickerFound);
      poloTicker = `${baseTickers[baseIdx]}_${secondaryTicker}`;
      break;
    }  
  }
  return(poloTicker);
}


/* comparePoloniexBinanceMktElement
 * desc: Pulls out the buy and sell prices for a single currency pair for Poloniex and Yobit.
 *       Forwards this to the output method to record the arbitrage results.
 */
function comparePoloniexBinanceMktElement(poloMktElement: any, binanceMktElement: any, poloMktName: any, reportingTimestamp: Date) {

  let poloBuyAt = +poloMktElement.lowestAsk;
  let poloSellAt = +poloMktElement.highestBid;
  let binanceSellAt = +binanceMktElement.bidPrice;
  let binanceBuyAt = +binanceMktElement.askPrice;
  outputArbResults(poloBuyAt, poloSellAt, "Poloniex", binanceSellAt, binanceBuyAt, "Binance", poloMktName, reportingTimestamp);
}


export {comparePoloniexCoinbase, compareAllPoloniexBittrex, compareAllPoloniexHitbtc, compareAllBittrexHitbtc,
  compareAllPoloniexYobit, internalCompareForYobit, compareAllPoloniexBinance};
