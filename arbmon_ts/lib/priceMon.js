"use strict";

var _getCryptoData = require("./utils/getCryptoData");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

/* priceMon.ts
 * desc: Looks for interesting pricing signals within a single exchange.  Outputs alerts
 *       to the same MongoDB and in the same format as the arbitrage alerts.  This means the 
 *       alerts generated here will be displayed along with the arbitrage alerts.
 */
require("@babel/polyfill");

var timeInSecondsBetweenPriceChecks = 15;
var priceHistory = [{}, {}, {}];
var mktStatus = {};
var curPriceIdx = 0;

function initSystem() {
  return _initSystem.apply(this, arguments);
}

function _initSystem() {
  _initSystem = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee() {
    var rawData, curMarket, _arr3, _i3, mktElem;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return (0, _getCryptoData.getExchangeMkt)("poloniex");

          case 3:
            rawData = _context.sent;
            console.log("Exchange Data Timestamp: ".concat(rawData.timeStamp.toString().slice(0, 25))); // Set up the three period rolling price history.
            // Initialized to be the same initial block pof prices.

            priceHistory[0] = rawData;
            priceHistory[1] = rawData;
            priceHistory[2] = rawData; // Create a current status object for the market.  One entry for each ticker.

            curMarket = JSON.parse(rawData.exchangeData);
            _arr3 = Object.keys(curMarket);

            for (_i3 = 0; _i3 < _arr3.length; _i3++) {
              mktElem = _arr3[_i3];
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
              };
            }

            _context.next = 17;
            break;

          case 13:
            _context.prev = 13;
            _context.t0 = _context["catch"](0);
            console.log("Error initializing the system.");
            console.log(_context.t0);

          case 17:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[0, 13]]);
  }));
  return _initSystem.apply(this, arguments);
}

function runPriceTracker() {
  return _runPriceTracker.apply(this, arguments);
}

function _runPriceTracker() {
  _runPriceTracker = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2() {
    var rawData;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;
            console.log("Processing ".concat(curPriceIdx));
            _context2.next = 4;
            return (0, _getCryptoData.getExchangeMkt)("poloniex");

          case 4:
            rawData = _context2.sent;
            console.log("Exchange Data Timestamp: ".concat(rawData.timeStamp.toString().slice(0, 25))); // Store a total of 3 market prices in the price history.

            priceHistory[curPriceIdx] = rawData; // Compare the current prices with those loaded previously highlighting cases where there is a large
            // price movement.

            findPriceChanges(priceHistory, curPriceIdx);
            outputPriceChanges(mktStatus);
            curPriceIdx++;
            curPriceIdx = curPriceIdx % 3;
            _context2.next = 17;
            break;

          case 13:
            _context2.prev = 13;
            _context2.t0 = _context2["catch"](0);
            console.log("Error processing the market data.");
            console.log(_context2.t0);

          case 17:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this, [[0, 13]]);
  }));
  return _runPriceTracker.apply(this, arguments);
}

function outputPriceChanges(curMktStatus) {
  var _arr = Object.keys(curMktStatus);

  for (var _i = 0; _i < _arr.length; _i++) {
    var mktElem = _arr[_i];
    var curMktElem = curMktStatus[mktElem];

    if (curMktElem.gaining) {
      var msg = "".concat(mktElem, " ").concat(curMktElem.timeStamp.toUTCString(), " Gaining Price: ").concat(curMktElem.numGains, " ").concat(curMktElem.prevPrice, " ->> ").concat(curMktElem.curPrice, " ").concat(curMktElem.priceRisePercent.toFixed(6), "%");
      console.log(msg);
    }

    if (curMktElem.alert) {
      var _msg = "".concat(mktElem, " ").concat(curMktElem.timeStamp.toUTCString(), " Gaining Ask: ").concat(curMktElem.prevAsk, " ->> ").concat(curMktElem.curAsk, " ").concat(curMktElem.askRisePercent.toFixed(6), "%");

      console.log(_msg);
    }

    if (curMktElem.numGains > 1) {
      console.log("Alert: ".concat(curMktElem.timeStamp.toUTCString(), " ").concat(mktElem, " has ").concat(curMktElem.numGains, " price increases."));
    }
  }
}

function findPriceChanges(priceHistory, curPriceIdx) {
  var prevPriceIdx = curPriceIdx - 1;
  if (prevPriceIdx === -1) prevPriceIdx = 2; // We wrap around keeping only 3 price history data points

  var curMarket = JSON.parse(priceHistory[curPriceIdx].exchangeData);
  var prevMarket = JSON.parse(priceHistory[prevPriceIdx].exchangeData);

  var _arr2 = Object.keys(curMarket);

  for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
    var mktElem = _arr2[_i2];
    mktStatus[mktElem].timeStamp = priceHistory[curPriceIdx].timeStamp;
    mktStatus[mktElem].curPrice = +curMarket[mktElem].last;
    mktStatus[mktElem].prevPrice = +prevMarket[mktElem].last;
    mktStatus[mktElem].curAsk = +curMarket[mktElem].lowestAsk;
    mktStatus[mktElem].prevAsk = +prevMarket[mktElem].lowestAsk;
    var priceDiff = mktStatus[mktElem].curPrice - mktStatus[mktElem].prevPrice;
    var askDiff = mktStatus[mktElem].curAsk - mktStatus[mktElem].prevAsk;
    var percentPriceDiff = 100.0 * Math.abs(priceDiff) / curMarket[mktElem].last;
    var percentAskDiff = 100.0 * Math.abs(askDiff) / curMarket[mktElem].lowestAsk;
    mktStatus[mktElem].priceRisePercent = percentPriceDiff;
    mktStatus[mktElem].askRisePercent = percentAskDiff;
    var percentThreshold = 0.1;
    if (mktStatus[mktElem].curPrice < 0.00000100) percentThreshold = 1.0;

    if (priceDiff > 0.0 && percentPriceDiff > percentThreshold) {
      mktStatus[mktElem].numGains++;
      mktStatus[mktElem].gaining = true;

      if (askDiff > 0) {
        mktStatus[mktElem].alert = true;
      }
    } else {
      mktStatus[mktElem].numGains = 0;
      mktStatus[mktElem].gaining = false;
      mktStatus[mktElem].alert = false;
    }
  }
}

var newInteral = 1000 * (timeInSecondsBetweenPriceChecks + 5 * Math.random());
console.log("Setting the timer interval to ".concat(newInteral / 1000, " seconds."));
initSystem();
var intervalHandel = setInterval(runPriceTracker, newInteral);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9wcmljZU1vbi50cyJdLCJuYW1lcyI6WyJyZXF1aXJlIiwidGltZUluU2Vjb25kc0JldHdlZW5QcmljZUNoZWNrcyIsInByaWNlSGlzdG9yeSIsIm1rdFN0YXR1cyIsImN1clByaWNlSWR4IiwiaW5pdFN5c3RlbSIsInJhd0RhdGEiLCJjb25zb2xlIiwibG9nIiwidGltZVN0YW1wIiwidG9TdHJpbmciLCJzbGljZSIsImN1ck1hcmtldCIsIkpTT04iLCJwYXJzZSIsImV4Y2hhbmdlRGF0YSIsIk9iamVjdCIsImtleXMiLCJta3RFbGVtIiwiRGF0ZSIsIm5vdyIsImFsZXJ0IiwiZ2FpbmluZyIsImN1clByaWNlIiwicHJldlByaWNlIiwiY3VyQXNrIiwicHJldkFzayIsInByaWNlUmlzZVBlcmNlbnQiLCJhc2tSaXNlUGVyY2VudCIsIm51bUdhaW5zIiwicnVuUHJpY2VUcmFja2VyIiwiZmluZFByaWNlQ2hhbmdlcyIsIm91dHB1dFByaWNlQ2hhbmdlcyIsImN1ck1rdFN0YXR1cyIsImN1ck1rdEVsZW0iLCJtc2ciLCJ0b1VUQ1N0cmluZyIsInRvRml4ZWQiLCJwcmV2UHJpY2VJZHgiLCJwcmV2TWFya2V0IiwibGFzdCIsImxvd2VzdEFzayIsInByaWNlRGlmZiIsImFza0RpZmYiLCJwZXJjZW50UHJpY2VEaWZmIiwiTWF0aCIsImFicyIsInBlcmNlbnRBc2tEaWZmIiwicGVyY2VudFRocmVzaG9sZCIsIm5ld0ludGVyYWwiLCJyYW5kb20iLCJpbnRlcnZhbEhhbmRlbCIsInNldEludGVydmFsIl0sIm1hcHBpbmdzIjoiOztBQVNBOzs7Ozs7QUFUQTs7Ozs7QUFPQUEsT0FBTyxDQUFDLGlCQUFELENBQVA7O0FBSUEsSUFBTUMsK0JBQXVDLEdBQUcsRUFBaEQ7QUFDQSxJQUFJQyxZQUF3QixHQUFHLENBQUMsRUFBRCxFQUFLLEVBQUwsRUFBUyxFQUFULENBQS9CO0FBQ0EsSUFBSUMsU0FBYyxHQUFHLEVBQXJCO0FBRUEsSUFBSUMsV0FBVyxHQUFHLENBQWxCOztTQUVlQyxVOzs7Ozs7OzBCQUFmO0FBQUE7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsbUJBR3dCLG1DQUFlLFVBQWYsQ0FIeEI7O0FBQUE7QUFHUUMsWUFBQUEsT0FIUjtBQUlJQyxZQUFBQSxPQUFPLENBQUNDLEdBQVIsb0NBQXdDRixPQUFPLENBQUNHLFNBQVIsQ0FBa0JDLFFBQWxCLEdBQTZCQyxLQUE3QixDQUFtQyxDQUFuQyxFQUFxQyxFQUFyQyxDQUF4QyxHQUpKLENBS0k7QUFDQTs7QUFDQVQsWUFBQUEsWUFBWSxDQUFDLENBQUQsQ0FBWixHQUFrQkksT0FBbEI7QUFDQUosWUFBQUEsWUFBWSxDQUFDLENBQUQsQ0FBWixHQUFrQkksT0FBbEI7QUFDQUosWUFBQUEsWUFBWSxDQUFDLENBQUQsQ0FBWixHQUFrQkksT0FBbEIsQ0FUSixDQVVJOztBQUNNTSxZQUFBQSxTQVhWLEdBV3NCQyxJQUFJLENBQUNDLEtBQUwsQ0FBV1IsT0FBTyxDQUFDUyxZQUFuQixDQVh0QjtBQUFBLG9CQVkwQkMsTUFBTSxDQUFDQyxJQUFQLENBQVlMLFNBQVosQ0FaMUI7O0FBWUkscURBQThDO0FBQW5DTSxjQUFBQSxPQUFtQztBQUM1Q2YsY0FBQUEsU0FBUyxDQUFDZSxPQUFELENBQVQsR0FBcUI7QUFDbkJULGdCQUFBQSxTQUFTLEVBQUVVLElBQUksQ0FBQ0MsR0FBTCxFQURRO0FBRW5CQyxnQkFBQUEsS0FBSyxFQUFFLEtBRlk7QUFHbkJDLGdCQUFBQSxPQUFPLEVBQUUsS0FIVTtBQUluQkMsZ0JBQUFBLFFBQVEsRUFBRSxDQUpTO0FBS25CQyxnQkFBQUEsU0FBUyxFQUFFLENBTFE7QUFNbkJDLGdCQUFBQSxNQUFNLEVBQUUsQ0FOVztBQU9uQkMsZ0JBQUFBLE9BQU8sRUFBRSxDQVBVO0FBUW5CQyxnQkFBQUEsZ0JBQWdCLEVBQUUsQ0FSQztBQVNuQkMsZ0JBQUFBLGNBQWMsRUFBRSxDQVRHO0FBVW5CQyxnQkFBQUEsUUFBUSxFQUFFO0FBVlMsZUFBckI7QUFZRDs7QUF6Qkw7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUE0Qkl0QixZQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxnQ0FBWjtBQUNBRCxZQUFBQSxPQUFPLENBQUNDLEdBQVI7O0FBN0JKO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEc7Ozs7U0FpQ2VzQixlOzs7Ozs7OzBCQUFmO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBR0l2QixZQUFBQSxPQUFPLENBQUNDLEdBQVIsc0JBQTBCSixXQUExQjtBQUhKO0FBQUEsbUJBSXdCLG1DQUFlLFVBQWYsQ0FKeEI7O0FBQUE7QUFJUUUsWUFBQUEsT0FKUjtBQUtJQyxZQUFBQSxPQUFPLENBQUNDLEdBQVIsb0NBQXdDRixPQUFPLENBQUNHLFNBQVIsQ0FBa0JDLFFBQWxCLEdBQTZCQyxLQUE3QixDQUFtQyxDQUFuQyxFQUFxQyxFQUFyQyxDQUF4QyxHQUxKLENBTUk7O0FBQ0FULFlBQUFBLFlBQVksQ0FBQ0UsV0FBRCxDQUFaLEdBQTRCRSxPQUE1QixDQVBKLENBUUk7QUFDQTs7QUFDQXlCLFlBQUFBLGdCQUFnQixDQUFDN0IsWUFBRCxFQUFlRSxXQUFmLENBQWhCO0FBQ0E0QixZQUFBQSxrQkFBa0IsQ0FBQzdCLFNBQUQsQ0FBbEI7QUFDQUMsWUFBQUEsV0FBVztBQUNYQSxZQUFBQSxXQUFXLEdBQUdBLFdBQVcsR0FBQyxDQUExQjtBQWJKO0FBQUE7O0FBQUE7QUFBQTtBQUFBO0FBZ0JJRyxZQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxtQ0FBWjtBQUNBRCxZQUFBQSxPQUFPLENBQUNDLEdBQVI7O0FBakJKO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEc7Ozs7QUFxQkEsU0FBU3dCLGtCQUFULENBQTRCQyxZQUE1QixFQUErQztBQUFBLGFBRXZCakIsTUFBTSxDQUFDQyxJQUFQLENBQVlnQixZQUFaLENBRnVCOztBQUU3QywyQ0FBaUQ7QUFBNUMsUUFBTWYsT0FBTyxXQUFiO0FBQ0gsUUFBSWdCLFVBQVUsR0FBR0QsWUFBWSxDQUFDZixPQUFELENBQTdCOztBQUNBLFFBQUlnQixVQUFVLENBQUNaLE9BQWYsRUFBd0I7QUFDdEIsVUFBTWEsR0FBRyxhQUFNakIsT0FBTixjQUFpQmdCLFVBQVUsQ0FBQ3pCLFNBQVgsQ0FBcUIyQixXQUFyQixFQUFqQiw2QkFBc0VGLFVBQVUsQ0FBQ0wsUUFBakYsY0FBNkZLLFVBQVUsQ0FBQ1YsU0FBeEcsa0JBQXlIVSxVQUFVLENBQUNYLFFBQXBJLGNBQWdKVyxVQUFVLENBQUNQLGdCQUFYLENBQTRCVSxPQUE1QixDQUFvQyxDQUFwQyxDQUFoSixNQUFUO0FBQ0E5QixNQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWTJCLEdBQVo7QUFDRDs7QUFDRCxRQUFJRCxVQUFVLENBQUNiLEtBQWYsRUFBc0I7QUFDcEIsVUFBTWMsSUFBRyxhQUFNakIsT0FBTixjQUFpQmdCLFVBQVUsQ0FBQ3pCLFNBQVgsQ0FBcUIyQixXQUFyQixFQUFqQiwyQkFBb0VGLFVBQVUsQ0FBQ1IsT0FBL0Usa0JBQThGUSxVQUFVLENBQUNULE1BQXpHLGNBQW1IUyxVQUFVLENBQUNOLGNBQVgsQ0FBMEJTLE9BQTFCLENBQWtDLENBQWxDLENBQW5ILE1BQVQ7O0FBQ0E5QixNQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWTJCLElBQVo7QUFDRDs7QUFDRCxRQUFHRCxVQUFVLENBQUNMLFFBQVgsR0FBc0IsQ0FBekIsRUFBNEI7QUFDMUJ0QixNQUFBQSxPQUFPLENBQUNDLEdBQVIsa0JBQXNCMEIsVUFBVSxDQUFDekIsU0FBWCxDQUFxQjJCLFdBQXJCLEVBQXRCLGNBQTREbEIsT0FBNUQsa0JBQTJFZ0IsVUFBVSxDQUFDTCxRQUF0RjtBQUNEO0FBQ0Y7QUFDRjs7QUFHRCxTQUFTRSxnQkFBVCxDQUEwQjdCLFlBQTFCLEVBQW9ERSxXQUFwRCxFQUF5RTtBQUV2RSxNQUFJa0MsWUFBWSxHQUFHbEMsV0FBVyxHQUFDLENBQS9CO0FBQ0EsTUFBSWtDLFlBQVksS0FBRyxDQUFDLENBQXBCLEVBQ0VBLFlBQVksR0FBRyxDQUFmLENBSnFFLENBS3ZFOztBQUNBLE1BQUkxQixTQUFTLEdBQUdDLElBQUksQ0FBQ0MsS0FBTCxDQUFXWixZQUFZLENBQUNFLFdBQUQsQ0FBWixDQUEwQlcsWUFBckMsQ0FBaEI7QUFDQSxNQUFJd0IsVUFBVSxHQUFHMUIsSUFBSSxDQUFDQyxLQUFMLENBQVdaLFlBQVksQ0FBQ29DLFlBQUQsQ0FBWixDQUEyQnZCLFlBQXRDLENBQWpCOztBQVB1RSxjQVFqREMsTUFBTSxDQUFDQyxJQUFQLENBQVlMLFNBQVosQ0FSaUQ7O0FBUXZFLCtDQUE4QztBQUF6QyxRQUFNTSxPQUFPLGFBQWI7QUFDSGYsSUFBQUEsU0FBUyxDQUFDZSxPQUFELENBQVQsQ0FBbUJULFNBQW5CLEdBQStCUCxZQUFZLENBQUNFLFdBQUQsQ0FBWixDQUEwQkssU0FBekQ7QUFDQU4sSUFBQUEsU0FBUyxDQUFDZSxPQUFELENBQVQsQ0FBbUJLLFFBQW5CLEdBQThCLENBQUNYLFNBQVMsQ0FBQ00sT0FBRCxDQUFULENBQW1Cc0IsSUFBbEQ7QUFDQXJDLElBQUFBLFNBQVMsQ0FBQ2UsT0FBRCxDQUFULENBQW1CTSxTQUFuQixHQUErQixDQUFDZSxVQUFVLENBQUNyQixPQUFELENBQVYsQ0FBb0JzQixJQUFwRDtBQUNBckMsSUFBQUEsU0FBUyxDQUFDZSxPQUFELENBQVQsQ0FBbUJPLE1BQW5CLEdBQTRCLENBQUNiLFNBQVMsQ0FBQ00sT0FBRCxDQUFULENBQW1CdUIsU0FBaEQ7QUFDQXRDLElBQUFBLFNBQVMsQ0FBQ2UsT0FBRCxDQUFULENBQW1CUSxPQUFuQixHQUE2QixDQUFDYSxVQUFVLENBQUNyQixPQUFELENBQVYsQ0FBb0J1QixTQUFsRDtBQUNBLFFBQUlDLFNBQVMsR0FBR3ZDLFNBQVMsQ0FBQ2UsT0FBRCxDQUFULENBQW1CSyxRQUFuQixHQUE4QnBCLFNBQVMsQ0FBQ2UsT0FBRCxDQUFULENBQW1CTSxTQUFqRTtBQUNBLFFBQUltQixPQUFPLEdBQUd4QyxTQUFTLENBQUNlLE9BQUQsQ0FBVCxDQUFtQk8sTUFBbkIsR0FBNEJ0QixTQUFTLENBQUNlLE9BQUQsQ0FBVCxDQUFtQlEsT0FBN0Q7QUFDQSxRQUFJa0IsZ0JBQWdCLEdBQUcsUUFBTUMsSUFBSSxDQUFDQyxHQUFMLENBQVNKLFNBQVQsQ0FBTixHQUEwQjlCLFNBQVMsQ0FBQ00sT0FBRCxDQUFULENBQW1Cc0IsSUFBcEU7QUFDQSxRQUFJTyxjQUFjLEdBQUcsUUFBTUYsSUFBSSxDQUFDQyxHQUFMLENBQVNILE9BQVQsQ0FBTixHQUF3Qi9CLFNBQVMsQ0FBQ00sT0FBRCxDQUFULENBQW1CdUIsU0FBaEU7QUFDQXRDLElBQUFBLFNBQVMsQ0FBQ2UsT0FBRCxDQUFULENBQW1CUyxnQkFBbkIsR0FBc0NpQixnQkFBdEM7QUFDQXpDLElBQUFBLFNBQVMsQ0FBQ2UsT0FBRCxDQUFULENBQW1CVSxjQUFuQixHQUFvQ21CLGNBQXBDO0FBQ0EsUUFBSUMsZ0JBQWdCLEdBQUcsR0FBdkI7QUFDQSxRQUFJN0MsU0FBUyxDQUFDZSxPQUFELENBQVQsQ0FBbUJLLFFBQW5CLEdBQThCLFVBQWxDLEVBQ0V5QixnQkFBZ0IsR0FBRyxHQUFuQjs7QUFDRixRQUFHTixTQUFTLEdBQUcsR0FBWixJQUFtQkUsZ0JBQWdCLEdBQUdJLGdCQUF6QyxFQUEyRDtBQUN6RDdDLE1BQUFBLFNBQVMsQ0FBQ2UsT0FBRCxDQUFULENBQW1CVyxRQUFuQjtBQUNBMUIsTUFBQUEsU0FBUyxDQUFDZSxPQUFELENBQVQsQ0FBbUJJLE9BQW5CLEdBQTZCLElBQTdCOztBQUNBLFVBQUlxQixPQUFPLEdBQUcsQ0FBZCxFQUFpQjtBQUNmeEMsUUFBQUEsU0FBUyxDQUFDZSxPQUFELENBQVQsQ0FBbUJHLEtBQW5CLEdBQTJCLElBQTNCO0FBQ0Q7QUFDRixLQU5ELE1BT0s7QUFDSGxCLE1BQUFBLFNBQVMsQ0FBQ2UsT0FBRCxDQUFULENBQW1CVyxRQUFuQixHQUE0QixDQUE1QjtBQUNBMUIsTUFBQUEsU0FBUyxDQUFDZSxPQUFELENBQVQsQ0FBbUJJLE9BQW5CLEdBQTZCLEtBQTdCO0FBQ0FuQixNQUFBQSxTQUFTLENBQUNlLE9BQUQsQ0FBVCxDQUFtQkcsS0FBbkIsR0FBMkIsS0FBM0I7QUFDRDtBQUNGO0FBQ0Y7O0FBRUQsSUFBSTRCLFVBQVUsR0FBRyxRQUFNaEQsK0JBQStCLEdBQUcsSUFBRTRDLElBQUksQ0FBQ0ssTUFBTCxFQUExQyxDQUFqQjtBQUNBM0MsT0FBTyxDQUFDQyxHQUFSLHlDQUE2Q3lDLFVBQVUsR0FBQyxJQUF4RDtBQUNBNUMsVUFBVTtBQUNWLElBQUk4QyxjQUFjLEdBQUdDLFdBQVcsQ0FBQ3RCLGVBQUQsRUFBa0JtQixVQUFsQixDQUFoQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIHByaWNlTW9uLnRzXG4gKiBkZXNjOiBMb29rcyBmb3IgaW50ZXJlc3RpbmcgcHJpY2luZyBzaWduYWxzIHdpdGhpbiBhIHNpbmdsZSBleGNoYW5nZS4gIE91dHB1dHMgYWxlcnRzXG4gKiAgICAgICB0byB0aGUgc2FtZSBNb25nb0RCIGFuZCBpbiB0aGUgc2FtZSBmb3JtYXQgYXMgdGhlIGFyYml0cmFnZSBhbGVydHMuICBUaGlzIG1lYW5zIHRoZSBcbiAqICAgICAgIGFsZXJ0cyBnZW5lcmF0ZWQgaGVyZSB3aWxsIGJlIGRpc3BsYXllZCBhbG9uZyB3aXRoIHRoZSBhcmJpdHJhZ2UgYWxlcnRzLlxuICovXG5cblxucmVxdWlyZShcIkBiYWJlbC9wb2x5ZmlsbFwiKTtcblxuaW1wb3J0IHtnZXRFeGNoYW5nZU1rdCwgZ2V0RGF0YUZyb21VUkwsIGdldEV4Y2hhbmdlTWt0RGVwdGh9IGZyb20gXCIuL3V0aWxzL2dldENyeXB0b0RhdGFcIjtcblxuY29uc3QgdGltZUluU2Vjb25kc0JldHdlZW5QcmljZUNoZWNrczogbnVtYmVyID0gMTU7XG5sZXQgcHJpY2VIaXN0b3J5OiBBcnJheTxhbnk+ID0gW3t9LCB7fSwge31dO1xubGV0IG1rdFN0YXR1czogYW55ID0ge1xufTtcbmxldCBjdXJQcmljZUlkeCA9IDA7XG5cbmFzeW5jIGZ1bmN0aW9uIGluaXRTeXN0ZW0oKSB7XG5cbiAgdHJ5IHtcbiAgICBsZXQgcmF3RGF0YSA9IGF3YWl0IGdldEV4Y2hhbmdlTWt0KFwicG9sb25pZXhcIik7XG4gICAgY29uc29sZS5sb2coYEV4Y2hhbmdlIERhdGEgVGltZXN0YW1wOiAke3Jhd0RhdGEudGltZVN0YW1wLnRvU3RyaW5nKCkuc2xpY2UoMCwyNSl9YCk7XG4gICAgLy8gU2V0IHVwIHRoZSB0aHJlZSBwZXJpb2Qgcm9sbGluZyBwcmljZSBoaXN0b3J5LlxuICAgIC8vIEluaXRpYWxpemVkIHRvIGJlIHRoZSBzYW1lIGluaXRpYWwgYmxvY2sgcG9mIHByaWNlcy5cbiAgICBwcmljZUhpc3RvcnlbMF0gPSByYXdEYXRhO1xuICAgIHByaWNlSGlzdG9yeVsxXSA9IHJhd0RhdGE7XG4gICAgcHJpY2VIaXN0b3J5WzJdID0gcmF3RGF0YTsgICAgXG4gICAgLy8gQ3JlYXRlIGEgY3VycmVudCBzdGF0dXMgb2JqZWN0IGZvciB0aGUgbWFya2V0LiAgT25lIGVudHJ5IGZvciBlYWNoIHRpY2tlci5cbiAgICBjb25zdCBjdXJNYXJrZXQgPSBKU09OLnBhcnNlKHJhd0RhdGEuZXhjaGFuZ2VEYXRhKTtcbiAgICBmb3IgKGNvbnN0IG1rdEVsZW0gb2YgT2JqZWN0LmtleXMoY3VyTWFya2V0KSkge1xuICAgICAgbWt0U3RhdHVzW21rdEVsZW1dID0ge1xuICAgICAgICB0aW1lU3RhbXA6IERhdGUubm93KCksXG4gICAgICAgIGFsZXJ0OiBmYWxzZSxcbiAgICAgICAgZ2FpbmluZzogZmFsc2UsXG4gICAgICAgIGN1clByaWNlOiAwLFxuICAgICAgICBwcmV2UHJpY2U6IDAsXG4gICAgICAgIGN1ckFzazogMCxcbiAgICAgICAgcHJldkFzazogMCxcbiAgICAgICAgcHJpY2VSaXNlUGVyY2VudDogMCxcbiAgICAgICAgYXNrUmlzZVBlcmNlbnQ6IDAsXG4gICAgICAgIG51bUdhaW5zOiAwXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGNhdGNoKGVycikge1xuICAgIGNvbnNvbGUubG9nKFwiRXJyb3IgaW5pdGlhbGl6aW5nIHRoZSBzeXN0ZW0uXCIpO1xuICAgIGNvbnNvbGUubG9nKGVycik7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gcnVuUHJpY2VUcmFja2VyKCkge1xuXG4gIHRyeSB7XG4gICAgY29uc29sZS5sb2coYFByb2Nlc3NpbmcgJHtjdXJQcmljZUlkeH1gKTtcbiAgICBsZXQgcmF3RGF0YSA9IGF3YWl0IGdldEV4Y2hhbmdlTWt0KFwicG9sb25pZXhcIik7XG4gICAgY29uc29sZS5sb2coYEV4Y2hhbmdlIERhdGEgVGltZXN0YW1wOiAke3Jhd0RhdGEudGltZVN0YW1wLnRvU3RyaW5nKCkuc2xpY2UoMCwyNSl9YCk7XG4gICAgLy8gU3RvcmUgYSB0b3RhbCBvZiAzIG1hcmtldCBwcmljZXMgaW4gdGhlIHByaWNlIGhpc3RvcnkuXG4gICAgcHJpY2VIaXN0b3J5W2N1clByaWNlSWR4XSA9IHJhd0RhdGE7XG4gICAgLy8gQ29tcGFyZSB0aGUgY3VycmVudCBwcmljZXMgd2l0aCB0aG9zZSBsb2FkZWQgcHJldmlvdXNseSBoaWdobGlnaHRpbmcgY2FzZXMgd2hlcmUgdGhlcmUgaXMgYSBsYXJnZVxuICAgIC8vIHByaWNlIG1vdmVtZW50LlxuICAgIGZpbmRQcmljZUNoYW5nZXMocHJpY2VIaXN0b3J5LCBjdXJQcmljZUlkeCk7XG4gICAgb3V0cHV0UHJpY2VDaGFuZ2VzKG1rdFN0YXR1cyk7XG4gICAgY3VyUHJpY2VJZHgrKztcbiAgICBjdXJQcmljZUlkeCA9IGN1clByaWNlSWR4JTM7XG4gIH1cbiAgY2F0Y2goZXJyKSB7XG4gICAgY29uc29sZS5sb2coXCJFcnJvciBwcm9jZXNzaW5nIHRoZSBtYXJrZXQgZGF0YS5cIik7XG4gICAgY29uc29sZS5sb2coZXJyKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBvdXRwdXRQcmljZUNoYW5nZXMoY3VyTWt0U3RhdHVzOiBhbnkpIHtcblxuICBmb3IgKGNvbnN0IG1rdEVsZW0gb2YgT2JqZWN0LmtleXMoY3VyTWt0U3RhdHVzKSkge1xuICAgIGxldCBjdXJNa3RFbGVtID0gY3VyTWt0U3RhdHVzW21rdEVsZW1dO1xuICAgIGlmIChjdXJNa3RFbGVtLmdhaW5pbmcpIHtcbiAgICAgIGNvbnN0IG1zZyA9IGAke21rdEVsZW19ICR7Y3VyTWt0RWxlbS50aW1lU3RhbXAudG9VVENTdHJpbmcoKX0gR2FpbmluZyBQcmljZTogJHtjdXJNa3RFbGVtLm51bUdhaW5zfSAke2N1ck1rdEVsZW0ucHJldlByaWNlfSAtPj4gJHtjdXJNa3RFbGVtLmN1clByaWNlfSAke2N1ck1rdEVsZW0ucHJpY2VSaXNlUGVyY2VudC50b0ZpeGVkKDYpfSVgO1xuICAgICAgY29uc29sZS5sb2cobXNnKTtcbiAgICB9XG4gICAgaWYgKGN1ck1rdEVsZW0uYWxlcnQpIHtcbiAgICAgIGNvbnN0IG1zZyA9IGAke21rdEVsZW19ICR7Y3VyTWt0RWxlbS50aW1lU3RhbXAudG9VVENTdHJpbmcoKX0gR2FpbmluZyBBc2s6ICR7Y3VyTWt0RWxlbS5wcmV2QXNrfSAtPj4gJHtjdXJNa3RFbGVtLmN1ckFza30gJHtjdXJNa3RFbGVtLmFza1Jpc2VQZXJjZW50LnRvRml4ZWQoNil9JWA7ICAgICBcbiAgICAgIGNvbnNvbGUubG9nKG1zZyk7XG4gICAgfVxuICAgIGlmKGN1ck1rdEVsZW0ubnVtR2FpbnMgPiAxKSB7XG4gICAgICBjb25zb2xlLmxvZyhgQWxlcnQ6ICR7Y3VyTWt0RWxlbS50aW1lU3RhbXAudG9VVENTdHJpbmcoKX0gJHtta3RFbGVtfSBoYXMgJHtjdXJNa3RFbGVtLm51bUdhaW5zfSBwcmljZSBpbmNyZWFzZXMuYCk7XG4gICAgfVxuICB9XG59XG5cblxuZnVuY3Rpb24gZmluZFByaWNlQ2hhbmdlcyhwcmljZUhpc3Rvcnk6IEFycmF5PGFueT4sIGN1clByaWNlSWR4OiBudW1iZXIpIHtcblxuICBsZXQgcHJldlByaWNlSWR4ID0gY3VyUHJpY2VJZHgtMTtcbiAgaWYgKHByZXZQcmljZUlkeD09PS0xKVxuICAgIHByZXZQcmljZUlkeCA9IDI7XG4gIC8vIFdlIHdyYXAgYXJvdW5kIGtlZXBpbmcgb25seSAzIHByaWNlIGhpc3RvcnkgZGF0YSBwb2ludHNcbiAgbGV0IGN1ck1hcmtldCA9IEpTT04ucGFyc2UocHJpY2VIaXN0b3J5W2N1clByaWNlSWR4XS5leGNoYW5nZURhdGEpOyAgXG4gIGxldCBwcmV2TWFya2V0ID0gSlNPTi5wYXJzZShwcmljZUhpc3RvcnlbcHJldlByaWNlSWR4XS5leGNoYW5nZURhdGEpO1xuICBmb3IgKGNvbnN0IG1rdEVsZW0gb2YgT2JqZWN0LmtleXMoY3VyTWFya2V0KSkge1xuICAgIG1rdFN0YXR1c1tta3RFbGVtXS50aW1lU3RhbXAgPSBwcmljZUhpc3RvcnlbY3VyUHJpY2VJZHhdLnRpbWVTdGFtcDsgXG4gICAgbWt0U3RhdHVzW21rdEVsZW1dLmN1clByaWNlID0gK2N1ck1hcmtldFtta3RFbGVtXS5sYXN0O1xuICAgIG1rdFN0YXR1c1tta3RFbGVtXS5wcmV2UHJpY2UgPSArcHJldk1hcmtldFtta3RFbGVtXS5sYXN0O1xuICAgIG1rdFN0YXR1c1tta3RFbGVtXS5jdXJBc2sgPSArY3VyTWFya2V0W21rdEVsZW1dLmxvd2VzdEFzaztcbiAgICBta3RTdGF0dXNbbWt0RWxlbV0ucHJldkFzayA9ICtwcmV2TWFya2V0W21rdEVsZW1dLmxvd2VzdEFzaztcbiAgICBsZXQgcHJpY2VEaWZmID0gbWt0U3RhdHVzW21rdEVsZW1dLmN1clByaWNlIC0gbWt0U3RhdHVzW21rdEVsZW1dLnByZXZQcmljZTtcbiAgICBsZXQgYXNrRGlmZiA9IG1rdFN0YXR1c1tta3RFbGVtXS5jdXJBc2sgLSBta3RTdGF0dXNbbWt0RWxlbV0ucHJldkFzaztcbiAgICBsZXQgcGVyY2VudFByaWNlRGlmZiA9IDEwMC4wKk1hdGguYWJzKHByaWNlRGlmZikvY3VyTWFya2V0W21rdEVsZW1dLmxhc3Q7XG4gICAgbGV0IHBlcmNlbnRBc2tEaWZmID0gMTAwLjAqTWF0aC5hYnMoYXNrRGlmZikvY3VyTWFya2V0W21rdEVsZW1dLmxvd2VzdEFzaztcbiAgICBta3RTdGF0dXNbbWt0RWxlbV0ucHJpY2VSaXNlUGVyY2VudCA9IHBlcmNlbnRQcmljZURpZmY7XG4gICAgbWt0U3RhdHVzW21rdEVsZW1dLmFza1Jpc2VQZXJjZW50ID0gcGVyY2VudEFza0RpZmY7IFxuICAgIGxldCBwZXJjZW50VGhyZXNob2xkID0gMC4xO1xuICAgIGlmIChta3RTdGF0dXNbbWt0RWxlbV0uY3VyUHJpY2UgPCAwLjAwMDAwMTAwKVxuICAgICAgcGVyY2VudFRocmVzaG9sZCA9IDEuMDtcbiAgICBpZihwcmljZURpZmYgPiAwLjAgJiYgcGVyY2VudFByaWNlRGlmZiA+IHBlcmNlbnRUaHJlc2hvbGQpIHtcbiAgICAgIG1rdFN0YXR1c1tta3RFbGVtXS5udW1HYWlucysrO1xuICAgICAgbWt0U3RhdHVzW21rdEVsZW1dLmdhaW5pbmcgPSB0cnVlO1xuICAgICAgaWYgKGFza0RpZmYgPiAwKSB7XG4gICAgICAgIG1rdFN0YXR1c1tta3RFbGVtXS5hbGVydCA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbWt0U3RhdHVzW21rdEVsZW1dLm51bUdhaW5zPTA7XG4gICAgICBta3RTdGF0dXNbbWt0RWxlbV0uZ2FpbmluZyA9IGZhbHNlO1xuICAgICAgbWt0U3RhdHVzW21rdEVsZW1dLmFsZXJ0ID0gZmFsc2U7XG4gICAgfVxuICB9XG59XG5cbmxldCBuZXdJbnRlcmFsID0gMTAwMCoodGltZUluU2Vjb25kc0JldHdlZW5QcmljZUNoZWNrcyArIDUqTWF0aC5yYW5kb20oKSk7XG5jb25zb2xlLmxvZyhgU2V0dGluZyB0aGUgdGltZXIgaW50ZXJ2YWwgdG8gJHtuZXdJbnRlcmFsLzEwMDB9IHNlY29uZHMuYCApO1xuaW5pdFN5c3RlbSgpO1xubGV0IGludGVydmFsSGFuZGVsID0gc2V0SW50ZXJ2YWwocnVuUHJpY2VUcmFja2VyLCBuZXdJbnRlcmFsKTtcblxuIl19