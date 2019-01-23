
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

async function getExchangeData(_url) {

  return new Promise(async function (resolve, reject) {
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
      if (this.readyState===4 && this.status===200) {
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

export {getExchangeData};
