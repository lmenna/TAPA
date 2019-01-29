/* mktDataTickers.ts
 * desc: Utility program that downloads market data from exchanges and finds all overlapping tickers.
 *       The first set of ticker symbol compares are between Poloniex and Bittrex.
 */

require("@babel/polyfill");

import {getExchangeData} from "./utils/getCryptoData";

const poloniexURL: string = "https://poloniex.com/public?command=returnTicker"; 
const bittrexURLAll: string = "https://bittrex.com/api/v1.1/public/getmarketsummaries";


async function runTickerCompare() {
  // Poloniex section - All coins from one request
  let poloniexData = await getExchangeData(poloniexURL);
  const poloniexJSON = JSON.parse(poloniexData.exchangeData);
  console.log("Poloniex:", poloniexJSON);
  // Bittrex section - All coins from one request.
  let bittrexALL = await getExchangeData(bittrexURLAll);
  let bittrexJSON = JSON.parse(bittrexALL.exchangeData);
  //console.log("Bittrex:", bittrexJSON);
  const bittrexResults: Array<any> = bittrexJSON.result;
  let btcMatch: Array<string> = [];
  let ethMatch: Array<string> = [];
  let usdtMatch: Array<string> = [];
  bittrexResults.forEach( (bittrexElement) => {
    const poloTicker = getPoloTicker(bittrexElement.MarketName);
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

function getPoloTicker(bittrexTicker : string): string {

  let bittrexSplit = bittrexTicker.split("-");
  return(bittrexSplit[0] + "_" + bittrexSplit[1]);
}

runTickerCompare();






