import "@babel/polyfill";
import {assert, expect} from "chai";
import {getBigQueryData} from "../src/loaders/googleLoader";

describe("Google BigQuery Data Loader", function(){
  it("should return some data", async function() {
    var result = await getBigQueryData();
    assert.isAtLeast(result.data.length, 1);
  });
});
