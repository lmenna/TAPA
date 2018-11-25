/* etherscanLoader.js
 * desc: Utilities for automatically loading public data from etherscan.io
 *
 */

import request from "request";

var urlForPrices = "https://etherscan.io/chart/etherprice?output=csv";

async function loadPricingData() {
  var pricingData;
  console.log("request.get(urlForPrices, function (error, response, body))");
  return new Promise(function (resolve, reject) {
    request({
      uri: urlForPrices,
      method: "GET",
      timeout: 10000,
      followRedirect: true,
      maxRedirects: 10
    }, function(error, response, body) {
      if (!error && response.statusCode===200) {
        console.log(body.substring(1,100));
        resolve(body);
      }
      else {
        reject(error);
      }
    });
  });
}

export {loadPricingData};
