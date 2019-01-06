require("@babel/polyfill");

var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var threshold = 1.01;
var numberOfChecks = 0;
var intervalHandel = -1;
var maxBuyArb = 0;
var maxSellArb = 0;
var maxSellArbETH = 0;
var maxSellArbXMR = 0;

const timeInSecondsBetweenPriceChecks = 15;

function getPricingData() {

  console.log("BEGIN: getPricingData");
  var xmlhttp = new XMLHttpRequest(),
    method = "GET",
    url = "https://poloniex.com/public?command=returnTicker";

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
      analyzePrices(exchangeObject, baseStableCoin, coins, timeStamp);
      coins = ["BAT", "BNT", "DASH", "DOGE", "EOS", "ETC", "ETH", "GNT", "KNC", "LOOM", "LSK",
        "LTC", "MANA", "NXT", "QTUM", "REP", "SC", "SNT", "STR", "XMR", "XRP", "ZEC", "ZRX"];
      baseStableCoin = "USDT"; 
      analyzePrices(exchangeObject, baseStableCoin, coins, timeStamp);
      analyzeETHPrices(exchangeObject, timeStamp);
      analyzeXMRPrices(exchangeObject, timeStamp);
      if (numberOfChecks===1 || numberOfChecks%5===0) {
        if (intervalHandel!=-1)
          clearInterval(intervalHandel);
        let newInteral = 1000*(timeInSecondsBetweenPriceChecks + 20*Math.random());
        console.log(`Resetting the timer interval to ${newInteral/1000} seconds.` );
        intervalHandel = setInterval( findPricingAnomolies,  newInteral);
      }
    }
  }
  xmlhttp.send();
  console.log("END: getPricingData");
}

function analyzePrices(exchangePrices, baseStableCoin, coins, timeStamp) {

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

function analyzeETHPrices(exchangePrices, timeStamp) {

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


function analyzeXMRPrices(exchangePrices, timeStamp) {

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

/* findPricingAnomolies
 * desc: Called periodically from setInterval.  Will check through the market pricing data and notify
 *       when any pricing anomolies are detected.
 */
function findPricingAnomolies() {

  console.log("BEGIN: findPricingAnomolies activated at:", new Date());
  getPricingData();
  console.log("END: findPricingAnomolies finished at:", new Date());
}

console.log("BEGIN: Main process to monitor prices starting at:", new Date());
console.log(`Will check prices every ${timeInSecondsBetweenPriceChecks} seconds` );
getPricingData();
console.log("END: Main process to monitor prices ending at:", new Date());
