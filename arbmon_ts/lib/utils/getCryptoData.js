"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getExchangeMkt = getExchangeMkt;
exports.getDataFromURL = getDataFromURL;

/* getCryptoData.ts
 * desc: Routines used to query crypto exchanges for data over their JSON interface.
 */
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

var exchangeQueries = {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9nZXRDcnlwdG9EYXRhLnRzIl0sIm5hbWVzIjpbIlhNTEh0dHBSZXF1ZXN0IiwicmVxdWlyZSIsImV4Y2hhbmdlUXVlcmllcyIsInBvbG9uaWV4IiwibWt0VXJsIiwiY29pbmJhc2UiLCJiaXR0cmV4IiwiaGl0YnRjIiwieW9iaXQiLCJnZXRFeGNoYW5nZU1rdCIsIkV4Y2hhbmdlIiwiZ2V0RGF0YUZyb21VUkwiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsIl91cmwiLCJ4bWxodHRwIiwibWV0aG9kIiwidXJsIiwib3BlbiIsIm9uZXJyb3IiLCJjb25zb2xlIiwibG9nIiwiRXJyb3IiLCJvbnJlYWR5c3RhdGVjaGFuZ2UiLCJzdGF0dXMiLCJyZXNwb25zZVRleHQiLCJyZWFkeVN0YXRlIiwiZXhjaGFuZ2VEYXRhIiwidGltZVN0YW1wIiwiRGF0ZSIsImV4Y2hhbmdlT2JqZWN0IiwicmV0dXJuT2JqIiwic2VuZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQTs7O0FBR0EsSUFBSUEsY0FBYyxHQUFHQyxPQUFPLENBQUMsZ0JBQUQsQ0FBUCxDQUEwQkQsY0FBL0M7O0FBRUEsSUFBTUUsZUFBb0IsR0FBRztBQUMzQkMsRUFBQUEsUUFBUSxFQUFFO0FBQ1JDLElBQUFBLE1BQU0sRUFBRTtBQURBLEdBRGlCO0FBSTNCQyxFQUFBQSxRQUFRLEVBQUU7QUFDUkQsSUFBQUEsTUFBTSxFQUFFO0FBREEsR0FKaUI7QUFPM0JFLEVBQUFBLE9BQU8sRUFBRTtBQUNQRixJQUFBQSxNQUFNLEVBQUU7QUFERCxHQVBrQjtBQVUzQkcsRUFBQUEsTUFBTSxFQUFFO0FBQ05ILElBQUFBLE1BQU0sRUFBRTtBQURGLEdBVm1CO0FBYTNCSSxFQUFBQSxLQUFLLEVBQUU7QUFDTEosSUFBQUEsTUFBTSxFQUFFO0FBREg7QUFLVDs7Ozs7O0FBbEI2QixDQUE3Qjs7QUF1QkEsU0FBU0ssY0FBVCxDQUF3QkMsUUFBeEIsRUFBMEM7QUFDeEMsTUFBR1IsZUFBZSxDQUFDUSxRQUFELENBQWxCLEVBQThCO0FBQzVCLFdBQU9DLGNBQWMsQ0FBQ1QsZUFBZSxDQUFDUSxRQUFELENBQWYsQ0FBMEJOLE1BQTNCLENBQXJCO0FBQ0QsR0FGRCxNQUdLO0FBQ0gsV0FBTyxJQUFJUSxPQUFKLENBQWEsVUFBQ0MsT0FBRCxFQUFVQyxNQUFWO0FBQUEsYUFBcUJBLE1BQU0sV0FBSUosUUFBSixzQ0FBM0I7QUFBQSxLQUFiLENBQVA7QUFDRDtBQUNGO0FBRUQ7Ozs7Ozs7QUFLQSxTQUFTQyxjQUFULENBQXdCSSxJQUF4QixFQUE0QztBQUMxQyxTQUFPLElBQUlILE9BQUosQ0FBWSxVQUFVQyxPQUFWLEVBQW1CQyxNQUFuQixFQUEyQjtBQUM1QyxRQUFJRSxPQUFPLEdBQUcsSUFBSWhCLGNBQUosRUFBZDtBQUFBLFFBQ0VpQixNQUFNLEdBQUcsS0FEWDtBQUFBLFFBRUVDLEdBQUcsR0FBR0gsSUFGUjtBQUlBQyxJQUFBQSxPQUFPLENBQUNHLElBQVIsQ0FBYUYsTUFBYixFQUFxQkMsR0FBckIsRUFBMEIsSUFBMUI7O0FBQ0FGLElBQUFBLE9BQU8sQ0FBQ0ksT0FBUixHQUFrQixZQUFZO0FBQzVCQyxNQUFBQSxPQUFPLENBQUNDLEdBQVIscURBQXlESixHQUF6RDtBQUNBSixNQUFBQSxNQUFNLENBQUMsSUFBSVMsS0FBSixxREFBdURMLEdBQXZELEVBQUQsQ0FBTjtBQUNBO0FBQ0QsS0FKRDs7QUFLQUYsSUFBQUEsT0FBTyxDQUFDUSxrQkFBUixHQUE2QixZQUFXO0FBQ3RDLFVBQUksS0FBS0MsTUFBTCxLQUFjLEdBQWxCLEVBQXVCO0FBQ3JCSixRQUFBQSxPQUFPLENBQUNDLEdBQVIsOEJBQWtDSixHQUFsQztBQUNBSixRQUFBQSxNQUFNLENBQUNFLE9BQU8sQ0FBQ1UsWUFBVCxDQUFOO0FBQ0QsT0FIRCxNQUlLLElBQUksS0FBS0MsVUFBTCxLQUFrQixDQUFsQixJQUF1QixLQUFLRixNQUFMLEtBQWMsR0FBekMsRUFBOEM7QUFDakQsWUFBSUcsWUFBWSxHQUFHWixPQUFPLENBQUNVLFlBQTNCO0FBQ0EsWUFBSUcsU0FBUyxHQUFHLElBQUlDLElBQUosRUFBaEI7QUFDQSxZQUFJQyxjQUFjLEdBQUcsRUFBckI7QUFDQSxZQUFJQyxTQUFTLEdBQUc7QUFDZEgsVUFBQUEsU0FBUyxFQUFUQSxTQURjO0FBRWRELFVBQUFBLFlBQVksRUFBWkE7QUFGYyxTQUFoQjtBQUlBZixRQUFBQSxPQUFPLENBQUNtQixTQUFELENBQVA7QUFDRDtBQUNGLEtBZkQ7O0FBZ0JBaEIsSUFBQUEsT0FBTyxDQUFDaUIsSUFBUjtBQUNELEdBNUJNLENBQVA7QUE2QkQiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnZXRDcnlwdG9EYXRhLnRzXG4gKiBkZXNjOiBSb3V0aW5lcyB1c2VkIHRvIHF1ZXJ5IGNyeXB0byBleGNoYW5nZXMgZm9yIGRhdGEgb3ZlciB0aGVpciBKU09OIGludGVyZmFjZS5cbiAqL1xudmFyIFhNTEh0dHBSZXF1ZXN0ID0gcmVxdWlyZShcInhtbGh0dHByZXF1ZXN0XCIpLlhNTEh0dHBSZXF1ZXN0O1xuXG5jb25zdCBleGNoYW5nZVF1ZXJpZXM6IGFueSA9IHtcbiAgcG9sb25pZXg6IHsgXG4gICAgbWt0VXJsOiBcImh0dHBzOi8vcG9sb25pZXguY29tL3B1YmxpYz9jb21tYW5kPXJldHVyblRpY2tlclwiIFxuICB9LFxuICBjb2luYmFzZTogeyBcbiAgICBta3RVcmw6IFwiaHR0cHM6Ly9hcGkucHJvLmNvaW5iYXNlLmNvbS9wcm9kdWN0c1wiIFxuICB9LFxuICBiaXR0cmV4OiB7IFxuICAgIG1rdFVybDogXCJodHRwczovL2JpdHRyZXguY29tL2FwaS92MS4xL3B1YmxpYy9nZXRtYXJrZXRzdW1tYXJpZXNcIiBcbiAgfSxcbiAgaGl0YnRjOiB7IFxuICAgIG1rdFVybDogXCJodHRwczovL2FwaS5oaXRidGMuY29tL2FwaS8yL3B1YmxpYy90aWNrZXJcIiBcbiAgfSxcbiAgeW9iaXQ6IHsgXG4gICAgbWt0VXJsOiBcImh0dHBzOi8veW9iaXQubmV0L2FwaS8zL3RpY2tlci9cIiBcbiAgfVxufVxuXG4vKiBnZXRFeGNoYW5nZU1rdFxuICogZGVzYzogVXNlIHRoZSBleGNoYW5nZVF1ZXJpZXMgb2JqZWN0IHRvIGRldGVybWluZSB3aGljaCB1cmwgdG8gcXVlcnkgdG8gcmV0cmlldmUgbWFya2V0IGRhdGEuXG4gKiAgICAgICBBbGxvd3Mgb3V0c2lkZSBjYWxsZXJzIHRvIHNwZWNpZnkgdGhlIGRhdGEgdG8gcmV0cmlldmUgYnkgbmFtZSB3aXRob3V0IG5lZWRlZCB0byBrbm93XG4gKiAgICAgICB0aGUgZGV0YWlscyBvZiBob3cgdG8gcXVlcnkgdGhlIGV4Y2hhbmdlcy5cbiAqL1xuZnVuY3Rpb24gZ2V0RXhjaGFuZ2VNa3QoRXhjaGFuZ2U6IHN0cmluZykge1xuICBpZihleGNoYW5nZVF1ZXJpZXNbRXhjaGFuZ2VdKSB7XG4gICAgcmV0dXJuKGdldERhdGFGcm9tVVJMKGV4Y2hhbmdlUXVlcmllc1tFeGNoYW5nZV0ubWt0VXJsKSk7XG4gIH1cbiAgZWxzZSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKCAocmVzb2x2ZSwgcmVqZWN0KSA9PiByZWplY3QoYCR7RXhjaGFuZ2V9IG5vdCBjb25maWd1cmVkIGZvciBtYXJrZXQgZGF0YS5gKSk7XG4gIH1cbn1cblxuLyogZ2V0RGF0YUZyb21VUkxcbiAqIGRlc2M6IFJldHJpZXZlcyBKU09OIGRhdGEgZnJvbSBhIGdpdmVuIFVSTC4gIFJldHVybnMgdGhpcyBpbiBhbiBvYmplY3QgY29udGFpbmluZyBhIHRpbWVzdGFtcFxuICogICAgICAgYW5kIGEgc3RyaW5nIGNhbGxlZCBleGNoYW5nZURhdGEgY29udGFpbmluZyB0aGUgZGF0YSBmcm9tIHRoZSBleGNoYW5nZS5cbiAqICAgICAgIFRoZXJlIGlzIG5vIGNyeXB0byBzcGVjaWZpYyBsb2dpYyBoZXJlLlxuICovXG5mdW5jdGlvbiBnZXREYXRhRnJvbVVSTChfdXJsOiBzdHJpbmcpIDogYW55IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICB2YXIgeG1saHR0cCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpLFxuICAgICAgbWV0aG9kID0gXCJHRVRcIixcbiAgICAgIHVybCA9IF91cmw7XG5cbiAgICB4bWxodHRwLm9wZW4obWV0aG9kLCB1cmwsIHRydWUpO1xuICAgIHhtbGh0dHAub25lcnJvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnNvbGUubG9nKGAqKiBBbiBlcnJvciBvY2N1cnJlZCByZXRyaWV2aW5nIGRhdGEgZnJvbSAke3VybH1gKTtcbiAgICAgIHJlamVjdChuZXcgRXJyb3IoYCoqIEFuIGVycm9yIG9jY3VycmVkIHJldHJpZXZpbmcgZGF0YSBmcm9tICR7dXJsfWApKTtcbiAgICAgIHJldHVybjtcbiAgICB9O1xuICAgIHhtbGh0dHAub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAodGhpcy5zdGF0dXM9PT00MDQpIHtcbiAgICAgICAgY29uc29sZS5sb2coYEVycm9yIDQwNCBxdWVyeWluZyAke3VybH1gKTtcbiAgICAgICAgcmVqZWN0KHhtbGh0dHAucmVzcG9uc2VUZXh0KTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKHRoaXMucmVhZHlTdGF0ZT09PTQgJiYgdGhpcy5zdGF0dXM9PT0yMDApIHtcbiAgICAgICAgbGV0IGV4Y2hhbmdlRGF0YSA9IHhtbGh0dHAucmVzcG9uc2VUZXh0O1xuICAgICAgICBsZXQgdGltZVN0YW1wID0gbmV3IERhdGUoKTtcbiAgICAgICAgbGV0IGV4Y2hhbmdlT2JqZWN0ID0gXCJcIjtcbiAgICAgICAgbGV0IHJldHVybk9iaiA9IHtcbiAgICAgICAgICB0aW1lU3RhbXAsXG4gICAgICAgICAgZXhjaGFuZ2VEYXRhXG4gICAgICAgIH07XG4gICAgICAgIHJlc29sdmUocmV0dXJuT2JqKTtcbiAgICAgIH1cbiAgICB9XG4gICAgeG1saHR0cC5zZW5kKCk7XG4gIH0pO1xufVxuXG5leHBvcnQge2dldEV4Y2hhbmdlTWt0LCBnZXREYXRhRnJvbVVSTH07XG4iXX0=