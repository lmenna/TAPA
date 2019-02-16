/* priceMon.ts
 * desc: Looks for interesting pricing signals within a single exchange.  Outputs alerts
 *       to the same MongoDB and in the same format as the arbitrage alerts.  This means the 
 *       alerts generated here will be displayed along with the arbitrage alerts.
 */


require("@babel/polyfill");

import {getExchangeMkt, getDataFromURL, getExchangeMktDepth} from "./utils/getCryptoData";

const timeInSecondsBetweenPriceChecks: number = 15;
let priceHistory: Array<any> = [{}, {}, {}];
let mktStatus: any = {
};
let curPriceIdx = 0;

async function initSystem() {

  try {
    let rawData = await getExchangeMkt("poloniex");
    console.log(`Exchange Data Timestamp: ${rawData.timeStamp.toString().slice(0,25)}`);
    // Set up the three period rolling price history.
    // Initialized to be the same initial block pof prices.
    priceHistory[0] = rawData;
    priceHistory[1] = rawData;
    priceHistory[2] = rawData;    
    // Create a current status object for the market.  One entry for each ticker.
    const curMarket = JSON.parse(rawData.exchangeData);
    for (const mktElem of Object.keys(curMarket)) {
      mktStatus[mktElem] = {
        timeStamp: Date.now(),
        alert: false,
        gaining: false,
        curPrice: 0,
        prevPrice: 0,
        curAsk: 0,
        prevAsk: 0,
        priceRisePercent: 0,
        askRisePercent: 0,
        numGains: 0
      }
    }
  }
  catch(err) {
    console.log("Error initializing the system.");
    console.log(err);
  }
}

async function runPriceTracker() {

  try {
    console.log(`Processing ${curPriceIdx}`);
    let rawData = await getExchangeMkt("poloniex");
    console.log(`Exchange Data Timestamp: ${rawData.timeStamp.toString().slice(0,25)}`);
    // Store a total of 3 market prices in the price history.
    priceHistory[curPriceIdx] = rawData;
    // Compare the current prices with those loaded previously highlighting cases where there is a large
    // price movement.
    findPriceChanges(priceHistory, curPriceIdx);
    outputPriceChanges(mktStatus);
    curPriceIdx++;
    curPriceIdx = curPriceIdx%3;
  }
  catch(err) {
    console.log("Error processing the market data.");
    console.log(err);
  }
}

function outputPriceChanges(curMktStatus: any) {

  for (const mktElem of Object.keys(curMktStatus)) {
    let curMktElem = curMktStatus[mktElem];
    if (curMktElem.gaining) {
      const msg = `${mktElem} ${curMktElem.timeStamp.toUTCString()} Gaining Price: ${curMktElem.numGains} ${curMktElem.prevPrice} ->> ${curMktElem.curPrice} ${curMktElem.priceRisePercent.toFixed(6)}%`;
      console.log(msg);
    }
    if (curMktElem.alert) {
      const msg = `${mktElem} ${curMktElem.timeStamp.toUTCString()} Gaining Ask: ${curMktElem.prevAsk} ->> ${curMktElem.curAsk} ${curMktElem.askRisePercent.toFixed(6)}%`;     
      console.log(msg);
    }
    if(curMktElem.numGains > 1) {
      console.log(`Alert: ${curMktElem.timeStamp.toUTCString()} ${mktElem} has ${curMktElem.numGains} price increases.`);
    }
  }
}


function findPriceChanges(priceHistory: Array<any>, curPriceIdx: number) {

  let prevPriceIdx = curPriceIdx-1;
  if (prevPriceIdx===-1)
    prevPriceIdx = 2;
  // We wrap around keeping only 3 price history data points
  let curMarket = JSON.parse(priceHistory[curPriceIdx].exchangeData);  
  let prevMarket = JSON.parse(priceHistory[prevPriceIdx].exchangeData);
  for (const mktElem of Object.keys(curMarket)) {
    mktStatus[mktElem].timeStamp = priceHistory[curPriceIdx].timeStamp; 
    mktStatus[mktElem].curPrice = +curMarket[mktElem].last;
    mktStatus[mktElem].prevPrice = +prevMarket[mktElem].last;
    mktStatus[mktElem].curAsk = +curMarket[mktElem].lowestAsk;
    mktStatus[mktElem].prevAsk = +prevMarket[mktElem].lowestAsk;
    let priceDiff = mktStatus[mktElem].curPrice - mktStatus[mktElem].prevPrice;
    let askDiff = mktStatus[mktElem].curAsk - mktStatus[mktElem].prevAsk;
    let percentPriceDiff = 100.0*Math.abs(priceDiff)/curMarket[mktElem].last;
    let percentAskDiff = 100.0*Math.abs(askDiff)/curMarket[mktElem].lowestAsk;
    mktStatus[mktElem].priceRisePercent = percentPriceDiff;
    mktStatus[mktElem].askRisePercent = percentAskDiff; 
    let percentThreshold = 0.1;
    if (mktStatus[mktElem].curPrice < 0.00000100)
      percentThreshold = 1.0;
    if(priceDiff > 0.0 && percentPriceDiff > percentThreshold) {
      mktStatus[mktElem].numGains++;
      mktStatus[mktElem].gaining = true;
      if (askDiff > 0) {
        mktStatus[mktElem].alert = true;
      }
    }
    else {
      mktStatus[mktElem].numGains=0;
      mktStatus[mktElem].gaining = false;
      mktStatus[mktElem].alert = false;
    }
  }
}

let newInteral = 1000*(timeInSecondsBetweenPriceChecks + 5*Math.random());
console.log(`Setting the timer interval to ${newInteral/1000} seconds.` );
initSystem();
let intervalHandel = setInterval(runPriceTracker, newInteral);

