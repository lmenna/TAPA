require("@babel/polyfill");

var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var threshold = 1.05;
var numberOfChecks = 0;
var intervalHandel = -1;
var maxBuyArb = 0;
var maxSellArb = 0;

const timeInSecondsBetweenPriceChecks = 30;

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
      let exchangeObject = JSON.parse(exchangeData);
      analyzePrices(exchangeObject, "USDC");
      analyzePrices(exchangeObject, "USDT");
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

function analyzePrices(exchangePrices, baseStableCoin) {

  var coins;
  if (baseStableCoin==="USDC") 
    coins = ["FOAM", "ZEC", "LTC", "ETH", "XRP", "STR", "XMR", "DOGE", "BCHABC", "BCHSV"];
  else
    coins = ["BAT", "BNT", "DASH", "DOGE", "EOS", "ETC", "ETH", "GNT", "KNC", "LOOM", "LSK",
      "LTC", "MANA", "NXT", "QTUM", "REP", "SC", "SNT", "STR", "XMR", "XRP", "ZEC", "ZRX"];

  let timeStamp = new Date();
  let timeStampStr = timeStamp.getTime();
  
  console.log(`priceCheckCount:${numberOfChecks}|maxBuyArb:${maxBuyArb}|maxSellArb:${maxSellArb}`);
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
    console.log(`REC|${timeStamp}|${timeStampStr}|Sell|${baseStableCoin}|${curCoin}|ArbRatio:${ArbRatio}|${showMax}`);
    if (ArbRatio > threshold) {
      console.log("Something dramatic needs to happen!");
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
