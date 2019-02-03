/* getCryptoData.ts
 * desc: Routines used to query crypto exchanges for data over their JSON interface.
 */
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

const exchangeQueries: any = {
  poloniex: { 
    mktUrl: "https://poloniex.com/public?command=returnTicker"
  },
  coinbase: { 
    mktUrl: "https://api.pro.coinbase.com/products" 
  },
  bittrex: { 
    mktUrl: "https://bittrex.com/api/v1.1/public/getmarketsummaries" 
  },
  hitbtc: { 
    mktUrl: "https://api.hitbtc.com/api/2/public/ticker" 
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

export {getExchangeMkt, getDataFromURL};
