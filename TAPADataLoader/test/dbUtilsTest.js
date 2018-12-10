import "@babel/polyfill";
import {assert, expect} from "chai";
import {getMostRecentETHData} from "../src/utils/dbUtils";

describe("MongoDB see if recent data can be queried", function(){
  it("Should return specific data from a valid query", async function() {
    var url = process.env.URLEth;
    const result = await getMostRecentETHData();
    console.log("result:", result);
    expect(result[0]).to.have.property("_id");
  });
});
