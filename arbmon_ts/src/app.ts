/* app.ts
 * desc: Main entry point for the crypto exchange price arbitrage monitor.  The event loop that controls
 *       reading exchange data runs from here.  As data is loaded from exchanges it gets passed into
 *       comparPricingResults.js to see if there are any market opportunities.
 */

require("@babel/polyfill");

import {getExchangeMkt, getDataFromURL, getExchangeMktDepth} from "./utils/getCryptoData";
import {comparePoloniexCoinbase, compareAllPoloniexBittrex, compareAllPoloniexHitbtc, compareAllBittrexHitbtc,
  compareAllPoloniexYobit, internalCompareForYobit, compareAllPoloniexBinance} from "./utils/comparePricingData";

let XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

const timeInSecondsBetweenPriceChecks = 15;

const poloniexURL: string = "https://poloniex.com/public?command=returnTicker"; 
const coinbaseURL: string = "https://api.pro.coinbase.com/products"; 
const yobitBaseURL: string = "https://yobit.net/api/3/ticker/"
const threshold: number = 1.01;
let numberOfChecks: number = 0;
let intervalHandel: number = -1;
let maxBuyArb: number = 0;
let maxSellArb: number = 0;
let maxSellArbETH: number = 0;
let maxSellArbXMR: number = 0;

/* formatTimestamp
 * desc: Utility to truncate the output of long time stamps to include only the date and time parts.
 */
function formatTimestamp(timeStamp: Date) {
  return(timeStamp.toString().slice(0,25));
}

/* poloInternalCompare
 * desc: Looks for arbitrage profits from scenarios where a coin1 is exchanged for coin2, coin2 exchanged for coin3 and then 
 *       coin3 exchanged back into coin1.
 *       This compare looks only within the Poloniex exchange.
*/
async function poloInternalCompare() {

  console.log("BEGIN: poloInternalCompare");
  try {
    let poloniexData = await getExchangeMkt("poloniex");
    numberOfChecks++;
    let timeStamp = new Date();
    let exchangeObject = JSON.parse(poloniexData.exchangeData);
    let coins = ["FOAM", "ZEC", "LTC", "ETH", "XRP", "STR", "XMR", "DOGE", "BCHABC", "BCHSV"];
    let baseStableCoin = "USDC";
    analyzePoloBTCPrices(exchangeObject, baseStableCoin, coins, timeStamp);
    coins = ["BAT", "BNT", "DASH", "DOGE", "EOS", "ETC", "ETH", "GNT", "KNC", "LOOM", "LSK",
      "LTC", "MANA", "NXT", "QTUM", "REP", "SC", "SNT", "STR", "XMR", "XRP", "ZEC", "ZRX"];
    baseStableCoin = "USDT"; 
    analyzePoloBTCPrices(exchangeObject, baseStableCoin, coins, timeStamp);
    analyzePoloETHPrices(exchangeObject, timeStamp);
    analyzePoloXMRPrices(exchangeObject, timeStamp);
  }
  catch(err) {
    console.log("Error getting Poloniex market data.");
    console.log(err);
  }
  console.log("END: poloInternalCompare");
}


/* analyzePoloBTCPrices
 * desc: Takes the exchange prices from Poloniex and does the detailed compares to find arbitrage
 *       within this exchange.  It does this for the BTC market.
 */
function analyzePoloBTCPrices(exchangePrices: any, baseStableCoin: 
  string, coins: Array<string>, timeStamp: Date) {

  let timeStampStr = timeStamp.getTime();
  console.log(`priceCheckCount:${numberOfChecks}|${baseStableCoin}|maxBuyArb:${maxBuyArb}|maxSellArb:${maxSellArb}`);
  // Check if buying the coin will be profitable.
  coins.forEach(curCoin => {
    let lowestAskBTC = exchangePrices["BTC_" + curCoin].lowestAsk;
    let highestBidUSDC = exchangePrices[baseStableCoin + "_" + curCoin].highestBid;
    let USDC_BTClowestAsk = exchangePrices[baseStableCoin + "_" + "BTC"].lowestAsk;
    let ArbRatio = highestBidUSDC / ( lowestAskBTC *  USDC_BTClowestAsk);
    let showMax = "";
    if (ArbRatio>maxBuyArb) {
      maxBuyArb = ArbRatio;
      showMax = "NewMax";
    }
    if (ArbRatio>1.0)
      console.log(`REC|${timeStamp}|${timeStampStr}|Buy|${baseStableCoin}|${curCoin}|ArbRatio:${ArbRatio}|${showMax}`);
    if (ArbRatio > threshold) {
      console.log("Something needs to happen!");
    }
  });
  // Check if selling the coin will be profitable
  coins.forEach(curCoin => {
    let BTC_curCoinBid = exchangePrices["BTC_"+curCoin].highestBid;
    let USDC_BTCBid = exchangePrices[baseStableCoin + "_" + "BTC"].highestBid;
    let USDC_curCoinAsk = exchangePrices[baseStableCoin + "_" +curCoin].lowestAsk;
    let AmtInit = 10000;
    let AmtFinal = AmtInit*BTC_curCoinBid*USDC_BTCBid/USDC_curCoinAsk;
    let ArbRatio = AmtFinal/AmtInit;
    let showMax = "";
    if (ArbRatio>maxSellArb) {
      maxSellArb = ArbRatio;
      showMax = "NewMax";
    }
    if (ArbRatio>1.0)
      console.log(`REC|${timeStamp}|${timeStampStr}|Sell|${baseStableCoin}|${curCoin}|ArbRatio:${ArbRatio}|${showMax}`);
    if (ArbRatio > threshold) {
      console.log("Something needs to happen!");
    }
  });
}

/* analyzePoloETHPrices
 * desc: Takes the exchange prices from Poloniex and does the detailed compares to find arbitrage
 *       within this exchange for their ETH market.
 */
function analyzePoloETHPrices(exchangePrices: any, timeStamp: Date) {

  let timeStampStr = timeStamp.getTime();
  console.log(`priceCheckCount:${numberOfChecks}|ETH|maxBuyArb:N/A|maxSellArbETH:${maxSellArbETH}`);
  let coins = ["BAT", "BNT", "CVC", "EOS", "ETC", "GAS", "GNT", "KNC", "LOOM", "LSK", 
    "MANA", "OMG", "QTUM", "REP", "SNT", "STEEM", "ZEC", "ZRX"];
  // Check if selling the coin will be profitable
  coins.forEach(curCoin => {
    let ETH_curCoinBid = exchangePrices["ETH_"+curCoin].highestBid;
    let BTC_ETHBid = exchangePrices["BTC_ETH"].highestBid;
    let BTC_curCoinAsk = exchangePrices["BTC_"+curCoin].lowestAsk;
    let AmtInit = 1;
    let AmtFinal = AmtInit*BTC_ETHBid*ETH_curCoinBid/BTC_curCoinAsk;
    let ArbRatio = AmtFinal/AmtInit;
    let showMax = "";
    if (ArbRatio>maxSellArbETH) {
      maxSellArbETH = ArbRatio;
      showMax = "NewMax";
    }
    if (ArbRatio>1.0)
      console.log(`REC|${timeStamp}|${timeStampStr}|Sell|${curCoin}|ETH|ArbRatio:${ArbRatio}|${showMax}`);
    if (ArbRatio > threshold) {
      let instructions = `ALERT: Sell ${AmtInit} ${curCoin} for ${AmtInit*ETH_curCoinBid} ETH, 
        then sell those ETH for ${AmtInit*ETH_curCoinBid*BTC_ETHBid} BTC,
        then use those BTC to buy ${AmtFinal} ${curCoin}`;
      console.log(instructions);
    }
  });
}

/* analyzePoloXMRPrices
 * desc: Takes the exchange prices from Poloniex and does the detailed compares to find arbitrage
 *       within this exchange for their XRM market.
 */
function analyzePoloXMRPrices(exchangePrices: any, timeStamp: Date) {

  let timeStampStr = timeStamp.getTime();
  console.log(`priceCheckCount:${numberOfChecks}|XMR|maxBuyArb:N/A|maxSellArbXMR:${maxSellArbXMR}`);
  let coins = ["LTC", "ZEC", "NXT", "DASH", "BCN", "MAID"];
  // Check if selling the coin will be profitable
  coins.forEach(curCoin => {
    let baseMarket = "XMR";
    let baseMarket_curCoinBid = exchangePrices[baseMarket + "_" + curCoin].highestBid;
    let BTC_baseMarketBid = exchangePrices["BTC" + "_" + baseMarket].highestBid;
    let BTC_curCoinAsk = exchangePrices["BTC" + "_" + curCoin].lowestAsk;
    let AmtInit = 1;
    let AmtFinal = AmtInit*BTC_baseMarketBid*baseMarket_curCoinBid/BTC_curCoinAsk;
    let ArbRatio = AmtFinal/AmtInit;
    let showMax = "";
    if (ArbRatio>maxSellArbXMR) {
      maxSellArbXMR = ArbRatio;
      showMax = "NewMax";
    }
    if (ArbRatio>1.0)
      console.log(`REC|${timeStamp}|${timeStampStr}|Sell|${curCoin}|XMR|ArbRatio:${ArbRatio}|${showMax}`);
    if (ArbRatio > threshold) {
      let instructions = `ALERT: Sell ${AmtInit} ${curCoin} for ${AmtInit*baseMarket_curCoinBid} XMR, 
        then sell those XMR for ${AmtInit*BTC_baseMarketBid*baseMarket_curCoinBid} BTC,
        then use those BTC to buy ${AmtFinal} ${curCoin}`;
      console.log(instructions);
    }
  });
}

async function runPoloCoinbaseCompare() {
  let poloniexData = await getExchangeMkt("poloniex");
  let coinbaseDataZEC = await getDataFromURL(coinbaseURL+"/ZEC-USDC/book");
  let coinbaseDataETH = await getDataFromURL(coinbaseURL+"/ETH-USDC/book");
  let coinbaseDataBTC = await getDataFromURL(coinbaseURL+"/BTC-USDC/book");
  comparePoloniexCoinbase(poloniexData, coinbaseDataZEC, "ZEC");
  comparePoloniexCoinbase(poloniexData, coinbaseDataETH, "ETH");
  comparePoloniexCoinbase(poloniexData, coinbaseDataBTC, "BTC");
}

async function runPoloBittrexCompare() {

  numberOfChecks++;
  console.log(`------>>> Begin compare cycle: ${numberOfChecks}.`)
  // Get market data from the exchanges
  try {
    let [poloniexData, bittrexALL] = await Promise.all([getExchangeMkt("poloniex"), getExchangeMkt("bittrex")]);
    console.log(`poloTimestamp:    ${formatTimestamp(poloniexData.timeStamp)}`);
    console.log(`bittrexTimestamp: ${formatTimestamp(bittrexALL.timeStamp)}`);
    console.log(`Diff: ${Math.abs(poloniexData.timeStamp - bittrexALL.timeStamp)}ms`);
    let bittrexJSON: any = JSON.parse(bittrexALL.exchangeData);
    let bittrexBTCCoins: any = {
      BTC: ["ARDR","BAT","BNT","BURST","CVC","DASH","DCR","DGB","DOGE","ETC","ETH","FCT","GAME",
        "GNT","LBC","LOOM","LSK","LTC","MANA","NAV","NMR","NXT","OMG","POLY","PPC","QTUM","REP","SBD",
        "SC","SNT","STEEM","STORJ","STRAT","SYS","VIA","VTC","XCP","XEM","XMR","XRP","ZEC","ZRX"],
      ETH: ["BAT","BNT","CVC","ETC","GNT","MANA","OMG","QTUM","REP","SNT","ZEC","ZRX"],
      USDT: ["BAT","BTC","DASH","DOGE","ETC","ETH","LTC","NXT","SC","XMR","XRP","ZEC","ZRX"]
    };
    // Prcoess each base market seperately.
    let baseMarkets = ["BTC", "ETH", "USDT"];
    baseMarkets.forEach((baseMkt: string) => {
      let bittrexTrimmed: any = {};
      bittrexJSON.result.forEach((market: any) => {
        bittrexBTCCoins[baseMkt].forEach((coin: string) => {
          let MarketName = baseMkt+"-"+coin.toUpperCase();
          if (market.MarketName===MarketName) {
            bittrexTrimmed[MarketName] = market;
          }
        });
      });
      let bittrexCompare: any = {};
      bittrexCompare.timeStamp = bittrexALL.timeStamp;
      bittrexCompare.exchangeData = bittrexTrimmed;
      compareAllPoloniexBittrex(poloniexData, bittrexCompare);
    });
  }
  catch(err) {
    console.log("Error processing Polo Bittrex compare.");
    console.log(err);
  }
}

/* runPoloHitbtcCompare
 * desc: Loads market data from Poloniex and Hitbtc then compares all markets they have in common.
 *       Will be called repeatedly using a setInterval timer.
 */
async function runPoloHitbtcCompare() {

  numberOfChecks++;
  console.log(`------>>> Begin compare cycle: ${numberOfChecks}.`)
  try {
    let [hitbtcData, poloniexData] = await Promise.all([getExchangeMkt("hitbtc"), getExchangeMkt("poloniex")]);
    console.log(`poloTimestamp:   ${formatTimestamp(poloniexData.timeStamp)}`);
    console.log(`hitBtcTimestamp: ${formatTimestamp(hitbtcData.timeStamp)}`);
    console.log(`Diff: ${Math.abs(poloniexData.timeStamp - hitbtcData.timeStamp)}ms`);

    // This is the list of markets shared between Poloniex and Hitbtc.
    let hitbtcMarkets: Array<string> = ["BCNBTC","DASHBTC","DOGEBTC","ETHBTC","LSKBTC","LTCBTC","NXTBTC","SBDBTC"
      ,"SCBTC", "STEEMBTC","XEMBTC","XMRBTC","ARDRBTC","ZECBTC","MAIDBTC","REPBTC","ETCBTC","BNTBTC","SNTETH",
      "OMGETH","ETCETH","ZECETH","XRPBTC","STRATBTC","EOSETH","EOSBTC","BNTETH","ZRXBTC","ZRXETH",
      "PPCBTC","QTUMETH","DGBBTC","OMGBTC","SNTBTC","XRPUSDT","MANAETH",
      "MANABTC","QTUMBTC","LSKETH","REPETH","REPUSDT","GNTBTC","GNTETH","BTSBTC","BATBTC","BATETH","BCHABCBTC",
      "BCHSVBTC","STORJBTC"];

    // Get subset of Hitbtc data only including the markets which overlap with Poloniex
    let hitbtcJSON = JSON.parse(hitbtcData.exchangeData);
    let hitbtcTrimmed: any = {};
    hitbtcMarkets.forEach(market => {
      hitbtcJSON.forEach((exchangeData: any) => {
        if(exchangeData.symbol===market)
          hitbtcTrimmed[market] = exchangeData;
      });     
    });
    let hitbtcCompare: any = {};
    hitbtcCompare.timeStamp = hitbtcData.timeStamp;
    hitbtcCompare.exchangeData = hitbtcTrimmed;
    compareAllPoloniexHitbtc(poloniexData, hitbtcCompare);
  }
  catch(err) {
    console.log("Error in Poloniex Hitbtc compare.");
    console.log(err);
  }
}


/* runPoloBinanceCompare
 * desc: Loads market data from Poloniex and Binance then compares all markets they have in common.
 *       Will be called repeatedly using a setInterval timer.
 */
async function runPoloBinanceCompare() {

  numberOfChecks++;
  console.log(`------>>> Begin compare cycle: ${numberOfChecks}.`)
  try {
    let [binanceData, poloniexData] = await Promise.all([getExchangeMkt("binance"), getExchangeMkt("poloniex")]);
    console.log(`poloTimestamp:   ${formatTimestamp(poloniexData.timeStamp)}`);
    console.log(`binanceTimestamp: ${formatTimestamp(binanceData.timeStamp)}`);
    console.log(`Diff: ${Math.abs(poloniexData.timeStamp - binanceData.timeStamp)}ms`);
    compareAllPoloniexBinance(poloniexData, binanceData);

    // Get subset of Hitbtc data only including the markets which overlap with Poloniex
    // let binanceJSON = JSON.parse(binanceData.exchangeData);
    // let hitbtcTrimmed: any = {};
    // hitbtcMarkets.forEach(market => {
    //   hitbtcJSON.forEach((exchangeData: any) => {
    //     if(exchangeData.symbol===market)
    //       hitbtcTrimmed[market] = exchangeData;
    //   });     
    // });
    // let hitbtcCompare: any = {};
    // hitbtcCompare.timeStamp = hitbtcData.timeStamp;
    // hitbtcCompare.exchangeData = hitbtcTrimmed;
    // 
  }
  catch(err) {
    console.log("Error in Poloniex Binance compare.");
    console.log(err);
  }
}

/* runBittrexHitbtcCompare
 * desc: Loads market data from Bittrex and Hitbtc then compares all markets they have in common.
 *       Will be called repeatedly using a setInterval timer.
 */
async function runBittrexHitbtcCompare() {

  numberOfChecks++;
  // Get market data from the two exchanges.
  let hitbtcData = await getExchangeMkt("hitbtc");  
  let bittrexData = await getExchangeMkt("bittrex");
  compareAllBittrexHitbtc(bittrexData, hitbtcData);
}


async function runPoloYobitCompare() {

  numberOfChecks++;
  // Poloniex section - All coins from one request
  let poloniexData = await getExchangeMkt("poloniex");
  // Bittrex section - All coins from one request.
  // Bittrex market summary - All coins from one request.
  let yobitMarkets = [
    "ltc_btc", "eth_btc"
  ];
  let tickerList = "";
  for(let i=0; i<yobitMarkets.length; i++) {
    tickerList += yobitMarkets[i];
    if (i!=yobitMarkets.length-1)
      tickerList += "-";
  }
  let yobitURL = yobitBaseURL + tickerList;
  console.log("Run query for data at:", yobitURL);
  let yobitData = await getDataFromURL(yobitURL);  
  console.log("yobitData:", yobitData);
  compareAllPoloniexYobit(poloniexData, yobitData);
}

/* runYobitInternalCompare
 * desc: Checks intenral prices for the Yobit exchange to see if any cases exist with
 *       the Arb Factor is greater than one.
 */
function runYobitInternalCompare() {

  numberOfChecks++;
  let yobitMarkets = [
      "zec", "lsk", "etc", "ltc", "fto", "edr2", "lbr", "ban", "kin", "nbt",
      "rntb", "bunny", "trx", "kbc", "vrtm", "hur", "noah", "xrp", "doge", 
      "edit", "evn", "exmr", "payp", "yozi", "waves", "nyc",
      "dgb", "dux", "dash"];
  let baseMarkets = [
      "btc", "eth"
    ];
  runYobitBaseMktCompare(baseMarkets, yobitMarkets);
}

async function runYobitBaseMktCompare(baseMarkets: Array<string>, yobitMarkets: Array<string>) {

  // Yobit accepts multiple tickers in the URL using a dash seperated format.
  // Ex. https://yobit.net/api/3/ticker/eth_btc-zec_btc-zec_eth
  //
  // Will return data in the format,
  //
  // {"eth_btc":
  //    {"high":0.03309,"low":0.03235388,"avg":0.03272194,"vol":1008.06706066,"vol_cur":30640.27824728,"last":0.03286274,"buy":0.03278187,"sell":0.03291259,"updated":1548167171},
  //  "zec_btc":
  //    {"high":0.01471407,"low":0.0144448,"avg":0.01457943,"vol":866.12370712,"vol_cur":59191.16379133,"last":0.01459557,"buy":0.01453871,"sell":0.01464882,"updated":1548167168},
  //  "zec_eth":
  //    {"high":0.44859239,"low":0.43719904,"avg":0.44289571,"vol":3.47843354,"vol_cur":7.77771142,"last":0.44859239,"buy":0.44008596,"sell":0.44859238,"updated":1548166052}
  // }

  // Create ticker list in format Yobit will accept.
  let tickerListStr = "";
  for(let i=0; i<yobitMarkets.length; i++) {
    tickerListStr += yobitMarkets[i] + "_" + baseMarkets[0] + "-";
    tickerListStr += yobitMarkets[i] + "_" + baseMarkets[1];
    if (i!=yobitMarkets.length-1)
      tickerListStr += "-";
    else
      tickerListStr += "-" + baseMarkets[1] + "_" + baseMarkets[0];
  }
  let yobitMkt = await getDataFromURL(yobitBaseURL + tickerListStr);  
  try {
    let mktData = JSON.parse(yobitMkt.exchangeData);
    // Analyze Yobit market looking for price anomolies
    internalCompareForYobit(mktData, yobitMarkets, baseMarkets);
  }
  catch(e) {
    console.log("Invalid market data returned from:", yobitBaseURL);
    console.log("Data object returned:", yobitMkt);
  }
}

async function runTest() {

  try {
    let mktDepth = await getExchangeMktDepth("poloniex", "BTC_LBC",10);
    console.log(mktDepth);    
    mktDepth = await getExchangeMktDepth("bittrex", "BTC-LBC");
    console.log(mktDepth);
    mktDepth = await getExchangeMktDepth("hitbtc", "ETHBTC");
    console.log(mktDepth);
  }
  catch(err) {
    console.log(err);
  }
}

// Set the default copare to run.
let compareToRun: Promise<void> = runPoloBittrexCompare;
if (process.argv.length>=3) {
  if (process.argv[2]==="polointernal") {
    console.log(`Running polointernal compare.`);
    compareToRun = poloInternalCompare;
  }
  else {
    if (process.argv[2]==="polocoinbase") {
      compareToRun = runPoloCoinbaseCompare;
      console.log("Running PoloCoinbaseCompare.");
    }
    else if (process.argv[2]==="polohitbtc") {
      compareToRun = runPoloHitbtcCompare;
      console.log("Running PoloHitbtcCompare.")
    }
    else if (process.argv[2]==="bittrexhitbtc") {
      compareToRun = runBittrexHitbtcCompare;
      console.log("Running runBittrexHitbtcCompare.")
    }
    else if (process.argv[2]==="poloyobit") {
      compareToRun = runPoloYobitCompare;
      console.log("Running runPoloYobitCompare.")
    }
    else if (process.argv[2]==="yobitinternal") {
      compareToRun = runYobitInternalCompare;
      console.log("Running runYobitInternalCompare.")
    }
    else if (process.argv[2]==="polobinance") {
      compareToRun = runPoloBinanceCompare;
      console.log("Running runPoloBinanceCompare.")
    }
    else
    {
      console.log("Running default polo bittrex compare.");
    }
  }
}
let newInteral = 1000*(timeInSecondsBetweenPriceChecks + 5*Math.random());
console.log(`Setting the timer interval to ${newInteral/1000} seconds.` );
compareToRun();
intervalHandel = setInterval(compareToRun, newInteral);

//runTest();
