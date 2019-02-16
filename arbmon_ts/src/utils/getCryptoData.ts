import { isRegExp } from "util";

/* getCryptoData.ts
 * desc: Routines used to query crypto exchanges for data over their JSON interface.
 */
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

const exchangeQueries: any = {
  poloniex: { 
    mktUrl: "https://poloniex.com/public?command=returnTicker",
    // For Poloniex order book replace %PAIR% with a ccy pair like BTC_ETH, %DEPTH% with an integer like 5.
    orderBookUrl: "https://poloniex.com/public?command=returnOrderBook&currencyPair=%PAIR%&depth=%DEPTH%"
  },
  coinbase: { 
    mktUrl: "https://api.pro.coinbase.com/products" 
  },
  bittrex: { 
    mktUrl: "https://bittrex.com/api/v1.1/public/getmarketsummaries",
    // For the Bittrex order book replace %PAIR% with a ccy pair like BTC-ETH.  Depth is always ALL for Bittrex.
    orderBookUrl: "https://api.bittrex.com/api/v1.1/public/getorderbook?market=%PAIR%&type=both"
  },
  hitbtc: { 
    mktUrl: "https://api.hitbtc.com/api/2/public/ticker",
    // For the Hitbtc orderbook, replace %PAIR% with a ccy pair like ETHBTC. Depth is always ALL for Hitbtc. 
    orderBookUrl: "https://api.hitbtc.com/api/2/public/orderbook/%PAIR%"
  },
  binance: { 
    mktUrl: "https://api.binance.com/api/v3/ticker/bookTicker",
  },
  yobit: { 
    mktUrl: "https://yobit.net/api/3/ticker/" 
  }
}

/* getExchangeMkt
 * desc: Use the exchangeQueries object to determine which url to query to retrieve market data.
 *       Allows outside callers to specify the data to retrieve by name without needed to know
 *       the details of how to query the exchanges.
 */
function getExchangeMkt(Exchange: string) {
  if(exchangeQueries[Exchange]) {
    return(getDataFromURL(exchangeQueries[Exchange].mktUrl));
  }
  else {
    return new Promise( (resolve, reject) => reject(`${Exchange} not configured for market data.`));
  }
}

/* getExchangeMktDepth
 * desc: Use the exchangeQueries object to determine which url to query to retrieve market data.
 *       Allows outside callers to specify the data to retrieve by name without needed to know
 *       the details of how to query the exchanges.
 */
function getExchangeMktDepth(exchange: string, ccyPair: string, depth : number = 5) {
  if(exchangeQueries[exchange] && exchangeQueries[exchange]["orderBookUrl"]) {
      let mktDepthURL = exchangeQueries[exchange].orderBookUrl;
      mktDepthURL = mktDepthURL.replace("%PAIR%", ccyPair);
      if(exchange==="poloniex") {
        mktDepthURL = mktDepthURL.replace("%DEPTH%", depth);
      }
      console.log("Get orderbook from:", mktDepthURL);
      return(getDataFromURL(mktDepthURL));
  }
  else {
    return new Promise( (resolve, reject) => reject(`${exchange} not configured for market depth.`));
  }
}

/* getDataFromURL
 * desc: Retrieves JSON data from a given URL.  Returns this in an object containing a timestamp
 *       and a string called exchangeData containing the data from the exchange.
 *       There is no crypto specific logic here.
 */
function getDataFromURL(_url: string) : any {
  return new Promise(function (resolve, reject) {
    var xmlhttp = new XMLHttpRequest(),
      method = "GET",
      url = _url;

    xmlhttp.open(method, url, true);
    xmlhttp.onerror = function () {
      console.log(`** An error occurred retrieving data from ${url}`);
      reject(new Error(`** An error occurred retrieving data from ${url}`));
      return;
    };
    xmlhttp.onreadystatechange = function() {
      if (this.status===404) {
        console.log(`Error 404 querying ${url}`);
        reject(xmlhttp.responseText);
      }
      else if (this.readyState===4 && this.status===200) {
        let exchangeData = xmlhttp.responseText;
        let timeStamp = new Date();
        let exchangeObject = "";
        let returnObj = {
          timeStamp,
          exchangeData
        };
        resolve(returnObj);
      }
    }
    xmlhttp.send();
  });
}

export {getExchangeMkt, getExchangeMktDepth, getDataFromURL};
