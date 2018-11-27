import "@babel/polyfill";
import {assert, expect} from "chai";
import {loadCoinmetricsFile} from "../src/loaders/coinmetricsLoader";
// npm i chai-as-promised --save-dev
require('chai')
  .use(require('chai-as-promised'))
  .should();

describe("Get data from coinmetrics", function() {
  it("should return some data", async function() {
    // Data file where the coinmetrics data can be found.
    const dataDir = "./data/";
    const fileToProcess = dataDir + "all.zip";
    // Crypocurrencies to process from the coinmetrics dataset.
    const ticker = "eth";
    // Fields to load from the coinmetrics data set.
    const fieldToSelect = [
      "date",
      "txVolume(USD)",
      "adjustedTxVolume(USD)",
      "txCount",
      "price(USD)"
    ];
    const coinmetricsData = await loadCoinmetricsFile(fileToProcess, ticker, fieldToSelect);
    assert.isAbove(coinmetricsData.data.length, 0);
  });
  it("should fail because of a bad ticker", async function() {
    // Data file where the coinmetrics data can be found.
    const dataDir = "./data/";
    const fileToProcess = dataDir + "all.zip";
    // Crypocurrencies to process from the coinmetrics dataset.
    const badTicker = "eht";
    // Fields to load from the coinmetrics data set.
    const fieldToSelect = [
      "date",
      "txVolume(USD)",
      "adjustedTxVolume(USD)",
      "txCount",
      "price(USD)"
    ];
    await loadCoinmetricsFile(fileToProcess, badTicker, fieldToSelect).should.be.rejectedWith("Data not found for:" + badTicker);
  });
});
