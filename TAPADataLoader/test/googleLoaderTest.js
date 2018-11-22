import "@babel/polyfill";
import {assert, expect} from "chai";
import {getQuery, getBigQueryData} from "../src/loaders/googleLoader";

describe("Google BigQuery Data Loader", function(){
  var query = getQuery();
  it("should have a query defined", function() {
    assert.isDefined(query);
  });
  it("should return some data", async function() {
    var result = await getBigQueryData(query);
    assert.equal(8, result.data.length);
  });
});
