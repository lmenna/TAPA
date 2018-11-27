import "@babel/polyfill";
import {assert, expect} from "chai";
import {loadPricingData} from "../src/loaders/etherscanLoader";

describe("Get data from enterscan.io", function(){
  it("should return some data", async function() {
    assert.isAbove((await loadPricingData()).length, 0);
  });
});
