require("@babel/polyfill");

import {getExchangeData} from "./utils/getCryptoData.js";
import {comparePoloniexCoinbase, compareAllPoloniexBittrex} from "./utils/comparePricingData";

let XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

const poloniexURL = "https://poloniex.com/public?command=returnTicker"; 
const coinbaseURL = "https://api.pro.coinbase.com/products"; 
const bittrexURL = "https://bittrex.com/api/v1.1/public/getmarketsummary";
const bittrexURLAll = "https://bittrex.com/api/v1.1/public/getmarketsummaries";
const threshold = 1.01;
let numberOfChecks = 0;
let intervalHandel = -1;
let maxBuyArb = 0;
let maxSellArb = 0;
let maxSellArbETH = 0;
let maxSellArbXMR = 0;

const timeInSecondsBetweenPriceChecks = 15;

/* poloInternalCompare
 * desc: Looks for arbitrage profits from scenarios where a coin1 is exchanged for coin2, coin2 exchanged for coin3 and then 
 *       coin3 exchanged back into coin1.
 *       This compare looks only within the Poloniex exchange.
*/
function poloInternalCompare() {

  console.log("BEGIN: poloInternalCompare");
  let xmlhttp = new XMLHttpRequest(),
    method = "GET",
    url = poloniexURL;

  console.log("Loading data from : Http.send(", url, ")");
  xmlhttp.open(method, url, true);
  xmlhttp.onerror = function () {
    console.log("** An error occurred during the transaction");
  };
  xmlhttp.onreadystatechange = function() {
    if (this.readyState===4 && this.status===200) {
      let exchangeData = xmlhttp.responseText;
      numberOfChecks++;
      let timeStamp = new Date();
      let exchangeObject = JSON.parse(exchangeData);
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
  }
  xmlhttp.send();
  console.log("END: poloInternalCompare");
}

/* analyzePoloBTCPrices
 * desc: Takes the exchange prices from Poloniex and does the detailed compares to find arbitrage
 *       within this exchange.  It does this for the BTC market.
 */
function analyzePoloBTCPrices(exchangePrices, baseStableCoin, coins, timeStamp) {

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
      console.log("Something dramatic needs to happen!");
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
      console.log("Something dramatic needs to happen!");
    }
  });
}

/* analyzePoloETHPrices
 * desc: Takes the exchange prices from Poloniex and does the detailed compares to find arbitrage
 *       within this exchange for their ETH market.
 */
function analyzePoloETHPrices(exchangePrices, timeStamp) {

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
function analyzePoloXMRPrices(exchangePrices, timeStamp) {

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
  let poloniexData = await getExchangeData(poloniexURL);
  let coinbaseDataZEC = await getExchangeData(coinbaseURL+"/ZEC-USDC/book");
  let coinbaseDataETH = await getExchangeData(coinbaseURL+"/ETH-USDC/book");
  let coinbaseDataBTC = await getExchangeData(coinbaseURL+"/BTC-USDC/book");
  comparePoloniexCoinbase(poloniexData, coinbaseDataZEC, "ZEC");
  comparePoloniexCoinbase(poloniexData, coinbaseDataETH, "ETH");
  comparePoloniexCoinbase(poloniexData, coinbaseDataBTC, "BTC");
}

async function runPoloBittrexCompare() {

  numberOfChecks++;
  // Poloniex section - All coins from one request
  let poloniexData = await getExchangeData(poloniexURL);
  // Bittrex section - All coins from one request.
  // Bittrex market summary - All coins from one request.
  let bittrexALL = await getExchangeData(bittrexURLAll);
  let bittrexJSON = JSON.parse(bittrexALL.exchangeData);
  let bittrexBTCCoins = {
    BTC: ["ardr", "bat", "bnt", "burst", "cvc", "dash", "dgb", "doge",
    "etc", "eth", "fct", "game", "gnt", "lbc", "loom", "lsk", "ltc", "mana", "nav", "nmr", "nxt", "omg",
    "poly", "ppc", "qtum", "rep", "sbd", "sc", "snt", "steem", "storj", "xrp", "sys", "strat", "via", "vtc",
    "xcp", "xem", "xmr", "xrp", "zec", "zrx"],
    ETH: ["BAT", "BNT", "CVC", "ETC", "GNT", "MANA", "OMG", "QTUM", "REP", "SNT", "ZEC", "ZRX"],
    USDT: ["BAT", "BTC", "DASH"]
  };
  let baseMarkets = ["BTC", "ETH", "USDT"];
  baseMarkets.forEach(baseMkt => {
    console.log("Processing basemkt:", baseMkt);
    let bittrexTrimmed = {};
    bittrexJSON.result.forEach(market => {
      bittrexBTCCoins[baseMkt].forEach(coin => {
        let MarketName = baseMkt+"-"+coin.toUpperCase();
        //console.log("MarketName:", MarketName);
        if (market.MarketName===MarketName) {
          bittrexTrimmed[MarketName] = market;
        }
      });
    });
    let bittrexCompare = {};
    bittrexCompare.timeStamp = bittrexALL.timeStamp;
    bittrexCompare.exchangeData = bittrexTrimmed;
    compareAllPoloniexBittrex(poloniexData, bittrexCompare);
  });
  console.log(`Compare cycle ${numberOfChecks} complete.`)
}

// Set the default copare to run.
let compareToRun =  runPoloBittrexCompare;
if (process.argv.length>=3) {
  if (process.argv[2]==="polointernal") {
    console.log(`Running polointernal compare.`);
    compareToRun = poloInternalCompare;
  }
  else {
    if (process.argv[2]==="polocoinbase") {
      compareToRun = runPoloCoinbaseCompare;
      console.log("Running PoloCoinbaseCompare compare.");
    }
    else {
      console.log("Running default polo bittrex compare.");
    }
  }
}
let newInteral = 1000*(timeInSecondsBetweenPriceChecks + 20*Math.random());
console.log(`Setting the timer interval to ${newInteral/1000} seconds.` );
compareToRun();
intervalHandel = setInterval(compareToRun, newInteral);
