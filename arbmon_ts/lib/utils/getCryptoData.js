"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getExchangeMkt = getExchangeMkt;
exports.getExchangeMktDepth = getExchangeMktDepth;
exports.getDataFromURL = getDataFromURL;

/* getCryptoData.ts
 * desc: Routines used to query crypto exchanges for data over their JSON interface.
 */
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

var exchangeQueries = {
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
    mktUrl: "https://api.binance.com/api/v3/ticker/bookTicker"
  },
  yobit: {
    mktUrl: "https://yobit.net/api/3/ticker/"
  }
  /* getExchangeMkt
   * desc: Use the exchangeQueries object to determine which url to query to retrieve market data.
   *       Allows outside callers to specify the data to retrieve by name without needed to know
   *       the details of how to query the exchanges.
   */

};

function getExchangeMkt(Exchange) {
  if (exchangeQueries[Exchange]) {
    return getDataFromURL(exchangeQueries[Exchange].mktUrl);
  } else {
    return new Promise(function (resolve, reject) {
      return reject("".concat(Exchange, " not configured for market data."));
    });
  }
}
/* getExchangeMktDepth
 * desc: Use the exchangeQueries object to determine which url to query to retrieve market data.
 *       Allows outside callers to specify the data to retrieve by name without needed to know
 *       the details of how to query the exchanges.
 */


function getExchangeMktDepth(exchange, ccyPair) {
  var depth = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 5;

  if (exchangeQueries[exchange] && exchangeQueries[exchange]["orderBookUrl"]) {
    var mktDepthURL = exchangeQueries[exchange].orderBookUrl;
    mktDepthURL = mktDepthURL.replace("%PAIR%", ccyPair);

    if (exchange === "poloniex") {
      mktDepthURL = mktDepthURL.replace("%DEPTH%", depth);
    }

    console.log("Get orderbook from:", mktDepthURL);
    return getDataFromURL(mktDepthURL);
  } else {
    return new Promise(function (resolve, reject) {
      return reject("".concat(exchange, " not configured for market depth."));
    });
  }
}
/* getDataFromURL
 * desc: Retrieves JSON data from a given URL.  Returns this in an object containing a timestamp
 *       and a string called exchangeData containing the data from the exchange.
 *       There is no crypto specific logic here.
 */


function getDataFromURL(_url) {
  return new Promise(function (resolve, reject) {
    var xmlhttp = new XMLHttpRequest(),
        method = "GET",
        url = _url;
    xmlhttp.open(method, url, true);

    xmlhttp.onerror = function () {
      console.log("** An error occurred retrieving data from ".concat(url));
      reject(new Error("** An error occurred retrieving data from ".concat(url)));
      return;
    };

    xmlhttp.onreadystatechange = function () {
      if (this.status === 404) {
        console.log("Error 404 querying ".concat(url));
        reject(xmlhttp.responseText);
      } else if (this.readyState === 4 && this.status === 200) {
        var exchangeData = xmlhttp.responseText;
        var timeStamp = new Date();
        var exchangeObject = "";
        var returnObj = {
          timeStamp: timeStamp,
          exchangeData: exchangeData
        };
        resolve(returnObj);
      }
    };

    xmlhttp.send();
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9nZXRDcnlwdG9EYXRhLnRzIl0sIm5hbWVzIjpbIlhNTEh0dHBSZXF1ZXN0IiwicmVxdWlyZSIsImV4Y2hhbmdlUXVlcmllcyIsInBvbG9uaWV4IiwibWt0VXJsIiwib3JkZXJCb29rVXJsIiwiY29pbmJhc2UiLCJiaXR0cmV4IiwiaGl0YnRjIiwiYmluYW5jZSIsInlvYml0IiwiZ2V0RXhjaGFuZ2VNa3QiLCJFeGNoYW5nZSIsImdldERhdGFGcm9tVVJMIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJnZXRFeGNoYW5nZU1rdERlcHRoIiwiZXhjaGFuZ2UiLCJjY3lQYWlyIiwiZGVwdGgiLCJta3REZXB0aFVSTCIsInJlcGxhY2UiLCJjb25zb2xlIiwibG9nIiwiX3VybCIsInhtbGh0dHAiLCJtZXRob2QiLCJ1cmwiLCJvcGVuIiwib25lcnJvciIsIkVycm9yIiwib25yZWFkeXN0YXRlY2hhbmdlIiwic3RhdHVzIiwicmVzcG9uc2VUZXh0IiwicmVhZHlTdGF0ZSIsImV4Y2hhbmdlRGF0YSIsInRpbWVTdGFtcCIsIkRhdGUiLCJleGNoYW5nZU9iamVjdCIsInJldHVybk9iaiIsInNlbmQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUVBOzs7QUFHQSxJQUFJQSxjQUFjLEdBQUdDLE9BQU8sQ0FBQyxnQkFBRCxDQUFQLENBQTBCRCxjQUEvQzs7QUFFQSxJQUFNRSxlQUFvQixHQUFHO0FBQzNCQyxFQUFBQSxRQUFRLEVBQUU7QUFDUkMsSUFBQUEsTUFBTSxFQUFFLGtEQURBO0FBRVI7QUFDQUMsSUFBQUEsWUFBWSxFQUFFO0FBSE4sR0FEaUI7QUFNM0JDLEVBQUFBLFFBQVEsRUFBRTtBQUNSRixJQUFBQSxNQUFNLEVBQUU7QUFEQSxHQU5pQjtBQVMzQkcsRUFBQUEsT0FBTyxFQUFFO0FBQ1BILElBQUFBLE1BQU0sRUFBRSx3REFERDtBQUVQO0FBQ0FDLElBQUFBLFlBQVksRUFBRTtBQUhQLEdBVGtCO0FBYzNCRyxFQUFB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QSxZQUFJRyxTQUFTLEdBQUcsSUFBSUMsSUFBSixFQUFoQjtBQUNBLFlBQUlDLGNBQWMsR0FBRyxFQUFyQjtBQUNBLFlBQUlDLFNBQVMsR0FBRztBQUNkSCxVQUFBQSxTQUFTLEVBQVRBLFNBRGM7QUFFZEQsVUFBQUEsWUFBWSxFQUFaQTtBQUZjLFNBQWhCO0FBSUFyQixRQUFBQSxPQUFPLENBQUN5QixTQUFELENBQVA7QUFDRDtBQUNGLEtBZkQ7O0FBZ0JBZCxJQUFBQSxPQUFPLENBQUNlLElBQVI7QUFDRCxHQTVCTSxDQUFQO0FBNkJEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgaXNSZWdFeHAgfSBmcm9tIFwidXRpbFwiO1xuXG4vKiBnZXRDcnlwdG9EYXRhLnRzXG4gKiBkZXNjOiBSb3V0aW5lcyB1c2VkIHRvIHF1ZXJ5IGNyeXB0byBleGNoYW5nZXMgZm9yIGRhdGEgb3ZlciB0aGVpciBKU09OIGludGVyZmFjZS5cbiAqL1xudmFyIFhNTEh0dHBSZXF1ZXN0ID0gcmVxdWlyZShcInhtbGh0dHByZXF1ZXN0XCIpLlhNTEh0dHBSZXF1ZXN0O1xuXG5jb25zdCBleGNoYW5nZVF1ZXJpZXM6IGFueSA9IHtcbiAgcG9sb25pZXg6IHsgXG4gICAgbWt0VXJsOiBcImh0dHBzOi8vcG9sb25pZXguY29tL3B1YmxpYz9jb21tYW5kPXJldHVyblRpY2tlclwiLFxuICAgIC8vIEZvciBQb2xvbmlleCBvcmRlciBib29rIHJlcGxhY2UgJVBBSVIlIHdpdGggYSBjY3kgcGFpciBsaWtlIEJUQ19FVEgsICVERVBUSCUgd2l0aCBhbiBpbnRlZ2VyIGxpa2UgNS5cbiAgICBvcmRlckJvb2tVcmw6IFwiaHR0cHM6Ly9wb2xvbmlleC5jb20vcHVibGljP2NvbW1hbmQ9cmV0dXJuT3JkZXJCb29rJmN1cnJlbmN5UGFpcj0lUEFJUiUmZGVwdGg9JURFUFRIJVwiXG4gIH0sXG4gIGNvaW5iYXNlOiB7IFxuICAgIG1rdFVybDogXCJodHRwczovL2FwaS5wcm8uY29pbmJhc2UuY29tL3Byb2R1Y3RzXCIgXG4gIH0sXG4gIGJpdHRyZXg6IHsgXG4gICAgbWt0VXJsOiBcImh0dHBzOi8vYml0dHJleC5jb20vYXBpL3YxLjEvcHVibGljL2dldG1hcmtldHN1bW1hcmllc1wiLFxuICAgIC8vIEZvciB0aGUgQml0dHJleCBvcmRlciBib29rIHJlcGxhY2UgJVBBSVIlIHdpdGggYSBjY3kgcGFpciBsaWtlIEJUQy1FVEguICBEZXB0aCBpcyBhbHdheXMgQUxMIGZvciBCaXR0cmV4LlxuICAgIG9yZGVyQm9va1VybDogXCJodHRwczovL2FwaS5iaXR0cmV4LmNvbS9hcGkvdjEuMS9wdWJsaWMvZ2V0b3JkZXJib29rP21hcmtldD0lUEFJUiUmdHlwZT1ib3RoXCJcbiAgfSxcbiAgaGl0YnRjOiB7IFxuICAgIG1rdFVybDogXCJodHRwczovL2FwaS5oaXRidGMuY29tL2FwaS8yL3B1YmxpYy90aWNrZXJcIixcbiAgICAvLyBGb3IgdGhlIEhpdGJ0YyBvcmRlcmJvb2ssIHJlcGxhY2UgJVBBSVIlIHdpdGggYSBjY3kgcGFpciBsaWtlIEVUSEJUQy4gRGVwdGggaXMgYWx3YXlzIEFMTCBmb3IgSGl0YnRjLiBcbiAgICBvcmRlckJvb2tVcmw6IFwiaHR0cHM6Ly9hcGkuaGl0YnRjLmNvbS9hcGkvMi9wdWJsaWMvb3JkZXJib29rLyVQQUlSJVwiXG4gIH0sXG4gIGJpbmFuY2U6IHsgXG4gICAgbWt0VXJsOiBcImh0dHBzOi8vYXBpLmJpbmFuY2UuY29tL2FwaS92My90aWNrZXIvYm9va1RpY2tlclwiLFxuICB9LFxuICB5b2JpdDogeyBcbiAgICBta3RVcmw6IFwiaHR0cHM6Ly95b2JpdC5uZXQvYXBpLzMvdGlja2VyL1wiIFxuICB9XG59XG5cbi8qIGdldEV4Y2hhbmdlTWt0XG4gKiBkZXNjOiBVc2UgdGhlIGV4Y2hhbmdlUXVlcmllcyBvYmplY3QgdG8gZGV0ZXJtaW5lIHdoaWNoIHVybCB0byBxdWVyeSB0byByZXRyaWV2ZSBtYXJrZXQgZGF0YS5cbiAqICAgICAgIEFsbG93cyBvdXRzaWRlIGNhbGxlcnMgdG8gc3BlY2lmeSB0aGUgZGF0YSB0byByZXRyaWV2ZSBieSBuYW1lIHdpdGhvdXQgbmVlZGVkIHRvIGtub3dcbiAqICAgICAgIHRoZSBkZXRhaWxzIG9mIGhvdyB0byBxdWVyeSB0aGUgZXhjaGFuZ2VzLlxuICovXG5mdW5jdGlvbiBnZXRFeGNoYW5nZU1rdChFeGNoYW5nZTogc3RyaW5nKSB7XG4gIGlmKGV4Y2hhbmdlUXVlcmllc1tFeGNoYW5nZV0pIHtcbiAgICByZXR1cm4oZ2V0RGF0YUZyb21VUkwoZXhjaGFuZ2VRdWVyaWVzW0V4Y2hhbmdlXS5ta3RVcmwpKTtcbiAgfVxuICBlbHNlIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoIChyZXNvbHZlLCByZWplY3QpID0+IHJlamVjdChgJHtFeGNoYW5nZX0gbm90IGNvbmZpZ3VyZWQgZm9yIG1hcmtldCBkYXRhLmApKTtcbiAgfVxufVxuXG4vKiBnZXRFeGNoYW5nZU1rdERlcHRoXG4gKiBkZXNjOiBVc2UgdGhlIGV4Y2hhbmdlUXVlcmllcyBvYmplY3QgdG8gZGV0ZXJtaW5lIHdoaWNoIHVybCB0byBxdWVyeSB0byByZXRyaWV2ZSBtYXJrZXQgZGF0YS5cbiAqICAgICAgIEFsbG93cyBvdXRzaWRlIGNhbGxlcnMgdG8gc3BlY2lmeSB0aGUgZGF0YSB0byByZXRyaWV2ZSBieSBuYW1lIHdpdGhvdXQgbmVlZGVkIHRvIGtub3dcbiAqICAgICAgIHRoZSBkZXRhaWxzIG9mIGhvdyB0byBxdWVyeSB0aGUgZXhjaGFuZ2VzLlxuICovXG5mdW5jdGlvbiBnZXRFeGNoYW5nZU1rdERlcHRoKGV4Y2hhbmdlOiBzdHJpbmcsIGNjeVBhaXI6IHN0cmluZywgZGVwdGggOiBudW1iZXIgPSA1KSB7XG4gIGlmKGV4Y2hhbmdlUXVlcmllc1tleGNoYW5nZV0gJiYgZXhjaGFuZ2VRdWVyaWVzW2V4Y2hhbmdlXVtcIm9yZGVyQm9va1VybFwiXSkge1xuICAgICAgbGV0IG1rdERlcHRoVVJMID0gZXhjaGFuZ2VRdWVyaWVzW2V4Y2hhbmdlXS5vcmRlckJvb2tVcmw7XG4gICAgICBta3REZXB0aFVSTCA9IG1rdERlcHRoVVJMLnJlcGxhY2UoXCIlUEFJUiVcIiwgY2N5UGFpcik7XG4gICAgICBpZihleGNoYW5nZT09PVwicG9sb25pZXhcIikge1xuICAgICAgICBta3REZXB0aFVSTCA9IG1rdERlcHRoVVJMLnJlcGxhY2UoXCIlREVQVEglXCIsIGRlcHRoKTtcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUubG9nKFwiR2V0IG9yZGVyYm9vayBmcm9tOlwiLCBta3REZXB0aFVSTCk7XG4gICAgICByZXR1cm4oZ2V0RGF0YUZyb21VUkwobWt0RGVwdGhVUkwpKTtcbiAgfVxuICBlbHNlIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoIChyZXNvbHZlLCByZWplY3QpID0+IHJlamVjdChgJHtleGNoYW5nZX0gbm90IGNvbmZpZ3VyZWQgZm9yIG1hcmtldCBkZXB0aC5gKSk7XG4gIH1cbn1cblxuLyogZ2V0RGF0YUZyb21VUkxcbiAqIGRlc2M6IFJldHJpZXZlcyBKU09OIGRhdGEgZnJvbSBhIGdpdmVuIFVSTC4gIFJldHVybnMgdGhpcyBpbiBhbiBvYmplY3QgY29udGFpbmluZyBhIHRpbWVzdGFtcFxuICogICAgICAgYW5kIGEgc3RyaW5nIGNhbGxlZCBleGNoYW5nZURhdGEgY29udGFpbmluZyB0aGUgZGF0YSBmcm9tIHRoZSBleGNoYW5nZS5cbiAqICAgICAgIFRoZXJlIGlzIG5vIGNyeXB0byBzcGVjaWZpYyBsb2dpYyBoZXJlLlxuICovXG5mdW5jdGlvbiBnZXREYXRhRnJvbVVSTChfdXJsOiBzdHJpbmcpIDogYW55IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICB2YXIgeG1saHR0cCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpLFxuICAgICAgbWV0aG9kID0gXCJHRVRcIixcbiAgICAgIHVybCA9IF91cmw7XG5cbiAgICB4bWxodHRwLm9wZW4obWV0aG9kLCB1cmwsIHRydWUpO1xuICAgIHhtbGh0dHAub25lcnJvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnNvbGUubG9nKGAqKiBBbiBlcnJvciBvY2N1cnJlZCByZXRyaWV2aW5nIGRhdGEgZnJvbSAke3VybH1gKTtcbiAgICAgIHJlamVjdChuZXcgRXJyb3IoYCoqIEFuIGVycm9yIG9jY3VycmVkIHJldHJpZXZpbmcgZGF0YSBmcm9tICR7dXJsfWApKTtcbiAgICAgIHJldHVybjtcbiAgICB9O1xuICAgIHhtbGh0dHAub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAodGhpcy5zdGF0dXM9PT00MDQpIHtcbiAgICAgICAgY29uc29sZS5sb2coYEVycm9yIDQwNCBxdWVyeWluZyAke3VybH1gKTtcbiAgICAgICAgcmVqZWN0KHhtbGh0dHAucmVzcG9uc2VUZXh0KTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKHRoaXMucmVhZHlTdGF0ZT09PTQgJiYgdGhpcy5zdGF0dXM9PT0yMDApIHtcbiAgICAgICAgbGV0IGV4Y2hhbmdlRGF0YSA9IHhtbGh0dHAucmVzcG9uc2VUZXh0O1xuICAgICAgICBsZXQgdGltZVN0YW1wID0gbmV3IERhdGUoKTtcbiAgICAgICAgbGV0IGV4Y2hhbmdlT2JqZWN0ID0gXCJcIjtcbiAgICAgICAgbGV0IHJldHVybk9iaiA9IHtcbiAgICAgICAgICB0aW1lU3RhbXAsXG4gICAgICAgICAgZXhjaGFuZ2VEYXRhXG4gICAgICAgIH07XG4gICAgICAgIHJlc29sdmUocmV0dXJuT2JqKTtcbiAgICAgIH1cbiAgICB9XG4gICAgeG1saHR0cC5zZW5kKCk7XG4gIH0pO1xufVxuXG5leHBvcnQge2dldEV4Y2hhbmdlTWt0LCBnZXRFeGNoYW5nZU1rdERlcHRoLCBnZXREYXRhRnJvbVVSTH07XG4iXX0=