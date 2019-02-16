/* mktDataTickers.ts
 * desc: Utility program that downloads market data from exchanges and finds all overlapping tickers.
 *       The first set of ticker symbol compares are between Poloniex and Bittrex.
 */

require("@babel/polyfill");

import {getExchangeMkt} from "./utils/getCryptoData";

const poloniexURL: string = "https://poloniex.com/public?command=returnTicker"; 
const bittrexURLAll: string = "https://bittrex.com/api/v1.1/public/getmarketsummaries";
const hitbtcURL: string = "https://api.hitbtc.com/api/2/public/ticker";
const binanceURL: string = "https://api.binance.com/api/v3/ticker/bookTicker";


async function runBittrexBinanceTickerCompare() {
  // Poloniex section - All coins from one request
  let bittrexData = await getExchangeMkt("bittrex");
  const bittrexJSON = JSON.parse(bittrexData.exchangeData);
  const bittrexResults: Array<any> = bittrexJSON.result;
  // Binance section - All coins from one request.
  let binanceALL = await getExchangeMkt("binance");
  const binanceResults: Array<any> = JSON.parse(binanceALL.exchangeData);
  let btcMatch: Array<string> = [];
  let ethMatch: Array<string> = [];
  let usdtMatch: Array<string> = [];
  binanceResults.forEach( (binanceElement) => {
    const bittrexTicker = getBittrexTickerFromBinance(binanceElement.symbol);
    for(let idx=0; idx<bittrexResults.length; idx++) {
      if(bittrexResults[idx].MarketName===bittrexTicker) {
        console.log(`---> Match Binance: ${binanceElement.symbol} Bittrex: ${bittrexTicker}`);
        break;
      }
    }
  });
}


function getBittrexTickerFromBinance(binanceTicker : string): string {

  let bittrexTicker = "";
  const baseTickers = ["BTC", "ETH", "USDC", "USDT"];
  for(let baseIdx = 0; baseIdx<baseTickers.length; baseIdx++) {
    const baseTickerFound = binanceTicker.search(baseTickers[baseIdx]);
    if (baseTickerFound >= 2) {
      const secondaryTicker = binanceTicker.slice(0, baseTickerFound);
      bittrexTicker = `${baseTickers[baseIdx]}-${secondaryTicker}`;
      break;
    }  
  }
  return(bittrexTicker);
}



async function runPoloBinanceTickerCompare() {
  // Poloniex section - All coins from one request
  let poloniexData = await getExchangeMkt("poloniex");
  const poloniexJSON = JSON.parse(poloniexData.exchangeData);
  // Binance section - All coins from one request.
  let binanceALL = await getExchangeMkt("binance");
  const binanceResults: Array<any> = JSON.parse(binanceALL.exchangeData);
  let btcMatch: Array<string> = [];
  let ethMatch: Array<string> = [];
  let usdtMatch: Array<string> = [];
  binanceResults.forEach( (binanceElement) => {
    const poloTicker = getPoloTickerFromBinance(binanceElement.symbol);
    if(poloniexJSON[poloTicker]) {
       console.log("Match:", binanceElement.symbol, " ", poloTicker);
    }
  });
}

function getPoloTickerFromBinance(binanceTicker : string): string {

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


async function runPoloBittrexTickerCompare() {
  // Poloniex section - All coins from one request
  let poloniexData = await getExchangeMkt("poloniex");
  const poloniexJSON = JSON.parse(poloniexData.exchangeData);
  //console.log("Poloniex:", poloniexJSON);
  // Bittrex section - All coins from one request.
  let bittrexALL = await getExchangeMkt("bittrex");
  let bittrexJSON = JSON.parse(bittrexALL.exchangeData);
  //console.log("Bittrex:", bittrexJSON);
  const bittrexResults: Array<any> = bittrexJSON.result;
  let btcMatch: Array<string> = [];
  let ethMatch: Array<string> = [];
  let usdtMatch: Array<string> = [];
  bittrexResults.forEach( (bittrexElement) => {
    const poloTicker = getPoloTickerFromBittrex(bittrexElement.MarketName);
    if(poloniexJSON[poloTicker]) {
      let bittrexSplit = bittrexElement.MarketName.split("-");
      if (bittrexSplit[0]==="BTC"){
        btcMatch.push(bittrexSplit[1]);
      }
      if (bittrexSplit[0]==="ETH"){
        ethMatch.push(bittrexSplit[1]);
      }
      if (bittrexSplit[0]==="USDT"){
        usdtMatch.push(bittrexSplit[1]);
      }
      console.log("Match:", bittrexElement.MarketName, " ", poloTicker);
    }
  });
  process.stdout.write("BTC: [");
  btcMatch.map((elem) => process.stdout.write("\""+elem+"\""+","));
  process.stdout.write("]\n");
  process.stdout.write("ETH: [");
  ethMatch.map((elem) => process.stdout.write("\""+elem+"\""+","));
  process.stdout.write("]\n");
  process.stdout.write("USDT: [");
  usdtMatch.map((elem) => process.stdout.write("\""+elem+"\""+","));
  process.stdout.write("]\n");
}

function getPoloTickerFromBittrex(bittrexTicker : string): string {

  let bittrexSplit = bittrexTicker.split("-");
  return(bittrexSplit[0] + "_" + bittrexSplit[1]);
}

async function runPoloHitbtcTickerCompare() {
  // Poloniex section - All coins from one request
  let poloniexData = await getExchangeData(poloniexURL);
  const poloniexJSON = JSON.parse(poloniexData.exchangeData);
  // Bittrex section - All coins from one request.
  let hitbtcALL = await getExchangeData(hitbtcURL);
  let hitbtcJSON = JSON.parse(hitbtcALL.exchangeData);
  hitbtcJSON.forEach( (hitBTCElem: any) => {
    let proposedPoloTicker = getPoloTickerFromHitbtc(hitBTCElem.symbol);
    if (poloniexJSON[proposedPoloTicker]) {
      process.stdout.write("\""+hitBTCElem.symbol+"\",");
    }
  });
  process.stdout.write("\n");
  hitbtcJSON.forEach( (hitBTCElem: any) => {
    let proposedPoloTicker = getPoloTickerFromHitbtc(hitBTCElem.symbol);
    if (poloniexJSON[proposedPoloTicker]) {
      process.stdout.write(hitBTCElem.symbol+":   \""+proposedPoloTicker+"\",\n");
    }
  });
  process.stdout.write("\n");
}

function getPoloTickerFromHitbtc(hitbtcTicker : string): string {

  const baseCurrency: Array<string> = ["BTC", "ETH", "USDT"];
  for(let idx=0; idx<baseCurrency.length; idx++) {
    if(hitbtcTicker.endsWith(baseCurrency[idx])) {
      let poloTicker = baseCurrency[idx] + "_" + hitbtcTicker.substring(0,hitbtcTicker.indexOf(baseCurrency[idx]));
      return(poloTicker);
    }
  }
 return("NoPolo");
}

async function runBittrexHitbtcTickerCompare() {
  // Bittrex section - All coins from one request.
  let bittrexALL = await getExchangeData(bittrexURLAll);
  let bittrexJSON = JSON.parse(bittrexALL.exchangeData);
  //console.log("Bittrex:", bittrexJSON);
  const bittrexResults: Array<any> = bittrexJSON.result;
  process.stdout.write("\n");
  // Hitbtc section
  let hitbtcALL = await getExchangeData(hitbtcURL);
  let hitbtcJSON = JSON.parse(hitbtcALL.exchangeData);
  bittrexResults.forEach( (bittrexElem: any) => {
    let proposedHitbtcTicker = getHitbtcTickerFromBittrex(bittrexElem.MarketName);
    let tickerMatch = hitbtcJSON.filter((item: any) => {
      return(item.symbol===proposedHitbtcTicker);
    });
    if(tickerMatch.length!=0)
      console.log(bittrexElem.MarketName, " gave ", proposedHitbtcTicker, " matched", tickerMatch[0].symbol);
  });
  process.stdout.write("\n");
}

function getHitbtcTickerFromBittrex(bittrexTicker : string): string {

  let bittrexSplit = bittrexTicker.split("-");
  return(bittrexSplit[1] + bittrexSplit[0]);
}

//runPoloBittrexTickerCompare();
//runPoloHitbtcTickerCompare();
//runBittrexHitbtcTickerCompare();
//runPoloBinanceTickerCompare();
runBittrexBinanceTickerCompare();